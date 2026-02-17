#!/usr/bin/env bash
# GainLab App 验收脚本 — 子代理完成后必须跑到全绿
# 用法: bash scripts/verify.sh [--batch N]
# 不带参数 = 全量检查，--batch N = 只检查第 N 批相关项
#
# 退出码: 0=全绿, 1=有失败
set -uo pipefail

APP="/Users/mac/Desktop/卷卷/gainlab-app"
DASHBOARD="/Users/mac/Desktop/卷卷/gainlab-dashboard"
RESEARCH="/Users/mac/Desktop/卷卷/gainlab-research"
MCP="/Users/mac/Desktop/卷卷/gainlab-mcp"

cd "$APP" || { echo "❌ gainlab-app 目录不存在"; exit 1; }

ERRORS=0
WARNS=0
BATCH="all"

if [[ "${1:-}" == "--batch" && -n "${2:-}" ]]; then
  BATCH="$2"
fi

red()    { printf "\033[31m  ✘ %s\033[0m\n" "$1"; ERRORS=$((ERRORS+1)); }
yellow() { printf "\033[33m  ⚠ %s\033[0m\n" "$1"; WARNS=$((WARNS+1)); }
green()  { printf "\033[32m  ✔ %s\033[0m\n" "$1"; }
section(){ echo ""; echo "━━━ $1 ━━━"; }

# ══════════════════════════════════════════
# V1: 构建验证（所有批次）
# ══════════════════════════════════════════
section "V1: 构建"

export PATH="$HOME/.npm-global/bin:$PATH"

# pnpm build
if pnpm build > /tmp/gainlab-build.log 2>&1; then
  green "pnpm build 成功"
else
  red "pnpm build 失败"
  tail -10 /tmp/gainlab-build.log
fi

# TypeScript strict
if grep -q '"strict": true' tsconfig.app.json 2>/dev/null; then
  green "TypeScript strict: true"
else
  red "TypeScript strict 未开启"
fi

# dist 大小合理 (<5MB)
if [ -d dist ]; then
  DIST_KB=$(du -sk dist/ | awk '{print $1}')
  if [ "$DIST_KB" -lt 5120 ]; then
    green "dist 大小 ${DIST_KB}KB (<5MB)"
  else
    yellow "dist 大小 ${DIST_KB}KB (>5MB，检查是否打包了不该有的东西)"
  fi
fi

# ══════════════════════════════════════════
# V2: 安全验证（所有批次）
# ══════════════════════════════════════════
section "V2: 安全"

# 密钥泄露扫描
LEAK=$(grep -rl 'sk-[a-zA-Z0-9]\{20,\}\|ghp_[a-zA-Z0-9]\{20,\}\|ntn_[a-zA-Z0-9]\{20,\}\|MINIMAX_API_KEY\|apikey.*=.*[a-zA-Z0-9]\{20,\}' src/ .env* 2>/dev/null || true)
if [ -z "$LEAK" ]; then
  green "无密钥泄露"
else
  red "发现可能的密钥泄露: $LEAK"
fi

# .env 不被 git 追踪
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  red ".env 被 git 追踪（应 git rm --cached .env）"
else
  green ".env 未被 git 追踪"
fi

# .gitignore 必须排除关键路径
for pattern in "node_modules" "dist" ".env"; do
  if grep -q "^${pattern}" .gitignore 2>/dev/null; then
    green ".gitignore 排除 $pattern"
  else
    red ".gitignore 未排除 $pattern"
  fi
done

# ══════════════════════════════════════════
# V3: 结构验证（所有批次）
# ══════════════════════════════════════════
section "V3: 项目结构"

# 必须存在的文件
MUST_FILES="vite.config.ts package.json tsconfig.json index.html RULES.md ARCHITECTURE.md"
for f in $MUST_FILES; do
  if [ -f "$f" ]; then
    green "$f 存在"
  else
    red "$f 不存在"
  fi
done

