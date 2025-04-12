import React, { HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "filled" | "outlined" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  bordered?: boolean;
  clickable?: boolean;
  fullWidth?: boolean;
  inset?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "elevated",
      padding = "md",
      hoverable = false,
      bordered = false,
      clickable = false,
      fullWidth = false,
      inset = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      elevated: "bg-white shadow-md",
      filled: "bg-gray-100",
      outlined: "bg-white border border-gray-200",
      glass: "bg-white/70 backdrop-blur-lg shadow-sm border border-white/20",
    };

    const paddingClasses = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    const hoverClasses = hoverable
      ? "transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
      : "";

    const cursorClasses = clickable
      ? "cursor-pointer"
      : "";

    const widthClasses = fullWidth
      ? "w-full"
      : "";

    const insetClasses = inset
      ? "ring-1 ring-inset ring-gray-200"
      : "";

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-apple overflow-hidden",
          variantClasses[variant],
          paddingClasses[padding],
          hoverClasses,
          cursorClasses,
          widthClasses,
          insetClasses,
          bordered && variant !== "outlined" ? "border border-gray-200" : "",
          className
        )}
        whileHover={
          clickable
            ? { scale: 1.01, transition: { duration: 0.2 } }
            : undefined
        }
        whileTap={
          clickable
            ? { scale: 0.98, transition: { duration: 0.2 } }
            : undefined
        }
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? "button" : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  separated?: boolean;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      action,
      separated = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-row items-start justify-between",
          separated && "pb-3 border-b border-gray-200 mb-4",
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="flex flex-col">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {action && (
          <div className="ml-4">
            {action}
          </div>
        )}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  separated?: boolean;
  actions?: React.ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  (
    {
      className,
      separated = false,
      actions,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between",
          separated && "pt-3 border-t border-gray-200 mt-4",
          className
        )}
        {...props}
      >
        <div>{children}</div>
        {actions && <div>{actions}</div>}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  interactive?: boolean;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  variant = "default",
  interactive = false,
  className,
}) => {
  const variants = {
    default: "bg-white border border-apple-gray-200 text-apple-gray-900",
    primary: "bg-apple-blue text-white",
    secondary: "bg-apple-gray-100 border border-apple-gray-200 text-apple-gray-900",
  };

  const shadowVariants = {
    default: "shadow-apple",
    primary: "shadow-apple-lg",
    secondary: "shadow-apple",
  };

  const descriptionColors = {
    default: "text-apple-gray-600",
    primary: "text-white/80",
    secondary: "text-apple-gray-600",
  };

  return (
    <motion.div
      className={cn(
        "rounded-apple-lg p-6 transition-all",
        variants[variant],
        shadowVariants[variant],
        interactive && "hover:shadow-apple-lg hover:-translate-y-1",
        className
      )}
      whileHover={interactive ? { y: -5 } : {}}
      transition={{ duration: 0.2 }}
    >
      {icon && (
        <div className="mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-apple-full flex items-center justify-center",
              variant === "default" ? "bg-apple-blue/10" : "bg-white/10"
            )}
          >
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-xl font-medium font-sf-pro mb-2">{title}</h3>
      <p className={cn("text-base", descriptionColors[variant])}>{description}</p>
    </motion.div>
  );
};

FeatureCard.displayName = "FeatureCard";

export default FeatureCard; 