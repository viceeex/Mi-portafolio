/* =========================================================
   Vicente González — Portfolio interactions
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header + mobile navigation ---------- */

  const menuToggle = $(".menu-toggle");
  const mobileMenu = $("#mobile-menu");
  const header = $(".site-header");
  const scrollProgress = $("[data-scroll-progress]");

  const setMenuState = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.inert = !open;
  };

  if (menuToggle && mobileMenu) {
    mobileMenu.inert = true;
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMenuState(!isOpen);
    });

    $$("a", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("click", (event) => {
      if (!header || menuToggle.getAttribute("aria-expanded") !== "true") return;
      if (!header.contains(event.target)) setMenuState(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) setMenuState(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenuState(false);
        menuToggle.focus();
      }
    });
  }

  const updateScrollProgress = () => {
    if (!scrollProgress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    scrollProgress.style.transform = `scaleX(${progress})`;
  };

  let scrollTicking = false;
  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateScrollProgress();
      scrollTicking = false;
    });
  }, { passive: true });
  updateScrollProgress();

  /* ---------- active navigation ---------- */

  const navLinks = $$("[data-nav]");
  const navSections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id ? { link, section: $(id) } : null;
    })
    .filter((item) => item && item.section);

  if ("IntersectionObserver" in window && navSections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", isCurrent);
          if (isCurrent) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-34% 0px -56% 0px", threshold: 0 });

    navSections.forEach(({ section }) => navObserver.observe(section));
  }

  /* ---------- reveal on scroll ---------- */

  const revealEls = $$("[data-reveal]");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- count-up metrics ---------- */

  const counters = $$("[data-count]");
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target) || target < 0) return;
    if (prefersReducedMotion) {
      el.textContent = String(target).padStart(2, "0");
      return;
    }
    const duration = 900;
    const start = performance.now();
    const draw = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(easeOutCubic(t) * target)).padStart(2, "0");
      if (t < 1) window.requestAnimationFrame(draw);
    };
    window.requestAnimationFrame(draw);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.65 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- local time ---------- */

  const timeNodes = $$("[data-local-time]");
  const updateLocalTime = () => {
    if (!timeNodes.length) return;
    let formatted = "--:--";
    try {
      formatted = new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    } catch (error) {
      formatted = new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    }
    timeNodes.forEach((node) => {
      node.textContent = `${formatted} CL`;
    });
  };
  updateLocalTime();
  window.setInterval(updateLocalTime, 30000);

  /* ---------- activity chart ---------- */

  const commitChart = $("#commit-chart");
  const totalContributions = $("[data-total-contributions]");
  const activeDays = $("[data-active-days]");
  const longestStreak = $("[data-longest-streak]");
  const weekAverage = $("[data-week-average]");
  const bestWeek = $("[data-best-week]");
  const dailyAverage = $("[data-daily-average]");

  const ACTIVITY_WEEKS = 52;

  const mulberry32 = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const addDays = (date, amount) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  };

  const buildActivity = () => {
    if (!commitChart) return;

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const end = addDays(today, 6 - today.getDay());
    const start = addDays(end, -(ACTIVITY_WEEKS * 7 - 1));
    const random = mulberry32(20261111);
    const days = [];

    for (let i = 0; i < ACTIVITY_WEEKS * 7; i += 1) {
      const date = addDays(start, i);
      const isFuture = date > today;
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      let count = 0;

      if (!isFuture) {
        const activeChance = weekend ? 0.2 : 0.46;
        if (random() < activeChance) {
          const base = Math.floor(random() * (weekend ? 4 : 7)) + 1;
          const burst = random() > 0.93 ? Math.floor(random() * 6) + 3 : 0;
          count = base + burst;
        }
      }

      days.push({ date, count, isFuture });
    }

    const pastDays = days.filter((day) => !day.isFuture);
    const total = pastDays.reduce((sum, day) => sum + day.count, 0);
    const active = pastDays.filter((day) => day.count > 0).length;

    let streak = 0;
    let maxStreak = 0;
    pastDays.forEach((day) => {
      if (day.count > 0) {
        streak += 1;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    });

    if (totalContributions) totalContributions.textContent = new Intl.NumberFormat("es-CL").format(total);
    if (activeDays) activeDays.textContent = String(active).padStart(2, "0");
    if (longestStreak) longestStreak.textContent = String(maxStreak).padStart(2, "0");
    if (weekAverage) weekAverage.textContent = String(Math.round(total / ACTIVITY_WEEKS)).padStart(2, "0");

    const weekTotals = [];
    for (let week = 0; week < ACTIVITY_WEEKS; week += 1) {
      const weekDays = days.slice(week * 7, week * 7 + 7);
      weekTotals.push(weekDays.reduce((sum, day) => sum + day.count, 0));
    }
    const recentWeeks = weekTotals.slice(-20);
    const maxWeek = Math.max(...recentWeeks, 1);

    if (bestWeek) bestWeek.textContent = String(Math.max(...weekTotals));
    if (dailyAverage) {
      dailyAverage.textContent = new Intl.NumberFormat("es-CL", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
      }).format(active > 0 ? total / active : 0);
    }

    commitChart.innerHTML = recentWeeks
      .map((value, index) => {
        const height = Math.max(8, Math.round((value / maxWeek) * 100));
        const current = index === recentWeeks.length - 1 ? " commit-bar--current" : "";
        return `<span class="commit-bar${current}" style="--height:${height}%"></span>`;
      })
      .join("");
  };

  buildActivity();
})();

