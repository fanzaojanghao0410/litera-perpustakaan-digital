import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
children: ReactNode;
mode?: 'slide' | 'fade' | 'scale' | 'lift';
}

/* =========================
Transition Config
========================= */

const springTransition: Transition = {
type: 'spring',
stiffness: 100,
damping: 20,
mass: 1,
};

const smoothTransition: Transition = {
duration: 0.5,
ease: [0.43, 0.13, 0.23, 0.96],
};

const fadeTransition: Transition = {
duration: 0.35,
ease: 'easeInOut',
};

const transitionConfig: Record<string, Transition> = {
slide: springTransition,
fade: fadeTransition,
scale: springTransition,
lift: smoothTransition,
};

/* =========================
Animation Variants
========================= */

const variants = {
slide: {
initial: { opacity: 0, x: 24 },
animate: { opacity: 1, x: 0 },
exit: { opacity: 0, x: -24 },
},

fade: {
initial: { opacity: 0 },
animate: { opacity: 1 },
exit: { opacity: 0 },
},

scale: {
initial: { opacity: 0, scale: 0.96, y: 8 },
animate: { opacity: 1, scale: 1, y: 0 },
exit: { opacity: 0, scale: 0.985, y: -8 },
},

lift: {
initial: { opacity: 0, y: 32 },
animate: { opacity: 1, y: 0 },
exit: { opacity: 0, y: -32 },
},
};

/* =========================
Scroll Config
========================= */

// Disable browser restoring previous scroll position
if ('scrollRestoration' in history) {
history.scrollRestoration = 'manual';
}

// Always start at top on refresh/reload
window.onbeforeunload = () => {
window.scrollTo(0, 0);
};

/* =========================
Page Transition
========================= */

export function PageTransition({
children,
mode = 'fade',
}: PageTransitionProps) {
const location = useLocation();

// NOTE: no nested <AnimatePresence> here — App.tsx already wraps the routes.
// Nesting made every navigation mount/unmount twice.
return (
<motion.div
key={location.pathname}
initial={variants[mode].initial}
animate={variants[mode].animate}
exit={variants[mode].exit}
transition={transitionConfig[mode]}
className="w-full"
>
{children}
</motion.div>
);
}


/* =========================
Scroll To Top
========================= */

export function useScrollToTop() {
const location = useLocation();

useEffect(() => {
const timeout = setTimeout(() => {
window.scrollTo({
top: 0,
left: 0,
behavior: 'auto',
});
}, 50);

return () => clearTimeout(timeout);

}, [location.pathname, location.search]);
}

/* =========================
Page Wrapper
========================= */

export function PageWrapper({
children,
mode = 'fade',
}: PageTransitionProps) {
useScrollToTop();

return (
<PageTransition mode={mode}>
{children}
</PageTransition>
);
}