// ============================================================
// AI CLIENT — заглушки + реальные API (переключается режимом)
// ============================================================
import type { Player, GamePhase, Disaster, ApiConfig } from '../types/game';
import { buildSystemPrompt, CARD_LABELS, randomFrom } from './gameData';
import { estimateTokens } from './tts';

// ─── ДЕМО РЕПЛИКИ ───────────────────────────────────────────
const DEMO_SPEECHES = {
  playing: [
    'Мои навыки незаменимы в этой ситуации. Без меня группа просто не выживет в долгосрочной перспективе.',
    'Я уже анализировал похожие катастрофы — знаю что нужно делать в первые 72 часа. Изгнать меня было бы ошибкой.',
    'Смотрите на мои характеристики — я закрываю критическую уязвимость нашей группы. Кто ещё может это сделать?',
    'Моё хобби — это не просто увлечение, это навык выживания который мы будем использовать каждый день.',
    'Я слышал аргументы предыдущих игроков. Уважаю их, но моя комбинация навыков уникальна для данной катастрофы.',
    'Без моей специализации бункер продержится от силы три месяца. Подумайте об этом перед голосованием.',
  ],
  voting: [
    'Предлагаю изгнать %TARGET% — их навыки дублируют уже имеющиеся в группе, а моя уникальность очевидна.',
    'Объективно слабейшим звеном является %TARGET%. Эмоции в сторону — только логика выживания.',
    '%TARGET% уже продемонстрировал свою бесполезность для данной катастрофы. Голосую против.',
    'Мой выбор — %TARGET%. Их фобия сделает их обузой именно в той ситуации когда нам нужна концентрация.',
    'Самый опасный человек здесь — %TARGET%. Не потому что слабы, а потому что непредсказуемы.',
  ],
  defense: [
    'Стоп! Я не позволю вынести себя без боя. Посмотрите — без моей суперсилы вы не справитесь с главной угрозой.',
    'Вы совершаете ошибку. Я единственный кто знает как работать с оборудованием бункера в критической ситуации.',
    'Хорошо, мои слабости реальны. Но назовите хотя бы ОДНОГО кто полностью заменит мой набор навыков. Никто не может.',
    'Я понимаю логику голосования. Но давайте честно — кто из оставшихся закроет мою специализацию?',
  ],
  final: [
    'Что ж, игра сыграна. Я дал всё что мог. Посмотрим насколько хорошо бункер справится без меня.',
    'Интересный опыт. Логика выживания — жестокая штука. Удачи тем кто остался.',
    'Я мог бы сделать больше если бы дали шанс. Но такова игра. Впереди — настоящее испытание.',
  ],
};

function getDemoSpeech(phase: GamePhase, targetName?: string): string {
  let pool: string[];
  if (phase === 'voting') pool = DEMO_SPEECHES.voting;
  else if (phase === 'defense') pool = DEMO_SPEECHES.defense;
  else if (phase === 'final' || phase === 'ended') pool = DEMO_SPEECHES.final;
  else pool = DEMO_SPEECHES.playing;

  let text = randomFrom(pool);
  if (targetName) text = text.replace(/%TARGET%/g, targetName);
  else text = text.replace(/%TARGET%/g, 'следующего игрока');
  return text;
}

// ─── ИНТЕРФЕЙС ОТВЕТА ───────────────────────────────────────
export interface AiResponse {
  text: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  error?: string;
}

// ─── ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ──────────────────────────────
export async function generateSpeech(params: {
  player: Player;
  allPlayers: Player[];
  disaster: Disaster;
  phase: GamePhase;
  round: number;
  history: Array<{ name: string; text: string }>;
  targetPlayer?: Player; // для голосования
  apiConfig: ApiConfig;
  apiMode: 'demo' | 'real';
}): Promise<AiResponse> {
  const { player, allPlayers, disaster, phase, round, history, targetPlayer, apiConfig, apiMode } = params;

  // Контекст других игроков (только раскрытые карты)
  const othersContext = allPlayers
    .filter(p => p.id !== player.id)
    .map(p => {
      const revealed = p.revealedCards
        .map(k => `${CARD_LABELS[k]}: ${p.cards[k]}`)
        .join(', ');
      return `${p.name}: ${revealed || 'ничего не раскрыто'}`;
    })
    .join('\n');

  // Скользящее окно — последние 8 сообщений
  const recentHistory = history.slice(-8)
    .map(h => `${h.name}: "${h.text}"`)
    .join('\n');

  const revealedCards: Partial<typeof player.cards> = {};
  player.revealedCards.forEach(k => {
    (revealedCards as Record<string, string>)[k] = player.cards[k];
  });

  const systemPrompt = buildSystemPrompt({
    playerName: player.name,
    disaster,
    revealedCards,
    allRevealedCards: othersContext + (recentHistory ? `\n\nПоследние реплики:\n${recentHistory}` : ''),
    phase,
    round,
    isAccused: player.state === 'accused',
    specialCondition: player.specialConditionPlayed ? undefined : player.cards.specialCondition,
  });

  // ─── ДЕМО РЕЖИМ ─────────────────────────────────────────
  if (apiMode === 'demo') {
    // Имитация задержки API
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const text = getDemoSpeech(phase, targetPlayer?.name);
    return {
      text,
      promptTokens: estimateTokens(systemPrompt),
      completionTokens: estimateTokens(text),
      model: 'demo',
    };
  }

  // ─── РЕАЛЬНЫЙ РЕЖИМ ─────────────────────────────────────
  const model = player.aiModel;
  try {
    return await callRealApi(model, systemPrompt, apiConfig);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      text: `[Ошибка API: ${msg}] ` + getDemoSpeech(phase, targetPlayer?.name),
      promptTokens: 0,
      completionTokens: 0,
      model,
      error: msg,
    };
  }
}

