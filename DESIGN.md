---
name: "Personal Atlas"
description: "yo7 的作品、学习笔记与可操作的问题"
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
  artwork-title:
    fontFamily: "'Noto Serif SC Variable', serif"
    fontSize: "clamp(24px, 2.2vw, 34px)"
    fontWeight: 550
    lineHeight: 1.4
    letterSpacing: "-0.045em"
  specimen-word:
    fontFamily: "'Newsreader Variable', Georgia, serif"
    fontSize: "clamp(22px, 3vw, 44px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
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
  artwork-preview:
    textColor: "{colors.paper-ink}"
    typography: "{typography.artwork-title}"
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

**当前方向：让访客从具体问题和真实作品认识 yo7。**

主角是重视思考与记录、也做视觉练习的 yo7。25 篇完整公众号文章和六件 Blender 练习构成个人内容；不据此虚构院校、专业资格、商业项目或奖项。首层少写定义作者的句子，先让访客拨一下摆球、改变曲面或调节波，再看到问题从哪里来、还有什么没确定。作品和文章都保留直接入口。

保留 Naresh Khatri 的真实机械键盘与开放画布，将页面分成可触的空间与安静的阅读章节。首页靠字重、比例与留白组织信息；个人叙事和作品以不透明的浅灰绿纸面承接，滚动时形成清楚的前后关系。新的 Santioni 研究只转译其强烈衬线字体、章节推进和直接内容路径，未复制品牌、酒类内容或视觉素材。

既有 Giats、SeamTransitions 和 Lusion 参考形成编辑留白、连续接缝与短开场，真实 Blender 作品保留不对称的弹性轮廓。公众号区域现为可操作的问题、简洁目录与独立完整阅读器。流动形状属于展示表面，作品构图和原文内容仍可完整查看。OPEN SPACE 标记、SVG 接缝、作品轮廓和数学流线为本项目绘制。

本次记录更新于 2026-11-04：最新用户要求全站去掉 AI 式口号、减少文字，以艺术化交互呈现实际思考。当前新增 ThinkingDesk、25 篇完整图文与公开索引读取。描述不代表本轮动态、响应式或公开发布已经验收；本轮验收由任务负责人另行记录。

历史方案使用过“让思考有形状”和“一半在推演，一半在造形”。两者已退出当前设计文案；保留在这里仅说明历史，不作为后续生成文字的方向。

**Key Characteristics:**

- 真实键帽保留按压、声音与空间姿态，视觉重心不被容器边框打断。
- Newsreader 的大写意姓名与 Noto Serif SC 的中文叙事建立身份；Space Grotesk 承担场景文字、日期与操作，区分观赏、阅读和控制层。
- 开放深空或日光场景，连接固定浅灰绿的阅读纸面。
- 首页文字链接、分隔线经历、不对称作品轮廓与散页文章共同组成内容层；不把所有内容压进重复矩形板。
- 同一技能舞台统一进入与退出；静态模式保留等价内容入口。
- 认识人、看作品、读文章都有可见直达入口；互动键盘是探索方式之一。
- “在学 / Blender / 日常”用短原句和真实练习交代作者；咖啡、滤纸、波三个问题提供进一步探索，页尾保留公众号账号与阅读入口。

当前公众号规则以 `ThinkingDesk.tsx` / `thinking-desk.css`、`WeChatShelf.tsx` / `reading-room.css` 为准，优先于旧散页方案。`identity.css`、`PersonalPortrait.tsx` / `personal-portrait.css` 与 `ReaderPostscript.tsx` 承担身份和个人章节。`specimen.css`、`kinetic.css`、`work-stage.css`、`ElasticFrame.tsx` / `elastic-frame.css` 及未修改的场景、品牌、开场、接缝规则继续适用。frontmatter 与 `.impeccable/design.json` 保留既有基础 token 快照，不将新增覆盖层误写成已重新生成的 token。产品事实与来源分别见 `PRODUCT.md`、`REFERENCE-STUDY.md` 和 `ASSETS.md`。

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

