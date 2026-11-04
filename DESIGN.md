---
name: "Personal Atlas"
description: "可触的机械键盘，与舒展的个人故事"
colors:
  space-bg: "#070b0f"
  space-surface: "#080e1c"
  space-solid: "#0b1120"
  space-ink: "#f8fafc"
  space-muted: "#a4acbc"
  space-line: "#273041"
  space-button-ink: "#111827"
  space-field: "#21252d"
  daylight-bg: "#edf1ed"
  daylight-surface: "#ffffffed"
  daylight-solid: "#ffffff"
  daylight-ink: "#111827"
  daylight-muted: "#586479"
  daylight-line: "#ccd2db"
  daylight-field: "#e9edf2"
  paper: "#e5e9e3"
  paper-ink: "#17211e"
  paper-muted: "#53605a"
  paper-line: "#bdc9bf"
  paper-field: "#d5ddd3"
  focus-cyan: "#6ad8ee"
  key-orange: "#ff9408"
  key-blue: "#3178c6"
  key-cyan: "#51c7df"
  key-green: "#42b883"
  key-pink: "#df7fab"
typography:
  display:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "clamp(96px, 12vw, 180px)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  skills-headline:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "clamp(80px, 12vw, 160px)"
    fontWeight: 620
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  story-headline:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "clamp(92px, 13.4vw, 186px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  projects-headline:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "clamp(80px, 10vw, 145px)"
    fontWeight: 550
    lineHeight: 1
  title:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "clamp(22px, 2.6vw, 36px)"
    fontWeight: 550
    lineHeight: 1.45
    letterSpacing: "-0.025em"
  body:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.8
  label:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  editorial-link:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.2
  tag:
    fontFamily: "'Space Grotesk Variable', 'Noto Sans SC Variable', sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  flat: "0px"
  tag: "5px"
  control: "6px"
  icon: "7px"
  dialog: "14px"
  circle: "50%"
spacing:
  tight: "8px"
  control-gap: "10px"
  group: "20px"
  mobile-gutter: "24px"
  content-gutter: "7vw"
  dialog-inset: "30px"
components:
  editorial-link:
    textColor: "{colors.space-ink}"
    typography: "{typography.editorial-link}"
    rounded: "{rounded.flat}"
    padding: "5px 0"
  button-primary:
    backgroundColor: "{colors.space-ink}"
    textColor: "{colors.space-button-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  button-secondary:
    backgroundColor: "{colors.space-surface}"
    textColor: "{colors.space-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  input-field:
    backgroundColor: "{colors.space-field}"
    textColor: "{colors.space-ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  tag:
    backgroundColor: "{colors.space-field}"
    textColor: "{colors.space-muted}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "5px 10px"
  filter-selected:
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.flat}"
    padding: "10px 0"
  experience-row:
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.flat}"
    padding: "36px 0"
  project-card:
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.flat}"
    padding: "0"
  navigation-item:
    textColor: "{colors.space-ink}"
    padding: "8px 18px 8px 0"
  dialog:
    backgroundColor: "{colors.space-solid}"
    textColor: "{colors.space-ink}"
    rounded: "{rounded.dialog}"
---

# Design System: Personal Atlas

## Overview

**Creative North Star: "可触的空间，舒展的故事"**

保留 Naresh Khatri 的真实机械键盘与开放画布，将页面分成可触的空间与安静的阅读章节。首页靠字重、比例与留白组织信息；经历和作品以不透明的浅灰绿纸面承接，滚动时形成清楚的前后关系。

最新方向依据用户指定的 Giats、SeamTransitions 和 Lusion 参考：借鉴编辑式留白、连续曲面接缝与短开场的节奏。OPEN SPACE 标记与 SVG 接缝为本项目绘制，未使用这些网站的标志、作品或着色器。

**Key Characteristics:**

- 真实键帽保留按压、声音与空间姿态，视觉重心不被容器边框打断。
- Space Grotesk 的轻重变化承担主显示字，Noto Sans SC 承接中文。
- 开放深空或日光场景，连接固定浅灰绿的阅读纸面。
- 首页文字链接、分隔线经历、错列作品组成无卡片外壳的内容层。
- 同一技能舞台统一进入与退出；静态模式保留等价内容入口。

