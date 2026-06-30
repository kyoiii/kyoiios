/* ⋆˚꒰ა  kyoiiOS brains  ໒꒱˚⋆
   everything that makes the OS *do* things lives here:
   - a live clock
   - windows you can drag, open, close, and bring to the front
   - the grimoire (notes) app content + rendering
*/

/* ─────────────────────────────────────────────
   1. THE CLOCK  (updates every second)
───────────────────────────────────────────── */
function tickClock() {
  const now = new Date();
  const date = now.toLocaleDateString([], { month: "short", day: "numeric" });
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.querySelector("#clock").textContent = "♡ " + date + " · " + time;
}
tickClock();
setInterval(tickClock, 1000);

// a greeting that changes with the time of day
function updateGreeting() {
  const h = new Date().getHours();
  let text, icon;
  if (h < 5)       { text = "still up? ♡";    icon = "#ic-moon"; }
  else if (h < 12) { text = "good morning";   icon = "#ic-sun";  }
  else if (h < 17) { text = "good afternoon"; icon = "#ic-sun";  }
  else if (h < 21) { text = "good evening";   icon = "#ic-moon"; }
  else             { text = "goodnight";      icon = "#ic-moon"; }
  document.querySelector("#greetText").textContent = text;
  document.querySelector("#greetUse").setAttribute("href", icon);
}
updateGreeting();
setInterval(updateGreeting, 60 * 1000);


/* ─────────────────────────────────────────────
   2. WINDOW STACKING  (the one you touch jumps to front)
───────────────────────────────────────────── */
let topZ = 10;                                 // highest z-index used so far
const topBar = document.querySelector("#top");

function bringToFront(win) {
  topZ++;
  win.style.zIndex = topZ;
  topBar.style.zIndex = topZ + 1;              // keep the top bar above windows
}


