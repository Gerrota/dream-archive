# 回家种苞米

多幕剧项目。第一幕「庄园」→ 转场 → 第二幕「档案室」→（留好第三幕接口）。

```
第一幕 庄园 → 转场(1.9s) → 第二幕 档案室 → 第三幕 Iris Wheel ─┬→ 第四幕 风格档案（STYLE）
opening.js                 archive.js        chapter3.js        │   style.js
                                                                ├→ 第五幕 约会须知（WORDS） notice.js
                                                                └→ VOICE / COMMENT 走金山文档外链
```

---

## ⚠️ 先看这个：现在必须用本地服务打开

这一版起项目改成了 **ES Module** 结构（`import` / `export`），浏览器不允许用 `file://` 直接加载模块 —— **双击 index.html 会看到一句提示，而不是画面**。

正确打开方式（任选其一）：

1. **双击 `启动局域网服务.bat`**，然后浏览器打开 `http://localhost:8080/`
   （同一个窗口里还会打印手机访问地址，手机连同一个 Wi-Fi 就能看）
2. VS Code 右键 `index.html` → **Open with Live Server**
3. 命令行 `python -m http.server 8080`，然后访问 `http://localhost:8080/`

直接 `file://` 打开也不会白屏 —— 页面会显示一个提示卡片告诉你用上面的方式。

---

## 一、目录结构

```
回家种苞米/
├── index.html                 入口（只放挂载点 + 引入顺序）
├── README.md
├── 启动局域网服务.bat            手机 / 本地预览
├── 手机访问二维码.png
├── preview/                   实拍截图
└── src/
    │
    ├── main.js                场景系统入口（场景表 + 切换逻辑）
    ├── style.css              全局样式（body / .stage / 黑幕 / 提示）
    │
    ├── scenes/
    │   ├── opening.js         第一幕 · 庄园
    │   ├── opening.css
    │   ├── archive.js         第二幕 · 档案室
    │   ├── archive.css
    │   ├── chapter3.js        第三幕 · Iris Wheel（轮盘）
    │   ├── chapter3.css
    │   ├── style.js           第四幕 · 风格档案（STYLE 页，可滚动）
    │   ├── style.css
    │   ├── notice.js          第五幕 · 约会须知（WORDS 入口页，可滚动）
    │   └── notice.css
    │
    ├── components/
    │   ├── transition.js      转场黑幕：toBlack() / fromBlack()
    │   ├── itemPopup.js       资料卡弹窗
    │   ├── itemPopup.css
    │   ├── typeWriter.js      打字机
    │   ├── backgroundFX.js    背景系统：红雾 + 金雾 + 微光 + 粒子
    │   ├── backgroundFX.css
    │   ├── countdown.js       倒计时（返回 { el, destroy }）
    │   ├── bgm.js             全站背景音乐 + 左下角开关
    │   ├── bgm.css
    │   └── ...
    │
    ├── vendor/
    │   ├── gsap.min.js        GSAP 3.12.5（UMD，本地）
    │   └── gsap.js            把它转成 ES Module 出口
    │
    └── assets/                所有图片 + 背景音乐
        ├── bgm.mp3            ★ 把歌放这里（还没有文件时开关会显示「缺音乐」）
        ├── scene.webp         第一幕·环境底        161 KB
        ├── mansion.webp       第一幕·庄园          539 KB（有透明）
        ├── fog.webp           第一幕·红雾          269 KB（有透明）
        ├── archive-room.webp  第二幕·书房          209 KB
        ├── archive-book.webp  第二幕·古书          183 KB
        ├── iris.webp          第二幕·鸢尾          102 KB（500x500）
        ├── headphone.webp     第二幕·耳机 ⚠️见下   131 KB
        ├── badge.webp         第二幕·徽章          131 KB
        ├── letter.webp        第二幕·信纸           29 KB
        └── envelope.webp      第二幕·信封（未使用）  92 KB

    ★ 全部图片已从 PNG 转成 WebP：11.6 MB → 1.85 MB（约 6.4 倍）。
      首屏那三张 5.65 MB → 947 KB，而第一幕的动画本来就要等这三张预加载完
      （见 opening.js 的 ASSETS），所以这一项直接决定了打开速度。
      压缩前的原始 PNG 在项目里的 原图PNG/ 文件夹（已 gitignore，不进仓库）。
```

---

## 二、用手机预览

1. 双击 **`启动局域网服务.bat`**，窗口里会打印两个地址：
   ```
   电脑打开:  http://localhost:8080/
   手机打开:  http://<你电脑的IP>:8080/
   ```
2. 手机和电脑连**同一个 Wi-Fi**，浏览器输那个地址，或扫 `手机访问二维码.png`。
3. 关掉那个黑窗口就停止服务。

**直接跳到某一幕**（不用从头点）：地址后面加 `?scene=` 加场景名。

| 想看的 | 地址 |
|---|---|
| 完整流程 | `http://<你电脑的IP>:8080/` |
| 第一幕 庄园 | `.../?scene=opening` |
| 第二幕 档案室 | `.../?scene=archive` |
| 第三幕 轮盘 | `.../?scene=chapter3` |

二维码存了两张：`手机访问二维码.png`（完整流程）、`手机预览-直接第三幕.png`。

