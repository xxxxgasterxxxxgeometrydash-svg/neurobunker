import { useGameStore } from '../../store/gameStore';

export default function LogsTab() {
  const { players, errors, clearErrors } = useGameStore();

  // Все сообщения хронологически
  const allMessages = players
    .flatMap(p =>
      p.messages.map(m => ({ ...m, playerName: p.name, playerColor: p.color }))
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const errorTypeColor: Record<string, string> = {
    api: 'text-red-400 border-red-800',
    tts: 'text-orange-400 border-orange-800',
    logic: 'text-yellow-400 border-yellow-800',
    network: 'text-purple-400 border-purple-800',
  };

  return (
    <div className="space-y-4">
      {/* Ошибки */}
      {errors.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-red-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-red-400">❌ Ошибки ({errors.length})</div>
            <button
              onClick={clearErrors}
              className="text-xs text-gray-500 hover:text-gray-300 transition-all"
            >
              Очистить
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {errors.map(e => (
              <div
                key={e.id}
                className={`bg-gray-800 rounded-lg p-3 border ${errorTypeColor[e.type] ?? 'border-gray-700'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-bold uppercase ${errorTypeColor[e.type]?.split(' ')[0]}`}>
                    [{e.type}]
                    {e.playerId && ` — ${players.find(p => p.id === e.playerId)?.name ?? e.playerId}`}
                  </span>
                  <span className="text-xs text-gray-600">{formatTime(e.timestamp)}</span>
                </div>
                <div className="text-sm text-gray-200 mt-1">{e.message}</div>
                {e.details && (
                  <div className="text-xs text-gray-500 mt-1 font-mono">{e.details}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Все реплики */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-bold text-gray-300 mb-3">
          💬 Все реплики ({allMessages.length})
        </div>
        {allMessages.length === 0 ? (
          <div className="text-center text-gray-600 py-8">Реплик ещё нет. Начните игру.</div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {allMessages.map(m => (
              <div key={m.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: m.playerColor }}
                    />
                    <span className="text-sm font-bold" style={{ color: m.playerColor }}>
                      {m.playerName}
                    </span>
                    <span className="text-xs text-gray-500">Раунд {m.round}</span>
                    <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                      {m.phase}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    ~{m.tokenCount} токенов • {formatTime(m.timestamp)}
                  </div>
                </div>
                <div className="text-sm text-gray-200 leading-relaxed">«{m.text}»</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
