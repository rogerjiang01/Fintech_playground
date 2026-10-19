/* 離線版（Plan B）Service Worker
   ・第一次在有網路時開啟：把下列檔案存進快取
   ・之後一律優先從快取讀取，沒有網路也能開
   ・更新內容時：修改 CACHE_VERSION 後重新部署，iPad 連網從主畫面開啟一次即會更新 */
const CACHE_VERSION = "planb-2026-10-19-v2";
const FILES = ["index_planb.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // 外部連結（問卷、下載頁）不處理

    // 開啟頁面：一律回傳快取中的 index_planb.html（忽略網址參數）
    if (req.mode === "navigate") {
        event.respondWith(
            caches.open(CACHE_VERSION)
                .then((cache) => cache.match("index_planb.html"))
                .then((cached) => cached || fetch(req))
        );
        return;
    }

    // 其他檔案：快取優先，沒有才走網路
    event.respondWith(
        caches.match(req, { ignoreSearch: true }).then((cached) => cached || fetch(req))
    );
});
