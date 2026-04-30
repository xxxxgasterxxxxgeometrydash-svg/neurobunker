import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DISASTERS, DEFAULT_PLAYERS } from '../../lib/gameData';
import { loadVoices } from '../../lib/tts';

const COLORS = [
  '#4285F4', '#00A3E0', '#6C47FF', '#F97316',
  '#EF4444', '#10B981', '#FBBF24', '#EC4899',
];

export default function SetupScreen() {
  const { initGame, setAvailableVoices, apiMode, setApiMode } = useGameStore();
  const [playerCount, setPlayerCount] = useState(8);
  const [disasterId, setDisasterId] = useState<string>('random');
  const [gameMode, setGameMode] = useState<'basic' | 'survival'>('survival');
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_PLAYERS.map(p => p.name));
  const [playerColors, setPlayerColors] = useState<string[]>(DEFAULT_PLAYERS.map(p => p.color));
  const [voices, setVoices] = useState<Array<{ id: string; name: string; lang: string }>>([]);

  useEffect(() => {
    loadVoices().then(v => {
      setVoices(v);
      setAvailableVoices(v);
    });
  }, [setAvailableVoices]);

  const handleStart = () => {
    const overrides = Array.from({ length: playerCount }, (_, i) => ({
      name: playerNames[i] ?? DEFAULT_PLAYERS[i]?.name ?? `Игрок ${i + 1}`,
      color: playerColors[i] ?? COLORS[i % COLORS.length],
    }));
    initGame(playerCount, disasterId, overrides);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏠</div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">НейроБункер</h1>
          <p className="text-gray-400">Панель управления стримом</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая колонка */}
          <div className="space-y-5">

            {/* Режим игры */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold mb-3 text-yellow-400">⚙️ Режим игры</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setGameMode('basic')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    gameMode === 'basic'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  📋 Базовый
                </button>
                <button
                  onClick={() => setGameMode('survival')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    gameMode === 'survival'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  ⚔️ История выживания
                </button>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => setApiMode('demo')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    apiMode === 'demo'
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  🤖 Демо (заглушки)
                </button>
                <button
                  onClick={() => setApiMode('real')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    apiMode === 'real'
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  🌐 Реальные API
                </button>
              </div>
            </div>

            {/* Количество игроков */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold mb-3 text-yellow-400">👥 Количество игроков: {playerCount}</h2>
              <input
                type="range" min={4} max={8} value={playerCount}
                onChange={e => setPlayerCount(Number(e.target.value))}
                className="w-full accent-yellow-400"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Мест в бункере: {playerCount === 4 ? 2 : playerCount === 5 ? 2 : playerCount === 6 ? 3 : playerCount === 7 ? 3 : 4}
              </p>
            </div>

            {/* Катастрофа */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-bold mb-3 text-yellow-400">☢️ Катастрофа</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setDisasterId('random')}
                  className={`w-full py-2 px-4 rounded-lg text-left text-sm font-medium transition-all ${
                    disasterId === 'random'
                      ? 'bg-red-800 border border-red-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🎲 Случайная катастрофа
                </button>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {DISASTERS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDisasterId(d.id)}
                      className={`w-full py-2 px-4 rounded-lg text-left text-xs transition-all ${
                        disasterId === d.id
                          ? 'bg-red-800 border border-red-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="font-medium">{d.title}</span>
                      <span className="ml-2 text-gray-500">({d.category})</span>
                    </button>
                  ))}
                </div>
              </div>
              {disasterId !== 'random' && (
                <div className="mt-3 p-3 bg-red-950 rounded-lg border border-red-800 text-xs text-red-200">
                  {DISASTERS.find(d => d.id === disasterId)?.description}
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка — игроки */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
            <h2 className="text-lg font-bold mb-3 text-yellow-400">🤖 Игроки</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {Array.from({ length: playerCount }, (_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: playerColors[i] ?? COLORS[i % COLORS.length] }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={playerNames[i] ?? DEFAULT_PLAYERS[i]?.name ?? `Игрок ${i + 1}`}
                      onChange={e => {
                        const n = [...playerNames];
                        n[i] = e.target.value;
                        setPlayerNames(n);
                      }}
                      className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                      placeholder="Имя игрока"
                    />
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {COLORS.slice(0, 4).map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          const cols = [...playerColors];
                          cols[i] = c;
                          setPlayerColors(cols);
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          playerColors[i] === c ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {voices.length === 0 && (
              <p className="mt-3 text-xs text-yellow-600">
                ⚠️ Голоса загружаются... Убедитесь что браузер поддерживает Web Speech API.
              </p>
            )}
          </div>
        </div>

        {/* Кнопка старт */}
        <div className="mt-8 text-center">
          <button
            onClick={handleStart}
            className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-900"
          >
            🚀 НАЧАТЬ ИГРУ
          </button>
          <p className="mt-3 text-xs text-gray-600">
            Откройте <span className="text-gray-400 font-mono">/overlay</span> в OBS как Browser Source
          </p>
        </div>
      </div>
    </div>
  );
}
