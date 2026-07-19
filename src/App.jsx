import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Bell, ChevronDown, ChevronUp, Moon, Sun, Flame, Check } from "lucide-react";

const LIGHT = {
  bg: "#F3F5F1", ink: "#182226", muted: "#66726F", teal: "#1F6F6B",
  tealDeep: "#123F3D", coral: "#D6553C", amber: "#E2A33B", sage: "#5C8A5A",
  card: "#FFFFFF", line: "#DDE3DF",
};
const DARK = {
  bg: "#12181A", ink: "#EDF1EF", muted: "#8B9895", teal: "#3DA39D",
  tealDeep: "#0C2624", coral: "#E67B63", amber: "#EBB35C", sage: "#7BAE78",
  card: "#1B2426", line: "#2A3436",
};

const GROUPS = [
  { id: "neck", label: "Neck", colorKey: "teal", stretches: [
    { name: "Chin Tuck", how: "Gently draw your chin straight back, as if making a double chin. Hold, then release.", hold: "5-10 sec × 5 reps" },
    { name: "Cervical Stretches (all directions)", how: "Slowly tilt head toward each shoulder, then rotate gently left/right, then look up/down. Move slowly, no forcing.", hold: "15-20 sec each direction" },
  ]},
  { id: "upper", label: "Upper Back", colorKey: "amber", stretches: [
    { name: "Thoracic Spine Stretch", how: "Seated, cross arms over chest, gently round upper back forward, then reverse to open chest and look up slightly.", hold: "20-30 sec, 3 reps" },
    { name: "Rhomboid Squeeze", how: "Sit tall, pull shoulder blades back and together as if pinching a pencil between them. Hold, release.", hold: "5 sec hold × 10 reps" },
  ]},
  { id: "mid", label: "Mid Back", colorKey: "sage", stretches: [
    { name: "Latissimus Dorsi Stretch", how: "Raise one arm overhead, lean sideways at the waist, feel the stretch along your side/mid-back. Switch sides.", hold: "20-30 sec each side" },
    { name: "Seated Trunk Rotation", how: "Sit tall, gently rotate upper body to look over one shoulder, hands on opposite knee for support. Switch sides.", hold: "15-20 sec each side" },
  ]},
  { id: "lower", label: "Lower Back", colorKey: "coral", stretches: [
    { name: "Quadratus Lumborum (QL) Stretch", how: "Standing or seated, reach one arm overhead and lean to the opposite side, feeling a stretch along the low back/side. Switch sides.", hold: "20-30 sec each side" },
    { name: "Cat-Cow", how: "On hands and knees, alternate arching your back up (cat) and dropping belly down while lifting chest (cow), moving with your breath.", hold: "8-10 slow reps" },
    { name: "Cobra Pose", how: "Lying face down, gently press up onto forearms or hands, lifting chest while keeping hips down. Go only as far as comfortable.", hold: "15-20 sec × 3 reps" },
    { name: "Child's Pose", how: "Kneel and sit back onto heels, reach arms forward on the floor, let your low back relax and lengthen.", hold: "20-30 sec" },
  ]},
];

const MICRO_TIPS = [
  "Roll your shoulders back 5 times, slowly.",
  "Look 20 feet away for 20 seconds — rest your eyes too.",
  "Stand up, take 3 deep breaths.",
  "Gently roll your neck side to side, twice.",
];

const STORAGE_KEY = "flexi-stretch-stats";

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore, fall back to defaults
  }
  return { neck: 0, upper: 0, mid: 0, lower: 0 };
}