/* ─────────────────────────────────────────────
   3. CUTE SOUNDS  (synthesized, no audio files needed)
   browsers only allow sound after a user interaction,
   so the AudioContext starts on the first click.
───────────────────────────────────────────── */
let audioCtx = null;
function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
// a soft little "meow" chirp for opening windows
function playMeow() {
  const ctx = getAudio(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
  o.type = "sine";
  o.frequency.setValueAtTime(620, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
  o.frequency.exponentialRampToValueAtTime(560, t + 0.22);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + 0.32);
}
// a gentle purr rumble for petting the cat
function playPurr() {
  const ctx = getAudio(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
  o.type = "triangle";
  o.frequency.setValueAtTime(140, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
  lfo.frequency.value = 28; lfoGain.gain.value = 30;       // wobble = purr texture
  lfo.connect(lfoGain).connect(o.frequency);
  o.connect(g).connect(ctx.destination);
  o.start(t); lfo.start(t); o.stop(t + 0.44); lfo.stop(t + 0.44);
}


/* ─────────────────────────────────────────────
   3b. OPEN / CLOSE  (+ dock sync + sound)
───────────────────────────────────────────── */
function openWindow(win, opts) {
  const wasOpen = win.style.display === "flex";
  win.style.display = "flex";
  bringToFront(win);
  updateDock();
  if (!(opts && opts.silent) && !wasOpen) playMeow();
}
function closeWindow(win) {
  win.style.display = "none";
  updateDock();
}

// keep the dock's little dots in sync with which windows are open
function updateDock() {
  document.querySelectorAll(".dock-item").forEach((item) => {
    const w = document.querySelector("#" + item.dataset.window);
    item.classList.toggle("open", !!w && w.style.display === "flex");
  });
}


/* ─────────────────────────────────────────────
   4. DRAGGING  (grab a window by its header to move it)
   written from scratch with pointer events so it works
   with both mouse and touch ♡
───────────────────────────────────────────── */
function makeDraggable(win) {
  const handle = document.querySelector("#" + win.id + "header");
  if (!handle) return;

  let startX, startY, originLeft, originTop;

  handle.addEventListener("pointerdown", (e) => {
    // ignore the close button so dragging never fights with closing
    if (e.target.classList.contains("closebutton")) return;

    bringToFront(win);
    const rect = win.getBoundingClientRect();

    // once we start dragging we pin the window by left/top in pixels
    win.style.transform = "none";
    win.style.left = rect.left + "px";
    win.style.top = rect.top + "px";

    startX = e.clientX;
    startY = e.clientY;
    originLeft = rect.left;
    originTop = rect.top;

    handle.setPointerCapture(e.pointerId);
    document.body.style.cursor = "grabbing";
  });

  handle.addEventListener("pointermove", (e) => {
    if (startX === undefined) return;          // not dragging
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    // clamp so the header never disappears under the top bar
    const newTop = Math.max(54, originTop + dy);
    win.style.left = (originLeft + dx) + "px";
    win.style.top = newTop + "px";
  });

  function stopDrag(e) {
    startX = startY = undefined;
    document.body.style.cursor = "";
    if (e && handle.hasPointerCapture(e.pointerId)) {
      handle.releasePointerCapture(e.pointerId);
    }
  }
  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);
}


/* ─────────────────────────────────────────────
   5. WIRING UP EACH WINDOW
   one helper that hooks up dragging + the close button.
───────────────────────────────────────────── */
function initWindow(id) {
  const win = document.querySelector("#" + id);
  makeDraggable(win);
  // bring a window to the front whenever you click anywhere on it
  win.addEventListener("pointerdown", () => bringToFront(win));
  // its close button
  const closeBtn = document.querySelector("#" + id + "close");
  if (closeBtn) closeBtn.addEventListener("click", () => closeWindow(win));
  return win;
}

const welcomeWin  = initWindow("welcome");
const grimoireWin = initWindow("grimoire");
const jukeboxWin  = initWindow("jukebox");


/* ─────────────────────────────────────────────
   6. DESKTOP ICONS  (single click selects, opens window)
───────────────────────────────────────────── */
let selectedIcon = null;

document.querySelectorAll(".app-icon").forEach((icon) => {
  icon.addEventListener("click", () => {
    // highlight the tapped icon
    if (selectedIcon) selectedIcon.classList.remove("selected");
    icon.classList.add("selected");
    selectedIcon = icon;

    // open its window
    const win = document.querySelector("#" + icon.dataset.window);
    openWindow(win);
  });
});

// the "kyoiiOS" name in the top bar re-opens the welcome window
document.querySelector("#welcomeopen").addEventListener("click", () => openWindow(welcomeWin));


/* ─────────────────────────────────────────────
   6b. DOCK  (taskbar that opens / focuses apps)
───────────────────────────────────────────── */
document.querySelectorAll(".dock-item").forEach((item) => {
  item.addEventListener("click", () => {
    openWindow(document.querySelector("#" + item.dataset.window));
  });
});


/* ─────────────────────────────────────────────
   6c. PET CAT  (blinks, looks at your cursor, purrs when pet)
───────────────────────────────────────────── */
const petcat = document.querySelector("#petcat");
const eyesOpen = petcat.querySelector(".eyes-open");
const eyesHappy = petcat.querySelector(".eyes-happy");

// blink every few seconds (but not mid-drag)
setInterval(() => {
  if (petcat.classList.contains("dragging")) return;
  petcat.classList.add("blink");
  setTimeout(() => petcat.classList.remove("blink"), 250);
}, 3500);

// drag to move the cat anywhere; a tap (barely moving) pets it
let pcDown = false, pcMoved = 0, pcStartX = 0, pcStartY = 0, pcLeft = 0, pcTop = 0;

petcat.addEventListener("pointerdown", (e) => {
  pcDown = true; pcMoved = 0;
  const r = petcat.getBoundingClientRect();
  petcat.style.left = r.left + "px";   // pin so we can move it freely
  petcat.style.top = r.top + "px";
  petcat.style.right = "auto";
  petcat.style.bottom = "auto";
  pcStartX = e.clientX; pcStartY = e.clientY;
  pcLeft = r.left; pcTop = r.top;
  petcat.setPointerCapture(e.pointerId);
});

petcat.addEventListener("pointermove", (e) => {
  if (!pcDown) return;
  const dx = e.clientX - pcStartX, dy = e.clientY - pcStartY;
  pcMoved += Math.abs(dx) + Math.abs(dy);
  if (pcMoved > 6) petcat.classList.add("dragging");
  const maxX = window.innerWidth - petcat.offsetWidth;
  const maxY = window.innerHeight - petcat.offsetHeight;
  petcat.style.left = Math.max(0, Math.min(maxX, pcLeft + dx)) + "px";
  petcat.style.top = Math.max(40, Math.min(maxY, pcTop + dy)) + "px";
});

petcat.addEventListener("pointerup", (e) => {
  if (!pcDown) return;
  pcDown = false;
  petcat.classList.remove("dragging");
  if (pcMoved < 6) petCat(e.clientX, e.clientY);   // a tap means a pet
});

function petCat(x, y) {
  petcat.classList.remove("bounce");
  void petcat.offsetWidth;             // restart the bounce animation
  petcat.classList.add("bounce");
  eyesOpen.style.display = "none";     // happy eyes for a moment
  eyesHappy.style.display = "";
  setTimeout(() => {
    eyesOpen.style.display = "";
    eyesHappy.style.display = "none";
  }, 800);
  playPurr();
  spawnHearts(x, y);
}

// little floating hearts (drawn with our own heart icon)
function spawnHearts(x, y) {
  const NS = "http://www.w3.org/2000/svg";
  for (let i = 0; i < 5; i++) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "heart");
    svg.setAttribute("viewBox", "0 0 32 32");
    const use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#ic-heart");
    svg.appendChild(use);
    svg.style.left = (x - 11 + (Math.random() * 40 - 20)) + "px";
    svg.style.top = (y - 11) + "px";
    svg.style.animationDelay = (i * 0.06) + "s";
    document.body.appendChild(svg);
    setTimeout(() => svg.remove(), 1300);
  }
}