# pnpm-workspace.yaml 不能存在（L16 教训）
if [ -f "pnpm-workspace.yaml" ]; then
  red "pnpm-workspace.yaml 存在（L16: 会导致 CI 报 monorepo 错误，删掉它）"
else
  green "无 pnpm-workspace.yaml（L16 ✓）"
fi

# vite base 配置
if grep -q "base.*'/gainlab-app/'" vite.config.ts 2>/dev/null; then
  green "vite base: '/gainlab-app/'"
else
  red "vite base 配置不是 '/gainlab-app/'（gh-pages 子路径必须）"
fi

# ══════════════════════════════════════════
# V4: 批次专项验证
# ══════════════════════════════════════════

# --- 第 1 批：T1 脚手架 + T8 部署 ---
if [[ "$BATCH" == "all" || "$BATCH" == "1" ]]; then
  section "V4-B1: 脚手架 + 部署"

  # 目录结构
  for d in src/layout src/widgets src/chat src/services src/types src/hooks src/utils; do
    if [ -d "$d" ]; then
      green "目录 $d 存在"
    else
      red "目录 $d 不存在"
    fi
  done

  # deploy.yml
  if [ -f ".github/workflows/deploy.yml" ]; then
    green "deploy.yml 存在"
    # 检查 pnpm/action-setup 版本
    if grep -q "pnpm/action-setup@v4" .github/workflows/deploy.yml; then
      green "pnpm/action-setup@v4"
    else
      yellow "pnpm/action-setup 不是 v4"
    fi
  else
    red "deploy.yml 不存在"
  fi
fi

