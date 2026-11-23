// 小探险家英语主逻辑：纯静态、无框架、相对路径、iPhone竖屏大按钮
// 页面只有 index.html 一个舞台，所有界面用 JS 切换渲染
(function () {
  "use strict";

  // ---------- 全局状态 ----------
  var DATA = null; // words.json 全部词库
  var stars = 0; // 星星数，存 localStorage
  var audioUnlocked = false; // iOS 首次点击解锁音频
  var restTimer = null; // 8分钟休息计时器
  var quizState = null; // 当前听音选图进度

  // ---------- 图片缺失时的 emoji 兜底（开发初期无真实图片可用） ----------
  var EMOJI = {
    excavator: "🚜", dump_truck: "🚛", road_roller: "🛞", cement_mixer: "🌀",
    crane: "🏗️", bulldozer: "🚜", loader: "🚜", forklift: "🏭",
    car: "🚗", bus: "🚌", truck: "🚚", train: "🚂", bike: "🚲", taxi: "🚕",
    ambulance: "🚑", fire_truck: "🚒", police_car: "🚓", airplane: "✈️",
    boat: "🚤", helicopter: "🚁",
    t_rex: "🦖", triceratops: "🦕", stegosaurus: "🦕",
    dinosaur_egg: "🥚", volcano: "🌋", fossil: "🦴",
    dog: "🐶", cat: "🐱", duck: "🦆", bear: "🐻", rabbit: "🐰", monkey: "🐵"
  };

  // ---------- 小工具：取元素 ----------
  function $(id) { return document.getElementById(id); }

  // ---------- 星星：读取 / 保存 / 显示 ----------
  function loadStars() {
    try {
      stars = parseInt(localStorage.getItem("lee_stars") || "0", 10) || 0;
    } catch (e) { stars = 0; }
    renderStars();
  }
  function addStar(n) {
    stars += (n || 1);
    try { localStorage.setItem("lee_stars", String(stars)); } catch (e) {}
    renderStars();
  }
  function renderStars() { $("starCount").textContent = String(stars); }

  // ---------- 音频：播放本地 mp3，缺失则静默跳过 ----------
  function playAudio(path) {
    if (!path) return;
    try {
      var a = new Audio(path);
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  // ---------- iOS 音频解锁：第一次点击任意处解锁 ----------
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      var a = new Audio();
      a.play().catch(function () {});
    } catch (e) {}
    $("audioUnlock").classList.add("hidden");
  }

  // ---------- 休息计时：单次 8 分钟后弹休息界面 ----------
  function startRestTimer() {
    stopRestTimer();
    restTimer = setTimeout(function () {
      $("restOverlay").classList.remove("hidden");
      playAudio("audio/rest_prompt.mp3");
    }, 8 * 60 * 1000);
  }
  function stopRestTimer() {
    if (restTimer) { clearTimeout(restTimer); restTimer = null; }
  }

  // ---------- 数组洗牌 ----------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- 图片标签：真实图片优先，失败自动降级为 emoji ----------
  function imgTag(item) {
    var fb = EMOJI[item.id] || "⭐";
    // 先放 emoji，图片盖在上面；图片404则隐藏自己露出 emoji
    return '<span class="pic-fb">' + fb + '</span>' +
      '<img src="' + item.image + '" alt="" onerror="this.style.display=\'none\'">';
  }

  // ---------- 首页：4 张 2x2 超大主题卡片 ----------
  function renderHome() {
    quizState = null;
    var stage = $("stage");
    var html = '<div class="home-grid">';
    DATA.themes.forEach(function (th) {
      var cn = { construction: "工程车", cars: "汽车", dinosaurs: "恐龙", animals: "动物" }[th.id] || th.name;
      html += '<button class="theme-card" data-theme="' + th.id + '">' +
        '<span>' + th.icon + '</span><span class="cn">' + cn + '</span></button>';
    });
    html += "</div>";
    stage.innerHTML = html;
    stage.querySelectorAll(".theme-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        unlockAudio();
        openTheme(btn.getAttribute("data-theme"));
      });
    });
  }

  // ---------- 进入主题：有站点的显示站点，无站点的直接开始听音选图 ----------
  function openTheme(themeId) {
    var th = null;
    DATA.themes.forEach(function (t) { if (t.id === themeId) th = t; });
    if (!th) return;
    if (th.stations && th.stations.length > 0) {
      renderStations(th);
    } else {
      // Dinosaurs / Animals：无站点，直接 3 选 1 听音选图
      startQuiz(th, null);
    }
  }

  // ---------- 站点页：Construction 5个 / Cars 4个超大图标 ----------
  function renderStations(th) {
    var stage = $("stage");
    var html = "";
    if (th.id === "construction") {
      html += '<div class="quiz-title">🚜 工地站点</div>';
    } else if (th.id === "cars") {
      html += '<div class="quiz-title">🚗 交通场景</div>';
    }
    html += '<div class="station-grid">';
    th.stations.forEach(function (st) {
      html += '<button class="station-card" data-st="' + st.id + '">' +
        '<span>' + st.icon + '</span><span class="cn">' + st.name + '</span></button>';
    });
    // 恐龙/动物附加小游戏入口（Dinosaurs 有喂恐龙）
    if (th.id === "dinosaurs") {
      html += '<button class="station-card" data-game="feed">🦖<span class="cn">Feed</span></button>';
    }
    html += "</div>";
    stage.innerHTML = html;
    stage.querySelectorAll("[data-st]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        unlockAudio();
        startQuiz(th, btn.getAttribute("data-st"));
      });
    });
    var feed = stage.querySelector('[data-game="feed"]');
    if (feed) feed.addEventListener("click", function () { unlockAudio(); startFeedGame(th); });
  }

  // ---------- 听音选图：每次 3 选项，答对+1星，站点满3题解锁小游戏 ----------
  function startQuiz(th, stationId) {
    var pool = th.items.filter(function (it) {
      if (it.difficulty !== "core") return false;
      if (stationId && it.station !== stationId) return false;
      return true;
    });
    if (pool.length === 0) pool = th.items.slice();
    quizState = { th: th, stationId: stationId, pool: shuffle(pool), idx: 0, total: Math.min(3, pool.length) };
    renderQuizQ();
  }

  function renderQuizQ() {
    var q = quizState;
    var stage = $("stage");
    if (q.idx >= q.total) {
      renderQuizDone(q);
      return;
    }
    var target = q.pool[q.idx % q.pool.length];
    // 干扰项：同主题随机 2 个不同词
    var others = shuffle(q.pool.filter(function (it) { return it.id !== target.id; })).slice(0, 2);
    var opts = shuffle([target].concat(others));
    var html = '<div class="quiz-title">👂 听一听，点一点</div>' +
      '<div class="quiz-progress">⭐ ' + (q.idx + 1) + " / " + q.total + "</div>" +
      '<div class="quiz-grid">';
    opts.forEach(function (it) {
      html += '<button class="quiz-opt" data-id="' + it.id + '">' + imgTag(it) + "</button>";
    });
    html += "</div>";
    stage.innerHTML = html;
    // 自动播放题目语音
    setTimeout(function () { playAudio(target.questionAudio); }, 300);
    // 点题目区重播
    stage.querySelector(".quiz-title").addEventListener("click", function () {
      playAudio(target.questionAudio);
    });
    stage.querySelectorAll(".quiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("good") || btn.classList.contains("bad")) return;
        if (btn.getAttribute("data-id") === target.id) {
          // 答对：放大跳动 + 单词发音 + 表扬 + 星星
          btn.classList.add("good");
          playAudio(target.wordAudio);
          setTimeout(function () {
            playAudio(Math.random() < 0.5 ? DATA.praise.great : DATA.praise.awesome);
          }, 700);
          addStar(1);
          setTimeout(function () { q.idx++; renderQuizQ(); }, 1200);
        } else {
          // 答错：摇晃 + Try again
          btn.classList.add("bad");
          playAudio(DATA.tryAgain);
          setTimeout(function () { btn.classList.remove("bad"); }, 500);
        }
      });
    });
  }

  // ---------- 本轮完成：表扬 + 小游戏入口 ----------
  function renderQuizDone(q) {
    var stage = $("stage");
    playAudio(DATA.celebration);
    var html = '<div class="quiz-title">🎉 太棒了！</div><div class="game-row">';
    if (q.th.id === "construction") {
      html += '<button class="game-opt" id="goLoad">🚛<div style="font-size:18px">装车</div></button>';
    } else if (q.th.id === "cars") {
      html += '<button class="game-opt" id="goSound">🔊<div style="font-size:18px">听声</div></button>';
    } else if (q.th.id === "dinosaurs") {
      html += '<button class="game-opt" id="goFeed">🦖<div style="font-size:18px">喂恐龙</div></button>';
    }
    html += '<button class="game-opt" id="goAgain">🔁<div style="font-size:18px">再玩</div></button></div>';
    stage.innerHTML = html;
    var again = $("goAgain");
    if (again) again.addEventListener("click", function () { startQuiz(q.th, q.stationId); });
    var gl = $("goLoad");
    if (gl) gl.addEventListener("click", function () { startLoadGame(q.th); });
    var gs = $("goSound");
    if (gs) gs.addEventListener("click", function () { startSoundGame(q.th); });
    var gf = $("goFeed");
    if (gf) gf.addEventListener("click", function () { startFeedGame(q.th); });
  }

  // ---------- 装车小游戏（Construction）：点 excavator/loader 装车 ----------
  function startLoadGame(th) {
    var stage = $("stage");
    function pick(list, n) { return shuffle(list).slice(0, n); }
    var rightPool = th.items.filter(function (it) { return it.id === "excavator" || it.id === "loader"; });
    var wrongPool = th.items.filter(function (it) { return it.id !== "excavator" && it.id !== "loader"; });
    var target = rightPool[Math.floor(Math.random() * rightPool.length)] || th.items[0];
    var opts = shuffle([target].concat(pick(wrongPool, 2)));
    var html = '<div class="quiz-title">🚛 Load the dump truck!</div>' +
      '<div class="game-big">🚛<span id="soilBox"></span></div>' +
      '<div class="game-row">';
    opts.forEach(function (it) {
      html += '<button class="game-opt" data-id="' + it.id + '">' + imgTag(it) + "</button>";
    });
    stage.innerHTML = html + "</div>";
    setTimeout(function () { playAudio("audio/word_dump_truck.mp3"); }, 300);
    stage.querySelectorAll(".game-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        if (id === "excavator" || id === "loader") {
          btn.classList.add("good");
          // 土块飞进车斗动画 + dig 音效 + 星星
          $("soilBox").innerHTML = '<span class="soil">🟤</span>';
          playAudio("audio/sfx_dig.mp3");
          setTimeout(function () { playAudio(DATA.praise.great); }, 600);
          addStar(1);
          setTimeout(function () { startLoadGame(th); }, 1400);
        } else {
          btn.classList.add("bad");
          playAudio(DATA.tryAgain);
          setTimeout(function () { btn.classList.remove("bad"); }, 500);
        }
      });
    });
  }

  // ---------- 声音配对（Cars）：播音效点对车 ----------
  function startSoundGame(th) {
    var stage = $("stage");
    var pool = th.items.filter(function (it) { return it.difficulty === "core"; });
    var target = pool[Math.floor(Math.random() * pool.length)];
    var others = shuffle(pool.filter(function (it) { return it.id !== target.id; })).slice(0, 2);
    var opts = shuffle([target].concat(others));
    var html = '<div class="quiz-title">🔊 哪个在叫？点一点</div><div class="game-row">';
    opts.forEach(function (it) {
      html += '<button class="game-opt" data-id="' + it.id + '">' + imgTag(it) + "</button>";
    });
    stage.innerHTML = html + "</div>";
    // 优先播 sfx，不存在则回退到单词发音
    setTimeout(function () {
      var sfxMap = {
        car: "audio/sfx_car_beep.mp3", bus: "audio/sfx_bus_horn.mp3",
        train: "audio/sfx_train_choo.mp3", ambulance: "audio/sfx_ambulance_weeoo.mp3",
        fire_truck: "audio/sfx_fire_siren.mp3", police_car: "audio/sfx_police_weeoo.mp3",
        airplane: "audio/sfx_airplane_whoosh.mp3", helicopter: "audio/sfx_helicopter_whir.mp3",
        boat: "audio/sfx_boat_horn.mp3"
      };
      playAudio(sfxMap[target.id] || target.wordAudio);
    }, 300);
    stage.querySelectorAll(".game-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-id") === target.id) {
          btn.classList.add("good");
          playAudio(DATA.praise.great);
          addStar(1);
          setTimeout(function () { startSoundGame(th); }, 1300);
        } else {
          btn.classList.add("bad");
          playAudio(DATA.tryAgain);
          setTimeout(function () { btn.classList.remove("bad"); }, 500);
        }
      });
    });
  }

  // ---------- 喂恐龙（Dinosaurs）：点红苹果喂 T-Rex ----------
  function startFeedGame(th) {
    var stage = $("stage");
    var foods = [
      { id: "apple_red", icon: "🍎", ok: true },
      { id: "apple_blue", icon: "🫐", ok: false },
      { id: "banana", icon: "🍌", ok: false }
    ];
    var html = '<div class="quiz-title">🦖 Feed the T-Rex!</div>' +
      '<div class="game-big" id="dinoMouth">🦖</div>' +
      '<div class="game-row">';
    shuffle(foods).forEach(function (f) {
      html += '<button class="game-opt" data-ok="' + (f.ok ? "1" : "0") + '">' + f.icon + "</button>";
    });
    stage.innerHTML = html + "</div>";
    setTimeout(function () { playAudio("audio/q_t_rex.mp3"); }, 300);
    stage.querySelectorAll(".game-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-ok") === "1") {
          btn.classList.add("good");
          // 恐龙咀嚼：嘴巴开合两次 + 表扬
          var mouth = $("dinoMouth");
          mouth.textContent = "😮";
          setTimeout(function () { mouth.textContent = "🦖"; }, 350);
          playAudio(DATA.praise.awesome);
          addStar(1);
          setTimeout(function () { startFeedGame(th); }, 1400);
        } else {
          btn.classList.add("bad");
          playAudio(DATA.tryAgain);
          setTimeout(function () { btn.classList.remove("bad"); }, 500);
        }
      });
    });
  }

  // ---------- 启动：加载词库 → 首页 → 计时器 → 注册 SW ----------
  function init() {
    loadStars();
    // 返回首页按钮
    $("homeBtn").addEventListener("click", function () {
      unlockAudio();
      $("restOverlay").classList.add("hidden");
      if (DATA) renderHome();
    });
    $("restHomeBtn").addEventListener("click", function () {
      $("restOverlay").classList.add("hidden");
      if (DATA) renderHome();
    });
    // 音频解锁按钮
    $("unlockBtn").addEventListener("click", function () { unlockAudio(); });
    // 首次进入提示解锁（iOS 需要手势）
    setTimeout(function () {
      if (!audioUnlocked) $("audioUnlock").classList.remove("hidden");
    }, 500);

    // 加载词库（相对路径，GitHub Pages 子路径可用）
    fetch("words.json").then(function (r) {
      if (!r.ok) throw new Error("words.json load failed");
      return r.json();
    }).then(function (data) {
      DATA = data;
      renderHome();
      startRestTimer();
    }).catch(function () {
      $("stage").innerHTML = '<div class="quiz-title">😢 加载失败，请刷新重试</div>';
    });

    // 注册 Service Worker（离线缓存，file:// 下静默跳过）
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("service-worker.js").catch(function () {});
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
