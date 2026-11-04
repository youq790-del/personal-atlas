# Reference implementation study

研究与改编日期：2026-11-03。主要代码来源为 [Naresh-Khatri/3d-portfolio](https://github.com/Naresh-Khatri/3d-portfolio)，其 MIT 声明保留于 `licenses/Naresh-Khatri-MIT.txt`。最新界面参考 [Giats](https://giats.me/)、[SeamTransitions](https://tympanus.net/Demos/SeamTransitions) 和 [Lusion](https://lusion.co/)。后面三个参考用于视觉与运动原则，未复制其标志、个人作品、私有服务或着色器。

## Original foundation retained

最早的实现将小键盘放在带边框的侧栏，无法体现 Naresh 项目的空间结构。当前保留真实模型与固定、透明、全视口画布，按键通过多层场景组处理摆放、揭示、旋转和按压。

| 上游来源 | 实现机制 | 当前应用 |
| --- | --- | --- |
| `keyboard/scene.ts`、`key-well.ts`、`keycaps.glb` | Chibi 场景、真实雕塑键帽、底板、六列阵列 | 移植模型和场景结构，保留材质、灯光、布局及正交相机关系 |
| `keyboard/motion.ts` | 独立摆放、揭示、旋转、运动、按压分组；GSAP 场景姿态 | 保留首页组装、Skills 操作、联系拆解；新增独立阅读状态；翻转与小猫迁入 Skills 的主动入口 |
| `keyboard/input.ts` | 按输入来源保持按键状态 | 鼠标、实体键盘、点击和触屏共用；对话框及阅读章节暂停 |
| `keyboard/use-adaptive-graphics.ts` | 帧时窗口调节质量、阴影及 DPR | 保留自适应画质，隐藏文档或阅读状态暂停画布 |
| 原版首页与技能章节 | 开放画布、超大字、全屏探索 | 保留物体主导；当前改用 Space Grotesk 轻重字排版和统一 Skills 舞台 |
| 原版主题、导航与多人展示 | 展开菜单、主题、聊天与访客光标 | 使用原生 dialog；独立可选 WebSocket 后端及诚实的本地备用状态 |

## Why the overlap occurred

用户截图呈现 Skills 标题、读数与场景标签同时压到 Experience。问题来自多个彼此独立的驻留层：技能标题独立 sticky，读数与全屏场景继续显示，而 Experience 没有自己的场景状态；透明阅读区域无法遮住画布。改变字号或提高正文层级不能消除这些生命周期冲突。

当前修复将标题、读数和操作收进同一 `.skills-stage`，以整组 `autoAlpha` 离场；去掉重复的 3D 文案。Experience 与 Projects 使用各自阅读状态，隐藏键盘、猫、标签和计数器，暂停渲染并拒绝场景输入。两个章节包在不透明 `.editorial-world` 中，页头经过该区域时也采用不透明纸面。

场景 resolver 读取当前 DOM 位置，避免快速或反向滚动依赖过期状态。资料变化、筛选、静态模式、WebGL 备用状态和经历展开后刷新 ScrollTrigger；ResizeObserver 捕捉内容高度变化。

## Current reference adaptations

| 用户参考 | 借鉴原则 | 本项目落地与边界 |
| --- | --- | --- |
| Giats | 大字、轻重关系、留白、少边框、编辑式排列 | 姓名字重 360/660；文字行动与箭头；细线经历行；两列错列作品；联系去卡片外壳。没有复制该站身份与项目 |
| SeamTransitions | 下一章节边缘成为滚动过渡的一部分 | `SeamTransition.tsx` 使用本项目绘制的 SVG 三次曲线，以 GSAP `attr:d` 从波浪插值到平边；实底阅读章节覆盖场景。这是几何边缘方案，不是原演示 WebGL 着色器的逐帧复刻 |
| Lusion | 简短品牌揭示、物体感与克制的开场节奏 | 原创 OPEN SPACE 双路径与中心点；GSAP 描边后上下幕布退出，约 1.4s、可跳过、每会话一次。未复制 Lusion 字标或品牌图形 |

原版首页、Skills 与联系保留空间连续性；阅读章节刻意暂停场景，让真实内容有安静表面。小猫通过 Skills 内的“叫醒小猫”保留趣味，不再自动出现于作品正文背后。

## Runtime contract

- 章节：介绍 → 可操作 Skills → 实底经历与作品 → 联系及拆解键帽。
- 页面主显示与正文使用自托管 Space Grotesk，中文使用 Noto Sans SC；旧共享界面部分保留 Unbounded。
- Lenis 是唯一平滑滚动引擎；GSAP 负责场景、开场和接缝；Motion 负责部分覆盖层。
- 系统减少动态和手动静态模式提供 HTML 目录与海报；场景失败不影响阅读、编辑和详情访问。
- 示例技能、缺省作品与身份文本明确标注。未导入原作者身份、联系信息、作品、分析脚本或服务地址。
- 上游多人后端未公开。项目提供独立 Node WebSocket 示例；未配置公网服务时如实显示本地房间。

## Provenance

键帽模型、声音、猫帧与示例技术图标来自 MIT 仓库，保留本地资源与许可证。OPEN SPACE 标记、SVG 接缝、当前编辑式界面和示意作品排印由本项目绘制。具体资源清单见 [ASSETS.md](ASSETS.md)。

## 2026-11-03：触觉响应迭代

实看用户两张 Lusion 截图与 About 页面：提取粒子群、巨大字形、低文字密度和对象对动作的反馈。当前实现选择原创环形粒子场，不复刻人物点云；通过弹簧驱动单字挤压、位移和斜切，通过滚动速度驱动伸缩；分隔线使用二次曲线响应指针。键盘旋转在独立 spinId 分组叠加，不与章节 GSAP 姿态争用。小猫保持上游模型，以触碰或按钮触发挤压和两帧击键。