**本轮身份覆盖：** 首页单行姓名采用 Newsreader / Noto Serif SC 衬线体，大尺度、轻字重和紧密字距形成识别性；中文主张、个人章节和结尾标题使用 Noto Serif SC。`identity.css` 与 `personal-portrait.css` 是这些新位置的具体字号来源。以下基础尺度及旧章节字样保留为既有系统记录，不覆盖本轮身份标题。

**Display / Controls:** 自托管 Space Grotesk Variable，中文回退 Noto Sans SC Variable，再回退 sans-serif。Unbounded Variable 仍用于旧有共享弹窗、菜单及小游戏的部分样式，不再作为首页和主要章节标题。

**Artwork / Reading:** Noto Serif SC Variable 用于中文作品标题与公众号阅读层；Newsreader Variable 用于拉丁短词及编辑式衬线节奏；Space Grotesk 保留日期、账号、动作和辅助信息的清楚轮廓。三者按职责分配，不逐词混用。独立阅读页采用稳定的衬线正文和等宽代码回退，完整原文、图片、SVG 公式保持自然阅读次序，不随装饰轮廓裁切。

frontmatter 的 `artwork-title` 与 `specimen-word` 从作品样式提取。公众号目录、问题台与阅读器的具体字号和断点以 `reading-room.css`、`thinking-desk.css` 为准，本次不把新增覆盖值写成已重新生成的规范 token。

首页姓名第一行字重 330，末行 640；轻重和行距形成识别性。单行姓名用 `clamp(70px, 8vw, 136px)`、最大 7ch，并允许长姓名换行。当前故事标题 Traces. 字重 450；Skills 标题 Play. 字重 480。

frontmatter 分别记录姓名、Skills、故事、作品标题和经历条目尺度。联系标题另用 `clamp(60px, 7.6vw, 112px)`、字重 480、行高 1。正文保持独立层级：经历展开正文 14px、行高 2.05；辅助说明 11–13px。小字不承担独立的关键行动。

## Layout

### Current personal narrative

首页交代 yo7、正在做的事和直接入口，避免长段身份定义。页头提供认识与阅读路径；移动端保留首屏、菜单和正文中的等价入口。交互机械键盘继续承担作品探索，但不能成为找到个人信息的前置门槛。

进入纸面后的个人章节用草地、玻璃等真实预览和短原句安排“在学 / Blender / 日常”。使用原生按钮和 tabs 语义切换，方向键、Home / End 可选择。“为什么？”“试试。”“下课了。”等具体短语承接动作，不再以对仗口号解释作者，也不添加未经证实的成就指标。

| 侧面 | 内容依据 | 直接入口 |
| --- | --- | --- |
| 在学 | 物理、代码与实验观察；《波》中关于能量与平方的提问 | `writing-a06` 对应归档文章 |
| Blender | Blender 材质与几何节点练习；《breaking bad》中关于滤纸形变的观察 | 真实 Blender 作品与 `writing-a04` |
| 日常 | 《波》中的早上打球等生活片段 | `writing-a06`，保留其完整上下文 |

个人章节之后是六件 Blender 练习与公众号问题台、文章目录。结尾保留公众号账号、复制和阅读入口，已有邮箱仍使用真实邮件入口。标题与动作尽量短，避免把阅读行为再包装成宣言。未填写资料的模板条目不作为个人事实公开展示，编辑入口保留。

首页和 Skills 是开放的全屏场景；经历与作品是一整块阅读纸面；联系段回到场景，让分解键帽重新出现。固定画布保留 `touch-action: pan-y`。页头桌面高 92px、左右 4.5vw；主要内容边距 7vw。

