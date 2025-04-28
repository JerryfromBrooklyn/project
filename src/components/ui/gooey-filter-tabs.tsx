"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface GooeyFilterTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const GooeyFilterTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}: GooeyFilterTabsProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center relative overflow-hidden",
        className
      )}
      style={{
        filter:
          "url(#goo) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))",
      }}
    >
      <div className="relative flex items-center justify-center bg-white rounded-full p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors duration-200 z-10",
              activeTab === tab.id ? "text-white" : "text-neutral-950 hover:text-neutral-800"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="pill"
                className="absolute inset-0 bg-black rounded-full"
                transition={{
                  type: "spring",
                  bounce: 0.25,
                  stiffness: 130,
                  damping: 12,
                  duration: 0.3,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Gooey SVG filter */}
      <svg
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          width: 0,
          height: 0,
        }}
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="4"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}; 