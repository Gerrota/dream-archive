import gsap from "../vendor/gsap.js";

/* =========================================================
   转场组件：一块全屏黑幕
   ---------------------------------------------------------
   场景不用自己造黑幕，也不用管 z-index，调这里就行：

     await toBlack({ duration: 0.8 });   // 压到全黑
     await fromBlack({ duration: 1.2 }); // 从黑幕里浮出来

   两个函数都返回 Promise，可以直接 await 串流程。
   ========================================================= */

const OVERLAY_CLASS = "transition-black";
let overlay = null;

function getOverlay() {
  if (!overlay) {
    overlay = document.querySelector("." + OVERLAY_CLASS);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = OVERLAY_CLASS;
      document.body.appendChild(overlay);
    }
    gsap.set(overlay, { opacity: 0 });
  }
  return overlay;
}

/** 画面压到纯黑 */
export function toBlack({ duration = 0.8, delay = 0, ease = "power2.in" } = {}) {
  const el = getOverlay();
  return new Promise((resolve) => {
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: 1, duration, delay, ease, onComplete: resolve });
  });
}

/** 从黑幕浮出来 */
export function fromBlack({ duration = 1.2, delay = 0, ease = "power2.out" } = {}) {
  const el = getOverlay();
  return new Promise((resolve) => {
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: 0, duration, delay, ease, onComplete: resolve });
  });
}

/** 瞬间全黑 / 瞬间透明（不做动画） */
export function coverBlack() { gsap.set(getOverlay(), { opacity: 1 }); }
export function clearBlack() { gsap.set(getOverlay(), { opacity: 0 }); }

export function isBlack() {
  return getOverlay().style.opacity === "1";
}