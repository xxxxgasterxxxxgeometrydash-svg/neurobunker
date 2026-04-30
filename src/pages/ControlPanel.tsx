import { useGameStore } from '../store/gameStore';
import SetupScreen from '../components/panel/SetupScreen';
import GameBoard from '../components/panel/GameBoard';
import PlayersTab from '../components/panel/PlayersTab';
import StatsTab from '../components/panel/StatsTab';
import LogsTab from '../components/panel/LogsTab';
import SavesTab from '../components/panel/SavesTab';
import SettingsTab from '../components/panel/SettingsTab';

const TABS = [
  { id: 'game',    label: '🎮 Игра' },
  { id: 'players', label: '👥 Игроки' },
  { id: 'stats',   label: '📊 Статистика' },
  { id: 'logs',    label: '📜 Логи' },
  { id: 'saves',   label: '💾 Сохранения' },
  { id: 'settings',label: '⚙️ Настройки' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ControlPanel() {
  const { phase, activeTab, setActiveTab, errors, isGenerating, isSpeaking, players, round } = useGameStore();

  if (phase === 'setup') {
    return <SetupScreen />;
  }

  const aliveCount = players.filter(p => p.state !== 'eliminated').length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Шапка */}
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="text-lg font-black text-yellow-400">НейроБункер</span>
          <span className="text-xs text-gray-500 ml-1">Панель управления</span>
        </div>

        {/* Статус */}
        <div className="flex items-center gap-3 ml-4">
          <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-400">
            Раунд <span className="text-white font-bold">{round}/5</span>
          </span>
          <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-400">
            В игре: <span className="text-green-400 font-bold">{aliveCount}</span>
          </span>
          {isGenerating && (
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full animate-pulse">
              ⏳ AI генерирует...
            </span>
          )}
          {isSpeaking && !isGenerating && (
            <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full animate-pulse">
              🔊 Говорит...
            </span>
          )}
          {errors.length > 0 && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">
              ❌ {errors.length} ошибок
            </span>
          )}
        </div>

        {/* Ссылка на overlay */}
        <div className="ml-auto">
          <a
            href="/overlay"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-purple-800 hover:bg-purple-700 text-purple-200 px-3 py-1.5 rounded-lg transition-all"
          >
            📺 Открыть OBS Overlay →
          </a>
        </div>
      </header>

      {/* Навигация */}
      <nav className="bg-gray-900 border-b border-gray-700 px-4 flex gap-1 overflow-x-auto flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.id === 'logs' && errors.length > 0 && (
              <span className="ml-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                {errors.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Контент */}
      <main className="flex-1 overflow-auto p-4">
        {activeTab === 'game'     && <GameBoard />}
        {activeTab === 'players'  && <PlayersTab />}
        {activeTab === 'stats'    && <StatsTab />}
        {activeTab === 'logs'     && <LogsTab />}
        {activeTab === 'saves'    && <SavesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}
