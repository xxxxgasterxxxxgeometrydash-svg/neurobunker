import { useGameStore } from '../../store/gameStore';

export default function StatsTab() {
  const { players, errors, round, eliminatedPlayerIds, bunkerSurvivors, outsideSurvivors, votingSessions } = useGameStore();

  const totalPrompt = players.reduce((s, p) => s + p.tokenStats.promptTokens, 0);
  const totalCompletion = players.reduce((s, p) => s + p.tokenStats.completionTokens, 0);
  const totalTokens = totalPrompt + totalCompletion;
  const totalCost = players.reduce((s, p) => s + p.tokenStats.estimatedCostRub, 0);
  const totalMessages = players.reduce((s, p) => s + p.messages.length, 0);
  const errorCount = errors.length;

  return (
    <div className="space-y-4">
      {/* Итоговые числа */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-blue-800 text-center">
          <div className="text-3xl font-bold text-blue-400">{totalTokens.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Всего токенов</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-yellow-800 text-center">
          <div className="text-3xl font-bold text-yellow-400">{totalCost.toFixed(4)}₽</div>
          <div className="text-xs text-gray-400 mt-1">Примерная стоимость</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-green-800 text-center">
          <div className="text-3xl font-bold text-green-400">{totalMessages}</div>
          <div className="text-xs text-gray-400 mt-1">Реплик произнесено</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-red-800 text-center">
          <div className="text-3xl font-bold text-red-400">{errorCount}</div>
          <div className="text-xs text-gray-400 mt-1">Ошибок</div>
        </div>
      </div>

      {/* Детально по токенам */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-bold text-gray-300 mb-3">📊 Расход токенов по игрокам</div>
        <div className="space-y-2">
          {players.map(p => {
            const pct = totalTokens > 0 ? (p.tokenStats.totalTokens / totalTokens) * 100 : 0;
            return (
              <div key={p.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: p.color }}>{p.name}</span>
                  <span className="text-gray-400">
                    {p.tokenStats.totalTokens} токенов | {p.tokenStats.estimatedCostRub.toFixed(5)}₽
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: p.color }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Модель: {p.tokenStats.model} • Промпт: {p.tokenStats.promptTokens} / Ответ: {p.tokenStats.completionTokens}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
          <span>Промпт-токены: {totalPrompt.toLocaleString()}</span>
          <span>Completion-токены: {totalCompletion.toLocaleString()}</span>
          <span>Итого: {totalTokens.toLocaleString()}</span>
        </div>
      </div>

      {/* История голосований */}
      {votingSessions.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <div className="text-sm font-bold text-gray-300 mb-3">🗳️ История голосований</div>
          <div className="space-y-3">
            {votingSessions.map((vs, i) => {
              const eliminated = players.find(p => p.id === vs.eliminatedId);
              return (
                <div key={vs.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold">Голосование #{i + 1} — Раунд {vs.round}</div>
                    {vs.tieBreaker && <span className="text-xs text-yellow-500">⚡ Ничья → случайный</span>}
                  </div>
                  {eliminated && (
                    <div className="text-sm text-red-300">
                      💀 Изгнан: <strong>{eliminated.name}</strong>
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    {vs.votes.map((v, vi) => {
                      const voter = players.find(p => p.id === v.voterId);
                      const target = players.find(p => p.id === v.targetId);
                      return (
                        <div key={vi} className="text-xs text-gray-400">
                          {voter?.name ?? v.voterId} → {target?.name ?? v.targetId}
                          {v.reason && <span className="text-gray-600"> («{v.reason.slice(0, 50)}»)</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Итог игры */}
      {(bunkerSurvivors.length > 0 || outsideSurvivors.length > 0) && (
        <div className="bg-gray-900 rounded-xl p-4 border border-yellow-700">
          <div className="text-sm font-bold text-yellow-400 mb-3">🏁 Итог игры</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-green-400 mb-2">🏠 В бункере:</div>
              {bunkerSurvivors.map(id => {
                const p = players.find(pl => pl.id === id);
                return p ? (
                  <div key={id} className="text-sm text-green-200" style={{ color: p.color }}>
                    ✅ {p.name}
                  </div>
                ) : null;
              })}
            </div>
            <div>
              <div className="text-xs text-red-400 mb-2">🌪️ Снаружи (изгнаны):</div>
              {eliminatedPlayerIds.map(id => {
                const p = players.find(pl => pl.id === id);
                return p ? (
                  <div key={id} className="text-sm text-red-300">
                    💀 {p.name}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Общий прогресс */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-bold text-gray-300 mb-3">📈 Прогресс игры</div>
        <div className="space-y-2 text-sm text-gray-400">
          <div>Текущий раунд: <span className="text-white">{round} / 5</span></div>
          <div>Изгнано игроков: <span className="text-red-400">{eliminatedPlayerIds.length}</span></div>
          <div>Осталось в игре: <span className="text-green-400">{players.filter(p => p.state !== 'eliminated').length}</span></div>
          <div>Всего реплик: <span className="text-blue-400">{totalMessages}</span></div>
        </div>
      </div>
    </div>
  );
}
