# 首页真实赛事合影首屏实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用已获授权的全国赛合影重做首页首屏，取消绿色渐变和抽象背景，并保证桌面端、手机端清晰可用。

**Architecture:** 保持现有 Python 静态构建架构不变。把原始照片复制到站点图片目录，通过首页专用 CSS 作为整幅首屏背景，并使用响应式定位分别控制桌面端和手机端裁切。

**Tech Stack:** HTML5、CSS3、Python 标准库构建脚本、Playwright 浏览器验收。

---

### Task 1: 入库真实赛事照片

**Files:**
- Create: `src/assets/images/hero-national-final.jpg`
- Modify: `docs/superpowers/specs/2026-08-13-home-hero-redesign.md`

- [ ] 复制已授权原图到站点图片目录，保留原图比例与赛事横幅。
- [ ] 更新设计说明，记录正式素材来源和授权状态。
- [ ] 检查图片可正常读取，并确认尺寸适合横向首屏。

### Task 2: 重做首页首屏结构与样式

**Files:**
- Modify: `src/pages/index.html`
- Modify: `src/assets/css/style.css`

- [ ] 将首屏文案改为“让孩子把想法真正做成作品”。
- [ ] 增加贵阳本地服务说明、课程说明、预约试听和课程体系入口。
- [ ] 增加首屏底部课程方向索引。
- [ ] 使用照片作为整幅首屏背景，文字放在场馆入口的深色区域。
- [ ] 为手机端设置单独的裁切、字号、按钮和课程索引换行规则。
- [ ] 让下一段标题在常见桌面视口底部可见。

### Task 3: 更新分享图并重新构建

**Files:**
- Modify: `scripts/build.py`
- Generated: `dist/`

- [ ] 将 Open Graph 分享图改为真实赛事合影。
- [ ] 运行 `python scripts/build.py`，预期生成 20 个公开页面。
- [ ] 运行 `python scripts/check_site.py`，预期站点检查通过。
- [ ] 运行 `python scripts/check_links.py`，预期所有内部链接有效。

### Task 4: 浏览器双端验收

**Files:**
- Generated: `audit/home-hero-desktop.png`
- Generated: `audit/home-hero-mobile.png`

- [ ] 使用 Chrome 检查桌面端 1440×900，确认标题、人物和横幅不互相遮挡。
- [ ] 使用 Chrome 检查手机端 390×844，确认无横向滚动、文字重叠和人物严重截断。
- [ ] 检查控制台、资源请求、H1 数量和首屏按钮。
- [ ] 根据截图进行一次必要的视觉微调并重新验收。
