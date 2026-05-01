import { useEffect, useState } from "react";
import {
  loadVoices,
  setVoice,
  getVoice,
  speak,
  VoiceOption,
} from "../lib/tts";

// Убрали default, чтобы импорт { Settings } в Overlay не ломался
export function Settings() {
  const [volume, setVolume] = useState(0.4);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [open, setOpen] = useState(false); // По умолчанию закрыто, чтобы не мешать
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    const v = Number(localStorage.getItem("musicVolume") ?? "0.4");
    setVolume(v);
    // Сразу применяем громкость при загрузке
    window.dispatchEvent(new Event("volumeChanged"));
  }, []);

  useEffect(() => {
    let mounted = true;
    loadVoices().then((v) => {
      if (!mounted) return;
      setVoices(v);
      setVoicesLoaded(true);
      const saved = getVoice();
      if (saved) {
        setSelectedVoice(saved);
      } else if (v.length > 0) {
        setSelectedVoice(v[0].id);
      }
    });
    return () => { mounted = false; };
  }, []);

  function handleVolumeChange(v: number) {
    setVolume(v);
    localStorage.setItem("musicVolume", String(v));
    // Генерируем событие, чтобы MusicListener.ts мгновенно изменил звук
    window.dispatchEvent(new Event("volumeChanged"));
  }

  function handleVoiceChange(id: string) {
    setSelectedVoice(id);
    setVoice(id);
    localStorage.setItem("selectedVoice", id); // Сохраняем выбор
  }

  function handleTestVoice() {
    if (!voicesLoaded) return;
    speak("Проверка связи в нейробункере. Как слышно?", selectedVoice);
  }

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-black/80 hover:bg-white/20 text-white w-10 h-10 rounded-full border border-white/20 shadow-xl backdrop-blur-md transition-all"
      >
        ⚙️
      </button>

      {open && (
        <div className="mt-2 w-80 bg-slate-900/95 backdrop-blur-lg text-white rounded-2xl p-5 shadow-2xl border border-white/10 space-y-5 animate-in fade-in zoom-in duration-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Настройки системы</h3>

          {/* 🔊 ГРОМКОСТЬ */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase opacity-60">
              <span>Громкость музыки</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.01}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 shadow-inner"
            />
          </div>

          {/* 🎤 ГОЛОС */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase opacity-60">Голос ИИ (Общий)</div>
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full bg-slate-800 border border-white/5 text-white text-xs rounded-xl p-3 outline-none focus:ring-2 ring-blue-500/50"
            >
              {!voicesLoaded && <option>Загрузка голосов...</option>}
              {voices.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTestVoice}
            disabled={!voicesLoaded}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            ▶️ ТЕСТ ОЗВУЧКИ
          </button>
        </div>
      )}
    </div>
  );
}
