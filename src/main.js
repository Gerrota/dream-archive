/* =========================================================
   回家种苞米 · 入口 / 场景系统
   ---------------------------------------------------------
   一个场景 = 一个函数，签名统一：

       loadScene(mount, ctx) → { el, done, destroy }

       mount   : 挂载点（.stage）
       ctx     : { from } —— 从哪个场景切过来的（可为 null）
       el      : 场景根元素
       done    : Promise，resolve(下一个场景名) 表示"这一幕演完了"
       destroy : 卸载（切场景时由这里调用）

   加新的一幕只要三步：
       1. 写 src/scenes/xxx.js，导出 loadXxxScene
       2. 在下面 scenes 表里注册
       3. 上一幕把 resolve 的名字对上
   ---------------------------------------------------------
   兼容性注意：这里**不用**顶层 await /  async-await，
   统一走 Promise.then —— 顶层 await 要 iOS15+ 才支持，
   老手机会整个模块报错、直接黑屏。
   ========================================================= */

(function boot() {

  /* 所有自己的模块都带同一个 build 时间戳加载 ——
     手机上每次打开都拿最新的 js，不会被浏览器缓存住。
     时间戳由 index.html 头部那段小脚本写在 window.__BUILD 上。 */
  var BUILD = window.__BUILD || Date.now();
  var V = "?b=" + BUILD;

  Promise.all([
    import("./scenes/opening.js" + V),
    import("./scenes/archive.js" + V),
    import("./scenes/chapter3.js" + V),
    import("./scenes/style.js" + V),
    import("./scenes/notice.js" + V),
    import("./components/transition.js" + V),
    import("./components/bgm.js" + V)
  ]).then(function (mods) {

    var loadOpeningScene  = mods[0].loadOpeningScene;
    var loadArchiveScene  = mods[1].loadArchiveScene;
    var loadChapter3Scene = mods[2].loadChapter3Scene;
    var loadStyleScene    = mods[3].loadStyleScene;
    var loadNoticeScene   = mods[4].loadNoticeScene;
    var toBlack   = mods[5].toBlack;
    var fromBlack = mods[5].fromBlack;
    var isBlack   = mods[5].isBlack;
    var initBgm   = mods[6].initBgm;

    var stage = document.getElementById("stage");

    var scenes = {
      opening: loadOpeningScene,
      archive: loadArchiveScene,
      chapter3: loadChapter3Scene,
      style: loadStyleScene,
      words: loadNoticeScene

      // 键名要跟第三幕 resolve 出来的 id 对上：
      //   style  → 风格档案（第四幕）
      //   words  → WORDS 须知页（第五幕）
      //   voice / vision 走的是 EXTERNAL_LINKS（金山文档），不在这里注册
      //   有空位的话：wordsArchive = 真正的 WordsPage
    };

    var current = null;
    var currentName = null;

    function goToScene(name) {
      var load = scenes[name];

      if (!load) {
        console.warn("[回家种苞米] 没有注册这个场景：" + name + "（先在 main.js 的 scenes 表里加一行）");
        return null;
      }

      /* ① 卸掉上一个场景（把"从哪来"记下来，场景可以用它决定要不要重放开场） */
      var from = currentName;
      if (current) {
        try { current.destroy(); } catch (err) { console.error(err); }
      }
      current = null;
      currentName = name;
      stage.innerHTML = "";

      /* ② 挂上新场景 */
      var scene = load(stage, { from: from });
      current = scene;

      /* ③ 从黑幕里浮出来 */
      fromBlack({ duration: 1.2, delay: 0.15 });

      /* ④ 等这一幕喊"演完了" → 黑下去 → 切下一幕

         done 有两种写法，这里统一按 .then(cb) 处理：
           ① Promise          —— 只有一个出口的场景（多数用这种）
           ② { then(cb) } 订阅 —— 一页有好几个出口的场景，
                                 可以喊很多次（比如须知页：回轮盘 / 进 WORDS）
         场景只要给个带 then 的东西就行，内部是不是 Promise 无所谓。 */
      function onSceneDone(next) {

        if (!next || current !== scene) return;

        /* 目标场景还没做：只提示，不卡死 ——
           这一页剩下的出口（回轮盘之类）照样能用 */
        if (!scenes[next]) {
          console.warn("[回家种苞米] 下一幕还没注册：" + next + "（在 main.js 的 scenes 表里加上它）");
          return;
        }

        /* 上一幕自己已经黑到位就不用再等一次 */
        if (isBlack()) { goToScene(next); return; }

        toBlack({ duration: 0.6 }).then(function () { goToScene(next); });
      }

      if (scene.done && typeof scene.done.then === "function") {
        scene.done.then(onSceneDone);
      }

      return scene;
    }

    /* ---------- 对外接口 / 调试 ---------- */
    window.Game = {
      goToScene: goToScene,
      scenes: scenes,
      stage: stage,
      build: BUILD,

      get current() { return current; },
      get currentName() { return currentName; },

      /* 从头再来一遍 */
      restart: function () {
        toBlack({ duration: 0.6 }).then(function () { goToScene("opening"); });
      }
    };

    /* ---------- 全站背景音乐 ----------
       不属于任何场景：挂在 body 上，切场景不断、也不会被 destroy。
       具体播放策略（自动播放被拦怎么办）见 components/bgm.js。
       加新场景不用管它。 */
    initBgm();

    /* ---------- 起跑 ---------- */
    /* 手机预览用：加 ?scene=chapter3 就直接从那一幕开始，不加则从头放 */
    var wanted = null;
    try { wanted = new URLSearchParams(location.search).get("scene"); } catch (err) {}

    goToScene(scenes[wanted] ? wanted : "opening");

  }).catch(function (err) {
    console.error("[回家种苞米] 模块加载失败：", err);
  });

})();


