import { useState, useEffect } from 'react';

/**
 * Hook to detect keyboard height using the Visual Viewport API.
 * Returns the current keyboard height in pixels (0 when keyboard is hidden).
 *
 * This is essential for mobile drawers/modals that need to keep
 * footer buttons visible above the keyboard.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleResize = () => {
      // The difference between the window height and visual viewport height
      // equals the keyboard height (plus any browser UI changes)
      const height = window.innerHeight - visualViewport.height;
      // Only set if positive (keyboard is up) and significant (> 100px to avoid false positives from address bar)
      setKeyboardHeight(height > 100 ? height : 0);
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

  return keyboardHeight;
}
