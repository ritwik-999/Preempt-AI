import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Use motion values for ultra-smooth performance away from standard state ticks
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Inner dot instant follow
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  // Outer circle lag spring physics
  const springConfig = { damping: 40, stiffness: 400, mass: 0.5 };
  const cursorSpringX = useSpring(cursorX, springConfig);
  const cursorSpringY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if the device is mobile/touchscreen to avoid rendering buggy hover cursors
    const checkDevice = () => {
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
      setIsMobile(!hasFinePointer);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    if (isMobile) return;

    let lastX = -100;
    let lastY = -100;

    // Track mouse coordinates
    const moveCursor = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      cursorX.set(e.clientX - 16); // Center the 32px outer circle
      cursorY.set(e.clientY - 16);
      dotX.set(e.clientX - 4);     // Center the 8px dot
      dotY.set(e.clientY - 4);
      setIsVisible(true);
    };

    // Fast check for interactive elements under coordinates (especially useful on scroll)
    const checkHoverAtPoint = (x: number, y: number) => {
      if (x < 0 || y < 0) return;
      const el = document.elementFromPoint(x, y);
      if (el) {
        const isInteractive = !!el.closest(
          "a, button, input, select, textarea, [role='button'], .cursor-pointer"
        );
        setIsHovered(isInteractive);
      }
    };

    // Track interactive hover state changes
    const addHoverListeners = () => {
      const interactives = document.querySelectorAll(
        "a, button, input, select, textarea, [role='button'], .cursor-pointer"
      );
      interactives.forEach((el) => {
        el.addEventListener("mouseenter", () => setIsHovered(true));
        el.addEventListener("mouseleave", () => setIsHovered(false));
      });
    };

    // Trigger hover checks when scrolling (since elements shift under the static physical cursor)
    const handleScroll = () => {
      checkHoverAtPoint(lastX, lastY);
    };

    // Re-bind listeners when content shifts
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mouseleave", () => setIsVisible(false));
    document.addEventListener("mouseenter", () => setIsVisible(true));
    addHoverListeners();

    // Hide default cursor across full page
    document.documentElement.classList.add("cursor-none");

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", () => setIsVisible(false));
      document.removeEventListener("mouseenter", () => setIsVisible(true));
      observer.disconnect();
      document.documentElement.classList.remove("cursor-none");
    };
  }, [isMobile]);

  if (isMobile || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Lagging outer interactive bubble ring */}
      <motion.div
        className="w-8 h-8 rounded-full border border-emerald-400/60 bg-emerald-400/5 mix-blend-screen fixed top-0 left-0 pointer-events-none"
        style={{
          x: cursorSpringX,
          y: cursorSpringY,
          scale: isHovered ? 1.5 : 1,
          borderColor: isHovered ? "rgba(52, 211, 153, 0.9)" : "rgba(52, 211, 153, 0.6)",
          backgroundColor: isHovered ? "rgba(52, 211, 153, 0.15)" : "rgba(52, 211, 153, 0.05)",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      />

      {/* Instant, laser-precise inner dot */}
      <motion.div
        className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 fixed top-0 left-0 pointer-events-none"
        style={{
          x: dotX,
          y: dotY,
          scale: isHovered ? 0.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );
}