export default function App() {
  const [dark, setDark] = useState(false);
  const C = dark ? DARK : LIGHT;

  const [intervalMin, setIntervalMin] = useState(45);
  const [remaining, setRemaining] = useState(45 * 60);
  const [running, setRunning] = useState(false);
  const [reminderFired, setReminderFired] = useState(false);
  const [openGroup, setOpenGroup] = useState("lower");

  const [microEnabled, setMicroEnabled] = useState(false);
  const [microRemaining, setMicroRemaining] = useState(12 * 60);
  const [microFired, setMicroFired] = useState(false);
  const [microTip, setMicroTip] = useState(MICRO_TIPS[0]);

  const [rotationIdx, setRotationIdx] = useState(0);
  const [stats, setStats] = useState(loadStats);

  const timerRef = useRef(null);
  const microTimerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error("Could not save stats", e);
    }
  }, [stats]);

  useEffect(() => { setRemaining(intervalMin * 60); }, [intervalMin]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { setReminderFired(true); setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    if (running && microEnabled) {
      microTimerRef.current = setInterval(() => {
        setMicroRemaining((r) => {
          if (r <= 1) {
            setMicroTip(MICRO_TIPS[Math.floor(Math.random() * MICRO_TIPS.length)]);
            setMicroFired(true);
            return 12 * 60;
          }
          return r - 1;
        });
      }, 1000);
    } else clearInterval(microTimerRef.current);
    return () => clearInterval(microTimerRef.current);
  }, [running, microEnabled]);

  const suggestedGroup = GROUPS[rotationIdx % GROUPS.length];

  function resetTimer(dismiss) {
    setReminderFired(false);
    setRemaining(intervalMin * 60);
    if (dismiss) setRunning(true);
  }

  function markStretched() {
    setStats((s) => ({ ...s, [suggestedGroup.id]: s[suggestedGroup.id] + 1 }));
    setRotationIdx((i) => i + 1);
    setOpenGroup(suggestedGroup.id);
    resetTimer(true);
  }

  const progress = 1 - remaining / (intervalMin * 60);
  const totalStretches = Object.values(stats).reduce((a, b) => a + b, 0);
  const maxStat = Math.max(1, ...Object.values(stats));

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: "100vh", transition: "background .3s,color .3s" }} className="w-full flex justify-center">
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }} className="w-full max-w-md min-h-screen pb-16">
        <div className="px-6 pt-8 pb-4 flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", color: C.tealDeep, letterSpacing: "-0.02em" }} className="text-3xl font-semibold">
              Flexi-Stretch Me
            </h1>
            <p style={{ color: C.muted }} className="text-sm mt-1">
              Free reminders for neck, upper, mid & lower back — built for people who sit too long.
            </p>
          </div>
          <button
            onClick={() => setDark((d) => !d)}
            style={{ border: `1px solid ${C.line}`, color: C.ink, background: "transparent" }}
            className="p-2 rounded-full shrink-0 ml-2"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="px-6 mb-4">
          <div style={{ background: C.card, borderRadius: 18 }} className="p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} color={C.coral} />
                <span className="text-sm font-semibold">{totalStretches} stretches logged</span>
              </div>
              <span style={{ color: C.muted }} className="text-xs">by region</span>
            </div>
            <div className="flex items-end gap-3 h-16">
              {GROUPS.map((g) => (
                <div key={g.id} className="flex-1 flex flex-col items-center gap-1">
                  <div style={{ height: 48 }} className="w-full flex items-end">
                    <div
                      style={{
                        height: `${Math.max(6, (stats[g.id] / maxStat) * 48)}px`,
                        background: C[g.colorKey],
                        width: "100%",
                        borderRadius: 6,
                        transition: "height .3s",
                      }}
                    />
                  </div>
                  <span style={{ color: C.muted }} className="text-[10px]">{g.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {reminderFired && (
          <div className="px-6 mb-4">
            <div style={{ background: C.tealDeep }} className="rounded-2xl p-4">
              <div className="flex items-center gap-2 text-white mb-2">
                <Bell size={18} />
                <span className="text-sm font-medium">Time to stretch your {suggestedGroup.label.toLowerCase()}!</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.75)" }} className="text-xs mb-3">
                Suggested next since it's had the least attention today.
              </p>
              <button
                onClick={markStretched}
                style={{ background: "#fff", color: C.tealDeep }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
              >
                <Check size={13} /> Done — count it
              </button>
            </div>
          </div>
        )}

        {microFired && (
          <div className="px-6 mb-4">
            <div style={{ border: `1px solid ${C.amber}`, background: dark ? "#2A2416" : "#FCF6E8" }} className="rounded-2xl p-3 flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-xs">{microTip}</span>
              <button onClick={() => setMicroFired(false)} style={{ color: C.amber, background: "transparent" }} className="text-xs font-semibold ml-2 shrink-0">Ok</button>
            </div>
          </div>
        )}

        <div className="px-6">
          <div style={{ background: C.card, borderRadius: 20 }} className="p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Stretch break every</span>
              <select
                value={intervalMin}
                onChange={(e) => { setIntervalMin(Number(e.target.value)); setRunning(false); setReminderFired(false); }}
                style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.card }}
                className="text-sm rounded-lg px-2 py-1"
              >
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>

            <label className="flex items-center justify-between mb-4 text-xs" style={{ color: C.muted }}>
              <span>Also send quick 12-min micro-break tips</span>
              <input type="checkbox" checked={microEnabled} onChange={(e) => setMicroEnabled(e.target.checked)} />
            </label>

            <div className="flex flex-col items-center">
              <div
                style={{ width: 140, height: 140, borderRadius: "50%", background: `conic-gradient(${C.teal} ${progress * 360}deg, ${C.line} 0deg)` }}
                className="flex items-center justify-center mb-4"
              >
                <div style={{ width: 116, height: 116, borderRadius: "50%", background: C.card }} className="flex items-center justify-center">
                  <span style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-semibold">{formatTime(remaining)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRunning((r) => !r)}
                  style={{ background: C.teal }}
                  className="text-white text-sm font-medium px-5 py-2.5 rounded-xl flex items-center gap-2"
                >
                  {running ? <Pause size={15} /> : <Play size={15} />}
                  {running ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => resetTimer(false)}
                  style={{ border: `1px solid ${C.line}`, color: C.ink, background: "transparent" }}
                  className="text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <RotateCcw size={15} /> Reset
                </button>
              </div>
            </div>
            <p style={{ color: C.muted }} className="text-xs text-center mt-4">
              Keep this tab open — reminders fire while you work. Next up: <strong>{suggestedGroup.label}</strong>.
            </p>
          </div>
        </div>

        <div className="px-6 mt-5">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-semibold mb-3">Stretch Library</h2>
          <div className="flex flex-col gap-3">
            {GROUPS.map((g) => (
              <div key={g.id} style={{ background: C.card, borderRadius: 18 }} className="shadow-sm overflow-hidden">
                <button onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)} style={{ background: "transparent" }} className="w-full flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: C[g.colorKey] }} />
                    <span className="text-sm font-semibold">{g.label}</span>
                    <span style={{ color: C.muted }} className="text-xs">{stats[g.id]} done</span>
                  </div>
                  {openGroup === g.id ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
                </button>
                {openGroup === g.id && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    {g.stretches.map((s) => (
                      <div key={s.name} style={{ borderTop: `1px solid ${C.line}` }} className="pt-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-medium">{s.name}</span>
                          <span style={{ color: C[g.colorKey] }} className="text-xs font-medium">{s.hold}</span>
                        </div>
                        <p style={{ color: C.muted }} className="text-xs mt-1 leading-relaxed">{s.how}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: C.muted }} className="text-[11px] text-center px-8 mt-6 leading-relaxed">
          Move gently and stop immediately if you feel sharp pain, numbness, or tingling. This is general movement guidance, not medical advice — consult a healthcare professional for persistent or worsening pain.
        </p>
      </div>
    </div>
  );
}
