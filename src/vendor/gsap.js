/* =========================================================
   GSAP 统一出口
   ---------------------------------------------------------
   gsap.min.js 是 UMD 包，在 index.html 里已经用普通 <script>
   提前加载好，它会把 gsap 挂到 window 上。

   这里把它转成 ES Module 出口，于是各场景/组件可以统一写：
       import gsap from "../vendor/gsap.js";
   好处：不依赖 CDN，也不用打包工具。
   ========================================================= */

const gsap = window.gsap;

if (!gsap) {
  console.error("[回家种苞米] GSAP 没加载成功，检查 src/vendor/gsap.min.js 是否在 main.js 之前引入");
}

export default gsap;
export { gsap };