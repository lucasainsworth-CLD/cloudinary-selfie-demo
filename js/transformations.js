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
    name: "profile_picture",
    transform: "w_300,h_300,c_thumb,g_face/e_background_removal/r_max",
  },
  {
    name: "CAB_portrait",
    transform: "ar_3:4,c_auto,w_300/l_cab-overlay_kfdwnz/c_scale,w_300/fl_layer_apply,fl_no_overflow,g_south_east/r_20",
  },
  {
    name: "greyscale_logo",
    transform: "c_auto,g_face,w_300,h_180/e_grayscale/e_brightness:22/bo_6px_solid_rgb:3448C5/l_cloudinary_logo_blue_0720_2x_lba2ox/c_scale,fl_relative,w_0.50/fl_layer_apply,fl_no_overflow,g_north_west,x_15,y_10/",
  },
  {
    name: "on_the_beach",
    transform: "ar_9:16,c_auto,w_300/e_gen_background_replace:prompt_on the beach in Florida",
  },
  {
    name: "clean_white_background",
    transform: "c_auto,g_auto,h_300,w_300/e_background_removal/b_rgb:FFFFFF",
  },
  {
    name: "zoompan",
    transform: "e_zoompan:from_(zoom_1);to_(zoom_2);du_12;fps_25,c_fill,w_300,h_400",
    /** Animated zoompan must be delivered as GIF — swap .jpg/.png/… in URL for this step. */
    deliveryUrlExtension: "gif",
  },
  {
    name: "flower_BG_replace",
    transform: "ar_16:12,c_auto,w_300/e_gen_background_replace:prompt_flowers growing all around",
  },
  {
    name: "CAB_background",
    transform: "ar_1:1,c_auto,w_300/e_background_removal/u_CAB-portraits-bg_pb3kqn/c_scale,w_300/fl_layer_apply,fl_no_overflow,g_center",
  },
];
