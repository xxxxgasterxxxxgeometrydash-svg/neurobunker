// ============================================================
// ZUSTAND STORE — единственный источник правды для всей игры
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Player, SaveState, ErrorEntry,
  VotingSession, VoteRecord, BunkerCard, ThreatCard,
  ApiConfig, MusicState, CardKey,
} from '../types/game';
import {
  DISASTERS, SUPERPOWERS, PHOBIAS, CHARACTERS, HOBBIES,
  BAGGAGE, FACTS, SPECIAL_CONDITIONS, BUNKER_CARDS_DATA,
  THREAT_CARDS_DATA, DEFAULT_PLAYERS, CARD_REVEAL_ORDER,
  getRoundConfig, getSurvivorsTarget, randomFrom, shuffleArray,
} from '../lib/gameData';
import { generateSpeech, calcCost } from '../lib/aiClient';
import { speak, stopSpeaking } from '../lib/tts';
import { broadcast } from '../lib/broadcast';

// ─── НАЧАЛЬНЫЙ КОНФИГ API ───────────────────────────────────
const DEFAULT_API_CONFIG: ApiConfig = {
  gemini:      { key: '', model: 'gemini-2.0-flash' },
  deepseek:    { key: '', model: 'deepseek-chat' },
  groq:        { key: '', model: 'llama-3.1-8b-instant' },
  gigachat:    { key: '', model: 'GigaChat' },
  mistral:     { key: '', model: 'mistral-small-latest' },
  openrouter:  { key: '', model: 'meta-llama/llama-3.1-8b-instruct:free' },
  yandex:      { key: '', folderId: '', iamToken: '' },
  gemma:       { key: '', model: 'gemma-3-27b-it' },
};

// ─── ИНТЕРФЕЙС СТОРА ────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  voiceId?: string; // Добавить это!
  // ... остальные поля
}

export interface GameStore extends SaveState {
  isSpeaking: boolean;
  isGenerating: boolean;
  activeTab: 'game' | 'players' | 'stats' | 'logs' | 'saves' | 'settings';
  apiConfig: ApiConfig;
  availableVoices: Array<{ id: string; name: string; lang: string }>;

  initGame: (playerCount: number, disasterId: string, playerOverrides?: Partial<Player>[]) => void;
  setApiConfig: (cfg: Partial<ApiConfig>) => void;
  setApiMode: (mode: 'demo' | 'real') => void;
  setActiveTab: (tab: GameStore['activeTab']) => void;
  setAvailableVoices: (v: Array<{ id: string; name: string; lang: string }>) => void;
  setPlayerVoice: (playerId: string, voiceId: string) => void;

  nextTurn: () => Promise<void>;
  skipCurrentPlayer: () => void;
  startVoting: () => void;
  castVote: (voterId: string, targetId: string, reason: string) => void;
  resolveVoting: () => void;
  startDefense: () => Promise<void>;
  eliminatePlayer: (playerId: string) => void;
  startFinal: () => void;
  startSurvival: () => void;
  resolveGame: () => void;

  setMusicState: (m: MusicState) => void;

  saveGame: () => void;
  loadGame: (state: SaveState) => void;
  exportSave: () => void;
  importSave: (json: string) => void;
  resetGame: () => void;

