import assert from "node:assert/strict";
import { Simulation } from "../.verification/engine/simulation.js";
import { DEFAULT_SETTINGS } from "../.verification/engine/settings.js";
import { sampleAnimal } from "../.verification/engine/geometry.js";
import { AsciiRenderer } from "../.verification/engine/renderer.js";

const create = (mode = 'koi') => {
  const sim = new Simulation();
  sim.resize(1440, 900);
  sim.configure({ ...DEFAULT_SETTINGS }, mode);
  return sim;
};

for (const mode of ['koi', 'turtles', 'butterflies', 'mixed']) {
  const sim = create(mode);
  assert.equal(sim.animals.length, 12);
  if (mode === 'mixed') assert.equal(new Set(sim.animals.map(a => a.kind)).size, 3);
  const before = sim.animals.map(a => [a.x, a.y, a.phase]);
  for (let i = 0; i < 600; i++) sim.update(1 / 60);
  assert(sim.animals.every((a, i) => a.x !== before[i][0] && a.phase !== before[i][2]));
  for (const a of sim.animals) {
    const sample = { coverage: 0, density: 0, color: 0 };
    let occupied = 0;
    for (let y = -1; y < 1; y += 0.04) for (let x = -1.5; x < 1.1; x += 0.04) {
      sampleAnimal(a, x, y, sample);
      if (sample.coverage > 0) occupied++;
    }
    assert(occupied > 150, `${a.kind} has a substantial silhouette`);
    sampleAnimal(a, 0.2, 0.02, sample);
    const first = { ...sample };
    sampleAnimal(a, 0.2, 0.02, sample);
    assert.deepEqual(sample, first, 'local markings are deterministic');
  }
  let draws = 0;
  const ctx = { clearRect() {}, fillText(glyph, x, y) { assert(' .,:;+=ox%#@'.includes(glyph)); assert(Number.isFinite(x + y)); draws++; } };
  new AsciiRenderer().render(ctx, sim);
  assert(draws > 500, `${mode} renders real glyphs`);
  console.log(`PASS ${mode}: movement, silhouette, stable sampling, glyph rendering`);
}

const sim = create();
const animal = sim.animals[0];
const original = { ...animal };
sim.configure({ ...sim.settings, size: 1.4, brightness: 1.2, characterSize: 9 }, 'koi');
assert.deepEqual(animal, original, 'appearance settings preserve state');
sim.configure({ ...sim.settings, paused: true }, 'koi');
sim.update(2);
assert.deepEqual(animal, original, 'pause freezes position and pose');
sim.interact(animal.x, animal.y);
assert.equal(sim.food.length, 0, 'paused scene ignores feeding');
sim.configure({ ...sim.settings, paused: false }, 'koi');
sim.interact(animal.x + Math.cos(animal.heading) * sim.animalScale(animal) * 0.64, animal.y + Math.sin(animal.heading) * sim.animalScale(animal) * 0.64);
assert.equal(sim.food.length, 7);
sim.update(1 / 60);
assert.equal(animal.state, 'feeding');
assert(sim.food.some(f => f.life < 15 - 1 / 60), 'food is consumed by nearby noses');
for (let i = 0; i < 1200; i++) sim.update(1 / 60);
assert.equal(sim.food.length, 0, 'food expires');
assert.equal(sim.ripples.length, 0, 'ripples expire');
sim.configure({ ...sim.settings, interaction: false }, 'koi');
sim.interact(200, 200);
assert.equal(sim.food.length, 0, 'disabled interaction is respected');
sim.configure({ ...DEFAULT_SETTINGS, count: 5 }, 'butterflies');
assert.equal(sim.animals.length, 5);
const butterfly = sim.animals[0];
sim.movePointer(butterfly.x + 10, butterfly.y + 10);
sim.update(1 / 60);
assert.equal(butterfly.state, 'responding');
for (let i = 0; i < 300; i++) sim.update(1 / 60);
assert.equal(butterfly.state, 'wandering');
sim.resize(390, 844);
for (let i = 0; i < 7200; i++) sim.update(1 / 60);
assert(sim.animals.every(a => Number.isFinite(a.x + a.y + a.heading) && a.x >= -40 && a.x <= 430 && a.y >= 40 && a.y <= 814));
console.log('PASS live settings, pause/resume, feeding, expiry, interaction toggle, pointer response, resize and two-minute simulation');

