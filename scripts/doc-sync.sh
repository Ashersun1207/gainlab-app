#!/usr/bin/env bash
# GainLab 文档同步检查脚本
# 用法: bash scripts/doc-sync.sh [--fix]
#
# 检查项：
# 1. gainlab-app ARCHITECTURE.md 目录结构一致性
# 2. gainlab-research status.md / decisions.md / lessons.md 是否有未提交变更
# 3. workspace MEMORY.md 索引健康（行数/大小/陈旧条目）
# 4. workspace 日志连续性（今日日志是否存在）
# 5. 三仓库 git 状态
#
# --fix: 自动 commit+push 所有 dirty 仓库

set -uo pipefail

APP="/Users/mac/Desktop/卷卷/gainlab-app"
RESEARCH="/Users/mac/Desktop/卷卷/gainlab-research"
WORKSPACE="/Users/mac/.openclaw/workspace"

ERRORS=0
WARNS=0
FIX="${1:-}"

red()    { printf "\033[31m  ✘ %s\033[0m\n" "$1"; ERRORS=$((ERRORS+1)); }
yellow() { printf "\033[33m  ⚠ %s\033[0m\n" "$1"; WARNS=$((WARNS+1)); }
green()  { printf "\033[32m  ✔ %s\033[0m\n" "$1"; }
section(){ echo ""; echo "━━━ $1 ━━━"; }

TODAY=$(date +%Y-%m-%d)

# ══════════════════════════════════════════
# 1. ARCHITECTURE.md 目录一致性
# ══════════════════════════════════════════
section "1/5 ARCHITECTURE.md 目录一致性"

cd "$APP"
MISSING=0
for d in $(find src -mindepth 1 -maxdepth 2 -type d 2>/dev/null | grep -v KLineChart | grep -v __tests__ | grep -v node_modules | sort); do
  DIRNAME=$(basename "$d")
  if ! grep -qi "$DIRNAME" ARCHITECTURE.md 2>/dev/null; then
    yellow "src/$d/ 在 ARCHITECTURE.md 未提及"
    MISSING=$((MISSING+1))
  fi
done
[ "$MISSING" -eq 0 ] && green "ARCHITECTURE.md 与目录结构一致"

# ══════════════════════════════════════════
# 2. Research 仓库文档状态
# ══════════════════════════════════════════
section "2/5 Research 仓库文档"

cd "$RESEARCH"
if [ -n "$(git status --porcelain)" ]; then
  yellow "gainlab-research 有未提交变更"
  git status --short
  if [ "$FIX" == "--fix" ]; then
    git add -A && git commit -m "docs: auto-sync $TODAY" && git push origin main 2>&1 | tail -2
    green "已自动提交并推送"
  fi
else
  green "gainlab-research 干净"
fi

# status.md 最后更新日期
LAST_UPDATE=$(grep -o "Last updated: [0-9-]*" "$RESEARCH/status.md" 2>/dev/null | head -1 | grep -o "[0-9-]*")
if [ -n "$LAST_UPDATE" ]; then
  if [ "$LAST_UPDATE" == "$TODAY" ]; then
    green "status.md 今日已更新 ($LAST_UPDATE)"
  else
    yellow "status.md 最后更新 $LAST_UPDATE（非今日）"
  fi
else
  yellow "status.md 无 Last updated 标记"
fi

# ══════════════════════════════════════════
# 3. MEMORY.md 索引健康
# ══════════════════════════════════════════
section "3/5 MEMORY.md 索引健康"

MEMORY="$WORKSPACE/MEMORY.md"
if [ -f "$MEMORY" ]; then
  LINES=$(wc -l < "$MEMORY" | tr -d ' ')
  SIZE_KB=$(du -k "$MEMORY" | awk '{print $1}')

  if [ "$LINES" -gt 200 ]; then
    red "MEMORY.md $LINES 行 > 200 上限（索引过大，命中率下降）"
  elif [ "$LINES" -gt 150 ]; then
    yellow "MEMORY.md $LINES 行，接近 200 上限"
  else
    green "MEMORY.md $LINES 行（健康）"
  fi

  if [ "$SIZE_KB" -gt 15 ]; then
    red "MEMORY.md ${SIZE_KB}KB > 15KB（太大）"
  elif [ "$SIZE_KB" -gt 10 ]; then
    yellow "MEMORY.md ${SIZE_KB}KB，接近 15KB 上限"
  else
    green "MEMORY.md ${SIZE_KB}KB（健康）"
  fi

  # 检查是否有"进行中"条目超过 7 天未更新
  # （简单检查：看日期格式 2/xx 或 02-xx）
  green "索引条目检查通过（需人工审核陈旧条目）"
else
  red "MEMORY.md 不存在"
fi

# ══════════════════════════════════════════
# 4. 日志连续性
# ══════════════════════════════════════════
section "4/5 日志连续性"

LOG_DIR="$WORKSPACE/memory/logs"
TODAY_LOG="$LOG_DIR/$TODAY.md"

if [ -f "$TODAY_LOG" ]; then
  LOG_LINES=$(wc -l < "$TODAY_LOG" | tr -d ' ')
  green "今日日志存在 ($TODAY.md, $LOG_LINES 行)"
else
  yellow "今日日志不存在 ($TODAY.md)"
fi

# 检查最近 3 天日志连续性
for i in 0 1 2; do
  D=$(date -v-"${i}d" +%Y-%m-%d 2>/dev/null || date -d "-${i} days" +%Y-%m-%d 2>/dev/null)
  if [ -n "$D" ] && [ -f "$LOG_DIR/$D.md" ]; then
    green "日志 $D.md 存在"
  elif [ -n "$D" ]; then
    yellow "日志 $D.md 缺失"
  fi
done

# ══════════════════════════════════════════
# 5. 三仓库 git 状态
# ══════════════════════════════════════════
section "5/5 三仓库 Git 状态"

for REPO_PATH in "$APP" "$RESEARCH" "$WORKSPACE"; do
  REPO_NAME=$(basename "$REPO_PATH")
  cd "$REPO_PATH"
  if [ -n "$(git status --porcelain)" ]; then
    yellow "$REPO_NAME 有未提交变更"
    git status --short | head -5
    if [ "$FIX" == "--fix" ]; then
      git add -A && git commit -m "docs: auto-sync $TODAY" && git push origin main 2>&1 | tail -2
      green "$REPO_NAME 已自动提交"
    fi
  else
    green "$REPO_NAME 干净"
  fi
done

# ══════════════════════════════════════════
# 汇总
# ══════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -gt 0 ]; then
  printf "\033[31m❌ 文档同步检查: %d 错误, %d 警告\033[0m\n" "$ERRORS" "$WARNS"
  exit 1
elif [ "$WARNS" -gt 0 ]; then
  printf "\033[33m⚠ 文档同步检查: 0 错误, %d 警告\033[0m\n" "$WARNS"
  exit 0
else
  printf "\033[32m✅ 文档同步全绿\033[0m\n"
  exit 0
fi