  addError: (err: Omit<ErrorEntry, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;

  // internal helpers
  _revealBunkerCard: () => void;
  _advanceRound: () => void;
}

// ─── ХЕЛПЕР: создать нового игрока ──────────────────────────
function createPlayer(idx: number, override?: Partial<Player>): Player {
  const def = DEFAULT_PLAYERS[idx] ?? DEFAULT_PLAYERS[0];
  return {
    id: `player_${idx}_${Date.now()}`,
    name: override?.name ?? def.name,
    aiModel: override?.aiModel ?? def.aiModel,
    color: override?.color ?? def.color,
    voiceId: override?.voiceId ?? '',
    state: 'alive',
    cards: {
      superpower:       randomFrom(SUPERPOWERS),
      phobia:           randomFrom(PHOBIAS),
      character:        randomFrom(CHARACTERS),
      hobby:            randomFrom(HOBBIES),
      baggage:          randomFrom(BAGGAGE),
      fact:             randomFrom(FACTS),
      specialCondition: randomFrom(SPECIAL_CONDITIONS),
    },
    revealedCards: [],
    revealHistory: [],
    messages: [],
    tokenStats: {
      promptTokens: 0, completionTokens: 0, totalTokens: 0,
      estimatedCostRub: 0, model: def.aiModel,
    },
    kolobokIndex: def.kolobokIndex,
    isCurrentSpeaker: false,
    voteCount: 0,
    specialConditionPlayed: false,
    overlayX: def.overlayX,
    overlayY: def.overlayY,
    ...override,
  };
}

// ─── НАЧАЛЬНОЕ СОСТОЯНИЕ ────────────────────────────────────
const INITIAL_STATE: SaveState = {
  version: '1.0.0',
  savedAt: 0,
  gameId: '',
  phase: 'setup',
  round: 0,
  subRound: 0,
  disaster: null,
  players: [],
  bunkerCards: [],
  threatCards: [],
  votingSessions: [],
  currentVoting: null,
  musicState: 'silence',
  gameMode: 'survival',
  apiMode: 'demo',
  errors: [],
  roundConfig: [],
  totalRounds: 5,
  survivorsTarget: 4,
  currentSpeakerId: null,
  eliminatedPlayerIds: [],
  bunkerSurvivors: [],
  outsideSurvivors: [],
};

// ─── СОЗДАНИЕ СТОРА ─────────────────────────────────────────
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      const store: GameStore = {
        ...INITIAL_STATE,
        isSpeaking: false,
        isGenerating: false,
        activeTab: 'game',
        apiConfig: DEFAULT_API_CONFIG,
        availableVoices: [],

        setActiveTab: (tab) => set({ activeTab: tab }),
        setAvailableVoices: (v) => set({ availableVoices: v }),
        setApiMode: (mode) => set({ apiMode: mode }),
        setApiConfig: (cfg) => set(s => ({ apiConfig: { ...s.apiConfig, ...cfg } })),
        setPlayerVoice: (playerId, voiceId) =>
          set(s => ({
            players: s.players.map(p => p.id === playerId ? { ...p, voiceId } : p),
          })),

        initGame: (playerCount, disasterId, playerOverrides) => {
          const disaster = disasterId === 'random'
            ? randomFrom(DISASTERS)
            : (DISASTERS.find(d => d.id === disasterId) ?? randomFrom(DISASTERS));

          const players = Array.from({ length: playerCount }, (_, i) =>
            createPlayer(i, playerOverrides?.[i])
          );

          const bunkerCards: BunkerCard[] = shuffleArray(BUNKER_CARDS_DATA)
            .slice(0, 5)
            .map((text, i) => ({ id: `b${i}`, text, revealed: false }));

          const threatCards: ThreatCard[] = shuffleArray(THREAT_CARDS_DATA)
            .slice(0, 5)
            .map((text, i) => ({ id: `t${i}`, text, revealed: false }));

          const roundConfig = getRoundConfig(playerCount);
          const survivorsTarget = getSurvivorsTarget(playerCount);

          const newState: Partial<SaveState> = {
            ...INITIAL_STATE,
            gameId: `game_${Date.now()}`,
            phase: 'playing',
            round: 1,
            subRound: 0,
            disaster,
            players,
            bunkerCards,
            threatCards,
            roundConfig,
            survivorsTarget,
            currentSpeakerId: players[0]?.id ?? null,
            musicState: 'disaster',
          };

          set(newState as Partial<GameStore>);
          broadcast({ type: 'STATE_UPDATE', payload: newState as SaveState });
          broadcast({ type: 'MUSIC_CHANGE', payload: 'disaster' });
	  set({ musicState: 'discussion' });
          broadcast({ type: 'MUSIC_CHANGE', payload: 'discussion' });
        },

        nextTurn: async () => {
          const state = get();
          if (state.isGenerating) return;
          if (state.phase !== 'playing' && state.phase !== 'defense') return;

          const alivePlayers = state.players.filter(p =>
            p.state === 'alive' || p.state === 'scared' || p.state === 'accused'
          );
          if (alivePlayers.length === 0) return;

          const currentIdx = state.subRound % alivePlayers.length;
          const currentPlayer = alivePlayers[currentIdx];
          if (!currentPlayer) return;

          const cardToReveal: CardKey | undefined = CARD_REVEAL_ORDER[state.round - 1];
          let updatedPlayer = { ...currentPlayer };

          if (cardToReveal && !currentPlayer.revealedCards.includes(cardToReveal)) {
            updatedPlayer = {
              ...currentPlayer,
              revealedCards: [...currentPlayer.revealedCards, cardToReveal],
              revealHistory: [...currentPlayer.revealHistory, {
                round: state.round,
                card: cardToReveal,
                timestamp: Date.now(),
              }],
            };
          }

          set({
            isGenerating: true,
            isSpeaking: false,
            currentSpeakerId: currentPlayer.id,
            players: state.players.map(p => ({
              ...p,
              isCurrentSpeaker: p.id === currentPlayer.id,
            })),
          });

          broadcast({ type: 'SPEAKING_START', payload: { playerId: currentPlayer.id, text: '...' } });

          const history = state.players
            .flatMap(p => p.messages)
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-8)
            .map(m => ({
              name: state.players.find(p => p.id === m.playerId)?.name ?? '?',
              text: m.text,
            }));

          const response = await generateSpeech({
            player: updatedPlayer,
            allPlayers: state.players,
            disaster: state.disaster!,
            phase: state.phase,
            round: state.round,
            history,
            apiConfig: get().apiConfig,
            apiMode: state.apiMode,
          });

          const cost = calcCost(response.model, response.promptTokens, response.completionTokens);
          const newMessage = {
            id: `msg_${Date.now()}`,
            playerId: currentPlayer.id,
            text: response.text,
            timestamp: Date.now(),
            round: state.round,
            phase: state.phase,
            tokenCount: response.promptTokens + response.completionTokens,
          };

          const finalPlayer: Player = {
            ...updatedPlayer,
            messages: [...updatedPlayer.messages, newMessage],
            tokenStats: {
              promptTokens: updatedPlayer.tokenStats.promptTokens + response.promptTokens,
              completionTokens: updatedPlayer.tokenStats.completionTokens + response.completionTokens,
              totalTokens: updatedPlayer.tokenStats.totalTokens + response.promptTokens + response.completionTokens,
              estimatedCostRub: updatedPlayer.tokenStats.estimatedCostRub + cost,
              model: response.model,
            },
          };

          if (response.error) {
            get().addError({ type: 'api', message: response.error, playerId: currentPlayer.id });
          }

          const nextSubRound = get().subRound + 1;
          const totalAlive = get().players.filter(
            p => p.state === 'alive' || p.state === 'scared' || p.state === 'accused'
          ).length;
          const roundComplete = nextSubRound >= totalAlive;

          set(prev => ({
            isGenerating: false,
            isSpeaking: true,
            subRound: nextSubRound,
            players: prev.players.map(p => p.id === finalPlayer.id ? finalPlayer : p),
          }));

          broadcast({ type: 'SPEAKING_START', payload: { playerId: currentPlayer.id, text: response.text } });

          speak(response.text, updatedPlayer.voiceId, () => {
            set({ isSpeaking: false });
            broadcast({ type: 'SPEAKING_END', payload: { playerId: currentPlayer.id } });

            if (roundComplete) {
              const roundCfg = get().roundConfig.find(r => r.round === get().round);
              if (roundCfg && roundCfg.votingCount > 0) {
                get()._revealBunkerCard();
                setTimeout(() => {
                  set({ phase: 'voting', musicState: 'elimination' });
                  broadcast({ type: 'MUSIC_CHANGE', payload: 'elimination' });
                }, 2000);
              } else {
                get()._advanceRound();
              }
            }
          });

          broadcast({ type: 'STATE_UPDATE', payload: get() as unknown as SaveState });
        },

