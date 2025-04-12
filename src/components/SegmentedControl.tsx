import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export interface SegmentOption {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  position?: "inline" | "stacked";
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  size = "md",
  fullWidth = false,
  className,
  position = "inline",
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [segmentWidths, setSegmentWidths] = useState<number[]>([]);
  const [segmentOffsets, setSegmentOffsets] = useState<number[]>([]);

  // Calculate sizes of segments for animation
  useEffect(() => {
    if (containerRef.current) {
      const children = Array.from(containerRef.current.children) as HTMLElement[];
      const widths = children.map(child => child.offsetWidth);
      const offsets = children.map((_, index) => {
        return children.slice(0, index).reduce((acc, child) => acc + child.offsetWidth, 0);
      });
      
      setSegmentWidths(widths);
      setSegmentOffsets(offsets);
    }
  }, [options, containerRef.current]);

  // Update active index when value changes
  useEffect(() => {
    const index = options.findIndex(option => option.id === value);
    setActiveIndex(index !== -1 ? index : 0);
  }, [value, options]);

  const handleClick = (option: SegmentOption, index: number) => {
    if (option.disabled) return;
    
    setActiveIndex(index);
    onChange(option.id);
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const paddingClasses = {
    sm: position === "inline" ? "px-2 py-1" : "p-1.5",
    md: position === "inline" ? "px-3 py-1.5" : "p-2",
    lg: position === "inline" ? "px-4 py-2" : "p-2.5",
  };

  const containerPaddingClasses = {
    sm: "p-0.5",
    md: "p-0.5",
    lg: "p-1",
  };

  return (
    <div
      className={cn(
        "relative inline-flex bg-apple-gray-100 rounded-apple-lg",
        containerPaddingClasses[size],
        fullWidth ? "w-full" : "",
        className
      )}
    >
      {/* Selection indicator */}
      {segmentWidths[activeIndex] && (
        <motion.div
          className="absolute z-0 bg-white rounded-apple shadow-apple"
          initial={false}
          animate={{
            width: segmentWidths[activeIndex],
            x: segmentOffsets[activeIndex],
            height: containerRef.current?.children[activeIndex]?.clientHeight ?? 'auto',
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Button container */}
      <div 
        ref={containerRef}
        className={cn(
          "relative z-1 inline-flex w-full",
          position === "stacked" ? "flex-col" : "",
          fullWidth ? "justify-between" : ""
        )}
      >
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            type="button"
            disabled={option.disabled}
            className={cn(
              "relative z-1 flex items-center justify-center font-medium transition-colors",
              paddingClasses[size],
              sizeClasses[size],
              "rounded-apple",
              activeIndex === index 
                ? "text-gray-900" 
                : option.disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700",
              fullWidth && position === "inline" ? "flex-1" : "",
              fullWidth && position === "stacked" ? "w-full" : ""
            )}
            onClick={() => handleClick(option, index)}
            whileTap={!option.disabled ? { scale: 0.98 } : undefined}
          >
            {option.icon && (
              <span className={cn("flex-shrink-0", option.label ? "mr-1.5" : "")}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}; 