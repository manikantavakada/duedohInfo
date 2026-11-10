import { useEffect, useRef, useState } from "react";

const SEEN_KEY = "duedoh_intro_video_seen_v1";
const VIDEO_URL = "https://www.duedoh.com/assets/IntroDuedoh.mp4";

export default function IntroVideo() {
  const [open, setOpen] = useState(false);
  const player = useRef(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch (_) {
      // Storage may be unavailable in strict privacy mode.
    }
    if (seen) return undefined;

    setOpen(true);
    document.body.classList.add("intro-video-open");
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch (_) {}
    window.requestAnimationFrame(() => player.current?.play().catch(() => {}));

    return () => document.body.classList.remove("intro-video-open");
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    player.current?.pause();
    setOpen(false);
    document.body.classList.remove("intro-video-open");
  };

  if (!open) return null;

  return (
    <div className="intro-modal" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <button className="intro-backdrop" type="button" onClick={close} aria-label="Skip intro video" />
      <div className="intro-card">
        <div className="intro-heading">
          <div>
            <p>Welcome to Duedoh</p>
            <h2 id="intro-title">See how Duedoh works</h2>
          </div>
          <button className="intro-close" type="button" onClick={close} aria-label="Skip intro video">×</button>
        </div>
        <video ref={player} src={VIDEO_URL} controls muted playsInline preload="metadata" onEnded={close} aria-label="Introduction to Duedoh" />
        <div className="intro-actions">
          <span>Video starts muted. Use the player control to turn on sound.</span>
          <button type="button" onClick={close}>Continue to website</button>
        </div>
      </div>
    </div>
  );
}
