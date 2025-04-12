import React, { forwardRef, useState, InputHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  fullWidth?: boolean;
  variant?: "outlined" | "filled" | "plain";
  size?: "sm" | "md" | "lg";
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      onRightIconClick,
      fullWidth = false,
      variant = "outlined",
      size = "md",
      required,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || `text-field-${Math.random().toString(36).substring(2, 9)}`;
    const hasError = !!errorMessage;

    const variantClasses = {
      outlined: "border border-gray-300 shadow-sm bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500",
      filled: "border border-transparent bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500",
      plain: "border-b border-gray-300 bg-transparent rounded-none focus-within:border-blue-500",
    };

    const sizeClasses = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    };

    const inputSizeClasses = {
      sm: "py-1.5 px-2",
      md: "py-2 px-3",
      lg: "py-2.5 px-4",
    };

    const disabledClasses = disabled
      ? "opacity-60 cursor-not-allowed bg-gray-50"
      : "";

    const errorClasses = hasError
      ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500"
      : "";

    const iconSizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    return (
      <div className={cn(
        "flex flex-col",
        fullWidth ? "w-full" : "",
        className
      )}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "mb-1 font-medium",
              sizeClasses[size],
              hasError ? "text-red-600" : "text-gray-700",
              disabled ? "opacity-60" : ""
            )}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div
          className={cn(
            "relative flex items-center overflow-hidden rounded-apple transition-all duration-200",
            variantClasses[variant],
            errorClasses,
            disabledClasses
          )}
        >
          {leftIcon && (
            <div className={cn("flex-shrink-0 ml-2 mr-1 text-gray-500", disabled ? "opacity-60" : "")}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-grow bg-transparent outline-none placeholder-gray-400 disabled:cursor-not-allowed",
              inputSizeClasses[size],
              sizeClasses[size],
              "w-full"
            )}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={helperText || errorMessage ? `${inputId}-helper` : undefined}
            required={required}
            {...props}
          />

          {rightIcon && (
            <motion.div
              className={cn(
                "flex-shrink-0 mr-2 ml-1",
                onRightIconClick ? "cursor-pointer" : "",
                hasError ? "text-red-500" : "text-gray-500"
              )}
              whileTap={onRightIconClick ? { scale: 0.95 } : undefined}
              onClick={!disabled && onRightIconClick ? onRightIconClick : undefined}
            >
              {rightIcon}
            </motion.div>
          )}
        </div>

        {(helperText || errorMessage) && (
          <p
            id={`${inputId}-helper`}
            className={cn(
              "mt-1",
              sizeClasses.sm,
              hasError ? "text-red-600" : "text-gray-500"
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField"; 