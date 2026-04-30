import React from "react";

export default function Kolobok({ player, isSpeaking }: any) {
  let src = "/assets/sprites/kolobok_idle.png";

  if (!player.isAlive) {
    src = isSpeaking
      ? "/assets/sprites/kolobok_dead_talk.png"
      : "/assets/sprites/kolobok_dead_idle.png";
  } else if (player.isAccused) {
    src = isSpeaking
      ? "/assets/sprites/kolobok_accused_talk.png"
      : "/assets/sprites/kolobok_accused_idle.png";
  } else {
    src = isSpeaking
      ? "/assets/sprites/kolobok_talk.png"
      : "/assets/sprites/kolobok_idle.png";
  }

  return <img src={src} style={{ width: 120 }} />;
}
