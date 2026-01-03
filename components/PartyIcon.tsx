"use client";

import React from "react";
import { motion } from "framer-motion";
import type { ArchetypePoints } from "@/lib/types";

interface PartyIconProps {
  dnaProfile: ArchetypePoints;
  level: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PartyIcon({ dnaProfile, level, size = "md", className = "" }: PartyIconProps) {
  // Map archetypes to colors
  const colors: Record<string, string> = {
    active: "#3b82f6",      // Blue
    fact_checker: "#10b981", // Emerald
    mediator: "#f59e0b",    // Amber
    reformer: "#f43f5e",    // Rose
    local_hero: "#6366f1",  // Indigo
  };

  // Find dominant archetype
  const entries = Object.entries(dnaProfile) as [string, number][];
  const dominant = entries.reduce((a, b) => (a[1] > b[1] ? a : b), ["active", 0])[0];
  const mainColor = colors[dominant] || "#64748b";

  // Determine size
  const dimensions = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  }[size];

  // SVG parameters based on level
  const complexity = Math.min(level, 10);
  const patterns = [];
  
  for (let i = 0; i < complexity; i++) {
    patterns.push(
      <motion.rect
        key={i}
        x={20 + i * 5}
        y={20 + i * 5}
        width={60 - i * 10}
        height={60 - i * 10}
        rx={i % 2 === 0 ? 4 : 20}
        fill="none"
        stroke={mainColor}
        strokeWidth={1}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: 0.1 + (i * 0.05), rotate: i * 15 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
    );
  }

  return (
    <div className={`${dimensions} ${className} relative flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id={`grad-${dominant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={mainColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={mainColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Base Shape */}
        <path
          d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
          fill={`url(#grad-${dominant})`}
          stroke={mainColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Complexity Patterns */}
        {patterns}

        {/* Center Symbol */}
        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill={mainColor}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror" }}
        />
      </svg>
    </div>
  );
}

