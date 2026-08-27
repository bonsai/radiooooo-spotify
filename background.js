// Radiooooo -> Spotify background
// Applies the chosen display mode (popup default, footer, or side panel).

function applyMode(mode) {
  if (mode === "sidebar") {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(() => {});
    chrome.action.setPopup({ popup: "" }).catch(() => {});
  } else {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: false })
      .catch(() => {});
    chrome.action.setPopup({ popup: "popup.html" }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("ro_mode", (d) => applyMode(d.ro_mode || "popup"));
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "setMode") applyMode(msg.mode);
});
