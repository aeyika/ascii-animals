import { clamp, DEFAULT_SETTINGS } from "./settings";
import type { Animal, AnimalKind, Food, Mode, Pointer, Ripple, Settings } from "./types";

const KINDS: AnimalKind[] = ["koi", "turtles", "butterflies"];
const POSITIONS = [[0.53, 0.24], [0.79, 0.4], [0.35, 0.54], [0.65, 0.74], [0.13, 0.72], [0.89, 0.73], [0.45, 0.85], [0.23, 0.36], [0.74, 0.13], [0.53, 0.49], [0.11, 0.48], [0.91, 0.22]];

export class Simulation {
  animals: Animal[] = [];
  food: Food[] = [];
  ripples: Ripple[] = [];
  pointer: Pointer = { x: -1000, y: -1000, strength: 0 };
  width = 1;
  height = 1;
  time = 0;
  settings = { ...DEFAULT_SETTINGS };
  mode: Mode = "koi";
  private nextId = 0;
  private motion = new Float64Array(0);
  private scales = new Float64Array(0);
  private cue = { x: 0, y: 0, age: Infinity };

  resize(width: number, height: number) {
    const oldWidth = this.width, oldHeight = this.height;
    this.width = width;
    this.height = height;
    for (const a of this.animals) { a.x *= width / oldWidth; a.y *= height / oldHeight; }
    for (const f of this.food) { f.x *= width / oldWidth; f.y *= height / oldHeight; }
    for (const r of this.ripples) { r.x *= width / oldWidth; r.y *= height / oldHeight; }
    this.cue.x *= width / oldWidth;
    this.cue.y *= height / oldHeight;
    this.pointer.x *= width / oldWidth;
    this.pointer.y *= height / oldHeight;
  }

  configure(settings: Settings, mode: Mode) {
    this.settings = settings;
    if (this.mode !== mode) {
      this.mode = mode;
      this.food = [];
      this.ripples = [];
      this.cue.age = Infinity;
      this.pointer.strength = 0;
      for (let i = 0; i < this.animals.length; i++) {
        this.animals[i].kind = mode === "mixed" ? KINDS[i % 3] : mode;
        this.animals[i].response = 0;
        this.animals[i].state = "wandering";
      }
    }
    while (this.animals.length < settings.count) this.animals.push(this.createAnimal());
    if (this.animals.length > settings.count) this.animals.length = settings.count;
    if (this.scales.length !== this.animals.length) {
      this.motion = new Float64Array(this.animals.length * 4);
      this.scales = new Float64Array(this.animals.length);
    }
    if (!settings.interaction) {
      this.food = [];
      this.ripples = [];
      this.pointer.strength = 0;
      this.cue.age = Infinity;
      for (const a of this.animals) { a.response = 0; a.state = "wandering"; }
    }
  }

  private createAnimal(): Animal {
    const id = this.nextId++;
    const rand = (n: number) => { const r = Math.sin(id * 127.1 + n * 311.7 + 42) * 43758.5453; return r - Math.floor(r); };
    const position = POSITIONS[id % POSITIONS.length];
    let x = position[0] * this.width, y = position[1] * this.height, clearance = -Infinity;
    for (let i = 0; i < 24; i++) {
      const px = (i === 0 ? position[0] : 0.1 + rand(10 + i * 2) * 0.8) * this.width;
      const py = (i === 0 ? position[1] : 0.16 + rand(11 + i * 2) * 0.68) * this.height;
      let score = Infinity;
      for (const other of this.animals) score = Math.min(score, Math.hypot(px - other.x, py - other.y) - this.animalScale(other));
      if (score > clearance) { x = px; y = py; clearance = score; }
    }
    const heading = rand(5) * Math.PI * 2;
    return {
      id, kind: this.mode === "mixed" ? KINDS[this.animals.length % 3] : this.mode,
      x, y, heading, vx: Math.cos(heading) * 12, vy: Math.sin(heading) * 12,
      scale: 0.8 + rand(3) * 0.45, depth: 0.15 + rand(4) * 0.85,
      phase: rand(6) * Math.PI * 2, seed: rand(7) * 40, response: 0, state: "wandering",
    };
  }

  movePointer(x: number, y: number) {
    if (!this.settings.interaction || this.settings.paused) return;
    this.pointer = { x, y, strength: 1 };
  }

