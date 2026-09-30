import React from "react";

interface MountainLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MountainLogo({ className = "", size = "md" }: MountainLogoProps) {
  const dimensions =
    size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";

  return (
    <div
      className={`${dimensions} rounded-xl bg-gradient-to-br from-[#0284C7] via-[#1D4ED8] to-[#0E7490] p-0.5 shadow-md ring-1 ring-white/80 flex items-center justify-center shrink-0 ${className}`}
      aria-hidden="true"
    >
      <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-sky-950/35 to-sky-900/10 backdrop-blur-xs flex items-center justify-center relative overflow-hidden">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 drop-shadow-xs"
        >
          {/* Subtle Polar Aurora / Sun Halo */}
          <circle
            cx="28"
            cy="10"
            r="3"
            fill="#BAE6FD"
            fillOpacity="0.85"
          />
          {/* Secondary Far Glacier Peak (Right) */}
          <path
            d="M25.5 13L36 30H15L25.5 13Z"
            fill="#38BDF8"
            fillOpacity="0.65"
          />
          <path
            d="M25.5 13L30.5 21.2L27.5 23L25.5 19.8L23 22.5L20.5 21.1L25.5 13Z"
            fill="#E0F2FE"
          />
          {/* Primary Ice Mountain Peak (Center-Left) */}
          <path
            d="M16.5 8L30 30H3L16.5 8Z"
            fill="url(#glacierBaseGrad)"
          />
          {/* Shaded Right Facet of Primary Peak */}
          <path
            d="M16.5 8L30 30H16.5V8Z"
            fill="#0369A1"
            fillOpacity="0.55"
          />
          {/* Snow Cap & Crisp Glacier Ridges */}
          <path
            d="M16.5 8L22.6 18L19.2 20.4L16.5 16.5L13.8 20.2L10.4 18L16.5 8Z"
            fill="#FFFFFF"
          />
          {/* Foreground Ice Shelf Wave Line */}
          <path
            d="M3 32.5H37"
            stroke="#BAE6FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="glacierBaseGrad"
              x1="16.5"
              y1="8"
              x2="16.5"
              y2="30"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#E0F2FE" />
              <stop offset="0.45" stopColor="#7DD3FC" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
