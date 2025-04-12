import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "link" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  rounded?: boolean;
  appleStyle?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      fullWidth = false,
      loading = false,
      rounded = false,
      appleStyle = true,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const variantClasses = {
      primary: "bg-apple-blue-500 text-white hover:bg-apple-blue-600 focus:ring-apple-blue-500/20",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500/20",
      tertiary: "bg-transparent text-gray-900 hover:bg-gray-100 border border-gray-300 focus:ring-gray-500/20",
      link: "bg-transparent text-apple-blue-500 hover:underline hover:bg-transparent p-0",
      danger: "bg-apple-red-500 text-white hover:bg-apple-red-600 focus:ring-apple-red-500/20",
      success: "bg-apple-green-500 text-white hover:bg-apple-green-600 focus:ring-apple-green-500/20",
    };

    const sizeClasses = {
      xs: "text-xs py-1 px-2",
      sm: "text-sm py-1.5 px-3",
      md: "text-sm py-2 px-4",
      lg: "text-base py-2.5 px-5",
      xl: "text-base py-3 px-6",
    };

    const iconSizeClasses = {
      xs: "h-3.5 w-3.5",
      sm: "h-4 w-4",
      md: "h-4 w-4",
      lg: "h-5 w-5",
      xl: "h-5 w-5",
    };

    // Apply Apple styling
    const appleButtonClasses = appleStyle
      ? "font-medium shadow-sm transition-all duration-200 ease-in-out active:scale-95 active:translate-y-0.5" +
        (variant !== "link" ? " backdrop-blur-sm" : "")
      : "";

    // Apple-style rounded corners
    const roundedClasses = rounded
      ? "rounded-full"
      : "rounded-apple-sm";

    // Disabled styles
    const disabledClasses = isDisabled
      ? "opacity-50 cursor-not-allowed"
      : "";

    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          roundedClasses,
          appleButtonClasses,
          disabledClasses,
          fullWidth ? "w-full" : "",
          variant === "link" ? "p-0" : "",
          className
        )}
        disabled={isDisabled}
        whileTap={!isDisabled && appleStyle ? { scale: 0.97 } : undefined}
        whileHover={!isDisabled && appleStyle ? { scale: 1.02 } : undefined}
        {...props}
      >
        {loading && (
          <svg
            className={cn("animate-spin -ml-1 mr-2", iconSizeClasses[size])}
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
        
        {leftIcon && !loading && (
          <span className={cn("mr-2", iconSizeClasses[size])}>
            {leftIcon}
          </span>
        )}
        
        <span>{children}</span>
        
        {rightIcon && (
          <span className={cn("ml-2", iconSizeClasses[size])}>
            {rightIcon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export interface IconButtonProps extends ButtonProps {
  "aria-label": string;
  icon: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, children, "aria-label": ariaLabel, ...props }, ref) => {
    return (
      <Button 
        ref={ref}
        aria-label={ariaLabel}
        className={cn("p-0", className)}
        {...props}
      >
        {icon}
        {children}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton"; 