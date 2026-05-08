(function () {
  document.documentElement.classList.add("js-ready");
  document.documentElement.setAttribute("translate", "yes");

  const sourceLang = "es";
  const priorityLangs = ["es", "en", "ca"];
  const langLabels = {
    es: "ES",
    en: "EN",
    ca: "CA",
    auto: "Auto"
  };
  const storageKey = "argosPreferredLanguage";

  function getDeviceLanguage() {
    const languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || sourceLang];
    const detected = (languages[0] || sourceLang).toLowerCase().split("-")[0];
    return detected || sourceLang;
  }

  function getInitialLanguage() {
    const saved = localStorage.getItem(storageKey);
    if (saved) return saved === "auto" ? getDeviceLanguage() : saved;
    const deviceLanguage = getDeviceLanguage();
    return priorityLangs.includes(deviceLanguage) ? deviceLanguage : deviceLanguage;
  }

  function setCookie(name, value, days) {
    const maxAge = days ? `; max-age=${days * 24 * 60 * 60}` : "";
    document.cookie = `${name}=${value}; path=/${maxAge}`;
    const hostParts = location.hostname.split(".");
    if (hostParts.length > 1) {
      const domain = hostParts.slice(-2).join(".");
      document.cookie = `${name}=${value}; path=/; domain=.${domain}${maxAge}`;
    }
  }

  function clearGoogleTranslateCookie() {
    setCookie("googtrans", "", -1);
    document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }

  function prepareGoogleTranslate(lang) {
    setCookie("googtrans", `/${sourceLang}/${lang}`, 1);
    if (!document.getElementById("google_translate_element")) {
      const holder = document.createElement("div");
      holder.id = "google_translate_element";
      holder.className = "google-translate-holder notranslate";
      holder.setAttribute("aria-hidden", "true");
      document.body.appendChild(holder);
    }
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = function () {
        new window.google.translate.TranslateElement({
          pageLanguage: sourceLang,
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, "google_translate_element");
      };
    }
    if (!document.querySelector("script[data-argos-translate]")) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.argosTranslate = "true";
      document.head.appendChild(script);
    }
  }

  function triggerGoogleTranslate(lang) {
    prepareGoogleTranslate(lang);
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = lang;
      combo.dispatchEvent(new Event("change"));
    }
  }

  function updateActiveButton(selected) {
    document.querySelectorAll("[data-argos-lang]").forEach((button) => {
      const value = button.getAttribute("data-argos-lang");
      const isActive = value === selected;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function applyLanguage(lang, persistValue, userInitiated) {
    const normalized = (lang || sourceLang).toLowerCase().split("-")[0];
    const selected = persistValue || normalized;
    localStorage.setItem(storageKey, selected);
    document.documentElement.lang = normalized;
    document.documentElement.dataset.language = normalized;
    updateActiveButton(priorityLangs.includes(normalized) ? normalized : selected);

    if (normalized === sourceLang) {
      clearGoogleTranslateCookie();
      if (userInitiated) window.location.reload();
      return;
    }

    triggerGoogleTranslate(normalized);
    if (userInitiated && !document.querySelector(".goog-te-combo")) {
      window.setTimeout(() => window.location.reload(), 250);
    }
  }

  function buildLanguageSwitcher() {
    if (document.querySelector(".language-tools")) return;
    const nav = document.querySelector(".nav");
    if (!nav) return;

    const tools = document.createElement("div");
    tools.className = "language-tools notranslate";
    tools.setAttribute("aria-label", "Selector de idioma ARGOS-IT");
    tools.innerHTML = `
      <button type="button" data-argos-lang="es" aria-pressed="false">ES</button>
      <button type="button" data-argos-lang="en" aria-pressed="false">EN</button>
      <button type="button" data-argos-lang="ca" aria-pressed="false">CA</button>
      <button type="button" data-argos-lang="auto" aria-pressed="false">Auto</button>
    `;

    const cta = nav.querySelector(".btn.primary");
    nav.insertBefore(tools, cta || null);

    tools.addEventListener("click", function (event) {
      const button = event.target.closest("[data-argos-lang]");
      if (!button) return;
      const requested = button.getAttribute("data-argos-lang");
      if (requested === "auto") {
        applyLanguage(getDeviceLanguage(), "auto", true);
        return;
      }
      applyLanguage(requested, requested, true);
    });
  }

  buildLanguageSwitcher();
  const saved = localStorage.getItem(storageKey);
  const initial = saved === "auto" ? getDeviceLanguage() : getInitialLanguage();
  updateActiveButton(saved || (priorityLangs.includes(initial) ? initial : "auto"));
  if (initial !== sourceLang) {
    prepareGoogleTranslate(initial);
    document.documentElement.lang = initial;
    document.documentElement.dataset.language = initial;
  }

  function keyHologramImages() {
    document.querySelectorAll("img[data-chroma-key]").forEach((image) => {
      const process = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = image.naturalWidth;
          const height = image.naturalHeight;
          if (!width || !height) return;
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context.drawImage(image, 0, 0);
          const frame = context.getImageData(0, 0, width, height);
          const data = frame.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const magentaDistance = Math.abs(r - 255) + Math.abs(g - 0) + Math.abs(b - 255);
            const isKey = r > 190 && b > 190 && g < 95 && magentaDistance < 175;
            if (isKey) {
              data[i + 3] = 0;
            } else if (r > 150 && b > 150 && g < 130) {
              data[i + 3] = Math.max(0, data[i + 3] - 90);
              data[i] = Math.min(255, r + 10);
              data[i + 1] = Math.min(255, g + 40);
            }
          }
          context.putImageData(frame, 0, 0);
          image.src = canvas.toDataURL("image/png");
          image.classList.add("is-keyed");
          image.removeAttribute("data-chroma-key");
        } catch (error) {
          image.classList.add("is-keyed");
        }
      };

      if (image.complete) process();
      else image.addEventListener("load", process, { once: true });
    });
  }

  function activateAssistants() {
    const messages = {
      chico: [
        "Hola, soy Chico. Estoy pendiente de que todo esté protegido.",
        "Si algo te preocupa, lo revisamos con calma.",
        "Puedo ayudarte a ordenar riesgos sin complicarlo."
      ],
      dumbo: [
        "Hola, soy Dumbo. Te acompaño paso a paso.",
        "Si no sabes por dónde empezar, yo te guío.",
        "Cuéntame qué necesitas y buscamos el camino simple."
      ]
    };
    const stateClasses = {
      chico: ["idle", "walk", "sit", "lie", "jump", "turn", "alert", "sleep"].map((state) => `chico--${state}`),
      dumbo: ["idle", "walk", "sit", "lie", "jump", "turn", "guide", "look", "sleep"].map((state) => `dumbo--${state}`)
    };
    const stateTexts = {
      idle: {
        chico: "Hola, soy Chico. Estoy pendiente de que todo esté protegido.",
        dumbo: "Hola, soy Dumbo. Te acompaño paso a paso."
      },
      rest: {
        chico: "Estoy descansando, pero sigo vigilando.",
        dumbo: "Descanso cerca de ti para guiarte cuando quieras."
      },
      near: {
        chico: "Estoy vigilando que todo esté protegido.",
        dumbo: "Te acompaño paso a paso."
      },
      formStart: {
        chico: "Estoy vigilando que todo esté protegido.",
        dumbo: "Te acompaño paso a paso."
      },
      formError: {
        chico: "Hay un detalle pendiente. Lo corregimos con calma.",
        dumbo: "Te marco el campo que falta."
      },
      formSuccess: {
        chico: "Listo. Solicitud preparada.",
        dumbo: "Perfecto. Buen paso."
      },
      cartOpen: {
        chico: "Estoy vigilando que todo esté protegido.",
        dumbo: "Te acompaño paso a paso."
      },
      checkoutStart: {
        chico: "Estoy vigilando que todo esté protegido.",
        dumbo: "Te acompaño paso a paso."
      }
    };
    const assistantUrls = {
      chico: "./asistente-chico.html?asistente=chico",
      dumbo: "./asistente-dumbo.html?asistente=dumbo"
    };
    const voiceLines = {
      chico: "Hola, soy Chico. Estoy aquí para ayudarte a proteger lo importante y priorizar con calma.",
      dumbo: "Hola, soy Dumbo. Estoy aquí para acompañarte y ayudarte a encontrar el formulario correcto."
    };
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    function speakLine(text, name) {
      if (!("speechSynthesis" in window)) return false;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 1;
      utterance.pitch = name === "chico" ? .9 : 1.08;
      window.speechSynthesis.speak(utterance);
      return true;
    }

    const bots = {};
    const setAssistantState = (name, rawState, text, options = {}) => {
      const assistant = bots[name];
      if (!assistant) return;

      const state = rawState === "rest" ? "sleep" : rawState;
      let stateForFile = state;
      if (state === "walk") stateForFile = assistant.nextWalkFrame();
      else if (state === "lie") stateForFile = "lay";
      const spritePath = `./assets/mascots/${name}/${name}_${stateForFile}.png`;

      window.clearTimeout(assistant.returnTimer);
      assistant.state = state;
      assistant.bot.classList.remove(...stateClasses[name]);
      assistant.sprite.classList.remove(...stateClasses[name]);
      assistant.bot.classList.add(`${name}--${state}`);
      assistant.sprite.classList.add(`${name}--${state}`);
      assistant.sprite.setAttribute("src", spritePath);

      if (text && assistant.bubbleText) {
        assistant.bubble.classList.add("is-typing");
        window.setTimeout(() => {
          assistant.bubbleText.textContent = text;
          assistant.bubble.classList.remove("is-typing");
        }, options.instant ? 0 : 180);
      }

      if (options.active) assistant.bot.classList.add("is-active");
      if (options.returnToIdle === false || state === "idle" || state === "lie" || state === "sit" || state === "sleep") return;

      assistant.returnTimer = window.setTimeout(() => {
        setAssistantState(name, "idle", stateTexts.idle[name], { returnToIdle: false });
      }, options.duration || 2800);
    };

    document.querySelectorAll("[data-assistant-bot]").forEach((bot) => {
      const name = bot.getAttribute("data-assistant-bot");
      const avatar = bot.querySelector(".assistant-avatar");
      const bubble = bot.querySelector(".assistant-bubble");
      const bubbleText = bubble.querySelector("p");
      const sprite = bot.querySelector("[data-assistant-sprite]");
      let index = 0;
      let walkFrame = 0;

      bot.classList.add("is-greeting");
      window.setTimeout(() => bot.classList.remove("is-greeting"), 5200);
      bubble.setAttribute("aria-live", "polite");
      bots[name] = {
        bot,
        avatar,
        bubble,
        bubbleText,
        sprite,
        state: "idle",
        returnTimer: 0,
        nextWalkFrame() {
          walkFrame = walkFrame === 1 ? 2 : 1;
          return `walk-0${walkFrame}`;
        }
      };

      function speak(nextIndex) {
        bubble.classList.add("is-typing");
        window.setTimeout(() => {
          index = nextIndex;
          bubbleText.textContent = messages[name][index];
          bubble.classList.remove("is-typing");
        }, 420);
      }

      avatar.addEventListener("click", () => {
        bot.classList.toggle("is-active");
        bot.classList.remove("is-greeting");
        setAssistantState(name, name === "chico" ? "alert" : "guide", name === "chico" ? stateTexts.near.chico : stateTexts.near.dumbo, { active: true });
        speak((index + 1) % messages[name].length);
      });

      window.setInterval(() => {
        if (bot.matches(":hover") || bot.classList.contains("is-active")) return;
        speak((index + 1) % messages[name].length);
      }, name === "chico" ? 6800 : 7600);
    });

    let inactivityTimer = 0;
    let lastWake = 0;
    const proximity = { chico: 0, dumbo: 0 };

    const onIdle = () => {
      setAssistantState("chico", "sleep", stateTexts.rest.chico, { returnToIdle: false });
      setAssistantState("dumbo", "sleep", stateTexts.rest.dumbo, { returnToIdle: false });
    };

    const queueInactivity = () => {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(onIdle, 25000);
    };

    const wakeAssistants = () => {
      const now = Date.now();
      if (now - lastWake < 650) return;
      lastWake = now;
      ["chico", "dumbo"].forEach((name) => {
        const assistant = bots[name];
        if (!assistant) return;
        if (assistant.state === "lie" || assistant.state === "sit" || assistant.state === "sleep") {
          setAssistantState(name, "idle", stateTexts.idle[name], { returnToIdle: false, instant: true });
        }
      });
    };

    const handleActivity = () => {
      wakeAssistants();
      queueInactivity();
    };

    const handleProximity = (event) => {
      handleActivity();
      Object.keys(bots).forEach((name) => {
        const assistant = bots[name];
        const rect = assistant.bot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
        const now = Date.now();
        if (distance > 190 || now - proximity[name] < 1600) return;
        proximity[name] = now;
        setAssistantState(
          name,
          name === "chico" ? "alert" : "look",
          name === "chico" ? stateTexts.near.chico : stateTexts.near.dumbo,
          { duration: 2600 }
        );
      });
    };

    document.addEventListener("mousemove", handleProximity);
    ["keydown", "touchstart", "scroll"].forEach((eventName) => {
      document.addEventListener(eventName, handleActivity, { passive: true });
    });
    queueInactivity();

    document.querySelectorAll("[data-assistant-chat]").forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.getAttribute("data-assistant-chat");
        setAssistantState(name, name === "chico" ? "alert" : "guide", name === "chico" ? "Abro el chat y mantengo el contexto." : "Vamos al chat con calma.", { duration: 2400 });
        window.open(assistantUrls[name], "_blank", "noopener");
      });
    });

    document.querySelectorAll("[data-assistant-voice]").forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.getAttribute("data-assistant-voice");
        const bot = document.querySelector(`[data-assistant-bot="${name}"]`);
        const bubbleText = bot && bot.querySelector(".assistant-bubble p");
        const readyText = name === "chico" ? "Te escucho. Vamos poco a poco." : "Te escucho. Lo ordenamos juntos.";

        setAssistantState(name, name === "chico" ? "alert" : "guide", readyText, { active: true, duration: 3200 });
        if (bubbleText) bubbleText.textContent = readyText;
        speakLine(voiceLines[name], name);

        if (!SpeechRecognition) {
          if (bubbleText) bubbleText.textContent = "Tu navegador no permite dictado aquí. Abrimos el chat.";
          window.open(assistantUrls[name], "_blank", "noopener");
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        button.disabled = true;
        button.textContent = "Escuchando";

        recognition.onresult = (event) => {
          const transcript = event.results && event.results[0] && event.results[0][0] ? event.results[0][0].transcript.trim() : "";
          if (!transcript) return;
          if (bubbleText) bubbleText.textContent = `He entendido: "${transcript}".`;
          speakLine(name === "chico" ? "Perfecto. Preparo una revisión inicial contigo." : "Perfecto. Te llevo al siguiente paso.", name);
          const url = `${assistantUrls[name]}&modo=voz&mensaje=${encodeURIComponent(transcript)}`;
          window.setTimeout(() => window.open(url, "_blank", "noopener"), 700);
        };

        recognition.onerror = () => {
          if (bubbleText) bubbleText.textContent = "No he podido escucharte. Abrimos el chat.";
          window.open(assistantUrls[name], "_blank", "noopener");
        };

        recognition.onend = () => {
          button.disabled = false;
          button.textContent = "Voz";
        };

        recognition.start();
      });
    });

    const onFormStart = () => {
      setAssistantState("chico", "alert", stateTexts.formStart.chico, { active: true, duration: 3200 });
      setAssistantState("dumbo", "guide", stateTexts.formStart.dumbo, { active: true, duration: 3200 });
    };

    const onFormError = (target) => {
      if (target && target.classList) {
        target.classList.add("field-needs-attention");
        window.setTimeout(() => target.classList.remove("field-needs-attention"), 2600);
      }
      setAssistantState("chico", "alert", stateTexts.formError.chico, { active: true, duration: 3600 });
      setAssistantState("dumbo", "guide", stateTexts.formError.dumbo, { active: true, duration: 3600 });
    };

    const onFormSuccess = () => {
      setAssistantState("chico", "jump", stateTexts.formSuccess.chico, { active: true, duration: 2200 });
      setAssistantState("dumbo", "jump", stateTexts.formSuccess.dumbo, { active: true, duration: 2200 });
    };

    const onCartOpen = () => {
      setAssistantState("chico", "alert", stateTexts.cartOpen.chico, { active: true, duration: 3200 });
      setAssistantState("dumbo", "guide", stateTexts.cartOpen.dumbo, { active: true, duration: 3200 });
    };

    const onCheckoutStart = () => {
      setAssistantState("chico", "alert", stateTexts.checkoutStart.chico, { active: true, duration: 3200 });
      setAssistantState("dumbo", "guide", stateTexts.checkoutStart.dumbo, { active: true, duration: 3200 });
    };

    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("focusin", onFormStart);
      form.addEventListener("invalid", (event) => onFormError(event.target), true);
      form.addEventListener("submit", () => {
        if (typeof form.checkValidity === "function" && !form.checkValidity()) {
          onFormError(form.querySelector(":invalid"));
          return;
        }
        onFormSuccess();
      });
    });

    window.addEventListener("argos:onIdle", onIdle);
    window.addEventListener("argos:onFormStart", onFormStart);
    window.addEventListener("argos:onFormError", (event) => onFormError(event.detail && event.detail.target));
    window.addEventListener("argos:onFormSuccess", onFormSuccess);
    window.addEventListener("argos:onCartOpen", onCartOpen);
    window.addEventListener("argos:onCheckoutStart", onCheckoutStart);

    window.ArgosAssistants = Object.assign(window.ArgosAssistants || {}, {
      setState: setAssistantState,
      onIdle,
      onFormStart,
      onFormError,
      onFormSuccess,
      onCartOpen,
      onCheckoutStart
    });
  }

  keyHologramImages();
})();
