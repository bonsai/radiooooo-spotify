# Radiooooo → Spotify

Radiooooo (`app.radiooooo.com`) の再生中トラックを Spotify 検索リンクで開くブラウザ拡張機能（Chrome / Edge 共通 MV3）。

## 特徴
- **トラック情報の自動取得**: Radiooooo のプレイヤーから、コピーボタンと同じ内容（`.data-info` 要素を結合した文字列、例: `Amour... Amour Michel Legrand Peau D'Ane 1970`）を自動抽出。
- **3つの表示モード**（ポップアップ内で選択、保存される）:
  - **ポップアップ**（既定）: ツールバーアイコンをクリック
  - **フッターバー**: ページ下部に緑のバーを表示（クリックで Spotify 検索を開く）
  - **サイドバー**: アイコンクリックでサイドパネルを開く
- **クリックで Spotify 検索を開く**: トラック情報をクリックすると `open.spotify.com/search/...` を新しいタブで開く。
- **トラック情報をコピー**: パネル内の「トラック情報をコピー」ボタンで、現在のトラック情報をクリップボードへ。
- **プレイリストを本地保存**: 再生したトラックを `chrome.storage.local` に履歴（最大200件）として保存。パネルに一覧表示され、各項目をクリックで Spotify 検索を開く。「クリア」で削除可能。

## 使い方
1. `chrome://extensions`（Edge は `edge://extensions`）を開き、デベロッパーモード →「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選択。
2. `app.radiooooo.com` で再生する。
3. アイコンをクリック（ポップアップ）または選択したモードでトラック情報を確認。
4. トラック情報 / 緑バー / プレイリスト項目をクリックで Spotify 検索を開く。

## ファイル
- `manifest.json` — MV3 設定
- `background.js` — 表示モードの切り替え
- `content.js` — トラック情報抽出・プレイリスト保存・フッターバー注入
- `panel.js` — ポップアップ／サイドバー共通 UI
- `popup.html` / `sidepanel.html`

## 備考
トラック情報の抽出セレクタは Radiooooo のプレイヤー DOM（`.audio-player .data-info`）に依存。サイト側の構造変更で取得できなくなった場合は `content.js` の `extractTrackInfo()` を調整してください。
