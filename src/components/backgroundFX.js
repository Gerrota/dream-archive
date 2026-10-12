/* =========================================================
   BackgroundFX · 全局背景系统
   ---------------------------------------------------------
   createBackgroundFX(count) → 返回一个 <div class="background-fx">：

     红雾（大范围模糊色块，慢慢飘）
     金雾（同上，另一角）
     一道斜着扫过的微光
     35 颗金色粒子（从下往上飘）

   全部是纯 CSS 动画，不吃 JS；pointer-events:none，不会挡任何点击。
   挂载点随便给，它自己是 position:fixed，铺满视口。

   用法：
     import createBackgroundFX from "../components/backgroundFX.js";
     page.appendChild(createBackgroundFX());
   ========================================================= */

export function createBackgroundFX(count) {

  const n = count || 35;

  const root = document.createElement("div");
  root.className = "background-fx";

  const red = document.createElement("div");
  red.className = "fog fog-red";

  const gold = document.createElement("div");
  gold.className = "fog fog-gold";

  const beam = document.createElement("div");
  beam.className = "light-beam";

  const box = document.createElement("div");
  box.className = "particles";

  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");

    /* 每颗的位置/大小/速度/延迟都随机 ——
       不然 35 颗会叠在同一个位置、同一个节奏往上飘 */
    s.style.left = (Math.random() * 100).toFixed(2) + "%";
    const size = (2 + Math.random() * 3).toFixed(1);
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.animationDuration = (9 + Math.random() * 14).toFixed(1) + "s";
    s.style.animationDelay = (-Math.random() * 20).toFixed(1) + "s";
    s.style.setProperty("--peak", (0.25 + Math.random() * 0.5).toFixed(2));

    box.appendChild(s);
  }

  root.appendChild(red);
  root.appendChild(gold);
  root.appendChild(beam);
  root.appendChild(box);

  return root;
}

export default createBackgroundFX;