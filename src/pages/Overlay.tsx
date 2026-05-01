import { useEffect, useState, useRef } from 'react';
import { subscribeToBroadcast } from '../lib/broadcast';
import { loadVoices } from "../lib/tts";
import { createVoiceProfile } from "../lib/voiceProfiles";
import { setPlayerVoice } from "../lib/voiceManager";
import { clearVoices } from "../lib/voiceManager";
import { speak } from "../lib/tts";
import { getPlayerVoice } from "../lib/voiceManager";
import type { SaveState, MusicState, Player } from '../types/game';
const [musicState, setMusicState] = useState<MusicState>('silence');
import Settings from "../components/Settings";
// ─── КОЛОБОК SVG (placeholder пока нет спрайтов) ─────────────
function KolobokSVG({ color, state }: { color: string; state: string }) {
  const isAlive = state !== 'eliminated';
  const isTalking = state === 'alive' && false; // управляется анимацией
  if (!players || players.length === 0) {
    return (
      <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>📡 ОЖИДАНИЕ ПОДКЛЮЧЕНИЯ...</h1>
          <p style={{ opacity: 0.5 }}>Запусти панель управления, чтобы передать данные</p>
        </div>
      </div>
    );
  }
  return (
    <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-lg">
      {/* Тело */}
      <ellipse
        cx="40" cy="55" rx="32" ry="30"
        fill={isAlive ? color : '#555'}
        opacity={isAlive ? 1 : 0.5}
      />
      {/* Голова */}
      <circle
        cx="40" cy="30" r="22"
        fill={isAlive ? color : '#555'}
        opacity={isAlive ? 1 : 0.5}
      />
      {/* Глаза */}
      {isAlive ? (
        <>
          <circle cx="32" cy="26" r="4" fill="white" />
          <circle cx="48" cy="26" r="4" fill="white" />
          <circle cx="33" cy="27" r="2" fill="#1a1a1a" />
          <circle cx="49" cy="27" r="2" fill="#1a1a1a" />
          {/* Highlight */}
          <circle cx="34" cy="26" r="0.8" fill="white" />
          <circle cx="50" cy="26" r="0.8" fill="white" />
        </>
      ) : (
        <>
          {/* Мёртвые глаза — крестики */}
          <line x1="29" y1="23" x2="35" y2="29" stroke="white" strokeWidth="2" />
          <line x1="35" y1="23" x2="29" y2="29" stroke="white" strokeWidth="2" />
          <line x1="45" y1="23" x2="51" y2="29" stroke="white" strokeWidth="2" />
          <line x1="51" y1="23" x2="45" y2="29" stroke="white" strokeWidth="2" />
        </>
      )}
      {/* Рот */}
      {isAlive && (
        isTalking
          ? <ellipse cx="40" cy="36" rx="5" ry="4" fill="#1a1a1a" />
          : <path d="M 33 37 Q 40 42 47 37" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* Тень */}
      <ellipse cx="40" cy="88" rx="20" ry="5" fill="black" opacity="0.2" />
    </svg>
  );
}
console.log("SPEAK:", text);
// ─── СОСТОЯНИЯ АНИМАЦИИ КОЛОБКА ──────────────────────────────
// Внутри useEffect в Overlay.tsx
subscribeToBroadcast((event) => {
  if (event.type === 'SPEAKING_START') {
    const player = gameState.players.find(p => p.id === event.speakingId);
    
    // Передаем в speak текст и voiceId игрока
    // voiceId нужно добавить в структуру Player в вашем store.ts
    speak(event.text, player?.voiceId); 
    
    setSpeakingId(event.speakingId);
    setSpeechText(event.text);
  }
});

// idle → тихое покачивание
// talk → быстрое движение
// accused → дрожание
// scared → нервное движение
// eliminated → затемнён, не анимирован
// winner → радостное подпрыгивание

function getKolobokAnimation(state: string, isSpeaking: boolean): string {
  if (state === 'eliminated') return '';
  if (isSpeaking) return 'animate-[kolobokTalk_0.3s_ease-in-out_infinite_alternate]';
  if (state === 'accused') return 'animate-[kolobokShake_0.4s_ease-in-out_infinite_alternate]';
  if (state === 'scared') return 'animate-[kolobokShake_0.6s_ease-in-out_infinite_alternate]';
  if (state === 'winner') return 'animate-[kolobokBounce_0.5s_ease-in-out_infinite_alternate]';
  return 'animate-[kolobokIdle_3s_ease-in-out_infinite_alternate]';
}

// ─── КОМПОНЕНТ КОЛОБКА ──────────────────────────────────────
function KolobokCharacter({
  player,
  isSpeaking,
  speechText,
}: {
  player: Player;
  isSpeaking: boolean;
  speechText: string;
}) {
  const anim = getKolobokAnimation(player.state, isSpeaking);
  if (!players || players.length === 0) {
    return (
      <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>📡 ОЖИДАНИЕ ПОДКЛЮЧЕНИЯ...</h1>
          <p style={{ opacity: 0.5 }}>Запусти панель управления, чтобы передать данные</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `${player.overlayX}%`,
        top: `${player.overlayY}%`,
        transform: 'translateX(-50%)',
        width: '120px',
      }}
    >
      {/* Речевой пузырь */}
      {isSpeaking && speechText && (
        <div className="mb-2 relative max-w-[200px] min-w-[120px]">
          <div className="bg-white text-black text-xs font-medium px-3 py-2 rounded-2xl rounded-bl-none shadow-xl leading-tight">
            {speechText.slice(0, 120)}{speechText.length > 120 ? '...' : ''}
          </div>
          {/* Хвостик пузыря */}
          <div
            className="absolute bottom-0 left-3 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '0px solid transparent',
              borderTop: '8px solid white',
              bottom: '-7px',
            }}
          />
        </div>
      )}

      {/* Колобок */}
      <div
        className={`w-20 h-24 ${anim} ${player.state === 'eliminated' ? 'opacity-40 grayscale' : ''} ${
          isSpeaking ? 'drop-shadow-[0_0_15px_rgba(255,220,0,0.8)]' : ''
        }`}
        style={{
          filter: player.state === 'accused'
            ? `drop-shadow(0 0 10px rgba(255,100,0,0.8))`
            : isSpeaking
            ? `drop-shadow(0 0 12px ${player.color})`
            : undefined,
        }}
      >
        <KolobokSVG color={player.color} state={player.state} />
      </div>

      {/* Имя */}
      <div
        className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-md ${
          player.state === 'eliminated' ? 'opacity-40' : ''
        }`}
        style={{ backgroundColor: player.color + 'cc', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {player.name}
      </div>

      {/* Статус под именем */}
      {player.state === 'accused' && (
        <div className="text-xs text-orange-300 font-bold mt-0.5 animate-pulse">⚖️ ОБВИНЯЕТСЯ</div>
      )}
      {player.state === 'eliminated' && (
        <div className="text-xs text-red-400 mt-0.5">💀 ИЗГНАН</div>
      )}
      {player.state === 'winner' && (
        <div className="text-xs text-yellow-300 font-bold mt-0.5">🏆 В БУНКЕРЕ</div>
      )}
    </div>
  );
}

// ─── ФОНЫ ПО КАТАСТРОФЕ ──────────────────────────────────────
function getBackground(disasterTitle: string | undefined, phase: string): string {
  if (phase === 'final' || phase === 'ended') {
    return 'from-yellow-950 via-gray-950 to-gray-950';
  }
  if (!disasterTitle) return 'from-gray-950 via-gray-900 to-gray-950';

  const t = disasterTitle.toLowerCase();
  if (t.includes('ядер') || t.includes('радиа')) return 'from-green-950 via-gray-950 to-gray-950';
  if (t.includes('вирус') || t.includes('пандем') || t.includes('зомби')) return 'from-purple-950 via-gray-950 to-gray-950';
  if (t.includes('астер') || t.includes('вулкан') || t.includes('потоп')) return 'from-orange-950 via-gray-950 to-gray-950';
  if (t.includes('ии') || t.includes('искусственн')) return 'from-cyan-950 via-gray-950 to-gray-950';
  if (t.includes('солнеч') || t.includes('коллапс')) return 'from-yellow-950 via-gray-950 to-gray-950';
  if (t.includes('инопланет')) return 'from-indigo-950 via-gray-950 to-gray-950';
  return 'from-gray-950 via-gray-900 to-gray-950';
}
function MusicPlayer({ musicState }: { musicState: MusicState }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);

  const musicFiles: Record<MusicState, string[]> = {
    discussion: [
      '/assets/music/discussion_1.ogg',
      '/assets/music/discussion_2.ogg',
      '/assets/music/discussion_3.ogg',
      '/assets/music/discussion_4.ogg',
      '/assets/music/discussion_5.ogg',
    ],
    disaster:   ['/assets/music/disaster.ogg'],
    elimination:['/assets/music/elimination.ogg'],
    victory:    ['/assets/music/victory.ogg'],
    defeat:     ['/assets/music/defeat.ogg'],
    silence:    [],
  };
  useEffect(() => {
    if (!gameState) return;
    loadVoices().then((voices) => {
      gameState.players.forEach(p => {
        setPlayerVoice(p.id, createVoiceProfile(p.id, voices));
      });
    });
  }, [gameState]);
  useEffect(() => {
    const files = musicFiles[musicState];

    if (!files || files.length === 0) {
      audioRef.current?.pause();
      return;
    }

    const idx = musicState === 'discussion'
      ? currentTrack % files.length
      : 0;

    const src = files[idx];

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    } else {
      // ❗ ВАЖНО — НЕ ПЕРЕЗАПУСКАТЬ ЕСЛИ ТРЕК ТОТ ЖЕ
      if (audioRef.current.src.includes(src)) return;
      audioRef.current.src = src;
    }

    audioRef.current.loop = musicState !== 'discussion';
    const volume = Number(localStorage.getItem('musicVolume') ?? '0.4');
    audioRef.current.volume = volume;

    audioRef.current.play().catch(() => {});

    audioRef.current.onended = () => {
      if (musicState === 'discussion') {
        setTimeout(() => {
          setCurrentTrack(t => t + 1);
        }, 5000);
      }
    };

  }, [musicState, currentTrack]);

  return null;
}
// ─── ГЛАВНАЯ СТРАНИЦА OVERLAY ────────────────────────────────
export default function Overlay() {
  const [gameState, setGameState] = useState<SaveState | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechText, setSpeechText] = useState('');

  useEffect(() => {
    const unsub = subscribeToBroadcast(msg => {
      switch (msg.type) {
        case 'STATE_UPDATE':
          setGameState(msg.payload);
          break;
	case 'MUSIC_CHANGE':
          setMusicState(msg.payload);
          break;
	case 'SPEAKING_START':
	  setSpeakingId(msg.payload.playerId);
	  setSpeechText(msg.payload.text);
 	 const playerId = msg.payload.playerId;
  	const text = msg.payload.text;
	  const profile = getPlayerVoice(playerId);
	  speak(text, profile?.voiceId);
	  break;
        case 'SPEAKING_END':
          setSpeakingId(null);
          setSpeechText('');
          break;
        case 'PLAYER_ELIMINATED':
          // состояние уже придёт в STATE_UPDATE
          break;
        case 'GAME_RESET':
          clearVoices();
          setGameState(null);
          setSpeakingId(null);
          setSpeechText('');
          setMusicState('silence');
          break;
      }
    });
    return unsub;
  }, []);

  const bgGradient = getBackground(gameState?.disaster?.title, gameState?.phase ?? '');

  if (!gameState || gameState.phase === 'setup') {
    return (
      <div className={`w-screen h-screen bg-gradient-to-br ${bgGradient} flex items-center justify-center overflow-hidden`}>
        <div className="text-center">
          <div className="text-8xl mb-4">🏠</div>
          <div className="text-5xl font-black text-yellow-400 mb-2">НейроБункер</div>
          <div className="text-xl text-gray-400">Ожидание начала игры...</div>
          <div className="mt-6 flex justify-center gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="text-4xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                🤖
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { players, disaster, phase, round, survivorsTarget, eliminatedPlayerIds } = gameState;

  // Финальный экран
  if (phase === 'ended' || phase === 'final') {
    const survivors = players.filter(p => p.state !== 'eliminated');
    const eliminated = players.filter(p => p.state === 'eliminated');

    return (
      <div className={`w-screen h-screen bg-gradient-to-br from-yellow-950 via-gray-950 to-gray-950 flex flex-col items-center justify-center overflow-hidden`}>
        <div className="text-6xl mb-4">🏆</div>
        <div className="text-4xl font-black text-yellow-400 mb-2">ИГРА ОКОНЧЕНА</div>
        <div className="text-lg text-gray-300 mb-8">Катастрофа: {disaster?.title}</div>
        <div className="grid grid-cols-2 gap-8 max-w-2xl w-full px-8">
          <div className="bg-green-900/50 rounded-2xl p-5 border border-green-600">
            <div className="text-sm font-bold text-green-400 mb-3">🏠 В БУНКЕРЕ ({survivors.length} / {survivorsTarget})</div>
            {survivors.map(p => (
              <div key={p.id} className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-green-200 font-medium">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="bg-red-900/30 rounded-2xl p-5 border border-red-800">
            <div className="text-sm font-bold text-red-400 mb-3">💀 ИЗГНАНЫ ({eliminated.length})</div>
            {eliminated.map(p => (
              <div key={p.id} className="flex items-center gap-2 mb-2 opacity-70">
                <div className="w-4 h-4 rounded-full grayscale" style={{ backgroundColor: p.color }} />
                <span className="text-red-300">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!players || players.length === 0) {
    return (
      <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>📡 ОЖИДАНИЕ ПОДКЛЮЧЕНИЯ...</h1>
          <p style={{ opacity: 0.5 }}>Запусти панель управления, чтобы передать данные</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Settings />
      <div className={`w-screen h-screen bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
      <MusicPlayer musicState={musicState} />
        {/* Звёздный фон (декоративный) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
		{/* Строка 364 */}
		{[...Array(30)].map((_, i) => (
		  <React.Fragment key={i}> 
		    <div
		      className="absolute w-1 h-1 bg-white rounded-full opacity-20"
		      style={{
		        left: `${Math.random() * 100}%`,
		        top: `${Math.random() * 100}%`,
		        animationDelay: `${Math.random() * 3}s`,
		      }}
		    />
		  </React.Fragment>
		))}
              </div>
      {/* Верхняя полоса — статус */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-yellow-400 font-black text-lg">🏠 НейроБункер</span>
          <span className="text-red-300 text-sm border border-red-800 bg-red-950/50 px-3 py-1 rounded-full">
            ☢️ {disaster?.title}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Раунд <span className="text-white font-bold">{round}/5</span></span>
          <span className="text-gray-400">В игре: <span className="text-green-400 font-bold">{players.filter(p => p.state !== 'eliminated').length}</span></span>
          <span className="text-gray-400">Мест: <span className="text-blue-400 font-bold">{survivorsTarget}</span></span>
          <span className="text-gray-400">Изгнано: <span className="text-red-400 font-bold">{eliminatedPlayerIds.length}</span></span>
        </div>
      </div>

      {/* Пол / сцена */}
      <div
        className="absolute bottom-16 left-0 right-0 h-20 opacity-30"
        style={{
          background: 'linear-gradient(to top, rgba(80,40,0,0.8), transparent)',
        }}
      />

      {/* Колобки */}
      <div className="absolute inset-0 pt-14 pb-16">
        {players.map(player => (
          <KolobokCharacter
            key={player.id}
            player={player}
            isSpeaking={player.id === speakingId}
            speechText={player.id === speakingId ? speechText : ''}
          />
        ))}
      </div>

      {/* Нижняя полоса — текущее событие */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-black/70 backdrop-blur-sm border-t border-white/10 flex items-center gap-4">
        {speakingId && (
          <>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: players.find(p => p.id === speakingId)?.color ?? '#fff' }}
              />
              <span className="text-white font-bold text-sm">
                {players.find(p => p.id === speakingId)?.name}:
              </span>
            </div>
            <div className="text-gray-200 text-sm italic flex-1 line-clamp-1">«{speechText}»</div>
          </>
        )}
        {!speakingId && (
          <div className="text-gray-500 text-sm italic">
            {phase === 'voting' ? '🗳️ Идёт голосование...' :
             phase === 'defense' ? '🛡️ Защитная речь...' :
             (phase as string) === 'final' ? '🏁 Финал игры' :
             '⏳ Ожидание следующего хода...'}
          </div>
        )}
        <div className="ml-auto flex-shrink-0 text-xs text-gray-600">
          {phase === 'voting' && '⚖️ ГОЛОСОВАНИЕ'}
          {phase === 'playing' && `📢 Раунд ${round}`}
          {phase === 'defense' && '🛡️ ЗАЩИТА'}
        </div>
      </div>

      {/* CSS анимации через style-тег */}
      <style>{`
        @keyframes kolobokIdle {
          from { transform: translateY(0px) rotate(-1deg); }
          to   { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes kolobokTalk {
          from { transform: translateY(0px) scaleY(1); }
          to   { transform: translateY(-3px) scaleY(1.05); }
        }
        @keyframes kolobokShake {
          from { transform: translateX(-4px) rotate(-2deg); }
          to   { transform: translateX(4px) rotate(2deg); }
        }
        @keyframes kolobokBounce {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-12px) scale(1.05); }
        }
      `}</style>
    </div>
    </>
  );
}
