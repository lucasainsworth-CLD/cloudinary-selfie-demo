/**
 * Copy to site-config.js and fill in values, or edit site-config.js directly.
 * No API secrets are stored here (tag list + unsigned upload preset only).
 */
window.SITE_CONFIG = {
  CLOUD_NAME: "your_cloud_name",
  /** Must match the tag your upload preset applies (used in list URL). */
  LIST_TAG: "your_event_tag",
  /** Unsigned upload preset name (mobile page). */
  UPLOAD_PRESET: "your_unsigned_preset",
  /** Full HTTPS URL to mobile.html (QR target). If empty, uses same origin + /mobile.html */
  MOBILE_PAGE_URL: "",
  /** How often to refetch tag list JSON (Cloudinary caches list ~60s). */
  POLL_MS: 15000,
  MAX_VISIBLE: 40,
  /** Ms per transform step (default 16000). */
  TRANSFORM_CYCLE_MS: 16000,
  /** If true, grid area scrolls when content overflows (default false = full-bleed wall). */
  ALLOW_GRID_SCROLL: false,
  /** Auto-scroll grid during each transform (default true). */
  AUTO_SCROLL_GRID: true,
  /** Optional scroll duration override; 0 = auto (cycle − popup after each apply). */
  AUTO_SCROLL_MS: 0,
  /** Max scroll speed in px/s; longer grids get a longer duration (0 = no cap). */
  AUTO_SCROLL_MAX_SPEED_PX_S: 280,
  /** 1 = on-screen frame pixels match w_/h_ in transformations.js */
  FRAME_SCALE: 1,
  /** Fallback width when transform has ar_ but no w_/h_ */
  DEFAULT_DELIVERY_WIDTH: 240,
  /** Full TRANSFORMATIONS loops before “new” badge ends (≈ cycle ms × step count × value). */
  NEW_IMAGE_CYCLES: 6,
  /** Sliding window step for rotating non-new images on the wall (default 10). */
  WALL_ROTATION_STEP: 10,
  /** “New images!” popup duration in ms (default 3500). */
  NEW_IMAGES_POPUP_MS: 3500,
  /** Header logo URL; empty = use built-in Cloudinary fallbacks in display.js */
  HEADER_LOGO_URL: "",
  /** Mobile: width/height multiplier before upload (0.5 recommended). 1 = original size. */
  CLIENT_UPLOAD_SCALE: 0.5,
  /** Mobile: max longer edge after scaling (px). 0 = no cap. */
  CLIENT_UPLOAD_MAX_EDGE: 1920,
  /** Mobile: JPEG quality for resized upload (0.5–0.95). */
  CLIENT_UPLOAD_JPEG_QUALITY: 0.82,
};
