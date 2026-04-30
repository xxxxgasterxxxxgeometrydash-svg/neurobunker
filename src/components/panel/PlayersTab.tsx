import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CARD_LABELS } from '../../lib/gameData';
import type { Player, CardKey } from '../../types/game';

const ALL_CARD_KEYS: CardKey[] = ['superpower', 'phobia', 'character', 'hobby', 'baggage', 'fact'];

function PlayerFullCard({ player }: { player: Player }) {
  const { availableVoices, setPlayerVoice } = useGameStore();
  const [expanded, setExpanded] = useState(false);

  const stateColor: Record<string, string> = {
    alive: 'border-green-600',
    accused: 'border-yellow-500',
    scared: 'border-orange-500',
    eliminated: 'border-gray-600 opacity-60',
    winner: 'border-yellow-300',
  };

  const stateEmoji: Record<string, string> = {
    alive: '✅', accused: '⚖️', scared: '😰', eliminated: '💀', winner: '🏆'
  };

  return (
    <div className={`bg-gray-800 rounded-xl border-2 ${stateColor[player.state] ?? 'border-gray-700'}`}>
      {/* Заголовок карточки */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 flex items-center gap-3 hover:bg-gray-750 transition-all text-left"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg"
          style={{ backgroundColor: player.color }}
        >
          {player.kolobokIndex}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{player.name}</span>
            <span>{stateEmoji[player.state]}</span>
            {player.isCurrentSpeaker && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full animate-pulse">🎤 ГОВОРИТ</span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Модель: <span className="text-blue-400">{player.aiModel}</span> •
            Токенов: <span className="text-green-400">{player.tokenStats.totalTokens}</span> •
            Стоимость: <span className="text-yellow-400">{player.tokenStats.estimatedCostRub.toFixed(4)}₽</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Раскрыто: {player.revealedCards.length}/6 карт •
            Реплик: {player.messages.length}
          </div>
        </div>
        <div className="text-gray-500 flex-shrink-0">{expanded ? '▲' : '▼'}</div>
      </button>

      {/* Раскрытый контент */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-700 pt-4">
          {/* Все характеристики */}
          <div>
            <div className="text-xs text-gray-400 mb-2 font-bold">📋 ВСЕ ХАРАКТЕРИСТИКИ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ALL_CARD_KEYS.map(k => {
                const isRevealed = player.revealedCards.includes(k);
                return (
                  <div
                    key={k}
                    className={`rounded-lg p-2 text-sm ${
                      isRevealed
                        ? 'bg-gray-700 border border-gray-600'
                        : 'bg-gray-900 border border-gray-800'
                    }`}
                  >
                    <div className="text-xs text-gray-400 mb-0.5">
                      {isRevealed ? '🔓' : '🔒'} {CARD_LABELS[k]}
                    </div>
                    <div className={isRevealed ? 'text-white' : 'text-gray-600 text-xs italic'}>
                      {isRevealed ? player.cards[k] : '(закрыта)'}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Особое условие */}
            <div className="mt-2 rounded-lg p-2 bg-purple-950 border border-purple-700 text-sm">
              <div className="text-xs text-purple-400 mb-0.5">
                🃏 Особое условие {player.specialConditionPlayed ? '(сыграно)' : '(не раскрыто)'}
              </div>
              <div className="text-purple-200 text-xs">{player.cards.specialCondition}</div>
            </div>
          </div>

          {/* Настройка голоса */}
          <div>
            <div className="text-xs text-gray-400 mb-2 font-bold">🔊 ГОЛОС TTS</div>
            <select
              value={player.voiceId}
              onChange={e => setPlayerVoice(player.id, e.target.value)}
              className="w-full bg-gray-700 text-white text-xs px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="">— Голос по умолчанию (русский) —</option>
              {availableVoices.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* История реплик */}
          {player.messages.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-2 font-bold">💬 ИСТОРИЯ РЕПЛИК ({player.messages.length})</div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {player.messages.slice().reverse().map(m => (
                  <div key={m.id} className="bg-gray-900 rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Раунд {m.round} • ~{m.tokenCount} токенов
                    </div>
                    <div className="text-sm text-gray-200">«{m.text}»</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Токены детально */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-900 rounded-lg p-2">
              <div className="text-sm font-bold text-blue-400">{player.tokenStats.promptTokens}</div>
              <div className="text-xs text-gray-500">Промпт</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-2">
              <div className="text-sm font-bold text-green-400">{player.tokenStats.completionTokens}</div>
              <div className="text-xs text-gray-500">Ответ</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-2">
              <div className="text-sm font-bold text-yellow-400">{player.tokenStats.estimatedCostRub.toFixed(5)}₽</div>
              <div className="text-xs text-gray-500">Стоимость</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayersTab() {
  const { players } = useGameStore();

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">
        Нажмите на карточку игрока для просмотра всех характеристик, включая закрытые.
      </div>
      {players.map(p => (
        <PlayerFullCard key={p.id} player={p} />
      ))}
    </div>
  );
}