  interact(x: number, y: number) {
    if (!this.settings.interaction || this.settings.paused) return;
    this.movePointer(x, y);
    this.cue = { x, y, age: 0 };
    this.ripples.push({ x, y, age: 0 });
    if (this.ripples.length > 6) this.ripples.shift();
    if (this.mode === "koi" || this.mode === "mixed") {
      for (let i = 0; i < 7; i++) {
        const angle = i * 2.4;
        this.food.push({ x: x + Math.cos(angle) * (5 + i * 3), y: y + Math.sin(angle) * (5 + i * 3), life: 15, seed: i });
      }
      this.food = this.food.slice(-35);
    }
  }

  update(dt: number) {
    if (this.settings.paused) return;
    const { speed, depth } = this.settings, step = dt * speed;
    this.time += step;
    this.cue.age += dt;
    this.pointer.strength = Math.max(0, this.pointer.strength - dt * 0.45);
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter(r => r.age < 3);
    for (const f of this.food) f.life -= dt;
    this.food = this.food.filter(f => f.life > 0);
    const margin = Math.min(110, this.width * 0.14, this.height * 0.14);
    for (let i = 0; i < this.animals.length; i++) {
      const a = this.animals[i], offset = i * 4;
      this.motion[offset] = a.x;
      this.motion[offset + 1] = a.y;
      this.motion[offset + 2] = a.vx;
      this.motion[offset + 3] = a.vy;
      this.scales[i] = this.animalScale(a);
    }
    for (let index = 0; index < this.animals.length; index++) {
      const a = this.animals[index];
      const feeding = a.kind === "koi" && this.food.length > 0;
      a.state = "wandering";
      const wander = Math.sin(this.time * 0.24 + a.seed) * 0.65 + Math.cos(this.time * 0.13 + a.seed * 2) * 0.35;
      let dx = Math.cos(a.heading + wander) * 1.2, dy = Math.sin(a.heading + wander) * 1.2;
      const aheadX = a.x + Math.cos(a.heading) * margin * 0.8, aheadY = a.y + Math.sin(a.heading) * margin * 0.8;
      dx += Math.max(0, (margin - aheadX) / margin) * 3 - Math.max(0, (aheadX - this.width + margin) / margin) * 3;
      dy += Math.max(0, (margin + 60 - aheadY) / margin) * 3 - Math.max(0, (aheadY - this.height + margin + 50) / margin) * 3;
      let driftX = 0, driftY = 0, avoidance = 0;
      for (let i = 0; i < this.animals.length; i++) {
        if (i === index) continue;
        const other = this.animals[i], offset = i * 4;
        let sx = a.x - this.motion[offset], sy = a.y - this.motion[offset + 1];
        const separation = (this.scales[index] + this.scales[i]) * (feeding ? 0.65 : 0.88) + 16;
        let distance = Math.hypot(sx, sy);
        const angle = Math.min(a.id, other.id) * 2.399 + Math.max(a.id, other.id) * 0.71;
        const sign = a.id < other.id ? 1 : -1;
        if (distance < 0.01) { sx = Math.cos(angle) * sign * 0.01; sy = Math.sin(angle) * sign * 0.01; distance = 0.01; }
        if (distance < separation) {
          const pressure = (1 - distance / separation) ** 2;
          dx += sx / distance * pressure * 5;
          dy += sy / distance * pressure * 5;
          driftX += sx / distance * pressure;
          driftY += sy / distance * pressure;
          avoidance = Math.max(avoidance, pressure);
        }
        const rvx = a.vx - this.motion[offset + 2], rvy = a.vy - this.motion[offset + 3];
        const relativeSpeed = rvx * rvx + rvy * rvy;
        const approach = relativeSpeed > 0.01 ? clamp(-(sx * rvx + sy * rvy) / relativeSpeed, 0, 3) : 0;
        if (approach > 0) {
          const px = sx + rvx * approach, py = sy + rvy * approach, predictedDistance = Math.hypot(px, py);
          if (predictedDistance < separation) {
            const pressure = (1 - predictedDistance / separation) * (1 - approach / 4);
            const nx = predictedDistance > 1 ? px / predictedDistance : Math.cos(angle) * sign;
            const ny = predictedDistance > 1 ? py / predictedDistance : Math.sin(angle) * sign;
            dx += nx * pressure * 2.4;
            dy += ny * pressure * 2.4;
            avoidance = Math.max(avoidance, pressure);
          }
        }
      }
      if (feeding) {
        let nearest: Food | undefined, nearestDistance = Math.min(430, this.width * 0.75);
        for (const food of this.food) {
          const distance = Math.hypot(food.x - a.x, food.y - a.y);
          if (distance < nearestDistance) { nearest = food; nearestDistance = distance; }
        }
        if (nearest) {
          a.state = "feeding";
          dx += (nearest.x - a.x) / Math.max(nearestDistance, 1) * 3;
          dy += (nearest.y - a.y) / Math.max(nearestDistance, 1) * 3;
          const nose = this.animalScale(a) * 0.64;
          if (Math.hypot(nearest.x - a.x - Math.cos(a.heading) * nose, nearest.y - a.y - Math.sin(a.heading) * nose) < 24) nearest.life -= dt * 11;
        }
      }
      let response = 0;
      if (a.kind === "turtles" && this.cue.age < 8) {
        const distance = Math.hypot(a.x - this.cue.x, a.y - this.cue.y);
        const radius = Math.max(220, this.scales[index] * 4.5);
        response = Math.max(0, 1 - distance / radius) * Math.min(1, (8 - this.cue.age) / 2);
        if (response > 0) {
          const berth = this.scales[index] * 0.8 + 16;
          const tx = this.cue.x + Math.cos(a.seed * 2.4) * berth - a.x;
          const ty = this.cue.y + Math.sin(a.seed * 2.4) * berth - a.y;
          const targetDistance = Math.hypot(tx, ty);
          const arrival = Math.min(1, targetDistance / 40);
          dx += tx / Math.max(targetDistance, 1) * response * arrival * 4;
          dy += ty / Math.max(targetDistance, 1) * response * arrival * 4;
        }
      }
      if (a.kind === "butterflies") {
        const radius = Math.max(170, this.scales[index] * 3.8);
        const px = a.x - this.pointer.x, py = a.y - this.pointer.y, pointerDistance = Math.hypot(px, py);
        const cx = a.x - this.cue.x, cy = a.y - this.cue.y, cueDistance = Math.hypot(cx, cy);
        const hover = Math.max(0, 1 - pointerDistance / radius) * this.pointer.strength;
        const pulse = Math.max(0, 1 - cueDistance / (radius * 1.35)) * Math.max(0, 1 - this.cue.age / 2.8);
        response = Math.max(hover, pulse);
        if (response > 0) {
          const distance = pulse > hover ? cueDistance : pointerDistance;
          const awayX = pulse > hover ? cx : px, awayY = pulse > hover ? cy : py;
          dx += (distance > 1 ? awayX / distance : Math.cos(a.seed)) * response * 5.5;
          dy += (distance > 1 ? awayY / distance : Math.sin(a.seed)) * response * 5.5;
        }
      }
      a.response += (response - a.response) * (1 - Math.exp(-dt * (response > a.response ? 9 : 2.5)));
      if (response > 0.01 || a.response > 0.05) a.state = "responding";
      const targetHeading = Math.atan2(dy, dx);
      const difference = Math.atan2(Math.sin(targetHeading - a.heading), Math.cos(targetHeading - a.heading));
      const turnRate = (a.kind === "turtles" ? 0.38 : a.kind === "butterflies" ? 1 : a.state === "feeding" ? 0.95 : 0.55) + avoidance * 0.7 + a.response * (a.kind === "turtles" ? 0.65 : 1.2);
      a.heading += clamp(difference, -turnRate * step, turnRate * step);
      const baseSpeed = a.kind === "turtles" ? 12 : 22;
      const velocity = baseSpeed * (1 - (1 - a.depth) * depth * 0.65) * (a.state === "feeding" ? 1.35 : 1) * (0.85 + a.scale * 0.15) * (1 + a.response * (a.kind === "turtles" ? 0.55 : 0.85));
      const ease = 1 - Math.exp(-step * 2.5);
      const drift = Math.max(1, Math.hypot(driftX, driftY));
      const targetX = (Math.cos(a.heading) + driftX / drift * 0.7) * velocity;
      const targetY = (Math.sin(a.heading) + driftY / drift * 0.7) * velocity;
      const limit = Math.max(1, Math.hypot(targetX, targetY) / (velocity * 1.35));
      a.vx += (targetX / limit - a.vx) * ease;
      a.vy += (targetY / limit - a.vy) * ease;
      a.x = clamp(a.x + a.vx * step, -40, this.width + 40);
      a.y = clamp(a.y + a.vy * step, 40, this.height - 30);
      a.phase += step * (a.kind === "butterflies" ? 3 : a.kind === "turtles" ? 1.8 : 3.2) * (0.85 + a.scale * 0.15) * (1 + a.response * (a.kind === "butterflies" ? 1.5 : 0.8));
    }
  }

  animalScale(a: Animal) {
    const viewportScale = clamp(this.width / 1100, 0.48, 1.1);
    const kindScale = a.kind === "butterflies" ? 0.8 : a.kind === "turtles" ? 0.92 : 1;
    return 104 * viewportScale * a.scale * kindScale * this.settings.size * (1 - (1 - a.depth) * this.settings.depth * 0.47);
  }
}
