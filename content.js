// Radiooooo -> Spotify content script
// Detects the current track, stores it, and (in "footer" mode) injects a
// green footer bar that is a direct Spotify search link.

const SEL_STRATEGIES = [
  { title: ".audio-player .info .title", artist: ".audio-player .info .artist" },
  { title: ".now .info .title", artist: ".now .info .artist" },
  { title: ".audio-player .title", artist: ".audio-player .artist" },
];

// Full track info is exactly what Radiooooo's "copy" button copies:
// the textContent of every `.data-info` element inside the player, joined by spaces
// (e.g. "Amour... Amour Michel Legrand Peau D'Ane 1970").
function extractTrackInfo() {
  for (const root of [".audio-player", ".now"]) {
    const base = document.querySelector(root);
    if (!base) continue;
    const nodes = base.querySelectorAll(".data-info");
    if (nodes.length) {
      const parts = Array.from(nodes)
        .map((n) => n.textContent.replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (parts.length) return parts.join(" ");
    }
  }
  // fallback: artist + title
  for (const s of SEL_STRATEGIES) {
    const titleEl = document.querySelector(s.title);
    const artistEl = document.querySelector(s.artist);
    const title = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
    const artist = artistEl ? artistEl.textContent.replace(/\s+/g, " ").trim() : "";
    if (title || artist) return [artist, title].filter(Boolean).join(" ");
  }
  return null;
}

function spotifyUrl(text) {
  return "https://open.spotify.com/search/" + encodeURIComponent(text);
}

// Send to the extension without throwing when no receiver (popup/side panel closed).
function notify(msg) {
  try {
    const p = chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (e) {
    /* ignore */
  }
}

const STYLE = `
#ro-spotify-bar{
  position:fixed !important;
  left:0; right:0; bottom:0 !important;
  height:36px !important;
  z-index:2147483647 !important;
  background:#1db954 !important;
  color:#fff !important;
  display:flex !important;
  align-items:center !important;
  justify-content:space-between !important;
  padding:0 14px !important;
  font:600 13px/36px system-ui,"Segoe UI",sans-serif !important;
  text-decoration:none !important;
  box-shadow:0 -2px 6px rgba(0,0,0,.25) !important;
  user-select:none !important;
}
#ro-spotify-bar .ro-song{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#ro-spotify-bar .ro-cta{ flex:none; opacity:.9; margin-left:12px; }
#ro-spotify-bar:hover{ filter:brightness(1.05); }
.now, .audio-player{ bottom:36px !important; }
`;

let footer = null;
let lastSaved = "";

function saveToPlaylist(text) {
  if (text === lastSaved) return;
  lastSaved = text;
  chrome.storage.local.get("ro_playlist", (d) => {
    const list = Array.isArray(d.ro_playlist) ? d.ro_playlist : [];
    const last = list[list.length - 1];
    if (last && last.text === text) return;
    list.push({ text, ts: Date.now() });
    if (list.length > 200) list.splice(0, list.length - 200);
    chrome.storage.local.set({ ro_playlist: list });
  });
}

function ensureFooter() {
  if (footer) return;
  const style = document.createElement("style");
  style.id = "ro-spotify-style";
  style.textContent = STYLE;
  document.head.appendChild(style);
  footer = document.createElement("a");
  footer.id = "ro-spotify-bar";
  footer.target = "_blank";
  footer.rel = "noopener";
  footer.innerHTML =
    '<span class="ro-song">▶ 再生中の曲の Spotify リンクがここに表示されます</span>' +
    '<span class="ro-cta">Spotify で開く ↗</span>';
  document.body.appendChild(footer);
}

function removeFooter() {
  if (!footer) return;
  footer.remove();
  footer = null;
  const st = document.getElementById("ro-spotify-style");
  if (st) st.remove();
}

function update() {
  const np = extractTrackInfo();
  chrome.storage.local.get("ro_mode", (d) => {
    const mode = d.ro_mode || "popup";
    if (mode === "footer") ensureFooter();
    else removeFooter();

    if (np) {
      chrome.storage.local.set({ ro_song: np });
      saveToPlaylist(np);
      notify({ type: "song", text: np });
      if (footer) {
        footer.href = spotifyUrl(np);
        footer.querySelector(".ro-song").textContent = "🎵 " + np;
      }
    } else {
      if (footer) {
        footer.removeAttribute("href");
        footer.querySelector(".ro-song").textContent =
          "▶ 再生中の曲の Spotify リンクがここに表示されます";
      }
    }
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.ro_mode) update();
});

setInterval(update, 1000);
update();