- 首页高 100svh、最小 680px，内边距 `112px 7vw 150px`，文字宽 54%；底部声音、目录与滚动提示分散排列。
- Skills 高 170svh、最小 1100px。舞台 sticky 于顶部、高 100svh、最小 600px，内层 `112px 7vw 48px`；标题与读数共同退出。
- 经历上方 20vh SVG 接缝和纸面相接；内容内边距 `130px 7vw 100px`。引导为 `1.15fr 1fr`、间距 12vw；经历行以类别、正文、展开箭头构成三列。
- 真实作品网格为 `1.05fr .95fr`，列距 7vw、行距 86px，偶数项下错 100px；图面比例按作品变化，轮廓由 ElasticFrame 定义。公众号问题台与目录承接其后；标题、日期、搜索和阅读动作在文档流中保持顺序。
- 作品聚焦时，完整图像与缩小的可操作键盘共处同一舞台；`contain` 保留完整构图。装饰曲线位于其后，不能挤走返回、切换、播放与放大控件。
- 编辑式内容区的数学流线位于文字与操作下方，沿鼠标和滚动输入缓慢弯曲；不占用内容布局槽，不接管滚动和点击。
- 联系段内边距 `120px 7vw 110px`，两列空间安排内容与物体；联系内容没有额外卡片外壳。

| 响应条件 | 当前布局 |
| --- | --- |
| ≥1600px | 首页左边距 8vw，姓名 168px，文字宽 52% |
| ≤1000px | 首页左边距 6vw、文字宽 57%；经历列与间距缩窄 |
| ≤767px | 页头 76px、边距 22px；内容边距 24px；首页左对齐、最小 820px；故事、作品、联系单列；作品取消错列 |
| ≤767px 且高度 ≤740px | 首页和 Skills 上内边距 96px；姓名与 Skills 标题进一步缩小 |
| 静态备用 | Skills 回归文档流；键位目录桌面四列、手机两列；联系取消为物体预留的底部空间 |

**The Opaque Chapter Rule.** 经历和作品共享不透明阅读表面；进入这两个状态时隐藏键盘、猫和场景标签，暂停画布并拒绝场景输入。文字不得依靠透明叠加来解决层级。

**The Single Stage Rule.** Skills 标题、读数和操作处在同一个 sticky 舞台，随同一退出动画离场。作品和文章由 HTML 展示，聚焦后隐藏重复标题与索引；不重新增加与正文竞争的 3D 文案。

**The Stable Content Rule.** 曲线形变只改变视觉皮肤，文本、焦点、命中范围和文档流保持稳定。阅读展开后以理解正文为主，停止追逐鼠标的装饰动作。

## Elevation & Depth

物理深度由真实键帽、机壳、底板、灯光和场景姿态产生。主要 HTML 阅读内容是平面；实底纸面遮挡空间画布形成章节前后关系。首页链接、经历行、作品与联系不再依赖卡片阴影区分。

仍保留的功能浮层使用原有阴影：主题菜单 `0 12px 25px #0004`，弹窗 `0 32px 100px #0006`。弹窗遮罩模糊 8px，导航遮罩 4px。表单与弹窗中的实底按钮仍有 `inset 0 -3px 1px #0002` 压边；这不适用于首页文字链接。

**The Object Response Rule.** 真实键帽用独立按压状态响应输入；编辑式链接使用下划线延展与箭头位移，阅读行使用展开状态反馈。每类对象使用适合自身的反馈。

## Shapes

真实作品使用六组不对称 SVG 曲线轮廓，取代矩形图片板；轮廓点与控制线呈现同一片可受力表面。预览可按轮廓裁切，进入作品后必须以 `contain` 显示完整画面；放大查看不继续施加边缘挤压。

公众号以摆球、曲面网格和波形承载可操作的问题，文章目录采用清楚的日期、标题和箭头。完整正文另置阅读层：不能裁掉标题、账号或全文入口，不能把原文段落拆成视觉拼贴。

经历仍采用开放文字与 1px 分隔线，展开箭头使用圆环；静态技能目录使用紧密网格。功能弹窗与输入保留既有圆角，frontmatter 列出真实角色，不将弹窗样式推广成作品外壳。

