/* =========================================================
   BGM · 全站背景音乐
   ---------------------------------------------------------
   initBgm() 由 main.js 在启动时调一次。它**不属于任何场景** ——
   挂在 body 上，所以切场景不会中断，也不会被场景的 destroy 掉。

   ★ 怎么用：把歌放成下面这个文件就行
       src/assets/bgm.mp3
     想换名字 / 换格式，改 BGM_CONFIG.src 这一行。

   ⚠️ 浏览器硬性规定：用户没点过页面就不许自动出声。
      所以：
        ① 打开页面先试着播一次（桌面端有时放行）
        ② 被拦下来就等“第一次点击 / 触摸 / 按键”，补播一次
      手机上一般必须点一下才会响，这是浏览器定的，绕不过去。

   左下角常驻开关（右下角是版本号，别打架）：
        点一下 = 开 / 关，选择记在 localStorage，下次打开还记得。

   调试（浏览器控制台）：
        BGM.playing / BGM.muted / BGM.missing
        BGM.play() / BGM.pause() / BGM.setVolume(0.2)
   ========================================================= */

export const BGM_CONFIG = {

  /* ★ 音乐文件（相对项目根目录） */
  src: "src/assets/bgm.mp3",

  volume: 0.45,        // 目标音量 0~1
  fadeIn: 2.0,         // 淡入秒数（0 = 直接到位）
  loop: true,          // 循环播放
  storageKey: "home-corn-bgm-muted"   // 记住“上次是不是关着的”

};

/* 音量渐变。把计时器挂在 audio 上，destroy 时才好收干净。 */
function fadeTo(audio, target, seconds) {

  if (audio.__fadeTimer) { clearInterval(audio.__fadeTimer); audio.__fadeTimer = null; }

  const from = audio.volume;

  if (!seconds || seconds <= 0) { audio.volume = target; return; }

  const steps = Math.max(1, Math.round(seconds * 20));
  let i = 0;

  audio.__fadeTimer = setInterval(function () {
    i += 1;
    let v = from + (target - from) * (i / steps);
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    audio.volume = v;
    if (i >= steps) { clearInterval(audio.__fadeTimer); audio.__fadeTimer = null; }
  }, 50);
}

export function initBgm(options) {

  const cfg = Object.assign({}, BGM_CONFIG, options || {});

  /* 重复初始化时先把上一套拆掉（自动重载 / 手动再调都安全） */
  if (window.BGM && typeof window.BGM.destroy === "function") {
    try { window.BGM.destroy(); } catch (err) {}
  }

  const audio = document.createElement("audio");
  audio.loop = cfg.loop;
  audio.preload = "auto";
  audio.volume = 0;
  audio.src = cfg.src;
  audio.setAttribute("playsinline", "");        /* iOS 别弹成全屏播放器 */
  audio.setAttribute("webkit-playsinline", "");
  audio.style.display = "none";

  const el = document.createElement("button");
  el.type = "button";
  el.id = "bgm-root";
  el.className = "bgm-toggle";
  el.innerHTML = '<span class="bgm-icon">&#9834;</span><span class="bgm-text"></span>';

  document.body.appendChild(audio);
  document.body.appendChild(el);

  const text = el.querySelector(".bgm-text");

  let muted = false;
  let playing = false;
  let missing = false;
  let unlockOff = null;

  try { muted = localStorage.getItem(cfg.storageKey) === "1"; } catch (err) {}

  /* ---------- 开关长什么样 ---------- */
  function paint() {

    el.classList.toggle("is-playing", playing && !muted);
    el.classList.toggle("is-missing", missing);

    if (missing) {
      el.disabled = true;
      text.textContent = "缺音乐";
      el.title = "把音乐文件放到 " + cfg.src + " 就能播了";
      return;
    }

    el.disabled = false;
    text.textContent = (playing && !muted) ? "音乐开" : "音乐关";
    el.setAttribute("aria-pressed", (playing && !muted) ? "true" : "false");
    el.title = (playing && !muted) ? "点一下关掉背景音乐" : "点一下打开背景音乐";
  }

  /* ---------- 播 / 停 ---------- */
  function start() {

    if (missing || muted) return;

    let p = null;
    try { p = audio.play(); } catch (err) { p = null; }

    if (p && typeof p.then === "function") {
      p.then(function () {
        playing = true;
        fadeTo(audio, cfg.volume, cfg.fadeIn);
        paint();
        detachUnlock();
      }).catch(function () {
        /* 被自动播放策略拦了：什么也不做，等第一次交互再补 */
        playing = false;
        paint();
      });
      return;
    }

    /* 老浏览器：play() 不返回 Promise */
    playing = !audio.paused;
    if (playing) { fadeTo(audio, cfg.volume, cfg.fadeIn); detachUnlock(); }
    paint();
  }

  function stop() {
    try { audio.pause(); } catch (err) {}
    if (audio.__fadeTimer) { clearInterval(audio.__fadeTimer); audio.__fadeTimer = null; }
    audio.volume = 0;
    playing = false;
    paint();
  }

  function remember(v) {
    try { localStorage.setItem(cfg.storageKey, v ? "1" : "0"); } catch (err) {}
  }

  function unmute() {
    muted = false;
    remember(false);
    paint();
    start();
  }

  function mute() {
    muted = true;
    remember(true);
    stop();
  }

  /* ---------- 等第一次交互：浏览器只认这个 ---------- */
  const GESTURES = ["pointerdown", "touchstart", "mousedown", "keydown"];

  function onFirstGesture(e) {
    /* 点开关本身交给开关自己的 click 处理，别在这儿抢 */
    if (e && e.target && el.contains(e.target)) return;
    start();
  }

  function attachUnlock() {
    if (unlockOff) return;
    GESTURES.forEach(function (t) { document.addEventListener(t, onFirstGesture, true); });
    unlockOff = function () {
      GESTURES.forEach(function (t) { document.removeEventListener(t, onFirstGesture, true); });
      unlockOff = null;
    };
  }

  function detachUnlock() { if (unlockOff) unlockOff(); }

  /* ---------- 点开关 ---------- */
  function onToggle(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (missing) return;
    if (playing && !muted) mute();
    else unmute();
  }

  el.addEventListener("click", onToggle);

  /* ---------- 文件不存在：别让开关看着像坏了 ---------- */
  audio.addEventListener("error", function () {
    missing = true;
    playing = false;
    detachUnlock();
    paint();
    console.info(
      "[回家种苞米] 还没有背景音乐文件：" + cfg.src +
      " —— 把歌按这个路径放进去（mp3）就自动生效，不用改代码。"
    );
  });

  /* ---------- 启动 ---------- */
  paint();

  if (!muted) {
    start();          /* 桌面端有时能直接播 */
    attachUnlock();   /* 不行就等第一次点击 / 触摸 */
  }

  const api = {
    el: el,
    audio: audio,
    play: unmute,
    pause: mute,
    toggle: onToggle,
    setVolume: function (v) { cfg.volume = v; if (playing) audio.volume = v; },
    get playing() { return playing && !audio.paused; },
    get muted() { return muted; },
    get missing() { return missing; },
    destroy: function () {
      detachUnlock();
      el.removeEventListener("click", onToggle);
      if (audio.__fadeTimer) { clearInterval(audio.__fadeTimer); audio.__fadeTimer = null; }
      try { audio.pause(); } catch (err) {}
      el.remove();
      audio.remove();
      if (window.BGM === api) window.BGM = null;
    }
  };

  window.BGM = api;
  return api;
}

export default initBgm;
