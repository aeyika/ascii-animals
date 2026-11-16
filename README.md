## Ascii Animals

## Run locally

Use Node.js 22.13 or newer and npm. The launch scripts normalize the project’s real path to avoid duplicate React loading when Windows directory casing differs.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production build:

```sh
npm run build
npm start
```

```sh
npm run lint
npm run typecheck
npm run test:engine
```

## Explore

- Switch between koi, sea turtles, butterflies and a mixed ecosystem.
- Click or tap the pond to scatter temporary food. Nearby koi approach and consume it; character ripples fade naturally.
- Click or tap near a turtle to guide its swim toward the ripple, with a temporary increase in flipper activity.
- Move your pointer near butterflies to send them fluttering away. Clicking or tapping creates a wider flutter response. Movement and wing activity gradually return to normal.
- Open **Tweaks** to change count, speed, size, character resolution, palette, brightness, depth, grid and interactions live.
- Pause from either the bottom corner or Tweaks. **Reset defaults** restores controls without restarting animal positions or phases.
- Reduced-motion preferences start the scene paused. Resume explicitly if desired. Mobile starts with seven animals and uses a compact settings drawer.

## Structure

- `components/playground/scene.tsx`: Canvas lifecycle, resize/DPR handling, input, animation loop and cleanup.
- `components/playground/settings-panel.tsx`: Glisse settings panel and accessible controls.
- `components/playground/playground.tsx`: Scene selection, responsive preferences and interface.
- `lib/animals/simulation.ts`: Individual state, steering, depth, feeding and pointer behaviours.
- `lib/animals/geometry.ts`: Procedural koi, shells/flippers and projected butterfly wings.
- `lib/animals/renderer.ts`: Bounding-box sampling, fixed screen grid, density glyphs and cached colours.
- `lib/animals/settings.ts` and `types.ts`: Shared settings and types. Each feature has a public barrel export.