OPEN SPACE 标志由两段开放圆角路径和一个中心点构成，表示可进入的空间；它独立于个人姓名。首屏、页头和缺省作品预览使用同一几何来源。后续提供个人标志时应整体替换，不伪称当前图形是个人签名。

## Components

### Links, controls and fields

首页主要行动为文字链接，最小高 44px；下划线从四分之一延展至完整宽度（0.45s），箭头向右上移动（0.4s），按下回收一半距离。声音和键位目录位于首页底部；资料编辑同时存在于首页示意提示、菜单和页脚。

弹窗表单保留主次按钮与带标签字段。作品筛选为带选中下划线的 button，使用 `aria-pressed`；搜索只保留下边线。普通标签不冒充可点击筛选。搜索结果数通过 `aria-live` 更新，空结果可清除条件。

### Experience and projects

经历使用原生 `details/summary`，以细线分隔；悬停标题轻移、圆环箭头旋转，展开后显示完整说明与标签。展开导致高度变化时刷新 ScrollTrigger。

真实作品整体仍是可聚焦按钮。两列错列布局中，ElasticFrame 包住预览图，衬线标题在下方，圆形探索动作贴近轮廓；静态模式保留形状和全部入口。其余档案中的数学示意图继续明确标为示意，不能与六件真实 Blender 练习混淆。

### ElasticFrame

固定布局槽内使用 SVG `clipPath` 和一条同形描边；每件作品选择独立轮廓。当前轮廓由十个节点闭合为三次曲线，GSAP ticker 推进带阻尼的节点弹簧。鼠标靠近时局部向外推开，滚动速度带来有界纵向拉伸与轻微剪切，输入停止后回到基准形状。它是视觉弹簧近似，不称为完整软体物理。

离屏、页面隐藏、减少动态与手动静态模式暂停形变并恢复基准轮廓。保留 `touch-action: pan-y`，不新增平滑滚动引擎。作品详情通过独立内容层保留 `contain`，轮廓只作用于背景和描边；键盘旋转与作品预览的形变不能互相争用 transform。

### ThinkingDesk and complete reading

公众号名称、已确认 ID、真实标题、日期与正文保留。用户提供的完整 zip 支持 25 篇图文，日期为 2026-07-22 至 2026-11-03，含 342 张图片、32 个内联 SVG 和 25 条真实公开文章 URL。历史六篇和缺图限制已经解除；不得据此声称技术推导经过逐条验算。

ThinkingDesk 提供三个语义 tab：咖啡、滤纸、波。咖啡可拨动摆球并调整挂点；滤纸可改变曲率；波可调振幅和拨动。原生按钮与滑杆提供不依赖拖拽的操作路径。模型是数学示意，明确保留“示意，非实测”；它们不能把原文的猜测变成已证实结论。模型离屏、页面隐藏或用户减少动态时停止持续运动，仍保留静态状态、调节和阅读入口。

每个问题只显示一条短引，随“观察 / 猜测 / 未确定”或“观察 / 解释 / 再问”的选择切换。9 条引用已逐条核对原文，引用作为作者思考的出处，不由摘要模型代写。“换成手提，就稳了？”“为什么偏偏是马鞍面？”“怎么又是平方？”是入口问题，不当作科学结论。关联文章保持真实日期与出处。

公开索引由 `content/wechat.json` 按部署 base 获取。默认展示最近三篇，提供“全部 25 篇”和全文搜索；文章数量来自实际索引，不是固定成就数字。`openArticle: { id, token }` 保留跨章节打开文章能力；新的 token 可以再次打开同一 ID。

