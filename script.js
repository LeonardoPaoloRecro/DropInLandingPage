// Add your Web3Forms access key here to enable real email delivery on GitHub Pages.
const WEB3FORMS_ACCESS_KEY = "5ce2a8dd-9046-4c07-8e43-32210ff8efb9";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WAITLIST_ENDPOINT = WEB3FORMS_ACCESS_KEY ? WEB3FORMS_ENDPOINT : "";
const GYM_LEADS_ENDPOINT = WEB3FORMS_ACCESS_KEY ? WEB3FORMS_ENDPOINT : "";

const revealItems = document.querySelectorAll(".reveal");
const focusZones = document.querySelectorAll("[data-focus-zone]");
const parallaxShells = document.querySelectorAll(".parallax-shell");
const viewLinks = document.querySelectorAll(".view-link");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsParallax = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion;
const focusState = new WeakMap();
let focusFrame = 0;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => observer.observe(item));

function revealVisibleNow() {
  revealItems.forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight * 0.95) {
      item.classList.add("is-visible");
    }
  });
}

function getTargetFocus(zone, viewportHeight, viewportCenter) {
  const rect = zone.getBoundingClientRect();
  const isCompact = window.innerWidth < 768;
  const zoneCenter = rect.top + rect.height * 0.5;
  const distance = Math.abs(zoneCenter - viewportCenter);
  const focusRadius = Math.max(
    viewportHeight * (isCompact ? 0.16 : 0.14),
    Math.min(rect.height, viewportHeight) * (isCompact ? 0.17 : 0.15)
  );
  const falloff = Math.max(
    viewportHeight * (isCompact ? 0.44 : 0.4),
    Math.min(rect.height, viewportHeight) * (isCompact ? 0.36 : 0.32)
  );
  const normalized = Math.min(Math.max(distance - focusRadius, 0) / falloff, 1);
  const eased = normalized * normalized * (3 - 2 * normalized);
  const minFocus = isCompact ? 0.5 : 0.4;

  return 1 - eased * (1 - minFocus);
}

function stepFocusZones() {
  if (prefersReducedMotion) {
    focusZones.forEach((zone) => {
      zone.style.setProperty("--focus", "1");
    });
    focusFrame = 0;
    return;
  }

  const activePanel = [...viewPanels].find((panel) => !panel.hidden);
  const activeZones = activePanel?.querySelectorAll("[data-focus-zone]") || [];
  const viewportHeight = window.innerHeight || 1;
  const viewportCenter = viewportHeight * 0.5;
  let needsAnotherFrame = false;

  activeZones.forEach((zone) => {
    const target = getTargetFocus(zone, viewportHeight, viewportCenter);
    const previous = focusState.get(zone) ?? target;
    const next = previous + (target - previous) * 0.3;
    const settled = Math.abs(target - next) < 0.002;
    const finalValue = settled ? target : next;

    zone.style.setProperty("--focus", finalValue.toFixed(3));
    focusState.set(zone, finalValue);

    if (!settled) {
      needsAnotherFrame = true;
    }
  });

  focusFrame = 0;

  if (needsAnotherFrame) {
    queueFocusUpdate();
  }
}

function queueFocusUpdate() {
  if (focusFrame) {
    return;
  }

  focusFrame = window.requestAnimationFrame(stepFocusZones);
}

revealVisibleNow();
window.addEventListener("load", revealVisibleNow);
window.addEventListener("resize", revealVisibleNow);
window.addEventListener("scroll", queueFocusUpdate, { passive: true });
window.addEventListener("resize", queueFocusUpdate);

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
      const input = document.getElementById(field.id);
      if (!input) {
        continue;
      }
      payload[field.name] = input.type === "checkbox" ? (input.checked ? "true" : "") : input.value.trim();
    }

    const hasEmptyField = fields.some((field) => field.required !== false && !payload[field.name]);

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
