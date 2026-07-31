/**
 * Previously this hook set `document.body.style.opacity = 0` on every mount and
 * faded it back in after a timeout. That caused a full-page blank flash, blocked
 * the first paint, and created a stacking context on <body> that forced every
 * glass layer to re-composite. Page-level motion is handled by <PageTransition />,
 * so this hook is now a no-op kept for API compatibility.
 */
export const usePageAnimation = () => {
  // intentionally empty
};
