import gsap from "../vendor/gsap.js";

/* =========================================================
   第三幕 · Iris Wheel
   ---------------------------------------------------------
   loadChapter3Scene(mount) → { el, done, destroy }

   流程：黑屏字幕 → 虚空浮现（红雾 + 粒子 + 金点）
        → 鸢尾花由暗转亮 → 轮盘出现
        → 鼠标移到哪块哪块变亮 → 点哪块就直接交棒

   点击确认动画（花瓣展开 + 该块发光 + 一闪）已按需求整体去掉 ——
   现在是点下去立刻交棒，只剩 main.js 统一的 0.6s 黑场转场。

   四个目的页（STYLE / VOICE / VISION / WORDS）还没做，
   done 会 resolve 出对应 id（"style" 等）。
   在 main.js 的 scenes 表里注册同名场景即可自动接通。
   ========================================================= */

export const WHEEL_CONFIG = {

  /* --- 开场字幕 --- */
  /* 台词分行：用 \n 手动断行 ——
     手机上就不会被从字中间拆开，也能精确控制哪一句单独成行 */
  line1: "一切都是虚妄　只有你\n我的主\n求您怜惜我",
  line2: "选择你想了解的部分。",
  line1In: 1.4,      // 第一句淡入
  line1Hold: 1.6,    // 停留
  line1Out: 0.8,
  line2In: 1.0,
  line2Hold: 1.2,
  line2Out: 0.7,

  /* --- 轮盘 --- */
  wheelAt: 0.0,      // 相对字幕结束的延迟（0 = 立刻）
  wheelIn: 1.4,      // 轮盘浮出
  irisAt: 0.4,       // 鸢尾花开始亮起
  irisUp: 2.6,       // 亮起时长
  irisDark: 0.22     // 初始亮度

  /* 原来这里还有 bloom / flash（花瓣展开 + 闪光后交棒），
     点击确认动画已整体去掉、改成点了立刻交棒，用不上了。 */
};

/* =========================================================
   ★ 外部链接：点这一块直接打开这个网址（WPS 文档等）
   ---------------------------------------------------------
   填在这里就行，留空 = 仍按"下一幕"处理（控制台提示未注册）。
   例如：  voice: "https://kdocs.cn/l/xxxxxxxx"
   ========================================================= */
const EXTERNAL_LINKS = {
  voice:  "https://www.kdocs.cn/l/ctNuL1g6wBNM",   // VOICE · 我的话术
  vision: "https://www.kdocs.cn/l/cqJiJnWbH6gh"    // COMMENT · 板评
};


/* 四块区域：上 STYLE / 左 VOICE / 右 COMMENT / 下 须知
   - id 决定它对应哪块扇形和配色（改 id 要同步改 CSS 的 .sector-fill.xxx / .label-xxx）
   - title 是大字，cn 是下面的小字；cn 留空就只显示大字 */
const ITEMS = [
  { id: "style",  title: "STYLE",   cn: "我的风格" },
  { id: "voice",  title: "VOICE",   cn: "我的话术" },
  { id: "vision", title: "COMMENT", cn: "板评" },
  { id: "words",  title: "NOTICE", cn: "须知" }
];

const CONFIG = WHEEL_CONFIG;