/* =========================================================
   Learning board
   ========================================================= */

(() => {
  "use strict";

  const board = document.querySelector("[data-board]");
  if (!board) return;

  const STORAGE_KEY = "vicentegonzalez-roadmap-v1";
  const phases = ["now", "next", "done"];
  const lists = new Map(
    [...board.querySelectorAll("[data-task-list]")].map((list) => [list.dataset.taskList, list])
  );
  const filterButtons = [...board.querySelectorAll("[data-filter]")];
  const progressBar = board.querySelector("[data-board-progress-bar]");
  const progressLabel = board.querySelector("[data-board-progress-label]");
  const savedIndicator = board.querySelector("[data-board-saved]");
  const resetButton = board.querySelector("[data-board-reset]");

  const defaults = [
    {
      id: "sec-01",
      phase: "now",
      area: "security",
      category: "Ciberseguridad",
      code: "SEC_01",
      title: "Laboratorio de pentesting",
      description: "Kali Linux + UTM. Reconocimiento, Metasploit y análisis de vulnerabilidades en un entorno aislado.",
      meta: "KALI / UTM",
      progress: 64
    },
    {
      id: "dev-02",
      phase: "now",
      area: "dev",
      category: "Desarrollo",
      code: "DEV_02",
      title: "API de Swipe & Decide",
      description: "Endpoints de simulación, autenticación y dashboard de progreso para la fintech.",
      meta: "NODE / POSTGRES",
      progress: 82
    },
    {
      id: "bld-03",
      phase: "now",
      area: "dev",
      category: "Arquitectura",
      code: "BLD_03",
      title: "Clean Architecture, en serio",
      description: "Lectura aplicada: límites claros, dependencias hacia adentro y menos deuda desde el inicio.",
      meta: "LIBRO / PRÁCTICA",
      progress: 38
    },
    {
      id: "sec-04",
      phase: "next",
      area: "security",
      category: "Ciberseguridad",
      code: "SEC_04",
      title: "Fortinet NSE 4",
      description: "Redes, firewall y seguridad perimetral. El siguiente paso después de NSE 1–3.",
      meta: "FORTINET",
      progress: 0
    },
    {
      id: "ops-05",
      phase: "next",
      area: "cloud",
      category: "Cloud / DevOps",
      code: "OPS_05",
      title: "Docker + CI/CD",
      description: "Contenedores y despliegues repetibles para dejar de configurar servidores a mano.",
      meta: "DOCKER / GITHUB",
      progress: 0
    },
    {
      id: "cld-06",
      phase: "next",
      area: "cloud",
      category: "Cloud / DevOps",
      code: "CLD_06",
      title: "AWS Cloud Practitioner",
      description: "Fundamentos de nube, costos y arquitectura para conversar con criterio técnico.",
      meta: "AWS / CERT",
      progress: 0
    },
    {
      id: "sec-07",
      phase: "done",
      area: "security",
      category: "Ciberseguridad",
      code: "SEC_07",
      title: "Fortinet NSE 1–3",
      description: "Fundamentos de ciberseguridad, amenazas y seguridad de redes.",
      meta: "FORTINET",
      progress: 100
    },
    {
      id: "mob-08",
      phase: "done",
      area: "dev",
      category: "Desarrollo",
      code: "MOB_08",
      title: "MVP de Hábitos & Pomodoro",
      description: "Primera versión funcional con Expo, notificaciones y persistencia local.",
      meta: "REACT NATIVE",
      progress: 100
    }
  ];

  let activeFilter = "all";
  let tasks = defaults.map((task) => ({ ...task }));
  let draggedId = null;
  let savedTimer = 0;

  const liveRegion = document.createElement("p");
  liveRegion.className = "sr-only";
  liveRegion.setAttribute("aria-live", "polite");
  board.appendChild(liveRegion);

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const readStoredPhases = () => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (!stored || typeof stored !== "object") return null;
      return stored;
    } catch (error) {
      return null;
    }
  };

  const hydrateTasks = () => {
    const stored = readStoredPhases();
    tasks = defaults.map((task) => {
      const storedPhase = stored && stored[task.id];
      return phases.includes(storedPhase) ? { ...task, phase: storedPhase } : { ...task };
    });
  };

  const saveState = () => {
    try {
      const state = Object.fromEntries(tasks.map((task) => [task.id, task.phase]));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* localStorage can be unavailable; the board still works in memory. */
    }
  };

  const announce = (message) => {
    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 30);
  };

  const flashSaved = (message = "Guardado localmente") => {
    if (!savedIndicator) return;
    window.clearTimeout(savedTimer);
    savedIndicator.textContent = message;
    savedIndicator.classList.add("is-saved");
    savedTimer = window.setTimeout(() => {
      savedIndicator.textContent = "Guardado localmente";
      savedIndicator.classList.remove("is-saved");
    }, 1600);
  };

  const renderProgress = () => {
    const completed = tasks.filter((task) => task.phase === "done").length;
    const percentage = Math.round((completed / tasks.length) * 100);
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressLabel) progressLabel.textContent = `${percentage}%`;
  };

  const cardMarkup = (task) => {
    const areaClass = task.area === "dev" ? " task-cat--dev" : task.area === "cloud" ? " task-cat--cloud" : "";
    const isDone = task.phase === "done";
    const actionMap = {
      now: { symbol: "✓", label: "Marcar como completado" },
      next: { symbol: "→", label: "Empezar ahora" },
      done: { symbol: "↺", label: "Reabrir objetivo" }
    };
    const action = actionMap[task.phase];
    const showProgress = task.progress > 0;

    return `
      <article class="task-card${isDone ? " is-complete" : ""}" draggable="true" data-task-id="${escapeHtml(task.id)}">
        <div class="task-top">
          <span class="task-cat${areaClass}">${escapeHtml(task.category)}</span>
          <span class="task-id">${escapeHtml(task.code)}</span>
        </div>
        <h4 class="task-title">${escapeHtml(task.title)}</h4>
        <p class="task-desc">${escapeHtml(task.description)}</p>
        ${showProgress ? `
          <div class="task-progress">
            <div class="task-progress-track"><span style="--value:${task.progress}%"></span></div>
            <span class="task-progress-label">${task.progress}%</span>
          </div>
        ` : ""}
        <div class="task-foot">
          <span class="task-meta">${escapeHtml(task.meta)}</span>
          <div class="task-actions">
            <button class="task-action" type="button"
              data-task-action="${escapeHtml(task.id)}"
              aria-label="${escapeHtml(action.label)}: ${escapeHtml(task.title)}"
              title="${escapeHtml(action.label)}">${action.symbol}</button>
          </div>
        </div>
      </article>
    `;
  };

  const renderBoard = () => {
    phases.forEach((phase) => {
      const list = lists.get(phase);
      if (!list) return;
      const visibleTasks = tasks.filter(
        (task) => task.phase === phase && (activeFilter === "all" || task.area === activeFilter)
      );

      list.innerHTML = visibleTasks.length
        ? visibleTasks.map(cardMarkup).join("")
        : `<p class="kanban-empty">Sin objetivos en esta fase.</p>`;

      const count = board.querySelector(`[data-count-for="${phase}"]`);
      if (count) count.textContent = String(visibleTasks.length).padStart(2, "0");
    });

    renderProgress();
  };

  const moveTask = (taskId, targetPhase) => {
    if (!phases.includes(targetPhase)) return;
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.phase === targetPhase) return;
    task.phase = targetPhase;
    saveState();
    renderBoard();
    flashSaved();
    const phaseName = targetPhase === "now" ? "En curso" : targetPhase === "next" ? "Siguiente" : "Completado";
    announce(`“${task.title}” se movió a ${phaseName}.`);
  };

  hydrateTasks();
  renderBoard();

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      filterButtons.forEach((candidate) => {
        const isActive = candidate === button;
        candidate.classList.toggle("is-active", isActive);
        candidate.setAttribute("aria-pressed", String(isActive));
      });
      renderBoard();
      announce(`Filtrando objetivos: ${button.textContent.trim()}.`);
    });
  });

  board.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-task-action]");
    if (!actionButton) return;
    const taskId = actionButton.dataset.taskAction;
    if (!taskId) return;

    const targetMap = { now: "done", next: "now", done: "now" };
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const nextPhase = targetMap[task.phase] || "now";
    moveTask(taskId, nextPhase);
    const nextButton = board.querySelector(`[data-task-action="${taskId}"]`);
    if (nextButton) nextButton.focus();
  });

  board.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".task-card");
    if (!card) return;
    draggedId = card.dataset.taskId;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedId);
  });

  board.addEventListener("dragend", () => {
    draggedId = null;
    board.querySelectorAll(".task-card").forEach((card) => card.classList.remove("is-dragging"));
    board.querySelectorAll(".kanban-col").forEach((column) => column.classList.remove("is-dragover"));
  });

  board.querySelectorAll(".kanban-col").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      column.classList.add("is-dragover");
    });

    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) column.classList.remove("is-dragover");
    });

    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("is-dragover");
      const id = draggedId || event.dataTransfer.getData("text/plain");
      const targetPhase = column.dataset.phase;
      if (id && targetPhase) moveTask(id, targetPhase);
      draggedId = null;
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* Ignore storage errors. */
      }
      tasks = defaults.map((task) => ({ ...task }));
      activeFilter = "all";
      filterButtons.forEach((button) => {
        const isAll = button.dataset.filter === "all";
        button.classList.toggle("is-active", isAll);
        button.setAttribute("aria-pressed", String(isAll));
      });
      renderBoard();
      flashSaved("Tablero restaurado");
      announce("El tablero se restauró a su estado original.");
    });
  }
})();

