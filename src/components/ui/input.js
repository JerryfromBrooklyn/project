import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return _jsx("input", {
    type: type,
    className: cn(
      "flex h-10 w-full rounded-md border border-apple-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-apple-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ref: ref,
    ...props
  });
});

Input.displayName = "Input";

export default Input; 