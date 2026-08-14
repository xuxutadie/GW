#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 dist/project.design 文件并注册所有页面节点。

说明：solo-design 的 .design 验证器要求 htmlSrc 为 pages/<flat-name>.html 格式，
且 node id 必须与 htmlSrc 的 slug 一致。因此把 dist/ 下按 URL 结构分布的 HTML 页面
映射为 dist/pages/ 下的扁平文件，专供设计画布注册和渲染；实际站点 URL 结构保持不变。
"""

import json
import re
import shutil
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent.parent
DIST_DIR = ROOT_DIR / "dist"
PAGES_DIR = DIST_DIR / "pages"
DESIGN_PATH = DIST_DIR / "project.design"


def extract_title(html_path: Path) -> str:
    """从 HTML 文件中提取 <title> 内容，失败时返回文件名。"""
    try:
        text = html_path.read_text(encoding="utf-8")
        match = re.search(r"<title>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip().split("｜")[0]
    except Exception:
        pass
    return html_path.stem


def flatten_html_name(dist_rel: Path) -> str:
    """
    把 dist/ 下的相对路径映射为 pages/ 下的扁平文件名。
    例如：
        index.html -> index.html
        about/index.html -> about.html
        courses/ai-application.html -> courses-ai-application.html
        questions/guiyang-where-learn-ai.html -> questions-guiyang-where-learn-ai.html
    """
    parts = list(dist_rel.parts)
    # 去掉末尾的 .html，得到路径片段列表
    stem_parts = parts[:-1] + [Path(parts[-1]).stem]
    return "-".join(stem_parts) + ".html"


def clean_pages_dir():
    """清空 pages/ 目录，避免残留旧的子目录结构。"""
    if PAGES_DIR.exists():
        shutil.rmtree(PAGES_DIR)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)


def build_design():
    if not DIST_DIR.exists():
        raise FileNotFoundError(f"dist 目录不存在: {DIST_DIR}")

    clean_pages_dir()

    # 收集 dist/ 下所有 HTML 文件，排除 pages/ 目录本身
    dist_html_files = sorted(
        p for p in DIST_DIR.rglob("*.html")
        if not (PAGES_DIR in p.parents or p.parent == PAGES_DIR)
    )

    if not dist_html_files:
        raise FileNotFoundError(f"dist/ 下没有 HTML 文件: {DIST_DIR}")

    now_ts = int(datetime.now(timezone.utc).timestamp())
    nodes = []
    base_x, base_y = 40, 40
    gap_x, gap_y = 420, 320
    cols = 3

    for idx, src in enumerate(dist_html_files):
        rel = src.relative_to(DIST_DIR)
        flat_name = flatten_html_name(rel)
        dst = PAGES_DIR / flat_name
        shutil.copy2(src, dst)

        html_src = f"pages/{flat_name}"
        # slug 为去掉 pages/ 和 .html 的部分，例如 "about"
        slug = flat_name.replace(".html", "")
        node_id = f"page-{slug}"
        title = extract_title(src)

        col = idx % cols
        row = idx // cols
        x = base_x + col * gap_x
        y = base_y + row * gap_y

        nodes.append({
            "id": node_id,
            "title": title,
            "type": "page",
            "version": 1,
            "createdAt": now_ts,
            "devMetadata": {
                "htmlSrc": html_src,
                "interactions": []
            },
            "canvasData": {
                "x": x,
                "y": y,
                "group": 0
            }
        })

    design = {
        "data": nodes,
        "config": {
            "deviceType": "desktop",
            "autoLayout": False
        }
    }

    DESIGN_PATH.write_text(json.dumps(design, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已生成 {DESIGN_PATH}")
    print(f"共注册 {len(nodes)} 个页面节点")


if __name__ == "__main__":
    build_design()