本记录以 `src/refinement.css`（覆盖 `space.css`）、`App.tsx`、`Brand.tsx`、`OpeningSequence.tsx`、`intro.css`、`SeamTransition.tsx` 与 `scene/` 为准。产品事实与来源分别见 `PRODUCT.md`、`REFERENCE-STUDY.md` 和 `ASSETS.md`。

## Colors

深浅场景提供空间感，浅灰绿纸面提供长文阅读的稳定底色。frontmatter 是颜色原值；sidecar 的八阶 OKLCH 色带只用于设计预览，不是新的应用变量。

### Primary

- `space-ink` / `daylight-ink` 是各主题主要文字与控件色；焦点统一使用 `focus-cyan`。
- `paper-ink` 与 `paper` 建立经历、作品的固定阅读组合。该区域不随全局主题反转。

### Secondary

- 彩色键帽由技能数据决定；`key-*` 只是当前示例，不是成功、错误或其他通用状态语义。
- 作品缺省预览按类别采用蓝灰、灰绿、青灰和沙色，并始终显示内容示意；真实作品图由资料替换。

### Neutral

- `space-*` 与 `daylight-*` 对应页面、弹窗、字段和辅助文字的现有语义变量。
- `paper-muted` 用于阅读辅助文字，`paper-line` 用于细分隔线，`paper-field` 用于阅读区域内部状态。
- 实际场景使用暗色 `linear-gradient(130deg, #070b0f, #11191f 60%, #080d12)` 与浅色 `linear-gradient(115deg, #edf1ed, #e5eae7)`；星点降至轻微可见。页头进入阅读章节后改用不透明纸面配色，防止经过的标题透出。

## Typography

**Display / Body Font:** 自托管 Space Grotesk Variable，中文回退 Noto Sans SC Variable，再回退 sans-serif。Unbounded Variable 仍用于旧有共享弹窗、菜单及小游戏的部分样式，不再作为首页和主要章节标题。

首页姓名第一行字重 330，末行 640；轻重和行距形成识别性。单行姓名用 `clamp(70px, 8vw, 136px)`、最大 7ch，并允许长姓名换行。当前故事标题 Traces. 字重 450；Skills 标题 Play. 字重 480。

frontmatter 分别记录姓名、Skills、故事、作品标题和经历条目尺度。联系标题另用 `clamp(60px, 7.6vw, 112px)`、字重 480、行高 1。正文保持独立层级：经历展开正文 14px、行高 2.05；辅助说明 11–13px。小字不承担独立的关键行动。

## Layout

首页和 Skills 是开放的全屏场景；经历与作品是一整块阅读纸面；联系段回到场景，让分解键帽重新出现。固定画布保留 `touch-action: pan-y`。页头桌面高 92px、左右 4.5vw；主要内容边距 7vw。

- 首页高 100svh、最小 680px，内边距 `112px 7vw 150px`，文字宽 54%；底部声音、目录与滚动提示分散排列。
- Skills 高 170svh、最小 1100px。舞台 sticky 于顶部、高 100svh、最小 600px，内层 `112px 7vw 48px`；标题与读数共同退出。
- 经历上方 20vh SVG 接缝和纸面相接；内容内边距 `130px 7vw 100px`。引导为 `1.15fr 1fr`、间距 12vw；经历行以类别、正文、展开箭头构成三列。
- 作品网格 `1.15fr 1fr`，间距 `75px 5vw`，偶数项下错 110px；预览比例 1.28，无通用浏览器窗口边框。
- 联系段内边距 `120px 7vw 110px`，两列空间安排内容与物体；联系内容没有额外卡片外壳。

