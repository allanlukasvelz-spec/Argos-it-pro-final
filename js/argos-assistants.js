(function () {
  "use strict";

  const exportCfg = window.ARGOS_EXPORT || {};
  const assetsRoot = String(exportCfg.assetsRoot || "").replace(/\/$/, "");
  const siteOrigin = String(exportCfg.origin || "").replace(/\/$/, "");
  const scriptUrl = document.currentScript ? document.currentScript.src : window.location.href;
  const asset = (path) => {
    if (assetsRoot) {
      const cleaned = path.replace(/^\.\.\//, "").replace(/^\.\//, "");
      if (cleaned.startsWith("assets/")) {
        return `${assetsRoot}/${cleaned.slice("assets/".length)}`;
      }
    }
    return new URL(path, scriptUrl).toString();
  };
  const storageKeys = {
    history: "argos_assistant_history",
    selected: "argos_selected_assistant",
    lastService: "argos_last_service",
    context: "argos_user_context"
  };

  const assistantData = {
    chico: {
      name: "Chico",
      title: "Chico — Diagnóstico ARGOS",
      role: "Diagnóstico, seguridad y prevención",
      avatar: asset("../assets/mascots/chico/chico_idle.png"),
      greeting: "Soy Chico. Puedo ayudarte a detectar qué necesita tu negocio, guiarte a un servicio o iniciar un diagnóstico.",
      thinking: "Chico está analizando...",
      quick: [
        ["diagnostico", "Iniciar diagnóstico"],
        ["servicios", "Ver servicios"],
        ["revisar-web", "Revisar mi web"],
        ["seguridad", "Seguridad"],
        ["mantenimiento", "Mantenimiento"]
      ]
    },
    dumbo: {
      name: "Dumbo",
      title: "Dumbo — Ayuda y seguimiento",
      role: "Ayuda rápida, seguimiento y formularios",
      avatar: asset("../assets/mascots/dumbo/dumbo_idle.png"),
      greeting: "Soy Dumbo. Te acompaño paso a paso. Si no sabes dónde está algo, dime qué buscas y te llevo.",
      thinking: "Dumbo está revisando...",
      quick: [
        ["ayuda", "Necesito ayuda"],
        ["contacto", "Ir a contacto"],
        ["formulario", "Ver formulario"],
        ["no-se", "No sé qué elegir"],
        ["hablar", "Hablar con ARGOS-IT"]
      ]
    }
  };

  const state = {
    current: "chico",
    widget: null,
    panel: null,
    messages: null,
    input: null,
    quick: null,
    status: null,
    history: { chico: [], dumbo: [] }
  };

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function loadAssistantMemory() {
    const history = safeJsonParse(localStorage.getItem(storageKeys.history), { chico: [], dumbo: [] });
    state.history = {
      chico: Array.isArray(history.chico) ? history.chico : [],
      dumbo: Array.isArray(history.dumbo) ? history.dumbo : []
    };
    state.current = localStorage.getItem(storageKeys.selected) || state.current;
    return state.history;
  }

  function saveAssistantMemory() {
    localStorage.setItem(storageKeys.history, JSON.stringify(state.history));
    localStorage.setItem(storageKeys.selected, state.current);
    localStorage.setItem(storageKeys.context, JSON.stringify(getPageContext()));
  }

  function clearAssistantMemory() {
    localStorage.removeItem(storageKeys.history);
    localStorage.removeItem(storageKeys.selected);
    localStorage.removeItem(storageKeys.lastService);
    localStorage.removeItem(storageKeys.context);
    state.history = { chico: [], dumbo: [] };
    if (state.messages) state.messages.innerHTML = "";
    renderAssistantMessage("system", "Memoria local borrada. No se ha eliminado ningún dato externo porque este asistente solo usa almacenamiento de este navegador.");
    renderAssistantMessage("assistant", assistantData[state.current].greeting);
  }

  function getPageContext() {
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const pick = (selector) => Array.from(document.querySelectorAll(selector))
      .filter(visible)
      .slice(0, 16)
      .map((el) => ({
        text: (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
        href: el.getAttribute("href") || "",
        id: el.id || "",
        className: typeof el.className === "string" ? el.className : ""
      }));

    return {
      path: window.location.pathname,
      title: document.title,
      headings: pick("h1,h2,h3"),
      sections: Array.from(document.querySelectorAll("section[id]")).map((el) => el.id),
      links: pick("a[href]"),
      buttons: pick("button"),
      forms: Array.from(document.querySelectorAll("form")).map((form, index) => ({
        id: form.id || `form-${index + 1}`,
        action: form.getAttribute("action") || "",
        fields: Array.from(form.querySelectorAll("input,select,textarea")).map((field) => field.name || field.id || field.type).filter(Boolean)
      }))
    };
  }

  function createAssistantWidget() {
    if (state.widget) return;

    const widget = document.createElement("div");
    widget.className = "assistant-widget assistant-floating-widget";
    widget.innerHTML = `
      <section class="assistant-floating-chat assistant-chat-panel" aria-live="polite" aria-label="Chat de asistentes ARGOS-IT">
        <header class="assistant-chat-header assistant-chat-panel__header">
          <img class="assistant-chat-panel__avatar" alt="">
          <div>
            <strong></strong>
            <span></span>
            <em></em>
          </div>
          <button type="button" class="assistant-close assistant-chat-panel__close">Cerrar</button>
        </header>
        <div class="assistant-chat-body assistant-chat-panel__messages"></div>
        <div class="assistant-chat-actions assistant-chat-panel__quick"></div>
        <p class="assistant-chat-privacy assistant-chat-panel__privacy">El asistente solo usa el contexto de esta web para orientarte. No accede a información privada de tu dispositivo.</p>
        <form class="assistant-chat-input assistant-input">
          <input type="text" autocomplete="off" placeholder="Escribe tu pregunta...">
          <button type="submit">Enviar</button>
        </form>
        <button type="button" class="assistant-memory-clear assistant-chat-panel__memory">Borrar memoria</button>
      </section>
    `;
    document.body.appendChild(widget);

    state.widget = widget;
    state.panel = widget.querySelector(".assistant-chat-panel");
    state.messages = widget.querySelector(".assistant-chat-panel__messages");
    state.input = widget.querySelector(".assistant-input input");
    state.quick = widget.querySelector(".assistant-chat-panel__quick");
    state.status = widget.querySelector(".assistant-chat-panel__header em");

    widget.querySelector(".assistant-input").addEventListener("submit", (event) => {
      event.preventDefault();
      sendAssistantMessage();
    });
    widget.querySelector(".assistant-chat-panel__close").addEventListener("click", closeAssistantChat);
    widget.querySelector(".assistant-chat-panel__memory").addEventListener("click", clearAssistantMemory);
  }

  function updateAssistantHeader() {
    const data = assistantData[state.current];
    state.panel.querySelector(".assistant-chat-panel__avatar").src = data.avatar;
    state.panel.querySelector(".assistant-chat-panel__avatar").alt = data.name;
    state.panel.querySelector(".assistant-chat-panel__header strong").textContent = data.title || data.name;
    state.panel.querySelector(".assistant-chat-panel__header span").textContent = data.role;
    state.status.textContent = "";
    state.quick.innerHTML = "";
    data.quick.forEach(([action, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "assistant-action";
      button.textContent = label;
      button.dataset.action = action;
      button.addEventListener("click", () => handleQuickAction(action));
      state.quick.appendChild(button);
    });
  }

  function openAssistantChat(assistant) {
    const next = assistantData[assistant] ? assistant : "chico";
    createAssistantWidget();
    loadAssistantMemory();
    state.current = next;
    updateAssistantHeader();
    state.messages.innerHTML = "";

    const currentHistory = state.history[state.current] || [];
    if (currentHistory.length) {
      currentHistory.forEach((message) => appendMessageNode(message.role, message.text, false));
    } else {
      renderAssistantMessage("assistant", assistantData[state.current].greeting);
    }

    state.panel.classList.remove("chico-chat", "dumbo-chat");
    state.panel.classList.add("is-open", "open", `${state.current}-chat`);
    document.body.classList.add("argos-assistant-chat-open");
    document.querySelectorAll("[data-assistant-bot]").forEach((bot) => {
      bot.classList.toggle("is-active", bot.dataset.assistantBot === state.current);
    });
    positionAssistantPanel();
    saveAssistantMemory();
    setTimeout(() => state.input && state.input.focus(), 80);
  }

  function closeAssistantChat() {
    if (state.panel) state.panel.classList.remove("is-open", "open", "is-guiding");
    document.body.classList.remove("argos-assistant-chat-open");
    document.querySelectorAll("[data-assistant-bot]").forEach((bot) => bot.classList.remove("is-active"));
  }

  function positionAssistantPanel() {
    if (!state.panel || window.matchMedia("(max-width: 760px)").matches) return;
    const dog = document.querySelector(`[data-assistant-bot="${state.current}"]`);
    if (!dog) return;

    const rect = dog.getBoundingClientRect();
    const panelWidth = state.panel.offsetWidth || 390;
    const panelHeight = state.panel.offsetHeight || 520;
    const margin = 14;
    let left = state.current === "chico" ? rect.right + margin : rect.left - panelWidth - margin;
    let top = rect.top + Math.max(0, rect.height - panelHeight) / 2;

    if (left < margin) left = rect.left;
    if (left + panelWidth > window.innerWidth - margin) left = window.innerWidth - panelWidth - margin;
    if (top + panelHeight > window.innerHeight - margin) top = window.innerHeight - panelHeight - margin;
    if (top < margin) top = margin;

    state.panel.style.left = `${Math.max(margin, left)}px`;
    state.panel.style.top = `${Math.max(margin, top)}px`;
    state.panel.style.right = "auto";
    state.panel.style.bottom = "auto";
  }

  function appendMessageNode(role, text, persist) {
    const node = document.createElement("div");
    node.className = `assistant-message assistant-message--${role}`;
    node.textContent = text;
    state.messages.appendChild(node);
    state.messages.scrollTop = state.messages.scrollHeight;
    if (persist) {
      state.history[state.current].push({ role, text, at: new Date().toISOString() });
      state.history[state.current] = state.history[state.current].slice(-40);
      saveAssistantMemory();
    }
  }

  function renderAssistantMessage(role, text) {
    createAssistantWidget();
    appendMessageNode(role, text, true);
  }

  function renderAssistantAction(text, label, action) {
    renderAssistantMessage("assistant", text);
    const node = document.createElement("div");
    node.className = "assistant-message assistant-message--assistant assistant-message--action";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => handleQuickAction(action));
    node.appendChild(button);
    state.messages.appendChild(node);
    state.messages.scrollTop = state.messages.scrollHeight;
  }

  function sendAssistantMessage() {
    const text = state.input.value.trim();
    if (!text) return;
    state.input.value = "";
    renderAssistantMessage("user", text);
    state.status.textContent = assistantData[state.current].thinking;
    setTimeout(() => {
      respondTo(text);
      state.status.textContent = "";
    }, 420);
  }

  function findFormSelector() {
    if (document.querySelector("#formulario")) return "#formulario";
    if (document.querySelector("#contact-form")) return "#contact-form";
    if (document.querySelector("#contacto form")) return "#contacto form";
    if (document.querySelector("form")) return "form";
    return "#contacto";
  }

  function guideTo(selector, message) {
    createAssistantWidget();
    const target = document.querySelector(selector);
    if (!target) {
      renderAssistantMessage("assistant", "No encuentro esa sección en esta página. Te llevo a contacto para que ARGOS-IT pueda orientarte.");
      handleQuickAction("contacto");
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("highlight-target");
    state.panel.classList.add("is-guiding");
    moveAssistantToTarget(selector);
    setTimeout(() => {
      target.classList.remove("highlight-target");
      if (state.panel) state.panel.classList.remove("is-guiding");
    }, 3600);
    renderAssistantMessage("assistant", message);
  }

  function moveAssistantToTarget(selector) {
    if (!state.panel) return;
    const target = document.querySelector(selector);
    if (!target) return;
    positionAssistantPanel();
  }

  function serviceLink(slug) {
    const paths = exportCfg.paths || {};
    const servBase = paths.servicios || "/servicios";
    if (siteOrigin) {
      const base = `${siteOrigin}${servBase.startsWith("/") ? servBase : `/${servBase}`}`.replace(/\/$/, "");
      return `${base}/${slug}/`;
    }
    const inSubdir = window.location.pathname.includes("/servicios/") || window.location.pathname.includes("/metodo/") || window.location.pathname.includes("/portal/") || window.location.pathname.includes("/planes/");
    return `${inSubdir ? "../" : "./"}servicios/${slug}.html`;
  }

  function metodoIndexUrl() {
    const paths = exportCfg.paths || {};
    const m = paths.metodo || "/metodo";
    if (siteOrigin) {
      const base = `${siteOrigin}${m.startsWith("/") ? m : `/${m}`}`.replace(/\/$/, "");
      return `${base}/`;
    }
    return window.location.pathname.includes("/metodo/") ? "./index.html" : "./metodo/index.html";
  }

  function recommendService(userMessage) {
    const text = userMessage.toLowerCase();
    if (text.match(/mantenimiento|soporte|equipo|ordenador|incidencia|preventivo/)) {
      localStorage.setItem(storageKeys.lastService, "mantenimiento-informatico");
      return {
        label: "Mantenimiento informático",
        href: serviceLink("mantenimiento-informatico"),
        message: "Para mantenimiento preventivo te recomiendo la página de Mantenimiento Informático. Está enfocada en revisión continua, soporte y prevención de paradas."
      };
    }
    if (text.match(/seguridad|ciber|acceso|backup|copia|riesgo|protecci/)) {
      localStorage.setItem(storageKeys.lastService, "seguridad-informatica");
      return {
        label: "Seguridad informática",
        href: serviceLink("seguridad-informatica"),
        message: "Por lo que comentas, encaja Seguridad Informática: accesos, copias, reducción de riesgos y protección preventiva."
      };
    }
    if (text.match(/web|wordpress|seo|formulario|velocidad|host/)) {
      localStorage.setItem(storageKeys.lastService, "web-wordpress");
      return {
        label: "Web y WordPress",
        href: serviceLink("web-wordpress"),
        message: "Te recomiendo revisar Web, WordPress y presencia digital: estabilidad, formularios, rendimiento y mejoras de conversión."
      };
    }
    if (text.match(/automat|ia|proceso|repetitiv|inteligencia/)) {
      localStorage.setItem(storageKeys.lastService, "automatizacion-ia");
      return {
        label: "Automatización con IA",
        href: serviceLink("automatizacion-ia"),
        message: "Esto encaja con Automatización con IA: procesos repetitivos, formularios inteligentes y eficiencia operativa."
      };
    }
    localStorage.setItem(storageKeys.lastService, "consultoria-it");
    return {
      label: "Consultoría IT",
      href: serviceLink("consultoria-it"),
      message: "Como punto de partida te recomiendo Consultoría IT premium para ordenar prioridades y decidir con criterio."
    };
  }

  function respondTo(message) {
    const text = message.toLowerCase();
    const context = getPageContext();
    saveAssistantMemory();

    if (text.match(/d[oó]nde.*formulario|ver formulario|formulario|solicitar/)) {
      guideTo(findFormSelector(), "Aquí puedes rellenar el formulario para solicitar el servicio. Completa solo la información necesaria y ARGOS-IT revisará la solicitud antes de actuar.");
      return;
    }

    if (text.match(/mantenimiento|seguridad|wordpress|web|automat|auditor|consultor|soporte/)) {
      const recommendation = recommendService(text);
      renderAssistantAction(`${recommendation.message} Estás en: ${context.title}.`, `Abrir ${recommendation.label}`, recommendation.href);
      return;
    }

    if (text.match(/no s[eé]|no se|elegir|orienta|ayuda/)) {
      if (state.current === "dumbo") {
        renderAssistantMessage("assistant", "Vamos paso a paso: dime si tu prioridad es web, seguridad, soporte/mantenimiento, automatización con IA o simplemente ordenar tu situación actual. Si no lo tienes claro, puedo llevarte al formulario y marcar “No lo sé todavía”.");
      } else {
        renderAssistantMessage("assistant", "Si no sabes qué elegir, empezaría por un diagnóstico ARGOS: analizamos el estado real, detectamos riesgos y proponemos una ruta preventiva antes de que algo falle.");
      }
      return;
    }

    if (text.match(/contacto|hablar|llamar|email|correo/)) {
      guideTo(document.querySelector("#contacto") ? "#contacto" : findFormSelector(), "Aquí tienes el punto de contacto para hablar con ARGOS-IT.");
      return;
    }

    if (text.match(/m[eé]todo|argos|analizar|reforzar|gestionar|optimizar|sostener/)) {
      renderAssistantAction("El método ARGOS se divide en Analizar, Reforzar, Gestionar, Optimizar y Sostener. Cada inicial tiene su propia página con formulario.", "Ver método ARGOS", metodoIndexUrl());
      return;
    }

    const intro = state.current === "chico"
      ? "Puedo orientarte desde diagnóstico, seguridad, mantenimiento preventivo, auditoría o servicios."
      : "Puedo ayudarte a encontrar secciones, formularios, contacto o aclarar qué paso dar ahora.";
    renderAssistantMessage("assistant", `${intro} Estoy viendo la página “${context.title}”. Pregúntame, por ejemplo: “¿dónde está el formulario?” o “quiero mantenimiento”.`);
  }

  function handleQuickAction(action) {
    const formSelector = findFormSelector();
    const actionMap = {
      diagnostico: () => guideTo(formSelector, "Empezamos con diagnóstico ARGOS. Rellena el formulario y explica el contexto principal."),
      servicios: () => window.location.assign(document.querySelector("#servicios") ? "#servicios" : serviceLink("consultoria-it")),
      "revisar-web": () => window.location.assign(serviceLink("web-wordpress")),
      seguridad: () => window.location.assign(serviceLink("seguridad-informatica")),
      mantenimiento: () => window.location.assign(serviceLink("mantenimiento-informatico")),
      ayuda: () => renderAssistantMessage("assistant", "Dime qué buscas: formulario, contacto, servicios, método ARGOS, mantenimiento, seguridad o web. Te llevo paso a paso."),
      contacto: () => guideTo(document.querySelector("#contacto") ? "#contacto" : formSelector, "Aquí puedes contactar con ARGOS-IT."),
      formulario: () => guideTo(formSelector, "Este es el formulario disponible en esta página."),
      "no-se": () => renderAssistantMessage("assistant", "Te hago tres preguntas: ¿te preocupa más seguridad, estabilidad diaria o captación web? ¿Tienes una web o sistemas ya funcionando? ¿Buscas prevención continua o una revisión inicial?"),
      hablar: () => guideTo(document.querySelector("#contacto") ? "#contacto" : formSelector, "Este es el mejor punto para hablar con ARGOS-IT.")
    };

    if (actionMap[action]) {
      actionMap[action]();
      return;
    }

    if (typeof action === "string" && action.endsWith(".html")) {
      window.location.assign(action);
    }
  }

  function setupHamburgerMenu() {
    let overlay = document.querySelector(".menu-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "menu-overlay";
      overlay.setAttribute("hidden", "");
      document.body.appendChild(overlay);
    }

    const closeMenus = () => {
      document.querySelectorAll(".mobile-menu.open").forEach((menu) => menu.classList.remove("open"));
      document.querySelectorAll(".hamburger-button.open").forEach((button) => {
        button.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
      });
      overlay.classList.remove("open");
      overlay.setAttribute("hidden", "");
    };

    document.querySelectorAll(".nav").forEach((nav, index) => {
      if (nav.querySelector(".hamburger-button")) return;
      const links = nav.querySelector(".links");
      const cta = nav.querySelector(".btn.primary");
      const button = document.createElement("button");
      const menu = document.createElement("nav");
      const menuId = `argos-mobile-menu-${index}`;

      button.type = "button";
      button.className = "hamburger-button";
      button.setAttribute("aria-label", "Abrir menú");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", menuId);
      button.innerHTML = "<span></span><span></span><span></span>";

      menu.id = menuId;
      menu.className = "mobile-menu";
      menu.setAttribute("aria-label", "Menú ARGOS-IT");

      if (links) {
        links.querySelectorAll("a").forEach((link) => {
          const clone = link.cloneNode(true);
          clone.classList.add("menu-link");
          menu.appendChild(clone);
        });
      }
      if (cta) {
        const clone = cta.cloneNode(true);
        clone.classList.add("menu-link", "menu-link-cta");
        menu.appendChild(clone);
      }

      nav.appendChild(button);
      nav.appendChild(menu);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const nextOpen = !menu.classList.contains("open");
        closeMenus();
        menu.classList.toggle("open", nextOpen);
        button.classList.toggle("open", nextOpen);
        button.setAttribute("aria-expanded", String(nextOpen));
        overlay.toggleAttribute("hidden", !nextOpen);
        overlay.classList.toggle("open", nextOpen);
      });
      menu.addEventListener("click", (event) => {
        if (event.target.closest(".menu-link")) closeMenus();
      });
    });

    overlay.addEventListener("click", closeMenus);
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".nav")) closeMenus();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenus();
    });
  }

  function ensureAssistantDogs() {
    Object.keys(assistantData).forEach((assistant) => {
      let bot = document.querySelector(`[data-assistant-bot="${assistant}"]`);
      if (!bot) {
        const dock = document.createElement("aside");
        dock.className = assistant === "chico" ? "assistant-dock assistant-dock-auto" : "assistant-dock assistant-dock-right assistant-dock-auto";
        dock.setAttribute("aria-label", `Asistente ${assistantData[assistant].name}`);
        dock.innerHTML = `
          <div class="assistant-bot assistant-dog ${assistant} ${assistant === "chico" ? "chico-avatar" : "assistant-bot-dumbo dumbo-avatar"}" data-assistant-bot="${assistant}">
            <button type="button" class="assistant-avatar hologram-avatar" aria-label="Abrir chat con ${assistantData[assistant].name}">
              <span class="hologram-core">
                <img src="${assistantData[assistant].avatar}" data-assistant-sprite alt="${assistantData[assistant].name}, asistente ARGOS-IT" class="assistant-sprite ${assistant} ${assistant}--idle">
              </span>
              <span class="hologram-base"></span>
              <strong>${assistantData[assistant].name}</strong>
            </button>
            <div class="assistant-bubble"><p>${assistantData[assistant].greeting}</p><div class="assistant-actions"><button type="button" data-assistant-chat="${assistant}">${assistant === "chico" ? "Diagnóstico" : "Ayuda"}</button></div></div>
          </div>
        `;
        document.body.appendChild(dock);
        bot = dock.querySelector(`[data-assistant-bot="${assistant}"]`);
      }
      bot.classList.add("assistant-dog", assistant);
      const dock = bot.closest(".assistant-dock");
      if (dock) dock.classList.add("assistant-dock-ready");
    });
  }

  function bindAssistantTriggers() {
    document.addEventListener("click", (event) => {
      const chatTrigger = event.target.closest("[data-assistant-chat]");
      const avatarTrigger = event.target.closest(".assistant-avatar");
      const assistantLink = event.target.closest('a[href*="asistente-chico"], a[href*="asistente-dumbo"]');
      if (!chatTrigger && !avatarTrigger && !assistantLink) return;

      const bot = avatarTrigger ? avatarTrigger.closest("[data-assistant-bot]") : null;
      const assistant = chatTrigger ? chatTrigger.dataset.assistantChat : assistantLink ? (assistantLink.getAttribute("href").includes("dumbo") ? "dumbo" : "chico") : bot && bot.dataset.assistantBot;
      if (!assistantData[assistant]) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      openAssistantChat(assistant);
    }, true);
  }

  function openFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const assistant = params.get("asistente");
    if (assistantData[assistant]) openAssistantChat(assistant);
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadAssistantMemory();
    setupHamburgerMenu();
    ensureAssistantDogs();
    bindAssistantTriggers();
    openFromQuery();
    window.addEventListener("resize", positionAssistantPanel);
  });

  window.openAssistantChat = openAssistantChat;
  window.closeAssistantChat = closeAssistantChat;
  window.sendAssistantMessage = sendAssistantMessage;
  window.renderAssistantMessage = renderAssistantMessage;
  window.getPageContext = getPageContext;
  window.guideTo = guideTo;
  window.saveAssistantMemory = saveAssistantMemory;
  window.loadAssistantMemory = loadAssistantMemory;
  window.clearAssistantMemory = clearAssistantMemory;
  window.handleQuickAction = handleQuickAction;
  window.recommendService = recommendService;
  window.moveAssistantToTarget = moveAssistantToTarget;
  window.ArgosAssistants = Object.assign(window.ArgosAssistants || {}, {
    openAssistantChat,
    closeAssistantChat,
    sendAssistantMessage,
    renderAssistantMessage,
    getPageContext,
    guideTo,
    saveAssistantMemory,
    loadAssistantMemory,
    clearAssistantMemory,
    handleQuickAction,
    recommendService,
    moveAssistantToTarget
  });
})();
