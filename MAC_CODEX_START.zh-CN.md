# 在 Mac 上继续使用 Codex

## 第一次克隆

打开 Terminal：

```bash
xcode-select --install
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/Oliver12136/Portfolio.git
cd Portfolio
git status
```

如果尚未安装 Node.js，请先从 https://nodejs.org 安装当前 LTS 版本。

## 本地预览

```bash
cd ~/Projects/Portfolio
npx --yes http-server web -p 4173 -c-1
```

浏览器打开 `http://127.0.0.1:4173`。结束预览时在 Terminal 按 `Control+C`。

## 每次开始工作

```bash
cd ~/Projects/Portfolio
git status
git switch main
git pull --ff-only
git switch -c codex/short-task-name
```

然后在 ChatGPT 桌面版中选择 Codex，打开 `~/Projects/Portfolio`，粘贴下面的启动 prompt。

## 可直接粘贴给 Mac Codex 的启动 prompt

```text
你正在我的 Mac 上继续维护 Portfolio 网站。

仓库路径：~/Projects/Portfolio
网站源码：web/

重要规则：
1. 当前 Git 仓库中的文件是唯一最新版。线上网站可能较旧，绝对不要用线上内容覆盖本地文件。
2. 开始前先运行 git status、git branch --show-current 和 git log -5 --oneline，确认工作区和当前分支。
3. 阅读并严格遵守仓库根目录的 AGENTS.md。
4. 保持主页旧版视觉一模一样，不要增加副标题、小标题、说明文字、标签、弹窗或多余按钮。
5. 保留主页项目单击一次直接打开内部详情页。
6. 只做我明确要求的最小修改，不要重构整个网站，不要修改缓存、快照或部署副本目录。
7. 修改后运行相关语法检查，并用真实浏览器在 http://127.0.0.1:4173 进行本地预览，检查桌面和手机尺寸。
8. 未经我在当前对话明确同意，禁止部署，禁止运行 wrangler deploy 或其他生产部署命令。
9. 完成后告诉我：改了哪些文件、验证了什么、哪些内容尚未验证，并先让我查看本地预览。

首先请只检查仓库状态、确认最新版已同步，并启动本地预览；不要修改任何文件，等待我给出下一项具体任务。
```

## 离开 Mac 前

```bash
git status
git diff
git add -p
git commit -m "Describe the change"
git push -u origin HEAD
```

只有提交并推送后，另一台电脑才能安全接着工作。
