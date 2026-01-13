import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect keyboard height using the Visual Viewport API.
 * Returns the current keyboard height in pixels (0 when keyboard is hidden).
 *
 * This is essential for mobile drawers/modals that need to keep
 * footer buttons visible above the keyboard.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [vvHeight, setVvHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  // Store the baseline viewport height (when no keyboard is open)
  const baselineHeightRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  // Track previous keyboard state to detect close events
  const wasKeyboardOpenRef = useRef(false);
  // Debounce timer for baseline updates
  const baselineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleResize = () => {
      const currentVVHeight = visualViewport.height;
      const baseline = baselineHeightRef.current;

      // Calculate potential keyboard height
      const potentialKeyboardHeight = baseline - currentVVHeight;

      // Threshold of 150px to distinguish keyboard from address bar changes
      // Keyboard is open if viewport shrunk significantly
      const keyboardIsOpen = potentialKeyboardHeight > 150;

      // When keyboard closes, recapture baseline after animation settles
      if (wasKeyboardOpenRef.current && !keyboardIsOpen) {
        // Clear any pending timer
        if (baselineTimerRef.current) {
          clearTimeout(baselineTimerRef.current);
        }
        // Wait for keyboard animation to complete, then capture new baseline
        baselineTimerRef.current = setTimeout(() => {
          if (window.visualViewport) {
            baselineHeightRef.current = window.visualViewport.height;
          }
        }, 300);
      }

      // If viewport is larger than baseline (Safari address bar hidden), update baseline
      if (currentVVHeight > baseline && !keyboardIsOpen) {
        baselineHeightRef.current = currentVVHeight;
      }

      wasKeyboardOpenRef.current = keyboardIsOpen;

      setVvHeight(currentVVHeight);
      setKeyboardHeight(keyboardIsOpen ? potentialKeyboardHeight : 0);
      setIsKeyboardOpen(keyboardIsOpen);
    };

    // Initial check
    handleResize();

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleResize);

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleResize);
      if (baselineTimerRef.current) {
        clearTimeout(baselineTimerRef.current);
      }
    };
  }, []);

  return { keyboardHeight, vvHeight, isKeyboardOpen };
}

/**
 * Hook to get a stable initial viewport height.
 * Captures the height when the component mounts and keeps it fixed.
 * This prevents drawers from resizing when keyboard opens/closes.
 */
export function useStableViewportHeight() {
  const [stableHeight, setStableHeight] = useState<number | null>(null);

  useEffect(() => {
    // Only capture once on mount
    if (stableHeight === null) {
      setStableHeight(window.innerHeight);
    }
  }, [stableHeight]);

  return stableHeight;
}
