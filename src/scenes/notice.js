import gsap from "../vendor/gsap.js";
import createCountdown from "../components/countdown.js";
import createBackgroundFX from "../components/backgroundFX.js";

/* =========================================================
   第五幕 · WORDS 入口须知（NoticePage）
   ---------------------------------------------------------
   loadNoticeScene(mount, ctx) → { el, done, destroy }

   来源：第三幕轮盘点「下 NOTICE 须知」（那一块 resolve 出 "words"）。
   结构：封面（WORDS ARCHIVE / 约会须知 / 倒计时）
        → 八条须知
        → 页脚（ARCHIVE LOCKED）

   页脚本来有个「ENTER WORDS ARCHIVE」按钮，按需求去掉了 ——
   这一页现在是「看完就走」的终点页，出口只有左上角的 ← 回轮盘。
   以后要接 WordsPage：把按钮加回页脚，让它 fire(NOTICE_CONFIG.next) 就行。

   和风格档案一样是"可滚动"的场景：滚动条做在 .notice-page 自己身上。
   ========================================================= */

export const NOTICE_CONFIG = {
  from: 794,           // 倒计时秒数（794 秒 = 13 分 14 秒，显示 13:14）
  title: "约会须知",
  archive: "WORDS ARCHIVE",
  next: "wordsArchive" // 留着备用：以后想加「进 WORDS 档案」的入口时用（现在页面上没有这个按钮）
};

const NOTICES = [

  "恋爱的前提是相互尊重。\n不接受低无风格指定，请提前看好风格后再下单。",

  "爱人的任何状态都认可。\n请尽情攻击我，如有不适请及时说明。",

  "大概率爆出小狗文学。\n如有雷点请说明。",

  "约会默认暧昧 / 情侣关系。",

  "约会称呼默认宝宝、亲爱的、dear、姐姐。\n如有雷点请说明。",

  "默认回合制。\n当然不默认也可以。",

  "如有语气词需求请提前说明。",

  "本人风格无动描。\n只涉及微动描。"

];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pad2(n) {
  return (n < 10 ? "0" : "") + n;
}

export function loadNoticeScene(mount) {

  const el = document.createElement("div");
  el.className = "notice-page";

  const items = NOTICES.map(function (text, i) {
    return '<div class="notice-item">' +
        '<div class="notice-number">NOTICE / ' + pad2(i + 1) + "</div>" +
        "<p>" + esc(text) + "</p>" +
      "</div>";
  }).join("");

  el.innerHTML =
    '<div class="notice-content">' +

      /* 左上角常驻返回（和风格页一致） */
      '<button type="button" class="notice-back" aria-label="返回轮盘">← 回轮盘</button>' +

      '<section class="notice-cover">' +
        '<div class="notice-archive-title">' + esc(NOTICE_CONFIG.archive) + "</div>" +
        "<h1>" + esc(NOTICE_CONFIG.title) + "</h1>" +
        '<div class="notice-countdown"></div>' +

        /* 向下滑动引导：贴在封面底部，往下滚就淡出（见下面的 scroll 监听） */
        '<div class="notice-scroll-hint" aria-hidden="true">' +
          "<span>向下滑动</span>" +
          '<span class="notice-scroll-arrow"><i></i></span>' +
        "</div>" +
      "</section>" +

      '<section class="notice-list">' + items + "</section>" +

      '<section class="notice-footer">' +
        '<p class="notice-locked">ARCHIVE LOCKED</p>' +
      "</section>" +

    "</div>";

  /* 背景放在内容之前，z-index 更低，不会盖住文字 */
  el.insertBefore(createBackgroundFX(35), el.firstChild);

  mount.appendChild(el);
  el.scrollTop = 0;

  const q  = function (s) { return el.querySelector(s); };
  const qa = function (s) { return Array.prototype.slice.call(el.querySelectorAll(s)); };

  let destroyed = false;
  let observer = null;
  let countdown = null;
  /* ---------- 出口：可以喊很多次 ----------
     原来这一页有两个出口（← 回轮盘 / ENTER 进 WORDS），Promise 只能 resolve 一次，
     点过一次没人接的出口之后第二个就不生效了（实测会卡死在这一页）。
     现在按钮去掉了、只剩 ← 回轮盘 一个出口，但这套写法留着 ——
     以后往页面上加新出口就不用再改一遍。
     main.js 那边照常 .then(cb) 就能用，不需要知道它不是 Promise。 */
  const listeners = [];
  const done = {
    then: function (cb) { listeners.push(cb); return done; }
  };

  function fire(name) {
    listeners.slice().forEach(function (cb) {
      try { cb(name); } catch (err) { console.error(err); }
    });
  }


  /* ---------- 倒计时：走完就把这把锁淡掉 ----------
     页脚原来靠倒计时解锁 ENTER 按钮，按钮去掉之后没有可解锁的东西了，
     所以改成到点让 ARCHIVE LOCKED 自己淡出（页脚高度不变，不会把滚动位置顶跳）。
     想让它一直挂着：删掉下面那行 gsap.to 即可。 */
  const locked = q(".notice-locked");

  countdown = createCountdown({
    from: NOTICE_CONFIG.from,
    onFinish: function () {
      if (destroyed) return;
      if (locked) gsap.to(locked, { opacity: 0, duration: 0.8, ease: "power2.out" });
    }
  });

  const holder = q(".notice-countdown");
  if (holder && countdown) holder.appendChild(countdown.el);


  /* ---------- 向下滑动引导 ----------
     停在顶部时显示；往下滚过一点就淡掉，滚回顶部又出现。
     这里只切一个 class，动画全部交给 CSS。 */
  const hint = q(".notice-scroll-hint");

  function onScroll() {
    el.classList.toggle("scrolled", el.scrollTop > 24);
  }

  if (hint) {
    el.addEventListener("scroll", onScroll);
    onScroll();
  }


  /* ---------- 滚到哪一条，哪一条浮现 ----------
     先 gsap.set 压成 0，再交给 IntersectionObserver。
     没有 IO 就整段跳过 —— 内容本来就是可见的。 */
  const blocks = qa(".notice-item, .notice-footer");

  if (blocks.length && typeof IntersectionObserver === "function") {
    blocks.forEach(function (b) { gsap.set(b, { opacity: 0, y: 30 }); });

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        const node = en.target;
        observer.unobserve(node);
        gsap.to(node, {
          opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
          clearProps: "transform"
        });
      });
    }, { root: el, threshold: 0, rootMargin: "0px 0px -25% 0px" });

    blocks.forEach(function (b) { observer.observe(b); });
  }


  /* ---------- 回轮盘（这一页现在唯一的出口） ---------- */
  function goBack(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (destroyed) return;
    fire("chapter3");
  }

  const back = q(".notice-back");
  if (back) back.addEventListener("click", goBack);


  function destroy() {
    destroyed = true;
    if (countdown) { countdown.destroy(); countdown = null; }
    if (observer) { observer.disconnect(); observer = null; }
    if (hint) el.removeEventListener("scroll", onScroll);
    gsap.killTweensOf(qa(".notice-content *"));
    if (back) back.removeEventListener("click", goBack);
    el.remove();
  }

  return { el: el, done: done, destroy: destroy };
}

export default loadNoticeScene;