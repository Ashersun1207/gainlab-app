#!/usr/bin/env bash
# gainlab-app 质量检查脚本
# 用法: bash scripts/check.sh
# 等同于 G4 四步门禁 + 额外健康检查
set -uo pipefail

export PATH="$HOME/.npm-global/bin:$PATH"
cd "$(dirname "$0")/.."

ERRORS=0
WARNS=0

red()    { printf "\033[31m  ✘ %s\033[0m\n" "$1"; ERRORS=$((ERRORS+1)); }
yellow() { printf "\033[33m  ⚠ %s\033[0m\n" "$1"; WARNS=$((WARNS+1)); }
green()  { printf "\033[32m  ✔ %s\033[0m\n" "$1"; }
section(){ echo ""; echo "━━━ $1 ━━━"; }

# ══════════════════════════════════════════
# G4 四步门禁
# ══════════════════════════════════════════
section "1/5 Lint"
if pnpm lint 2>&1 | tail -3; then
  green "lint 通过"
else
  red "lint 失败"
fi

section "2/5 Typecheck"
if bash scripts/typecheck.sh 2>&1 | tail -3; then
  green "typecheck 通过"
else
  red "typecheck 失败"
fi

section "3/5 Test"
TEST_OUT=$(pnpm test 2>&1)
# vitest 格式: "      Tests  185 passed (185)" — 取 Tests 行的数字
TEST_COUNT=$(echo "$TEST_OUT" | grep "Tests" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+')
TEST_FAIL=$(echo "$TEST_OUT" | grep "Tests" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' || echo "0")
if [ "${TEST_FAIL:-0}" -gt 0 ]; then
  red "test 失败 ($TEST_FAIL failed)"
else
  green "test 通过 (${TEST_COUNT:-?} passed)"
fi

section "4/5 Build"
if pnpm build 2>&1 | tail -3; then
  green "build 通过"
else
  red "build 失败"
fi

# ══════════════════════════════════════════
# 额外健康检查
# ══════════════════════════════════════════
section "5/5 健康检查"

# G1: test count 只增不减（基线 185）
BASELINE=185
if [ -n "${TEST_COUNT:-}" ] && [ "$TEST_COUNT" -lt "$BASELINE" ]; then
  red "test count $TEST_COUNT < baseline $BASELINE (G1 违规)"
else
  green "test count ${TEST_COUNT:-?} >= $BASELINE (G1 ✅)"
fi

# G5: 禁止修改的文件是否有 uncommitted changes
for f in src/widgets/KLineWidget/KLineChart .github/workflows/deploy.yml vite.config.ts eslint.config.js; do
  if git diff --name-only 2>/dev/null | grep -q "$f"; then
    red "G5 禁区文件有未提交改动: $f"
  fi
done
green "G5 禁区文件干净"

# git 状态
UNPUSHED=$(git rev-list --count @{upstream}..HEAD 2>/dev/null || echo "0")
if [ "$UNPUSHED" -gt 0 ]; then
  yellow "$UNPUSHED 个 commit 未推送"
fi

# ══════════════════════════════════════════
# 汇总
# ══════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -gt 0 ]; then
  printf "\033[31m❌ gainlab-app check: %d 错误, %d 警告\033[0m\n" "$ERRORS" "$WARNS"
  exit 1
elif [ "$WARNS" -gt 0 ]; then
  printf "\033[33m⚠ gainlab-app check: 0 错误, %d 警告\033[0m\n" "$WARNS"
  exit 0
else
  printf "\033[32m✅ gainlab-app check 全绿\033[0m\n"
  exit 0
fi
