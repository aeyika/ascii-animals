import { sampleAnimal } from "./geometry";
import { clamp } from "./settings";
import type { Simulation } from "./simulation";
import type { Palette, Sample } from "./types";

const RAMP = " .,:;+=ox%#@";

export class AsciiRenderer {
  private colors = new Map<string, string>();
  private fontSize = 0;
  private sample: Sample = { coverage: 0, density: 0, color: 0 };
  private color(rgb: number, brightness: number, palette: Palette) {
    const level = Math.round(clamp(brightness, 0, 1.7) * 16), key = `${rgb}-${level}-${palette}`;
    const cached = this.colors.get(key);
    if (cached) return cached;
    let r = rgb >> 16 & 255, g = rgb >> 8 & 255, b = rgb & 255;
    if (palette === "pastel") { r = r * 0.65 + 89; g = g * 0.65 + 72; b = b * 0.65 + 84; }
    if (palette === "moonlight") { const l = r * 0.3 + g * 0.5 + b * 0.2; r = l * 0.65; g = l * 0.87; b = l * 1.1; }
    const color = `rgb(${Math.min(255, Math.round(r * level / 16))},${Math.min(255, Math.round(g * level / 16))},${Math.min(255, Math.round(b * level / 16))})`;
    this.colors.set(key, color);
    return color;
  }

  render(ctx: CanvasRenderingContext2D, sim: Simulation) {
    const { width, height, settings } = sim, sample = this.sample;
    ctx.clearRect(0, 0, width, height);
    const size = settings.characterSize, cellWidth = size * 0.64, cellHeight = size * 1.08;
    if (this.fontSize !== size) {
      this.fontSize = size;
      ctx.font = `${size}px "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
    const ordered = [...sim.animals].sort((a, b) => a.depth - b.depth);
    for (const a of ordered) {
      const scale = sim.animalScale(a), cos = Math.cos(a.heading), sin = Math.sin(a.heading);
      const extentX = a.kind === "koi" ? 1.53 : 1.1, extentY = a.kind === "koi" ? 0.65 : a.kind === "turtles" ? 0.92 : 1.06;
      const halfWidth = (Math.abs(cos) * extentX + Math.abs(sin) * extentY) * scale;
      const halfHeight = (Math.abs(sin) * extentX + Math.abs(cos) * extentY) * scale;
      const bob = a.kind === "butterflies" ? Math.sin(a.phase * 0.3 + a.seed) * 5 : 0;
      const minCol = Math.max(0, Math.floor((a.x - halfWidth) / cellWidth));
      const maxCol = Math.min(Math.ceil(width / cellWidth), Math.ceil((a.x + halfWidth) / cellWidth));
      const minRow = Math.max(0, Math.floor((a.y + bob - halfHeight) / cellHeight));
      const maxRow = Math.min(Math.ceil(height / cellHeight), Math.ceil((a.y + bob + halfHeight) / cellHeight));
      const depthLight = 1 - (1 - a.depth) * settings.depth * 0.55;
      for (let row = minRow; row < maxRow; row++) {
        const y = (row + 0.5) * cellHeight;
        for (let col = minCol; col < maxCol; col++) {
          const x = (col + 0.5) * cellWidth, dx = (x - a.x) / scale, dy = (y - a.y - bob) / scale;
          const localX = dx * cos + dy * sin, localY = -dx * sin + dy * cos;
          sampleAnimal(a, localX, localY, sample);
          if (sample.coverage <= 0.03) continue;
          const grain = Math.sin(localX * 71 + Math.cos(localY * 53) + a.seed) * 0.06;
          const density = clamp(sample.density * sample.coverage + grain * sample.coverage, 0.04, 1);
          const index = clamp(Math.round(density * (RAMP.length - 1)), 1, RAMP.length - 1);
          const light = settings.brightness * 1.35 * depthLight * (0.65 + density * 0.35) * (0.4 + sample.coverage * 0.6);
          ctx.fillStyle = this.color(sample.color, light, settings.palette);
          ctx.fillText(RAMP[index], x, y);
        }
      }
    }
    for (const ripple of sim.ripples) {
      const radius = 8 + ripple.age * 42;
      ctx.fillStyle = `rgba(206,190,165,${(1 - ripple.age / 3) * 0.4})`;
      const count = Math.floor(radius * 0.65);
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2;
        const x = Math.round((ripple.x + Math.cos(angle) * radius) / cellWidth) * cellWidth + cellWidth * 0.5;
        const y = Math.round((ripple.y + Math.sin(angle) * radius * 0.7) / cellHeight) * cellHeight + cellHeight * 0.5;
        ctx.fillText(i % 3 === 0 ? ":" : ".", x, y);
      }
    }
    for (const food of sim.food) {
      ctx.fillStyle = `rgba(233,190,127,${Math.min(1, food.life / 2) * 0.85})`;
      const x = Math.round(food.x / cellWidth) * cellWidth + cellWidth * 0.5;
      const y = Math.round(food.y / cellHeight) * cellHeight + cellHeight * 0.5;
      ctx.fillText(food.seed % 2 ? "+" : ".", x, y);
    }
  }
  invalidate() { this.fontSize = 0; }
}
