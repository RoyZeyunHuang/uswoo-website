---
name: deploy
description: 把 USWOO 新官网的改动发布到测试站（new.uswoo.cn / new.uswoo.com）。当用户说"发布""上线""推上去""deploy""部署""更新官网""发到测试站"时使用。
---

# 发布 USWOO 新官网到测试站

改动合并到 `main` 后会**自动**发布到测试站 <https://new.uswoo.cn>（<https://new.uswoo.com> 是同一个站）。
你不需要、也没有任何服务器登录或密钥——发布只通过 GitHub 完成。

流程：**本地检查 → 提交到分支 → 提 PR → 合并到 main → 确认测试站真的更新了**。

> 正式站 uswoo.com 不在这里发布，由负责人另外手动发布。不要尝试发布正式站。

## 第一步：看清楚要发布什么

```bash
git status --short
```

```bash
git diff --stat
```

用人话把改动讲给用户听（改了哪几页、改了什么），确认是他想发的。

## 第二步：本地检查

```bash
pnpm typecheck
```

```bash
pnpm build
```

两个都要通过。构建失败的代码合并后也发不出去，先在本地解决。

## 第三步：安全检查

**这是公开仓库，也是公开网站。**

```bash
git diff | grep -nE '^\+.*(sk-|ghp_|gho_|AKIA|BEGIN [A-Z ]*PRIVATE KEY)'
```

```bash
git status --short | grep -E '\.env'
```

命中就停下来问用户，不要提交。也不要把服务器地址、内网地址、未公开的客户信息写进代码或文档。

## 第四步：提交、提 PR、合并

不要直接推 `main`。在自己的分支上提交，再提 PR：

```bash
git checkout -b <分支名>
```

```bash
git add -A
```

```bash
git commit -m "<一句话说清楚改了什么>"
```

```bash
git push -u origin <分支名>
```

```bash
gh pr create --fill
```

PR 上会自动跑「Check」（类型检查 + 构建）。通过后合并（需要评审时等评审）：

```bash
gh pr merge --squash
```

## 第五步：确认测试站更新了（必须做）

合并后「Deploy to staging」会自动开始，通常 3～5 分钟：

```bash
gh run list --workflow=deploy-staging.yml --limit 1
```

```bash
gh run watch
```

要看到 `completed success`。这个流程的最后一步会一直等到测试站确实切换到了这次的提交才算成功，所以成功就代表已经上线。
想自己再核对一次，看测试站当前运行的是哪个提交：

```bash
curl -s https://new.uswoo.com/_deploy/status.json
```

`current` 应该等于 `git rev-parse origin/main` 的结果。然后打开改动过的页面看一眼实际效果。

**流程成功、页面也看过了，才能说"发布成功"。**

## 发布失败了怎么办

- **「Check」或构建失败**：看日志修代码，再推一次。

  ```bash
  gh run view --log-failed
  ```

- **最后一步「等测试站切换到新版本」失败，并打印了应用日志**：新版本在服务器上启动不了或首页打不开。测试站**仍在运行上一个版本**，没有受影响。按打印出来的日志修复后重新合并。
- **等了 10 分钟超时**：服务器的拉取任务可能没有运行，这不是代码问题，联系负责服务器的同事。

## 回退到之前的版本

在 GitHub 的 Actions 页面手动运行「Deploy to staging」，`ref` 填要回到的提交号；或者：

```bash
gh workflow run deploy-staging.yml -f ref=<提交号>
```

回退只是把那个版本重新发布一遍，`main` 的代码不会变。要彻底撤销某次改动，另外提一个 revert 的 PR。

## 改了页面要用到新的内容字段时

这个站的所有文案、图片、数字都来自 CMS（Vectra →「美窝房产CMS」→「新官网页面」），代码里不放任何默认内容。
所以设计改动如果需要**新的文字或图片**，顺序很重要：

1. **先**在 CMS 对应页面的内容里加上新字段并填好中英文（图片先传到媒体库）。
2. **再**发布读取这个字段的代码。

反过来做的话，新版本上线时那个位置会是空的。删除字段则相反：先发布不再使用它的代码，再从 CMS 里删。
代码里用 `usePageContent("<页面键>")` 返回的 `c()` / `ch()` / `img()` / `raw()` / `list()` 读取，写法照着同一个文件里已有的用法。
**不要**在代码里写默认文案来"兜底"。

注意：CMS 的内容只有一份，测试站和正式站共用。在 CMS 里改已有内容，正式站上线后会直接影响线上。

## 这套发布怎么运作

1. 推到 `main` 触发 GitHub Actions：类型检查、构建，把构建产物上传到仓库的 Release「staging」。
2. 测试站的服务器每分钟检查一次这个 Release，发现新版本就下载、核对校验值，先在备用端口上试启动，首页和中文首页都正常才替换正在运行的版本。
3. GitHub Actions 读取服务器公布的状态，确认切换成功后才结束。

整个过程不经过任何人的电脑，也没有密钥存放在 GitHub 里。

## 你不能做、也不需要做的事

- 不能登录服务器，不能改服务器配置、Nginx、证书。
- 不能改接口：这个站只读取 `https://uswoo.com/api/uswoo/public/*`。需要接口有变化时，把需求提给后端同事，不要在前端绕过。
- `shared/types/api.ts` 是接口约定，跟着后端的实际返回走，不要单方面改。
- 不要手动改 Release「staging」里的文件，也不要改 `.github/workflows/` 下的流程，除非负责人同意。