/* =========================================================
   开发预览：代码一改，页面自动重载

   本地预览服务器（serve.py）提供了一个 /__build 接口，
   内容随代码文件的修改时间变化。页面每隔几秒问一次，
   一发现变了就自动刷新 —— 手机上就不用反复手动刷了。

   换别的服务器（Live Server 等）或直接 file:// 打开时，
   这个请求会失败，脚本会自己停掉，不影响正常使用。
   ========================================================= */
(function watchBuild() {

  /* ★ 只在本地预览时启用。
     线上（GitHub Pages 之类）没有 /__build 这个接口，
     不拦住的话每次打开都会白打一个 404 —— 而且 fetch("/__build") 是根路径，
     放到子目录部署时本来也取不到。 */
  var host = location.hostname;
  var isLocal = host === "" ||
                host === "localhost" ||
                host === "127.0.0.1" ||
                host === "0.0.0.0" ||
                /^192\.168\./.test(host) ||
                /^10\./.test(host) ||
                /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
                /\.local$/.test(host);

  if (!isLocal) return;

  var token = null;
  var fails = 0;
  var timer = null;

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function check() {
    fetch("/__build?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (v) {
        fails = 0;
        v = (v || "").trim();
        if (!v) { stop(); return; }              // 不是本地服务器起的，不打扰
        if (token === null) { token = v; return; }
        if (v !== token) {
          stop();
          reloadKeepingScene();                  // 代码变了 → 自动重载
        }
      })
      .catch(function () {
        fails += 1;
        if (fails >= 3) stop();                  // 连不上就不再问了
      });
  }

  /* 重载时把"当前在哪一幕"带上（?scene=xxx），
     否则会从第一幕重新开始 —— 用户会以为"轮盘怎么没了"。
     页面在后台就先不做，等切回来再重载，别打断。 */
  function reloadKeepingScene() {

    function run() {
      var name = window.Game && window.Game.currentName;
      var q = location.search.replace(/^\?/, "").split("&").filter(function (s) {
        return s && s.indexOf("scene=") !== 0;
      });
      if (name) q.push("scene=" + name);
      location.replace(location.pathname + (q.length ? "?" + q.join("&") : ""));
    }

    if (document.hidden) {
      document.addEventListener("visibilitychange", function onVis() {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onVis);
        run();
      });
    } else {
      run();
    }
  }

  check();
  timer = setInterval(check, 4000);

})();
