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
 * @type {{ name: string, transform: string, deliveryWidth?: number, deliveryHeight?: number, deliveryUrlExtension?: string }[]}
 */
window.TRANSFORMATIONS = [
  {
    name: "square_auto",
    transform: "w_300,h_300,c_fill,g_auto,q_auto:good",
  },
  {
    name: "CAB_portrait",
    transform: "ar_3:4,c_auto,w_300/l_cab-overlay_kfdwnz/c_scale,w_300/fl_layer_apply,fl_no_overflow,g_south_east",
  },
  {
    name: "wide_face",
    transform: "w_300,h_120,c_fill,g_face,q_auto:good",
  },
  {
    name: "on_the_beach",
    transform: "ar_9:16,c_auto,w_300/e_gen_background_replace:prompt_on the beach in Florida",
  },
  {
    name: "banner_face",
    transform: "w_300,h_180,c_fill,g_face,q_auto:good",
  },
  {
    name: "zoompan",
    transform: "e_zoompan:from_(zoom_1);to_(zoom_1.25);du_9;fps_25,c_fill,w_300,h_400",
    /** Animated zoompan must be delivered as GIF — swap .jpg/.png/… in URL for this step. */
    deliveryUrlExtension: "gif",
  },
  {
    name: "flower_BG_replace",
    transform: "ar_16:9,c_auto,w_300/e_gen_background_replace:prompt_flowers growing all around",
  },
  {
    name: "CAB_background",
    transform: "ar_1:1,c_auto,w_300/e_background_removal/u_CAB-portraits-bg_pb3kqn/c_scale,w_300/fl_layer_apply,fl_no_overflow,g_center",
  },
];