/* =========================================================
   Project case dialog
   ========================================================= */

(() => {
  "use strict";

  const dialog = document.getElementById("project-dialog");
  if (!dialog) return;

  const lastFocused = { current: null };
  const backgroundBlocks = [...document.querySelectorAll(".site-header, .ticker, main")];
  const openButtons = [...document.querySelectorAll("[data-project-open]")];
  const closeButtons = [...dialog.querySelectorAll("[data-dialog-close]")];
  const progressBar = document.getElementById("dialog-progress-bar");

  const projects = {
    swipe: {
      code: "PRJ_01 / CASE_001",
      title: "Swipe & Decide Chile",
      status: "Finalista Santander X 2026",
      year: "2026",
      lead: "Una fintech educativa que transforma decisiones de dinero en un juego de escenarios reales. El objetivo: que jóvenes practiquen ahorro, deuda e inversión antes de tomar decisiones con consecuencias.",
      role: "Producto, front-end y modelo de datos",
      stack: "React, Node.js y PostgreSQL",
      challenge: "Convertir educación financiera en una interacción simple, medible y con contexto chileno.",
      learning: "Validación con usuarios, narrativa de producto y la importancia de enseñar sin sonar a clase magistral.",
      progress: 92
    },
    mediaseis: {
      code: "PRJ_02 / CASE_002",
      title: "Mediaseis",
      status: "En desarrollo",
      year: "2026",
      lead: "Un dispensador inteligente de pastillas con recordatorios y monitoreo pensado para acompañar tratamientos. El sistema conecta el dispositivo IoT con una app que mantiene informados a pacientes y cuidadores.",
      role: "Hardware, firmware y aplicación web",
      stack: "ESP32, MQTT y React",
      challenge: "Coordinar dosis, recordatorios y alertas sin que la tecnología se vuelva un problema adicional.",
      learning: "Diseñar para contextos reales exige menos pantallas, más autonomía y mucha confiabilidad.",
      progress: 76
    },
    habitos: {
      code: "PRJ_03 / CASE_003",
      title: "App de Hábitos & Pomodoro",
      status: "MVP activo",
      year: "2025—2026",
      lead: "Una app móvil para construir rutinas sin fricción. Combina sesiones Pomodoro, rachas, recordatorios y estadísticas personales en una experiencia rápida que funciona offline.",
      role: "Desarrollo mobile y experiencia de usuario",
      stack: "React Native, Expo y SQLite",
      challenge: "Mantener el foco sin agregar complejidad, incluso cuando no hay conexión.",
      learning: "Persistencia local, notificaciones y disciplina para iterar hasta que el flujo se sienta natural.",
      progress: 86
    }
  };

  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const setBackgroundInert = (inert) => {
    backgroundBlocks.forEach((block) => {
      block.inert = inert;
    });
  };

  const trapFocus = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(focusableSelector)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onBackdropClick = (event) => {
    if (event.target === dialog) closeDialog();
  };

  const closeDialog = ({ restoreFocus = true } = {}) => {
    if (dialog.hidden) return;
    dialog.hidden = true;
    document.body.classList.remove("is-dialog-open");
    setBackgroundInert(false);
    document.removeEventListener("keydown", trapFocus);
    dialog.removeEventListener("click", onBackdropClick);
    if (progressBar) progressBar.style.width = "0%";
    if (restoreFocus && lastFocused.current && typeof lastFocused.current.focus === "function") {
      lastFocused.current.focus();
    }
  };

  const fillDialog = (project, id) => {
    const code = document.getElementById("dialog-code");
    const title = document.getElementById("dialog-title");
    const status = document.getElementById("dialog-status");
    const year = document.getElementById("dialog-year");
    const lead = document.getElementById("dialog-lead");
    const role = document.getElementById("dialog-role");
    const stack = document.getElementById("dialog-stack");
    const challenge = document.getElementById("dialog-challenge");
    const learning = document.getElementById("dialog-learning");
    const progressLabel = document.getElementById("dialog-progress-label");

    if (code) code.textContent = project.code;
    if (title) title.textContent = project.title;
    if (status) {
      status.textContent = project.status;
      status.className = `status-chip${id === "swipe" ? " status-chip--red" : ""}`;
    }
    if (year) year.textContent = project.year;
    if (lead) lead.textContent = project.lead;
    if (role) role.textContent = project.role;
    if (stack) stack.textContent = project.stack;
    if (challenge) challenge.textContent = project.challenge;
    if (learning) learning.textContent = project.learning;
    if (progressLabel) progressLabel.textContent = `${project.progress}%`;
    if (progressBar) {
      progressBar.style.width = "0%";
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          progressBar.style.width = `${project.progress}%`;
        });
      });
    }
  };

  const openDialog = (id, trigger) => {
    const project = projects[id];
    if (!project) return;
    lastFocused.current = trigger || document.activeElement;
    fillDialog(project, id);
    dialog.hidden = false;
    document.body.classList.add("is-dialog-open");
    setBackgroundInert(true);
    document.addEventListener("keydown", trapFocus);
    dialog.addEventListener("click", onBackdropClick);

    const focusTarget = dialog.querySelector(".dialog-x") || dialog.querySelector(focusableSelector);
    if (focusTarget) focusTarget.focus();

    const shell = dialog.querySelector(".dialog-shell");
    if (shell) shell.scrollTop = 0;
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", () => openDialog(button.dataset.projectOpen, button));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => closeDialog());
  });

  const dialogContact = dialog.querySelector("[data-dialog-contact]");
  if (dialogContact) {
    dialogContact.addEventListener("click", () => {
      closeDialog({ restoreFocus: false });
      window.requestAnimationFrame(() => {
        const mailLink = document.querySelector(".contact-mail");
        if (mailLink) mailLink.focus({ preventScroll: true });
      });
    });
  }
})();
