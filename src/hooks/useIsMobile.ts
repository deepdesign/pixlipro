import { useState, useEffect } from "react";
import { isMobileDevice, isTabletDevice, isPhoneDevice } from "@/lib/utils";

/**
 * React hook to detect if the current device is mobile.
 * 
 * Updates reactively when the window is resized (for orientation changes).
 * 
 * @returns True if the device is mobile, false otherwise
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return isMobileDevice();
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Check on mount and on resize (for orientation changes)
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  return isMobile;
}

/**
 * React hook to detect if the current device is a tablet.
 * 
 * @returns True if the device is a tablet, false otherwise
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return isTabletDevice();
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const checkTablet = () => {
      setIsTablet(isTabletDevice());
    };

    checkTablet();
    window.addEventListener("resize", checkTablet);
    window.addEventListener("orientationchange", checkTablet);

    return () => {
      window.removeEventListener("resize", checkTablet);
      window.removeEventListener("orientationchange", checkTablet);
    };
  }, []);

  return isTablet;
}

/**
 * React hook to detect if the current device is a phone.
 * 
 * @returns True if the device is a phone, false otherwise
 */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return isPhoneDevice();
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const checkPhone = () => {
      setIsPhone(isPhoneDevice());
    };

    checkPhone();
    window.addEventListener("resize", checkPhone);
    window.addEventListener("orientationchange", checkPhone);

    return () => {
      window.removeEventListener("resize", checkPhone);
      window.removeEventListener("orientationchange", checkPhone);
    };
  }, []);

  return isPhone;
}

