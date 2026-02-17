#!/usr/bin/env bash
# GainLab App 项目认知恢复 — 新会话/子代理启动时执行
# 输出项目状态摘要 + 必读文件清单
# 用法: bash scripts/project-boot.sh
set -uo pipefail

APP="/Users/mac/Desktop/卷卷/gainlab-app"
RESEARCH="/Users/mac/Desktop/卷卷/gainlab-research"
MCP="/Users/mac/Desktop/卷卷/gainlab-mcp"
DASHBOARD="/Users/mac/Desktop/卷卷/gainlab-dashboard"

echo "🦞 GainLab App — Project Boot"
echo "=============================="
echo ""

# ── 项目状态 ──
echo "📊 项目状态"
if [ -f "$APP/package.json" ]; then
  echo "  ✅ 脚手架已初始化"
  DEPS=$(grep -c '"' "$APP/package.json" 2>/dev/null || echo "?")
  echo "  package.json: $DEPS 行"
else
  echo "  ⬜ 脚手架未初始化（T1 待执行）"
fi

# 检查核心目录
for d in src src/layout src/widgets src/chat src/services src/types; do
  if [ -d "$APP/$d" ]; then
    COUNT=$(find "$APP/$d" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✅ $d/ ($COUNT files)"
  else
    echo "  ⬜ $d/ 未创建"
  fi
done

# 检查 CI
if [ -f "$APP/.github/workflows/deploy.yml" ]; then
  echo "  ✅ GH Actions deploy.yml"
else
  echo "  ⬜ GH Actions deploy.yml 未创建（T8 任务）"
fi
echo ""

# ── 任务进度 ──
echo "📋 任务进度（TASK）"
TASK_FILE="$RESEARCH/docs/plans/2026-02-17-gainlab-app-task.md"
if [ -f "$TASK_FILE" ]; then
  grep -E '^\| \*\*T[0-9]' "$TASK_FILE" | while IFS= read -r line; do
    echo "  $line"
  done
else
  echo "  ⚠️ TASK 文件不存在"
fi
echo ""

# ── Git 状态 ──
echo "📝 最近 5 次 commit"
cd "$APP" && git log --oneline -5 2>/dev/null | sed 's/^/  /'
echo ""

echo "📦 Git 状态"
for repo in "$APP" "$RESEARCH" "$MCP"; do
  name=$(basename "$repo")
  cd "$repo" 2>/dev/null || continue
  dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  unpushed=$(git log --oneline origin/main..HEAD 2>/dev/null | wc -l | tr -d ' ')
  echo "  $name: ${dirty} dirty, ${unpushed} unpushed"
done
echo ""

# ── 复用源检查 ──
echo "🔗 复用源（gainlab-dashboard）"
if [ -d "$DASHBOARD" ]; then
  echo "  ✅ dashboard 目录存在"
  for src_dir in "src/components/MosaicDashboard" "src/components/Sidebar" "src/plugins/KLineChart" "src/plugins/klinechart" "src/i18n"; do
    if [ -d "$DASHBOARD/$src_dir" ]; then
      echo "  ✅ $src_dir/"
    else
      echo "  ⚠️ $src_dir/ 不存在"
    fi
  done
else
  echo "  ❌ dashboard 目录不存在: $DASHBOARD"
fi
echo ""

# ── CF Worker 状态 ──
echo "🌐 CF Worker"
WORKER_URL="https://gainlab-api.asher-sun.workers.dev/api/chat"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}]}' \
  --max-time 10 2>/dev/null || echo "timeout")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ Worker 可达 ($WORKER_URL)"
elif [ "$HTTP_CODE" = "timeout" ]; then
  echo "  ⚠️ Worker 超时（可能是网络问题）"
else
  echo "  ⚠️ Worker 返回 HTTP $HTTP_CODE"
fi
echo ""

# ── 必读文件清单 ──
echo "📖 必读文件（按顺序）"
echo "  1. RULES.md        → $APP/RULES.md"
echo "  2. ARCHITECTURE.md → $APP/ARCHITECTURE.md"
echo "  3. PRD             → $RESEARCH/docs/plans/2026-02-17-gainlab-app-prd.md"
echo "  4. TASK            → $RESEARCH/docs/plans/2026-02-17-gainlab-app-task.md"
echo "  5. lessons.md      → $RESEARCH/lessons.md"
echo "  6. decisions.md    → $RESEARCH/decisions.md"
echo ""

# ── 关键约束提醒 ──
echo "⚠️  关键约束"
echo "  - KLineChart 用 timestamp（毫秒），不是 time（秒）"
echo "  - KLineChart 容器必须有明确 width/height（不能 auto）"
echo "  - Vite base: '/gainlab-app/'（gh-pages 子路径）"
echo "  - 不 import gainlab-mcp 代码，通过 CF Worker 交互"
echo "  - API key 不出现在前端代码里（只有 VITE_WORKER_URL）"
echo "  - K线类用 KLineChart，非K线类用 ECharts，不混用"
echo ""
echo "=============================="
echo "Boot complete. $(date '+%Y-%m-%d %H:%M:%S')"
