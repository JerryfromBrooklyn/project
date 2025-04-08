import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return _jsx(Comp, {
      className: cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-apple-blue-600 text-white hover:bg-apple-blue-700": variant === "default",
          "bg-apple-red-500 text-white hover:bg-apple-red-600": variant === "destructive",
          "border border-apple-gray-200 bg-white hover:bg-apple-gray-100 hover:text-apple-gray-900": variant === "outline",
          "bg-apple-gray-100 text-apple-gray-900 hover:bg-apple-gray-200": variant === "secondary",
          "bg-transparent text-apple-gray-900 hover:bg-apple-gray-100": variant === "ghost",
          "bg-transparent text-apple-blue-600 hover:bg-transparent hover:text-apple-blue-700 underline-offset-4 hover:underline": variant === "link",
        },
        {
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-md px-3": size === "sm",
          "h-11 rounded-md px-8": size === "lg",
          "h-8 w-8 p-0": size === "icon",
        },
        className
      ),
      ref: ref,
      ...props
    });
  }
);

Button.displayName = "Button";

export default Button;