防火墙已加过 TCP 8080 入站放行规则，连不上先查它在不在：
```
netsh advfirewall firewall show rule name=home-corn-8080
```

### 改了代码，手机上却还是旧版？

用两层机制解决掉了：

1. **服务端**：`serve.py` 对 `html / css / js` 发 `Cache-Control: no-store`
2. **页面里**：样式表和自己的模块都带一个 **build 时间戳**加载 ——
   `index.html` 头部那段小脚本把 `Date.now()` 写进 `window.__BUILD`，
   `main.js` 再把它拼到所有 `import` 的地址后面

所以每次打开页面，**js/css 必定重新拉取**，不会再"改了没生效"；
**图片不参与**，照常走缓存，手机不用每次重下十几 MB。

> ⚠️ 注意：如果页面是**在我加自动重载之前**打开的，它里面没有这段轮询代码，
> 需要**手动刷一次**（`Ctrl+Shift+R`，手机上关掉标签页重开）；
> 刷过这一次之后，往后我改代码它就自己更新了。
>
> 另外：光在地址栏回车/用 `Start-Process` 打开同一个网址，浏览器可能只是**切到已有的那个标签页**，
> **不会重新加载**。要确认是不是最新版，看右下角的版本标记。

### 手机兼容性：这几个新特性千万别用

手机浏览器版本杂，下面三个**实测会让手机上直接看不到东西**：

| 别用 | 为什么 | 替代写法 |
|---|---|---|
| 模块顶层 `await` | 要 iOS 15 / Chrome 89 以上；老手机**整个模块语法报错** → 整页黑屏 | 一律用 `Promise.then()`（本项目已不用 async/await） |
| `aspect-ratio` | 要 iOS 15 以上；不支持时盒子高度塌成 0 → **轮盘直接消失** | 宽和高写同一个 `min()` 表达式 |
| `translate:` 独立属性 | 要 iOS 14.1 以上；不支持时居中会偏掉一半 | 用 `transform:translate()`，**放在 GSAP 不碰的那一层**（本项目就是这样） |

### 代码一改，页面自己刷新（不用手动刷了）

`serve.py` 提供了一个 `/__build` 接口，内容是"所有 html/css/js 的修改时间"算出的短版本号。
页面每 4 秒问一次，**一发现版本号变了就自动重载** ——
所以电脑和手机上只要页面开着，我这边改完代码，几秒内你自己就刷新到最新版了。

两个细节：

- **重载会保留当前那一幕**：地址会自动带上 `?scene=<当前幕>`。
  不然你正看着轮盘，我改个 CSS 就把你打回第一幕 —— 会以为"轮盘怎么没了"。
- **页面在后台就先不动**：等你切回来再重载，不打断别的事。

> 换 Live Server 等别的服务器时这个请求会失败，脚本会自己停掉，不影响正常使用。

### 版本标记

页面**右下角**有一行小字 `v1012c` —— 这是手写的版本号，改完代码顺手 +1。
手机上怀疑"改了没生效"时，先看这个号：**号不对 = 拿的是旧代码**（缓存问题），**号对了但画面还是不对 = 代码本身的问题**。
上线前把 `index.html` 里 `.build-tag` 那个 div 删掉即可。

---

## 三、场景系统怎么用

每个场景 = 一个导出函数，签名统一：

```js
export function loadXxxScene(mount) {
  // mount 是 .stage 那个容器
  return { el, done, destroy };
}
```

| 返回值 | 说明 |
|---|---|
| `el` | 场景根元素（已经 append 进 mount） |
| `done` | 这一幕的出口。Promise（`resolve("下一个场景名")`）或 `{ then(cb) }` 可重复订阅对象 —— 见下面「多个出口」 |
| `destroy` | 卸载：kill 掉自己的动画、移除 DOM。切场景时由 main.js 调用 |

**加第三幕只要三步：**

1. 写 `src/scenes/chapter3.js`，导出 `loadChapter3Scene`
2. 在 `src/main.js` 的 `scenes` 表里注册：`chapter3: loadChapter3Scene`
3. 在 `archive.js` 的 `nextChapter()` 里把名字对上（现在写的是 `"chapter3"`）

`nextChapter()` 现在是挂在「信纸」资料卡关闭之后触发的：

```js
// archive.js
function nextChapter() {
  if (resolveDone) resolveDone("chapter3");
}
```

因为 `chapter3` 已经注册了，所以点完信纸会正常黑屏 → 切到第三幕。

### 一个场景想有多个出口？（须知页就是这么做的）

`done` 不必是 Promise —— 只要是「带 `then(cb)` 的东西」就行，main.js 统一按 `.then()` 处理。
须知页最初有两个出口（`← 回轮盘` / 进 WORDS），而 Promise 只能 resolve 一次 ——
点过一次没人接的那个出口之后，第二个出口就再也生效不了了（**实测会卡死在这一页**）。
所以它自己做了个可以重复触发的 `done`（现在按钮去掉了、只剩回轮盘一个出口，
但这套写法留着，以后加新出口不用再改）：

```js
// notice.js
const listeners = [];
const done = { then: (cb) => { listeners.push(cb); return done; } };
function fire(name) { listeners.slice().forEach((cb) => cb(name)); }

fire("chapter3");   // ← 回轮盘（须知页现在唯一的出口）
// 以后加回 ENTER 按钮时： fire("wordsArchive")
```

