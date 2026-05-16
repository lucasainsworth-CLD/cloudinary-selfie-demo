(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};

  const btn = document.getElementById("open-upload");
  const input = document.getElementById("photo-input");
  const toast = document.getElementById("toast");
  const errEl = document.getElementById("err");
  const previewPanel = document.getElementById("preview-panel");
  const previewImg = document.getElementById("preview-img");
  const previewFilename = document.getElementById("preview-filename");
  const previewUpload = document.getElementById("preview-upload");
  const previewCancel = document.getElementById("preview-cancel");

  let pendingFile = null;
  let previewObjectUrl = null;

  function showErr(msg) {
    if (!errEl) return;
    errEl.hidden = false;
    errEl.textContent = msg;
  }

  function hideErr() {
    if (errEl) errEl.hidden = true;
  }

  function showToast() {
    if (toast) toast.hidden = false;
  }

  function validate() {
    if (!cfg.CLOUD_NAME || !String(cfg.CLOUD_NAME).trim()) {
      showErr("Set CLOUD_NAME in js/site-config.js");
      return false;
    }
    if (!cfg.UPLOAD_PRESET || !String(cfg.UPLOAD_PRESET).trim()) {
      showErr("Set UPLOAD_PRESET in js/site-config.js to your unsigned preset.");
      return false;
    }
    return true;
  }

  function setBusy(busy) {
    if (btn) {
      btn.disabled = busy;
      btn.setAttribute("aria-busy", busy ? "true" : "false");
    }
    if (previewUpload) {
      previewUpload.disabled = busy;
      previewUpload.setAttribute("aria-busy", busy ? "true" : "false");
    }
    if (previewCancel) previewCancel.disabled = busy;
  }

  function clearPreview() {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
    pendingFile = null;
    if (previewImg) {
      previewImg.removeAttribute("src");
    }
    if (previewFilename) previewFilename.textContent = "";
    if (previewPanel) previewPanel.hidden = true;
    if (btn) btn.hidden = false;
    if (input) input.value = "";
  }

  function showPreviewForFile(file) {
    if (!file || !/^image\//.test(file.type)) {
      showErr("Please choose an image file.");
      return;
    }
    hideErr();
    clearPreview();
    pendingFile = file;
    previewObjectUrl = URL.createObjectURL(file);
    if (previewImg) previewImg.src = previewObjectUrl;
    if (previewFilename) previewFilename.textContent = file.name || "";
    if (previewPanel) previewPanel.hidden = false;
    if (btn) btn.hidden = true;
  }

  function uploadResizeOptions() {
    const scaleRaw = Number(cfg.CLIENT_UPLOAD_SCALE);
    const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 && scaleRaw <= 1 ? scaleRaw : 0.5;
    const maxEdgeRaw = Number(cfg.CLIENT_UPLOAD_MAX_EDGE);
    const maxEdge =
      Number.isFinite(maxEdgeRaw) && maxEdgeRaw > 0 ? Math.min(8192, Math.round(maxEdgeRaw)) : 0;
    const qRaw = Number(cfg.CLIENT_UPLOAD_JPEG_QUALITY);
    const jpegQuality = Number.isFinite(qRaw) ? Math.min(0.95, Math.max(0.5, qRaw)) : 0.82;
    return { scale, maxEdge, jpegQuality };
  }

  function baseNameForJpeg(name) {
    const base = String(name || "photo").replace(/[/\\]/g, "_");
    return base.replace(/\.[^.]+$/, "") || "photo";
  }

  function canvasToJpegFile(canvas, filename, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not encode image"));
            return;
          }
          resolve(new File([blob], filename, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    });
  }

  /**
   * Downscale + JPEG encode before upload. Falls back to original file on any failure
   * (e.g. HEIC on some Android browsers).
   */
  async function prepareUploadFile(file) {
    const { scale, maxEdge, jpegQuality } = uploadResizeOptions();

    if (scale >= 0.999 && maxEdge <= 0) {
      return file;
    }

    try {
      let drawSource;
      let release = () => {};

      if (typeof createImageBitmap === "function") {
        try {
          drawSource = await createImageBitmap(file);
          release = () => {
            if (drawSource && typeof drawSource.close === "function") {
              try {
                drawSource.close();
              } catch (_) {
                /* ignore */
              }
            }
          };
        } catch (_) {
          drawSource = null;
        }
      }

      if (!drawSource) {
        const url = URL.createObjectURL(file);
        try {
          drawSource = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("decode"));
            el.src = url;
          });
        } finally {
          URL.revokeObjectURL(url);
        }
      }

      const w0 = drawSource.width || drawSource.naturalWidth;
      const h0 = drawSource.height || drawSource.naturalHeight;

      if (!w0 || !h0) {
        release();
        return file;
      }

      let w = Math.max(1, Math.round(w0 * scale));
      let h = Math.max(1, Math.round(h0 * scale));
      if (maxEdge > 0) {
        const long = Math.max(w, h);
        if (long > maxEdge) {
          const r = maxEdge / long;
          w = Math.max(1, Math.round(w * r));
          h = Math.max(1, Math.round(h * r));
        }
      }

      if (w >= w0 && h >= h0 && /^image\/jpe?g$/i.test(file.type)) {
        release();
        return file;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        release();
        return file;
      }
      ctx.drawImage(drawSource, 0, 0, w, h);
      release();

      const outName = `${baseNameForJpeg(file.name)}.jpg`;
      return await canvasToJpegFile(canvas, outName, jpegQuality);
    } catch (_) {
      return file;
    }
  }

  async function uploadImageFile(file) {
    if (!file || !/^image\//.test(file.type)) {
      showErr("Please choose an image file.");
      return;
    }

    hideErr();
    if (!validate()) return;

    const cloud = String(cfg.CLOUD_NAME).trim();
    const preset = String(cfg.UPLOAD_PRESET).trim();
    const tag = cfg.LIST_TAG && String(cfg.LIST_TAG).trim();

    let uploadBody = file;
    try {
      uploadBody = await prepareUploadFile(file);
    } catch (_) {
      uploadBody = file;
    }

    const fd = new FormData();
    fd.append("file", uploadBody);
    fd.append("upload_preset", preset);
    if (tag) fd.append("tags", tag);

    setBusy(true);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, {
        method: "POST",
        body: fd,
      });
      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        /* ignore */
      }
      if (!res.ok) {
        const msg =
          (data.error && data.error.message) || `Upload failed (${res.status} ${res.statusText || ""})`;
        showErr(msg);
        return;
      }
      showToast();
      clearPreview();
    } catch (e) {
      showErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (btn && input) {
    btn.addEventListener("click", () => {
      hideErr();
      if (!validate()) return;
      input.click();
    });

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (file) showPreviewForFile(file);
    });
  }

  if (previewUpload) {
    previewUpload.addEventListener("click", () => {
      if (!pendingFile) return;
      uploadImageFile(pendingFile);
    });
  }

  if (previewCancel) {
    previewCancel.addEventListener("click", () => {
      hideErr();
      clearPreview();
      if (input && validate()) input.click();
    });
  }
})();
