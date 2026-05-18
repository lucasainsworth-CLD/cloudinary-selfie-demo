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
  /** Ms between transform steps (popup + apply); also drives auto-scroll duration. */
  TRANSFORM_CYCLE_MS: 16000,
  ALLOW_GRID_SCROLL: false,
  /** Smooth scroll the grid top→bottom each transform (default on). */
  AUTO_SCROLL_GRID: true,
  /** Optional scroll duration override; omit or 0 = sync to cycle (12s after apply, 16s on first load). */
  AUTO_SCROLL_MS: 0,
  /** Max grid scroll speed (px/s); duration stretches on tall grids (0 = no cap). */
  AUTO_SCROLL_MAX_SPEED_PX_S: 280,
  /** 1 = frame pixels match w_/h_ in transform; 0.5 = half size, etc. */
  FRAME_SCALE: 1,
  /** Used when a transform has ar_ but no w_ or h_ (e.g. ar_16:9 only). */
  DEFAULT_DELIVERY_WIDTH: 240,
  /**
   * How many full passes through TRANSFORMATIONS a new upload stays “new” (default 6).
   * Duration ≈ TRANSFORM_CYCLE_MS × transform count × this value.
   */
  NEW_IMAGE_CYCLES: 6,
  /** Non-new wall slots: sliding window advances this many indices per transform cycle. */
  WALL_ROTATION_STEP: 10,
  /** Duration of the “New images!” popup (ms). */
  NEW_IMAGES_POPUP_MS: 3500,
  /**
   * Header Cloudinary logo (1:1). If empty, display.js uses built-in fallbacks.
   * Set to any working https://res.cloudinary.com/… URL.
   */
  HEADER_LOGO_URL:
    "https://res.cloudinary.com/dz6ajwh6k/image/upload/v1762988734/stacked_logo_box_tdfrid.png",
  /**
   * Mobile upload: scale dimensions before upload (0.5 ≈ ¼ the pixels, much faster).
   * Use 1 to send the camera’s original file (slowest).
   */
  CLIENT_UPLOAD_SCALE: 0.5,
  /** After scaling, cap the longer edge (px). Use 0 for no cap (only scale applies). */
  CLIENT_UPLOAD_MAX_EDGE: 1920,
  /** JPEG quality for the resized upload (0.5–0.95). */
  CLIENT_UPLOAD_JPEG_QUALITY: 0.82,
};
