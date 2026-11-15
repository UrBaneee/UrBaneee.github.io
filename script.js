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
// Skye's vinyl collection, sorted into two piles
const albums = [
  { title: "Music For Film", artist: "Ryuichi Sakamoto", id: "202ZOGO9zNndH8oxrBrm35", cover: "7f93d0fcc5852192890f7918", pile: 0 },
  { title: "Interstellar", artist: "Hans Zimmer", id: "3B61kSKTxlY36cYgzvf3cP", cover: "81f04c407e0ec68e3dea6b2c", pile: 0 },
  { title: "La La Land", artist: "Justin Hurwitz", id: "0nQJa9mRvan1HnkwbYuxAN", cover: "9387dbc2b28a455d6995d1ff", pile: 0 },
  { title: "The Phantom of the Opera", artist: "Original London Cast", id: "08qngNLHQMtpXqBkeqN8Fr", cover: "68b085566bfa0165e44b945b", pile: 0, disc: ["#5e0d12", "#7d1a22"] },
  { title: "我去2000年", artist: "朴树", id: "5MXApzS7FdKbHoVRK6IDtw", cover: "2a2eb00100a85c104d0c5ae7", pile: 1 },
  { title: "陳婧霏", artist: "陈婧霏", id: "4qGQqbh3yCmD4a6PIuO5eu", cover: "1e3caff15fdf0ad843a6b4bd", pile: 1 },
  { title: "浪潮上岸", artist: "橘子海 Orange Ocean", id: "1XmHCk8LzGRb1an4AsxKZk", cover: "46d69c5b65f8675119cf0779", pile: 1 },
];
const PILES = ["Film & stage", "华语"];
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

  const nowPlaying = document.getElementById("now-playing");
  const vinylEl = record.querySelector(".vinyl");
  const show = (i) => {
    const a = albums[i];
    coverEl.src = coverUrl(a, "large");
    coverEl.alt = `Album cover: ${a.title} by ${a.artist}`;
    labelEl.style.backgroundImage = `url("${coverUrl(a, "small")}")`;
    // coloured vinyl (the Phantom pressing is red), otherwise black
    vinylEl.style.setProperty("--disc", a.disc ? a.disc[0] : "#16130f");
    vinylEl.style.setProperty("--groove", a.disc ? a.disc[1] : "#221e17");
    if (nowPlaying) nowPlaying.innerHTML = `<span>On the turntable</span><strong></strong><em></em>`;
    if (nowPlaying) {
      nowPlaying.querySelector("strong").textContent = a.title;
      nowPlaying.querySelector("em").textContent = a.artist;
    }
    crate.querySelectorAll("button").forEach((b) => {
      const on = Number(b.dataset.i) === i;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
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

  // two piles of sleeves, each tilted a little, like records laid out on the floor
  PILES.forEach((pileName, p) => {
    const group = document.createElement("div");
    group.className = "pile";
    const h = document.createElement("p");
    h.className = "pile-title";
    h.textContent = pileName;
    const row = document.createElement("div");
    row.className = "pile-row";
    albums.forEach((a, i) => {
      if (a.pile !== p) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lp";
      b.dataset.i = i;
      b.style.setProperty("--r", `${[-3, 2, -1.5, 3, -2.5, 1.5, -1][i % 7]}deg`);
      b.setAttribute("aria-label", `Play ${a.title} by ${a.artist}`);
      b.innerHTML = '<span class="lp-sleeve"><img alt="" loading="lazy"><span class="lp-on">On the turntable</span></span><span class="lp-title"></span><span class="lp-artist"></span>';
      b.querySelector("img").src = coverUrl(a, "small");
      b.querySelector(".lp-title").textContent = a.title;
      b.querySelector(".lp-artist").textContent = a.artist;
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
      row.appendChild(b);
    });
    group.append(h, row);
    crate.appendChild(group);
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

// Which photo stands for each city on the map (index into window.PHOTOS[city])
const COVER = { nanjing: 2, bangkok: 1, melbourne: 2, singapore: 7, london: 3, shanghai: 4, northcarolina: 6, rhodeisland: 9, sandiego: 6 };
// Keepers circled on each contact sheet (indexes into window.PHOTOS[city])
const PICKS = { nanjing: [1, 8, 13, 16, 19, 21], bangkok: [2, 5, 6], melbourne: [1, 2, 12], singapore: [8, 9, 11], london: [0, 3, 4, 9], shanghai: [10, 12, 14], northcarolina: [7, 8, 15], rhodeisland: [8, 14, 16, 21], sandiego: [0, 4, 6] };

// Journey map: a camera follows the route leg by leg as the steps scroll past
const jSvg = document.getElementById("journey-svg");
if (jSvg) {
  const NS = "http://www.w3.org/2000/svg";
  const WORLD = { x: 0, y: 16, w: 1000, h: 402 };
  const P = {
    yangzhou: [421.4, 125.6], bangkok: [364.4, 192.2], nanjing: [419.7, 126.7],
    melbourne: [487.4, 379.3], singapore: [371.7, 238.3], london: [160.3, 65.1],
    shanghai: [426.3, 129.6], northcarolina: [826.8, 113], rhodeisland: [837.3, 94.8],
    sandiego: [738.1, 124.5], bayarea: [719.3, 108.1],
  };
  // label placement around each pin, so close neighbours don't overlap
  const PLACES = {
    yangzhou: ["Yangzhou", "e"], bangkok: ["Bangkok", "w"], nanjing: ["Nanjing", "w"],
    melbourne: ["Melbourne", "e"], singapore: ["Singapore", "w"], london: ["London", "n"],
    shanghai: ["Shanghai", "s"], northcarolina: ["North Carolina", "s"], rhodeisland: ["Rhode Island", "n"],
    sandiego: ["San Diego", "w"], bayarea: ["San Francisco", "n"],
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

    const photos = (window.PHOTOS || {})[key];
    if (photos && photos.length) {
      const cover = photos[COVER[key] || 0] || photos[0];
      g.classList.add("has-tile");
      const tile = document.createElementNS(NS, "g");
      tile.setAttribute("class", "photo-tile");
      tile.setAttribute("aria-hidden", "true");
      const stem = document.createElementNS(NS, "line");
      stem.setAttribute("class", "tile-stem");
      const frameRect = document.createElementNS(NS, "rect");
      frameRect.setAttribute("class", "tile-frame");
      const img = document.createElementNS(NS, "image");
      img.setAttribute("href", cover.thumb);
      img.setAttribute("preserveAspectRatio", "xMidYMid slice");
      const cap = document.createElementNS(NS, "text");
      cap.setAttribute("class", "tile-caption");
      cap.textContent = `${name} · ${photos.length}`;
      tile.append(stem, frameRect, img, cap);
      tile.addEventListener("click", () => { window.location.href = `darkroom.html?place=${key}`; });
      g.appendChild(tile);
      PINS[key].tile = { stem, frameRect, img, cap };
    }
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
      if (pin.tile) {
        // photo tile to the lower left of the pin, joined by a short stem
        const S = 42 * k, b = 2.6 * k, x0 = x - 7 * k - S, y0 = y + 7 * k;
        const t = pin.tile;
        t.stem.setAttribute("x1", x); t.stem.setAttribute("y1", y);
        t.stem.setAttribute("x2", x0 + S); t.stem.setAttribute("y2", y0);
        t.frameRect.setAttribute("x", x0 - b); t.frameRect.setAttribute("y", y0 - b);
        t.frameRect.setAttribute("width", S + 2 * b); t.frameRect.setAttribute("height", S + 2 * b);
        t.frameRect.setAttribute("rx", 2 * k);
        t.img.setAttribute("x", x0); t.img.setAttribute("y", y0);
        t.img.setAttribute("width", S); t.img.setAttribute("height", S);
        t.cap.setAttribute("x", x0 - b); t.cap.setAttribute("y", y0 + S + b + 11 * k);
      }
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
    if (st.overview) { LEGS.forEach((L) => pts.push(L.a, L.b, pointAt(L, 0.5).pt)); pts.push(P.bayarea); }
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
      // the last step marks where Skye is looking for work: San Diego or San Francisco
      pin.g.classList.toggle("is-option", !!STEPS[current]?.overview && (key === "bayarea" || key === "sandiego"));
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

    current = i;
    const visited = new Set(["yangzhou"]);
    STEPS.slice(0, i + 1).forEach((s, si) => {
      if (si < i || !(forward && animate)) LEGS.filter((L) => L.step === si).forEach((L) => { visited.add(L.from); visited.add(L.to); });
    });
    mine.forEach((L) => visited.add(L.from));
    if (!(forward && animate)) visited.add(st.place);
    setPins(visited, st.overview ? null : st.place);

    stepEls.forEach((el, j) => el.classList.toggle("is-active", j === i));
    hudStep.textContent = `${String(i + 1).padStart(2, "0")} / ${String(STEPS.length).padStart(2, "0")}`;
    hudPlace.textContent = st.overview ? "Next: San Diego / San Francisco" : PLACES[st.place][0];
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

// Photo stacks in the Journey timeline, for each place that has photos
document.querySelectorAll(".journey-step").forEach((li) => {
  const key = li.dataset.overview ? null : li.dataset.place;
  const photos = key && (window.PHOTOS || {})[key];
  if (!photos || !photos.length) return;
  const btn = document.createElement("a");
  btn.href = `darkroom.html?place=${key}`;
  btn.className = "photo-stack";
  btn.setAttribute("aria-label", `See all ${photos.length} photos from ${li.querySelector("h3").textContent}`);
  const thumbs = document.createElement("span");
  thumbs.className = "stack-thumbs";
  const c = COVER[key] || 0;
  [c + 8, c + 4, c].forEach((n) => {
    const p = photos[n % photos.length];
    const im = document.createElement("img");
    im.src = p.thumb;
    im.alt = "";
    im.loading = "lazy";
    thumbs.appendChild(im);
  });
  const label = document.createElement("span");
  label.className = "stack-label";
  label.textContent = `${photos.length} photos`;
  btn.append(thumbs, label);
  btn.addEventListener("click", (e) => e.stopPropagation());
  li.querySelector(".step-card").appendChild(btn);
});

// Photo viewer: big photo, film strip of thumbnails, arrow keys and swipe
const gallery = document.getElementById("gallery");
if (gallery && typeof gallery.showModal === "function") {
  const img = document.getElementById("gallery-img");
  const dateEl = document.getElementById("gallery-date");
  const caption = document.getElementById("gallery-caption");
  const strip = document.getElementById("gallery-strip");
  const NAMES = { yangzhou: "Yangzhou", bangkok: "Bangkok", nanjing: "Nanjing", melbourne: "Melbourne", singapore: "Singapore", london: "London", shanghai: "Shanghai", northcarolina: "North Carolina", rhodeisland: "Rhode Island", sandiego: "San Diego" };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let list = [], idx = 0, city = "";

  const go = (i) => {
    idx = (i + list.length) % list.length;
    const p = list[idx];
    img.src = p.src;
    img.width = p.w;
    img.height = p.h;
    let when = "";
    if (p.date) {
      const [y, m, d] = p.date.split("-").map(Number);
      dateEl.textContent = `'${String(y).slice(2)} ${m} ${d}`;
      when = `, ${d} ${MONTHS[m - 1]} ${y}`;
    } else dateEl.textContent = "";
    img.alt = `Photo from ${NAMES[city] || city}${when}`;
    caption.textContent = `${NAMES[city] || city} · ${String(idx + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
    strip.querySelectorAll("button").forEach((b, j) => {
      b.classList.toggle("is-current", j === idx);
      if (j === idx) b.scrollIntoView({ block: "nearest", inline: "center", behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
    // warm the next photo
    const next = new Image();
    next.src = list[(idx + 1) % list.length].src;
  };

  window.openGallery = (key, start) => {
    list = (window.PHOTOS || {})[key] || [];
    if (!list.length) return;
    city = key;
    strip.replaceChildren(...list.map((p, j) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Photo ${j + 1}`);
      const t = document.createElement("img");
      t.src = p.thumb;
      t.alt = "";
      t.loading = "lazy";
      b.appendChild(t);
      b.addEventListener("click", () => go(j));
      li.appendChild(b);
      return li;
    }));
    gallery.showModal();
    go(start || 0);
  };

  document.getElementById("gallery-prev").addEventListener("click", () => go(idx - 1));
  document.getElementById("gallery-next").addEventListener("click", () => go(idx + 1));
  document.getElementById("gallery-close").addEventListener("click", () => gallery.close());
  gallery.addEventListener("click", (e) => { if (e.target === gallery) gallery.close(); });
  gallery.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
  });
  let x0 = null;
  const stage = gallery.querySelector(".gallery-stage");
  stage.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  stage.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
  });
} else {
  window.openGallery = () => {};
}