目标场景没注册时，main.js 只打一句警告、**不黑屏也不卡死**，这一页剩下的出口照样能用。

**调试接口**（浏览器控制台）：

```js
Game.current              // 当前场景对象
Game.goToScene("archive") // 直接跳第二幕（跳过第一幕）
Game.restart()            // 从头再来
```

---

## 四、组件

### 全站背景音乐 `components/bgm.js`

**你要做的一件事：把歌放成 `src/assets/bgm.mp3`。** 放进去就生效，不用改代码。
（想换文件名 / 格式，改 `bgm.js` 顶部的 `BGM_CONFIG.src`。）

**为什么不是一打开就响**：浏览器有硬性规定，用户没点过页面之前不许出声。
所以 `bgm.js` 是这样做的：

1. 打开页面先试着播一次（桌面端有时会放行）
2. 被拦下来就蹲着等**第一次点击 / 触摸 / 按键**，补播一次

→ 结果就是**手机上一般要点一下才会响**，这是浏览器定的，绕不过去。
第一幕那个「与我入梦」按钮、或者随便点一下屏幕，都算这次交互。

**左下角有个常驻开关**：`音乐开` / `音乐关`，点一下切换，选择记在 `localStorage`，
下次打开还记得（关着的话不会又自己响起来）。没有音乐文件时它显示 `缺音乐` 并变灰 ——
那不是坏了，是提醒你文件还没放。

**它不属于任何场景**：挂在 `body` 上，由 `main.js` 启动时 `initBgm()` 一次。
所以**切场景不会中断音乐**，加新场景也不用管它。（实测切 4 次场景，页面里始终只有 1 个 `audio` 元素。）

调参（`bgm.js` 顶部 `BGM_CONFIG`）：

```js
src: "src/assets/bgm.mp3",   // 音乐文件
volume: 0.45,                // 目标音量 0~1
fadeIn: 2.0,                 // 淡入秒数
loop: true                   // 循环
```

控制台调试：`BGM.playing` / `BGM.muted` / `BGM.missing`，`BGM.play()` / `BGM.pause()` / `BGM.setVolume(0.2)`。

**转场黑幕** `components/transition.js`
```js
await toBlack({ duration: 0.8 });    // 压到全黑
await fromBlack({ duration: 1.2 });  // 从黑幕浮出来
isBlack();                           // 是否已经全黑
```

**资料卡** `components/itemPopup.js`
```js
await showPopup({ title: "IRIS", text: "鸢尾。\n\n一朵带着血色记忆的花。" });
```
点「关闭」/ 点卡片外面 / 按 `Esc` 都能关，返回 Promise。

**打字机** `components/typeWriter.js`
```js
await typeWriter(el, "THE BUTLER", { speed: 70 });
```

---

## 五、第二幕：画面与流程

**画面构成**

| 元素 | 说明 | 怎么调 |
|---|---|---|
| 古书 `archive-book.png` | **铺满整屏**（`inset:0` + `object-fit:cover`），靠 `mix-blend-mode:lighten` 把黑底融进暗房间 | `.archive-scene{ --book-zoom }` 调远近（现 1.55）；`object-position:50% 30%` 对准书页 |
| 暗角 | `.archive-book::after` 只压书页四边。书铺满后整幅太亮会丢氛围，这层是补回来的 | `radial-gradient` 里两个 rgba |
| 资料 `profile` | 共 5 条（曾用名 / 人格 / 标签 / 兴趣 / 常驻），字已放大加粗：桌面 `.info` 19px / 700，手机 **17px / 700** | `archive.css` 的 `.info` / `.profile h3` 和手机媒体查询 |
| 鸢尾花 `iris` | **屏幕正中**并放大：桌面 560px（原 180），手机按屏高自适应（iPhone 尺寸约 275px，短屏自动缩小）。用 CSS 的 `translate` 属性做居中（不是 `transform`），所以 GSAP 动 `transform` 做入场/悬停时互不干扰。宽度上限随窗口收窄自动缩小，保证右缘永远压不到右侧资料 | `.iris` 的 `top` / `bottom` / `width` |

**流程**

```
档案室淡入(1.5s) → 古书推入(1.5s) → 标题打字 THE BUTLER(约1s)
→ 资料逐条解锁(各 0.8s，间隔 0.4s) → 物件逐个浮现(各 1s，间隔 0.3s)
→ 物件可点击
```

整段约 10 秒，节奏都在 `archive.js` 的 `animateArchive()` 里。
书和物件在动画播完前是 `pointer-events:none`，播完给 `.archive-scene` 加 `ready` 才可点。

**自适应断点：1100px。** 宽于 1100px 走"左右布局"（资料在右上、花在正中）；窄于 1100px 走"上下堆叠"（资料居中置顶、花在下方居中）。
原来断点是 760px，但 760~1100 这段花居中后会和右上角的资料抢地方，所以提到 1100。

**点击行为**

| 点哪里 | 效果 |
|---|---|
| 鸢尾花（当前**唯一**的物件） | 弹出 IRIS 资料卡（会 `stopPropagation`，不会顺手推进剧情） |
| **古书** | 触发 `nextChapter()`（下一幕入口） |
| 信纸资料卡关闭后 | 同样触发 `nextChapter()` |

