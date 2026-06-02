import type { EasingDefinition, Variants } from "framer-motion";

/* ─────────────────────────────────────────────
   Emil Design Engineering Motion System
   Rules applied:
   - UI animations under 300ms
   - ease-out for entering elements (responsive feel)
   - ease-in-out for on-screen movement
   - ease for color/hover transitions only
   - No spring for standard UI (use spring only for drag/gesture)
   ───────────────────────────────────────────── */

export const EASE_OUT: EasingDefinition = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: EasingDefinition = [0.77, 0, 0.175, 1];
const EASE_STANDARD: EasingDefinition = [0.4, 0, 0.2, 1];

const DURATION_FAST = 0.15;
export const DURATION_STANDARD = 0.2;
const DURATION_SLOW = 0.3;

/* ── Enter / Exit Variants ── */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideFromLeft: Variants = {
  initial: { x: -16, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 16, opacity: 0 },
};

const slideFromRight: Variants = {
  initial: { x: 16, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -16, opacity: 0 },
};

const slideFromBottom: Variants = {
  initial: { y: 12, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -8, opacity: 0 },
};

/* ── Transition presets (use with Framer Motion) ── */
const transitionFast = {
  duration: DURATION_FAST,
  ease: EASE_OUT,
};

const transitionStandard = {
  duration: DURATION_STANDARD,
  ease: EASE_OUT,
};

const transitionSlow = {
  duration: DURATION_SLOW,
  ease: EASE_IN_OUT,
};

/* ── Stagger Container ── */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const staggerContainerSlow: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/* ── Per-item variants (use within stagger) ── */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

/* ── Button hover (Framer Motion — use sparingly) ── */
export const buttonHover: Variants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.97 },
};

/* ── Overlay / Backdrop ── */
const overlayIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ── Spring (drag/gesture only — not for standard UI) ── */
const springGesture = {
  type: "spring" as const,
  mass: 1,
  stiffness: 150,
  damping: 18,
};

/* ── Legacy transition export (for existing imports) ── */
export const transition = {
  type: "tween" as const,
  ease: EASE_OUT,
  duration: DURATION_STANDARD,
};
