import { HTMLMotionProps } from 'framer-motion';

declare module 'framer-motion' {
  export interface MotionProps extends HTMLMotionProps<"div"> {
    initial?: Record<string, number | string>;
    animate?: Record<string, number | string>;
    exit?: Record<string, number | string>;
    transition?: {
      duration?: number;
      delay?: number;
      ease?: string;
      repeat?: number;
      repeatType?: string;
    };
    viewport?: {
      once?: boolean;
      margin?: string;
    };
  }
}