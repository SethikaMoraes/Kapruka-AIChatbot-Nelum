/**
 * Nelum AI UI Component Controller
 */
import { APP_CONFIG } from '../../config/app.config.js';

export const uiController = {
  /**
   * Displays a toast notification in the application.
   * @param {string} message 
   */
  showToast(message) {
    let toast = document.querySelector(".nelum-toast");
    if (toast) toast.remove();

    toast = document.createElement("div");
    toast.className = "nelum-toast";
    toast.textContent = message;
    
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "80px",
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      backgroundColor: "rgba(31, 41, 55, 0.9)",
      color: "#FFFFFF",
      padding: "10px 20px",
      borderRadius: "30px",
      fontSize: "12px",
      fontWeight: "700",
      zIndex: "1000",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      pointerEvents: "none",
      opacity: "0",
      transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    });

    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 50);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  /**
   * Controls the typing indicator rendering.
   * @param {boolean} show 
   */
  showTypingIndicator(show) {
    const typingIndicator = document.getElementById("typing-indicator");
    const chatMessages = document.getElementById("chat-messages");
    if (!typingIndicator || !chatMessages) return;

    typingIndicator.style.display = show ? "flex" : "none";
    if (show) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  /**
   * Initializes the animated full-screen loading overlay.
   * @param {Promise} appInitPromise 
   */
  runLoadingScreen(appInitPromise) {
    const loader = document.getElementById("loading-screen");
    const video = document.getElementById("loading-video");
    const fill = document.getElementById("loading-progress-fill");
    
    if (!loader) return;

    let progress = 0;
    let isAppReady = false;
    let minimumTimeElapsed = false;
    const startTime = Date.now();
    const minDuration = APP_CONFIG.LOADING_SCREEN_MIN_DURATION;

    // Video play/error detection
    if (video) {
      video.addEventListener("playing", () => {
        video.classList.add("video-playing");
      });
      
      video.addEventListener("error", () => {
        console.warn("Loading video failed to load, falling back to brand gradient.");
        video.style.display = "none";
      });

      // Try playing manually in case autoplay needs a push
      video.play().catch(err => {
        console.warn("Video autoplay blocked or failed:", err);
      });

      // Autoplay fallback timer: if not playing in 1.5s, hide video and use gradient
      setTimeout(() => {
        if (video.readyState < 3) {
          console.warn("Video load timeout, falling back to brand gradient.");
          video.style.display = "none";
        }
      }, 1500);
    }

    // Set up progress bar interval
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (!isAppReady || !minimumTimeElapsed) {
        const targetProgress = Math.min(90, (elapsed / minDuration) * 90);
        progress = Math.max(progress, targetProgress);
      } else {
        progress += (100 - progress) * 0.2;
        if (progress >= 99.5) {
          progress = 100;
          clearInterval(progressInterval);
          finishLoading();
        }
      }
      
      if (fill) {
        fill.style.width = `${progress}%`;
        fill.setAttribute("aria-valuenow", Math.round(progress));
      }
    }, 50);

    // Timeout for minimum 4 seconds
    setTimeout(() => {
      minimumTimeElapsed = true;
      checkCompletion();
    }, minDuration);

    appInitPromise.then(() => {
      isAppReady = true;
      checkCompletion();
    }).catch(err => {
      console.error("App init failed but continuing loading flow:", err);
      isAppReady = true;
      checkCompletion();
    });

    function checkCompletion() {
      // Transition triggers when minimum time and initialization resolves
    }

    function finishLoading() {
      loader.classList.add("fade-out");
      loader.addEventListener("transitionend", (e) => {
        if (e.propertyName === "opacity") {
          loader.remove();
        }
      });
      
      setTimeout(() => {
        if (loader.parentNode) {
          loader.remove();
        }
      }, 1000);
    }
  }
};

// Global mapping for voice controller compatibility
if (typeof window !== 'undefined') {
  window.showToast = uiController.showToast;
  window.showToastNotification = uiController.showToast;
}

export default uiController;
