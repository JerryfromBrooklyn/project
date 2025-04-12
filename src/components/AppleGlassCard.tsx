import React, { forwardRef } from "react";
import { cn } from "../utils/cn";
import { motion } from "framer-motion";

export interface AppleGlassCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  background?: string;
  border?: string;
  blur?: string;
  motion?: boolean;
  motionProps?: any;
  textColor?: string;
  spotlight?: boolean;
}

const AppleGlassCard = forwardRef<HTMLDivElement, AppleGlassCardProps>(
  (
    {
      className,
      children,
      background = "bg-white/10",
      border = "border border-white/20",
      blur = "backdrop-blur-md",
      motion: isMotion = false,
      motionProps = {},
      textColor = "text-white",
      spotlight = false,
      ...props
    },
    ref
  ) => {
    const Card = isMotion ? motion.div : "div";
    
    const defaultMotionProps = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 10 },
      transition: { duration: 0.3, ease: "easeOut" },
    };

    const combinedMotionProps = {
      ...defaultMotionProps,
      ...motionProps,
    };

    const cardProps = isMotion ? { ...combinedMotionProps, ...props } : props;

    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    
    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!spotlight) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      },
      [spotlight]
    );

    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-apple-lg",
          background,
          border,
          blur,
          textColor,
          className
        )}
        onMouseMove={handleMouseMove}
        {...cardProps}
      >
        {spotlight && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%)`,
            }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </Card>
    );
  }
);

AppleGlassCard.displayName = "AppleGlassCard";

export { AppleGlassCard };

export const AppleGlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between p-6 pt-3 mt-auto",
      className
    )}
    {...props}
  />
));

AppleGlassCardFooter.displayName = "AppleGlassCardFooter";

export default AppleGlassCard; 