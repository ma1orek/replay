"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a mobile device
 * Returns null during SSR/hydration, then true/false after mount
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      // Check screen width
      const isSmallScreen = window.innerWidth < 768;
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        "android",
        "webos", 
        "iphone",
        "ipad",
        "ipod",
        "blackberry",
        "windows phone",
        "mobile"
      ];
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      // Check touch support
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      
      // Consider mobile if small screen OR (mobile UA AND touch)
      setIsMobile(isSmallScreen || (isMobileUA && hasTouch));
    };
    
    checkMobile();
    
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  return isMobile;
}