// ─── ВЫЗОВ РЕАЛЬНОГО API ────────────────────────────────────
async function callRealApi(
  model: string,
  systemPrompt: string,
  cfg: ApiConfig,
): Promise<AiResponse> {
  // Gemini
  if (model === 'gemini' || model === 'gemma') {
    const geminiModel = model === 'gemma' ? 'gemma-3-27b-it' : 'gemini-2.0-flash';
    const key = model === 'gemma' ? cfg.gemma.key : cfg.gemini.key;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '...';
    const usage = data.usageMetadata ?? {};
    return {
      text: text.trim(),
      promptTokens: usage.promptTokenCount ?? estimateTokens(systemPrompt),
      completionTokens: usage.candidatesTokenCount ?? estimateTokens(text),
      model: geminiModel,
    };
  }

  // OpenAI-совместимые: DeepSeek, Groq, Mistral, OpenRouter, GigaChat
  const openaiCompatible: Record<string, { url: string; key: string; model: string }> = {
    deepseek: {
      url: 'https://api.deepseek.com/v1/chat/completions',
      key: cfg.deepseek.key,
      model: cfg.deepseek.model || 'deepseek-chat',
    },
    groq: {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: cfg.groq.key,
      model: cfg.groq.model || 'llama-3.1-8b-instant',
    },
    mistral: {
      url: 'https://api.mistral.ai/v1/chat/completions',
      key: cfg.mistral.key,
      model: cfg.mistral.model || 'mistral-small-latest',
    },
    openrouter: {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: cfg.openrouter.key,
      model: cfg.openrouter.model || 'meta-llama/llama-3.1-8b-instruct:free',
    },
    gigachat: {
      url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      key: cfg.gigachat.key,
      model: cfg.gigachat.model || 'GigaChat',
    },
  };

  if (openaiCompatible[model]) {
    const { url, key, model: modelName } = openaiCompatible[model];
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${model} HTTP ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '...';
    const usage = data.usage ?? {};
    return {
      text: text.trim(),
      promptTokens: usage.prompt_tokens ?? estimateTokens(systemPrompt),
      completionTokens: usage.completion_tokens ?? estimateTokens(text),
      model: modelName,
    };
  }

  // YandexGPT
  if (model === 'yandex') {
    const res = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.yandex.iamToken}`,
        'x-folder-id': cfg.yandex.folderId,
      },
      body: JSON.stringify({
        modelUri: `gpt://${cfg.yandex.folderId}/yandexgpt-lite`,
        completionOptions: { stream: false, temperature: 0.9, maxTokens: 200 },
        messages: [{ role: 'user', text: systemPrompt }],
      }),
    });
    if (!res.ok) throw new Error(`YandexGPT HTTP ${res.status}`);
    const data = await res.json();
    const text = data.result?.alternatives?.[0]?.message?.text ?? '...';
    const usage = data.result?.usage ?? {};
    return {
      text: text.trim(),
      promptTokens: usage.inputTextTokens ?? 0,
      completionTokens: usage.completionTokens ?? 0,
      model: 'yandexgpt-lite',
    };
  }

  throw new Error(`Неизвестная модель: ${model}`);
}

// ─── СТОИМОСТЬ ТОКЕНОВ (приблизительно) ─────────────────────
const TOKEN_COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash':         { input: 0.007,  output: 0.028 },   // $
  'gemma-3-27b-it':           { input: 0.0,     output: 0.0 },     // бесплатно через AI Studio
  'deepseek-chat':            { input: 0.00027, output: 0.0011 },  // $
  'llama-3.1-8b-instant':     { input: 0.0,     output: 0.0 },     // Groq бесплатно
  'mistral-small-latest':     { input: 0.002,   output: 0.006 },   // $
  'meta-llama/llama-3.1-8b-instruct:free': { input: 0.0, output: 0.0 },
  'GigaChat':                 { input: 0.0,     output: 0.0 },     // тариф Сбера
  'yandexgpt-lite':           { input: 0.001,   output: 0.001 },   // условно
  'demo':                     { input: 0.0,     output: 0.0 },
};

const USD_TO_RUB = 90;

export function calcCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates = TOKEN_COST_PER_1K[model] ?? { input: 0.001, output: 0.003 };
  return ((promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output) * USD_TO_RUB;
}
