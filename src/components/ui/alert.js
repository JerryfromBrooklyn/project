import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../../utils/cn';

const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  return _jsx("div", {
    ref: ref,
    role: "alert",
    className: cn(
      "relative w-full rounded-lg border p-4",
      {
        "bg-apple-gray-50 text-apple-gray-900 border-apple-gray-200": variant === "default",
        "bg-apple-red-50 text-apple-red-900 border-apple-red-200": variant === "destructive",
      },
      className
    ),
    ...props
  });
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => 
  _jsx("h5", {
    ref: ref,
    className: cn("mb-1 font-medium leading-none tracking-tight", className),
    ...props
  })
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => 
  _jsx("div", {
    ref: ref,
    className: cn("text-sm [&_p]:leading-relaxed", className),
    ...props
  })
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription }; 