# --- 第 2 批：T2 Mosaic + T4 ECharts ---
if [[ "$BATCH" == "all" || "$BATCH" == "2" ]]; then
  section "V4-B2: Mosaic + ECharts"

  # Mosaic 布局文件
  if ls src/layout/*.tsx >/dev/null 2>&1; then
    green "src/layout/ 有 .tsx 文件"
  else
    if [[ "$BATCH" == "2" ]]; then
      red "src/layout/ 无 .tsx 文件（T2 应创建 Mosaic 布局）"
    fi
  fi

  # ECharts Widget
  if ls src/widgets/EChartsWidget/*.tsx >/dev/null 2>&1; then
    green "EChartsWidget 有 .tsx 文件"
  else
    if [[ "$BATCH" == "2" ]]; then
      red "EChartsWidget/ 无 .tsx 文件（T4 应创建热力图 Widget）"
    fi
  fi

  # react-mosaic 和 echarts 在 package.json
  for pkg in "react-mosaic-component" "echarts" "echarts-for-react"; do
    if grep -q "\"$pkg\"" package.json; then
      green "依赖: $pkg"
    else
      red "缺少依赖: $pkg"
    fi
  done
fi

# --- 第 3 批：T3 KLineChart ---
if [[ "$BATCH" == "all" || "$BATCH" == "3" ]]; then
  section "V4-B3: KLineChart"

  # KLineWidget 文件
  if ls src/widgets/KLineWidget/*.tsx >/dev/null 2>&1; then
    green "KLineWidget 有 .tsx 文件"
  else
    if [[ "$BATCH" == "3" ]]; then
      red "KLineWidget/ 无 .tsx 文件（T3 应创建 K 线 Widget）"
    fi
  fi

  # KLineChart 数据格式：必须用 timestamp（毫秒），不用 time（秒）
  if grep -rn "\.time[^s]" src/widgets/KLineWidget/ src/types/ 2>/dev/null | grep -v "timestamp" | grep -v "\.tsx:" | grep -v "timeout\|setTimeout\|datetime" | head -5; then
    yellow "可能使用了 .time 而非 .timestamp（KLineChart 必须用 timestamp 毫秒）"
  fi
fi

# --- 第 4 批：T5+T6+T7 MCP+Chat ---
if [[ "$BATCH" == "all" || "$BATCH" == "4" ]]; then
  section "V4-B4: MCP + 数据适配 + Chat"

  # MCP 服务文件
  if ls src/services/*.ts >/dev/null 2>&1; then
    green "src/services/ 有 .ts 文件"
  else
    if [[ "$BATCH" == "4" ]]; then
      red "src/services/ 无 .ts 文件（T5 应创建 MCP client）"
    fi
  fi

  # Chat 组件
  if ls src/chat/*.tsx >/dev/null 2>&1; then
    green "src/chat/ 有 .tsx 文件"
  else
    if [[ "$BATCH" == "4" ]]; then
      red "src/chat/ 无 .tsx 文件（T7 应创建 Chat 面板）"
    fi
  fi

  # 类型定义
  if ls src/types/*.ts >/dev/null 2>&1; then
    green "src/types/ 有 .ts 文件"
  else
    if [[ "$BATCH" == "4" ]]; then
      red "src/types/ 无 .ts 文件（T5/T6 应创建类型定义）"
    fi
  fi

  # Worker URL 引用
  if grep -r "VITE_WORKER_URL" src/ >/dev/null 2>&1; then
    green "代码中引用了 VITE_WORKER_URL"
  else
    if [[ "$BATCH" == "4" ]]; then
      yellow "代码中未引用 VITE_WORKER_URL（T5 MCP client 应使用）"
    fi
  fi
fi

# ══════════════════════════════════════════
# V5: 文档一致性（全量检查时）
# ══════════════════════════════════════════
if [[ "$BATCH" == "all" ]]; then
  section "V5: 文档一致性"

  # ARCHITECTURE.md 目录结构 vs 实际
  if [ -f ARCHITECTURE.md ]; then
    MISSING_IN_ARCH=0
    for d in $(find src -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort); do
      DIRNAME=$(basename "$d")
      # 匹配 ARCHITECTURE.md 中对该目录的任何引用（树状结构/路径/表格）
      if grep -qi "$DIRNAME" ARCHITECTURE.md 2>/dev/null; then
        :  # found
      else
        yellow "目录 src/$DIRNAME/ 存在但 ARCHITECTURE.md 未提及"
        MISSING_IN_ARCH=$((MISSING_IN_ARCH+1))
      fi
    done
    [ "$MISSING_IN_ARCH" -eq 0 ] && green "ARCHITECTURE.md 目录结构与实际一致"
  fi

  # check-all.sh 覆盖 gainlab-app
  if grep -q "gainlab-app" "$MCP/scripts/check-all.sh" 2>/dev/null; then
    green "check-all.sh 覆盖 gainlab-app"
  else
    yellow "check-all.sh 未覆盖 gainlab-app"
  fi
fi

# ══════════════════════════════════════════
# V6: 回归验证（全量检查时）
# ══════════════════════════════════════════
if [[ "$BATCH" == "all" ]]; then
  section "V6: 回归（其他项目不受影响）"

  # gainlab-mcp build
  if [ -f "$MCP/package.json" ]; then
    cd "$MCP"
    if pnpm build > /tmp/mcp-build.log 2>&1; then
      green "gainlab-mcp build 成功"
    else
      red "gainlab-mcp build 失败（回归！）"
    fi
    cd "$APP"
  fi

  # Worker 可达
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X POST \
    "https://gainlab-api.asher-sun.workers.dev/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"ping"}]}' 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "400" ]]; then
    green "CF Worker 可达 (HTTP $HTTP_CODE)"
  else
    yellow "CF Worker 不可达 (HTTP $HTTP_CODE) — 可能是网络问题"
  fi
fi

# ══════════════════════════════════════════
# 汇总
# ══════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -gt 0 ]; then
  printf "\033[31m❌ 验收失败: %d 错误, %d 警告\033[0m\n" "$ERRORS" "$WARNS"
  echo ""
  echo "请修复所有 ✘ 项后重新运行: bash scripts/verify.sh --batch $BATCH"
  exit 1
else
  if [ "$WARNS" -gt 0 ]; then
    printf "\033[33m⚠ 验收通过（有 %d 个警告）\033[0m\n" "$WARNS"
  else
    printf "\033[32m✅ 验收全绿: 0 错误, 0 警告\033[0m\n"
  fi
  exit 0
fi
