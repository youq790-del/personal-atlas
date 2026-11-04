# 我的个人空间

以一套可以按压的 3D 机械键盘探索 Blender 练习、公众号文章和个人资料。场景和模型深入改编自 [Naresh Khatri 的 MIT 开源作品集](https://github.com/Naresh-Khatri/3d-portfolio)；六颗作品键打开同一空间内的作品展厅，“文章”键展开公众号归档。开放键盘舞台通过短开场、原创标志和 SVG 滚动接缝连接后续阅读章节。研究与改编映射见 [REFERENCE-STUDY.md](REFERENCE-STUDY.md)。

## 开发与发布

需要 Node.js 22.18+。运行 `npm ci` 安装，`npm run dev` 启动开发；`npm run typecheck` 检查 TypeScript，`npm test` 检查多来源按键状态、自定义快捷键、双客户端 WebSocket 通信及公众号资料校验，`npm run build` 输出静态 `dist/`。

仓库包含 GitHub Pages Actions：推送 `main` 后构建和发布；Vite 使用相对 `base`，模型、音效、本地字体和 Chibi 字体支持 `/personal-atlas/` 子路径。此处说明部署机制，不表示当前改动已公开上线；实际验证和发布状态见 [qa/VERIFICATION.md](qa/VERIFICATION.md)。

## 添加真实资料

首页“资料待填”、菜单“编辑个人资料”和页脚“编辑资料”均可进入资料编辑，修改姓名、身份、介绍与邮箱，也可导入或导出 JSON。所有浏览器编辑只保存在本机，不会直接修改公网内容。未提供的真实经历、成就和技能必须保留示意标记。更新公开资料时，将导出的 JSON 整合到 `src/default-profile.js` / `src/data.ts` 并重新发布。

完整模板为 `public/profile-template.json`。保留 `version: 1` 与 `facets` 中的 `skills`、`traits`、`interests`。档案分类是 `project`、`achievement`、`experience`、`note`；作品可填 HTTPS `image` 和 `url`。

键盘默认由六颗作品键和十二颗操作键组成：作品为粒子、草地、波普、玻璃、云与有机方块；操作为文章、关于、能力、经历、成就、作品、联系、明暗、音效、旋转、摸猫与首页。作品键打开展厅，文章键打开阅读舞台，其他操作键触发对应导航或控制；关于和能力共用个人介绍，经历和成就共用经历章节。

可选 `keyboard` 数组用于追加自定义内容键，每项必填 `label`、`description`，选填 `title`、`color`（六位十六进制）、`icon`（本地或 HTTPS 图标）、`hotkey`（唯一字母或数字）。渲染后的总数上限为 48：默认 18 键加最多 30 个自定义键；超过总数上限的项不显示。自动键位会避开已指定快捷键。没有实体按键映射的键可用鼠标、触屏或 HTML 键位目录访问。自定义内容键仍显示资料详情，不会自动变成 Blender 作品。

## Blender 作品与公众号

`src/portfolio.ts` 维护六个作品入口，海报保存在 `public/assets/works/{particles,grass,pop,liquid,cloud,organic}/poster.webp`，全部是 1280×720 的真实场景预览。波普练习另有 3.666 秒的 `pop/film.mp4`，由用户文件旁已有动画转码；其余五件当前展示静态渲染，不能把鼠标倾斜和放大效果理解为已将原始场景转成网页实时 3D。源 `.blend` 未随网站分发，也未被覆盖保存。作品标题为展示标题，原文件名、来源和临时渲染设置见 [ASSETS.md](ASSETS.md)。

公众号已由用户确认为 **yo7的堂吉诃德**，原始 ID 为 `gh_29c0b927a35c`。`src/archived-writing.ts` 收录六篇用户本地归档正文：《波》《指针与数组》《breaking bad》《常见离散随机分布》《我怎么证明我感受到了风》《反方向的钟》。访客可展开阅读，并复制公众号名称或账号去微信搜索。

目前未取得公众号主页及这六篇文章的公开原文 URL；页面明确显示“原文链接待补充”，不构造未经验证的微信链接。原文配图和图片内公式未归档，阅读中保留缺图提示。资料编辑器的“微信公众号”区域可补充公开主页、文章链接、摘要、日期、封面与关联作品编号；保存只影响当前浏览器。`wechat` JSON 可保留已有 `body` 正文；链接仅接受有效的微信公开地址。`workId` 当前用于保存关联信息，尚不自动把某篇文章嵌入对应 Blender 作品。

## 操作

- 悬停或按住实体键盘可以按下键帽；点击键帽打开内容，按住对应快捷键再按 Enter 也可打开。输入框、对话框和阅读章节内暂停场景快捷键。
- 靠近作品键时标题随作品改变；按下后键盘聚焦对应键位，作品在原位展厅展开。展厅可放大、切换上一件/下一件或直接选作品；按 Escape 先退出放大，再返回键盘。波普短片由“播放作品”按钮启动，切换作品或页面转入后台时暂停。
- 作品区提供六件真实海报和公众号书架；点击海报回到键盘舞台展示同一件作品。“文章”键与作品区书架均可展开六篇本地文章归档。
- 向下滚动，从首页键盘进入 Skills，再经曲面接缝进入经历与作品。阅读区域隐藏并暂停场景，联系区域重新出现拆解键帽；导航可以直接跳转。
- Skills 的“小猫”触发翻转，触碰猫或“摸摸它”使它回弹、击键；“键盘”恢复。拖拽机身或键帽旋转，“旋转”提供可键盘操作的同等入口。竖向触屏手势保留翻页。
- 首页底部控制声音与键位目录；顶栏切换主题、聊天室与小游戏。目录支持点击或 Tab + Enter，关闭后恢复实体快捷键。
- 开场每会话自动播放一次，可以跳过或按 Escape；菜单可重播。系统减少动态、菜单静态模式和 WebGL 失败均提供静态海报及 HTML 目录，作品与文章仍可浏览；这依赖页面 JavaScript，不等同于无 JavaScript 的完整阅读版。
- 在非输入框内键入 `curiosity` 触发短暂彩蛋。

## 实时多人

上游项目没有开源其多人后端。本项目提供独立的 `server/realtime.mjs`。本地另一终端运行 `npm run realtime`，默认端口 4175。

生产部署此服务需要支持长连接的 Node 主机，GitHub Pages 只能托管前端。设置 `PORT`、`ALLOWED_ORIGINS=https://youq790-del.github.io`，通过 HTTPS/WSS 反向代理公开。消息限长、限速，服务器保持连接首次加入的身份并进行心跳清理；消息仅在内存中转发，不作持久保存。

前端构建环境设置 `VITE_REALTIME_URL=wss://你的后端域名`。未设置或连接失败时，只在同源浏览器标签页间通过 BroadcastChannel 互通，页面明确标注“本地房间”。开发环境自动尝试 4175。当前没有已配置的公网实时服务，不宣称跨设备聊天已上线。

## 主要文件

- `src/App.tsx`：内容、资料、章节和覆盖层。
- `src/space.css`：共享基础界面；`src/refinement.css`：前一轮首页和阅读章节样式；最新 src/kinetic.css 最后加载。
- `src/Brand.tsx`、`OpeningSequence.tsx`、`intro.css`：原创标志和可跳过开场。
- `src/SeamTransition.tsx`：SVG 接缝及 ScrollTrigger 编排。
- `src/scene/`：原版场景分组、模型、动作、输入控制和自适应画质。
- `src/data.ts` / `Editor.tsx`：资料验证与本地编辑。
- `src/portfolio.ts` / `WorkStage.tsx` / `work-stage.css`：六件 Blender 练习、聚焦展厅与作品画廊。
- `src/archived-writing.ts` / `wechat.ts` / `WeChatShelf.tsx` / `wechat.css`：公众号本地正文、公开链接校验、阅读书架和编辑区域。
- `src/realtime.tsx` / `server/realtime.mjs`：多人连接与可选服务。

设计规范见 [DESIGN.md](DESIGN.md)，素材和许可证见 [ASSETS.md](ASSETS.md)。

## 触觉版本

主要标题按字形受鼠标挤压，按钮与图面磁性偏移，SVG 分隔线被拉弯；滚动速度驱动有界伸缩，停滚后弹簧复位。首页与联系区展示原创粒子环，鼠标扰动后回到原位。src/KineticSurface.tsx 与 kinetic.css 为这一层的实现。减少动态停用弹簧、粒子及 3D；图形和内容仍完整。
