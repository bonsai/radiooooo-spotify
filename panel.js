// Shared UI logic for the popup and the side panel.

const songEl = document.getElementById("song");
const linkEl = document.getElementById("link");
const noteEl = document.getElementById("note");
const radios = Array.from(document.querySelectorAll('input[name="mode"]'));

function fill(text) {
  if (text && text.trim()) {
    songEl.textContent = text.trim();
    songEl.classList.remove("empty");
    linkEl.href = "https://open.spotify.com/search/" + encodeURIComponent(text.trim());
    linkEl.classList.remove("disabled");
  } else {
    songEl.textContent = "まだ曲が取得されていません";
    songEl.classList.add("empty");
    linkEl.removeAttribute("href");
    linkEl.classList.add("disabled");
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

// live updates from the content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "song" && msg.text) fill(msg.text);
});

// load stored state
chrome.storage.local.get(["ro_song", "ro_mode"], (d) => {
  fill(d.ro_song);
  applyModeUI(d.ro_mode || "popup");
});

// keep in sync while open
setInterval(() => {
  chrome.storage.local.get(["ro_song", "ro_mode"], (d) => {
    fill(d.ro_song);
    applyModeUI(d.ro_mode || "popup");
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
