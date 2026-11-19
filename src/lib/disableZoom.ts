/**
 * Global runtime screen-zoom guard for Desktop, Android, iOS Safari, and installed PWAs.
 * Blocks pinch-to-zoom, multi-touch zoom, Ctrl/Cmd+wheel, Ctrl/Cmd+/- /0 keyboard zoom,
 * and residual double-tap magnification without interfering with normal scrolling,
 * button taps, or chart panning.
 */
export function initDisableZoom(): () => void {
  const preventGesture = (e: Event) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  let lastTouchEnd = 0;
  const handleTouchEnd = (e: TouchEvent) => {
    const now = Date.now();
    const target = e.target as HTMLElement | null;
    const isInteractive = Boolean(
      target?.closest('button, a, input, select, textarea, label, [role="button"]')
    );

    if (now - lastTouchEnd <= 320 && e.touches.length === 0 && !isInteractive) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '_', '0'].includes(e.key)) {
      e.preventDefault();
    }
  };

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('keydown', handleKeyDown, { passive: false });

  return () => {
    document.removeEventListener('gesturestart', preventGesture);
    document.removeEventListener('gesturechange', preventGesture);
    document.removeEventListener('gestureend', preventGesture);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('keydown', handleKeyDown);
  };
}
