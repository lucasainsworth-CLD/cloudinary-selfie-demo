(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};

  const btn = document.getElementById("open-upload");
  const toast = document.getElementById("toast");
  const errEl = document.getElementById("err");

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
    if (typeof cloudinary === "undefined") {
      showErr("Upload widget script failed to load. Check your network.");
      return false;
    }
    if (
      typeof cloudinary.openUploadWidget !== "function" &&
      typeof cloudinary.createUploadWidget !== "function"
    ) {
      showErr("Cloudinary widget API missing. Check upload-widget script URL.");
      return false;
    }
    return true;
  }

  let uploadWidgetInstance = null;

  function widgetOptions() {
    return {
      cloudName: String(cfg.CLOUD_NAME).trim(),
      uploadPreset: String(cfg.UPLOAD_PRESET).trim(),
      sources: ["camera", "local"],
      multiple: false,
      maxFiles: 1,
      showAdvancedOptions: false,
      showUploadMoreButton: false,
      styles: {
        palette: {
          window: "#12121a",
          sourceBg: "#1a1a24",
          windowBorder: "#2a2a36",
          tabIcon: "#a78bfa",
          inactiveTabIcon: "#6b6b7a",
          menuIcons: "#c4b5fd",
          link: "#7dd3fc",
          action: "#7dd3fc",
          inProgress: "#7dd3fc",
          complete: "#4ade80",
          error: "#f87171",
          textDark: "#e8e8ec",
          textLight: "#0a0a0c",
        },
      },
    };
  }

  function widgetCallback(error, result) {
    if (error) {
      showErr(error.message || String(error));
      return;
    }
    if (!result) return;
    if (result.event === "success") {
      showToast();
    }
  }

  function openWidget() {
    hideErr();
    if (!validate()) return;

    if (typeof cloudinary.openUploadWidget === "function") {
      cloudinary.openUploadWidget(widgetOptions(), widgetCallback);
      return;
    }
    if (!uploadWidgetInstance) {
      uploadWidgetInstance = cloudinary.createUploadWidget(widgetOptions(), widgetCallback);
    }
    uploadWidgetInstance.open();
  }

  if (btn) {
    btn.addEventListener("click", openWidget);
  }
})();
