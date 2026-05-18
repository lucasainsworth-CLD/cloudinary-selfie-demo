/**
 * Infer display frame pixels from a Cloudinary transformation URL segment.
 * Supports w_, h_, ar_X:Y in any order, including chained steps (comma or /).
 *
 * Rules (last integer w_/h_ in the string wins; fractional overlay sizes like w_0.50 are ignored):
 *   w + h     → use both
 *   w + ar    → h = w × (arH / arW)     e.g. ar_1:1,c_auto,w_100 → 100×100
 *   h + ar    → w = h × (arW / arH)
 *   w only    → square (h = w)
 *   h only    → square (w = h)
 *   ar only   → w = defaultWidth, h from aspect ratio
 *   none      → defaultWidth × defaultWidth (caller may refine from loaded image)
 */
(function () {
  "use strict";

  function lastMatchAll(text, regex) {
    const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
    let last = null;
    let m;
    while ((m = re.exec(text)) !== null) {
      last = m;
    }
    return last;
  }

  function parseCloudinaryTransformDimensions(transformString, options) {
    const opts = options || {};
    const defaultW = Math.max(1, Number(opts.defaultWidth) || 240);
    const t = String(transformString || "");

    // Ignore fractional overlay sizes (e.g. w_0.50) — only integer w_/h_ count.
    const wM = lastMatchAll(t, /(?:^|[,/])w_(\d+)(?!\.)/);
    const hM = lastMatchAll(t, /(?:^|[,/])h_(\d+)(?!\.)/);
    const arM = lastMatchAll(t, /(?:^|[,/])ar_(\d+):(\d+)/);

    const w = wM ? Number(wM[1]) : null;
    const h = hM ? Number(hM[1]) : null;
    const ar = arM ? { w: Number(arM[1]), h: Number(arM[2]) } : null;

    if (w && h) {
      return { w, h, source: "explicit" };
    }
    if (w && ar && ar.w > 0 && ar.h > 0) {
      return { w, h: Math.round((w * ar.h) / ar.w), source: "w+ar" };
    }
    if (h && ar && ar.w > 0 && ar.h > 0) {
      return { w: Math.round((h * ar.w) / ar.h), h, source: "h+ar" };
    }
    if (w) {
      return { w, h: w, source: "w-only" };
    }
    if (h) {
      return { w: h, h, source: "h-only" };
    }
    if (ar && ar.w > 0 && ar.h > 0) {
      return {
        w: defaultW,
        h: Math.round((defaultW * ar.h) / ar.w),
        source: "ar-only",
      };
    }
    return { w: defaultW, h: defaultW, source: "unknown" };
  }

  window.parseCloudinaryTransformDimensions = parseCloudinaryTransformDimensions;
})();
