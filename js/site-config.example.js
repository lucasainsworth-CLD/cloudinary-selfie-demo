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
};