/* ─────────────────────────────────────────────
   7. GRIMOIRE (notes) CONTENT
   add / edit objects in the `notes` list below and the
   sidebar + reader update automatically. content can be HTML.
───────────────────────────────────────────── */
const notes = [
  {
    title: "welcome to my grimoire",
    date: "entry i",
    body: `
      <h2>✶ a little book of me ✶</h2>
      <p>this is where i scribble the things rattling around my head:
      books i'm reading, art i'm making, and memes i refuse to stop thinking about.</p>
      <blockquote>"not all those who wander are lost", but i definitely am ♡</blockquote>
      <p>click around the tabs on the left to read more ‧₊˚🕯️</p>
    `,
  },
  {
    title: "currently reading",
    date: "📚 shelf",
    body: `
      <h2>📚 on my nightstand</h2>
      <p>i'm a forever-reader. right now i've got a teetering stack of:</p>
      <ul>
        <li>✦ <strong>a cozy fantasy</strong>, for the soft magical feelings</li>
        <li>✦ <strong>a mystery</strong>, i never guess the ending (i love that)</li>
        <li>✦ <strong>The Secret History by Donna Tartt</strong>, the literary equivalent of a warm blanket</li>
      </ul>
    `,
  },
  {
    title: "art corner",
    date: "🎨 studio",
    body: `
      <h2>🎨 things i've been drawing</h2>
      <p>lately it's been a lot of: fuzzy cat doodles, cluttered cozy rooms,
      and characters with way too many hair clips.</p>
      <blockquote>art is just memes with feelings (and better lighting)</blockquote>
    `,
  },
  {
    title: "the meme vault",
    date: "🗝️ classified",
    body: `
      <h2>🗝️ the meme vault</h2>
      <p>a sacred archive. handle with care.</p>
      <p><span class="meme">me: i'll read one chapter<br>also me: 3am, book 4</span></p>
      <p><span class="meme">my cat watching me reorganize my bookshelf for the 5th time 🐈‍⬛</span></p>
    `,
  },
];

const sidebar = document.querySelector("#grimoireSidebar");
const reader  = document.querySelector("#grimoireContent");

function showNote(index) {
  reader.innerHTML = notes[index].body;
  // highlight the active tab
  sidebar.querySelectorAll(".note-tab").forEach((t, i) => {
    t.classList.toggle("active", i === index);
  });
}

function buildSidebar() {
  notes.forEach((note, index) => {
    const tab = document.createElement("div");
    tab.className = "note-tab";
    tab.innerHTML = `
      <p class="note-title">${note.title}</p>
      <p class="note-date">${note.date}</p>
    `;
    tab.addEventListener("click", () => showNote(index));
    sidebar.appendChild(tab);
  });
  showNote(0);                                 // show the first note by default
}
buildSidebar();


/* ─────────────────────────────────────────────
   8. on load: greet with the welcome window open ♡
───────────────────────────────────────────── */
openWindow(welcomeWin, { silent: true });
