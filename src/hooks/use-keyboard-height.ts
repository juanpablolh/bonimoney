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
  // Store the maximum observed viewport height (without keyboard)
  const maxHeightRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  // Track previous keyboard state to detect close events
  const wasKeyboardOpenRef = useRef(false);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleResize = () => {
      const currentVVHeight = visualViewport.height;

      // Always track the maximum height we've seen (full viewport without keyboard)
      if (currentVVHeight > maxHeightRef.current) {
        maxHeightRef.current = currentVVHeight;
      }

      // Calculate potential keyboard height based on max observed height
      const potentialKeyboardHeight = maxHeightRef.current - currentVVHeight;

      // Threshold of 150px to distinguish keyboard from address bar changes
      const keyboardIsOpen = potentialKeyboardHeight > 150;

      // When keyboard closes, update max height to current (handles Safari address bar changes)
      if (wasKeyboardOpenRef.current && !keyboardIsOpen) {
        // Small delay to let viewport settle after keyboard animation
        setTimeout(() => {
          if (window.visualViewport) {
            maxHeightRef.current = Math.max(maxHeightRef.current, window.visualViewport.height);
          }
        }, 100);
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
