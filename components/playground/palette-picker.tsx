"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Button, Glass } from "glisse";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import type { Palette } from "@/lib/animals";

interface PalettePickerProps {
  value: Palette;
  onValueChange: (value: Palette) => void;
}

const PALETTES: { value: Palette; label: string; colors: string[] }[] = [
  { value: "natural", label: "Natural", colors: ["#e7d8bb", "#e79869", "#9ba97a"] },
  { value: "pastel", label: "Soft pastel", colors: ["#efc3bd", "#cfb6de", "#b7d5df"] },
  { value: "moonlight", label: "Moonlight", colors: ["#738da6", "#9db4c5", "#c1d4db"] },
];

function Swatches({ colors }: { colors: string[] }) {
  return <span className="palette-swatches" aria-hidden="true">{colors.map((color, index) => <span key={index} style={{ backgroundColor: color }} />)}</span>;
}

interface PaletteOptionsProps extends PalettePickerProps {
  id: string;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

function PaletteOptions({ id, value, activeIndex, setActiveIndex, onValueChange }: PaletteOptionsProps) {
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();

  return <motion.div
    id={`${id}-options`}
    role="listbox"
    aria-labelledby={`${id}-label`}
    aria-hidden={!present}
    inert={!present}
    className="palette-popover"
    initial={{ opacity: 0, y: reducedMotion ? 0 : -4, scale: reducedMotion ? 1 : 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: reducedMotion ? 0 : -3, scale: reducedMotion ? 1 : 0.98, transition: { duration: reducedMotion ? 0 : 0.1 } }}
    transition={{ duration: reducedMotion ? 0 : 0.16, ease: [0.2, 0.8, 0.2, 1] }}
  >
    <Glass className="palette-surface">
      {PALETTES.map((palette, index) => <div
        key={palette.value}
        id={`${id}-option-${index}`}
        role="option"
        aria-selected={palette.value === value}
        className="palette-option"
        data-active={index === activeIndex || undefined}
        onPointerMove={() => setActiveIndex(index)}
        onPointerDown={event => event.preventDefault()}
        onClick={() => onValueChange(palette.value)}
      >
        <Swatches colors={palette.colors} />
        <span>{palette.label}</span>
        {palette.value === value && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg>}
      </div>)}
    </Glass>
  </motion.div>;
}

export function PalettePicker({ value, onValueChange }: PalettePickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const selected = PALETTES.find(palette => palette.value === value)!;

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const focusOutside = (event: FocusEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focusOutside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", focusOutside);
    };
  }, [open]);

  const choose = (palette: Palette) => {
    onValueChange(palette);
    setOpen(false);
  };
  const toggle = () => {
    if (!open) setActiveIndex(PALETTES.indexOf(selected));
    setOpen(previous => !previous);
  };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(index => open ? (index + (event.key === "ArrowDown" ? 1 : -1) + PALETTES.length) % PALETTES.length : PALETTES.indexOf(selected));
      setOpen(true);
    } else if (open && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : PALETTES.length - 1);
    } else if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      choose(PALETTES[activeIndex].value);
    } else if (open && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "Tab") setOpen(false);
  };

  return <div className="palette-row mt-2 flex items-center justify-between gap-3">
    <span id={`${id}-label`} className="palette-label">Colour palette</span>
    <div ref={containerRef} className="palette-picker">
      <Button
        role="combobox"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-options` : undefined}
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        onClick={toggle}
        onKeyDown={keyDown}
      >
        <span className="palette-trigger">
          <Swatches colors={selected.colors} />
          <span id={`${id}-value`}>{selected.label}</span>
          <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.16 }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 6.5 3 3 3-3" /></motion.svg>
        </span>
      </Button>
      <AnimatePresence initial={false}>
        {open && <PaletteOptions key="palette-options" id={id} value={value} activeIndex={activeIndex} setActiveIndex={setActiveIndex} onValueChange={choose} />}
      </AnimatePresence>
    </div>
  </div>;
}
