// ============================================================
// ТИПЫ ИГРЫ «НЕЙРОБУНКЕР»
// ============================================================

export type PlayerState = 'alive' | 'accused' | 'scared' | 'eliminated' | 'winner';

export type MusicState = 'discussion' | 'disaster' | 'elimination' | 'victory' | 'silence';

export type GamePhase =
  | 'setup'        // настройка игры
  | 'playing'      // идут раунды
  | 'voting'       // голосование
  | 'defense'      // защита обвиняемых
  | 'final'        // финал — открытие карт
  | 'survival'     // история выживания
  | 'ended';       // игра завершена

export type RevealedCard =
  | 'superpower'
  | 'phobia'
  | 'character'
  | 'hobby'
  | 'baggage'
  | 'fact';

// Карточка персонажа — 6 атрибутов согласно правилам
export interface PlayerCards {
  superpower: string;    // Суперсила (раскрывается в раунде 1 обязательно)
  phobia: string;        // Фобия
  character: string;     // Характер / психотип
  hobby: string;         // Хобби
  baggage: string;       // Багаж (предмет или навык)
  fact: string;          // Факт о персонаже
  specialCondition: string; // Особое условие (тайная карта)
}

export type CardKey = keyof Omit<PlayerCards, 'specialCondition'>;

export interface RevealHistory {
  round: number;
  card: CardKey;
  timestamp: number;
}

export interface Message {
  id: string;
  playerId: string;
  text: string;
  timestamp: number;
  round: number;
  phase: GamePhase;
  tokenCount: number; // примерный подсчёт токенов
}

export interface TokenStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostRub: number; // рублей
  model: string;
}

export interface Player {
  id: string;
  name: string;           // имя персонажа (напр. "Gemini")
  aiModel: string;        // 'demo' | 'gemini' | 'deepseek' | 'groq' | 'gigachat' | 'mistral' | 'openrouter' | 'yandex' | 'gemma'
  color: string;          // hex цвет колобка
  voiceId: string;        // id голоса браузера
  state: PlayerState;
  cards: PlayerCards;
  revealedCards: CardKey[];  // список уже открытых карт
  revealHistory: RevealHistory[];
  messages: Message[];
  tokenStats: TokenStats;
  kolobokIndex: number;   // 1-8 для выбора спрайта
  isCurrentSpeaker: boolean;
  voteCount: number;      // голосов против в текущем голосовании
  specialConditionPlayed: boolean;
  // Позиция в OBS overlay
  overlayX: number; // % от ширины
  overlayY: number; // % от высоты
}

export interface BunkerCard {
  id: string;
  text: string;
  revealed: boolean;
}

export interface ThreatCard {
  id: string;
  text: string;
  revealed: boolean;
}

export interface Disaster {
  id: string;
  title: string;
  description: string;
  category: string;
  relevantProfessions: string[]; // профессии особенно полезные при этой катастрофе
}

export interface VoteRecord {
  voterId: string;
  targetId: string;
  reason: string;
}

export interface VotingSession {
  id: string;
  round: number;
  candidates: string[];   // id игроков-кандидатов
  votes: VoteRecord[];
  eliminatedId: string | null;
  tieBreaker: boolean;
}

export interface RoundConfig {
  round: number;
  votingCount: number; // сколько голосований в этом раунде
}

export interface SaveState {
  version: string;
  savedAt: number;
  gameId: string;
  phase: GamePhase;
  round: number;
  subRound: number; // текущий ход внутри раунда (индекс игрока)
  disaster: Disaster | null;
  players: Player[];
  bunkerCards: BunkerCard[];
  threatCards: ThreatCard[];
  votingSessions: VotingSession[];
  currentVoting: VotingSession | null;
  musicState: MusicState;
  gameMode: 'basic' | 'survival';
  apiMode: 'demo' | 'real';
  errors: ErrorEntry[];
  roundConfig: RoundConfig[];
  totalRounds: number;
  survivorsTarget: number; // сколько должно выжить
  currentSpeakerId: string | null;
  eliminatedPlayerIds: string[];
  bunkerSurvivors: string[];  // кто попал в бункер
  outsideSurvivors: string[]; // кто выжил снаружи
}

export interface ErrorEntry {
  id: string;
  timestamp: number;
  playerId?: string;
  type: 'api' | 'tts' | 'logic' | 'network';
  message: string;
  details?: string;
}

export interface ApiConfig {
  gemini: { key: string; model: string };
  deepseek: { key: string; model: string };
  groq: { key: string; model: string };
  gigachat: { key: string; model: string };
  mistral: { key: string; model: string };
  openrouter: { key: string; model: string };
  yandex: { key: string; folderId: string; iamToken: string };
  gemma: { key: string; model: string };
}
