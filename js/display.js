(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const steps = window.TRANSFORMATIONS || [];
  const CYCLE_MS = Math.max(1000, Number(cfg.TRANSFORM_CYCLE_MS) || 16000);
  const POPUP_MS = 4000;
  /** Full passes through TRANSFORMATIONS before “new” badge/position expires (default 6). */
  const NEW_IMAGE_ROUNDS = Math.max(1, Number(cfg.NEW_IMAGE_CYCLES) || 6);
  const NEW_IMAGES_POPUP_MS = Math.max(1500, Number(cfg.NEW_IMAGES_POPUP_MS) || 3500);
  const MAX_VISIBLE = Math.max(1, Math.min(1000, Number(cfg.MAX_VISIBLE) || 40));
  const WALL_ROTATION_STEP = Math.max(1, Number(cfg.WALL_ROTATION_STEP) || 10);
  const AUTO_SCROLL_GRID = cfg.AUTO_SCROLL_GRID !== false;
  let hasScheduledInitialScroll = false;

  const rawScrollMaxSpeed = Number(cfg.AUTO_SCROLL_MAX_SPEED_PX_S);
  const AUTO_SCROLL_MAX_SPEED_PX_S = Number.isFinite(rawScrollMaxSpeed)
    ? Math.max(0, rawScrollMaxSpeed)
    : 280;

  /** Ms to scroll after apply until next transform popup; boot uses full cycle. */
  function autoScrollDurationMs(fromBoot, maxScroll) {
    const raw = Number(cfg.AUTO_SCROLL_MS);
    let base =
      Number.isFinite(raw) && raw > 0
        ? raw
        : fromBoot
          ? CYCLE_MS
          : Math.max(1000, CYCLE_MS - POPUP_MS);
    if (AUTO_SCROLL_MAX_SPEED_PX_S > 0 && maxScroll > 4) {
      const minForSpeed = Math.ceil((maxScroll / AUTO_SCROLL_MAX_SPEED_PX_S) * 1000);
      base = Math.max(base, minForSpeed);
    }
    return base;
  }
  const CELL_INNER_HTML =
    '<div class="frame"><img loading="lazy" alt="" style="opacity:1" /><span class="frame-new-badge" hidden>new</span></div>';

  const els = {
    grid: document.getElementById("wall-grid"),
    qr: document.getElementById("wall-qr"),
    status: document.getElementById("wall-status"),
    error: document.getElementById("wall-error"),
    errorText: document.getElementById("wall-error-text"),
    popup: document.getElementById("transform-popup"),
    popupName: document.getElementById("transform-popup-name"),
    popupCode: document.getElementById("transform-popup-code"),
    transformLabel: document.getElementById("wall-transform-label"),
    newImagesPopup: document.getElementById("new-images-popup"),
    newImagesPopupDetail: document.getElementById("new-images-popup-detail"),
  };

  /** Index currently shown on the grid (poll/render use this). */
  let displayedTransformIndex = 0;
  /** Next index while the popup is up (header + popup preview). */
  let previewTransformIndex = null;
  let pollTimer = null;
  let cycleTimer = null;
  let cycleStepTimer = null;
  let popupFadeTimer = null;
  let typewriterTimer = null;
  let typewriterGen = 0;
  let newImagesPopupTimer = null;
  let newImagesPopupFadeTimer = null;

  const knownPublicIds = new Set();
  const newImageCycles = new Map();
  let listInitialized = false;
  /** Full tag list from last poll (newest first). */
  let cachedResources = [];
  /** Advances after each full TRANSFORMATIONS loop to slide the non-new window. */
  let rotationIndex = 0;
  /** Stable display order (public_ids); only reshuffled when rotation advances. */
  let wallOrderIds = [];
  let autoScrollRaf = null;
  let autoScrollLayoutTimer = null;

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

  /**
   * Build delivery URL. If `step.deliveryUrlExtension` is set (e.g. "gif" for zoompan),
   * any trailing image extension on public_id (.jpg, .png, …) is replaced with that
   * extension; if there is no extension, `.gif` (etc.) is appended.
   */
  function imageUrl(publicId, step) {
    const cloud = cfg.CLOUD_NAME.trim();
    const transformSegment = step && step.transform ? String(step.transform) : "";
    const t = transformSegment.replace(/^\/+|\/+$/g, "");
    let pid = String(publicId || "");
    const fmt = step && step.deliveryUrlExtension ? String(step.deliveryUrlExtension).replace(/^\./, "") : "";
    if (fmt) {
      const withDot = `.${fmt.toLowerCase()}`;
      const extRe = /\.(jpe?g|png|gif|webp|bmp|tiff?|svg|heic|avif)$/i;
      if (extRe.test(pid)) pid = pid.replace(extRe, withDot);
      else pid = `${pid}${withDot}`;
    }
    const id = encodePublicId(pid);
    return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${id}`;
  }

  const FRAME_TRANSITION_MS = 750;

  function deliveryDimensions(step) {
    if (step.deliveryWidth > 0 && step.deliveryHeight > 0) {
      return { w: step.deliveryWidth, h: step.deliveryHeight, source: "manual" };
    }
    const parser = window.parseCloudinaryTransformDimensions;
    if (typeof parser === "function") {
      return parser(step.transform, {
        defaultWidth: Number(cfg.DEFAULT_DELIVERY_WIDTH) || 240,
      });
    }
    return { w: 240, h: 240, source: "unknown" };
  }

  function applyFramePixels(frame, w, h) {
    const scaleRaw = Number(cfg.FRAME_SCALE);
    const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 ? scaleRaw : 1;
    const pxW = Math.round(w * scale);
    const pxH = Math.round(h * scale);
    const prevW = frame.dataset.deliveryW;
    const prevH = frame.dataset.deliveryH;
    if (prevW === String(pxW) && prevH === String(pxH)) {
      return;
    }
    frame.style.transition = "width var(--frame-transition), height var(--frame-transition)";
    frame.offsetHeight;
    frame.style.width = `${pxW}px`;
    frame.style.height = `${pxH}px`;
    frame.dataset.deliveryW = String(pxW);
    frame.dataset.deliveryH = String(pxH);
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

  function sortByNewest(resources) {
    const list = Array.isArray(resources) ? resources.slice() : [];
    list.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
    return list;
  }

  function isResourceNew(resource) {
    const id = resource && resource.public_id;
    return id ? (newImageCycles.get(id) || 0) > 0 : false;
  }

  function seededShuffle(items, seed) {
    const arr = items.slice();
    let state = seed >>> 0;
    const nextUnit = () => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(nextUnit() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function rotatingWindowSlice(nonNew, slotsForRotating) {
    if (slotsForRotating <= 0 || nonNew.length === 0) {
      return { slice: [], start: 0 };
    }
    if (nonNew.length <= slotsForRotating) {
      return { slice: nonNew, start: 0 };
    }
    const maxStart = nonNew.length - slotsForRotating;
    let start = rotationIndex * WALL_ROTATION_STEP;
    if (start > maxStart) {
      start = start % (maxStart + 1);
    }
    return { slice: nonNew.slice(start, start + slotsForRotating), start };
  }

  function mergeWallOrderPreservingRotate(prevIds, ctx) {
    const { newIds, poolIds, byId, rotatingPool } = ctx;
    const newSet = new Set(newIds);
    const result = [];
    const seen = new Set();

    newIds.forEach((id) => {
      if (!byId.has(id) || seen.has(id)) return;
      result.push(id);
      seen.add(id);
    });

    prevIds.forEach((id) => {
      if (seen.has(id) || !byId.has(id) || newSet.has(id) || !poolIds.has(id)) return;
      result.push(id);
      seen.add(id);
    });

    rotatingPool.forEach((r) => {
      if (result.length >= MAX_VISIBLE) return;
      const id = r.public_id;
      if (seen.has(id) || !byId.has(id)) return;
      result.push(id);
      seen.add(id);
    });

    return result.slice(0, MAX_VISIBLE);
  }

  /**
   * Wall order: “new” first, then a shuffled slice of non-new (sliding window).
   * Order is stable across list polls until advanceWallRotation() (full transform loop).
   */
  function buildWallList(resources, options) {
    const forceReshuffle = options && options.forceReshuffle === true;
    const sorted = sortByNewest(resources);
    const byId = new Map(sorted.map((r) => [r.public_id, r]));
    const newOnes = sorted.filter((r) => isResourceNew(r));
    const nonNew = sorted.filter((r) => !isResourceNew(r));
    const slotsForRotating = Math.max(0, MAX_VISIBLE - newOnes.length);
    const { slice: rotatingPool, start } = rotatingWindowSlice(nonNew, slotsForRotating);
    const poolIds = new Set(rotatingPool.map((r) => r.public_id));
    const newIds = newOnes.map((r) => r.public_id);

    if (forceReshuffle || wallOrderIds.length === 0) {
      const seed = (Math.imul(rotationIndex + 1, 2654435761) ^ Math.imul(start + 1, 2246822519)) >>> 0;
      const shuffled = seededShuffle(rotatingPool, seed);
      wallOrderIds = [...newIds, ...shuffled.map((r) => r.public_id)].slice(0, MAX_VISIBLE);
    } else {
      wallOrderIds = mergeWallOrderPreservingRotate(wallOrderIds, {
        newIds,
        poolIds,
        byId,
        rotatingPool,
      });
    }

    return wallOrderIds.map((id) => byId.get(id)).filter(Boolean);
  }

  async function fetchResources() {
    const url = listUrl();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      let hint = `List fetch failed (${res.status} ${res.statusText || ""}). URL: ${url}`;
      if (res.status === 401 || res.status === 403) {
        hint +=
          " — Cloudinary usually returns this when the list delivery type is still restricted: Dashboard → Settings → Security → “Restricted media types” → clear “Resource list” (save), or use a signed list URL from a server.";
      }
      let bodyPreview = "";
      try {
        const t = await res.text();
        bodyPreview = t ? ` Response: ${t.slice(0, 200)}${t.length > 200 ? "…" : ""}` : "";
      } catch (_) {
        /* ignore */
      }
      throw new Error(hint + bodyPreview);
    }
    const data = await res.json();
    return sortByNewest(data.resources || []);
  }

  function applyFrameSizeAnimated(frame, step) {
    const dims = deliveryDimensions(step);
    frame.dataset.inferFromImage = dims.source === "unknown" ? "1" : "0";
    applyFramePixels(frame, dims.w, dims.h);
    return dims;
  }

  function maybeInferFrameFromImage(frame, img) {
    if (frame.dataset.inferFromImage !== "1") return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;
    applyFramePixels(frame, nw, nh);
    frame.dataset.inferFromImage = "0";
  }

  function applyImageSrc(img, newSrc, frame) {
    if (!newSrc || img.dataset.currentSrc === newSrc) return;
    const fadeMs = FRAME_TRANSITION_MS;
    img.style.transition = `opacity ${fadeMs}ms ease`;
    img.style.opacity = "0";

    const preload = new Image();
    preload.onload = () => {
      img.src = newSrc;
      img.dataset.currentSrc = newSrc;
      if (frame) maybeInferFrameFromImage(frame, img);
      requestAnimationFrame(() => {
        img.style.opacity = "1";
      });
    };
    preload.onerror = () => {
      img.src = newSrc;
      img.dataset.currentSrc = newSrc;
      img.style.opacity = "1";
    };
    preload.src = newSrc;
  }

  function activeTransformIndex() {
    return displayedTransformIndex;
  }

  function detectNewPublicIds(resources) {
    const ids = resources.map((r) => r.public_id).filter(Boolean);
    if (!listInitialized) {
      ids.forEach((id) => knownPublicIds.add(id));
      listInitialized = true;
      return [];
    }
    const added = [];
    ids.forEach((id) => {
      if (!knownPublicIds.has(id)) {
        added.push(id);
        knownPublicIds.add(id);
      }
    });
    return added;
  }

  function markNewUploads(publicIds) {
    if (!publicIds.length) return;
    publicIds.forEach((id) => newImageCycles.set(id, NEW_IMAGE_ROUNDS));
    showNewImagesPopup(publicIds.length);
  }

  function syncRecentBadge(cell) {
    if (!cell) return;
    const cycles = newImageCycles.get(cell.dataset.publicId) || 0;
    const badge = cell.querySelector(".frame-new-badge");
    if (cycles > 0) {
      cell.classList.add("cell--recent");
      if (badge) badge.hidden = false;
    } else {
      cell.classList.remove("cell--recent");
      if (badge) badge.hidden = true;
    }
  }

  function syncAllRecentBadges() {
    const grid = els.grid;
    if (!grid) return;
    grid.querySelectorAll(".cell").forEach(syncRecentBadge);
  }

  /** Decrement “new” status once per full TRANSFORMATIONS loop (not per step). */
  function tickNewImageRounds() {
    if (!newImageCycles.size) return false;
    let membershipChanged = false;
    for (const [id, left] of [...newImageCycles.entries()]) {
      if (left <= 1) {
        newImageCycles.delete(id);
        membershipChanged = true;
      } else {
        newImageCycles.set(id, left - 1);
      }
    }
    syncAllRecentBadges();
    return membershipChanged;
  }

  /** Slide + shuffle non-new slots; tick new-image rounds (once per full pass). */
  function advanceWallRotation() {
    rotationIndex += 1;
    tickNewImageRounds();
    if (cachedResources.length) {
      render(buildWallList(cachedResources, { forceReshuffle: true }));
    }
  }

  function hideNewImagesPopup() {
    if (!els.newImagesPopup) return;
    els.newImagesPopup.classList.remove("is-visible");
    if (newImagesPopupFadeTimer) clearTimeout(newImagesPopupFadeTimer);
    newImagesPopupFadeTimer = setTimeout(() => {
      els.newImagesPopup.hidden = true;
      newImagesPopupFadeTimer = null;
    }, 350);
  }

  function showNewImagesPopup(count) {
    if (!els.newImagesPopup || count < 1) return;
    if (newImagesPopupTimer) {
      clearTimeout(newImagesPopupTimer);
      newImagesPopupTimer = null;
    }

    const reveal = () => {
      if (els.newImagesPopupDetail) {
        const noun = count === 1 ? "selfie" : "selfies";
        els.newImagesPopupDetail.textContent = `${count} new ${noun} joined the wall`;
      }
      els.newImagesPopup.hidden = false;
      requestAnimationFrame(() => {
        els.newImagesPopup.classList.add("is-visible");
      });
      newImagesPopupTimer = setTimeout(() => {
        newImagesPopupTimer = null;
        hideNewImagesPopup();
      }, NEW_IMAGES_POPUP_MS);
    };

    if (els.popup && els.popup.classList.contains("is-visible")) {
      setTimeout(reveal, 450);
    } else {
      reveal();
    }
  }

  function isTransformPopupVisible() {
    return Boolean(els.popup && !els.popup.hidden && els.popup.classList.contains("is-visible"));
  }

  function cancelGridAutoScroll() {
    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
    if (autoScrollLayoutTimer) {
      clearTimeout(autoScrollLayoutTimer);
      autoScrollLayoutTimer = null;
    }
  }

  function getGridMaxScroll(grid) {
    return Math.max(0, grid.scrollHeight - grid.clientHeight);
  }

  function startGridAutoScroll(fromBoot) {
    const grid = els.grid;
    if (!AUTO_SCROLL_GRID || !grid || grid.dataset.scroll !== "true") return;

    cancelGridAutoScroll();
    grid.scrollTop = 0;

    const maxScroll = getGridMaxScroll(grid);
    if (maxScroll <= 4) {
      return;
    }

    const duration = autoScrollDurationMs(fromBoot, maxScroll);
    const startTime = performance.now();

    function tick(now) {
      if (!AUTO_SCROLL_GRID) {
        autoScrollRaf = null;
        return;
      }
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const currentMax = getGridMaxScroll(grid);
      grid.scrollTop = Math.round(t * currentMax);
      if (t < 1) {
        autoScrollRaf = requestAnimationFrame(tick);
      } else {
        autoScrollRaf = null;
      }
    }
    autoScrollRaf = requestAnimationFrame(tick);
  }

  /** Wait for frame size transitions, then measure row height and scroll. */
  function scheduleAutoScrollAfterLayout(fromBoot) {
    if (!AUTO_SCROLL_GRID) return;
    cancelGridAutoScroll();
    if (autoScrollLayoutTimer) clearTimeout(autoScrollLayoutTimer);
    autoScrollLayoutTimer = setTimeout(() => {
      autoScrollLayoutTimer = null;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => startGridAutoScroll(fromBoot));
      });
    }, FRAME_TRANSITION_MS + 80);
  }

  function applyStepToCell(cell, resource) {
    const step = steps[activeTransformIndex() % steps.length];
    const frame = cell.querySelector(".frame");
    const img = cell.querySelector("img");
    if (!frame || !img || !resource) return;
    applyFrameSizeAnimated(frame, step);
    applyImageSrc(img, imageUrl(resource.public_id, step), frame);
    img.alt = resource.public_id || "";
  }

  function render(resources) {
    const grid = els.grid;
    if (!grid) return;

    const prevIds = new Set(Array.from(grid.querySelectorAll(".cell")).map((c) => c.dataset.publicId));
    const existing = new Map(
      Array.from(grid.querySelectorAll(".cell")).map((c) => [c.dataset.publicId, c])
    );
    const fragment = document.createDocumentFragment();

    resources.forEach((r) => {
      let cell = existing.get(r.public_id);
      if (cell) {
        existing.delete(r.public_id);
        if (!cell.querySelector(".frame-new-badge")) {
          cell.innerHTML = CELL_INNER_HTML;
        }
      } else {
        cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.publicId = r.public_id;
        if (!prevIds.has(r.public_id)) {
          cell.classList.add("is-arriving");
        }
        cell.innerHTML = CELL_INNER_HTML;
      }
      fragment.appendChild(cell);
      applyStepToCell(cell, r);
    });

    grid.replaceChildren(fragment);

    grid.querySelectorAll(".cell.is-arriving").forEach((cell) => {
      requestAnimationFrame(() => {
        setTimeout(() => cell.classList.remove("is-arriving"), 700);
      });
    });

    syncAllRecentBadges();

    if (els.status) {
      const t = new Date().toLocaleTimeString();
      els.status.textContent = `${resources.length} on wall · updated ${t}`;
    }

    if (
      AUTO_SCROLL_GRID &&
      !hasScheduledInitialScroll &&
      previewTransformIndex === null &&
      !isTransformPopupVisible()
    ) {
      hasScheduledInitialScroll = true;
      scheduleAutoScrollAfterLayout(true);
    }
  }

  function applyTransformToAll() {
    const grid = els.grid;
    if (!grid) return;
    Array.from(grid.querySelectorAll(".cell")).forEach((cell) => {
      const id = cell.dataset.publicId;
      applyStepToCell(cell, { public_id: id });
    });
    scheduleAutoScrollAfterLayout(false);
  }

  function stepLabel(step, index) {
    const name = step && step.name ? String(step.name).trim() : "";
    return name || `step_${index + 1}`;
  }

  function updateTransformLabel() {
    if (!els.transformLabel || !steps.length) return;
    const idx =
      previewTransformIndex !== null
        ? previewTransformIndex
        : displayedTransformIndex;
    const step = steps[idx % steps.length];
    const label = stepLabel(step, idx);
    els.transformLabel.textContent = `apply transformation: ${label}`;
  }

  function cancelTypewriter() {
    typewriterGen += 1;
    if (typewriterTimer) {
      clearTimeout(typewriterTimer);
      typewriterTimer = null;
    }
  }

  function typewriter(text, el) {
    cancelTypewriter();
    const gen = typewriterGen;
    const full = String(text || "");
    el.textContent = "";
    el.classList.remove("is-done");
    if (!full) {
      el.classList.add("is-done");
      return Promise.resolve();
    }
    const maxTypingMs = Math.max(800, POPUP_MS - 600);
    const msPerChar = Math.max(12, Math.min(45, Math.floor(maxTypingMs / full.length)));

    return new Promise((resolve) => {
      let i = 0;
      function tick() {
        if (gen !== typewriterGen) {
          resolve();
          return;
        }
        el.textContent = full.slice(0, i + 1);
        i += 1;
        if (i >= full.length) {
          el.classList.add("is-done");
          resolve();
          return;
        }
        typewriterTimer = setTimeout(tick, msPerChar);
      }
      tick();
    });
  }

  function showTransformPopup(step, index) {
    if (!els.popup || !els.popupName || !els.popupCode) return;
    els.popup.hidden = false;
    requestAnimationFrame(() => {
      els.popup.classList.add("is-visible");
    });
    els.popupName.textContent = `name: ${stepLabel(step, index)}`;
    typewriter(step.transform, els.popupCode);
  }

  function hideTransformPopup(onHidden) {
    cancelTypewriter();
    if (!els.popup) {
      if (typeof onHidden === "function") onHidden();
      return;
    }
    els.popup.classList.remove("is-visible");
    if (popupFadeTimer) clearTimeout(popupFadeTimer);
    popupFadeTimer = setTimeout(() => {
      els.popup.hidden = true;
      popupFadeTimer = null;
      if (typeof onHidden === "function") onHidden();
    }, 350);
  }

  function runTransformCycle() {
    if (!steps.length) return;
    if (cycleStepTimer) {
      clearTimeout(cycleStepTimer);
      cycleStepTimer = null;
      previewTransformIndex = null;
    }

    const nextIndex = (displayedTransformIndex + 1) % steps.length;
    const step = steps[nextIndex];
    previewTransformIndex = nextIndex;
    updateTransformLabel();
    showTransformPopup(step, nextIndex);

    cycleStepTimer = setTimeout(() => {
      cycleStepTimer = null;
      hideTransformPopup(() => {
        displayedTransformIndex = nextIndex;
        previewTransformIndex = null;
        applyTransformToAll();
        if (nextIndex === 0) {
          advanceWallRotation();
        }
        updateTransformLabel();
      });
    }, POPUP_MS);
  }

  async function poll() {
    try {
      cachedResources = await fetchResources();
      const newlyAdded = detectNewPublicIds(cachedResources);
      if (newlyAdded.length) markNewUploads(newlyAdded);
      render(buildWallList(cachedResources));
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

    if (cycleTimer) clearInterval(cycleTimer);
    cycleTimer = setInterval(runTransformCycle, CYCLE_MS);
  }

  function setupQr() {
    const target = mobilePageUrl();
    if (!els.qr) return;
    const data = encodeURIComponent(target);
    els.qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=224x224&margin=8&data=${data}`;
    els.qr.alt = "Scan to upload";
    els.qr.referrerPolicy = "no-referrer";
  }

  function setupHeaderLogo() {
    const el = document.getElementById("wall-cloudinary-logo");
    if (!el) return;
    const configured = cfg.HEADER_LOGO_URL && String(cfg.HEADER_LOGO_URL).trim();
    const builtins = [
      "https://res.cloudinary.com/dz6ajwh6k/image/upload/v1762988734/stacked_logo_box_tdfrid.png",
      "https://res.cloudinary.com/dz6ajwh6k/image/upload/f_png,q_auto/v1762988734/stacked_logo_box_tdfrid.png",
      "https://res.cloudinary.com/dz6ajwh6k/image/upload/w_224,h_224,c_fill,f_png,q_auto/v1762988734/stacked_logo_box_tdfrid.png",
      "https://res.cloudinary.com/dz6ajwh6k/image/upload/stacked_logo_box_tdfrid.png",
    ];
    const candidates = [...(configured ? [configured] : []), ...builtins].filter((u, i, a) => a.indexOf(u) === i);
    let idx = 0;
    el.referrerPolicy = "no-referrer";
    el.decoding = "async";
    el.onerror = () => {
      idx += 1;
      if (idx < candidates.length) {
        el.src = candidates[idx];
      } else {
        el.onerror = null;
      }
    };
    el.src = candidates[0];
  }

  function initGridScrollFlag() {
    if (!els.grid) return;
    const allow = Boolean(cfg.ALLOW_GRID_SCROLL) || AUTO_SCROLL_GRID;
    els.grid.dataset.scroll = allow ? "true" : "false";
    els.grid.dataset.autoScroll = AUTO_SCROLL_GRID ? "true" : "false";
  }

  function boot() {
    initGridScrollFlag();
    if (!validateConfig()) return;
    setupQr();
    setupHeaderLogo();
    updateTransformLabel();
    poll();
    startTimers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