        skipCurrentPlayer: () => {
          set(s => ({ subRound: s.subRound + 1 }));
        },

        _revealBunkerCard: () => {
          const s = get();
          const unrevealed = s.bunkerCards.filter(c => !c.revealed);
          if (unrevealed.length === 0) return;
          set(prev => ({
            bunkerCards: prev.bunkerCards.map(c =>
              c.id === unrevealed[0].id ? { ...c, revealed: true } : c
            ),
          }));
          const unrevealedT = s.threatCards.filter(c => !c.revealed);
          if (unrevealedT.length > 0) {
            set(prev => ({
              threatCards: prev.threatCards.map(c =>
                c.id === unrevealedT[0].id ? { ...c, revealed: true } : c
              ),
            }));
          }
        },

        _advanceRound: () => {
          const s = get();
          const nextRound = s.round + 1;
          if (nextRound > s.totalRounds) {
            get().startFinal();
            return;
          }
          set({ round: nextRound, subRound: 0, phase: 'playing', musicState: 'discussion' });
          broadcast({ type: 'MUSIC_CHANGE', payload: 'discussion' });
          get()._revealBunkerCard();
          broadcast({ type: 'STATE_UPDATE', payload: get() as unknown as SaveState });
        },

        startVoting: () => {
          set(prev => ({
            phase: 'voting',
            musicState: 'elimination',
            currentVoting: {
              id: `vote_${Date.now()}`,
              round: prev.round,
              candidates: [],
              votes: [],
              eliminatedId: null,
              tieBreaker: false,
            },
            players: prev.players.map(p => ({
              ...p,
              voteCount: 0,
              isCurrentSpeaker: false,
              state: (p.state === 'accused' ? 'alive' : p.state) as Player['state'],
            })),
          }));
          broadcast({ type: 'MUSIC_CHANGE', payload: 'elimination' });
        },

