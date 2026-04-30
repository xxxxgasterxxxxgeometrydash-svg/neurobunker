import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { ApiConfig } from '../../types/game';

const MODEL_DOCS: Record<string, { url: string; free: string; speed: string }> = {
  gemini:     { url: 'https://aistudio.google.com', free: '15 req/min бесплатно', speed: '⚡⚡⚡' },
  gigachat:   { url: 'https://developers.sber.ru/portal/products/gigachat', free: 'Бесплатный тир', speed: '⚡⚡' },
  deepseek:   { url: 'https://platform.deepseek.com', free: '$0.001/req', speed: '⚡⚡' },
  groq:       { url: 'https://console.groq.com', free: 'Бесплатно + быстро', speed: '⚡⚡⚡' },
  mistral:    { url: 'https://console.mistral.ai', free: '$0.002/1k токенов', speed: '⚡⚡' },
  openrouter: { url: 'https://openrouter.ai', free: 'Бесплатные модели', speed: '⚡⚡' },
  yandex:     { url: 'https://cloud.yandex.ru/services/yandexgpt', free: 'IAM-токен', speed: '⚡⚡' },
  gemma:      { url: 'https://aistudio.google.com', free: 'Бесплатно', speed: '⚡⚡⚡' },
};

const MODEL_LABELS: Record<string, string> = {
  gemini: '🔵 Google Gemini',
  gigachat: '🟢 GigaChat (Сбер)',
  deepseek: '🟣 DeepSeek',
  groq: '🟠 Groq (LLaMA)',
  mistral: '🔴 Mistral AI',
  openrouter: '🟩 OpenRouter',
  yandex: '🟡 YandexGPT',
  gemma: '🩷 Gemma AI',
};

export default function SettingsTab() {
  const { apiConfig, setApiConfig, apiMode, setApiMode } = useGameStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateKey = (model: keyof ApiConfig, field: string, value: string) => {
    setApiConfig({
      [model]: { ...apiConfig[model], [field]: value }
    } as Partial<ApiConfig>);
  };

  return (
    <div className="space-y-4">
      {/* Режим */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-bold text-gray-300 mb-3">⚙️ Режим работы AI</div>
        <div className="flex gap-3">
          <button
            onClick={() => setApiMode('demo')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              apiMode === 'demo'
                ? 'bg-green-700 text-white border border-green-500'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🤖 ДЕМО<br/>
            <span className="text-xs font-normal opacity-70">Заглушки, без API ключей</span>
          </button>
          <button
            onClick={() => setApiMode('real')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              apiMode === 'real'
                ? 'bg-purple-700 text-white border border-purple-500'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🌐 РЕАЛЬНЫЙ<br/>
            <span className="text-xs font-normal opacity-70">Реальные API ключи</span>
          </button>
        </div>
      </div>

      {/* Инструкция */}
      <div className="bg-blue-950 rounded-xl p-4 border border-blue-800">
        <div className="text-sm font-bold text-blue-300 mb-2">📘 Как подключить AI</div>
        <div className="text-xs text-blue-200 space-y-2 leading-relaxed">
          <p>1. Переключитесь в режим <strong>РЕАЛЬНЫЙ</strong></p>
          <p>2. Для каждого игрока введите API ключ нужного сервиса</p>
          <p>3. Рекомендации по бесплатным API:</p>
          <ul className="ml-4 space-y-1">
            <li>• <strong>Groq</strong> — самый быстрый и бесплатный → console.groq.com</li>
            <li>• <strong>Gemini Flash</strong> — 15 запросов/мин бесплатно → aistudio.google.com</li>
            <li>• <strong>OpenRouter</strong> — бесплатные модели → openrouter.ai</li>
          </ul>
          <p>4. Назначьте каждому игроку нужную модель в разделе <strong>Игроки</strong></p>
        </div>
      </div>

      {/* API ключи */}
      <div className="space-y-3">
        <div className="text-sm font-bold text-gray-300">🔑 API Ключи</div>
        {(Object.keys(MODEL_LABELS) as Array<keyof ApiConfig>).map(model => {
          const info = MODEL_DOCS[model as string];
          const cfg = apiConfig[model] as Record<string, string>;
          const isOpen = expanded === model;
          const hasKey = cfg?.key && cfg.key.length > 0;

          return (
            <div key={model} className="bg-gray-900 rounded-xl border border-gray-700">
              <button
                onClick={() => setExpanded(isOpen ? null : model as string)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800 rounded-xl transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{MODEL_LABELS[model as string]}</span>
                  {hasKey && <span className="text-xs bg-green-700 text-green-100 px-2 py-0.5 rounded-full">✓ ключ задан</span>}
                  <span className="text-xs text-gray-600">{info?.speed}</span>
                </div>
                <span className="text-gray-500">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                  <div className="text-xs text-gray-500">
                    Стоимость: {info?.free} •
                    <a href={info?.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 ml-1 underline">
                      Получить ключ →
                    </a>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">API Key</label>
                    <input
                      type="password"
                      value={cfg?.key ?? ''}
                      onChange={e => updateKey(model, 'key', e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Model name */}
                  {model !== 'yandex' && (
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Модель</label>
                      <input
                        type="text"
                        value={cfg?.model ?? ''}
                        onChange={e => updateKey(model, 'model', e.target.value)}
                        className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  )}

                  {/* YandexGPT специфично */}
                  {model === 'yandex' && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Folder ID</label>
                        <input
                          type="text"
                          value={(cfg as Record<string, string>)?.folderId ?? ''}
                          onChange={e => updateKey(model, 'folderId', e.target.value)}
                          className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">IAM Token</label>
                        <input
                          type="password"
                          value={(cfg as Record<string, string>)?.iamToken ?? ''}
                          onChange={e => updateKey(model, 'iamToken', e.target.value)}
                          className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Предупреждение */}
      <div className="bg-yellow-950 rounded-xl p-4 border border-yellow-800">
        <div className="text-xs text-yellow-300">
          ⚠️ API ключи хранятся только в браузере (localStorage). Не делитесь скриншотами этого экрана.
          При использовании в реальном проекте — рассмотрите серверный прокси вместо прямых ключей.
        </div>
      </div>
    </div>
  );
}