全文在 Modal 内按需加载独立 HTML iframe，使用空 `sandbox`、`no-referrer` 与净化阅读页的 CSP，禁止文章脚本。342 张本地图片和 SVG 公式保留；父页面提供微信原文链接。若无 readerPath，正文可退回纯文本，或使用真实原文 URL。打开阅读器暂停场景快捷键，阅读期间内容稳定，关闭恢复焦点；不再沿用旧散页 `details` 的展开机制。

每隔 7 天更新的本机 heartbeat 方案详见 `PRODUCT.md`。它已启用为每周三 09:00（America/Los_Angeles），依赖本机运行与有效后台登录，不是实时 feed；访客界面不放实现配置说明，也不显示没有证据的“实时同步”状态。

### Color study and reader bookmark

作品预览的色彩探照只作用于支持悬停的精细指针：平时降低图像饱和度，鼠标附近的圆形窗口显露原作色彩。触屏、键盘焦点和减少动态保留完整颜色；这是预览反馈，不改变真实作品文件。作品聚焦仍显示完整图像，形变和色彩窗口不遮住控件。

收尾公众号书签把账号作为可带走的信息：折角、轻微倾斜、复制后的颜色与明确文案共同提供反馈。复制失败显示可手动搜索的账号，不把视觉成功状态当作剪贴板成功。书签优先服务阅读延续，聊天室为次要可选入口；不伪造未配置的公网在线状态。

### Editorial flow field

编辑式阅读区域背景由原创数学流线构成。指针影响附近曲率，滚动输入形成起伏，流线收敛回基准排列；线条保持低对比且不越过文字的可读阈值。层级位于内容后方，装饰 SVG 不提供可访问名称、不拦截指针。静态模式显示基准流线或同等静态背景，正文和控件始终完整。

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
- **Do** 允许预览轮廓裁切，但始终提供保留完整构图的作品查看。
- **Do** 把问题模型、背景流线与真实文章正文分层；打开全文时优先保证阅读稳定。

### Don't:

- **Don't** 把首页行动重新包成成排的实底按钮或边框卡片。
- **Don't** 让透明但仍可交互的离场内容挡住新章节。
- **Don't** 恢复独立固定的技能标题、重复 3D 标签或正文背后的猫动画。
- **Don't** 引入第二套平滑滚动引擎或伪造加载百分比。
- **Don't** 让曲线裁切藏掉按钮、焦点、原文段落或作品完整查看入口。
- **Don't** 将本轮设计方向、静态组件示意或源码检查写成已经完成的视觉验收。
- **Don't** 把参考站品牌、示例技术图标或缺省作品当作用户的个人事实。

## Tactile extension — current override

前一轮触觉基础以 `src/kinetic.css` 为准，以上主题、语义和防叠字规则继续适用。其 Play. / Traces. / Made. / Say hello. 章节记为前一轮基础；本轮通过 `identity.css` 与个人章节将身份、真实写作和结尾阅读路径具体化，见上文 Current personal narrative。四种原创数学几何研究仅用于未填资料的示意档案，不作为用户真实作品公开展示；真实 Blender 作品采用上文 ElasticFrame 与完整作品查看规则。

字形的布局槽固定，只有内部视觉 span 做有限位移、挤压、拉伸与斜切；可访问名称完整。按钮和图面使用独立 translate/rotate/scale，避开原有 GSAP transform。分隔线的二次曲线控制点响应鼠标与滚动速度。所有弹簧由现有 GSAP ticker 推进，变形在停止输入后收敛，不引入第二套滚动引擎。

粒子为投影环面上的 620 个点（手机 240），最高约 35fps，DPR 1.5，页面隐藏、离开相关章节或输入静止后停止计算。猫、旋转和粒子均不拦截页面导航。阅读区维持不透明遮罩并暂停场景。减少动态卸载粒子与 3D、清理形变并展示原有静态目录。

键盘采用独立 spinId 旋转和微量伸缩。拖动超过 7px 才转动并抑制点击打开；竖向触屏手势保留滚动，旋转按钮提供不用拖动的入口。原自动首页旋转已移除，防止与用户争夺控制。
