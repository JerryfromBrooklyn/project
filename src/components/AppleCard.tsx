import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";
import { motion } from "framer-motion";

const cardVariants = cva(
  "rounded-apple-lg backdrop-blur-md border transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-white/90 border-gray-100 shadow-apple",
        glass: "bg-white/60 border-white/20 shadow-apple",
        filled: "border-transparent shadow-apple",
        dark: "bg-gray-900/90 border-gray-800 shadow-apple text-white",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      hover: {
        default: "hover:shadow-apple-md transition-shadow duration-200",
        raise: "hover:-translate-y-1 hover:shadow-apple-lg transition-all duration-200",
        glow: "hover:shadow-apple-lg hover:shadow-blue-500/20 transition-all duration-200",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hover: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  gradient?: string;
  motion?: boolean;
  motionProps?: any;
  heading?: React.ReactNode;
  footer?: React.ReactNode;
}

const AppleCard = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      hover,
      children,
      gradient,
      motion: isMotion = false,
      motionProps = {},
      heading,
      footer,
      ...props
    },
    ref
  ) => {
    const Card = isMotion ? motion.div : "div";
    const defaultMotionProps = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 10 },
      transition: { duration: 0.4 },
    };

    const combinedMotionProps = {
      ...defaultMotionProps,
      ...motionProps,
    };

    const cardProps = isMotion ? { ...combinedMotionProps, ...props } : props;

    return (
      <Card
        ref={ref}
        className={cn(
          cardVariants({ variant, size, hover }),
          gradient && `bg-gradient-to-br ${gradient}`,
          className
        )}
        {...cardProps}
      >
        {heading && (
          <div className="mb-4 pb-4 border-b border-gray-100/50">
            {heading}
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-100/50">
            {footer}
          </div>
        )}
      </Card>
    );
  }
);

AppleCard.displayName = "AppleCard";

export { AppleCard, cardVariants };

export const AppleCardHeader = forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));

AppleCardHeader.displayName = "AppleCardHeader";

export const AppleCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-sf-pro-display text-xl leading-none tracking-tight font-semibold text-apple-gray-900",
      className
    )}
    {...props}
  />
));

AppleCardTitle.displayName = "AppleCardTitle";

export const AppleCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-apple-gray-600 font-sf-pro-text", className)}
    {...props}
  />
));

AppleCardDescription.displayName = "AppleCardDescription";

export const AppleCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-2", className)}
    {...props}
  />
));

AppleCardContent.displayName = "AppleCardContent";

export const AppleCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-apple-gray-200", className)}
    {...props}
  />
));

AppleCardFooter.displayName = "AppleCardFooter"; 