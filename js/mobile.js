(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};

  const btn = document.getElementById("open-upload");
  const input = document.getElementById("photo-input");
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
    return true;
  }

  function setBusy(busy) {
    if (!btn) return;
    btn.disabled = busy;
    btn.setAttribute("aria-busy", busy ? "true" : "false");
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

    const fd = new FormData();
    fd.append("file", file);
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
    } catch (e) {
      showErr(e.message || String(e));
    } finally {
      setBusy(false);
      if (input) input.value = "";
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
      if (file) uploadImageFile(file);
    });
  }
})();
