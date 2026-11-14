// Scroll-reveal for cards
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cards = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  cards.forEach((el) => el.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  cards.forEach((el) => observer.observe(el));
}

// Record crate: pick which album is on the turntable.
// Covers are loaded from Spotify's image CDN; playback is Spotify's own embed.
const albums = [
  { title: "Music For Film", artist: "Ryuichi Sakamoto", id: "202ZOGO9zNndH8oxrBrm35", cover: "7f93d0fcc5852192890f7918" },
  { title: "Delta Dawn", artist: "Tanya Tucker", id: "3iyNh3uhudXLW5tNLapDZS", cover: "ba6c1e3f4d2454cec0c54361" },
  { title: "A Symphonic Celebration", artist: "Joe Hisaishi", id: "561qUZZO6f2sILHUMlXmlM", cover: "8d4306c0878768bf296a39ed" },
  { title: "我去2000年", artist: "Pu Shu 朴树", id: "5MXApzS7FdKbHoVRK6IDtw", cover: "2a2eb00100a85c104d0c5ae7" },
];
const coverUrl = (a, size) =>
  `https://i.scdn.co/image/ab67616d0000${size === "large" ? "b273" : "1e02"}${a.cover}`;

const crate = document.getElementById("crate");
const record = document.getElementById("record");

if (crate && record) {
  const coverEl = document.getElementById("record-cover");
  const labelEl = document.getElementById("vinyl-label");
  const embedEl = document.getElementById("spotify-embed");
  let current = 0;
  let controller = null;
  let swapTimer;

  const setPlaying = (on) => record.classList.toggle("is-playing", on);

  const show = (i) => {
    const a = albums[i];
    coverEl.src = coverUrl(a, "large");
    coverEl.alt = `Album cover: ${a.title} by ${a.artist}`;
    labelEl.style.backgroundImage = `url("${coverUrl(a, "small")}")`;
    crate.querySelectorAll("button").forEach((b, j) => {
      b.classList.toggle("is-active", j === i);
      b.setAttribute("aria-pressed", String(j === i));
    });
    if (i !== current) {
      setPlaying(false);
      if (controller) {
        controller.loadUri(`spotify:album:${a.id}`);
      } else {
        const frame = embedEl.parentElement.querySelector("iframe");
        if (frame) frame.src = `https://open.spotify.com/embed/album/${a.id}`;
      }
    }
    current = i;
  };

  albums.forEach((a, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "crate-disc";
    b.style.backgroundImage = `url("${coverUrl(a, "small")}")`;
    b.setAttribute("aria-label", `${a.title} by ${a.artist}`);
    b.title = `${a.title} · ${a.artist}`;
    b.addEventListener("click", () => {
      if (i === current) return;
      clearTimeout(swapTimer);
      if (prefersReducedMotion) {
        show(i);
        return;
      }
      // slide the record back into the sleeve, change sleeves, slide it out again
      record.classList.add("is-swapping");
      swapTimer = setTimeout(() => {
        show(i);
        record.classList.remove("is-swapping");
      }, 420);
    });
    crate.appendChild(b);
  });

  show(0);

  // Spotify's embed API tells us when music is actually playing,
  // so the record only spins while a track plays.
  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrameAPI.createController(
      embedEl,
      { uri: `spotify:album:${albums[current].id}`, width: "100%", height: 152 },
      (c) => {
        controller = c;
        c.addListener("playback_update", (e) => {
          const d = (e && e.data) || {};
          setPlaying(d.isPaused === false);
        });
      }
    );
  };

  // If the API script is blocked or slow, fall back to a plain embed.
  setTimeout(() => {
    if (controller || embedEl.parentElement.querySelector("iframe")) return;
    const frame = document.createElement("iframe");
    frame.src = `https://open.spotify.com/embed/album/${albums[current].id}`;
    frame.title = "Spotify player";
    frame.height = "152";
    frame.loading = "lazy";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    embedEl.replaceWith(frame);
  }, 6000);
}

// Screening room: project demo videos open in a film-strip dialog
const screening = document.getElementById("screening");

if (screening && typeof screening.showModal === "function") {
  const media = document.getElementById("screening-media");
  const caption = document.getElementById("screening-caption");

  document.querySelectorAll("[data-video]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.video}?autoplay=1&rel=0`;
      frame.title = btn.dataset.caption;
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;
      media.replaceChildren(frame);
      caption.textContent = btn.dataset.caption;
      screening.showModal();
    });
  });

  // stop playback right away, whichever way the dialog is closed
  const stop = () => media.replaceChildren();
  const closeScreening = () => {
    stop();
    screening.close();
  };
  document.getElementById("screening-close").addEventListener("click", closeScreening);
  // clicking the dark backdrop closes it too
  screening.addEventListener("click", (e) => {
    if (e.target === screening) closeScreening();
  });
  screening.addEventListener("cancel", stop); // Esc
  screening.addEventListener("close", stop);
} else {
  // very old browsers: fall back to opening the video on YouTube
  document.querySelectorAll("[data-video]").forEach((btn) => {
    btn.addEventListener("click", () => window.open(`https://youtu.be/${btn.dataset.video}`, "_blank", "noopener"));
  });
}