        castVote: (voterId, targetId, reason) => {
          const s = get();
          if (!s.currentVoting) return;

          const vote: VoteRecord = { voterId, targetId, reason };
          const updatedVotes = [
            ...s.currentVoting.votes.filter(v => v.voterId !== voterId),
            vote,
          ];

          const voteCounts: Record<string, number> = {};
          updatedVotes.forEach(v => {
            voteCounts[v.targetId] = (voteCounts[v.targetId] ?? 0) + 1;
          });

          set(prev => ({
            currentVoting: { ...prev.currentVoting!, votes: updatedVotes },
            players: prev.players.map(p => ({
              ...p,
              voteCount: voteCounts[p.id] ?? 0,
              state: ((voteCounts[p.id] ?? 0) > 0 && p.state !== 'eliminated'
                ? 'accused'
                : p.state) as Player['state'],
            })),
          }));
        },

        resolveVoting: () => {
          const s = get();
          if (!s.currentVoting) return;

          const voteCounts: Record<string, number> = {};
          s.currentVoting.votes.forEach(v => {
            voteCounts[v.targetId] = (voteCounts[v.targetId] ?? 0) + 1;
          });

          const maxVotes = Math.max(...Object.values(voteCounts), 0);
          if (maxVotes === 0) return;

          const topCandidates = Object.entries(voteCounts)
            .filter(([, c]) => c === maxVotes)
            .map(([id]) => id);

          const eliminatedId = topCandidates.length === 1
            ? topCandidates[0]
            : randomFrom(topCandidates);

          const finalVoting: VotingSession = {
            ...s.currentVoting,
            eliminatedId,
            tieBreaker: topCandidates.length > 1,
          };

          set({ currentVoting: finalVoting });
          get().startDefense().catch(console.error);
        },

