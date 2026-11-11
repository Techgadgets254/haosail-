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
  variant,
  showTagline = true 
}: HaosailLogoProps) {
  // If variant is explicitly light/white, force the white-lettering version (for dark footers/headers)
  // If variant is explicitly dark, force the black-lettering version
  // If variant is not passed, automatically switch based on Tailwind dark mode!
  const isExplicitWhite = variant === "light" || variant === "white";
  const isExplicitDark = variant === "dark";

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <div className="flex flex-col justify-center">
        <div className="relative flex items-center">
          {isExplicitWhite ? (
            <img 
              src="/haosail_logo_dark.png" 
              alt="HaoSail General Machinery" 
              className="h-7 sm:h-8 w-auto object-contain shrink-0" 
            />
          ) : isExplicitDark ? (
            <img 
              src="/haosail_logo_light.png" 
              alt="HaoSail General Machinery" 
              className="h-7 sm:h-8 w-auto object-contain shrink-0" 
            />
          ) : (
            <>
              {/* Light Mode Logo (Dark text on light background) */}
              <img 
                src="/haosail_logo_light.png" 
                alt="HaoSail General Machinery" 
                className="h-7 sm:h-8 w-auto object-contain shrink-0 block dark:hidden" 
              />
              {/* Dark Mode Logo (White text on dark background) */}
              <img 
                src="/haosail_logo_dark.png" 
                alt="HaoSail General Machinery" 
                className="h-7 sm:h-8 w-auto object-contain shrink-0 hidden dark:block" 
              />
            </>
          )}
        </div>

        {showTagline && (
          <div className="flex items-center gap-1 mt-0.5">
            <span 
              className={`text-[8px] sm:text-[9px] font-bold tracking-[0.18em] uppercase leading-none font-mono ${
                isExplicitWhite 
                  ? "text-blue-200" 
                  : isExplicitDark 
                  ? "text-[#0055B8]" 
                  : "text-[#0055B8] dark:text-blue-400"
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
