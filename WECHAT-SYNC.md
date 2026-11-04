# 公众号文章更新

当前公众号为个人主体、未认证，无法使用微信官方的“获取已发布消息列表”接口。网站已有文章仍来自用户提供的完整归档。这里的脚本是导入与可选接口基础设施，不表示已经接通官方实时同步。

已启用本机定时任务「每周更新公众号网站」：每周三 09:00（America/Los_Angeles），间隔 7 天。执行步骤见 `WEEKLY-WECHAT.md`；电脑和 Codex 需运行，公众号需保持登录。官方 API 工作流仍关闭。

## 当前可用的安全导入

`public/content/wechat.json` 是公开索引。文章正文页面和图片保存在 `public/content/articles/<id>/`，由前端以受限 iframe 阅读。更新流程应只处理已经发表的公开文章，不能发布草稿、管理后台页面、登录 Cookie 或会话参数。

把已经核实的公开内容整理为以下 JSON（示例地址仅展示结构，实际使用真实公开链接）：

```json
{
  "source": "published-public",
  "articles": [
    {
      "publicationStatus": "published",
      "id": "writing-new",
      "title": "真实文章标题",
      "publishedAt": "2026-11-04",
      "url": "https://mp.weixin.qq.com/s/PUBLIC_ARTICLE_ID",
      "body": "原文纯文本",
      "readerPath": "content/articles/writing-new/index.html"
    }
  ]
}
```

先创建并检查净化后的静态阅读页，再从项目目录执行：

```text
node scripts/import-published.mjs path/to/published-articles.json
```

也可将 JSON 输入标准输入，参数使用 `-`。导入器校验发表标记、公开微信文章 URL、日期、文章编号、阅读页路径和文件是否存在；拒绝含后台会话参数的地址。只更新完整通过校验的数据，同 URL 合并，保留原始文章 ID、已有人工整理的思考线索等字段。完全无变化时不写文件，不触发无意义部署。正文保留纯文本，不执行其中的 HTML。

索引导入器不把未经检查的 HTML 转成安全页面。调用方负责先净化静态阅读页，并保留 iframe 的 sandbox、CSP 与资源约束；不得将原公众号后台 HTML 直接发布。

自动检查后台属于另一个运行环节，需要有效登录和能持续执行的任务。登录失效时应报告并暂停该次更新；不能把定时检查描述为微信原生实时推送。当前项目不保存浏览器会话凭据。只在取得新公开文章并完成本地验收后，提交相应静态内容并推送 `main`，现有 Pages 工作流会部署。

## 未来有权限时的官方接口

官方发布列表接口：

- [发布能力说明](https://developers.weixin.qq.com/doc/service/guide/product/publish.md)：2025 年 7 月起，个人主体、企业未认证及不支持认证的账号回收发布接口权限。
- [获取已发布的消息列表](https://developers.weixin.qq.com/doc/service/api/public/api_freepublish_batchget.md)：`POST /cgi-bin/freepublish/batchget`，每页 1–20 条；公众号仅支持企业主体已认证账号，返回 `48001` 表示无权限。
- [稳定版 Access Token](https://developers.weixin.qq.com/doc/service/api/base/api_getstableaccesstoken.md)：服务器端使用 AppID/AppSecret；普通模式 `force_refresh:false`，无需使其他有效令牌失效；`40164` 表示调用服务器出口 IP 未在白名单。
- [普通 Access Token](https://developers.weixin.qq.com/doc/service/api/base/api_getaccesstoken.md)：官方推荐改用稳定版接口。

以上为 2026-11-04 查阅的官方说明。后台网址中的 `token` 不是开发接口凭据。AppID/AppSecret 不应填进网页、公开仓库或聊天消息。

可选的 `scripts/sync-wechat.mjs` 使用稳定令牌和全量分页，只同步已发表内容。API 原始响应、密钥和令牌不会输出到日志。权限、分页、网络或校验失败时保留旧索引。API 的 `update_time` 是更新时间，因此脚本保存为 `updatedAt`，不会假装成发布日期。已有文章的 ID、已知发布日期、`readerPath` 和人工整理字段会保留。新增文章以纯文本和公开原文入口呈现；官方 HTML 图片未镜像时说明“配图请看公众号原文”。新正文或图片有更新时，已有静态阅读页需要由阅读页生成流程重建，避免正文和阅读页版本不一致。

`.github/workflows/sync-wechat.yml` 默认不开启，也没有定时 schedule。仅未来确认接口权限后，才配置：

1. GitHub 仓库 Secrets：`WECHAT_APPID`、`WECHAT_APPSECRET`。
2. 固定出口 IP 的专用 runner，并将该 IP 加入微信接口白名单；`WECHAT_SYNC_RUNNER` 可设为该 runner 的唯一标签。普通 GitHub 托管 runner 没有保证固定的出口 IP，不能靠每次猜测 IP 完成配置。
3. 仓库变量 `WECHAT_OFFICIAL_SYNC_ENABLED=true`，再手动运行 Optional official WeChat sync 验证。

工作流在同一次运行内执行更新、校验、提交和 Pages 部署，因为使用 `GITHUB_TOKEN` 创建的提交通常不会触发另一个 push 工作流。并发使用 `pages` 组，防止与常规部署互相覆盖。当前不承诺即时更新；将来如增加轮询，需明确检查间隔和 GitHub 可能的调度延迟。

## 校验

`tests/wechat-sync.test.mjs` 覆盖完整分页、错误信息不泄露凭据、不完整分页保持旧文件、纯文本规范化、已删除文章、日期语义、元数据保留、拒绝草稿/后台链接/路径逃逸、按公开 URL 合并，以及没有变化时保持文件不变。
