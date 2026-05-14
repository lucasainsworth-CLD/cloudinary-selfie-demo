(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const steps = window.TRANSFORMATIONS || [];
  const TRANSFORM_MS = 5000;

  const els = {
    grid: document.getElementById("wall-grid"),
    qr: document.getElementById("wall-qr"),
    status: document.getElementById("wall-status"),
    error: document.getElementById("wall-error"),
    errorText: document.getElementById("wall-error-text"),
  };

  let transformIndex = 0;
  let pollTimer = null;
  let transformTimer = null;

  function showError(msg) {
    if (els.error && els.errorText) {
      els.error.hidden = false;
      els.errorText.textContent = msg;
    }
  }

  function mobilePageUrl() {
    if (cfg.MOBILE_PAGE_URL && String(cfg.MOBILE_PAGE_URL).trim()) {
      return String(cfg.MOBILE_PAGE_URL).trim();
    }
    return new URL("mobile.html", window.location.href).href;
  }

  function listUrl() {
    const cloud = encodeURIComponent(cfg.CLOUD_NAME.trim());
    const tag = encodeURIComponent(cfg.LIST_TAG.trim());
    return `https://res.cloudinary.com/${cloud}/image/list/${tag}.json`;
  }

  function encodePublicId(publicId) {
    return String(publicId)
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  function imageUrl(publicId, transformSegment) {
    const cloud = cfg.CLOUD_NAME.trim();
    const t = transformSegment.replace(/^\/+|\/+$/g, "");
    const id = encodePublicId(publicId);
    return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${id}`;
  }

  function validateConfig() {
    if (!cfg.CLOUD_NAME || !String(cfg.CLOUD_NAME).trim()) {
      showError("Set CLOUD_NAME in js/site-config.js (see js/site-config.example.js).");
      return false;
    }
    if (!cfg.LIST_TAG || !String(cfg.LIST_TAG).trim()) {
      showError("Set LIST_TAG in js/site-config.js to match your upload preset tag.");
      return false;
    }
    if (!steps.length) {
      showError("TRANSFORMATIONS is empty. Add steps in js/transformations.js.");
      return false;
    }
    return true;
  }

  function sortAndCap(resources) {
    const max = Math.max(1, Math.min(1000, Number(cfg.MAX_VISIBLE) || 40));
    const list = Array.isArray(resources) ? resources.slice() : [];
    list.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
    return list.slice(0, max);
  }

  async function fetchResources() {
    const url = listUrl();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`List fetch failed (${res.status}). Check cloud name, tag, and Cloudinary Security → Resource list.`);
    }
    const data = await res.json();
    return sortAndCap(data.resources || []);
  }

  function applyStepToCell(cell, resource) {
    const step = steps[transformIndex % steps.length];
    const frame = cell.querySelector(".frame");
    const img = cell.querySelector("img");
    if (!frame || !img || !resource) return;
    frame.style.setProperty("--frame-w", step.frameWidth);
    frame.style.setProperty("--frame-h", step.frameHeight);
    img.src = imageUrl(resource.public_id, step.transform);
    img.alt = resource.public_id || "";
  }

  function render(resources) {
    const grid = els.grid;
    if (!grid) return;

    const prevIds = new Set(Array.from(grid.querySelectorAll(".cell")).map((c) => c.dataset.publicId));

    grid.replaceChildren();

    resources.forEach((r) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.publicId = r.public_id;
      if (!prevIds.has(r.public_id)) {
        cell.classList.add("is-new");
      }
      cell.innerHTML = '<div class="frame"><img loading="lazy" alt="" /></div>';
      grid.appendChild(cell);
      applyStepToCell(cell, r);
    });

    grid.querySelectorAll(".cell.is-new").forEach((cell) => {
      requestAnimationFrame(() => {
        setTimeout(() => cell.classList.remove("is-new"), 700);
      });
    });

    if (els.status) {
      const t = new Date().toLocaleTimeString();
      els.status.textContent = `${resources.length} on wall · updated ${t}`;
    }
  }

  function applyTransformToAll() {
    const grid = els.grid;
    if (!grid) return;
    Array.from(grid.querySelectorAll(".cell")).forEach((cell) => {
      const id = cell.dataset.publicId;
      applyStepToCell(cell, { public_id: id });
    });
  }

  async function poll() {
    try {
      const resources = await fetchResources();
      render(resources);
      if (els.error) els.error.hidden = true;
    } catch (e) {
      console.error(e);
      showError(e.message || String(e));
    }
  }

  function startTimers() {
    const pollMs = Math.max(5000, Number(cfg.POLL_MS) || 15000);
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(poll, pollMs);

    if (transformTimer) clearInterval(transformTimer);
    transformTimer = setInterval(() => {
      transformIndex = (transformIndex + 1) % steps.length;
      applyTransformToAll();
    }, TRANSFORM_MS);
  }

  function setupQr() {
    const target = mobilePageUrl();
    if (!els.qr) return;
    const data = encodeURIComponent(target);
    els.qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=224x224&margin=8&data=${data}`;
    els.qr.alt = "Scan to upload";
    els.qr.referrerPolicy = "no-referrer";
  }

  function initGridScrollFlag() {
    if (!els.grid) return;
    const allow = Boolean(cfg.ALLOW_GRID_SCROLL);
    els.grid.dataset.scroll = allow ? "true" : "false";
  }

  function boot() {
    initGridScrollFlag();
    if (!validateConfig()) return;
    setupQr();
    poll();
    startTimers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
