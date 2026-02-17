#!/usr/bin/env bash
# GainLab App 批次收尾脚本 — 子代理 verify.sh 全绿后，主会话跑这个完成收尾
# 用法: bash scripts/post-batch.sh <batch_number> [commit_message]
#
# 做 5 件事：
# 1. 再跑一次 verify.sh 确认（双重保险）
# 2. commit + push gainlab-app
# 3. sync gainlab-research
# 4. 跑 check-all.sh
# 5. 输出 CI 监控命令
set -uo pipefail

APP="/Users/mac/Desktop/卷卷/gainlab-app"
RESEARCH="/Users/mac/Desktop/卷卷/gainlab-research"
MCP="/Users/mac/Desktop/卷卷/gainlab-mcp"

export PATH="$HOME/.npm-global/bin:$PATH"

BATCH="${1:-}"
MSG="${2:-}"

if [ -z "$BATCH" ]; then
  echo "用法: bash scripts/post-batch.sh <batch_number> [commit_message]"
  echo "示例: bash scripts/post-batch.sh 2 'feat: T2 Mosaic + T4 ECharts'"
  exit 1
fi

DATE=$(date +%Y-%m-%d)

section() { echo ""; echo "━━━ $1 ━━━"; }

# ── 1. 验收确认 ──
section "1/5 验收确认"
if bash "$APP/scripts/verify.sh" --batch "$BATCH" 2>&1; then
  echo "  → 验收通过"
else
  echo "  → ❌ 验收失败，中止收尾"
  exit 1
fi

# ── 2. gainlab-app commit + push ──
section "2/5 gainlab-app commit + push"
cd "$APP"
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  if [ -n "$MSG" ]; then
    git commit -m "$MSG"
  else
    git commit -m "feat: batch $BATCH complete ($DATE)"
  fi
  git push origin main 2>&1
  echo "  → pushed"
else
  echo "  → 无新变更"
fi

# ── 3. sync research ──
section "3/5 sync gainlab-research"
if [ -f "$RESEARCH/sync.sh" ]; then
  bash "$RESEARCH/sync.sh" 2>&1
  cd "$RESEARCH"
  if [ -n "$(git status --porcelain)" ]; then
    git add -A && git commit -m "sync: batch $BATCH ($DATE)" && git push origin main 2>&1
    echo "  → synced + pushed"
  else
    echo "  → 无新变更"
  fi
else
  echo "  ⚠ sync.sh not found"
fi

# ── 4. check-all ──
section "4/5 check-all.sh"
if [ -f "$MCP/scripts/check-all.sh" ]; then
  bash "$MCP/scripts/check-all.sh" 2>&1 | tail -15
else
  echo "  ⚠ check-all.sh not found"
fi

# ── 5. CI 监控提示 ──
section "5/5 CI 状态"
cd "$APP"
echo "  等 30 秒后运行:"
echo "  gh run list --limit 2"
echo ""
gh run list --limit 2 2>&1 || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 第 ${BATCH} 批收尾完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
