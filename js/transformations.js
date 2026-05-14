/**
 * Each step: Cloudinary transformation segment + frame size inside the grid cell
 * (CSS length). Keep frames within ~220px logical cells at MAX_VISIBLE=40 (8×5).
 *
 * Swap `transform` for named transforms, e.g. "t_my_named_transform".
 * @type {{ transform: string, frameWidth: string, frameHeight: string }[]}
 */
window.TRANSFORMATIONS = [
  {
    transform: "w_440,h_440,c_fill,g_auto,q_auto:good",
    frameWidth: "88%",
    frameHeight: "88%",
  },
  {
    transform: "w_480,h_320,c_fill,g_face,q_auto:good",
    frameWidth: "96%",
    frameHeight: "62%",
  },
  {
    transform: "w_400,h_480,c_fill,g_auto,q_auto:good",
    frameWidth: "78%",
    frameHeight: "92%",
  },
  {
    transform: "w_520,h_280,c_fill,g_face,q_auto:good",
    frameWidth: "98%",
    frameHeight: "52%",
  },
];
