/**
 * Device and browser detection utilities
 * 
 * Provides functions to detect mobile browsers and devices
 * using multiple detection methods for reliability.
 */

/**
 * Detects if the current device is a mobile device based on user agent.
 * 
 * Checks for common mobile device patterns in the user agent string.
 * This includes phones and tablets from major manufacturers.
 * 
 * @returns True if the device appears to be mobile, false otherwise
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Common mobile device patterns
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /mobile/i,
  ];

  return mobilePatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Detects if the current device is a tablet.
 * 
 * Uses user agent patterns to identify tablets specifically.
 * Note: iPad on iOS 13+ reports as desktop, so we also check screen size.
 * 
 * @returns True if the device appears to be a tablet, false otherwise
 */
export function isTabletDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Tablet-specific patterns
  const tabletPatterns = [
    /ipad/i,
    /android(?!.*mobile)/i, // Android but not mobile (tablet)
    /tablet/i,
  ];

  const isTabletUA = tabletPatterns.some((pattern) => pattern.test(userAgent));
  
  // Additional check: iPad on iOS 13+ reports as Mac, so check screen size
  // Tablets typically have larger screens (>= 768px width)
  const isLargeScreen = window.innerWidth >= 768;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  
  // If it's a touch device with large screen and not a phone pattern, likely tablet
  if (isLargeScreen && isTouchDevice && !/iphone|mobile/i.test(userAgent)) {
    return true;
  }

  return isTabletUA;
}

/**
 * Detects if the current device is a phone (mobile but not tablet).
 * 
 * @returns True if the device appears to be a phone, false otherwise
 */
export function isPhoneDevice(): boolean {
  return isMobileDevice() && !isTabletDevice();
}

/**
 * Detects if the browser is running on iOS (iPhone or iPad).
 * 
 * @returns True if the device is iOS, false otherwise
 */
export function isIOSDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/i.test(userAgent);
}

/**
 * Detects if the browser is running on Android.
 * 
 * @returns True if the device is Android, false otherwise
 */
export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/i.test(userAgent);
}

/**
 * Detects if the device has touch capabilities.
 * 
 * Uses multiple methods to detect touch support for reliability.
 * 
 * @returns True if the device supports touch, false otherwise
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Check for touch support (including legacy IE)
  const hasTouchStart = "ontouchstart" in window;
  const hasMaxTouchPoints = navigator.maxTouchPoints > 0;
  const hasLegacyTouchPoints = 
    typeof (navigator as any).msMaxTouchPoints === "number" &&
    (navigator as any).msMaxTouchPoints > 0;
  
  return hasTouchStart || hasMaxTouchPoints || hasLegacyTouchPoints;
}

/**
 * Detects if the device has a coarse pointer (touch) vs fine pointer (mouse).
 * 
 * Uses CSS media query to detect pointer type.
 * 
 * @returns True if the device has a coarse pointer (touch), false otherwise
 */
export function hasCoarsePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia("(pointer: coarse)").matches;
}