// Darkroom: a keepers strip on the home page, and the full photo page (darkroom.html)
const ORDER = ["yangzhou", "bangkok", "nanjing", "melbourne", "singapore", "london", "shanghai", "northcarolina", "rhodeisland", "sandiego"];
const PLACE_NAMES = { yangzhou: "Yangzhou", bangkok: "Bangkok", nanjing: "Nanjing", melbourne: "Melbourne", singapore: "Singapore", london: "London", shanghai: "Shanghai", northcarolina: "North Carolina", rhodeisland: "Rhode Island", sandiego: "San Diego" };
const ALLP = window.PHOTOS || {};
const photoCities = ORDER.filter((c) => (ALLP[c] || []).length);
const photoTotal = photoCities.reduce((n, c) => n + ALLP[c].length, 0);

// every photo for a place ("all" or a city), numbered across the whole archive
const photoItems = (place) => {
  const out = [];
  let n = 0;
  photoCities.forEach((c) => {
    const picks = new Set(PICKS[c] || []);
    ALLP[c].forEach((p, i) => {
      n += 1;
      if (place === "all" || place === c) out.push({ ...p, city: c, i, n, pick: picks.has(i) });
    });
  });
  return out;
};
const photoLabel = (it) => `Open photo ${it.n} from ${PLACE_NAMES[it.city]}${it.pick ? ", a keeper" : ""}`;
const thumbImg = (it) => {
  const im = document.createElement("img");
  im.src = it.thumb;
  im.alt = "";
  im.loading = "lazy";
  im.width = it.w;
  im.height = it.h;
  return im;
};
// one strip of film frames, as on a contact sheet
const filmStrip = (list) => {
  const grid = document.createElement("ol");
  grid.className = "sheet-grid";
  list.forEach((it) => {
    const li = document.createElement("li");
    li.className = "sheet-frame";
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", photoLabel(it));
    const im = thumbImg(it);
    if (it.h > it.w) im.classList.add("is-portrait");
    b.appendChild(im);
    b.addEventListener("click", () => window.openGallery(it.city, it.i));
    const no = document.createElement("span");
    no.className = "frame-no";
    no.textContent = `▸ ${it.n}`;
    li.append(b, no);
    grid.appendChild(li);
  });
  return grid;
};

