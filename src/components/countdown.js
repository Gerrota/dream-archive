/* =========================================================
   Countdown · 倒计时
   ---------------------------------------------------------
   const cd = createCountdown({ from: 794, onFinish: fn });
   parent.appendChild(cd.el);
   ...
   cd.destroy();      // 切场景时一定要调，不然计时器还在跑

   显示格式是 MM:SS（不是固定 "00:" 前缀）——
   794 秒就是 13:14 → 13:13 → … → 00:00，归零时回调 onFinish。
   秒数超过 60 也能正常进位，不会出现 "00:794" 这种。
   ========================================================= */

/* 秒数 → MM:SS。倒计时秒数可以大于 60（794 秒 = 13:14），
   所以这里要真的按分秒进位，不能只补前导零。 */
function format(totalSeconds) {
  var t = Math.max(0, totalSeconds);
  var m = Math.floor(t / 60);
  var s = t % 60;
  return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}

export function createCountdown(options) {

  const from = (options && options.from) || 10;
  const onFinish = options && options.onFinish;

  const el = document.createElement("div");
  el.className = "countdown";
  el.innerHTML = "<p>ARCHIVE OPENS IN</p><h2></h2>";

  const out = el.querySelector("h2");

  let left = from;
  let timer = null;
  let fired = false;

  function paint() {
    out.textContent = format(left);
  }

  paint();

  timer = window.setInterval(function () {
    left -= 1;

    if (left <= 0) {
      left = 0;
      paint();
      window.clearInterval(timer);
      timer = null;
      if (!fired) {
        fired = true;
        if (typeof onFinish === "function") onFinish();
      }
      return;
    }

    paint();
  }, 1000);

  return {
    el: el,
    destroy: function () {
      if (timer) { window.clearInterval(timer); timer = null; }
      el.remove();
    }
  };
}

export default createCountdown;