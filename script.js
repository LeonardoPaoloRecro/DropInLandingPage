// Add your Web3Forms access key here to enable real email delivery on GitHub Pages.
const WEB3FORMS_ACCESS_KEY = "5ce2a8dd-9046-4c07-8e43-32210ff8efb9";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WAITLIST_ENDPOINT = WEB3FORMS_ACCESS_KEY ? WEB3FORMS_ENDPOINT : "";
const GYM_LEADS_ENDPOINT = WEB3FORMS_ACCESS_KEY ? WEB3FORMS_ENDPOINT : "";

const revealItems = document.querySelectorAll(".reveal");
const parallaxShells = document.querySelectorAll(".parallax-shell");
const viewLinks = document.querySelectorAll(".view-link");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const floatingBrand = document.querySelector(".floating-brand");
const floatingBrandImage = floatingBrand?.querySelector("img");
const introScreen = document.getElementById("intro-screen");
const entryLoader = document.getElementById("entry-loader");
const entryLoaderLogo = document.getElementById("entry-loader-logo");
const introAudio = document.getElementById("intro-audio");
let focusFrame = 0;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsParallax = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion;
const supportsDesktopCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let introDismissed = !introScreen;
let introAudioFadeFrame = 0;
let introHideTimer = 0;
let entryCompleteTimer = 0;
let introDismissQueued = false;
let introDismissFallbackTimer = 0;
let introAudioHasStarted = false;

async function startIntroAudio() {
  if (!introAudio || !introScreen || introDismissed) {
    return;
  }

  introAudio.loop = true;
  introAudio.preload = "auto";
  introAudio.playsInline = true;
  introAudio.volume = 0.24;
  introAudio.muted = false;

  try {
    if (introAudio.readyState === 0) {
      introAudio.load();
    }
    if (introAudio.currentTime === 0 || introAudio.paused) {
      introAudio.currentTime = 0;
    }
    await introAudio.play();
    introAudioHasStarted = true;
  } catch {
    // Autoplay may be blocked until interaction.
  }
}

function stopIntroAudio(fadeDuration = 520) {
  if (!introAudio) {
    return;
  }

  if (introAudioFadeFrame) {
    cancelAnimationFrame(introAudioFadeFrame);
  }

  const startingVolume = typeof introAudio.volume === "number" ? introAudio.volume : 0.16;
  const fadeStart = performance.now();

  const step = (timestamp) => {
    const elapsed = timestamp - fadeStart;
    const progress = Math.min(elapsed / fadeDuration, 1);
    introAudio.volume = Math.max(startingVolume * (1 - progress), 0);

    if (progress < 1) {
      introAudioFadeFrame = requestAnimationFrame(step);
      return;
    }

    introAudio.pause();
    introAudio.currentTime = 0;
    introAudio.volume = 0.24;
    introAudioFadeFrame = 0;
  };

  introAudioFadeFrame = requestAnimationFrame(step);
}

function queueIntroDismiss() {
  if (!introScreen || introDismissed || introDismissQueued) {
    return;
  }

  introDismissQueued = true;

  if (introAudioHasStarted || !introAudio) {
    window.setTimeout(() => {
      dismissIntro();
    }, prefersReducedMotion ? 40 : 240);
    return;
  }

  if (introDismissFallbackTimer) {
    window.clearTimeout(introDismissFallbackTimer);
  }

  introDismissFallbackTimer = window.setTimeout(() => {
    if (!introDismissed) {
      dismissIntro();
    }
    introDismissFallbackTimer = 0;
  }, prefersReducedMotion ? 120 : 1200);
}

function syncEntryLoaderLogo() {
  if (!entryLoaderLogo || !floatingBrandImage || entryLoaderLogo.getAttribute("src")) {
    return;
  }

  entryLoaderLogo.src = floatingBrandImage.currentSrc || floatingBrandImage.src;
}

function revealSite() {
  document.body.classList.remove("intro-active");
  if (supportsDesktopCursor) {
    document.body.classList.add("cursor-ready");
  }
  revealVisibleNow();
  queueFocusUpdate();
}

function completeEntrySequence() {
  if (!entryLoader) {
    revealSite();
    return;
  }

  entryLoader.classList.remove("is-active");
  entryLoader.classList.add("is-leaving");

  revealSite();

  window.setTimeout(() => {
    entryLoader.hidden = true;
    entryLoader.setAttribute("aria-hidden", "true");
    entryLoader.classList.remove("is-leaving");
  }, prefersReducedMotion ? 40 : 1140);
}