// home page: one strip of keepers and a link to the darkroom
const teaser = document.getElementById("darkroom-teaser");
if (teaser) {
  if (!photoTotal) document.getElementById("darkroom").hidden = true;
  else {
    // one keeper from each city, in the order of the journey
    const keepers = photoCities.map((c) => photoItems(c).find((it) => it.pick) || photoItems(c)[0]);
    const paper = document.createElement("div");
    paper.className = "sheet-paper";
    paper.innerHTML = `<p class="sheet-title"><span>Keepers</span><span>One from each place</span></p>`;
    const strip = filmStrip(keepers);
    strip.style.setProperty("--n", keepers.length);
    paper.appendChild(strip);
    teaser.replaceChildren(paper);
    document.getElementById("darkroom-count").textContent = `${photoTotal} photos`;
  }
}

// darkroom.html: the full archive, by place
const sheetEl = document.getElementById("contact-sheet");
if (sheetEl && document.body.classList.contains("darkroom-page")) {
  const cityList = document.getElementById("side-cities");
  const heading = document.getElementById("dr-heading");
  const params = new URLSearchParams(window.location.search);
  let place = photoCities.includes(params.get("place")) ? params.get("place") : "all";

  const years = (list) => {
    const ys = list.map((p) => p.date && p.date.slice(0, 4)).filter(Boolean).sort();
    if (!ys.length) return "";
    return ys[0] === ys[ys.length - 1] ? ys[0] : `${ys[0]} – ${ys[ys.length - 1]}`;
  };

  // archive: photos run down one column, then the next, in columns that touch
  const renderArchive = () => {
    const wrap = document.createElement("div");
    wrap.className = "archive-flow";
    photoItems(place).forEach((it) => {
      const fig = document.createElement("figure");
      fig.className = "flow-item" + (it.pick ? " is-pick" : "");
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", photoLabel(it));
      b.appendChild(thumbImg(it));
      b.addEventListener("click", () => window.openGallery(it.city, it.i));
      const cap = document.createElement("figcaption");
      cap.textContent = String(it.n).padStart(3, "0");
      fig.append(b, cap);
      wrap.appendChild(fig);
    });
    sheetEl.replaceChildren(wrap);
  };

  const render = () => {
    const list = photoItems(place);
    heading.innerHTML = `<span>${place === "all" ? "All places" : PLACE_NAMES[place]}</span><span>${list.length} photos</span><span>${years(list)}</span>`;
    document.title = `${place === "all" ? "Photographs" : PLACE_NAMES[place]} · Darkroom · Skye Yin`;
    renderArchive();
    cityList.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.city === place)));
    const q = new URLSearchParams();
    if (place !== "all") q.set("place", place);
    history.replaceState(null, "", q.toString() ? `?${q}` : window.location.pathname);
  };

  [["all", "All", photoTotal], ...photoCities.map((c) => [c, PLACE_NAMES[c], ALLP[c].length])].forEach(([key, name, count]) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.city = key;
    b.innerHTML = `${name} <span>${count}</span>`;
    b.addEventListener("click", () => { place = key; render(); window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }); });
    li.appendChild(b);
    cityList.appendChild(li);
  });

  render();
}
