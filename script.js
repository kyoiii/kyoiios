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
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.querySelector("#clock").textContent = "♡ " + time;
}
tickClock();
setInterval(tickClock, 1000);


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
   3. OPEN / CLOSE
───────────────────────────────────────────── */
function openWindow(win) {
  win.style.display = "flex";
  bringToFront(win);
}
function closeWindow(win) {
  win.style.display = "none";
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
      <p>this is where i scribble the things rattling around my head —
      books i'm reading, art i'm making, and memes i refuse to stop thinking about.</p>
      <blockquote>"not all those who wander are lost" — but i definitely am ♡</blockquote>
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
        <li>✦ <strong>a cozy fantasy</strong> — for the soft magical feelings</li>
        <li>✦ <strong>a mystery</strong> — i never guess the ending (i love that)</li>
        <li>✦ <strong>The Secret History by Donna Tartt</strong> — the literary equivalent of a warm blanket</li>
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
openWindow(welcomeWin);
