import type { Animal, Sample } from "./types";
import { clamp } from "./settings";

const CREAM = 0xeee2cb, ORANGE = 0xef925c, RED = 0xcc5d48, GOLD = 0xd7b879;
const OLIVE = 0xa1aa70, MOSS = 0x64744f, AMBER = 0xbfa16a;
const PINK = [0xe9a1b7, 0xd5a4df, 0xf0b09c, 0xa6c8e5];

function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number, angle = 0) {
  const c = Math.cos(angle), s = Math.sin(angle), dx = x - cx, dy = y - cy;
  return 1 - ((dx * c + dy * s) / rx) ** 2 - ((dy * c - dx * s) / ry) ** 2;
}
function paint(sample: Sample, edge: number, density: number, color: number) {
  if (edge <= 0) return;
  sample.coverage = clamp(edge * 5, 0, 1);
  sample.density = density;
  sample.color = color;
}
function koi(a: Animal, x: number, y: number, sample: Sample) {
  if (x < -1.52 || x > 0.87 || Math.abs(y) > 0.65) return;
  y -= Math.sin(a.phase - x * 4.8) * (0.012 + 0.105 * ((0.8 - x) / 2.2) ** 2);
  const u = (x + 0.92) / 1.78;
  const width = u > 0 && u < 1 ? 0.345 * Math.sin(Math.PI * u) ** 0.66 * (0.6 + 0.65 * u) : 0;
  const body = width > 0 ? 1 - (y / width) ** 2 : -1;
  const tailX = (-x - 0.83) / 0.66;
  if (tailX > 0 && tailX < 1) {
    const fan = 0.055 + tailX * 0.4, notch = tailX > 0.68 ? (tailX - 0.68) * 0.88 : 0;
    if (Math.abs(y) < fan && Math.abs(y) > notch) {
      const edge = Math.min((fan - Math.abs(y)) * 8, (1 - tailX) * 4, tailX * 5);
      paint(sample, edge, 0.25 + 0.28 * (0.5 + 0.5 * Math.sin(Math.atan2(y, -x - 0.8) * 31)), a.id % 3 === 0 ? ORANGE : CREAM);
    }
  }
  for (const side of [-1, 1]) {
    const fin = ellipse(x, y, 0.14, side * 0.32, 0.3, 0.125, side * 0.8 + Math.sin(a.phase * 0.7) * 0.1);
    if (fin > 0) paint(sample, fin, 0.25 + 0.18 * Math.sin(x * 45 + y * 20) ** 2, a.id % 3 === 1 ? GOLD : CREAM);
    const rear = ellipse(x, y, -0.53, side * 0.19, 0.19, 0.07, side * 0.65);
    if (rear > 0) paint(sample, rear, 0.32, CREAM);
  }
  if (body > 0) {
    const patch = Math.sin(x * 7.5 + a.seed) + Math.cos(y * 13 + a.seed * 0.7) * 0.65 + Math.sin(x * 13 - y * 9 + a.seed * 2) * 0.35;
    let color = CREAM;
    const variety = a.id % 5;
    if (variety === 0) color = patch > 0.1 ? ORANGE : CREAM;
    if (variety === 1) color = patch > 0.35 ? RED : CREAM;
    if (variety === 2) color = patch > -0.6 ? GOLD : CREAM;
    if (variety === 3) color = patch > 0.3 ? CREAM : ORANGE;
    if (variety === 4) color = patch > 0.8 ? RED : patch < -0.65 ? 0x7a8886 : CREAM;
    const scales = 0.05 * Math.sin(x * 67 + Math.sin(y * 54)) * Math.cos(y * 54);
    paint(sample, body, 0.52 + 0.33 * body + scales, color);
    if (x > 0.48 && x < 0.69 && Math.abs(Math.abs(y) - width * 0.7) < 0.029) {
      sample.color = 0x504a3e;
      sample.density = 0.96;
    }
    if (x > 0.75) sample.density *= 0.7;
  }
}
function turtle(a: Animal, x: number, y: number, sample: Sample) {
  if (x < -0.96 || x > 1.05 || Math.abs(y) > 0.88) return;
  const stroke = Math.sin(a.phase * 0.64);
  for (const side of [-1, 1]) {
    const front = ellipse(x, y, 0.29 + stroke * 0.085, side * 0.52, 0.42, 0.13, side * (-0.8 + stroke * 0.38));
    const back = ellipse(x, y, -0.49 - stroke * 0.04, side * 0.38, 0.25, 0.115, side * (0.75 - stroke * 0.22));
    const edge = Math.max(front, back);
    if (edge > 0) paint(sample, edge, 0.38 + 0.2 * Math.sin(x * 38 + y * 27) ** 2, AMBER);
  }
  const head = Math.max(ellipse(x, y, 0.79, 0, 0.25, 0.17), ellipse(x, y, 0.58, 0, 0.25, 0.12));
  if (head > 0) {
    paint(sample, head, 0.65, OLIVE);
    if (x > 0.83 && x < 0.94 && Math.abs(y) > 0.065 && Math.abs(y) < 0.12) { sample.color = CREAM; sample.density = 0.9; }
  }
  if (x < -0.59 && x > -0.94 && Math.abs(y) < (x + 0.94) * 0.2) paint(sample, 0.4, 0.4, MOSS);
  const shell = ellipse(x, y, -0.04, 0, 0.72, 0.48);
  if (shell > 0) {
    const row = Math.floor((x + 0.75) * 5), tileY = y + (row % 2 ? 0.11 : 0);
    const seam = Math.min(Math.abs(Math.sin((x + 0.75) * 15)), Math.abs(Math.sin(tileY * 15)));
    const mottle = Math.sin(x * 23 + a.seed) * Math.cos(y * 26 - a.seed) + Math.sin(x * 47 + y * 19) * 0.4;
    const color = shell < 0.15 ? AMBER : seam < 0.15 ? MOSS : mottle > 0.3 ? AMBER : mottle < -0.4 ? MOSS : OLIVE;
    paint(sample, shell, seam < 0.15 ? 0.38 : 0.62 + shell * 0.25 + mottle * 0.07, color);
  }
}
function butterfly(a: Animal, x: number, y: number, sample: Sample) {
  if (x < -0.83 || x > 0.89 || Math.abs(y) > 0.94) return;
  const open = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(a.phase * 1.6));
  const wingY = Math.abs(y) / open;
  const upper = ellipse(x, wingY, 0.3, 0.46, 0.53, 0.42, 0.35);
  const lower = ellipse(x, wingY, -0.44, 0.34, 0.35, 0.29, -0.42);
  const edge = Math.max(upper, lower);
  if (edge > 0) {
    const radius = Math.hypot(x - 0.05, wingY * 0.9);
    const vein = Math.abs(Math.sin(Math.atan2(wingY, x + 0.28) * 11 + radius * 2));
    const spot = ellipse(x, wingY, 0.36, 0.55, 0.13, 0.12), rim = edge < 0.22;
    let color = PINK[a.id % 4];
    if (rim) color = a.id % 2 ? 0x8a79a7 : 0xb56f86;
    if (spot > 0 || (rim && Math.sin(x * 43 + wingY * 27) > 0.55)) color = 0xe5dcdf;
    paint(sample, edge, vein < 0.12 ? 0.28 : 0.55 + edge * 0.3, color);
  }
  const body = ellipse(x, y, -0.02, 0, 0.52, 0.055);
  if (body > 0) paint(sample, body, 0.85, 0xe5d4c8);
  if (x > 0.39 && x < 0.76 && Math.abs(Math.abs(y) - (x - 0.4) * 0.39) < 0.016) paint(sample, 0.3, 0.35, 0xc5b4c9);
}
export function sampleAnimal(animal: Animal, x: number, y: number, sample: Sample) {
  sample.coverage = 0;
  if (animal.kind === "koi") koi(animal, x, y, sample);
  else if (animal.kind === "turtles") turtle(animal, x, y, sample);
  else butterfly(animal, x, y, sample);
}
