# Bot 中文库

Grok Bot Marketplace 的中文详情阅读站。重点是逐项翻译每个 Bot 的公开详情：用途、工作规则、技能、例行任务和应用集成。保留原名、作者、来源和逐条英文对照。

**在线访问：<https://wasabihu.github.io/grokbot-marketplace/>**

GitHub 仓库：<https://github.com/wasabihu/grokbot-marketplace>

## 本地运行

需要已安装 Node.js 18 或更高版本。网页没有第三方运行依赖，无需执行 `npm install`。

```sh
npm start
```

打开 <http://127.0.0.1:4173>。指定其他端口：

```sh
PORT=4180 npm start
```

服务只监听本机 `127.0.0.1`。网站为静态阅读工具，不会执行 Bot 指令，也不会连接模板中提及的第三方应用。

## 使用

- 左侧按分类、中文名称、英文名、作者或详情全文查找。
- 点击模板，阅读工作规则、技能、例行任务与集成。
- “中英对照”逐项展示原文，浏览器地址会保留当前模板、章节和对照状态。
- “复制中文模板”复制所有章节，不附加文件说明尾注；“下载 Markdown”下载全部中文详情并保留文件说明。
- `⌘K` / `Ctrl+K` 或 `/` 聚焦搜索框。手机端通过左上角按钮展开目录。
- 本地 [Markdown 模板目录](templates/README.md) 可独立使用。

## 内容范围

本次快照包含 90 个公开模板，共 622 条记忆/工作规则、443 项技能、148 项例行任务、321 项应用集成。日期见 `data/bots.en.json` 的 `fetchedAt`。

译文以原站实际公开的字段为准。部分模板的记忆文本在原站就有截断，已在相应详情中标注；技能字段有时只公开用途说明，不代表获取到了未公开的完整技能文件。未提供的内容保持空，不补写。技术标识符、路径、工具名、状态枚举与代码保留原样。

这是非官方中文译本，不代表 xAI。作者及来源链接保留在每份模板中。复制和下载得到的是中文文档；运行或导入 Bot 请前往原站，并按其要求配置环境和应用连接。

## 项目结构

```text
index.html              构建生成的站点入口，支持 GitHub Pages 子目录
.nojekyll               直接发布静态文件
web/                    无依赖的静态前端
  index.html            页面结构
  styles.css            暗色阅读界面与响应式布局
  app.js                路由、交互、目录、阅读视图
  model.js              搜索、文本转义、Markdown 导出
server.mjs              Node 标准库静态服务器
scripts/
  collect.py            采集并解析公开页面
  validate.py           核验译文覆盖率和条目结构
  build.py              生成中英对照目录和 Markdown
  refresh_sources.py    将新的原文快照下载到独立目录
  start.command         macOS 双击启动
data/
  source/               每个模板原文与本地页面缓存
  bots.en.json          完整英文源数据快照
  zh/                   每个模板的中文译文
  catalog.json          网页使用的中英配对数据
templates/             每个 Bot 的中文 Markdown
tests/                 核心行为与源数据解析测试
docs/                  设计计划和验收记录
```

## 构建与验证

需要 Python 3.10 或更高版本，仅用标准库。

```sh
npm run build
npm test
```

构建会拒绝缺少译文、条目数量不一致、ID 错位、未翻译内容或未解析引用。开发期间可执行 `python3 scripts/build.py --preview` 预览未完成批次；预览中的缺失内容明确标为“翻译处理中”。交付构建必须通过严格验证。

## 更新原文

刷新原文会导致现有翻译可能过期，因此使用独立目录生成新快照，核对差异后再更新译文：

```sh
python3 scripts/refresh_sources.py
```

如网络需要代理，可在这次命令中使用自己已配置的代理环境变量，脚本不会修改系统网络设置。所有文本都作为内容展示，不执行采集页面里的脚本或模板指令。

## GitHub Pages 发布

Pages 使用 `main` 分支的仓库根目录作为发布来源。页面入口、样式、脚本和数据都使用相对路径，兼容项目子目录及本地开发地址。

修改翻译或页面后，在本地构建、校验，再提交更新：

```sh
npm run build
npm test
git add web data/zh data/catalog.json templates index.html
git commit -m "Update Chinese bot templates"
git push origin main
```

推送 `main` 后 GitHub Pages 会重新部署。可在仓库的 Actions 页面查看 GitHub 自动生成的 Pages 部署任务。无需额外安装依赖、配置密钥或自定义域名。

## 视觉设计

按用户指定的 apple-design 技能实现：石墨黑底色、青色强调、系统字体、半透明顶栏、即时按压反馈、移动端抽屉、键盘可达性、减少动态/透明效果与增强对比度支持。概念图使用 Codex 内置 Image Gen 制作，不调用图像 API；网站本身不依赖图片素材。
