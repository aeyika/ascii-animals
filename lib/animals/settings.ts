import type { Mode, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  count: 12, speed: 0.75, size: 1, characterSize: 7, palette: "natural",
  brightness: 1, depth: 0.65, grid: true, interaction: true, paused: false,
};

export const MODES: { value: Mode; label: string; title: string; description: string; color: string; number: string }[] = [
  { value: "koi", label: "Koi", title: "Koi pond", description: "A quiet current. A little company.", color: "#ed9e78", number: "01" },
  { value: "turtles", label: "Turtles", title: "Sea turtles", description: "Take the scenic route. There’s no rush.", color: "#a9b88a", number: "02" },
  { value: "butterflies", label: "Butterflies", title: "Butterfly garden", description: "Let your mind wander a little.", color: "#c5a0d9", number: "03" },
  { value: "mixed", label: "Mixed", title: "A world together", description: "Different little lives. One quiet world.", color: "#acbfc8", number: "04" },
];
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
