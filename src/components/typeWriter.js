/* =========================================================
   打字机
   ---------------------------------------------------------
   const p = typeWriter(el, "THE BUTLER", { speed: 55 });
   await p;                       // 打完自动 resolve

   - el     : 目标元素（内容会被覆盖）
   - text   : 文本，支持 \n
   - speed  : 每个字的间隔 ms
   - cursor : 是否显示闪烁光标（默认 true）
   - startDelay : 开始前等待 ms
   - instant    : true 则跳过动画直接出全文
   ========================================================= */

export function typeWriter(el, text, options = {}) {
  const {
    speed = 55,
    cursor = true,
    startDelay = 0,
    instant = false
  } = options;

  if (!el) return Promise.resolve();

  const str = String(text ?? "");

  if (instant) {
    el.textContent = str;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    el.textContent = "";
    el.classList.add("is-typing");

    const cursorEl = cursor ? document.createElement("i") : null;
    if (cursorEl) {
      cursorEl.className = "type-cursor";
      el.appendChild(cursorEl);
    }

    let i = 0;
    let timer = null;

    function step() {
      if (i >= str.length) {
        if (timer) clearInterval(timer);
        if (cursorEl) cursorEl.remove();
        el.classList.remove("is-typing");
        resolve();
        return;
      }
      const ch = str[i++];
      if (cursorEl) {
        cursorEl.insertAdjacentText("beforebegin", ch);
      } else {
        el.textContent += ch;
      }
    }

    setTimeout(() => {
      if (speed <= 0) {                 // speed 0 → 一帧出完
        el.textContent = str;
        if (cursorEl) cursorEl.remove();
        el.classList.remove("is-typing");
        resolve();
        return;
      }
      timer = setInterval(step, speed);
    }, startDelay);
  });
}

export default typeWriter;