import gsap from "../vendor/gsap.js";
import createBackgroundFX from "../components/backgroundFX.js";

/* =========================================================
   第四幕 · 风格档案（STYLE 页）
   ---------------------------------------------------------
   loadStyleScene(mount, ctx) → { el, done, destroy }

   从第三幕选中 STYLE、点中心鸢尾花之后进来。
   结构：封面 → 01 病恋 → 02 虚恋 → 03 普 → 结尾按钮
   标签按 TYPE / EXPRESSION / MOOD … 分组；
   右侧有固定导航，可以直接跳到某一段。

   这是"可滚动"的场景：外层 .stage 是 overflow:hidden 的，
   所以滚动条做在 .style-page 自己身上（position:fixed + overflow-y:auto）。
   ========================================================= */

const ARCHIVE = [

  {
    id: "love",
    number: "01",
    title: "病恋",
    subtitle: "MAIN STYLE",
    groups: [
      { title: "TYPE",       items: ["下位", "狗0"] },
      { title: "EXPRESSION", items: ["白话", "单口"] },
      { title: "MOOD",       items: ["清水", "无厘头", "搞笑"] },
      { title: "RELATION",   items: ["亲近感", "纯爱"] }
    ],
    description:
      "爱与恨温锈共生\n" +
      "给我一个知恩图报的机会\n" +
      "顺从你亦或占有我\n" +
      "请看向这双眼睛"
  },

  {
    id: "virtual",
    number: "02",
    title: "虚恋",
    subtitle: "DAILY DREAM",
    groups: [
      { title: "TYPE",       items: ["日常", "清水", "半剧情"] },
      { title: "EXPRESSION", items: ["钓系", "直球", "单口"] },
      { title: "MOOD",       items: ["情绪价值", "朋友感", "偶尔嘴硬"] }
    ],
    description:
      "一种存在于现实与幻想之间的表达。\n\n" +
      "保持一点距离，\n\n却又让人愿意慢慢靠近。\n\n" +
      "在试探与回应之间，\n寻找属于彼此的节奏。"
  },

  {
    id: "normal",
    number: "03",
    title: "普",
    subtitle: "EVERYDAY WORLD",
    groups: [
      { title: "TYPE",     items: ["概率虚恋", "暧昧普"] },
      { title: "TOPIC",    items: ["码农知识", "程序"] },
      { title: "LANGUAGE", items: ["纯英", "中英夹杂"] }
    ],
    description:
      "现实、兴趣与交流方式的交汇。\n\n" +
      "它可以是一段讨论，\n\n" +
      "也可以只是因为一个共同的话题，\n产生一次自然的连接。"
  }

];