const root = document.documentElement;
const seeOnce = (els, cls, opts) => {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add(cls));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(cls);
        io.unobserve(entry.target);
      }
    });
  }, opts);
  els.forEach((el) => io.observe(el));
};

// Project covers are "drawn" in as they scroll into view
seeOnce(document.querySelectorAll(".work-cover"), "is-drawn", { threshold: 0.35 });

// Five-Pavilion Bridge: each line is drawn in turn
const bridge = document.querySelector(".bridge-art");
if (bridge) {
  bridge.querySelectorAll("path").forEach((p, i) => p.style.setProperty("--i", i));
  if (prefersReducedMotion) bridge.classList.add("is-drawn");
  else setTimeout(() => seeOnce([bridge], "is-drawn", { threshold: 0.3 }), root.classList.contains("intro-play") ? 900 : 200);
}

// Opening: the name is written, then the story appears line by line
if (root.classList.contains("intro-play")) {
  const steps = [...document.querySelectorAll(".hello .story-line, .hello .social-row")];
  const skip = document.getElementById("skip-intro");
  const timers = [];
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    steps.forEach((el) => el.classList.add("is-shown"));
    root.classList.add("intro-done");
    skip.hidden = true;
    window.removeEventListener("scroll", onScroll);
    try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}
  };
  const onScroll = () => { if (window.scrollY > 120) finish(); };

  let t = 1300;
  steps.forEach((el, i) => {
    timers.push(setTimeout(() => el.classList.add("is-shown"), t));
    t += i === 0 ? 600 : 850;
  });
  timers.push(setTimeout(finish, t));

  skip.hidden = false;
  skip.addEventListener("click", finish);
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Local time in Yangzhou
const yzTime = document.getElementById("yz-time");
if (yzTime) {
  const clock = (tz) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  const yz = clock("Asia/Shanghai"), sd = clock("America/Los_Angeles");
  const tick = () => {
    const now = new Date();
    yzTime.textContent = `${yz.format(now)} in Yangzhou · ${sd.format(now)} in San Diego`;
  };
  tick();
  setInterval(tick, 20000);
}

