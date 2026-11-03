# 个人开放档案

面向个人介绍、作品展示与合作联系的静态网站。真实资料整理好后，可以从首页“编辑我的档案”导入 JSON 预览。

## 本地预览

安装 Node.js 22+，在此目录运行：

```sh
npm install
npm run dev
```

需要部署时运行 `npm run build`，将生成的 `dist/` 目录发布到任意静态网页托管服务。仓库包含 GitHub Actions 工作流；推送到 `main` 后会自动构建并发布至 GitHub Pages。首次发布前，在仓库 Settings → Pages 将 Build and deployment 的 Source 设为 GitHub Actions。

## 补充个人资料

下载 `public/profile-template.json` 并按现有字段整理文字，或先在编辑面板填基本信息。类别字段可选 `project`、`achievement`、`experience`、`note`。不要删除 `version`、`facets` 等结构字段。可选的 `keyboard` 数组用于指定键盘键位；每项填写 `group`（`skill`、`project`、`achievement`、`experience`、`note`、`custom`）、`label`、`description`，还可填写 `shortLabel`、`title`、`hotkey`、`color`。省略 `keyboard` 时，键位会从技能标签、档案条目和功能入口自动生成。

留言、在线人数和光标默认通过 `BroadcastChannel` 在同源的本地浏览器标签页间互通。要让不同访客通过公网实时协作，在构建环境设置 `VITE_REALTIME_URL` 为 `wss://` WebSocket 地址。服务端应将客户端发来的 JSON 消息转发给同一 `room` 的其他客户端，消息类型包含 `join`、`presence`、`leave`、`cursor`、`chat`；原样保留 `id`、`name`、`room`、`color`、`x`、`y`、`text` 等字段。当前仓库不包含 WebSocket 服务端，因此 GitHub Pages 上默认仍是本地标签页互通模式。

浏览器中的编辑会保存在本机，只在当前浏览器有效。使用“导出当前档案”备份；要发布正式内容，将 JSON 发回以更新公开数据。首页内容示意并非真实个人资料或成就。

## 包含内容

- `index.html`：页面结构。
- `src/default-profile.js`：未导入资料时的明确标注示例。
- `public/profile-template.json`：完整个人资料模板。
- `src/style.css`、`src/polish.css`：视觉系统、响应式布局和 reduced-motion 状态。
- `src/main.js`：筛选、键盘可操作的个人切面标签、随机档案入口、资料导入/导出和本地保存。
