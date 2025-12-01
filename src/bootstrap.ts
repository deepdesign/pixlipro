// Update loading percentage
function updateLoadingPercent(percent: number) {
  const loaderText = document.getElementById("initial-loader-text");
  if (loaderText) {
    loaderText.textContent = `loading ${Math.min(100, Math.max(0, Math.round(percent)))}%`;
  }
}

// Simulate loading progress
let progress = 0;
let progressInterval: ReturnType<typeof setInterval> | null = null;

function startProgress() {
  progressInterval = setInterval(() => {
    progress += Math.random() * 15 + 5; // Increment by 5-20%
    if (progress >= 90) {
      progress = 90; // Cap at 90% until app loads
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }
    updateLoadingPercent(progress);
  }, 100);
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// Global fallback: hide loader after maximum 5 seconds no matter what
const maxTimeout = window.setTimeout(() => {
  const loader = document.getElementById("initial-loader");
  if (loader) {
    const loaderText = document.getElementById("initial-loader-text");
    if (loaderText) {
      loaderText.textContent = "loading 100%";
    }
    loader.classList.add("initial-loader--hidden");
    setTimeout(() => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 400);
  }
  stopProgress();
}, 5000);

// Prevent Vite from auto-reloading when connection is lost
// This intercepts invalidate() only - location.reload() interceptor was blocking app initialization
let lastFileUpdate = Date.now();
let pageLoadedAt = Date.now();
let appInitialized = false;

// Track when app is actually initialized (after main.tsx loads)
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    appInitialized = true;
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        console.log('[HMR] App initialization window closed - reload protection active');
      }
    }
  }, 20000); // Give app 20 seconds to fully initialize
});

if (import.meta.hot) {
  // Track when files actually change
  import.meta.hot.on('vite:beforeUpdate', () => {
    lastFileUpdate = Date.now();
  });
  
  // Block invalidate() if no files changed recently
  const originalInvalidate = import.meta.hot.invalidate;
  import.meta.hot.invalidate = () => {
    const timeSinceUpdate = Date.now() - lastFileUpdate;
    const timeSinceLoad = Date.now() - pageLoadedAt;
    
    // Always allow reloads in first 20 seconds (app initialization)
    if (!appInitialized || timeSinceLoad < 20000) {
      originalInvalidate();
      return;
    }
    
    // If files changed in last 10 seconds, allow reload (legitimate file change)
    if (timeSinceUpdate < 10000) {
      originalInvalidate();
      return;
    }
    
    // Otherwise block - likely connection loss, not a file change
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        console.log('[HMR] Blocked invalidate() - no recent file changes. Page will stay stable.');
      }
    }
  };
}

// Note: Not intercepting location.reload() as it was interfering with app initialization
// The invalidate() interceptor should be sufficient for most cases

window.addEventListener("DOMContentLoaded", () => {
  updateLoadingPercent(10);
  startProgress();
  
  requestAnimationFrame(() => {
    updateLoadingPercent(30);
    
    // Import main app
    import("./main.tsx")
      .then(() => {
        stopProgress();
        updateLoadingPercent(100);
        window.clearTimeout(maxTimeout); // Clear fallback since app loaded successfully
        // Safety: hide loader after a short delay in case the app doesn't signal readiness
        window.setTimeout(() => {
          const loader = document.getElementById("initial-loader");
          if (loader) {
            const loaderText = document.getElementById("initial-loader-text");
            if (loaderText) {
              loaderText.textContent = "loading 100%";
            }
            loader.classList.add("initial-loader--hidden");
            window.setTimeout(() => {
              if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
              }
            }, 400);
          }
        }, 2500);
      })
      .catch((err) => {
        console.error("Failed to load main application module:", err);
        stopProgress();
        updateLoadingPercent(100);
        window.clearTimeout(maxTimeout); // Clear fallback
        // Force hide loader on error
        setTimeout(() => {
          const loader = document.getElementById("initial-loader");
          if (loader) {
            loader.classList.add("initial-loader--hidden");
            setTimeout(() => {
              if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
              }
            }, 400);
          }
        }, 500);
      });
  });
});

