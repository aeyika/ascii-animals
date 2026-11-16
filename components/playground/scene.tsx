"use client";

import { useEffect, useRef } from "react";
import { AsciiRenderer, Simulation, type Mode, type Settings } from "@/lib/animals";

interface SceneProps { settings: Settings; mode: Mode }

export function Scene({ settings, mode }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Simulation | null>(null);
  const configuration = useRef({ settings, mode });

  useEffect(() => {
    configuration.current = { settings, mode };
    engineRef.current?.configure(settings, mode);
  }, [settings, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const engine = new Simulation(), renderer = new AsciiRenderer();
    engineRef.current = engine;
    let frame = 0, last = 0, lastDraw = 0, dirty = true;
    let previousSettings = engine.settings;
    let dpr = 0;
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.invalidate();
      engine.resize(box.width, box.height);
      dirty = true;
    };
    resize();
    engine.configure(configuration.current.settings, configuration.current.mode);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const pointerMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      engine.movePointer(event.clientX - box.left, event.clientY - box.top);
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const box = canvas.getBoundingClientRect();
      engine.interact(event.clientX - box.left, event.clientY - box.top);
    };
    const visibility = () => { last = 0; dirty = true; };
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerdown", pointerDown);
    document.addEventListener("visibilitychange", visibility);
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      if (document.hidden) { last = 0; return; }
      if (dpr !== Math.min(window.devicePixelRatio || 1, 2)) resize();
      const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
      last = now;
      engine.update(dt);
      if (engine.settings !== previousSettings) { dirty = true; previousSettings = engine.settings; }
      const frameInterval = engine.width < 640 ? 1000 / 40 : 1000 / 60;
      if ((dirty || !engine.settings.paused) && now - lastDraw >= frameInterval - 1) {
        renderer.render(context, engine);
        lastDraw = now;
        dirty = false;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("visibilitychange", visibility);
      engineRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="animal-canvas absolute inset-0 h-full w-full touch-none" aria-label={`Animated ASCII ${mode === "mixed" ? "koi, sea turtles and butterflies" : mode} scene. Use the controls to adjust or pause the animation.`} role="img" />;
}