| 响应条件 | 当前布局 |
| --- | --- |
| ≥1600px | 首页左边距 8vw，姓名 168px，文字宽 52% |
| ≤1000px | 首页左边距 6vw、文字宽 57%；经历列与间距缩窄 |
| ≤767px | 页头 76px、边距 22px；内容边距 24px；首页左对齐、最小 820px；故事、作品、联系单列；作品取消错列 |
| ≤767px 且高度 ≤740px | 首页和 Skills 上内边距 96px；姓名与 Skills 标题进一步缩小 |
| 静态备用 | Skills 回归文档流；键位目录桌面四列、手机两列；联系取消为物体预留的底部空间 |

**The Opaque Chapter Rule.** 经历和作品共享不透明阅读表面；进入这两个状态时隐藏键盘、猫和场景标签，暂停画布并拒绝场景输入。文字不得依靠透明叠加来解决层级。

**The Single Stage Rule.** Skills 标题、读数和操作处在同一个 sticky 舞台，随同一退出动画离场。详情只由 HTML 展示，不重新增加与正文竞争的 3D 文案。

## Elevation & Depth

物理深度由真实键帽、机壳、底板、灯光和场景姿态产生。主要 HTML 阅读内容是平面；实底纸面遮挡空间画布形成章节前后关系。首页链接、经历行、作品与联系不再依赖卡片阴影区分。

仍保留的功能浮层使用原有阴影：主题菜单 `0 12px 25px #0004`，弹窗 `0 32px 100px #0006`。弹窗遮罩模糊 8px，导航遮罩 4px。表单与弹窗中的实底按钮仍有 `inset 0 -3px 1px #0002` 压边；这不适用于首页文字链接。

**The Object Response Rule.** 真实键帽用独立按压状态响应输入；编辑式链接使用下划线延展与箭头位移，阅读行使用展开状态反馈。每类对象使用适合自身的反馈。

## Shapes

阅读区域采用直角矩形图片、开放文字和 1px 分隔线。经历展开箭头使用圆环；静态技能目录使用紧密网格。功能弹窗与输入仍保留既有圆角，frontmatter 列出真实角色，不能将旧卡片圆角重新推广到阅读章节。

OPEN SPACE 标志由两段开放圆角路径和一个中心点构成，表示可进入的空间；它独立于个人姓名。首屏、页头和缺省作品预览使用同一几何来源。后续提供个人标志时应整体替换，不伪称当前图形是个人签名。

## Components

### Links, controls and fields

首页主要行动为文字链接，最小高 44px；下划线从四分之一延展至完整宽度（0.45s），箭头向右上移动（0.4s），按下回收一半距离。声音和键位目录位于首页底部；资料编辑同时存在于首页示意提示、菜单和页脚。

弹窗表单保留主次按钮与带标签字段。作品筛选为带选中下划线的 button，使用 `aria-pressed`；搜索只保留下边线。普通标签不冒充可点击筛选。搜索结果数通过 `aria-live` 更新，空结果可清除条件。

### Experience and projects

经历使用原生 `details/summary`，以细线分隔；悬停标题轻移、圆环箭头旋转，展开后显示完整说明与标签。展开导致高度变化时刷新 ScrollTrigger。

作品整体仍是可聚焦按钮；两列错列布局中，标题在图片下方。真实图片悬停轻微放大（1.035）；缺省预览使用排印与原创标志，悬停标志旋转、词组上移。它们不是实际项目截图。

### Navigation and dialogs

原生 `dialog.showModal()` 提供 Escape 关闭与焦点返回；打开时锁定 body 和 Lenis，实体键快捷键暂停。目录中的访问方式是点击或 Tab + Enter；关闭目录后恢复实体键操作。菜单保留章节导航、资料编辑、小游戏、减少动态与重播开场。

### Opening and seam

开场约 1.4s：标志描边和中心点进入，身份图形淡出，上下幕布分开。每个会话自动播放一次；可跳过、Escape 退出、从菜单重播；2.4s 兜底关闭。减少动态跳过，不显示虚假进度，不等待网络加载来阻挡页面。

章节接缝是本项目绘制的 SVG 三次曲线路径，GSAP 插值 `d`，在 Experience 顶部从视口底部走到 8% 高度之间跟随滚动变平。它借鉴 SeamTransitions 的连续边缘原则，没有移植该演示的 WebGL 着色器。

