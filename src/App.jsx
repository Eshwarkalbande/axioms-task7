import React, { useEffect, useState } from "react";

const COLORS = [
  { name: "Warm", value: "#ffb300" },
  { name: "White", value: "#bcd4ff" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Pink", value: "#f472b6" },
  { name: "Green", value: "#4ade80" },
];
const TIMERS = [
  { label: "Off", secs: 0 },
  { label: "1 min", secs: 60 },
  { label: "5 min", secs: 300 },
  { label: "10 min", secs: 600 },
];
const DUST = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37) % 100,
  s: 2 + (i % 3),
  d: ((i * 0.37) % 4).toFixed(2),
  t: 3 + (i % 4),
}));
const KEY = "light-toggle-state";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function LightToggle() {
  const saved = load();
  const [on, setOn] = useState(!!saved.on);
  const [color, setColor] = useState(
    COLORS.find((c) => c.name === saved.color) ||
      (saved.colorValue ? { name: "Custom", value: saved.colorValue } : COLORS[0])
  );
  const [hex, setHex] = useState(color.value);
  const [bright, setBright] = useState(saved.bright ?? 80);
  const [timerSecs, setTimerSecs] = useState(0);
  const [customT, setCustomT] = useState("2");
  const [unit, setUnit] = useState("min");
  const [left, setLeft] = useState(null);

  const toggle = () => {
    setOn((v) => !v);
  };

  const applyHex = (v) => {
    setHex(v);
    if (/^#[0-9a-f]{6}$/i.test(v)) setColor({ name: "Custom", value: v.toLowerCase() });
  };

  const applyTimer = (e) => {
    e.preventDefault();
    const n = Math.floor(Number(customT));
    if (!(n > 0)) return;
    setTimerSecs(Math.min(86400, n * (unit === "min" ? 60 : 1)));
  };

  // keep hex box in sync when a preset is picked
  useEffect(() => setHex(color.value), [color]);

  // remember settings
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ on, color: color.name, colorValue: color.value, bright }));
    } catch {}
  }, [on, color, bright]);

  // keyboard shortcut: L
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "l") toggle();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // auto-off timer
  useEffect(() => {
    if (!on || !timerSecs) {
      setLeft(null);
      return;
    }
    setLeft(timerSecs);
    const id = setInterval(() => setLeft((l) => (l === null ? l : l <= 1 ? 0 : l - 1)), 1000);
    return () => clearInterval(id);
  }, [on, timerSecs]);

  useEffect(() => {
    if (left === 0) {
      setOn(false);
      setLeft(null);
    }
  }, [left]);

  return (
    <>
      <style>{css}</style>
      <div className={`lt-page ${on ? "is-on" : ""}`} style={{ "--lc": color.value, "--b": bright / 100 }}>
        <div className="lt">
          {/* 3D scene */}
          <div className="lt-scene">
            <div className="lt-glow" aria-hidden="true" />
            <div className="lt-swing">
              <div className="lt-beam" aria-hidden="true" />
              <div className="lt-dust" aria-hidden="true">
                {DUST.map((d, i) => (
                  <i key={i} style={{ "--x": d.x, "--s": `${d.s}px`, "--d": `${d.d}s`, "--t": `${d.t}s` }} />
                ))}
              </div>
              <svg className="lt-bulb" viewBox="0 0 140 190" onClick={toggle} aria-hidden="true">
                  <defs>
                    <radialGradient id="ltGlass" cx="38%" cy="35%" r="75%">
                      <stop offset="0%" className="g0" />
                      <stop offset="55%" className="g1" />
                      <stop offset="100%" className="g2" />
                    </radialGradient>
                    <radialGradient id="ltCore" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="ltMetal" x1="0" x2="1">
                      <stop offset="0%" stopColor="#5b6279" />
                      <stop offset="35%" stopColor="#e9edf7" />
                      <stop offset="65%" stopColor="#9aa3bb" />
                      <stop offset="100%" stopColor="#4a5066" />
                    </linearGradient>
                  </defs>
                  <line x1="70" y1="-60" x2="70" y2="14" className="lt-cord" />
                  <rect x="54" y="12" width="32" height="22" rx="5" fill="url(#ltMetal)" />
                  <rect x="52" y="32" width="36" height="42" rx="4" fill="url(#ltMetal)" />
                  {[42, 50, 58, 66].map((y) => (
                    <line key={y} x1="52" y1={y} x2="88" y2={y} className="lt-thread" />
                  ))}
                  <path
                    className="lt-glass"
                    fill="url(#ltGlass)"
                    d="M54 74h32c0 10 20 20 20 48a36 36 0 0 1-72 0c0-28 20-38 20-48z"
                  />
                  <circle className="lt-core" cx="70" cy="118" r="30" fill="url(#ltCore)" />
                  <path className="lt-wire" d="M62 74V104M78 74V104" />
                  <path className="lt-filament" d="M58 128V106l12 10 12-10v22" />
                  <ellipse cx="50" cy="108" rx="6" ry="16" transform="rotate(18 50 108)" className="lt-shine" />
                  <circle cx="56" cy="90" r="3" className="lt-shine" />
                </svg>
            </div>
            <div className="lt-floor" aria-hidden="true" />
          </div>

          {/* status */}
          <div className="lt-statusrow">
            <span className="lt-dot" aria-hidden="true" />
            <h2 className="lt-status">Light is {on ? "ON" : "OFF"}</h2>
          </div>
          <p className="lt-sub">
            {on && left !== null ? `Auto-off in ${fmt(left)}` : "Press L or click the bulb to toggle"}
          </p>

          {/* 3D switch */}
          <button className="lt-switch" role="switch" aria-checked={on} aria-label="Toggle light" onClick={toggle}>
            <span className="lt-knob" />
          </button>

          {/* controls */}
          <div className="lt-controls">
            <div className="lt-group">
              <span className="lt-label">Colour</span>
              <div className="lt-colors" role="group" aria-label="Light colour">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    className={color.name === c.name ? "on" : ""}
                    style={{ "--dot": c.value }}
                    onClick={() => setColor(c)}
                    aria-label={c.name}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="lt-manual">
                <label className="lt-picker" style={{ "--dot": color.value }} title="Pick any colour">
                  <input
                    type="color"
                    value={color.value}
                    onChange={(e) => applyHex(e.target.value)}
                    aria-label="Custom colour picker"
                  />
                </label>
                <input
                  className="lt-field lt-hex"
                  value={hex}
                  maxLength={7}
                  spellCheck="false"
                  placeholder="#ff00aa"
                  onChange={(e) => applyHex(e.target.value)}
                  aria-label="Hex colour code"
                />
                <span className="lt-tag">{color.name === "Custom" ? "Custom" : "Manual"}</span>
              </div>
            </div>

            <label className="lt-group lt-bright">
              <span className="lt-label">Brightness</span>
              <div className="lt-row">
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={bright}
                  onChange={(e) => setBright(Number(e.target.value))}
                  disabled={!on}
                />
                <b>{bright}%</b>
              </div>
            </label>

            <div className="lt-group">
              <span className="lt-label">Auto-off timer</span>
              <div className="lt-seg" role="group" aria-label="Auto-off timer">
                {TIMERS.map((t) => (
                  <button key={t.label} className={timerSecs === t.secs ? "on" : ""} onClick={() => setTimerSecs(t.secs)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <form className="lt-manual" onSubmit={applyTimer}>
                <input
                  className="lt-field lt-num"
                  type="number"
                  min="1"
                  value={customT}
                  onChange={(e) => setCustomT(e.target.value)}
                  aria-label="Custom timer value"
                />
                <select className="lt-field" value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Timer unit">
                  <option value="min">min</option>
                  <option value="sec">sec</option>
                </select>
                <button type="submit" className="lt-set">Set timer</button>
              </form>
              {timerSecs > 0 && (
                <p className="lt-note">
                  Timer set: {fmt(timerSecs)} {on ? "" : "(starts when the light is on)"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const css = `
.lt-page{
  --lc:#ffb300; --b:.8;
  position:relative; min-height:100vh; width:100%; box-sizing:border-box; padding:24px;
  display:grid; place-items:center; overflow:hidden; background:#000;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; color:#fff;
}
/* room glow across the whole page */
.lt-page::before{
  content:""; position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity .6s;
  background:radial-gradient(70% 55% at 50% 30%,color-mix(in srgb,var(--lc) 38%,transparent),transparent 70%);
}
.is-on.lt-page::before{opacity:var(--b)}
.lt-page *{color:#fff}

.lt{
  position:relative; width:min(400px,92vw); padding:22px; border-radius:30px;
  display:flex; flex-direction:column; align-items:center; gap:12px;
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.015));
  backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.14);
  box-shadow:0 30px 70px -20px rgba(0,0,0,.95), inset 0 1px 0 rgba(255,255,255,.1);
  transition:border-color .5s, box-shadow .5s;
}
.is-on .lt{
  border-color:color-mix(in srgb,var(--lc) 55%,transparent);
  box-shadow:0 0 50px -10px color-mix(in srgb,var(--lc) 60%,transparent), 0 30px 70px -20px rgba(0,0,0,.95), inset 0 1px 0 rgba(255,255,255,.12);
}

/* scene */
.lt-scene{
  position:relative; width:100%; height:340px; border-radius:24px; overflow:hidden; perspective:800px;
  background:radial-gradient(120% 90% at 50% 0%,#12151f 0%,#000 70%);
  box-shadow:inset 0 0 50px rgba(0,0,0,.9); transition:background .5s;
}
.is-on .lt-scene{background:radial-gradient(120% 90% at 50% 0%,#1d1830 0%,#000 75%)}
.lt-glow{
  position:absolute; left:50%; top:34%; width:360px; height:360px; margin:-180px 0 0 -180px; border-radius:50%;
  background:radial-gradient(circle,color-mix(in srgb,var(--lc) 70%,transparent) 0%,color-mix(in srgb,var(--lc) 22%,transparent) 42%,transparent 70%);
  opacity:0; transform:scale(.6); transition:opacity .5s, transform .5s;
}
.is-on .lt-glow{opacity:var(--b); transform:scale(1)}

.lt-tilt{position:absolute; inset:0; transform-style:preserve-3d; transform-origin:50% 0; transition:transform .15s ease-out}
.lt-swing{position:absolute; left:50%; top:0; width:150px; margin-left:-75px; transform-origin:50% 0; transform:rotate(0); animation:none}

.lt-bulb{position:relative; width:100%; height:auto; overflow:visible; cursor:pointer;
  filter:drop-shadow(0 14px 10px rgba(0,0,0,.7)); transition:filter .4s}
.is-on .lt-bulb{
  filter:drop-shadow(0 0 calc(34px*var(--b)) var(--lc)) drop-shadow(0 0 calc(10px*var(--b)) var(--lc));
  animation:ltFlick .8s linear;
}
@keyframes ltFlick{0%{opacity:.25}10%{opacity:1}18%{opacity:.35}28%{opacity:1}36%{opacity:.6}48%,100%{opacity:1}}
.lt-cord{stroke:#2b3042; stroke-width:3}
.lt-thread{stroke:rgba(0,0,0,.35); stroke-width:2}
.lt-glass{stroke:rgba(255,255,255,.18); stroke-width:1.5}
.g0{stop-color:#8a93ad; transition:stop-color .4s}
.g1{stop-color:#3a4156; transition:stop-color .4s}
.g2{stop-color:#1c2030; transition:stop-color .4s}
.is-on .g0{stop-color:#fff}
.is-on .g1{stop-color:color-mix(in srgb,var(--lc) 55%,#fff)}
.is-on .g2{stop-color:var(--lc)}
.lt-core{opacity:0; transition:opacity .4s}
.is-on .lt-core{opacity:var(--b)}
.lt-wire{fill:none; stroke:#6b7391; stroke-width:2}
.lt-filament{fill:none; stroke:#59607b; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; transition:stroke .4s}
.is-on .lt-filament{stroke:#fff}
.lt-shine{fill:#fff; opacity:.28}
.is-on .lt-shine{opacity:.6}

/* beam + dust */
.lt-beam,.lt-dust{
  position:absolute; left:50%; top:150px; width:320px; height:230px; margin-left:-160px; pointer-events:none;
  clip-path:polygon(40% 0,60% 0,100% 100%,0 100%); opacity:0; transition:opacity .5s;
}
.lt-beam{background:linear-gradient(180deg,color-mix(in srgb,var(--lc) 55%,transparent),transparent 90%)}
.is-on .lt-beam{opacity:calc(var(--b)*.75)}
.is-on .lt-dust{opacity:1}
.lt-dust i{
  position:absolute; left:calc(var(--x)*1%); bottom:0; width:var(--s); height:var(--s); border-radius:50%;
  background:#fff; box-shadow:0 0 6px var(--lc); opacity:0;
  animation:ltDust var(--t) ease-in-out var(--d) infinite;
}
@keyframes ltDust{0%{transform:translateY(0);opacity:0}25%{opacity:.9}100%{transform:translateY(-150px) translateX(14px);opacity:0}}

.lt-floor{
  position:absolute; left:50%; bottom:14px; width:240px; height:40px; margin-left:-120px; border-radius:50%;
  background:radial-gradient(ellipse,rgba(0,0,0,.7),transparent 70%); transition:background .5s;
}
.is-on .lt-floor{background:radial-gradient(ellipse,color-mix(in srgb,var(--lc) 75%,transparent),transparent 70%)}

/* status */
.lt-statusrow{display:flex; align-items:center; gap:10px; margin-top:4px}
.lt-status{margin:0; font-size:1.5rem; font-weight:800; letter-spacing:.01em}
.lt-dot{width:12px; height:12px; border-radius:50%; background:#444; transition:background .3s, box-shadow .3s}
.is-on .lt-dot{background:var(--lc); box-shadow:0 0 12px var(--lc); animation:ltPulse 1.8s ease-in-out infinite}
@keyframes ltPulse{50%{transform:scale(1.35)}}
.lt-sub{margin:0; font-size:.88rem; font-weight:600; opacity:.65; font-variant-numeric:tabular-nums}

/* 3D switch */
.lt-switch{
  position:relative; width:104px; height:54px; border-radius:99px; padding:0; cursor:pointer; margin:4px 0;
  background:linear-gradient(180deg,#2a2d38,#14161d); border:1px solid rgba(255,255,255,.2);
  box-shadow:inset 0 4px 9px rgba(0,0,0,.7), 0 6px 0 #05060a, 0 12px 20px rgba(0,0,0,.8);
  transition:background .3s, transform .08s, box-shadow .08s;
}
.is-on .lt-switch{
  background:linear-gradient(90deg,color-mix(in srgb,var(--lc) 45%,#000),var(--lc));
  box-shadow:inset 0 4px 9px rgba(0,0,0,.45), 0 6px 0 #05060a, 0 0 24px color-mix(in srgb,var(--lc) 60%,transparent);
}
.lt-switch:active{transform:translateY(4px); box-shadow:inset 0 4px 9px rgba(0,0,0,.7), 0 2px 0 #05060a}
.lt-knob{
  position:absolute; top:4px; left:4px; width:44px; height:44px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#fff,#b9c4de 80%); border:1px solid rgba(0,0,0,.3);
  box-shadow:0 5px 0 #6f7ea3, 0 8px 12px rgba(0,0,0,.6);
  transition:transform .3s cubic-bezier(.3,1.4,.5,1);
}
.is-on .lt-knob{transform:translateX(50px)}

/* controls */
.lt-controls{width:100%; display:flex; flex-direction:column; gap:14px; padding-top:8px; border-top:1px solid rgba(255,255,255,.1)}
.lt-group{display:flex; flex-direction:column; gap:8px}
.lt-label{font-size:.78rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; opacity:.6}
.lt-colors{display:flex; gap:14px}
.lt-colors button{
  width:34px; height:34px; border-radius:50%; cursor:pointer; background:var(--dot); border:3px solid #000;
  box-shadow:0 3px 0 rgba(255,255,255,.15), 0 6px 12px rgba(0,0,0,.8); transition:transform .1s;
}
.lt-colors button:hover{transform:translateY(-2px)}
.lt-colors button.on{outline:3px solid #fff; outline-offset:2px}
.lt-row{display:flex; align-items:center; gap:10px}
.lt-row input{flex:1; accent-color:var(--lc)}
.lt-row input:disabled{opacity:.35}
.lt-row b{width:44px; text-align:right; font-variant-numeric:tabular-nums}

.lt-seg{display:flex; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.25)}
.lt-seg button{flex:1; padding:9px 4px; font:inherit; font-size:.88rem; font-weight:700; background:transparent; border:0; cursor:pointer; transition:background .15s}
.lt-seg button + button{border-left:1px solid rgba(255,255,255,.2)}
.lt-seg button:hover{background:rgba(255,255,255,.1)}
.lt-seg button.on,.lt-page .lt-seg button.on{background:var(--lc); color:#000}
.lt-seg button.on{color:#000}

.lt-manual{display:flex; align-items:center; gap:10px}
.lt-picker{
  position:relative; flex:none; width:34px; height:34px; border-radius:50%; overflow:hidden; cursor:pointer;
  background:radial-gradient(circle,var(--dot) 38%,transparent 41%),conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);
  border:3px solid #000; box-shadow:0 3px 0 rgba(255,255,255,.15), 0 6px 12px rgba(0,0,0,.8);
}
.lt-picker input{position:absolute; inset:-10px; width:60px; height:60px; opacity:0; cursor:pointer}
.lt-field{
  padding:9px 12px; border-radius:10px; font:inherit; font-weight:600; color:#fff;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.25);
}
.lt-field:focus{outline:none; border-color:var(--lc); box-shadow:0 0 0 3px color-mix(in srgb,var(--lc) 35%,transparent)}
.lt-field option{background:#111; color:#fff}
.lt-hex{width:110px; font-variant-numeric:tabular-nums}
.lt-num{width:80px}
.lt-tag{font-size:.78rem; font-weight:700; opacity:.6}
.lt-set{
  margin-left:auto; padding:9px 16px; border-radius:10px; border:0; font:inherit; font-weight:800; cursor:pointer;
  background:var(--lc); color:#000; box-shadow:0 4px 0 color-mix(in srgb,var(--lc) 45%,#000); transition:transform .08s, box-shadow .08s;
}
.lt-set:active{transform:translateY(3px); box-shadow:0 1px 0 color-mix(in srgb,var(--lc) 45%,#000)}
.lt-note{margin:0; font-size:.8rem; font-weight:600; opacity:.65}

.lt-switch:focus-visible,.lt-colors button:focus-visible,.lt-seg button:focus-visible,.lt-set:focus-visible,.lt-picker:focus-within{outline:3px solid #fff; outline-offset:3px}
@media (prefers-reduced-motion:reduce){.lt-page *{animation:none!important; transition:none!important}}
`;
