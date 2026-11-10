#!/bin/bash
# 测试站的自动发布：由服务器上 root 的计划任务每分钟执行一次。
#
# 仓库里的这份是记录，不是部署源——服务器上的那份由运维手工安装、属主为 root，
# 仓库里改了这个文件不会自动生效（发布流程不能被代码提交改变）。
#
# 做的事：读仓库 Release「staging」里的清单 → 版本没变就退出 → 下载产物并核对校验值 →
# 在备用端口上试启动新版本并检查几个页面 → 通过才替换正在运行的版本；不通过则保留旧版本。
# 每次尝试的结果写到 status.json，发布流程和排查问题时读它。
#
# 用法：pull-release.sh <测试站目录>      环境变量 REPO 可覆盖仓库（默认见下）
set -uo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

BASE=${1:?用法：pull-release.sh <测试站目录>}
REPO=${REPO:-RoyZeyunHuang/uswoo-website}
TAG=staging
NAME=uswoo-new-staging
PORT=3400
TRY_PORT=3401
KEEP=5
URL="https://github.com/$REPO/releases/download/$TAG"

cd "$BASE" || exit 1
mkdir -p releases status logs
exec 9>"$BASE/.pull.lock"
flock -n 9 || exit 0

log() { echo "$(date '+%F %T') $*" >> logs/pull.log; }
json_escape() { python -c 'import json,sys; sys.stdout.write(json.dumps(sys.stdin.read()))'; }
write_status() { # $1 当前版本 $2 尝试的版本 $3 true/false $4 错误说明 $5 日志
  local err log
  err=$(printf '%s' "$4" | json_escape); log=$(printf '%s' "$5" | json_escape)
  printf '{"current": "%s", "lastAttempt": {"sha": "%s", "ok": %s, "at": "%s", "error": %s, "log": %s}}\n' \
    "$1" "$2" "$3" "$(date -u +%FT%TZ)" "$err" "$log" > status/status.json.tmp && mv -f status/status.json.tmp status/status.json
}
run_container() { # $1 容器名 $2 端口 $3 版本目录
  docker run -d --name "$1" --restart unless-stopped --memory 768m --cpus 1.5 \
    --add-host uswoo.com:host-gateway -p "127.0.0.1:$2:3000" \
    --env-file shared/.env -e HOST=0.0.0.0 -e PORT=3000 \
    -v "$3:/app:ro" -w /app node:22-alpine node server/index.mjs >/dev/null
}
healthy() { # $1 端口：首页与中文首页都要返回 200
  local i code
  for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' -m 8 "http://127.0.0.1:$1/" || true)
    if [ "$code" = "200" ]; then
      [ "$(curl -s -o /dev/null -w '%{http_code}' -m 8 "http://127.0.0.1:$1/zh" || true)" = "200" ] && return 0
    fi
    sleep 1
  done
  return 1
}

manifest=$(curl -fsSL --max-time 20 "$URL/manifest.json" 2>/dev/null) || exit 0
sha=$(printf '%s' "$manifest" | sed -n 's/.*"sha": *"\([0-9a-f]\{40\}\)".*/\1/p')
sum=$(printf '%s' "$manifest" | sed -n 's/.*"sha256": *"\([0-9a-f]\{64\}\)".*/\1/p')
# 产物文件名带提交号（同名文件被替换后下载地址会短暂返回旧内容）；只接受这一种格式的文件名
file=$(printf '%s' "$manifest" | sed -n 's/.*"file": *"\(output-[0-9a-f]\{40\}\.tgz\)".*/\1/p')
[ -n "$sha" ] && [ -n "$sum" ] && [ "$file" = "output-$sha.tgz" ] || exit 0

current=$(cat current/.release-sha 2>/dev/null || true)
[ "$sha" = "$current" ] && exit 0
# 这个版本已经试过并且失败了：不反复重试，等下一次构建
[ "$sha" = "$(cat status/.failed-sha 2>/dev/null || true)" ] && exit 0

log "发现新版本 $sha（当前 ${current:-无}）"
dir="releases/$(date +%Y%m%d-%H%M%S)-${sha:0:8}"
tmp=$(mktemp /tmp/uswoo-new-XXXXXX.tgz)
fail() { # $1 说明 $2 日志
  log "失败：$1"
  echo "$sha" > status/.failed-sha
  write_status "$current" "$sha" false "$1" "${2:-}"
  docker rm -f "$NAME-try" >/dev/null 2>&1
  rm -rf "$tmp" "$dir"
  exit 1
}

# 下载失败或校验不一致多半是暂时的（网络、缓存）：前几次只记日志、下一分钟再试，连续多次才算失败
retry() { # $1 说明
  local n; n=$(( $(cat "status/.retry-$sha" 2>/dev/null || echo 0) + 1 ))
  rm -f status/.retry-*; echo "$n" > "status/.retry-$sha"
  if [ "$n" -lt 5 ]; then log "$1（第 $n 次，稍后重试）"; rm -f "$tmp"; exit 0; fi
  fail "$1（连续 $n 次）"
}
curl -fsSL --max-time 180 -o "$tmp" "$URL/$file" || retry "下载构建产物失败"
[ "$(sha256sum "$tmp" | cut -d' ' -f1)" = "$sum" ] || retry "构建产物的校验值不一致"
rm -f status/.retry-*
mkdir -p "$dir" && tar xzf "$tmp" -C "$dir" || fail "解压构建产物失败"
[ -f "$dir/server/index.mjs" ] || fail "构建产物里没有 server/index.mjs"
echo "$sha" > "$dir/.release-sha"
rm -f "$tmp"

# 先在备用端口上试启动，检查通过才动正在运行的版本
docker rm -f "$NAME-try" >/dev/null 2>&1
run_container "$NAME-try" "$TRY_PORT" "$BASE/$dir" || fail "新版本的容器没能启动"
if ! healthy "$TRY_PORT"; then
  fail "新版本启动后首页没有返回 200" "$(docker logs --tail 60 "$NAME-try" 2>&1 | tail -c 6000)"
fi
docker rm -f "$NAME-try" >/dev/null 2>&1

previous=$(readlink current 2>/dev/null || true)
ln -sfn "$dir" current.next && mv -Tf current.next current
docker rm -f "$NAME" >/dev/null 2>&1
run_container "$NAME" "$PORT" "$BASE/$dir"
if ! healthy "$PORT"; then
  # 极少见：试启动通过但正式启动失败。退回上一个版本
  logs=$(docker logs --tail 60 "$NAME" 2>&1 | tail -c 6000)
  docker rm -f "$NAME" >/dev/null 2>&1
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    ln -sfn "$previous" current.next && mv -Tf current.next current
    run_container "$NAME" "$PORT" "$BASE/$previous"
  fi
  fail "切换后新版本没有正常响应，已退回上一个版本" "$logs"
fi

rm -f status/.failed-sha
write_status "$sha" "$sha" true "" ""
log "已切换到 $sha（$dir）"
# 只保留最近几个版本
ls -1d releases/*/ 2>/dev/null | sort | head -n -"$KEEP" | xargs -r rm -rf
exit 0
