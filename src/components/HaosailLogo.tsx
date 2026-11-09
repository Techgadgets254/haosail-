/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface HaosailLogoProps {
  className?: string;
  variant?: "dark" | "light" | "white";
  showTagline?: boolean;
}

export default function HaosailLogo({ 
  className = "h-8 sm:h-9", 
  variant = "dark",
  showTagline = true 
}: HaosailLogoProps) {
  const isLight = variant === "light" || variant === "white";

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Haosail Vector Mark */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center tracking-tight">
          {/* "Hao" text */}
          <span 
            className={`font-extrabold text-lg sm:text-2xl tracking-[-0.03em] leading-none ${
              isLight ? "text-white" : "text-slate-900 dark:text-white"
            }`}
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            Hao
          </span>

          {/* Hexagonal Blue Geometric S Mark */}
          <div className="mx-1 sm:mx-1.5 relative w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 115" className="w-full h-full drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Blue Hexagon */}
              <path 
                d="M50 0L95 26V89L50 115L5 89V26L50 0Z" 
                fill="#0055B8" 
              />
              {/* Inner White Precision S Shape */}
              <path 
                d="M50 18L80 35V48L60 37L30 52H78V86L50 102L20 85V72L40 83L70 68H22V34L50 18Z" 
                fill="#FFFFFF" 
              />
              <path 
                d="M50 26L72 38L42 54L30 48L50 26Z" 
                fill="#0055B8" 
              />
              <path 
                d="M50 94L28 82L58 66L70 72L50 94Z" 
                fill="#0055B8" 
              />
            </svg>
          </div>

          {/* "aiL" text */}
          <span 
            className={`font-extrabold text-lg sm:text-2xl tracking-[-0.03em] leading-none ${
              isLight ? "text-white" : "text-slate-900 dark:text-white"
            }`}
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            aiL
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span 
              className={`text-[8.5px] sm:text-[9.5px] font-bold tracking-[0.18em] uppercase leading-none font-mono ${
                isLight ? "text-blue-200" : "text-[#0055B8] dark:text-blue-400"
              }`}
            >
              MACHINERY KENYA
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
