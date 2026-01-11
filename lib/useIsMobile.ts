"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a mobile device
 * Uses both screen width and user agent for accurate detection
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
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
    
    // Re-check on resize (for dev tools testing)
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  return isMobile;
}

/**
 * SSR-safe version that defaults to desktop
 */
export function useIsMobileSSR(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < 768;
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ["android", "iphone", "ipad", "mobile"];
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isSmallScreen || (isMobileUA && hasTouch));
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  return isMobile;
}
