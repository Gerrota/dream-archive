import gsap from "../vendor/gsap.js";
/* 转场组件先预加载（用和 main.js 同一个 build 时间戳 → 同一个模块实例）。
   这里不用顶层 await：那个要 iOS15+ 才支持，老手机整个模块会直接报错。 */
const _BUILD = (typeof window !== "undefined" && window.__BUILD) || Date.now();
const transitionReady = import("../components/transition.js?b=" + _BUILD);

/* =========================================================
   第一幕 · 庄园
   ---------------------------------------------------------
   loadOpeningScene(mount) → { el, done, destroy }

   done : Promise，在第一幕收尾（黑幕拉满）时 resolve("archive")，
          交给 main.js 去切下一幕。
   ========================================================= */

export const OPENING_CONFIG = {

  /* --- 开场（全部纯 CSS 氛围，不再有任何图片） --- */
  bgIn:        2.4,    // 后层雾淡入
  mansionIn:   3.0,    // 前层雾淡入
  fogBackOp:   0.40,   // 后层雾最终透明度
  fogFrontOp:  0.75,   // 前层雾最终透明度（下面几行是文字出现的时间点）
  h1At:        1.9,    // "欢迎回家" 出现时间点
  h2At:        2.7,    // "亲爱的"     出现时间点
  btnAt:       3.3,    // 按钮          出现时间点
  hintAt:      4.2,    // 提示文字      出现时间点

  /* --- 点击之后：转场（总时长 ≈ 1.9 秒） --- */
  uiOut:       0.5,
  pushDelay:   0.15,   // 镜头开始推的延迟
  pushTime:    1.6,    // 镜头推进时长
  zoom:        3.2,    // 镜头放大倍数
  pushY:      -170,    // 镜头上移(px)
  fogBackTime: 1.2,    // 后雾扑来时长
  fogRushAt:   0.40,   // 前雾开始扑的时间点
  fogRushTime: 1.0,    // 前雾扑来时长
  fogRush:     3.0,    // 前雾冲到面前的倍数
  blackoutAt:  1.25,   // 黑幕开始时间点
  freezeTime:  0.6     // 黑幕时长

};

/* 这一幕**不需要任何图片** —— 没有素材要预加载，所以第一幕是开机即播，
   不用再等图片下载完（原来那三张要等 5.6MB）。 */
const CONFIG = OPENING_CONFIG;

