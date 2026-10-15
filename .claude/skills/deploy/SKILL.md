---
name: deploy
description: 把 USWOO 官网的改动发布到线上（uswoo-website.vercel.app）。当用户说"发布""上线""推上去""deploy""部署""更新官网"时使用。
---

# 发布 USWOO 官网

推到 `main` 后由 GitHub Action 自动发布到 <https://uswoo-website.vercel.app>。
流程：**检查 → 提交 → 推送 → 确认真的上线了**。

## 第一步：看清楚要发布什么

```bash
git status --short
git diff --stat
```

用人话把改动讲给用户听（改了哪几页、改了什么内容），确认是他想发的。

## 第二步：安全检查

**这是公开仓库，也是公开网站。**

```bash
git diff | grep -nE '^\+.*(sk-|ghp_|gho_|AKIA|BEGIN [A-Z ]*PRIVATE KEY)'
git status --short | grep -E '\.env'
```

命中就停下来问用户，不要提交。另外注意别把**未公开的客户名、报价、内部联系人**
写进页面 —— 这是对外官网，发出去就是公开的。

## 第三步：提交推送

```bash
git add -A
git commit -m "<一句话说清楚改了什么>"
git push origin main
```

## 第四步：确认上线（必须做）

等约 40 秒：

```bash
gh run list --workflow=deploy.yml --limit 1
```

要看到 `completed success`。然后确认线上真的变了，拿改动过的那个页面比对：

```bash
curl -s -o /tmp/live.html "https://uswoo-website.vercel.app/<改动的页面路径>"
# 跟本地对应的 .dc.html 比，确认内容已更新
```

**两项都过了才能说"发布成功"。**

## 这套发布怎么运作

Vercel 校验最新提交的作者是不是 Vercel 团队成员，不是就把构建拦成 BLOCKED。
团队里只有 Royce 有 Vercel 账号，所以你的提交本身发不出去。

`.github/workflows/deploy.yml` 解决了这件事：你一推到 main，它检测到作者不是
Royce，就自动用 Royce 的身份补一个**空提交**推回去，Vercel 看到合法作者就构建。
**你原提交的署名不变。** 历史里出现的 `chore: 放行部署（...）` 就是它，正常现象。

## 不要做的事

- **不要跑 `vercel` 命令**，本地 CLI 部署同样会被作者校验拦掉。
- **不要 force push**，不要改 `.github/workflows/deploy.yml`。
