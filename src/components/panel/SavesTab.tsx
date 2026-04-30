import { useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function SavesTab() {
  const { exportSave, importSave, savedAt, gameId, phase, round } = useGameStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const formatDate = (ts: number) =>
    ts ? new Date(ts).toLocaleString('ru-RU') : 'Никогда';

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') importSave(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Текущее авто-сохранение */}
      <div className="bg-gray-900 rounded-xl p-4 border border-green-800">
        <div className="text-sm font-bold text-green-400 mb-3">💾 Авто-сохранение (localStorage)</div>
        <div className="space-y-2 text-sm text-gray-400">
          <div>ID игры: <span className="text-white font-mono text-xs">{gameId || '—'}</span></div>
          <div>Фаза: <span className="text-white">{phase}</span></div>
          <div>Раунд: <span className="text-white">{round}</span></div>
          <div>Последнее сохранение: <span className="text-green-300">{formatDate(savedAt)}</span></div>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          Авто-сохранение происходит каждые 30 секунд. Данные хранятся в браузере.
          При перезагрузке страницы игра восстановится автоматически.
        </div>
      </div>

      {/* Экспорт */}
      <div className="bg-gray-900 rounded-xl p-4 border border-blue-800">
        <div className="text-sm font-bold text-blue-400 mb-3">📤 Ручное сохранение (JSON-файл)</div>
        <p className="text-xs text-gray-400 mb-3">
          Скачайте полную копию состояния игры. Храните файлы в надёжном месте.
          В случае краша или очистки браузера вы сможете восстановить игру.
        </p>
        <button
          onClick={exportSave}
          className="w-full py-3 bg-blue-700 hover:bg-blue-600 rounded-xl font-bold text-sm transition-all"
        >
          💾 Скачать сохранение (.json)
        </button>
      </div>

      {/* Импорт */}
      <div className="bg-gray-900 rounded-xl p-4 border border-purple-800">
        <div className="text-sm font-bold text-purple-400 mb-3">📥 Загрузить сохранение</div>
        <p className="text-xs text-gray-400 mb-3">
          Загрузите JSON-файл сохранения чтобы восстановить игру. Текущее состояние будет перезаписано.
        </p>
        <input
          type="file"
          accept=".json"
          ref={fileRef}
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 bg-purple-700 hover:bg-purple-600 rounded-xl font-bold text-sm transition-all"
        >
          📂 Выбрать файл сохранения
        </button>
      </div>

      {/* Инструкция */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-bold text-gray-300 mb-3">📖 Как работают сохранения</div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex gap-2">
            <span className="text-green-400">●</span>
            <span>Авто-сохранение каждые 30 сек в localStorage браузера</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400">●</span>
            <span>При перезагрузке страницы — игра восстанавливается автоматически</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-400">●</span>
            <span>JSON-экспорт = полная резервная копия на диске (рекомендуется перед каждым стримом)</span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-400">●</span>
            <span>Очистка кэша браузера удалит авто-сохранение — используйте JSON-экспорт</span>
          </div>
        </div>
      </div>
    </div>
  );
}
