// Shared UI logic for the popup and the side panel.

const songEl = document.getElementById("song");
const linkEl = document.getElementById("link");
const noteEl = document.getElementById("note");
const copyBtn = document.getElementById("copy");
const playlistEl = document.getElementById("playlist");
const clearBtn = document.getElementById("clear");
const radios = Array.from(document.querySelectorAll('input[name="mode"]'));

function spotifyUrl(text) {
  return "https://open.spotify.com/search/" + encodeURIComponent(text.trim());
}

function fill(text) {
  if (text && text.trim()) {
    songEl.textContent = text.trim();
    songEl.classList.remove("empty");
    linkEl.href = spotifyUrl(text);
    linkEl.classList.remove("disabled");
    copyBtn.disabled = false;
  } else {
    songEl.textContent = "まだ曲が取得されていません";
    songEl.classList.add("empty");
    linkEl.removeAttribute("href");
    linkEl.classList.add("disabled");
    copyBtn.disabled = true;
  }
}

function applyModeUI(mode) {
  radios.forEach((r) => (r.checked = r.value === mode));
  if (mode === "footer") {
    noteEl.textContent = "ページ下部に緑のバーが表示されます（クリックで開く）。";
  } else if (mode === "sidebar") {
    noteEl.textContent = "アイコンをクリックでサイドバーが開きます。";
  } else {
    noteEl.textContent = "アイコンをクリックでポップアップが開きます。";
  }
}

function renderPlaylist(list) {
  playlistEl.innerHTML = "";
  if (!list || !list.length) {
    playlistEl.innerHTML = '<div class="empty">履歴はまだありません</div>';
    return;
  }
  list
    .slice()
    .reverse()
    .forEach((item) => {
      const a = document.createElement("a");
      a.href = spotifyUrl(item.text);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = item.text;
      playlistEl.appendChild(a);
    });
}

// live updates from the content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "song" && msg.text) fill(msg.text);
});

copyBtn.addEventListener("click", () => {
  const text = songEl.textContent.trim();
  if (!text || songEl.classList.contains("empty")) return;
  navigator.clipboard.writeText(text).then(
    () => {
      const old = copyBtn.textContent;
      copyBtn.textContent = "コピーしました ✓";
      setTimeout(() => (copyBtn.textContent = old), 1200);
    },
    () => {}
  );
});

clearBtn.addEventListener("click", () => {
  chrome.storage.local.set({ ro_playlist: [] });
  renderPlaylist([]);
});

// load stored state
chrome.storage.local.get(["ro_song", "ro_mode", "ro_playlist"], (d) => {
  fill(d.ro_song);
  applyModeUI(d.ro_mode || "popup");
  renderPlaylist(d.ro_playlist);
});

// keep in sync while open
setInterval(() => {
  chrome.storage.local.get(["ro_song", "ro_mode", "ro_playlist"], (d) => {
    fill(d.ro_song);
    applyModeUI(d.ro_mode || "popup");
    renderPlaylist(d.ro_playlist);
  });
}, 1500);

// mode selection
radios.forEach((r) => {
  r.addEventListener("change", () => {
    if (!r.checked) return;
    chrome.storage.local.set({ ro_mode: r.value });
    const p = chrome.runtime.sendMessage({ type: "setMode", mode: r.value });
    if (p && typeof p.catch === "function") p.catch(() => {});
    applyModeUI(r.value);
  });
});
