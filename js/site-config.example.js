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
  /** If true, grid area scrolls when content overflows (default false = full-bleed wall). */
  ALLOW_GRID_SCROLL: false,
  /** 1 = on-screen frame pixels match w_/h_ in transformations.js */
  FRAME_SCALE: 1,
  /** Fallback width when transform has ar_ but no w_/h_ */
  DEFAULT_DELIVERY_WIDTH: 240,
  /** Transform cycles before a “new” badge is removed (default 10). */
  NEW_IMAGE_CYCLES: 10,
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