function dismissIntro() {
  if (!introScreen || introDismissed) {
    return;
  }

  introDismissed = true;
  introScreen.classList.add("is-leaving");
  stopIntroAudio(prefersReducedMotion ? 40 : 1800);

  syncEntryLoaderLogo();

  if (entryLoader) {
    entryLoader.hidden = false;
    entryLoader.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      entryLoader.classList.add("is-active");
    });
  }

  if (introHideTimer) {
    window.clearTimeout(introHideTimer);
  }

  if (entryCompleteTimer) {
    window.clearTimeout(entryCompleteTimer);
  }

  introHideTimer = window.setTimeout(() => {
    introScreen.hidden = true;
    introScreen.setAttribute("aria-hidden", "true");
    introHideTimer = 0;
  }, prefersReducedMotion ? 40 : 620);

  entryCompleteTimer = window.setTimeout(() => {
    completeEntrySequence();
    entryCompleteTimer = 0;
  }, prefersReducedMotion ? 120 : 5000);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
);

revealItems.forEach((item) => observer.observe(item));

function revealVisibleNow() {
  revealItems.forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight * 0.95) {
      item.classList.add("is-visible");
    }
  });
}

function updateFocusZones() {
  focusFrame = 0;

  if (prefersReducedMotion) {
    return;
  }

  const activePanel = [...viewPanels].find((panel) => !panel.hidden);
  const zones = activePanel?.querySelectorAll("[data-focus-zone]") || [];
  const viewportHeight = window.innerHeight || 1;
  const center = viewportHeight * 0.5;
  const focusRadius = viewportHeight * 0.14;
  const falloff = viewportHeight * 0.42;

  zones.forEach((zone) => {
    const rect = zone.getBoundingClientRect();
    const zoneCenter = rect.top + rect.height * 0.5;
    const distance = Math.abs(zoneCenter - center);
    const normalized = Math.min(Math.max(distance - focusRadius, 0) / falloff, 1);
    const focus = 1 - normalized;
    zone.style.setProperty("--focus", focus.toFixed(3));
  });
}

function queueFocusUpdate() {
  if (prefersReducedMotion || focusFrame) {
    return;
  }

  focusFrame = window.requestAnimationFrame(updateFocusZones);
}

revealVisibleNow();
window.addEventListener("load", revealVisibleNow);
window.addEventListener("resize", revealVisibleNow);
window.addEventListener("scroll", queueFocusUpdate, { passive: true });
window.addEventListener("resize", queueFocusUpdate);
window.addEventListener("load", queueFocusUpdate);

if (!introScreen && supportsDesktopCursor) {
  document.body.classList.add("cursor-ready");
}

if (introScreen) {
  syncEntryLoaderLogo();
  introAudio?.load();
  introAudio?.addEventListener("ended", () => {
    if (introDismissed) {
      return;
    }

    introAudio.currentTime = 0;
    startIntroAudio();
  });

  window.addEventListener(
    "load",
    () => {
      startIntroAudio();
    },
    { once: true }
  );

  introAudio?.addEventListener("canplaythrough", () => {
    startIntroAudio();
  });

  introAudio?.addEventListener("playing", () => {
    introAudioHasStarted = true;

    if (introDismissQueued && !introDismissed) {
      window.setTimeout(() => {
        dismissIntro();
      }, prefersReducedMotion ? 40 : 240);
    }
  });

  window.addEventListener("pageshow", () => {
    if (!introDismissed) {
      startIntroAudio();
    }
  });

  introScreen.addEventListener("pointerdown", () => {
    startIntroAudio();
  });

  introScreen.addEventListener("mousedown", () => {
    startIntroAudio();
  });

  introScreen.addEventListener("pointermove", () => {
    startIntroAudio();
  }, { passive: true });

  introScreen.addEventListener("touchstart", () => {
    startIntroAudio();
  }, { passive: true });

  introScreen.addEventListener("touchend", () => {
    startIntroAudio();
  }, { passive: true });

  introScreen.addEventListener("click", (event) => {
    event.preventDefault();
    startIntroAudio();
    queueIntroDismiss();
  });

  introScreen.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") {
      return;
    }

    event.preventDefault();
    startIntroAudio();
    queueIntroDismiss();
  });
}

parallaxShells.forEach((shell) => {
  shell.style.setProperty("--tilt-x", "0deg");
  shell.style.setProperty("--tilt-y", "0deg");

  if (!supportsParallax) {
    return;
  }

  shell.addEventListener("pointermove", (event) => {
    const rect = shell.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    shell.style.setProperty("--tilt-x", `${x * 10}deg`);
    shell.style.setProperty("--tilt-y", `${-y * 8}deg`);
  });

  shell.addEventListener("pointerleave", () => {
    shell.style.setProperty("--tilt-x", "0deg");
    shell.style.setProperty("--tilt-y", "0deg");
  });
});