// Film frame counter: shows the current section and opens a section menu
const fcToggle = document.getElementById("fc-toggle");
if (fcToggle) {
  const menu = document.getElementById("fc-menu");
  const num = document.getElementById("fc-num");
  const label = document.getElementById("fc-label");
  const frames = [...document.querySelectorAll("[data-frame]")];
  const links = [...menu.querySelectorAll("a")];

  const setFrame = (el) => {
    num.textContent = el.dataset.frame;
    label.textContent = el.dataset.frameLabel;
    links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${el.id}`)));
  };
  setFrame(frames[0]);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setFrame(entry.target); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    frames.forEach((f) => io.observe(f));
  }

  const setOpen = (open) => {
    menu.hidden = !open;
    fcToggle.setAttribute("aria-expanded", String(open));
  };
  fcToggle.addEventListener("click", () => setOpen(menu.hidden));
  links.forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !e.target.closest(".frame-counter")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setOpen(false);
      fcToggle.focus();
    }
  });
}

// Journey map: a camera follows the route leg by leg as the steps scroll past
const jSvg = document.getElementById("journey-svg");
if (jSvg) {
  const NS = "http://www.w3.org/2000/svg";
  const WORLD = { x: 0, y: 16, w: 1000, h: 402 };
  const P = {
    yangzhou: [421.4, 125.6], bangkok: [364.4, 192.2], nanjing: [419.7, 126.7],
    melbourne: [487.4, 379.3], singapore: [371.7, 238.3], london: [160.3, 65.1],
    shanghai: [426.3, 129.6], northcarolina: [831, 114.7], rhodeisland: [837.3, 94.8],
    sandiego: [738.1, 124.5],
  };
  // label placement around each pin, so close neighbours don't overlap
  const PLACES = {
    yangzhou: ["Yangzhou", "n"], bangkok: ["Bangkok", "w"], nanjing: ["Nanjing", "w"],
    melbourne: ["Melbourne", "e"], singapore: ["Singapore", "w"], london: ["London", "n"],
    shanghai: ["Shanghai", "e"], northcarolina: ["North Carolina", "s"], rhodeisland: ["Rhode Island", "n"],
    sandiego: ["San Diego", "w"],
  };
  const STEPS = [
    { place: "yangzhou", legs: [] },
    { place: "bangkok", legs: [["yangzhou", "bangkok"]] },
    { place: "nanjing", legs: [["bangkok", "nanjing"]] },
    { place: "melbourne", legs: [["nanjing", "melbourne"], ["melbourne", "nanjing"]] },
    { place: "singapore", legs: [["nanjing", "singapore"], ["singapore", "nanjing"]] },
    { place: "london", legs: [["nanjing", "london"], ["london", "nanjing"]] },
    { place: "shanghai", legs: [["nanjing", "shanghai"]] },
    { place: "northcarolina", legs: [["shanghai", "northcarolina"]] },
    { place: "rhodeisland", legs: [["northcarolina", "rhodeisland"]] },
    { place: "sandiego", legs: [["rhodeisland", "sandiego"]] },
    { place: "sandiego", legs: [], overview: true },
  ];

  const legsG = document.getElementById("journey-legs");
  const pinsG = document.getElementById("journey-pins");
  const plane = document.getElementById("journey-plane");
  const hudStep = document.getElementById("hud-step");
  const hudPlace = document.getElementById("hud-place");
  const stepEls = [...document.querySelectorAll(".journey-step")];

  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // each leg is a quadratic curve that bulges upwards; a return trip bulges the other way
  const LEGS = [];
  STEPS.forEach((st, si) => {
    st.legs.forEach(([from, to], li) => {
      const a = P[from], b = P[to];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      let nx = dy / d, ny = -dx / d;
      if (ny > 0) { nx = -nx; ny = -ny; }
      if (li > 0 && st.legs[li - 1][0] === to) { nx = -nx; ny = -ny; }
      const off = Math.min(0.3 * d, 120);
      const c = [(a[0] + b[0]) / 2 + nx * off, (a[1] + b[1]) / 2 + ny * off];
      const el = document.createElementNS(NS, "path");
      el.setAttribute("class", "leg");
      legsG.appendChild(el);
      LEGS.push({ step: si, from, to, a, b, c, el, dur: Math.min(700 + d * 3, 2000) });
    });
  });
  const pointAt = (L, t) => {
    const p01 = lerp(L.a, L.c, t), p12 = lerp(L.c, L.b, t);
    return { p01, p12, pt: lerp(p01, p12, t) };
  };
  const setLeg = (L, t, cls) => {
    if (t <= 0) { L.el.setAttribute("d", ""); return; }
    const { p01, pt } = pointAt(L, Math.min(t, 1));
    L.el.setAttribute("d", `M${L.a[0]} ${L.a[1]}Q${p01[0]} ${p01[1]} ${pt[0]} ${pt[1]}`);
    L.el.setAttribute("class", `leg ${cls}`);
  };

  // pins
  const PINS = {};
  Object.entries(PLACES).forEach(([key, [name, side]]) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", key === "nanjing" || key === "shanghai" ? "pin pin-quiet" : "pin");
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("class", "pin-ring");
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("class", "pin-dot");
    const label = document.createElementNS(NS, "text");
    label.setAttribute("class", "pin-label");
    label.textContent = name;
    g.append(ring, dot, label);
    pinsG.appendChild(g);
    PINS[key] = { g, ring, dot, label, side };
  });

  let vb = null, k = 1;
  const layout = () => {
    Object.entries(PINS).forEach(([key, pin]) => {
      const [x, y] = P[key];
      pin.dot.setAttribute("cx", x); pin.dot.setAttribute("cy", y); pin.dot.setAttribute("r", 3.6 * k);
      pin.ring.setAttribute("cx", x); pin.ring.setAttribute("cy", y); pin.ring.setAttribute("r", 9 * k);
      const o = 9 * k;
      const pos = { n: [x, y - o - 2 * k, "middle"], s: [x, y + o + 9 * k, "middle"], e: [x + o, y + 4 * k, "start"], w: [x - o, y + 4 * k, "end"] }[pin.side];
      pin.label.setAttribute("x", pos[0]); pin.label.setAttribute("y", pos[1]);
      pin.label.setAttribute("text-anchor", pos[2]);
    });
  };
  const setVB = (v) => {
    vb = v;
    jSvg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    const box = jSvg.getBoundingClientRect();
    k = box.width ? Math.max(v.w / box.width, v.h / box.height) : 1;
    jSvg.style.setProperty("--k", k);
    layout();
  };

  const frame = (i) => {
    const st = STEPS[i];
    let pts = [];
    if (st.overview) LEGS.forEach((L) => pts.push(L.a, L.b, pointAt(L, 0.5).pt));
    else if (!st.legs.length) pts = [P[st.place]];
    else LEGS.filter((L) => L.step === i).forEach((L) => pts.push(L.a, L.b, pointAt(L, 0.5).pt));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const box = jSvg.getBoundingClientRect();
    const aspect = box.width && box.height ? box.width / box.height : 1.6;
    let w = Math.max((maxX - minX) * 1.35 + 30, 76), h = Math.max((maxY - minY) * 1.35 + 30, 76 / aspect);
    if (w / h > aspect) h = w / aspect; else w = h * aspect;
    if (w > WORLD.w) { w = WORLD.w; h = w / aspect; }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi));
    return {
      x: clamp(cx - w / 2, WORLD.x, WORLD.x + WORLD.w - w),
      y: clamp(cy - h / 2, WORLD.y, WORLD.y + WORLD.h - h),
      w, h,
    };
  };

  const placePlane = (L, t) => {
    const { p01, p12, pt } = pointAt(L, t);
    const ang = (Math.atan2(p12[1] - p01[1], p12[0] - p01[0]) * 180) / Math.PI;
    plane.setAttribute("transform", `translate(${pt[0]} ${pt[1]}) rotate(${ang}) scale(${0.85 * k})`);
  };

  const setPins = (visited, currentKey) => {
    Object.entries(PINS).forEach(([key, pin]) => {
      pin.g.classList.toggle("is-visited", visited.has(key));
      pin.g.classList.toggle("is-current", key === currentKey);
    });
  };

  let current = -1, gen = 0;
  const show = (i) => {
    if (i === current) return;
    const forward = i > current && current !== -1;
    const animate = !prefersReducedMotion && current !== -1;
    const g = ++gen;
    const st = STEPS[i];
    const mine = LEGS.filter((L) => L.step === i);

    LEGS.forEach((L) => {
      if (L.step < i) setLeg(L, 1, st.overview ? "done" : "past");
      else if (L.step > i) setLeg(L, 0, "");
      else setLeg(L, forward && animate ? 0 : 1, "current");
    });

    const visited = new Set(["yangzhou"]);
    STEPS.slice(0, i + 1).forEach((s, si) => {
      if (si < i || !(forward && animate)) LEGS.filter((L) => L.step === si).forEach((L) => { visited.add(L.from); visited.add(L.to); });
    });
    mine.forEach((L) => visited.add(L.from));
    if (!(forward && animate)) visited.add(st.place);
    setPins(visited, st.overview ? null : st.place);

    stepEls.forEach((el, j) => el.classList.toggle("is-active", j === i));
    hudStep.textContent = `${String(i + 1).padStart(2, "0")} / ${String(STEPS.length).padStart(2, "0")}`;
    hudPlace.textContent = st.overview ? "The whole route" : PLACES[st.place][0];
    current = i;
    jSvg.classList.toggle("is-overview", !!st.overview);

    const target = frame(i);
    plane.classList.remove("is-flying");
    if (!animate || !vb) { setVB(target); return; }

    const from = { ...vb }, t0 = performance.now(), CAM = 1100, DELAY = forward ? 380 : 0;
    const flights = forward ? mine : [];
    const landed = new Set();
    const total = Math.max(CAM, DELAY + flights.reduce((n, L) => n + L.dur, 0));
    const tick = (now) => {
      if (g !== gen) return;
      const el = now - t0;
      const p = ease(Math.min(el / CAM, 1));
      setVB({ x: from.x + (target.x - from.x) * p, y: from.y + (target.y - from.y) * p, w: from.w + (target.w - from.w) * p, h: from.h + (target.h - from.h) * p });
      let t = el - DELAY;
      for (const L of flights) {
        if (t <= 0) break;
        const lp = Math.min(t / L.dur, 1);
        setLeg(L, ease(lp), "current");
        plane.classList.add("is-flying");
        placePlane(L, ease(lp));
        if (lp >= 1 && !landed.has(L)) {
          landed.add(L);
          visited.add(L.to);
          setPins(visited, st.place);
        }
        if (lp < 1) break;
        t -= L.dur;
      }
      if (el < total) requestAnimationFrame(tick);
      else {
        plane.classList.remove("is-flying");
        visited.add(st.place);
        setPins(visited, st.overview ? null : st.place);
      }
    };
    requestAnimationFrame(tick);
  };

  show(0);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) show(+entry.target.dataset.step); });
    }, { rootMargin: "-58% 0px -40% 0px" });
    stepEls.forEach((el) => io.observe(el));
  }
  // clicking a step jumps there too
  stepEls.forEach((el) => el.addEventListener("click", () => show(+el.dataset.step)));

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { gen++; setVB(frame(current)); }, 120);
  });
}
