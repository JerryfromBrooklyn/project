import { Variants } from 'framer-motion';

/**
 * Apple-style fade-in animation with subtle bounce
 */
export const fadeIn = (direction: string = 'up', delay: number = 0): Variants => {
  return {
    hidden: {
      y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
      opacity: 0,
    },
    show: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
        delay,
      },
    },
  };
};

/**
 * Subtle scale animation for hoverable elements
 */
export const scaleOnHover: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.03 }
};

/**
 * Card staggered animation for lists
 */
export const staggeredCards = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  }
};

/**
 * Slide-in animation for modals and popovers
 */
export const slideIn = (direction: string = 'up', delay: number = 0): Variants => {
  return {
    hidden: {
      y: direction === 'up' ? '100%' : direction === 'down' ? '-100%' : 0,
      x: direction === 'left' ? '100%' : direction === 'right' ? '-100%' : 0,
    },
    visible: {
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
        delay,
      },
    },
    exit: {
      y: direction === 'up' ? '100%' : direction === 'down' ? '-100%' : 0,
      x: direction === 'left' ? '100%' : direction === 'right' ? '-100%' : 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
  };
};

/**
 * Blur animation for loading states
 */
export const blurAnimation: Variants = {
  initial: { 
    filter: 'blur(0px)',
    opacity: 1
  },
  blur: { 
    filter: 'blur(4px)',
    opacity: 0.7,
    transition: { 
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1]
    }
  },
  unblur: { 
    filter: 'blur(0px)',
    opacity: 1,
    transition: { 
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

/**
 * Apple-style push animation for buttons and interactive elements
 */
export const pushOnTap: Variants = {
  initial: {
    scale: 1,
  },
  tap: {
    scale: 0.97,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

/**
 * Slide up and fade in animation
 */
export const slideUp: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1], // Apple's easing curve
    },
  },
};

/**
 * Slide in from the side (good for drawers, side panels)
 */
export const slideInFromSide = (side: 'left' | 'right'): Variants => ({
  initial: { x: side === 'left' ? -300 : 300, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: side === 'left' ? -300 : 300, opacity: 0, transition: { duration: 0.2 } }
});

/**
 * Staggered children animation for lists and grids
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Scale animation for modal/dialog entries
 */
export const scaleUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1], // Apple's easing curve
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/**
 * Animation for iOS-style swipe to delete
 */
export const swipeToDelete: Variants = {
  hidden: { x: 0 },
  visible: { x: 0 },
  swipe: (direction: number) => ({
    x: direction * 100,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 500, damping: 50 },
      opacity: { duration: 0.2 },
    },
  }),
};

/**
 * Spring animation for natural-feeling interactions
 */
export const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 17,
};

/**
 * Smooth transition for subtle animations
 */
export const smoothTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier
  duration: 0.3
};

/**
 * Apple-style page transitions
 */
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: 'beforeChildren',
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.3,
      when: 'afterChildren'
    }
  }
};

/**
 * Subtle hover animation for card elements
 */
export const cardHover: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 4px 6px 0 rgb(0 0 0 / 0.04)',
  },
  hover: {
    y: -4,
    boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.15), 0 0 2px 0 rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Scale in animation for when elements are added
 */
export const scaleIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: springTransition
  },
  exit: { 
    scale: 0.9, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Apple's blur view transition
 */
export const blurViewTransition: Variants = {
  initial: { backdropFilter: 'blur(0px)', opacity: 0 },
  animate: { 
    backdropFilter: 'blur(10px)', 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    backdropFilter: 'blur(0px)', 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export const subtleFloat: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      repeatType: "loop",
      ease: "easeInOut",
    },
  },
};

export const popIn: Variants = {
  hidden: { 
    scale: 0.8,
    opacity: 0,
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 200,
    },
  },
  exit: { 
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Apple-style fade in up animation
 * Used for elements entering the viewport
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // Swift ease curve (custom cubic bezier)
    },
  },
};

/**
 * Apple-style spring animation
 * For elements that need a bouncy entrance
 */
export const springIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
};

/**
 * Smooth slide-in animation
 * For modals, drawers and panels
 */
export const slideIn = (direction: 'left' | 'right' | 'up' | 'down'): Variants => {
  let x = 0;
  let y = 0;
  
  if (direction === 'left') x = -100;
  if (direction === 'right') x = 100;
  if (direction === 'up') y = 100;
  if (direction === 'down') y = -100;
  
  return {
    hidden: {
      x,
      y,
      opacity: 0,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1], // Swift ease curve
      },
    },
    exit: {
      x,
      y,
      opacity: 0,
      transition: {
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1], 
      },
    },
  };
};

/**
 * Apple-style staggered children animation
 * Parent container variant for staggered children animations
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const hoverScale: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
};

export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

export const slideInFromRight: Variants = {
  initial: {
    x: 20,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier
    },
  },
  exit: {
    x: 20,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const slideInFromBottom: Variants = {
  initial: {
    y: 20,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier
    },
  },
  exit: {
    y: 20,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const staggerChildren = (staggerTime: number = 0.1): Variants => {
  return {
    animate: {
      transition: {
        staggerChildren: staggerTime,
      },
    },
  };
};

export const transitionConfig = {
  ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier curve common in Apple's animations
  duration: 0.3,
}; 