"use client";

import { useEffect, useRef } from "react";
import { Button, Glass, Slider, Switch } from "glisse";
import type { Settings } from "@/lib/animals";
import { PalettePicker } from "./palette-picker";

interface SettingsPanelProps {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onClose: () => void;
  onReset: () => void;
}
const SLIDERS: { key: "count" | "speed" | "size" | "characterSize" | "brightness" | "depth"; label: string; min: number; max: number; step: number; display: (n: number) => string }[] = [
  { key: "count", label: "Animal count", min: 1, max: 32, step: 1, display: n => String(n).padStart(2, "0") },
  { key: "speed", label: "Movement speed", min: 0.1, max: 2, step: 0.05, display: n => `${n.toFixed(2)}×` },
  { key: "size", label: "Animal size", min: 0.5, max: 1.8, step: 0.05, display: n => `${Math.round(n * 100)}%` },
  { key: "characterSize", label: "Character size", min: 5, max: 14, step: 0.5, display: n => `${n.toFixed(1)} px` },
  { key: "brightness", label: "Brightness", min: 0.4, max: 1.6, step: 0.05, display: n => `${Math.round(n * 100)}%` },
  { key: "depth", label: "Depth strength", min: 0, max: 1, step: 0.05, display: n => `${Math.round(n * 100)}%` },
];

export function SettingsPanel({ settings, update, onClose, onReset }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape" && !event.defaultPrevented) onClose(); };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus({ preventScroll: true }); };
  }, [onClose]);

  return <Glass ref={panelRef} id="tweaks-panel" role="dialog" aria-label="Scene tweaks" className="settings-panel">
    <div className="drawer-handle" />
    <div className="mb-3 flex items-center justify-end">
      <Button aria-label="Close tweaks" className="close-button" onClick={onClose} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>} />
    </div>
    <div className="space-y-2">
      {SLIDERS.map(({ key, label, min, max, step, display }) => <div key={key} className="setting-row">
        <div className="flex items-center justify-between"><label htmlFor={`setting-${key}`}>{label}</label><output htmlFor={`setting-${key}`} className="setting-value">{display(settings[key])}</output></div>
        <Slider id={`setting-${key}`} aria-label={label} aria-valuetext={display(settings[key])} value={settings[key]} onValueChange={value => update(key, value)} min={min} max={max} step={step} />
      </div>)}
    </div>
    <PalettePicker value={settings.palette} onValueChange={value => update("palette", value)} />
    <div className="my-4 border-t border-white/8" />
    <div className="flex min-h-11 items-center justify-between"><label id="grid-label">Background grid</label><Switch aria-labelledby="grid-label" checked={settings.grid} onCheckedChange={value => update("grid", value)} /></div>
    <div className="flex min-h-11 items-center justify-between"><label id="pointer-label">Pointer interaction</label><Switch aria-labelledby="pointer-label" checked={settings.interaction} onCheckedChange={value => update("interaction", value)} /></div>
    <div className="mt-5 flex items-center gap-2 border-t border-white/8 pt-4">
      <Button className="flex-1" onClick={() => update("paused", !settings.paused)}>{settings.paused ? "Resume" : "Pause"}</Button>
      <Button className="flex-1" onClick={onReset}>Reset defaults</Button>
    </div>
  </Glass>;
}
