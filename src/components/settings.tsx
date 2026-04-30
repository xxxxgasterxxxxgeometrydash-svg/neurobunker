import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";

export default function Settings() {
  const {
    players,
    availableVoices,
    setPlayerVoice,
  } = useGameStore();

  const [volume, setVolume] = useState(0.4);

  // ─── ЗАГРУЗКА СОХРАНЁННОЙ ГРОМКОСТИ ───
  useEffect(() => {
    const saved = localStorage.getItem("musicVolume");
    if (saved) setVolume(Number(saved));
  }, []);

  // ─── ИЗМЕНЕНИЕ ГРОМКОСТИ ───
  const changeVolume = (v: number) => {
    setVolume(v);
    localStorage.setItem("musicVolume", String(v));

    // 🔥 сразу применяем ко всем audio
    document.querySelectorAll("audio").forEach((a: any) => {
      a.volume = v;
    });
  };

  return (
    <div className="p-4 bg-black/80 backdrop-blur-md text-white rounded-xl w-[320px] border border-white/10 shadow-xl">
      
      {/* ─── ЗАГОЛОВОК ─── */}
      <div className="text-lg font-bold mb-4">⚙️ Настройки</div>

      {/* ─── ГРОМКОСТЬ ─── */}
      <div className="mb-5">
        <div className="text-sm text-gray-300 mb-2">
          🔊 Громкость музыки: {Math.round(volume * 100)}%
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>

      {/* ─── ВЫБОР ГОЛОСОВ ─── */}
      <div className="mb-2 text-sm text-gray-300">
        🎤 Голоса игроков:
      </div>

      <div className="max-h-[250px] overflow-y-auto pr-1">
        {players.map((player) => (
          <div key={player.id} className="mb-3">
            
            <div className="text-xs mb-1 font-bold flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              {player.name}
            </div>

            <select
              value={player.voiceId || ""}
              onChange={(e) =>
                setPlayerVoice(player.id, e.target.value)
              }
              className="w-full text-xs bg-gray-900 border border-white/10 rounded px-2 py-1"
            >
              <option value="">Стандартный</option>

              {availableVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}