export function loadOpeningScene(mount) {
  const el = document.createElement("div");
  el.className = "scene";
  el.innerHTML = `
    <!-- 第一幕不再依赖任何图片：黑色底 + 纯 CSS 红黑雾气 + 少量漂浮粒子。
         每层雾是「外层 + 内层 i」两层：外层留给 GSAP 做推进/扑面，
         内层自己跑 CSS 漂移动画 —— 分开写在两层上，动画才不会互相覆盖。 -->
    <div class="camera">
      <div class="dark"></div>
      <div class="mist mist-back"><i></i></div>
      <div class="mist mist-front"><i></i></div>
      <div class="dust"></div>
    </div>

    <div class="vignette"></div>
    <div class="grain"></div>

    <div class="content">
      <h1>欢迎回家</h1>
      <h2>我的主</h2>
      <button class="enter-btn" type="button"><span>与</span><span>我</span><span>入</span><span>梦</span></button>
      <p class="hint">点击任意处 · 或按 Enter</p>
    </div>
  `;
  mount.appendChild(el);

  const q = (s) => el.querySelector(s);
  const camera    = q(".camera");
  const mistBack  = q(".mist-back");
  const mistFront = q(".mist-front");
  const content  = q(".content");
  const hint     = q(".hint");
  const enterBtn = q(".enter-btn");

  let introTl   = null;
  let introDone = false;
  let busy      = false;   // 转场中：锁输入
  let entered   = false;   // 是否已走完第一幕
  let destroyed = false;

  let resolveDone = null;
  const done = new Promise((r) => { resolveDone = r; });


  /* ---------- 漂浮粒子（纯 CSS：每个只是一颗 span，位置/速度随机） ---------- */
  function makeDust(host, n) {
    if (!host) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.bottom = (-8 - Math.random() * 26).toFixed(1) + "%";
      const d = (2 + Math.random() * 2.4).toFixed(1);
      s.style.width = d + "px";
      s.style.height = d + "px";
      s.style.animationDuration = (14 + Math.random() * 16).toFixed(1) + "s";
      s.style.animationDelay = (-Math.random() * 24).toFixed(1) + "s";
      s.style.setProperty("--peak", (0.16 + Math.random() * 0.4).toFixed(2));
      host.appendChild(s);
    }
  }
  makeDust(q(".dust"), 26);


  /* ---------- 开场 ---------- */
  function playIntro() {
    if (destroyed) return;
    introDone = false;

    introTl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete() { introDone = true; }
    });

    introTl
      /* 后层雾从暗处慢慢浮出来 */
      .fromTo(mistBack,
        { opacity: 0, scale: 1.08 },
        { opacity: CONFIG.fogBackOp, scale: 1, duration: CONFIG.bgIn }, 0)

      /* 前层雾稍后跟上，作为主体氛围 */
      .fromTo(mistFront,
        { opacity: 0, scale: .94 },
        { opacity: CONFIG.fogFrontOp, scale: 1, duration: CONFIG.mansionIn }, 0.6)

      .fromTo(q("h1"),
        { opacity: 0, y: 26, letterSpacing: "0.62em", textIndent: "0.62em" },
        { opacity: 1, y: 0, letterSpacing: "0.34em", textIndent: "0.34em", duration: 1.7 }, CONFIG.h1At)

      .fromTo(q("h2"),
        { opacity: 0, y: 18, letterSpacing: "0.85em", textIndent: "0.85em" },
        { opacity: 1, y: 0, letterSpacing: "0.5em", textIndent: "0.5em", duration: 1.3 }, CONFIG.h2At)

      .fromTo(enterBtn,
        { opacity: 0, y: 16, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2 }, CONFIG.btnAt)

      .to(hint, { opacity: 1, duration: 1.2 }, CONFIG.hintAt);
  }


  /* ---------- 点击：与我入梦 ---------- */
  function enterDream() {
    if (busy || entered || destroyed) return;

    // 素材还在加载、开场还没开始 → 忽略这次点击
    if (!introTl) return;

    busy = true;

    // 开场还在放 → 先补完（瞬间渲染到结束状态），再接着转场
    if (!introDone) introTl.progress(1);

    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    tl.to(content, { opacity: 0, y: -34, filter: "blur(8px)", duration: CONFIG.uiOut, ease: "power2.in" }, 0)

      /* 镜头推向庄园 */
      .to(camera, { scale: CONFIG.zoom, y: CONFIG.pushY, duration: CONFIG.pushTime }, CONFIG.pushDelay)

      /* 红雾扑面（比镜头更快） */
      .to(mistBack,  { scale: 2.1, opacity: 0.55, duration: CONFIG.fogBackTime, ease: "power2.in" }, CONFIG.pushDelay)
      .to(mistFront, { scale: CONFIG.fogRush, opacity: 1, duration: CONFIG.fogRushTime, ease: "power2.in" }, CONFIG.fogRushAt);

    entered = true;

    /* 黑幕拉满 → 第一幕结束，交棒给下一幕 */
    transitionReady.then(function (T) {
      T.toBlack({ duration: CONFIG.freezeTime, delay: CONFIG.blackoutAt }).then(function () {
        if (destroyed) return;
        busy = false;
        if (resolveDone) resolveDone("archive");
      });
    });
  }


  /* ---------- 输入 ---------- */
  enterBtn.addEventListener("click", (e) => { e.stopPropagation(); enterDream(); });
  el.addEventListener("click", () => enterDream());
  document.addEventListener("keydown", onKey);
  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") enterDream();
  }


  /* ---------- 起跑 ----------
     没有图片要等，直接播 —— 第一幕现在是真正的「开机即现」 */
  playIntro();


  /* ---------- 卸载 ---------- */
  function destroy() {
    destroyed = true;
    document.removeEventListener("keydown", onKey);
    if (introTl) introTl.kill();
    gsap.killTweensOf([mistBack, mistFront, camera, content, hint, enterBtn]);
    el.remove();
  }

  return { el, done, destroy };
}

export default loadOpeningScene;