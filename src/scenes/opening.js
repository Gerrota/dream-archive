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

  /* --- 开场 --- */
  bgIn:        2.4,    // 环境底淡入
  mansionIn:   3.0,    // 庄园淡入
  mansionFrom: 0.30,   // 庄园起始亮度
  mansionTo:   0.95,   // 庄园最终亮度
  fogBackOp:   0.40,   // 后层雾最终透明度
  fogFrontOp:  0.75,   // 前层雾最终透明度
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

const ASSETS = [
  "src/assets/scene.webp",
  "src/assets/mansion.webp",
  "src/assets/fog.webp"
];

const CONFIG = OPENING_CONFIG;

export function loadOpeningScene(mount) {
  const el = document.createElement("div");
  el.className = "scene";
  el.innerHTML = `
    <div class="camera">
      <img class="bg" src="src/assets/scene.webp" alt="">
      <img class="mansion" src="src/assets/mansion.webp" alt="庄园">
    </div>

    <div class="dark"></div>

    <div class="fog-layer fog-back"><img class="fog-img" src="src/assets/fog.webp" alt=""></div>
    <div class="fog-layer fog-front"><img class="fog-img" src="src/assets/fog.webp" alt=""></div>

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
  const camera   = q(".camera");
  const bg       = q(".bg");
  const mansion  = q(".mansion");
  const fogBack  = q(".fog-back");
  const fogFront = q(".fog-front");
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


  /* ---------- 素材预加载（缺图也不会黑屏卡死） ---------- */
  function preload(src) {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const finish = (ok) => { if (!settled) { settled = true; resolve(ok); } };
      img.onload  = () => finish(true);
      img.onerror = () => { console.warn("[回家种苞米] 找不到素材：" + src); finish(false); };
      img.src = src;
      setTimeout(() => finish(false), 4000);
    });
  }


  /* ---------- 开场 ---------- */
  function playIntro() {
    if (destroyed) return;
    introDone = false;

    introTl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete() { introDone = true; }
    });

    introTl
      .to(bg, { opacity: 1, duration: CONFIG.bgIn }, 0)

      .fromTo(mansion,
        { opacity: 0, filter: "brightness(" + CONFIG.mansionFrom + ") contrast(1) blur(5px)" },
        { opacity: 1, filter: "brightness(" + CONFIG.mansionTo + ") contrast(1.08) blur(0px)",
          duration: CONFIG.mansionIn }, 0.6)

      .to(fogBack,  { opacity: CONFIG.fogBackOp,  duration: 2.6 }, 1.0)
      .to(fogFront, { opacity: CONFIG.fogFrontOp, duration: 2.4 }, 1.4)

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
      .to(fogBack,  { scale: 2.1, opacity: 0.55, duration: CONFIG.fogBackTime, ease: "power2.in" }, CONFIG.pushDelay)
      .to(fogFront, { scale: CONFIG.fogRush, opacity: 1, duration: CONFIG.fogRushTime, ease: "power2.in" }, CONFIG.fogRushAt);

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


  /* ---------- 起跑 ---------- */
  const onLoad = () => {
    Promise.all(ASSETS.map(preload)).then(() => { if (!destroyed) playIntro(); });
  };
  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });


  /* ---------- 卸载 ---------- */
  function destroy() {
    destroyed = true;
    window.removeEventListener("load", onLoad);
    document.removeEventListener("keydown", onKey);
    if (introTl) introTl.kill();
    gsap.killTweensOf([bg, mansion, camera, fogBack, fogFront, content, hint, enterBtn]);
    el.remove();
  }

  return { el, done, destroy };
}

export default loadOpeningScene;