        startDefense: async () => {
          const s = get();
          const eliminatedId = s.currentVoting?.eliminatedId;
          if (!eliminatedId) return;

          const player = s.players.find(p => p.id === eliminatedId);
          if (!player) return;

          set({
            phase: 'defense',
            currentSpeakerId: eliminatedId,
            isGenerating: true,
            players: s.players.map(p => ({
              ...p,
              state: (p.id === eliminatedId ? 'scared' : p.state) as Player['state'],
            })),
          });

          const history = s.players
            .flatMap(p => p.messages)
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-6)
            .map(m => ({
              name: s.players.find(p => p.id === m.playerId)?.name ?? '?',
              text: m.text,
            }));

          const response = await generateSpeech({
            player,
            allPlayers: s.players,
            disaster: s.disaster!,
            phase: 'defense',
            round: s.round,
            history,
            apiConfig: get().apiConfig,
            apiMode: s.apiMode,
          });

          const cost = calcCost(response.model, response.promptTokens, response.completionTokens);
          const defenseMessage = {
            id: `msg_def_${Date.now()}`,
            playerId: player.id,
            text: response.text,
            timestamp: Date.now(),
            round: s.round,
            phase: 'defense' as const,
            tokenCount: response.promptTokens + response.completionTokens,
          };

          set(prev => ({
            isGenerating: false,
            isSpeaking: true,
            players: prev.players.map(p => p.id === player.id ? {
              ...p,
              messages: [...p.messages, defenseMessage],
              tokenStats: {
                ...p.tokenStats,
                promptTokens: p.tokenStats.promptTokens + response.promptTokens,
                completionTokens: p.tokenStats.completionTokens + response.completionTokens,
                totalTokens: p.tokenStats.totalTokens + response.promptTokens + response.completionTokens,
                estimatedCostRub: p.tokenStats.estimatedCostRub + cost,
              },
            } : p),
          }));

          broadcast({ type: 'SPEAKING_START', payload: { playerId: player.id, text: response.text } });

