import gsap from "../vendor/gsap.js";

/* =========================================================
   资料卡弹窗
   ---------------------------------------------------------
   const p = showPopup({ title: "IRIS", text: "鸢尾。\n\n一朵带着血色记忆的花。" });
   await p;     // 用户关掉后 resolve

   关闭方式：点「关闭」按钮 / 点卡片外面 / 按 Esc
   ========================================================= */

let only = null;   // 同一时间只允许一张

export function showPopup(data = {}) {
  const { title = "", text = "" } = data;

  if (only) { only.remove(); only = null; }

  const box = document.createElement("div");
  box.className = "popup";
  box.innerHTML = `
    <div class="paper">
      <h2></h2>
      <p></p>
      <button type="button" class="popup-close">关闭</button>
    </div>
  `;

  box.querySelector("h2").textContent = title;
  box.querySelector("p").textContent = text;

  document.body.appendChild(box);
  only = box;

  const paper = box.querySelector(".paper");

  gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
  gsap.fromTo(paper,
    { y: 26, scale: 0.96, opacity: 0 },
    { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.4)" }
  );

  return new Promise((resolve) => {
    let closed = false;

    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKey);
      only = null;
      gsap.to(box, {
        opacity: 0,
        duration: 0.28,
        ease: "power2.in",
        onComplete() {
          box.remove();
          resolve();
        }
      });
    }

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    box.querySelector(".popup-close").addEventListener("click", close);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", onKey);
  });
}

export default showPopup;