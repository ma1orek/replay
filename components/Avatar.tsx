"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: number;
  className?: string;
}

export default function Avatar({ src, fallback = "U", size = 32, className }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Always show fallback if no src or if there was an error
  const showImage = src && !hasError;

  return (
    <div 
      className={cn(
        "rounded-full bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center text-white font-medium overflow-hidden",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {showImage ? (
        <>
          {isLoading && (
            <span className="absolute">{fallback}</span>
          )}
          <Image 
            src={src} 
            alt="Avatar" 
            width={size} 
            height={size} 
            className={cn(
              "w-full h-full object-cover transition-opacity",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        </>
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}