          speak(response.text, player.voiceId, () => {
            set({ isSpeaking: false });
            broadcast({ type: 'SPEAKING_END', payload: { playerId: player.id } });
            setTimeout(() => get().eliminatePlayer(eliminatedId), 1500);
          });
        },

        eliminatePlayer: (playerId) => {
          const s = get();
          const votingRound = s.currentVoting?.round ?? s.round;

          set(prev => ({
            players: prev.players.map(p =>
              p.id === playerId
                ? { ...p, state: 'eliminated' as Player['state'], isCurrentSpeaker: false }
                : p
            ),
            eliminatedPlayerIds: [...prev.eliminatedPlayerIds, playerId],
            currentVoting: null,
          }));

          broadcast({ type: 'PLAYER_ELIMINATED', payload: { playerId } });

          setTimeout(() => {
            const s2 = get();
            const roundCfg = s2.roundConfig.find(r => r.round === votingRound);
            const votingsInRound = s2.votingSessions.filter(v => v.round === votingRound).length;
            const alive = s2.players.filter(p => p.state !== 'eliminated');

            if (alive.length <= s2.survivorsTarget) {
              get().startFinal();
            } else if (roundCfg && votingsInRound < roundCfg.votingCount) {
              get().startVoting();
            } else {
              get()._advanceRound();
            }
          }, 2000);
        },

        startFinal: () => {
          const s = get();
          const survivors = s.players.filter(p => p.state !== 'eliminated').map(p => p.id);

          set(prev => ({
            phase: 'final',
            musicState: 'victory',
            bunkerSurvivors: survivors,
            players: prev.players.map(p => {
              if (p.state === 'eliminated') return p;
              const allCards: CardKey[] = ['superpower', 'phobia', 'character', 'hobby', 'baggage', 'fact'];
              return { ...p, revealedCards: allCards, state: 'winner' as Player['state'] };
            }),
          }));

          broadcast({ type: 'MUSIC_CHANGE', payload: 'victory' });
          broadcast({ type: 'STATE_UPDATE', payload: get() as unknown as SaveState });
        },

        startSurvival: () => set({ phase: 'survival' }),
        resolveGame: () => {
          set({ phase: 'ended' });
          broadcast({ type: 'STATE_UPDATE', payload: get() as unknown as SaveState });
        },

        setMusicState: (m) => {
          set({ musicState: m });
          broadcast({ type: 'MUSIC_CHANGE', payload: m });
        },

        saveGame: () => {
          set({ savedAt: Date.now() });
        },

        exportSave: () => {
          const s = get();
          const save: SaveState = {
            version: s.version, savedAt: Date.now(), gameId: s.gameId,
            phase: s.phase, round: s.round, subRound: s.subRound,
            disaster: s.disaster, players: s.players, bunkerCards: s.bunkerCards,
            threatCards: s.threatCards, votingSessions: s.votingSessions,
            currentVoting: s.currentVoting, musicState: s.musicState,
            gameMode: s.gameMode, apiMode: s.apiMode, errors: s.errors,
            roundConfig: s.roundConfig, totalRounds: s.totalRounds,
            survivorsTarget: s.survivorsTarget, currentSpeakerId: s.currentSpeakerId,
            eliminatedPlayerIds: s.eliminatedPlayerIds, bunkerSurvivors: s.bunkerSurvivors,
            outsideSurvivors: s.outsideSurvivors,
          };
          const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `neurobunker_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
          a.click();
          URL.revokeObjectURL(url);
        },

        loadGame: (state) => {
          set({ ...state });
          broadcast({ type: 'STATE_UPDATE', payload: state });
        },

        importSave: (json) => {
          try {
            const data = JSON.parse(json) as SaveState;
            if (!data.version || !data.gameId) throw new Error('Неверный формат');
            get().loadGame(data);
          } catch (e) {
            get().addError({
              type: 'logic',
              message: `Ошибка импорта: ${e instanceof Error ? e.message : String(e)}`,
            });
          }
        },

        resetGame: () => {
          stopSpeaking();
          set({
            ...INITIAL_STATE,
            apiConfig: get().apiConfig,
            availableVoices: get().availableVoices,
            isSpeaking: false,
            isGenerating: false,
            activeTab: 'game',
          });
          broadcast({ type: 'GAME_RESET' });
        },

        addError: (err) => {
          const entry: ErrorEntry = { ...err, id: `err_${Date.now()}`, timestamp: Date.now() };
          set(prev => ({ errors: [entry, ...prev.errors].slice(0, 100) }));
        },

        clearErrors: () => set({ errors: [] }),
      };

      return store;
    },
    {
      name: 'neurobunker-state',
      partialize: (state) => ({
        gameId: state.gameId,
        version: state.version,
        savedAt: state.savedAt,
        phase: state.phase,
        round: state.round,
        subRound: state.subRound,
        disaster: state.disaster,
        players: state.players,
        bunkerCards: state.bunkerCards,
        threatCards: state.threatCards,
        votingSessions: state.votingSessions,
        currentVoting: state.currentVoting,
        musicState: state.musicState,
        gameMode: state.gameMode,
        apiMode: state.apiMode,
        errors: state.errors.slice(0, 20),
        roundConfig: state.roundConfig,
        totalRounds: state.totalRounds,
        survivorsTarget: state.survivorsTarget,
        currentSpeakerId: state.currentSpeakerId,
        eliminatedPlayerIds: state.eliminatedPlayerIds,
        bunkerSurvivors: state.bunkerSurvivors,
        outsideSurvivors: state.outsideSurvivors,
      }),
    }
  )
);

// Авто-сохранение каждые 30 секунд
setInterval(() => {
  const s = useGameStore.getState();
  if (s.phase !== 'setup') {
    s.saveGame();
  }
}, 30_000);
