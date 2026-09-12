/**
 * Image Protection Module
 * Prevents users from right-clicking to save images or dragging them
 * using event delegation for both current and future images.
 */

export const protectImages = () => {
  console.log('[ImageProtection] Initializing image protection...');

  // Prevent right-click (context menu) on images and any element that looks like an image
  document.addEventListener('contextmenu', (e) => {
    const target = e.target;
    if (
      target instanceof HTMLImageElement ||
      target.closest('.stack-logo-img') ||
      target.closest('.privacy-hero-img') ||
      target.closest('.navbar-logo-img') ||
      target.tagName === 'IMG'
    ) {
      e.preventDefault();
      return false;
    }
  }, true);

  // Prevent dragging images
  document.addEventListener('dragstart', (e) => {
    if (
      e.target instanceof HTMLImageElement ||
      e.target.closest('img')
    ) {
      e.preventDefault();
      return false;
    }
  }, true);

  // Block mousedown right-click for extra security
  document.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right click
      if (e.target instanceof HTMLImageElement || e.target.closest('img')) {
        e.preventDefault();
      }
    }
  }, true);

  // CSS safeguards
  const style = document.createElement('style');
  style.innerHTML = `
    img,
    .stack-logo-img,
    .privacy-hero-img,
    .navbar-logo-img {
      -webkit-user-drag: none !important;
      -khtml-user-drag: none !important;
      -moz-user-drag: none !important;
      -o-user-drag: none !important;
      user-drag: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      pointer-events: auto !important;
    }

    /* Create a transparent overlay to block direct interaction with images */
    .protect-img-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      cursor: default;
    }
  `;
  document.head.appendChild(style);
};

// Initialize immediately if imported as a side-effect
if (typeof window !== 'undefined') {
  protectImages();
}