function setActiveView(view, shouldScroll = false) {
  viewLinks.forEach((link) => {
    const isActive = link.dataset.viewTarget === view;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  viewPanels.forEach((panel) => {
    const isActive = panel.dataset.viewPanel === view;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  const activePanel = document.querySelector(`[data-view-panel="${view}"]`);
  activePanel?.querySelectorAll(".reveal").forEach((item) => {
    observer.observe(item);

    if (item.getBoundingClientRect().top < window.innerHeight * 0.92) {
      item.classList.add("is-visible");
    }
  });

  queueFocusUpdate();

  if (shouldScroll) {
    history.replaceState(null, "", view === "gimnasios" ? "#gimnasios" : "#usuarios");
  }

  if (shouldScroll) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
}

viewLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setActiveView(link.dataset.viewTarget, true);
  });
});

const initialHash = window.location.hash.replace("#", "");
const initialView = ["partner-hero", "partner-flow", "gym-contact", "gimnasios"].includes(initialHash)
  ? "gimnasios"
  : "usuarios";

setActiveView(initialView);
queueFocusUpdate();

floatingBrand?.addEventListener("click", (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

function showMessage(element, text, kind) {
  element.textContent = text;
  element.className = `form-message ${kind}`;
}

function storeLocally(storageKey, payload) {
  const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
  existing.push({
    ...payload,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(storageKey, JSON.stringify(existing));
}

function bindForm({
  formId,
  messageId,
  fields,
  storageKey,
  endpoint,
  buildPayload,
  emptyMessage,
  successMessage,
  idleLabel,
}) {
  const form = document.getElementById(formId);
  const message = document.getElementById(messageId);

  if (!form || !message) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {};

    for (const field of fields) {
      const input = form.elements.namedItem(field.name) || document.getElementById(field.id);
      if (!input) {
        continue;
      }
      payload[field.name] =
        input.type === "checkbox" ? (input.checked ? "true" : "") : (input.value || "").trim();
    }

    const hasEmptyField = fields.some(
      (field) => field.required !== false && !String(payload[field.name] || "").trim()
    );

    if (hasEmptyField) {
      showMessage(message, emptyMessage, "error");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
      if (endpoint) {
        const requestPayload = buildPayload ? buildPayload(payload) : payload;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || (data && data.success === false)) {
          throw new Error("request_failed");
        }
      } else {
        storeLocally(storageKey, payload);
      }

      form.reset();
      showMessage(message, successMessage, "success");
    } catch (error) {
      showMessage(message, "No se pudo enviar ahora mismo. Inténtalo otra vez en unos minutos.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = idleLabel;
    }
  });
}

bindForm({
  formId: "waitlist-form",
  messageId: "form-message",
  fields: [
    { id: "waitlist-botcheck", name: "botcheck", required: false },
    { id: "first-name", name: "first_name" },
    { id: "last-name", name: "last_name" },
    { id: "email", name: "email" },
  ],
  storageKey: "dropin_waitlist_preview",
  endpoint: WAITLIST_ENDPOINT,
  buildPayload: (payload) => ({
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: "DropIn waitlist | nuevo lead usuario",
    from_name: "DropIn Landing",
    replyto: payload.email,
    source: "usuarios",
    ...payload,
  }),
  emptyMessage: "Completa nombre, apellidos y email.",
  successMessage: "Estás dentro. Te avisaremos cuando DropIn abra acceso en Madrid.",
  idleLabel: "Unirme a la lista",
});

bindForm({
  formId: "gym-form",
  messageId: "gym-form-message",
  fields: [
    { id: "gym-botcheck", name: "botcheck", required: false },
    { id: "gym-name", name: "gym_name" },
    { id: "gym-email", name: "gym_email" },
    { id: "gym-barrio", name: "barrio" },
  ],
  storageKey: "dropin_gym_leads_preview",
  endpoint: GYM_LEADS_ENDPOINT,
  buildPayload: (payload) => ({
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: "DropIn gyms | nuevo lead gimnasio",
    from_name: "DropIn Landing",
    replyto: payload.gym_email,
    source: "gimnasios",
    ...payload,
  }),
  emptyMessage: "Completa el nombre del gimnasio, el email y el barrio.",
  successMessage: "Recibido. Te escribiremos con más información sobre DropIn para gimnasios.",
  idleLabel: "Quiero más información",
});