export function loadChapter3Scene(mount, ctx) {

  /* 从子页面（STYLE 档案 / WORDS 须知）返回时跳过开场字幕，直接给轮盘
     —— 开场那 7 秒台词没必要每回来一次都重放一遍。 */
  const skipIntro = !!(ctx && (ctx.from === "style" || ctx.from === "words"));


  const el = document.createElement("div");
  el.className = "wheel-scene";

  el.innerHTML = `
    <div class="void">
      <div class="void-fog void-fog-back"></div>
      <div class="void-fog void-fog-front"></div>
      <div class="void-particles"></div>
      <div class="void-gold"></div>
    </div>

    <div class="wheel-intro">
      <p class="wheel-line line1"></p>
      <p class="wheel-line line2"></p>
    </div>

    <div class="wheel-stage" aria-hidden="false">
      <div class="wheel-outer">
        <div class="wheel">

          <!-- 四块（悬停感应区 + 色块 + 名字）都由下面的 ITEMS 生成，
               顺序必须是 感应区 → 色块 → 名字，CSS 才能用 ~ 做"悬停哪块哪块亮" -->

          <div class="iris-wrap">
            <div class="iris" aria-hidden="true">
              <img src="src/assets/iris.webp" alt="">
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  mount.appendChild(el);

  const q  = (s) => el.querySelector(s);
  const qa = (s) => Array.from(el.querySelectorAll(s));

  /* ---------- 生成粒子 / 金点 ---------- */
  makeDust(q(".void-particles"), 46, "void-particle");
  makeDust(q(".void-gold"), 26, "void-gold-dot");

  /* ---------- 生成四块：悬停感应区 + 色块 + 名字（改名只动 ITEMS） ----------
     每块生成三个元素，插在 iris 之前：
       <b class="quad quad-style">     透明扇形，只负责接鼠标（:hover 用）
       <div class="sector-fill style"> 那块的颜色
       <div class="sector-label ...">  大字 + 小字
     顺序保证 感应区 在同块 色块/名字 之前，CSS 的 ~ 才能命中 */
  const irisWrap0 = q(".iris-wrap");
  const wheelHost = irisWrap0.parentNode;

  ITEMS.forEach((it) => {
    const quad = document.createElement("b");
    quad.className = "quad quad-" + it.id;
    quad.dataset.id = it.id;
    quad.setAttribute("role", "button");
    quad.setAttribute("tabindex", "0");
    quad.setAttribute("aria-label", it.title + (it.cn ? " " + it.cn : ""));
    wheelHost.insertBefore(quad, irisWrap0);

    const fill = document.createElement("div");
    fill.className = "sector-fill " + it.id;
    wheelHost.insertBefore(fill, irisWrap0);

    const label = document.createElement("div");
    label.className = "sector-label label-" + it.id + (it.cn ? "" : " no-cn");
    label.dataset.id = it.id;
    const big = document.createElement("span");
    big.textContent = it.title;
    label.appendChild(big);
    if (it.cn) {
      const sm = document.createElement("small");
      sm.textContent = it.cn;
      label.appendChild(sm);
    }
    wheelHost.insertBefore(label, irisWrap0);
  });

  let destroyed = false;
  let entering  = false;
  let resolveDone = null;
  const done = new Promise((r) => { resolveDone = r; });


  /* ---------- 开场字幕 → 轮盘 ---------- */
  const line1 = q(".line1");
  const line2 = q(".line2");
  const stage = q(".wheel-stage");
  const wheelOuter = q(".wheel-outer");
  const irisImg = q(".iris img");

  /* 台词按短语拆开、每段各自不换行。
     中文默认任意两个字之间都能断行，手机上"求您怜惜我"会被从中间拆成两行，
     所以拆成 span + white-space:nowrap（见 chapter3.css 的 .phrase）。 */
  function fillLine(node, text) {
    node.textContent = "";

    String(text).split("\n").forEach(function (oneLine, li) {
      if (li) node.appendChild(document.createElement("br"));   /* 手动分行 */

      oneLine.split(/[\u3000\s]+/).filter(Boolean).forEach(function (part, i) {
        if (i) node.appendChild(document.createTextNode("\u3000"));
        var s = document.createElement("span");
        s.className = "phrase";
        s.textContent = part;
        node.appendChild(s);
      });
    });
  }

  fillLine(line1, CONFIG.line1);
  fillLine(line2, CONFIG.line2);

  let tl = null;

  if (skipIntro) {

    /* 直接落到"开场演完"的状态 */
    tl = gsap.timeline();
    gsap.set([line1, line2], { opacity: 0 });
    gsap.set(stage, { opacity: 1 });
    gsap.set(wheelOuter, { scale: 1, y: 0 });
    gsap.set(irisImg, {
      filter: "brightness(1) saturate(1) drop-shadow(0 0 30px rgba(210,55,55,.85))"
    });
    el.classList.add("ready");

  } else {

  tl = gsap.timeline();

  tl.to(line1, { opacity: 1, duration: CONFIG.line1In, ease: "power2.out" })
    .to(line1, { duration: CONFIG.line1Hold })
    .to(line1, { opacity: 0, duration: CONFIG.line1Out, ease: "power2.in" })
    .to(line2, { opacity: 1, duration: CONFIG.line2In, ease: "power2.out" })
    .to(line2, { duration: CONFIG.line2Hold })
    .to(line2, { opacity: 0, duration: CONFIG.line2Out, ease: "power2.in" })

    /* 轮盘浮出 —— 一浮出来就允许点击。
       .ready 必须在这里就给上：CSS 用它开关 .quad 的 pointer-events，
       要是等到整条时间线跑完（花亮起还要 2.6 秒）才给，
       轮盘已经看得见了却点不动，那比现在还糟。 */
    .fromTo(stage,
      { opacity: 0 },
      { opacity: 1, duration: CONFIG.wheelIn, onStart: () => { el.classList.add("ready"); } },
      ">-" + CONFIG.line2Out)
    .fromTo(wheelOuter,
      { scale: 0.86, y: 26 },
      { scale: 1, y: 0, duration: CONFIG.wheelIn + 0.3, ease: "power3.out" }, "<")

    /* 鸢尾花由暗慢慢亮起 */
    /* 注意：GSAP 写 filter 会整条覆盖，所以 drop-shadow 辉光必须写在两端，不然亮起后辉光会消失 */
    .fromTo(irisImg,
      { filter: "brightness(" + CONFIG.irisDark + ") saturate(.6) drop-shadow(0 0 8px rgba(200,50,50,.12))" },
      { filter: "brightness(1) saturate(1) drop-shadow(0 0 30px rgba(210,55,55,.85))",
        duration: CONFIG.irisUp, ease: "power2.out" },
      "<" + CONFIG.irisAt)

    /* 兜底：万一上面那步没走到（时间线被提前 kill 之类），
       整条跑完也一定把 .ready 给上，绝不留一个点不动的轮盘 */
    .call(() => { el.classList.add("ready"); });

  }


  /* ---------- 选块 ----------
     悬停变亮：完全交给 CSS 的 :hover（见 chapter3.css 的 .quad-xxx:hover ~ ...），
              不依赖任何 JS —— 缓存、老浏览器、JS 出错都不影响它亮。
     点击跳转：点哪一块就进哪一页（花只做装饰，不用再点它）。 */
  const wheel = q(".wheel");
  /* 注意：stage 在上面"开场字幕"那段已经声明过了，这里不能再声明一次，
     否则整份模块语法报错、第三幕直接建不出来 */
  const labels = qa(".sector-label");
  const fills  = qa(".sector-fill");

  let activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    labels.forEach(function (n) { n.classList.toggle("active", n.dataset.id === id); });
    fills.forEach(function (n) { n.classList.toggle("active", n.classList.contains(id)); });
  }

  /* 点/敲某一块 → 先让它亮起来（这样能看到自己选了哪块），再走确认动画 */
  function pickFrom(quad) {
    if (entering || destroyed || !quad) return;

    /* 第二道保险：字幕还在播 / 轮盘还没浮出来 → 点什么都不做。
       第一道是 CSS 里 .quad 的 pointer-events（见 chapter3.css），
       但键盘回车那条路不经过 CSS，所以这里也要拦。 */
    if (!el.classList.contains("ready")) return;
    var id = quad.dataset.id;
    if (!id) return;
    setActive(id);
    enter(id);
  }

  function onStageClick(e) {
    var quad = e.target && e.target.closest ? e.target.closest(".quad") : null;
    if (quad) pickFrom(quad);
  }
  stage.addEventListener("click", onStageClick);

  /* 键盘 / 无障碍：每块可聚焦，回车或空格等于点它 */
  qa(".quad").forEach(function (quad) {
    quad.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pickFrom(quad);
      }
    });
  });


  /* 打开外部链接；被弹窗拦截就退回本页跳转 */
  function openExternal(url) {
    var w = null;
    try { w = window.open(url, "_blank", "noopener"); } catch (err) { w = null; }
    if (!w) location.href = url;
  }


  /* ---------- 确认：点下去就直接交棒 ----------

     原来这里有「花瓣展开 + 该块发光 + 一闪」三段确认动画，
     合起来约 1.3 秒，再叠上黑场就显得跳转很慢 —— 已整体去掉。

     现在：点哪块 → 立刻 resolve → main.js 走统一的 0.6s 黑场 → 切场景。
     setActive 留着，黑下去之前那一瞬能看到自己点的是哪一块。 ---------- */
  function enter(pickedId) {
    if (entering || destroyed) return;
    entering = true;

    var target = pickedId || activeId || ITEMS[0].id;
    setActive(target);

    /* 配了外部链接（WPS 等）：直接开，不换场景。
       必须在这个点击事件里同步调用（不能塞进 setTimeout），
       否则浏览器更容易把它当成弹窗拦掉。 */
    var ext = EXTERNAL_LINKS[target];
    if (ext) {
      openExternal(ext);
      entering = false;          // 回到轮盘还能接着点别的
      return;
    }

    if (resolveDone) resolveDone(target);
  }


  /* ---------- 卸载 ---------- */
  function destroy() {
    destroyed = true;
    if (tl) tl.kill();
    gsap.killTweensOf([line1, line2, stage, wheelOuter, irisImg]);
    stage.removeEventListener("click", onStageClick);
    el.remove();
  }

  return { el, done, destroy };
}


/* ---------- 虚空里的微尘 / 金点 ---------- */
function makeDust(host, count, cls) {
  if (!host) return;
  for (let i = 0; i < count; i++) {
    const d = document.createElement("i");
    d.className = cls;

    const size = cls === "void-gold-dot"
      ? 2 + Math.random() * 3
      : 1 + Math.random() * 2.2;

    d.style.left = (Math.random() * 100).toFixed(2) + "%";
    d.style.top  = (Math.random() * 100).toFixed(2) + "%";
    d.style.width = size.toFixed(1) + "px";
    d.style.height = size.toFixed(1) + "px";
    d.style.setProperty("--peak", (0.28 + Math.random() * 0.62).toFixed(2));
    d.style.setProperty("--dur", (7 + Math.random() * 9).toFixed(1) + "s");
    d.style.setProperty("--delay", (-Math.random() * 12).toFixed(1) + "s");
    d.style.setProperty("--dx", (Math.random() * 30 - 15).toFixed(0) + "px");
    d.style.setProperty("--dy", (-Math.random() * 40 - 10).toFixed(0) + "px");

    host.appendChild(d);
  }
}

export default loadChapter3Scene;