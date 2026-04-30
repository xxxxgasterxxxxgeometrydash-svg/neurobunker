import { useGameStore } from '../../store/gameStore';
import { CARD_LABELS } from '../../lib/gameData';
import type { Player, CardKey } from '../../types/game';

const STATE_LABELS: Record<string, string> = {
  alive: '✅ В игре',
  accused: '⚖️ Обвиняется',
  scared: '😰 Боится',
  eliminated: '💀 Изгнан',
  winner: '🏆 Победитель',
};

const STATE_COLORS: Record<string, string> = {
  alive: 'border-green-600',
  accused: 'border-yellow-500 bg-yellow-950',
  scared: 'border-orange-500',
  eliminated: 'border-gray-700 opacity-50',
  winner: 'border-yellow-400 bg-yellow-950',
};

function PlayerMini({ player, isActive }: { player: Player; isActive: boolean }) {
  const { castVote, currentVoting, phase } = useGameStore();

  const handleVoteClick = () => {
    if (phase === 'voting' && currentVoting) {
      // AI-голосование симулируем — стримеру показываем кнопки
      castVote('manual', player.id, 'Ручное голосование стримера');
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 p-3 transition-all ${STATE_COLORS[player.state] ?? 'border-gray-700'} ${
        isActive ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-900' : ''
      } bg-gray-800`}
    >
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: player.color }}
        >
          {player.kolobokIndex}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">{player.name}</div>
          <div className="text-xs text-gray-400">{STATE_LABELS[player.state]}</div>
        </div>
        {isActive && (
          <div className="ml-auto flex-shrink-0">
            <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
              🎤 ГОВОРИТ
            </span>
          </div>
        )}
        {player.voteCount > 0 && (
          <span className="ml-auto flex-shrink-0 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
            👎 {player.voteCount}
          </span>
        )}
      </div>

      {/* Раскрытые карты */}
      <div className="flex flex-wrap gap-1 mb-2">
        {player.revealedCards.map(k => (
          <span key={k} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
            {CARD_LABELS[k]}: <span className="text-white">{player.cards[k as CardKey].slice(0, 30)}</span>
          </span>
        ))}
      </div>

      {/* Последняя реплика */}
      {player.messages.length > 0 && (
        <div className="text-xs text-gray-400 italic border-t border-gray-700 pt-2 line-clamp-2">
          «{player.messages[player.messages.length - 1].text}»
        </div>
      )}

      {/* Токены */}
      <div className="text-xs text-gray-600 mt-1">
        Токенов: {player.tokenStats.totalTokens} | ~{player.tokenStats.estimatedCostRub.toFixed(4)}₽
      </div>

      {/* Кнопка голосования */}
      {phase === 'voting' && player.state !== 'eliminated' && (
        <button
          onClick={handleVoteClick}
          className="mt-2 w-full text-xs py-1 bg-red-800 hover:bg-red-700 rounded transition-all"
        >
          👎 Голосовать против
        </button>
      )}
    </div>
  );
}

export default function GameBoard() {
  const {
    players, phase, round, disaster, currentSpeakerId,
    isGenerating, isSpeaking, nextTurn, startVoting,
    resolveVoting, startFinal, resetGame, bunkerCards,
    threatCards, currentVoting, musicState, setMusicState,
    survivorsTarget, eliminatedPlayerIds, roundConfig,
  } = useGameStore();

  const alivePlayers = players.filter(p => p.state !== 'eliminated');
  const deadCount = eliminatedPlayerIds.length;
  const roundCfg = roundConfig.find(r => r.round === round);

  const phaseLabel: Record<string, string> = {
    playing: '🎮 Идут ходы',
    voting: '🗳️ Голосование',
    defense: '🛡️ Защита',
    final: '🏆 Финал',
    survival: '⚔️ История выживания',
    ended: '🏁 Игра окончена',
  };

  const musicOptions: Array<{ value: string; label: string }> = [
    { value: 'silence', label: '🔇 Тишина' },
    { value: 'discussion', label: '🎵 Обсуждение' },
    { value: 'disaster', label: '☢️ Катастрофа' },
    { value: 'elimination', label: '😱 Изгнание' },
    { value: 'victory', label: '🏆 Победа' },
  ];

  return (
    <div className="space-y-4">
      {/* Статус полосы */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-yellow-400">{round}/5</div>
          <div className="text-xs text-gray-400">Раунд</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-400">{alivePlayers.length}</div>
          <div className="text-xs text-gray-400">В игре</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-red-400">{deadCount}</div>
          <div className="text-xs text-gray-400">Изгнано</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-400">{survivorsTarget}</div>
          <div className="text-xs text-gray-400">Мест в бункере</div>
        </div>
      </div>

      {/* Катастрофа + фаза */}
      <div className="bg-red-950 border border-red-800 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-red-400 mb-1">КАТАСТРОФА</div>
            <div className="text-lg font-bold text-red-200">{disaster?.title ?? '—'}</div>
            <div className="text-xs text-red-300 mt-1 line-clamp-2">{disaster?.description}</div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-gray-400 mb-1">ФАЗА</div>
            <div className="text-sm font-bold text-yellow-400">{phaseLabel[phase] ?? phase}</div>
          </div>
        </div>
      </div>

      {/* Карты бункера и угрозы */}
      {(bunkerCards.some(c => c.revealed) || threatCards.some(c => c.revealed)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-900 rounded-xl p-3 border border-green-800">
            <div className="text-xs text-green-400 mb-2 font-bold">🏗️ КАРТЫ БУНКЕРА</div>
            <div className="space-y-1">
              {bunkerCards.filter(c => c.revealed).map(c => (
                <div key={c.id} className="text-xs text-green-200 bg-green-950 rounded px-2 py-1">{c.text}</div>
              ))}
              {bunkerCards.filter(c => !c.revealed).map((_, i) => (
                <div key={i} className="text-xs text-gray-700 bg-gray-800 rounded px-2 py-1">🔒 Закрыта</div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-orange-800">
            <div className="text-xs text-orange-400 mb-2 font-bold">⚠️ УГРОЗЫ</div>
            <div className="space-y-1">
              {threatCards.filter(c => c.revealed).map(c => (
                <div key={c.id} className="text-xs text-orange-200 bg-orange-950 rounded px-2 py-1">{c.text}</div>
              ))}
              {threatCards.filter(c => !c.revealed).map((_, i) => (
                <div key={i} className="text-xs text-gray-700 bg-gray-800 rounded px-2 py-1">🔒 Закрыта</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Управление музыкой */}
      <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
        <div className="text-xs text-gray-400 mb-2">🎵 МУЗЫКА (для OBS Overlay)</div>
        <div className="flex flex-wrap gap-2">
          {musicOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setMusicState(o.value as Parameters<typeof setMusicState>[0])}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                musicState === o.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-xs text-gray-400 mb-3">🕹️ УПРАВЛЕНИЕ ХОДОМ</div>
        <div className="flex flex-wrap gap-3">
          {/* Следующий ход */}
          {(phase === 'playing') && (
            <button
              onClick={() => nextTurn()}
              disabled={isGenerating || isSpeaking}
              className="flex-1 min-w-[140px] py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all"
            >
              {isGenerating ? '⏳ Генерация...' : isSpeaking ? '🔊 Говорит...' : '▶️ ХОД ИГРОКА'}
            </button>
          )}

          {/* Начать голосование */}
          {phase === 'playing' && roundCfg && roundCfg.votingCount > 0 && (
            <button
              onClick={startVoting}
              disabled={isGenerating || isSpeaking}
              className="flex-1 min-w-[140px] py-3 bg-orange-700 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all"
            >
              🗳️ ГОЛОСОВАНИЕ
            </button>
          )}

          {/* Результат голосования */}
          {phase === 'voting' && currentVoting && (
            <button
              onClick={resolveVoting}
              disabled={isGenerating || isSpeaking}
              className="flex-1 min-w-[140px] py-3 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all"
            >
              ⚖️ ПОДВЕСТИ ИТОГ
            </button>
          )}

          {/* Начать финал */}
          {(phase === 'playing' || phase === 'voting') && (
            <button
              onClick={startFinal}
              disabled={isGenerating || isSpeaking}
              className="flex-1 min-w-[140px] py-3 bg-yellow-700 hover:bg-yellow-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all"
            >
              🏁 ФИНАЛ
            </button>
          )}

          {/* Сброс */}
          <button
            onClick={() => {
              if (confirm('Сбросить игру и вернуться к настройке?')) resetGame();
            }}
            className="py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-sm text-gray-400 transition-all"
          >
            🔄 Сброс
          </button>
        </div>

        {/* Информация о текущем говорящем */}
        {currentSpeakerId && (
          <div className="mt-3 p-3 bg-yellow-950 border border-yellow-800 rounded-lg">
            <div className="text-xs text-yellow-400 mb-1">СЕЙЧАС ГОВОРИТ:</div>
            <div className="font-bold text-yellow-200">
              {players.find(p => p.id === currentSpeakerId)?.name ?? '—'}
            </div>
            {players.find(p => p.id === currentSpeakerId)?.messages.slice(-1)[0] && (
              <div className="text-xs text-yellow-300 mt-1 italic">
                «{players.find(p => p.id === currentSpeakerId)!.messages.slice(-1)[0].text}»
              </div>
            )}
          </div>
        )}
      </div>

      {/* Сетка игроков */}
      <div>
        <div className="text-xs text-gray-500 mb-2">АКТИВНЫЕ ИГРОКИ</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {players.filter(p => p.state !== 'eliminated').map(p => (
            <PlayerMini key={p.id} player={p} isActive={p.id === currentSpeakerId} />
          ))}
        </div>
        {players.some(p => p.state === 'eliminated') && (
          <>
            <div className="text-xs text-gray-600 mb-2 mt-4">ИЗГНАННЫЕ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {players.filter(p => p.state === 'eliminated').map(p => (
                <PlayerMini key={p.id} player={p} isActive={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