for (const [width, height, count] of [[1440, 900, 12], [390, 844, 7]]) {
  for (const mode of ['koi', 'turtles', 'butterflies', 'mixed']) {
    const scene = new Simulation();
    scene.resize(width, height);
    scene.configure({ ...DEFAULT_SETTINGS, count }, mode);
    let closePairs = 0, pairs = 0;
    for (let frame = 0; frame < 5400; frame++) {
      scene.update(1 / 30);
      if (frame < 900 || frame % 15) continue;
      for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
        const a = scene.animals[i], b = scene.animals[j];
        const bodyClearance = (scene.animalScale(a) + scene.animalScale(b)) * 0.6;
        if (Math.hypot(a.x - b.x, a.y - b.y) < bodyClearance) closePairs++;
        pairs++;
      }
    }
    assert(closePairs / pairs < 0.01, `${mode} maintains body clearance on a ${width}px viewport`);
  }
}

for (const mode of ['koi', 'turtles', 'butterflies']) {
  const scene = create(mode);
  scene.configure({ ...DEFAULT_SETTINGS, count: 2 }, mode);
  for (const a of scene.animals) { a.x = 720; a.y = 450; a.heading = 0; a.vx = 10; a.vy = 0; }
  for (let i = 0; i < 1800; i++) scene.update(1 / 60);
  assert(Math.hypot(scene.animals[0].x - scene.animals[1].x, scene.animals[0].y - scene.animals[1].y) > 80, `${mode} can separate even from identical starting positions`);
}
console.log('PASS desktop/mobile spacing across all modes and recovery from overlapping positions');

for (const mode of ['turtles', 'butterflies']) {
  for (const input of mode === 'turtles' ? ['tap'] : ['tap', 'pointer']) {
    const active = create(mode), control = create(mode);
    for (const scene of [active, control]) {
      scene.configure({ ...DEFAULT_SETTINGS, count: 1 }, mode);
      Object.assign(scene.animals[0], { x: 720, y: 450, heading: 0, vx: 12, vy: 0 });
    }
    const x = mode === 'turtles' ? 660 : 750, y = mode === 'turtles' ? 580 : 450;
    if (input === 'tap') active.interact(x, y);
    else active.movePointer(x, y);
    for (let frame = 0; frame < 240; frame++) { active.update(1 / 60); control.update(1 / 60); }
    const a = active.animals[0], b = control.animals[0];
    assert(Math.hypot(a.x - b.x, a.y - b.y) > 12, `${mode} ${input} changes the visible swimming or flight path`);
    assert(a.phase > b.phase + 1, `${mode} ${input} visibly increases flipper or wing activity`);
    const activeDistance = Math.hypot(a.x - x, a.y - y), controlDistance = Math.hypot(b.x - x, b.y - y);
    assert(mode === 'turtles' ? activeDistance < controlDistance : activeDistance > controlDistance, `${mode} moves ${mode === 'turtles' ? 'toward' : 'away from'} the interaction`);
    for (let frame = 0; frame < 900; frame++) active.update(1 / 60);
    assert.equal(a.state, 'wandering', 'the interaction response expires');
    assert(a.response < 0.01, 'flipper and wing activity returns to normal');
    active.interact(a.x, a.y);
    active.update(1 / 60);
    assert.equal(a.state, 'responding', 'an interaction directly on an animal also works');
    active.configure({ ...active.settings, interaction: false }, mode);
    assert.equal(a.response, 0);
    assert.equal(a.state, 'wandering');
    active.configure({ ...active.settings, interaction: true, paused: true }, mode);
    const frozen = { ...a };
    active.interact(a.x, a.y);
    active.movePointer(a.x, a.y);
    active.update(1);
    assert.deepEqual(a, frozen, 'paused animals ignore both touch and pointer input');
  }
}
console.log('PASS turtle guidance and butterfly touch/hover responses: path, pose, expiry, pause and interaction toggle');