> 书铺满整屏后它本身就是全屏点击区，所以"点画面任意空白处"等于"点书"。
>
> `nextChapter()` 现在交棒的名字是 `"chapter3"`，还没在 `main.js` 注册，
> 所以点书只会在控制台打一句警告，**不会黑屏卡住**。

物件资料卡内容在 `archive.js` 的 `bindItems()` 里改。

---

## 六、第三幕：Iris Wheel

**流程**

```
黑屏字幕「一切都是虚妄　只有你　我的主　求您怜惜我」
   ↓ 停留、淡出
「选择你想了解的部分。」
   ↓
虚空浮现（红雾 + 46 颗微尘 + 26 个金点，都在慢慢飘）
轮盘浮出、鸢尾花由暗慢慢亮起
   ↓
鼠标停在哪一块 → 哪一块变亮、边框出现、中文名浮现
   ↓
点某一块 → 立刻交棒（点击确认动画已去掉，只剩 0.6s 黑场转场）
```

**轮盘四块**

| 位置 | id（内部用） | 大字 | 小字 | 配色 |
|---|---|---|---|---|
| 上 | `style` | STYLE | 我的风格 | 暗绿 + 金 |
| 左 | `voice` | VOICE | 我的话术 | 暗红 |
| 右 | `vision` | **COMMENT** | **板评** | 灰蓝 |
| 下 | `words` | **须知** | （无小字） | 黑金 |

> id 是内部标识（决定配色、扇形、以及点花后交棒的名字），**改名字不用动 id**。
> 四块文字现在由 `chapter3.js` 的 `ITEMS` 生成，改名只改那一处：
> `title` 是大字，`cn` 是小字，`cn` 留空就只显示大字。

> 位置是按你的示意图摆的（VOICE 在左、COMMENT 在右、须知在下）。
> 想换位置：改 `chapter3.css` 里 `.label-*` 的定位 和 `.sector-fill.*` 的 `clip-path` 对应调即可。

**开场台词不会在字中间断行**

中文默认**任意两个字之间都能断行**，所以手机上「一切都是虚妄　只有你　我的主　求您怜惜我」
会被从中间拆开（例如"求您怜惜" / "我"）。

现在台词按短语拆成 `<span class="phrase">`（各段 `white-space:nowrap`），整行再配 `word-break:keep-all`
—— **只在短语之间的空格处断**。实测：

| 视口 | 整行 | 每个短语 |
|---|---|---|
| 1920×1080 | 1 行（80px） | 各自 57px，都是单行 ✓ |
| 393×852 | 2 行 | 各自 29px，都是单行 ✓ |
| 360×640 | 2 行 | 各自 29px，都是单行 ✓ |

**交互细节**

- **悬停变亮**：**鼠标停在哪一块，哪一块就亮**（变亮 + 边框出现 + 中文名浮现），移开就暗回去。
  实现是**纯 CSS 的 `:hover`**：每块有一个透明的扇形"感应区"（`.quad-style` 等）专门接鼠标，
  再用相邻兄弟选择器 `~` 点亮同块的色块和名字。**高亮完全不经过 JS** —— 不受缓存、脚本报错、老浏览器影响。
- **点击跳转**：**点哪一块就直接进哪一页**，不用再点中心的花。
  点下去**立刻换场**（让那一块亮起来只是黑下去之前的一瞬，用来确认自己点的是哪块）。
  原来那套「花瓣展开 → 该块发光 → 闪一下」的确认动画已按需求整体去掉 ——
  实测点击到换场景由 **约 1.9 秒缩短到 618ms**（剩下的就是 main.js 统一的 0.6s 黑场）。
- ⚠️ **踩过的坑：字幕还在播的时候，轮盘居然已经能点了。**
  原因是 `pointer-events` 有个反直觉的规则 —— **父层写 `none`，后代写 `auto` 仍然能被点到**。
  所以 `.wheel-stage` 上那句 `pointer-events:none` 根本拦不住 `.quad`（扇形感应区）。
  表现就是：字幕「求您怜惜我」显示着、轮盘 `opacity:0` 完全看不见的时候，
  **点左右半边会直接打开 WPS 话术 / 板评**。
  现在两边一起开关：`.wheel-scene .quad{ pointer-events:none }` +
  `.wheel-scene.ready .quad{ pointer-events:auto }`，JS 里的 `pickFrom()` 再加一道 `ready` 保险。

  另外 `.ready` 也**提前到「轮盘一浮现」就给**（挂在轮盘淡入那一步的 `onStart` 上，不再等整条时间线跑完）——
  否则 CSS 一开关，就会出现「轮盘看得见却点不动」的 2.6 秒空窗，那比原 bug 还难受。
- **键盘也能用**：每一块都带 `role="button"` + `tabindex="0"`，Tab 选中后回车/空格等于点它。
- **中心的花只做装饰**：`pointer-events:none`，点它会"穿透"到下面那块扇形上去。
- **不再转动**：早先做的"拖动转轮 / 1px=1°"已按你的要求**去掉**，轮盘固定不动。
- **手机**：触摸没有 hover，所以**点一下扇区就直接跳**（同一套点击逻辑）。

