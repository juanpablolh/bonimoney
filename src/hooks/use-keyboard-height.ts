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
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  // Store the initial window height to detect keyboard vs address bar changes
  const initialHeightRef = useRef<number | null>(null);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    // Capture initial height on mount (before keyboard opens)
    if (initialHeightRef.current === null) {
      initialHeightRef.current = window.innerHeight;
    }

    const handleResize = () => {
      const initialHeight = initialHeightRef.current || window.innerHeight;
      // The difference between the initial height and visual viewport height
      // equals the keyboard height
      const height = initialHeight - visualViewport.height;

      setVvHeight(visualViewport.height);
      // Only set if positive (keyboard is up) and significant (> 150px to avoid false positives from address bar)
      setKeyboardHeight(height > 150 ? height : 0);
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

  return { keyboardHeight, vvHeight: vvHeight || (typeof window !== 'undefined' ? window.innerHeight : 0) };
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
