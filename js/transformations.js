/**
 * Customize display transforms here — only `name` and `transform` are required.
 *
 * Frame size on the wall is computed automatically from each transform string:
 *   w_ + h_  → both dimensions
 *   w_ + ar_ → height from aspect ratio (e.g. ar_1:1,c_auto,w_100 → 100×100)
 *   h_ + ar_ → width from aspect ratio
 *   ar_ only → uses DEFAULT_DELIVERY_WIDTH from site-config.js for width
 *   t_… only (no w/h/ar) → optional deliveryWidth/Height below, or size from loaded image
 *
 * @type {{ name: string, transform: string, deliveryWidth?: number, deliveryHeight?: number }[]}
 */
window.TRANSFORMATIONS = [
  {
    name: "square_auto",
    transform: "w_300,h_300,c_fill,g_auto,q_auto:good",
  },
  {
    name: "wide_face",
    transform: "w_300,h_120,c_fill,g_face,q_auto:good",
  },
  {
    name: "tall_auto",
    transform: "w_300,h_400,c_fill,g_auto,q_auto:good",
  },
  {
    name: "banner_face",
    transform: "w_300,h_180,c_fill,g_face,q_auto:good",
  },
  {
    name: "flower_BG_replace",
    transform: "ar_16:9,c_auto,w_300/e_gen_background_replace:prompt_flowers growing all around",
  },
];