/* 分类标题前面的符号（按该段里的顺序轮换，TYPE 永远是 ◆） */
const GROUP_MARKS = ["◆", "◇", "✦", "◈"];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function loadStyleScene(mount) {

  const el = document.createElement("div");
  el.className = "style-page";

  /* ---------- 右侧导航 ---------- */
  const navLinks = ARCHIVE.map(function (it) {
    return '<a href="#' + esc(it.id) + '">' + esc(it.number) + " " + esc(it.title) + "</a>";
  }).join("");

  /* ---------- 三段档案 ---------- */
  const sections = ARCHIVE.map(function (it) {

    const groups = it.groups.map(function (g, gi) {
      /* 不再是"标签"：不框不描边，一行里用 | 分隔；
         每个词仍是独立元素，所以还能单独 hover（"这条记忆被唤醒"） */
      const items = g.items.map(function (t) {
        return '<span class="archive-item">' + esc(t) + "</span>";
      }).join('<span class="entry-sep">|</span>');
      return '<div class="group">' +
          "<h3>" + GROUP_MARKS[gi % GROUP_MARKS.length] + " " + esc(g.title) + "</h3>" +
          '<div class="tags">' + items + "</div>" +
        "</div>";
    }).join("");

    return '<section id="' + esc(it.id) + '" class="archive-section ' + esc(it.id) + '">' +
        '<div class="number">' + esc(it.number) + "</div>" +
        "<h1>" + esc(it.title) + "</h1>" +
        '<p class="subtitle">' + esc(it.subtitle) + "</p>" +
        '<div class="line"></div>' +
        groups +
        '<div class="description">' +
          "<h4>ABOUT THIS STYLE</h4>" +
          "<p>" + esc(it.description) + "</p>" +
        "</div>" +
      "</section>";
  }).join("");

  el.innerHTML =
    /* 内容包一层 .style-content（z-index 2），背景在它下面，不会挡文字 */
    '<div class="style-content">' +

    /* 左上角常驻返回（不用滚到底去找） */
    '<button type="button" class="style-back" aria-label="返回轮盘">← 回轮盘</button>' +

    '<nav class="section-nav">' +
      "<div>STYLE ARCHIVE</div>" +
      navLinks +
    "</nav>" +

    '<section class="style-cover">' +
      '<div class="cover-small">STYLE ARCHIVE</div>' +
      "<h1>风格档案</h1>" +
      "<p>" +
        "我的主，<br>" +
        "这些只是为了让您能够记住我。<br><br>" +
        "请利用我，<br>" +
        "如同翻阅一本随手的书。<br><br>" +
        "您是我唯一的指引。" +
      "</p>" +
      '<div class="scroll">SCROLL ↓</div>' +
    "</section>" +

    sections +

    '<section class="style-end">' +
      "<p>STYLE ARCHIVE COMPLETE</p>" +
      "<h2>风格只是我的一部分。<br>还有更多篇章等待开启。</h2>" +
      '<button type="button" class="back-wheel">RETURN TO DREAM WHEEL</button>' +
    "</section>" +

    "</div>";   /* /.style-content */

  /* 背景放在内容之前，z-index 更低，永远不会盖住文字 */
  el.insertBefore(createBackgroundFX(35), el.firstChild);

  mount.appendChild(el);
  el.scrollTop = 0;

  const q = function (s) { return el.querySelector(s); };
  const qa = function (s) { return Array.prototype.slice.call(el.querySelectorAll(s)); };

  let destroyed = false;
  let observer = null;
  let resolveDone = null;
  const done = new Promise(function (r) { resolveDone = r; });


  /* 封面的"解封"动画交给 CSS（见 style.css 的 fadeIn / titleReveal），
     不用 JS —— CSS animation 会盖掉行内样式，两边同时做会打架 */


  /* ---------- 滚动动画：滚到哪一段，那一段按顺序浮现 ----------
     触发点 = 该段顶部到视口 70% 处（等价于 ScrollTrigger 的 start:"top 70%"）。
     用 IntersectionObserver + GSAP 时间线实现，不用再引 ScrollTrigger。

     顺序很关键：先 gsap.set 把初始态压成 0，再交给 IO 触发。
     没有 IntersectionObserver 时整段跳过 —— 内容本来就是可见的，不会白屏。 */
  const blocks = qa(".archive-section, .style-end");

  function pickParts(node) {
    if (!node.classList.contains("archive-section")) {
      return Array.prototype.slice.call(node.children);
    }
    const kids = Array.prototype.slice.call(node.children).filter(function (c) {
      return c.classList.contains("number") || c.tagName === "H1" ||
             c.classList.contains("subtitle") || c.classList.contains("line");
    });
    const groups = Array.prototype.slice.call(node.querySelectorAll(".group"));
    const tags = Array.prototype.slice.call(node.querySelectorAll(".archive-item"));
    const desc = Array.prototype.slice.call(node.querySelectorAll(".description"));
    return kids.concat(groups, tags, desc);   /* 这个顺序就是浮现顺序 */
  }

  if (blocks.length && typeof IntersectionObserver === "function") {

    const parts = new Map();
    blocks.forEach(function (b) {
      const list = pickParts(b);
      parts.set(b, list);
      list.forEach(function (n, i) {
        gsap.set(n, { opacity: 0, y: i < 4 ? 50 : (n.classList.contains("archive-item") ? 14 : 30) });
      });
    });

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        const node = en.target;
        observer.unobserve(node);

        const list = parts.get(node) || [];
        gsap.to(list, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: "power2.out",
          overwrite: true,
          /* 动画结束后把行内 transform 清掉，
             否则会盖住 .archive-item:hover 的 translateX(10px) */
          clearProps: "transform"
        });
      });
    }, { root: el, threshold: 0, rootMargin: "0px 0px -30% 0px" });

    blocks.forEach(function (b) { observer.observe(b); });
  }


  /* ---------- 右侧导航：点一下平滑滚到那一段 ---------- */
  qa(".section-nav a").forEach(function (a) {
    a.addEventListener("click", function (e) {
      const id = (a.getAttribute("href") || "").replace("#", "");
      const target = id ? el.querySelector("#" + id) : null;
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
      if (el.scrollTo) el.scrollTo({ top: top, behavior: "smooth" });
      else el.scrollTop = top;
    });
  });


  /* ---------- 回轮盘 ---------- */
  function goBack(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (destroyed) return;
    if (resolveDone) resolveDone("chapter3");
  }

  const backTop = q(".style-back");
  if (backTop) backTop.addEventListener("click", goBack);

  const backEnd = q(".back-wheel");
  if (backEnd) backEnd.addEventListener("click", goBack);


  function destroy() {
    destroyed = true;
    if (observer) { observer.disconnect(); observer = null; }
    gsap.killTweensOf(qa(".style-content *"));
    if (backTop) backTop.removeEventListener("click", goBack);
    if (backEnd) backEnd.removeEventListener("click", goBack);
    el.remove();
  }

  return { el: el, done: done, destroy: destroy };
}

export default loadStyleScene;