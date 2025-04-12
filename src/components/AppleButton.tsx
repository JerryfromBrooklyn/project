import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";
import { motion } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-apple-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-apple-blue text-white hover:bg-apple-blue/90 shadow-sm",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm",
        outline: "border border-gray-200 bg-transparent hover:bg-gray-50",
        ghost: "bg-transparent hover:bg-gray-50",
        dark: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
        light: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
        success: "bg-green-500 text-white hover:bg-green-600 shadow-sm",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
      },
      size: {
        xs: "text-xs h-7 px-3",
        sm: "text-sm h-9 px-4",
        md: "text-sm h-10 px-5",
        lg: "text-base h-11 px-6",
        xl: "text-lg h-12 px-8",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  motion?: boolean;
  motionProps?: any;
}

const AppleButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      children,
      asChild = false,
      loading = false,
      icon,
      iconPosition = "left",
      motion: isMotion = false,
      motionProps = {},
      ...props
    },
    ref
  ) => {
    const Button = isMotion ? motion.button : "button";
    
    const defaultMotionProps = {
      whileTap: { scale: 0.98 },
    };

    const combinedMotionProps = {
      ...defaultMotionProps,
      ...motionProps,
    };

    const buttonProps = isMotion ? { ...combinedMotionProps, ...props } : props;

    return (
      <Button
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...buttonProps}
      >
        {loading && (
          <svg
            className={cn("animate-spin -ml-1 mr-2 h-4 w-4", {
              "mr-2": iconPosition === "left",
              "ml-2 order-2": iconPosition === "right",
            })}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!loading && icon && iconPosition === "left" && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === "right" && (
          <span className="ml-2">{icon}</span>
        )}
      </Button>
    );
  }
);

AppleButton.displayName = "AppleButton";

export { AppleButton, buttonVariants }; 