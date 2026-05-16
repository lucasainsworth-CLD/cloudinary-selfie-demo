/**
 * Site configuration (public values only — no API secret).
 * Set MOBILE_PAGE_URL to your full https://…/mobile.html once GitHub Pages is live
 * so the display QR points to the correct URL.
 */
window.SITE_CONFIG = {
  CLOUD_NAME: "dz6ajwh6k",
  LIST_TAG: "selfies-demo",
  UPLOAD_PRESET: "selfies-demo",
  /** Full HTTPS URL to mobile.html (used for QR on the display). */
  MOBILE_PAGE_URL: "https://lucasainsworth-cld.github.io/cloudinary-selfie-demo/mobile.html",
  POLL_MS: 15000,
  MAX_VISIBLE: 40,
  ALLOW_GRID_SCROLL: false,
  /** 1 = frame pixels match w_/h_ in transform; 0.5 = half size, etc. */
  FRAME_SCALE: 1,
  /** Used when a transform has ar_ but no w_ or h_ (e.g. ar_16:9 only). */
  DEFAULT_DELIVERY_WIDTH: 240,
  /** How many transform cycles a new upload keeps its badge (default 10). */
  NEW_IMAGE_CYCLES: 10,
  /** Duration of the “New images!” popup (ms). */
  NEW_IMAGES_POPUP_MS: 3500,
  /**
   * Header Cloudinary logo (1:1). If empty, display.js uses built-in fallbacks.
   * Set to any working https://res.cloudinary.com/… URL.
   */
  HEADER_LOGO_URL:
    "https://res.cloudinary.com/dz6ajwh6k/image/upload/v1762988734/stacked_logo_box_tdfrid.png",
};
