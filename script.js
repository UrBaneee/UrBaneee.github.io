// Scroll-reveal for bento cards
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

// Record crate: pick which album is on the turntable
const albums = [
  {
    title: "Music For Film",
    artist: "Ryuichi Sakamoto",
    year: 2016,
    label: "SAKAMOTO",
    bg: "#d8d2c4",
    fg: "#1c1a17",
    url: "https://open.spotify.com/album/202ZOGO9zNndH8oxrBrm35",
  },
  {
    title: "Delta Dawn",
    artist: "Tanya Tucker",
    year: 1972,
    label: "DELTA DAWN",
    bg: "#6f7a3a",
    fg: "#f6f1e3",
    url: "https://open.spotify.com/album/3iyNh3uhudXLW5tNLapDZS",
  },
  {
    title: "A Symphonic Celebration",
    artist: "Joe Hisaishi · Royal Philharmonic Orchestra",
    year: 2023,
    label: "HISAISHI",
    bg: "#f2d21f",
    fg: "#1c1a17",
    url: "https://open.spotify.com/album/561qUZZO6f2sILHUMlXmlM",
  },
  {
    title: "我去2000年",
    artist: "Pu Shu 朴树",
    year: 1999,
    label: "朴树",
    bg: "#c9973a",
    fg: "#1c1a17",
    url: "https://open.spotify.com/album/5MXApzS7FdKbHoVRK6IDtw",
  },
];

const crate = document.getElementById("crate");
const vinyl = document.getElementById("vinyl");

if (crate && vinyl) {
  const labelText = document.getElementById("vinyl-label-text");
  const albumEl = document.getElementById("vinyl-album");
  const artistEl = document.getElementById("vinyl-artist");
  const listenEl = document.getElementById("vinyl-listen");
  const wrap = vinyl.parentElement;
  let current = 0;
  let swapTimer;

  const show = (i) => {
    const a = albums[i];
    vinyl.style.setProperty("--label-bg", a.bg);
    vinyl.style.setProperty("--label-fg", a.fg);
    labelText.textContent = a.label;
    albumEl.textContent = a.title;
    artistEl.textContent = `${a.artist} · ${a.year}`;
    listenEl.href = a.url;
    crate.querySelectorAll("button").forEach((b, j) => {
      b.classList.toggle("is-active", j === i);
      b.setAttribute("aria-pressed", String(j === i));
    });
    current = i;
  };

  albums.forEach((a, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "crate-disc";
    b.style.setProperty("--label-bg", a.bg);
    b.setAttribute("aria-label", `${a.title} by ${a.artist}`);
    b.title = `${a.title} · ${a.artist}`;
    b.addEventListener("click", () => {
      if (i === current) return;
      clearTimeout(swapTimer);
      if (prefersReducedMotion) {
        show(i);
        return;
      }
      wrap.classList.add("is-swapping");
      swapTimer = setTimeout(() => {
        show(i);
        wrap.classList.remove("is-swapping");
      }, 260);
    });
    crate.appendChild(b);
  });

  show(0);
}
