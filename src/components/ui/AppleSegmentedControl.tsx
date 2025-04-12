import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface SegmentOption {
  id: string;
  label: React.ReactNode;
}

interface AppleSegmentedControlProps {
  options: SegmentOption[];
  defaultSelected?: string;
  onChange?: (selectedId: string) => void;
  className?: string;
  fullWidth?: boolean;
}

export function AppleSegmentedControl({
  options,
  defaultSelected,
  onChange,
  className,
  fullWidth = false,
}: AppleSegmentedControlProps) {
  const [selectedId, setSelectedId] = useState<string>(defaultSelected || options[0]?.id || '');

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onChange?.(id);
  };

  return (
    <div 
      className={cn(
        "inline-flex p-1 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple-sm relative",
        fullWidth && "w-full",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        
        return (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "relative flex-1 px-4 py-1.5 text-sm font-medium transition-all duration-200 z-10 rounded-apple-sm",
              isSelected 
                ? "text-apple-gray-900 dark:text-white" 
                : "text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white"
            )}
          >
            {option.label}
            {isSelected && (
              <div className="absolute inset-0 bg-white dark:bg-apple-gray-700 rounded-apple-sm shadow-apple-sm z-[-1]" />
            )}
          </button>
        );
      })}
    </div>
  );
} 