### Signature keyboard

保留 MIT 原始模型、六列键位结构、分组变换和多来源按键保持，最多 48 个定义键。鼠标、触屏、实体键盘共享输入；点击打开详情，按住快捷键再按 Enter 打开对应内容。输入框、对话框、阅读章节不触发场景快捷键；失焦和切换章节释放按键。

场景状态为 hero → skills → experience → projects → contact；阈值分别位于 Skills 50%、Experience 32%、Projects 70%、Contact 30% 视口处。Experience 和 Projects 隐藏并暂停场景。Skills 内“小猫”触发原模型翻转；猫随指针微转，触碰、实体按键或“摸摸它”触发回弹和两帧击键。离开 Skills 即停止。Contact 保留回转和键帽拆解。

Lenis 是唯一平滑滚动引擎，时长 1.15s，导航 1.25s；GSAP 负责页面和场景，Motion 负责部分弹窗与提示。Hero 与 Skills 的整组 HTML 使用 `autoAlpha` 退出，避免透明内容继续拦截操作。读取当前 DOM 位置、ResizeObserver 和刷新触发点共同应对反向/快速滚动、资料更新、筛选和备用界面尺寸变化。

### Accessibility and fallback

保留跳转正文、语义按钮、字段标签、2px 焦点环与 HTML 目录。系统减少动态或手动静态模式停用 3D、Lenis 和页面 GSAP，使用静态海报与目录，隐藏接缝与开场。手动静态模式不宣称所有 Motion 提示均无动画。

场景错误、上下文丢失或 20s 未加载完成进入备用界面，正文和详情仍可访问。页面隐藏暂停场景；DPR 上限 1.5，自适应画质按帧时调整灯光与阴影。验证结果以 `qa/VERIFICATION.md` 为准。

## Do's and Don'ts

### Do:

- **Do** 保留原键盘模型、输入控制与 MIT 署名。
- **Do** 让阅读章节以实底遮住场景，并在内容高度变化后刷新滚动触发点。
- **Do** 用字重、间距、细线和可见焦点组织主要信息。
- **Do** 保留资料示意标签与本地房间说明。
- **Do** 同时维护鼠标、触屏、实体键盘和 HTML 目录入口。

### Don't:

- **Don't** 把首页行动重新包成成排的实底按钮或边框卡片。
- **Don't** 让透明但仍可交互的离场内容挡住新章节。
- **Don't** 恢复独立固定的技能标题、重复 3D 标签或正文背后的猫动画。
- **Don't** 引入第二套平滑滚动引擎或伪造加载百分比。
- **Don't** 把参考站品牌、示例技术图标或缺省作品当作用户的个人事实。

## Tactile extension — current override

最新视觉以 src/kinetic.css 为准，以上未改的主题、语义和防叠字规则继续适用。首页删除说明句、缩短行动文案；章节为 Play. / Traces. / Made. / Say hello.，详细内容保留在原生展开与详情中。作品图面替换成四种原创数学几何研究，并保留示意标签。

字形的布局槽固定，只有内部视觉 span 做有限位移、挤压、拉伸与斜切；可访问名称完整。按钮和图面使用独立 translate/rotate/scale，避开原有 GSAP transform。分隔线的二次曲线控制点响应鼠标与滚动速度。所有弹簧由现有 GSAP ticker 推进，变形在停止输入后收敛，不引入第二套滚动引擎。

粒子为投影环面上的 620 个点（手机 240），最高约 35fps，DPR 1.5，页面隐藏、离开相关章节或输入静止后停止计算。猫、旋转和粒子均不拦截页面导航。阅读区维持不透明遮罩并暂停场景。减少动态卸载粒子与 3D、清理形变并展示原有静态目录。

键盘采用独立 spinId 旋转和微量伸缩。拖动超过 7px 才转动并抑制点击打开；竖向触屏手势保留滚动，旋转按钮提供不用拖动的入口。原自动首页旋转已移除，防止与用户争夺控制。
