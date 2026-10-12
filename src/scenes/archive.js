import gsap from "../vendor/gsap.js";
import { typeWriter } from "../components/typeWriter.js";
import createBackgroundFX from "../components/backgroundFX.js";

/* =========================================================
   第二幕 · 档案室
   ---------------------------------------------------------
   loadArchiveScene(mount) → { el, done, destroy, next }

   流程：档案室出现 → 档案页浮出 → 标题出现 → 资料解锁
         → 物件可点击 → 进入下一幕

   注意：图片路径是相对 index.html 的，所以写 src/assets/...
   ========================================================= */

export function loadArchiveScene(mount) {

  const scene = document.createElement("div");
  scene.className = "archive-scene";

  scene.innerHTML = `

    <div class="archive-bg"></div>

    <!-- 古书不再用图片：整屏这块「档案页」是 CSS 画的（archive.css 的 ::before）。
         它同时是「点任意处 → 进入下一幕」的点击区，交互没变。 -->
    <div class="archive-book"></div>


    <div class="profile">

      <h1>寂</h1>

      <h3></h3>

      <div class="info">

        <p>
          曾用名：
          <br>
          晚淑 / Iris / 鸢尾
        </p>

        <p>
          人格：
          <br>
          ESTP
        </p>

        <p>
          标签：
          <br>
          话痨 · 三恋
        </p>

        <p>
          兴趣：
          <br>
          光遇 · 蛋仔
        </p>

        <p class="staying">
          常驻：
          <br>
          正太 · 禁长 · 红耳机 · 蝙蝠斗
        </p>

      </div>

    </div>

    <!-- 物件：只留鸢尾花。耳机 / 徽章 / 信纸的图和样式都还留着，想加回来直接补一行
    <img class="archive-item headphone" src="src/assets/headphone.webp" alt="耳机">
    <img class="archive-item badge"     src="src/assets/badge.webp"     alt="徽章">
    <img class="archive-item letter"    src="src/assets/letter.webp"    alt="信纸">
    -->
    <div class="iris-wrap">
      <img class="archive-item iris" src="src/assets/iris.webp" alt="鸢尾">
    </div>

  `;

  /* 统一氛围层（红雾 + 金雾 + 微光 + 粒子，全 CSS，pointer-events:none）。
     插在 .archive-bg 之后、书之前 —— 盖在背景渐变上，又在内容之下。 */
  scene.insertBefore(createBackgroundFX(30), scene.querySelector(".archive-book"));

  mount.appendChild(scene);

  let resolveDone = null;
  const done = new Promise((r) => { resolveDone = r; });

  /* ---------- 第三幕接入口 ---------- */
  // TODO: Load next scene here
  //   第三幕做好后，在 main.js 的 scenes 表里注册，再把下面的名字改成它
  function nextChapter() {
    if (resolveDone) resolveDone("chapter3");
  }

  // 给下面 bindItems 里的"信纸 → 下一幕"用
  scene.__next = nextChapter;

  animateArchive(scene);
  bindItems(scene);

  function destroy() {
    gsap.killTweensOf(scene.querySelectorAll("*"));
    scene.remove();
  }

  return { el: scene, done, destroy, next: nextChapter };
}


/* ---------- 进场动画 ---------- */
function animateArchive(scene) {

  const q  = (s) => scene.querySelector(s);
  const qa = (s) => Array.from(scene.querySelectorAll(s));

  const bg      = q(".archive-bg");
  const book    = q(".archive-book");
  const h1      = q(".profile h1");
  const h3      = q(".profile h3");
  const info    = qa(".profile .info p");
  const items   = qa(".archive-item");

  const tl = gsap.timeline();

  tl.from(bg, { opacity: 0, duration: 1.5 })

    .from(book, {
      y: 100,
      scale: .8,
      opacity: 0,
      duration: 1.5,
      ease: "power3.out"
    })

    .from(h1, { opacity: 0, y: 30, duration: 1 })

    /* 标题出现：打字机 */
    .call(() => typeWriter(h3, "THE BUTLER", { speed: 70 }))
    .to({}, { duration: 1.0 })

    /* 资料解锁 */
    .from(info, { opacity: 0, x: 30, stagger: .4, duration: .8 })

    /* 物件出现 */
    .from(items, { opacity: 0, scale: .7, stagger: .3, duration: 1 })

    /* 物件可点击 */
    .call(() => {
      // 清掉 GSAP 写在行内的 transform / opacity，
      // 否则会把 CSS :hover 的缩放效果压住
      gsap.set(items, { clearProps: "transform,opacity" });
      scene.classList.add("ready");
    });

}


/* ---------- 物件点击 ---------- */
function bindItems(scene) {

  const on = (sel, fn) => {
    const el = scene.querySelector(sel);
    if (el) el.addEventListener("click", fn);
  };

  /* 目前只留鸢尾花这一个物件。
     想加回耳机 / 徽章 / 信纸：把上面 markup 里的注释打开，
     再照下面这段补一个 on(".headphone", ...) 就行，
     archive.css 里的位置样式都还留着。 */
  /* 点鸢尾花 = 进入第三幕（内容仍是"选择你想了解的部分"的入口） */
  on(".iris", () => {
    if (typeof scene.__next === "function") scene.__next();
  });

  /* 点书 = 主入口：进入下一幕 */
  const book = scene.querySelector(".archive-book");
  if (book) {
    book.addEventListener("click", () => {
      // TODO: Load next scene here
      if (typeof scene.__next === "function") scene.__next();
    });
  }

}

export default loadArchiveScene;