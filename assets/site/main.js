const root = document.documentElement;
const navLinks = [...document.querySelectorAll(".top-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const themeToggle = document.querySelector(".theme-toggle");
const year = document.querySelector("#year");
const autoplayVideos = [...document.querySelectorAll("video[autoplay]")];
const themeColor = document.querySelector('meta[name="theme-color"]');
const honorBoard = document.querySelector("[data-honor-board]");
const honorCards = honorBoard ? [...honorBoard.querySelectorAll("[data-honor-card]")] : [];
const honorFilters = [...document.querySelectorAll("[data-honor-filter]")];
const honorEmpty = document.querySelector("[data-honor-empty]");
const honorMobileLayout = window.matchMedia("(max-width: 820px)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

year.textContent = new Date().getFullYear();

const syncThemeColor = () => {
  if (!themeColor) return;
  themeColor.setAttribute("content", root.dataset.theme === "dark" ? "#161411" : "#f7f2ea");
};

const urlTheme = new URLSearchParams(window.location.search).get("theme");
const storedTheme = localStorage.getItem("theme");

if (urlTheme === "dark" || urlTheme === "light") {
  root.dataset.theme = urlTheme;
} else if (storedTheme) {
  root.dataset.theme = storedTheme;
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  root.dataset.theme = "dark";
}

syncThemeColor();

const toggleTheme = () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", root.dataset.theme);
  syncThemeColor();
};

themeToggle.addEventListener("click", () => {
  if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.startViewTransition(toggleTheme);
    return;
  }

  toggleTheme();
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  {
    rootMargin: "-22% 0px -62% 0px",
    threshold: [0.1, 0.3, 0.6],
  },
);

sections.forEach((section) => sectionObserver.observe(section));

autoplayVideos.forEach((video) => {
  video.play().catch(() => {});
});

// Scroll reveal — fade/rise sections into view. Skip the physics board section
// so its layout measurements aren't taken while it's transformed.
if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
  const revealEls = [...document.querySelectorAll("main.page-shell > section")].filter(
    (section) => !section.querySelector("[data-honor-board]"),
  );
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  revealEls.forEach((section) => {
    section.classList.add("reveal");
    revealObserver.observe(section);
  });
}

if (honorBoard) {
  // Prevent browser's native link/image drag, which fights Matter.js mouse tracking
  honorBoard.addEventListener("dragstart", (e) => e.preventDefault());

  let topZ = honorCards.length + 1;
  let physicsState = null;

  // Reasons the simulation is currently suspended (off-screen, tab hidden,
  // lightbox open). The runner resumes only once every reason has cleared.
  const pauseReasons = new Set();

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const canUsePhysics = () =>
    Boolean(window.Matter) && !honorMobileLayout.matches && !prefersReducedMotion.matches;

  const placeHonorCards = () => {
    if (honorMobileLayout.matches) return;

    const boardRect = honorBoard.getBoundingClientRect();

    honorCards.forEach((card, index) => {
      const x = Number(card.dataset.x || 0) / 100;
      const y = Number(card.dataset.y || 0) / 100;
      const rotation = Number(card.dataset.rotation || 0);
      const maxLeft = Math.max(boardRect.width - card.offsetWidth, 0);
      const maxTop = Math.max(boardRect.height - card.offsetHeight, 0);

      card.style.left = `${clamp(maxLeft * x, 0, maxLeft)}px`;
      card.style.top = `${clamp(maxTop * y, 0, maxTop)}px`;
      card.style.zIndex = String(index + 1);
      card.style.setProperty("--rotation", `${rotation}deg`);
    });
  };

  const stopHonorPhysics = () => {
    if (!physicsState) return;

    cancelAnimationFrame(physicsState.frameId);
    Matter.Events.off(physicsState.mouseConstraint, "startdrag", physicsState.handleStartDrag);
    Matter.Events.off(physicsState.mouseConstraint, "enddrag", physicsState.handleEndDrag);
    Matter.Composite.clear(physicsState.engine.world, false);
    Matter.Engine.clear(physicsState.engine);
    Matter.Runner.stop(physicsState.runner);
    honorBoard.classList.remove("is-physics");
    physicsState = null;
  };

  const pausePhysics = () => {
    if (!physicsState || physicsState.paused) return;
    physicsState.paused = true;
    cancelAnimationFrame(physicsState.frameId);
    Matter.Runner.stop(physicsState.runner);
  };

  const resumePhysics = () => {
    if (!physicsState || !physicsState.paused) return;
    physicsState.paused = false;
    // A fresh runner resets the timestep, so the first frame after a long pause
    // doesn't integrate a huge delta and fling the cards around.
    physicsState.runner = Matter.Runner.create();
    Matter.Runner.run(physicsState.runner, physicsState.engine);
    physicsState.frameId = requestAnimationFrame(physicsState.loop);
  };

  const requestPause = (reason) => {
    pauseReasons.add(reason);
    pausePhysics();
  };

  const requestResume = (reason) => {
    pauseReasons.delete(reason);
    if (pauseReasons.size === 0) resumePhysics();
  };

  // Dimensions cached once — reading offsetWidth in rAF causes layout thrash
  const cardDims = new Map();

  const syncPhysicsCard = (card, body) => {
    const d = cardDims.get(card) ?? { w: 0, h: 0 };
    card.style.transform = `translate3d(${body.position.x - d.w * 0.5}px,${body.position.y - d.h * 0.5}px,0) rotate(${body.angle}rad)`;
  };

  const startHonorPhysics = () => {
    stopHonorPhysics();

    if (!canUsePhysics()) {
      requestAnimationFrame(placeHonorCards);
      return;
    }

    const visibleCards = honorCards.filter((card) => !card.hidden);
    if (!visibleCards.length) return;

    // Cache dimensions now (before animation loop) to avoid per-frame reflow
    visibleCards.forEach((card) => {
      cardDims.set(card, { w: card.offsetWidth, h: card.offsetHeight });
    });

    const { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;
    const engine = Engine.create({ enableSleeping: true });
    const runner = Runner.create();
    const boardRect = honorBoard.getBoundingClientRect();
    const wallSize = 160;
    const walls = [
      Bodies.rectangle(
        boardRect.width / 2,
        boardRect.height + wallSize / 2 - 8,
        boardRect.width + wallSize * 2,
        wallSize,
        {
          isStatic: true,
        },
      ),
      Bodies.rectangle(-wallSize / 2, boardRect.height / 2, wallSize, boardRect.height * 2, {
        isStatic: true,
      }),
      Bodies.rectangle(boardRect.width + wallSize / 2, boardRect.height / 2, wallSize, boardRect.height * 2, {
        isStatic: true,
      }),
    ];
    const bodies = visibleCards.map((card, index) => {
      const xRatio = Number(card.dataset.x || 0) / 100;
      const baseRotation = (Number(card.dataset.rotation || 0) * Math.PI) / 180;
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const x = clamp(width / 2 + (boardRect.width - width) * xRatio, width / 2, boardRect.width - width / 2);
      const y = -height / 2 - index * 48;
      const body = Bodies.rectangle(x, y, width, height, {
        angle: baseRotation,
        chamfer: { radius: 3 },
        density: 0.0015,
        friction: 0.78,
        frictionAir: 0.072, // was 0.022 — cards now settle ~3× faster
        frictionStatic: 0.9,
        restitution: 0.12,
      });

      body.card = card;
      card.style.zIndex = String(index + 1);
      syncPhysicsCard(card, body);
      Body.setAngularVelocity(body, (index % 2 === 0 ? -1 : 1) * (0.012 + index * 0.002));
      return body;
    });
    const mouse = Mouse.create(honorBoard);
    // This Matter build binds its wheel handler to the "wheel" event with
    // {passive:false} and calls preventDefault() — remove it so the page can
    // still scroll when the cursor is over the board.
    mouse.element.removeEventListener("wheel", mouse.mousewheel);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        damping: 0.16,
        stiffness: 0.22,
        render: { visible: false },
      },
    });
    engine.gravity.y = 0.78;
    engine.positionIterations = 6;
    engine.velocityIterations = 4;
    engine.constraintIterations = 3;
    honorBoard.classList.add("is-physics");
    Composite.add(engine.world, [...walls, ...bodies, mouseConstraint]);

    const handleStartDrag = (event) => {
      const card = event.body?.card;
      if (!card) return;

      card.classList.add("is-dragging");
      card.style.zIndex = String(++topZ);
    };

    const handleEndDrag = (event) => {
      const card = event.body?.card;
      if (!card) return;

      // Clamp release velocity — prevents card flying off-screen when mouse moves fast
      if (event.body) {
        const maxV = 14;
        Body.setVelocity(event.body, {
          x: Math.max(-maxV, Math.min(maxV, event.body.velocity.x)),
          y: Math.max(-maxV, Math.min(maxV, event.body.velocity.y)),
        });
      }

      card.classList.remove("is-dragging");
    };

    const updateCards = () => {
      if (!physicsState || physicsState.paused) return;

      const width = honorBoard.clientWidth;
      const height = honorBoard.clientHeight;

      bodies.forEach((body) => {
        // Boundary clamp (no offsetWidth read — use cached dims)
        const d = cardDims.get(body.card) ?? { w: 0, h: 0 };
        const hw = d.w * 0.5,
          hh = d.h * 0.5;
        const nextX = clamp(body.position.x, hw, width - hw);
        const nextY = Math.min(body.position.y, height - hh);
        const clampedX = nextX !== body.position.x;
        const clampedY = nextY !== body.position.y;

        if (clampedX || clampedY) {
          Body.setPosition(body, { x: nextX, y: nextY });
          Body.setVelocity(body, {
            x: clampedX ? body.velocity.x * -0.22 : body.velocity.x,
            y: clampedY ? body.velocity.y * -0.14 : body.velocity.y,
          });
        }

        // Skip DOM write for sleeping bodies (they don't move)
        if (!body.isSleeping) syncPhysicsCard(body.card, body);
      });
      physicsState.frameId = requestAnimationFrame(updateCards);
    };

    Events.on(mouseConstraint, "startdrag", handleStartDrag);
    Events.on(mouseConstraint, "enddrag", handleEndDrag);
    Runner.run(runner, engine);

    physicsState = {
      bodies,
      engine,
      frameId: requestAnimationFrame(updateCards),
      handleEndDrag,
      handleStartDrag,
      loop: updateCards,
      mouseConstraint,
      paused: false,
      runner,
    };

    // If the board is currently off-screen / hidden / behind the lightbox,
    // don't let this fresh run animate where nobody can see it.
    if (pauseReasons.size) pausePhysics();
  };

  const setHonorFilter = (filter) => {
    let visibleCount = 0;

    honorFilters.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.honorFilter === filter));
    });

    honorCards.forEach((card) => {
      const categories = (card.dataset.honorCategories || "").split(" ");
      const isVisible = filter === "all" || categories.includes(filter);

      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    honorBoard.classList.toggle("is-empty", visibleCount === 0);
    if (honorEmpty) honorEmpty.hidden = visibleCount !== 0;
    requestAnimationFrame(startHonorPhysics);
  };

  honorFilters.forEach((button) => {
    button.addEventListener("click", () => {
      setHonorFilter(button.dataset.honorFilter || "all");
    });
  });

  const replayButton = document.querySelector("[data-honor-replay]");
  if (replayButton) {
    replayButton.addEventListener("click", () => {
      // Re-drop the currently visible cards from the top.
      requestAnimationFrame(startHonorPhysics);
    });
  }

  // ── Lightbox ────────────────────────────────────────────
  const backdrop = document.createElement("div");
  backdrop.className = "lightbox-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-labelledby", "lightbox-title");
  backdrop.setAttribute("aria-describedby", "lightbox-detail");
  backdrop.hidden = true;

  const lbInner = document.createElement("div");
  lbInner.className = "lightbox-inner";

  const lbImgWrap = document.createElement("div");
  lbImgWrap.className = "lightbox-img-wrap";

  const lbImg = document.createElement("img");
  lbImg.className = "lightbox-img";
  lbImg.decoding = "async";
  lbImgWrap.appendChild(lbImg);

  const lbMeta = document.createElement("div");
  lbMeta.className = "lightbox-meta";

  const lbTitle = document.createElement("p");
  lbTitle.className = "lightbox-meta-title";
  lbTitle.id = "lightbox-title";

  const lbDetail = document.createElement("p");
  lbDetail.className = "lightbox-meta-detail";
  lbDetail.id = "lightbox-detail";

  const lbAmount = document.createElement("p");
  lbAmount.className = "lightbox-meta-amount";

  const lbRow = document.createElement("div");
  lbRow.className = "lightbox-meta-row";

  const lbYear = document.createElement("span");
  lbYear.className = "lightbox-meta-year";

  const lbLink = document.createElement("a");
  lbLink.className = "lightbox-meta-link";
  lbLink.target = "_blank";
  lbLink.rel = "noreferrer";
  lbLink.textContent = "Open original ↗";

  lbRow.appendChild(lbYear);
  lbRow.appendChild(lbLink);
  lbMeta.appendChild(lbTitle);
  lbMeta.appendChild(lbDetail);
  lbMeta.appendChild(lbAmount);
  lbMeta.appendChild(lbRow);

  lbInner.appendChild(lbImgWrap);
  lbInner.appendChild(lbMeta);
  backdrop.appendChild(lbInner);

  const closeBtn = document.createElement("button");
  closeBtn.className = "lightbox-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = "&#xd7;";
  backdrop.appendChild(closeBtn);

  document.body.appendChild(backdrop);

  let activeCard = null;
  let previousFocus = null;

  // Make the rest of the page non-interactive + hidden from assistive tech while
  // the dialog is open, so focus and screen-reader navigation stay inside it.
  const inertRegions = [".site-header", "main.page-shell", ".site-footer"]
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);

  const setBackgroundInert = (on) => {
    inertRegions.forEach((el) => {
      if (on) {
        el.setAttribute("inert", "");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
    });
  };

  // Focus trap: keep Tab / Shift+Tab cycling within the dialog.
  backdrop.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = [...backdrop.querySelectorAll("a[href], button:not([disabled])")].filter(
      (el) => el.offsetParent !== null,
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  const useVT = () => typeof document.startViewTransition === "function" && !prefersReducedMotion.matches;

  const openLightbox = (card) => {
    const srcImg = card.querySelector("img");
    activeCard = card;
    previousFocus = document.activeElement;

    requestPause("lightbox");
    setBackgroundInert(true);

    lbImg.src = card.href;
    lbImg.alt = srcImg?.alt ?? "";
    lbTitle.textContent = card.querySelector(".certificate-caption strong")?.textContent?.trim() ?? "";
    lbDetail.textContent = card.querySelector(".certificate-detail")?.textContent?.trim() ?? "";
    lbYear.textContent =
      card.querySelector(".certificate-caption > span:last-child")?.textContent?.trim() ?? "";
    lbAmount.textContent = card.dataset.amount ?? "";
    lbLink.href = card.href;

    if (useVT() && srcImg) {
      srcImg.style.viewTransitionName = "cert-open";
      document
        .startViewTransition(() => {
          srcImg.style.viewTransitionName = "";
          lbImg.style.viewTransitionName = "cert-open";
          backdrop.hidden = false;
          backdrop.classList.add("is-open");
          document.body.style.overflow = "hidden";
        })
        .finished.then(() => {
          lbImg.style.viewTransitionName = "";
          closeBtn.focus();
        });
    } else {
      backdrop.hidden = false;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        backdrop.classList.add("is-open");
        closeBtn.focus();
      });
    }
  };

  const closeLightbox = () => {
    if (!activeCard) return;
    const card = activeCard;
    const srcImg = card.querySelector("img");

    const hide = () => {
      backdrop.hidden = true;
      backdrop.classList.remove("is-open");
      lbImg.src = "";
      document.body.style.overflow = "";
      activeCard = null;
      setBackgroundInert(false);
      requestResume("lightbox");
      previousFocus?.focus?.();
    };

    backdrop.classList.remove("is-open");

    if (useVT() && srcImg) {
      lbImg.style.viewTransitionName = "cert-open";
      document
        .startViewTransition(() => {
          lbImg.style.viewTransitionName = "";
          srcImg.style.viewTransitionName = "cert-open";
          backdrop.hidden = true;
          lbImg.src = "";
          document.body.style.overflow = "";
          activeCard = null;
        })
        .finished.then(() => {
          srcImg.style.viewTransitionName = "";
          setBackgroundInert(false);
          requestResume("lightbox");
          previousFocus?.focus?.();
        });
    } else {
      setTimeout(hide, 300);
    }
  };

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.hidden) closeLightbox();
  });

  // Distinguish a click (open) from a drag (move only). Track pointer travel at
  // the document level between pointerdown and the click that follows pointerup.
  let pointerDownPos = null;
  let pointerMoved = false;

  honorBoard.addEventListener("pointerdown", (event) => {
    pointerDownPos = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
  });

  document.addEventListener("pointermove", (event) => {
    if (!pointerDownPos) return;
    if (Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y) > 5) {
      pointerMoved = true;
    }
  });

  document.addEventListener("pointerup", () => {
    pointerDownPos = null;
  });

  honorCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      if (pointerMoved) return; // it was a drag — just move, don't open
      openLightbox(card);
    });
  });

  window.addEventListener("resize", startHonorPhysics);
  honorMobileLayout.addEventListener("change", startHonorPhysics);
  prefersReducedMotion.addEventListener("change", startHonorPhysics);

  // Suspend the simulation when it isn't visible: scrolled off-screen or the
  // tab is in the background. (Lightbox open is handled in openLightbox.)
  if ("IntersectionObserver" in window) {
    const boardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) requestResume("offscreen");
          else requestPause("offscreen");
        });
      },
      { rootMargin: "120px 0px 120px 0px", threshold: 0 },
    );
    boardObserver.observe(honorBoard);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) requestPause("hidden");
    else requestResume("hidden");
  });

  requestAnimationFrame(startHonorPhysics);
}
