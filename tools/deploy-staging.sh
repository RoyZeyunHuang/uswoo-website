#!/usr/bin/env bash
# 把当前代码构建并发布到测试站 new.uswoo.cn。
#
#   DEPLOY_JUMP=<跳板 SSH 目标> DEPLOY_HOST=<测试站所在机器的内网地址> DEPLOY_BASE=<测试站目录> tools/deploy-staging.sh
#
# 本仓库是公开仓库，所以机器地址与部署目录不写在脚本里，运行时用环境变量传入。
# 流程：本机构建 → 打包上传 → 解压为新版本目录 → 切换 current 指向 → 重启容器 → 冒烟检查。
# 回滚：把 current 指回上一个版本目录后重启容器（脚本末尾会列出保留的版本）。
set -euo pipefail

: "${DEPLOY_JUMP:?需要 DEPLOY_JUMP（跳板 SSH 目标）}"
: "${DEPLOY_HOST:?需要 DEPLOY_HOST（测试站所在机器的内网地址）}"
: "${DEPLOY_BASE:?需要 DEPLOY_BASE（测试站在目标机器上的目录）}"
BASE=$DEPLOY_BASE
NAME=uswoo-new-staging
PORT=3400
STAMP=$(date +%Y%m%d-%H%M%S)
SSH_OPTS=(-o ControlMaster=auto -o ControlPath=/tmp/cc-uswoo-ssh -o ControlPersist=45m -o BatchMode=yes -o ConnectTimeout=15)
remote() { ssh "${SSH_OPTS[@]}" "$DEPLOY_JUMP" "ssh -o BatchMode=yes -o ConnectTimeout=10 $DEPLOY_HOST bash -s" ; }

cd "$(dirname "$0")/.."
echo "== 构建（$(git rev-parse --short HEAD)$(git diff --quiet || echo ' +未提交改动')）"
pnpm -s build >/dev/null
tar czf /tmp/uswoo-new-$STAMP.tgz -C .output .
echo "== 上传 $(du -h /tmp/uswoo-new-$STAMP.tgz | cut -f1)"
ssh "${SSH_OPTS[@]}" "$DEPLOY_JUMP" "ssh -o BatchMode=yes $DEPLOY_HOST 'mkdir -p $BASE/releases/$STAMP && tar xzf - -C $BASE/releases/$STAMP'" < /tmp/uswoo-new-$STAMP.tgz
rm -f /tmp/uswoo-new-$STAMP.tgz

remote <<REMOTE
set -euo pipefail
cd $BASE
[ -f shared/.env ] || { echo "缺少 $BASE/shared/.env"; exit 1; }
ln -sfn releases/$STAMP current.next && mv -Tf current.next current
docker rm -f $NAME >/dev/null 2>&1 || true
# 容器里的 uswoo.com 指向宿主机：服务端渲染请求接口时走本机 Nginx 的内网反代，不绕公网
docker run -d --name $NAME --restart unless-stopped \\
  --memory 768m --cpus 1.5 \\
  --add-host uswoo.com:host-gateway \\
  -p 127.0.0.1:$PORT:3000 \\
  --env-file shared/.env -e HOST=0.0.0.0 -e PORT=3000 \\
  -v $BASE/releases/$STAMP:/app:ro -w /app \\
  node:22-alpine node server/index.mjs >/dev/null
for i in 1 2 3 4 5 6 7 8 9 10; do
  code=\$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1:$PORT/ || true)
  [ "\$code" = "200" ] && break
  sleep 1
done
echo "容器首页：\$code"
[ "\$code" = "200" ] || { docker logs --tail 30 $NAME; exit 1; }
# 只保留最近三个版本
ls -1d releases/*/ | sort | head -n -3 | xargs -r rm -rf
echo "保留的版本：\$(ls -1 releases | tr '\n' ' ')"
REMOTE

echo "== 冒烟"
curl -s -m 20 -o /dev/null -w "https://new.uswoo.cn/ -> %{http_code}\n" https://new.uswoo.cn/
curl -s -m 20 -o /dev/null -w "https://new.uswoo.cn/zh -> %{http_code}\n" https://new.uswoo.cn/zh
curl -s -m 20 -D - -o /dev/null https://new.uswoo.cn/ | grep -i "x-robots-tag" || echo "!! 缺少禁止收录的响应头"
