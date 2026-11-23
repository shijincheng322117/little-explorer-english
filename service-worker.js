// Service Worker：离线缓存全部页面、图片、音频，cache-first 策略
// 版本号：升级时改名即可强制更新缓存
var CACHE_NAME = "little-explorer-v3-four-themes";

// 安装时必缓存的静态资源（相对路径，GitHub Pages 子路径可用）
var STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./words.json",
  // 小游戏英文指令语音（words.json 之外硬编码引用的 3 条）
  "./audio/en_load_truck.mp3",
  "./audio/en_listen.mp3",
  "./audio/en_feed_trex.mp3"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    (async function () {
      var cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      // 动态读取 words.json，把全部图片和音频加入缓存
      try {
        var res = await fetch("./words.json");
        var data = await res.json();
        var dynamicAssets = [];
        for (var ti = 0; ti < (data.themes || []).length; ti++) {
          var items = data.themes[ti].items || [];
          for (var j = 0; j < items.length; j++) {
            if (items[j].image) dynamicAssets.push(items[j].image);
            if (items[j].questionAudio) dynamicAssets.push(items[j].questionAudio);
            if (items[j].wordAudio) dynamicAssets.push(items[j].wordAudio);
          }
        }
        // 固定语音也缓存
        if (data.praise) {
          if (data.praise.great) dynamicAssets.push(data.praise.great);
          if (data.praise.awesome) dynamicAssets.push(data.praise.awesome);
        }
        if (data.tryAgain) dynamicAssets.push(data.tryAgain);
        if (data.restPrompt) dynamicAssets.push(data.restPrompt);
        if (data.celebration) dynamicAssets.push(data.celebration);
        for (var k = 0; k < dynamicAssets.length; k++) {
          try {
            await cache.add(dynamicAssets[k]);
          } catch (e) {
            // 单个资源缺失不影响整体安装（如占位图片、未生成的音频）
          }
        }
      } catch (e) {
        // words.json 读取失败时仍保留静态缓存
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 缓存优先，命中则直接返回，否则走网络
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
