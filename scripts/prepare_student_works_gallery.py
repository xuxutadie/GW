#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
整理学生作品展示页：
1. 将公开作品中的 zip 主页包解压为可直接访问的静态网页目录。
2. 自动寻找每个主页包的入口 HTML。
3. 重写 works/index.html，统一使用“查看作品”，不再提供下载入口。
4. 为后续缩略图生成预留 thumbnail 字段。
"""

from __future__ import annotations

import json
import shutil
import zipfile
from html import escape
from pathlib import Path, PurePosixPath
from urllib.parse import quote


ROOT_DIR = Path(__file__).parent.parent
WORKS_DIR = ROOT_DIR / "src" / "assets" / "student-works" / "public-20260814"
DATA_FILE = WORKS_DIR / "works-data.json"
WORKS_PAGE = ROOT_DIR / "src" / "pages" / "works" / "index.html"
THUMB_DIR_NAME = "thumbs"


def web_path(*parts: str) -> str:
    """生成可放入 href/src 的 URL，保留斜杠并编码中文与空格。"""
    return "/" + "/".join(quote(part, safe="") for part in parts)


def is_unsafe_zip_member(name: str) -> bool:
    """避免解压系统文件、Git 历史、临时工程缓存和路径穿越。"""
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts:
        return True
    ignored_parts = {"__MACOSX", ".git", "node_modules", "$tmp", ".trae-html-share-packages"}
    return any(part in ignored_parts or part.startswith("._") for part in path.parts)


def safe_extract(zip_path: Path, target_dir: Path) -> list[str]:
    extracted_names: list[str] = []
    with zipfile.ZipFile(zip_path) as archive:
        for info in archive.infolist():
            name = info.filename.replace("\\", "/")
            if not name or is_unsafe_zip_member(name):
                continue
            if name.endswith("/"):
                (target_dir / PurePosixPath(name)).mkdir(parents=True, exist_ok=True)
                continue
            destination = target_dir / PurePosixPath(name)
            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as src, destination.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            extracted_names.append(name)
    return extracted_names


def score_html_entry(name: str, item: dict) -> tuple[int, int, int, str]:
    path = PurePosixPath(name)
    basename = path.name.lower()
    parts = tuple(part.lower() for part in path.parts)
    title = str(item.get("title", "")).lower()

    score = 0
    if basename == "index.html":
        score += 100
    if basename in {"standalone.html", "portfolio-gallery.html"}:
        score += 70
    if "index" in basename:
        score += 40
    if "home" in basename or "主页" in basename or "个人" in basename:
        score += 20
    if title and title in name.lower():
        score += 12
    if any(part in {"dist", "build", "public"} for part in parts):
        score += 4
    # 层级越浅越优先，路径越短越优先。
    return (score, -len(path.parts), -len(name), name)


def find_entry_html(zip_path: Path, item: dict) -> str | None:
    with zipfile.ZipFile(zip_path) as archive:
        html_names = [
            name.replace("\\", "/")
            for name in archive.namelist()
            if name.lower().endswith((".html", ".htm")) and not is_unsafe_zip_member(name.replace("\\", "/"))
        ]
    if not html_names:
        return None
    return max(html_names, key=lambda name: score_html_entry(name, item))


def category_label(item: dict) -> str:
    if item.get("type") == "homepage" or "homepage" in str(item.get("category", "")):
        return "个人主页"
    return "HTML网页"


def size_label(size: int | None) -> str:
    if not size:
        return "静态作品"
    if size >= 1024 * 1024:
        return f"{size / 1024 / 1024:.1f}MB"
    return f"{max(1, round(size / 1024))}KB"


def normalize_data() -> list[dict]:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    for item in data:
        index = int(item["index"])
        slug = f"work-{index:03d}"
        original_file = item.get("fileName", "")
        item["thumbnail"] = web_path("assets", "student-works", "public-20260814", THUMB_DIR_NAME, f"{slug}.png")

        if str(original_file).lower().endswith(".zip"):
            zip_path = WORKS_DIR / original_file
            entry_html = find_entry_html(zip_path, item) if zip_path.exists() else None
            if entry_html:
                site_dir = WORKS_DIR / f"{slug}-site"
                if site_dir.exists():
                    shutil.rmtree(site_dir)
                site_dir.mkdir(parents=True, exist_ok=True)
                safe_extract(zip_path, site_dir)

                item["originalFileName"] = original_file
                item["fileName"] = f"{slug}-site/{entry_html}"
                item["url"] = web_path("assets", "student-works", "public-20260814", f"{slug}-site", *PurePosixPath(entry_html).parts)
                item["isZip"] = False
                item["directView"] = True
                # 公开站点不再暴露 zip 下载入口，原始下载件仍保留在 .tmp-import 中。
                zip_path.unlink(missing_ok=True)
            else:
                item["directView"] = False
        else:
            item["directView"] = True

        description = str(item.get("description", ""))
        if "可下载后查看完整静态网站文件" in description:
            item["description"] = description.replace("可下载后查看完整静态网站文件", "可直接打开查看完整网页效果")

    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data


def render_card(item: dict) -> str:
    label = category_label(item)
    categories = escape(str(item.get("category", "")).strip() or "html", quote=True)
    title = escape(str(item.get("title", "学生作品")), quote=False)
    title_attr = escape(str(item.get("title", "学生作品")), quote=True)
    student = escape(str(item.get("studentName", "学生")), quote=False)
    desc = escape(str(item.get("description", "学生完成的网页作品，展示项目构思、页面设计和交互实现能力。")), quote=False)
    url = escape(str(item.get("url", "#")), quote=True)
    thumb = escape(str(item.get("thumbnail", "")), quote=True)
    size = size_label(item.get("size"))

    return f'''      <article class="student-work-card" data-category="{categories}">
        <a class="student-work-link" href="{url}" target="_blank" rel="noopener noreferrer" aria-label="查看作品：{title_attr}">
          <div class="student-work-thumb has-thumbnail">
            <img src="{thumb}" alt="{title_attr} 缩略图" loading="lazy">
            <span>{label}</span>
            <strong>{title}</strong>
            <small>{student}</small>
          </div>
          <div class="student-work-body">
            <div class="student-work-meta">
              <span>{label}</span>
              <span>{escape(size, quote=False)}</span>
            </div>
            <h2>{title}</h2>
            <p>{desc}</p>
            <div class="student-work-footer">
              <span>作者：{student}</span>
              <span class="btn btn-secondary btn-sm">查看作品</span>
            </div>
          </div>
        </a>
      </article>'''


def render_page(data: list[dict]) -> str:
    html_count = sum(1 for item in data if item.get("type") == "html")
    homepage_count = sum(1 for item in data if item.get("type") == "homepage")
    cards = "\n".join(render_card(item) for item in data if item.get("directView"))
    return f'''<!-- MAIN_CONTENT_START -->
<section class="page-header">
  <div class="container">
    <h1>学生作品</h1>
    <p>孩子们亲手完成的作品展示</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="filter-bar">
      <button class="filter-btn active" data-filter="all">全部</button>
      <button class="filter-btn" data-filter="html">HTML网页</button>
      <button class="filter-btn" data-filter="homepage">个人主页</button>
      <button class="filter-btn" data-filter="game">互动游戏</button>
      <button class="filter-btn" data-filter="science">科普应急</button>
      <button class="filter-btn" data-filter="tool">工具系统</button>
    </div>

    <div class="works-import-summary">
      <span class="empty-kicker">教师端公开作品导入</span>
      <h2>已整理 {len(data)} 个公开学生作品</h2>
      <p>以下作品均已整理为可直接打开的网页入口。点击卡片即可在新页面查看作品，官网只保留在线展示入口。</p>
      <div class="empty-points">
        <span>HTML网页 {html_count} 个</span>
        <span>个人主页 {homepage_count} 个</span>
        <span>统一缩略图展示</span>
      </div>
    </div>

    <div class="student-works-grid">
{cards}
    </div>
  </div>
</section>
<!-- MAIN_CONTENT_END -->
'''


def main() -> int:
    if not DATA_FILE.exists():
        print(f"缺少数据文件: {DATA_FILE}")
        return 1
    data = normalize_data()
    WORKS_PAGE.write_text(render_page(data), encoding="utf-8")
    direct_count = sum(1 for item in data if item.get("directView"))
    print(f"已整理 {len(data)} 个作品，其中 {direct_count} 个提供直接查看入口。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
