"use client";

import { useCallback, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Button, SegmentedControl } from "glisse";
import { DEFAULT_SETTINGS, MODES, type Mode, type Settings } from "@/lib/animals";
import { Scene } from "./scene";
import { SettingsPanel } from "./settings-panel";

const subscribePreferences = (callback: () => void) => {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)"), mobile = window.matchMedia("(max-width: 639px)"), touch = window.matchMedia("(pointer: coarse)");
  for (const query of [motion, mobile, touch]) query.addEventListener("change", callback);
  return () => { for (const query of [motion, mobile, touch]) query.removeEventListener("change", callback); };
};
const getPreferences = () => `${window.matchMedia("(prefers-reduced-motion: reduce)").matches},${window.matchMedia("(max-width: 639px)").matches},${window.matchMedia("(pointer: coarse)").matches}`;
const serverPreferences = () => "false,false,false";

export function Playground() {
  const [mode, setMode] = useState<Mode>("koi");
  const [overrides, setOverrides] = useState<Partial<Settings>>({});
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences, serverPreferences);
  const [reducedMotion, mobile, touch] = preferences.split(",").map(p => p === "true");
  const settings: Settings = { ...DEFAULT_SETTINGS, count: mobile ? 7 : 12, paused: reducedMotion, ...overrides };
  const active = MODES.find(item => item.value === mode)!;
  const closeTweaks = useCallback(() => setTweaksOpen(false), []);
  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => setOverrides(previous => ({ ...previous, [key]: value })), []);
  const instruction = !settings.interaction ? "Just watch. There’s nowhere else to be."
    : settings.paused ? "A moment of stillness. Resume when you’re ready."
    : mode === "koi" ? `${touch ? "Tap" : "Click"} anywhere to feed the koi`
    : mode === "butterflies" ? `${touch ? "Tap near butterflies" : "Move near butterflies or click"} to make them flutter`
    : mode === "turtles" ? `${touch ? "Tap" : "Click"} near a turtle to guide its swim`
    : `${touch ? "Tap" : "Click"} to feed koi / guide turtles · ${touch ? "Tap near" : "Move near"} butterflies`;

  return <main className="playground relative h-dvh min-h-96 w-full overflow-hidden" data-theme="dark" style={{ "--scene-accent": active.color } as CSSProperties}>
    <div data-glisse-backdrop className="scene-backdrop absolute inset-0">
      <div className={`graph-grid absolute inset-0 ${settings.grid ? "" : "opacity-0"}`} />
      <Scene settings={settings} mode={mode} />
    </div>
    <header className="scene-header pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-end gap-4 px-8 py-7 lg:px-10">
      <div className="mode-selector pointer-events-auto absolute left-1/2 -translate-x-1/2">
        <SegmentedControl aria-label="Animal scene" value={mode} onValueChange={value => setMode(value as Mode)} items={MODES.map(item => ({ value: item.value, label: item.label }))} />
      </div>
      <Button className="tweaks-button pointer-events-auto" aria-expanded={tweaksOpen} aria-controls="tweaks-panel" onClick={() => setTweaksOpen(open => !open)}>Tweaks</Button>
    </header>
    {tweaksOpen && <SettingsPanel settings={settings} update={update} onClose={closeTweaks} onReset={() => setOverrides({})} />}
    <footer className="scene-footer pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-5 px-8 pb-7 lg:px-10">
      <div className="scene-caption">
        <div className="mb-2.5 flex items-center gap-3"><span className="scene-number">{active.number}</span><span className="h-3 w-px bg-white/15"/><span className="status-dot" style={{ background: active.color }} /><h2 className="text-[13px] font-medium tracking-wide">{active.title}</h2></div>
        <p className="text-xs text-[#747b77]">{active.description}</p>
      </div>
      <div className="interaction-hint"><span>{instruction}</span></div>
      <div className="pointer-events-auto flex items-center gap-4">
        <div className="scene-stats text-right"><div className="eyebrow">{String(settings.count).padStart(2, "0")} LITTLE LIVES</div><div className="mt-1 flex items-center justify-end gap-1.5 font-mono text-[10px] text-[#636c65]"><span className={`live-dot ${settings.paused ? "paused" : ""}`} />{settings.paused ? "TAKING A BREATH" : "ALWAYS IN MOTION"}</div></div>
        <Button aria-label={settings.paused ? "Resume animation" : "Pause animation"} onClick={() => update("paused", !settings.paused)} className="pause-button">{settings.paused ? "Resume" : "Pause"}</Button>
      </div>
    </footer>
    <div className="sr-only" aria-live="polite">{active.title}. {settings.count} animals. {settings.paused ? "Animation paused." : "Animation playing."}</div>
  </main>;
}
