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
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" });
  const tick = () => { yzTime.textContent = `It's ${fmt.format(new Date())} in Yangzhou right now`; };
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