**★ 让某一块跳到外部链接（WPS 文档等）**

`chapter3.js` 最上面有个配置，填 URL 就行：

```js
const EXTERNAL_LINKS = {
  voice:  "https://www.kdocs.cn/l/ctNuL1g6wBNM",   // VOICE · 我的话术（金山文档）
  vision: "https://www.kdocs.cn/l/cqJiJnWbH6gh"    // COMMENT · 板评（金山文档）
};
```

当前已接：

| 轮盘上的块 | 点开 |
|---|---|
| 左 · VOICE 我的话术 | [金山文档 · 话术](https://www.kdocs.cn/l/ctNuL1g6wBNM) |
| 右 · COMMENT 板评 | [金山文档 · 板评](https://www.kdocs.cn/l/cqJiJnWbH6gh) |
| 上 · STYLE 我的风格 | 内部页面：风格档案（第四幕） |
| 下 · NOTICE 须知 | 内部页面：约会须知（第五幕） |

填了之后：点那一块 → **立刻开新标签页打开这个网址**（被弹窗拦截就退回本页跳转），
**轮盘留在原地**，回来还能接着点别的。留空则仍按"下一幕"处理。

注意 `window.open` 是在点击事件里**同步**调用的（原来包在 `setTimeout(300)` 里）——
放异步里更容易被浏览器当成弹窗拦掉，顺便也更快。实测点 VOICE 时 stub 到的 `window.open` 确实发生在同一次点击内。

实测（临时填测试链接）：点 VOICE → 打开 `…/TEST-VOICE`、点 COMMENT → 打开 `…/TEST-COMMENT`，
两者轮盘都还在；点 STYLE 仍然正常进风格档案页。

**接四个页面**

点某一块之后 `done` 会 resolve 出那一块的 id（`"style"` / `"voice"` / `"vision"` / `"words"`）。
在 `main.js` 的 `scenes` 表里注册同名场景即可自动接通：

```js
import { loadStyleScene } from "./scenes/style.js";

const scenes = {
  opening: loadOpeningScene,
  archive: loadArchiveScene,
  chapter3: loadChapter3Scene,
  style: loadStyleScene,          // ← 加这几行
  voice: loadVoiceScene,
  vision: loadVisionScene,
  words: loadWordsScene
};
```

还没注册时，会立刻在控制台提示「下一幕还没注册：xxx」并**停在第三幕**（不黑屏、不卡死，还能接着点别的）。

**调参**：`chapter3.js` 顶部的 `WHEEL_CONFIG`（字幕节奏、轮盘浮出、花亮起时长）。

---

## 七、第四幕：风格档案（STYLE 页）

从第三幕**悬停选中 STYLE、点中心鸢尾花**进来。

```
封面（满屏居中）
  STYLE ARCHIVE
  风格档案
  我的主，
  这些只是为了让您能够记住我。
  请利用我，如同翻阅一本随手的书。
  您是我唯一的指引。
  SCROLL ↓
      ↓ 往下滚（右侧导航可以直接跳）
01 病恋 / MAIN STYLE
     TYPE  下位 狗0         EXPRESSION 白话 单口
     MOOD  清水 无厘头 搞笑   RELATION  亲近感 纯爱
     ABOUT THIS STYLE + 说明
02 虚恋 / DAILY DREAM       TYPE / EXPRESSION / MOOD
03 普   / EVERYDAY WORLD    TYPE / TOPIC / LANGUAGE
      ↓
STYLE ARCHIVE COMPLETE
风格只是我的一部分。还有更多篇章等待开启。
[ RETURN TO DREAM WHEEL ]
```

**右侧固定导航**：`01 病恋 / 02 虚恋 / 03 普`，点一下平滑滚到那一段（手机上隐藏）。
每一段有 `id`（`love` / `virtual` / `normal`），所以 `?scene=style#virtual` 这类锚点也能用。

**这是唯一"能滚动"的场景**：`.stage` 是 `overflow:hidden` 的，所以滚动条做在 `.style-page` 自己身上
（`position:fixed + overflow-y:auto`）。滚到哪一段哪一段淡入（IntersectionObserver，没有它也能正常显示）。

**返回轮盘**两个入口：左上角常驻的 `← 回轮盘`（`position:fixed`，滚到哪都在）、底部 `RETURN TO DREAM WHEEL`。
回去时**跳过第三幕开场那 7 秒字幕**（场景的 `ctx.from` 告诉它"我是从 style 回来的"）。

> 浏览器自带的「后退」按钮**没接** —— SPA 切场景没往历史里压记录，按后退会直接离开页面。
> 需要的话可以给场景系统加 `history.pushState`。

### 背景系统 BackgroundFX

新增组件（可复用，别的页面也能挂）：

```
src/components/backgroundFX.js
src/components/backgroundFX.css
```

`createBackgroundFX(35)` 返回一个 `position:fixed` 铺满视口的 `<div class="background-fx">`，里面是：

| 元素 | 说明 |
|---|---|
| `.fog-red` | 600px 红色模糊色块（`blur(120px)`），左下角，18s 往返飘 |
| `.fog-gold` | 500px 金色色块，右下角，20s 往返飘 |
| `.light-beam` | 一道 200px 宽的斜向微光，12s 从左扫到右 |
| `.particles span` × 35 | 金色粒子，从下往上飘 |

`pointer-events:none`，**不会挡任何点击**；全是纯 CSS 动画，不吃 JS。
**粒子每颗的 `left` / 大小 / 时长 / 延迟都是 JS 随机写进去的** —— 原稿里 35 颗没有位置也没有时长
（`animation: floatParticle linear infinite` 缺 duration 是无效声明），会让 35 颗叠成一坨且不动。

页面结构改成：

```html
<div class="style-page">
  <div class="background-fx">…</div>      <!-- z-index 0 -->
  <div class="style-content"> … 原内容 … </div>   <!-- z-index 2 -->
</div>
```

### 档案条目：不是标签，是被翻阅的档案

原来是描边小标签（`[下位] [狗0]`），有很强的"网页 UI 感"。现在改成：

```
◆ TYPE
┊
下位
狗0
      （左边一条金色竖线，一条一行的关键词）
```

| 元素 | 做法 |
|---|---|
| 分类标题 | 前面配符号，按段内顺序轮换：`◆ TYPE` `◇ EXPRESSION` `✦ MOOD` `◈ RELATION`（TYPE 永远是 ◆） |
| 记录线 | `.group{ padding-left:30px }` + `.group::before` 一条 `1px rgba(181,139,69,.35)` 竖线，像书里的章节线 |
| 条目 | `.archive-item`：**不框不描边**，20px / 字距 6px / 行高 2 / 颜色 `#e8dcc4`，`display:inline-block` **同一组排成一行、用 `|` 分隔** |
| 分隔符 | `.entry-sep` 一个压暗的 `|`（`padding:0 12px`），`pointer-events:none`，不参与 hover |
| 悬停 | 不是变色按钮，而是"这条记忆被唤醒"：颜色转 `#d4af65` + 一圈金色辉光 + 轻微上浮 |

排版效果（每个词仍是独立元素，所以还能单独 hover）：

```
◆ TYPE        下位 | 狗0
◇ EXPRESSION  白话 | 单口
✦ MOOD        清水 | 无厘头 | 搞笑
◈ RELATION    亲近感 | 纯爱
```

实测 hover：`rgb(232,220,196) / none` → `rgb(212,175,101) / matrix(1,0,0,1,0,-2)` ✓

> ⚠️ 悬停原来是 `translateX(10px)`，改成一行排布后会**撞到后面的 `|`**，所以换成"上浮 2px + 辉光"。
> 想换回来把 `.archive-item:hover` 里的 `translateY(-2px)` 改成 `translateX(10px)` 即可（视觉上会略微压到分隔符）。

> ⚠️ 滚动浮现动画末尾加了 `clearProps:"transform"` ——
> 不然后面 GSAP 写的行内 `transform:translate(0,0)` 会**盖住** hover 的 `translateX(10px)`，
> 悬停就没反应了（这个坑第二幕也踩过一次）。

**顺手修了一处会串场景的地方**：第二幕的 `.archive-item` 等 14 条规则、第一幕的 `.camera / .bg / .content / .grain …` 24 条规则
原来都是**裸类名**，全局生效 —— 第四幕新加的 `.archive-item` 会被第二幕的 `position:absolute; pointer-events:none` 直接顶掉。
现在两个场景的规则**全部加了根前缀**（`.archive-scene xxx` / `.scene xxx`），顺手删了第一幕里没用的 `.blackout`。

### 滚动动画（标题 → 分组 → 条目逐个 → 描述）

每段顶部到**视口 70% 处**触发，然后按顺序浮现：数字/标题 → 分组 → **条目一个个出现** → 说明文字。
实测节奏：0.8s 时数字标题就位、1.8s 时分组就位且条目排到一半、3.3s 全部到位。

> **没引 ScrollTrigger**：项目里只打包了 gsap 本体，没有 ScrollTrigger。
> 你要的 `scrollTrigger:{ trigger, start:"top 70%" }` 效果用
> `IntersectionObserver`（`rootMargin: "0px 0px -30% 0px"` = 视口 70% 那条线）+ GSAP 时间线等价实现了，
> 少一个依赖、离线可用。以后真要做"跟随滚动擦除/视差"那类效果，再加 ScrollTrigger 也不迟。

封面那三段（小字淡入 / 标题字距展开 / 正文浮现）是**纯 CSS animation**（`stFadeIn` / `stTitleReveal`），
所以原来那几行 GSAP 封面动画已经删掉了 —— CSS animation 会盖过行内样式，两边同时做会打架。

三段各自的强调色（`--accent`）：病恋 `#9b3030` / 虚恋 `#80658f` / 普 `#b58b45`，
标签悬停、`01/02/03` 的数字、每段的氛围底色都跟着它走。

**关于你给的 CSS**：`*{box-sizing}` / `html{scroll-behavior}` / `body{margin,background}` 这三条**没有搬进来**
（项目全局 `src/style.css` 里已经有了，重复写会覆盖全局）。其余全部照抄，并且**所有选择器都加了 `.style-page` 前缀**
—— 场景样式是全局生效的，不加前缀会串到别的场景（这个坑之前 `.iris-wrap` 踩过）。
平滑滚动改成做在 `.style-page` 上（它才是滚动容器）。

> 改内容只动 `style.js` 里的 `ARCHIVE` 数组（编号 / 标题 / 英文副标题 / 分组标签 / 说明）。

---

## 八、第五幕：约会须知（WORDS 入口页）

从第三幕轮盘点**下 · NOTICE 须知**进来（那一块 resolve 出 `"words"`）。

```
封面（70vh 居中）
  WORDS ARCHIVE
  约会须知
  ARCHIVE OPENS IN
  13:14  ← 每秒 -1（794 秒 = 13 分 14 秒）
      ↓ 往下滚
NOTICE / 01  恋爱的前提是相互尊重。…
NOTICE / 02  …
…（共 8 条，每条一条分割线）
      ↓
页脚 ARCHIVE LOCKED（倒计时到 00:00 后自己淡出）
```

- **Countdown 做成了独立组件** `components/countdown.js`：`createCountdown({ from, onFinish })`
  返回 `{ el, destroy }`，切场景时 `destroy()` 会把计时器清掉（不然切走后还在跑）。
- **向下滑动引导**：`向下滑动` + 一个上下浮动的 V 形箭头，`position:fixed` 贴视口底部
  （桌面 `26px`、手机 `16px`，`@supports` 里再叠一层 `env(safe-area-inset-bottom)` 让开底部横条）。
  往外滚过 24px 就加 `.scrolled` 把它淡掉，滚回顶部又出现 —— JS 只切一个 class，动画全在 CSS。
  想换文案改 `notice.js` 里「向下滑动」那一行；不想要就把 `.notice-scroll-hint` 那段 DOM 删掉。
- 页脚原来有个 `ENTER WORDS ARCHIVE` 按钮（倒计时到点才放出来），**已按需求去掉** ——
  这一页现在是「看完就走」的终点页。
  倒计时到 `00:00` 时改成让 `ARCHIVE LOCKED` 自己淡出（页脚高度不变，不会把滚动位置顶跳）。
  想让它一直挂着：删掉 `notice.js` 里那行 `gsap.to(locked, …)` 就行。
- 页面出口只剩左上角 `← 回轮盘`。`NOTICE_CONFIG.next`（`"wordsArchive"`）留着备用：
  以后要接 WordsPage，把按钮加回页脚、让它 `fire(NOTICE_CONFIG.next)`，
  再在 `main.js` 的 `scenes` 表里加一行 `wordsArchive: loadWordsScene` 就自动接通。

> 顺带说明：这一页也挂上了 `BackgroundFX`（红雾 + 金雾 + 粒子），跟风格档案保持一致 ——
> 这是我在你给的 CSS 之外加的，不想要就删掉 `notice.js` 里那一行 `insertBefore(createBackgroundFX(...))`。
> 另外加了个左上角常驻 `← 回轮盘`，不然进来出不去。

---

## 九、你给的图片 → 落地成了什么

| 你给的 | 存成 | 用在哪 |
|---|---|---|
| `13_16_49-1.png` | `archive-book.png` | 档案室中央的古书（**铺满整屏**） |
| `哥特维多利亚夜幕书房.png` | `archive-room.png` | 档案室背景 |
| `13_16_52-2.png` | `letter.png` | 信纸 —— 已入库，**当前没用** |
| `13_29_43-1.png` | `iris.png` | 鸢尾花（可点击，**当前唯一在用的物件**） |
| `13_29_44-2.png` | `badge.png` | 徽章 —— 已入库，**当前没用** |
| `13_29_44-2.png` ⚠️ | `headphone.png` | 耳机 —— 已入库，**当前没用** |
| `13_29_46-3.png` | `envelope.png` | 信封 —— 已入库，**当前没用** |

**两个需要你确认的点：**

1. ⚠️ 你当时给的「耳机」和「徽章」是同一个文件（`13_29_44-2.png`），所以 `headphone.png` 就是 `badge.png` 的副本。这两个现在都没在用了，哪天要用记得换一张真的耳机图。
2. **只留鸢尾花**是这一版的决定：耳机 / 徽章 / 信纸的图片、CSS 位置、交互绑定都还在，想加回来把 `archive.js` 里 markup 的注释打开、再补一段 `on(".headphone", ...)` 就行。
3. `envelope.png`（信封）同样入库未用。

### 图片压缩（PNG → WebP）

| | 压缩前 | 压缩后 |
|---|---|---|
| src/assets 合计 | 11.6 MB | **1.85 MB** |
| 首屏（scene + mansion + fog） | 5.65 MB | **947 KB** |

- 不透明的照片类用**有损 WebP q84~85**；带透明边缘的抠图用 **q94**（边缘更干净）。
- **透明通道逐像素完全一致**（WebP 的 alpha 是无损存的），不会出现黑边。
- 画质用「合成后 PSNR」量（把图叠到黑底、也就是屏幕上真实看到的样子）：
  fog 43.1 dB、archive-book 38.5、scene 38.5、iris 37.5、mansion 36.8 ——
  基本都在「很难看出差别」的区间。
- `iris.webp` 按需求压到 500x500、**101 KB**（< 300 KB）。
- 原始 PNG 全部保留在 `原图PNG/`（不进仓库），随时能换回去。

**图片我按显示尺寸压过一遍**：四个物件（鸢尾 / 耳机 / 徽章 / 信纸）统一压到 512px —— 它们最大也只显示 180px，实测渲染几乎逐像素一致。`archive-book.png` 现在是**整屏主视觉**，所以保留了原始 1448×1086 没有压，否则铺满后会发虚。原图都还在 `Downloads`，想换回更大的重新拷一次覆盖即可。

---

## 十、相比你给的代码，改了这些

1. **`import gsap from "gsap"` → `from "../vendor/gsap.js"`**
   没有打包工具也没有 CDN，所以本地 GSAP 用普通 `<script>` 先加载，`vendor/gsap.js` 转成 ES Module 出口。不联网也能跑。

2. **选择器全部收进场景里**
   你原来是 `gsap.from(".profile p", ...)` 这种全局选择器。做了场景系统之后页面上会先后存在多个场景，全局选择器会串场。现在统一改成 `scene.querySelectorAll(...)`，每个场景只动自己的元素。

3. **古书动画改成动 `img` 而不是动容器**
   `.archive-book` 靠 `transform:translateX(-50%)` 居中，GSAP 一旦动它的 `transform` 就会把百分比位移变成固定像素，窗口一缩放就不居中了。现在动里面的 `img`，容器保持纯 CSS。

4. **修了"悬停放大失效"**
   `gsap.from(items, {scale:.7})` 会在行内写上 `transform: scale(1)`，行内样式优先级高于 CSS，所以你写的 `.archive-item:hover{transform:scale(1.08)}` 根本不会生效。现在动画播完 `clearProps:"transform,opacity"` 清掉行内值 —— 实测悬停生效（`none` → `matrix(1.08,...)`）。

5. **不透明 PNG 用 `mix-blend-mode:lighten`**
   `archive-book.png` 和 `letter.png` 是不透明图、背景接近纯黑（不是透明底）。直接摆上去会出现一个深色方块。用 `lighten` 让黑底融进暗房间，只留发亮的部分。

6. **加了手机竖屏适配**
   你原来的布局是桌面比例的（资料框固定 320px、物件 120~180px），手机竖屏上资料框会和徽章叠在一起。加了 `@media (max-width:760px)`：资料框居中置顶、资料改成两列、物件和书重新排位。实测 393×852 无横向溢出、无重叠。

7. **弹窗健壮化**：同一时间只留一张卡、点外面/按 Esc 关闭、进出有动画、`white-space:pre-line` 保留换行、纸卡样式重做了一版（信纸质感 + 深红标题）。

8. **`main.js` 只管调度**：场景表 + 切换 + 黑幕交接；黑幕如果上一幕已经收干净就不再多等 0.6s。

---

## 十一、第一幕（庄园）

**文案与按钮**

| 元素 | 内容 | 尺寸 |
|---|---|---|
| `h1` | 欢迎回家 | `clamp(38px, 7vw, 86px)`，字距 .34em |
| `h2` | **我的主**（原来写的是"亲爱的"） | `clamp(17px, 2.6vw, 32px)` |
| `.enter-btn` | 与我入梦 | 字号 `clamp(36px, 6.8vw, 84px)` —— 和「欢迎回家」基本同大（实测 84 vs 86px） |

按钮改成 padding 撑开（`padding:.34em .8em`），不再写死宽高，内边距跟着字号一起缩放，所以各尺寸下比例一致。
实测桌面 578×153、手机 249×67，内容底边 649/1080（桌面）、393/852（手机），不溢出。

**⚠️ 修掉一个一直没被发现的 bug**

CSS 里写的是 `#enter{…}`，但 `opening.js` 里按钮是 `class="enter-btn"`、**没有 id** —— 两边对不上，所以从改成模块结构开始，按钮一直是**浏览器默认的灰色小按钮**（实测 13.3px 字、57×23px、底色 #F0F0F0）。现在统一改成 `.enter-btn`，样式才真正生效。

**⚠️ 场景 CSS 一定要加场景前缀**

各场景的样式表是全局生效的。这次就踩到了：`archive.css` 里写了 `.iris-wrap{pointer-events:none}`，
而第三幕也有个 `.iris-wrap` —— 于是第三幕的鸢尾花**完全点不动**（`elementFromPoint` 命中的是 `.wheel`）。

所以现在每个场景的类名都加了根元素前缀（`.archive-scene .iris-wrap` / `.wheel-scene .iris`），
第一幕的 `h1{}` / `h2{}` 也改成了 `.scene h1{}`。**加新场景时请照做。**

**文字居中别用 letter-spacing**

`letter-spacing` 会在**最后一个字后面也留一份空隙**，浏览器按含空隙的宽度居中，文字整体就偏左半个字距（实测 -17.5px，右边空一截）。现在按钮里每个字一个 `<span>`，只在字与字之间加 `margin-left`，末尾没有多余空隙 —— 实测水平中心偏移 **+0.0px**。

**交互**

- 黑色开场 → 庄园浮现 → 红雾漂移 → 文字渐入
- 点击「与我入梦」/ 画面任意处 / `Enter`：**一次点击就够**，约 1.9 秒转场（镜头推进 → 红雾扑面 → 黑幕）
- 收尾停在纯黑，然后交棒给第二幕
- 节奏参数在 `opening.js` 顶部的 `OPENING_CONFIG`
