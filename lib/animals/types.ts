export type AnimalKind = "koi" | "turtles" | "butterflies";
export type Mode = AnimalKind | "mixed";
export type Palette = "natural" | "pastel" | "moonlight";
export interface Settings {
  count: number;
  speed: number;
  size: number;
  characterSize: number;
  palette: Palette;
  brightness: number;
  depth: number;
  grid: boolean;
  interaction: boolean;
  paused: boolean;
}
export interface Animal {
  id: number;
  kind: AnimalKind;
  x: number;
  y: number;
  heading: number;
  vx: number;
  vy: number;
  scale: number;
  depth: number;
  phase: number;
  seed: number;
  response: number;
  state: "wandering" | "feeding" | "responding";
}
export interface Food { x: number; y: number; life: number; seed: number }
export interface Ripple { x: number; y: number; age: number }
export interface Sample { coverage: number; density: number; color: number }
export interface Pointer { x: number; y: number; strength: number }
