#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查 dist/ 站点内部链接完整性。
扫描所有 HTML 文件中的 href/src 属性，验证指向的本地资源是否存在。
"""

import re
import sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

ROOT_DIR = Path(__file__).parent.parent
DIST_DIR = ROOT_DIR / "dist"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 不需要检查的外部协议
IGNORED_SCHEMES = {"http", "https", "mailto", "tel", "javascript", "data"}

# 学生作品是从外部平台导入的独立成品，可能包含学生自定义的相对素材路径。
# 官网只检查入口文件是否存在，不深入校验这些原始作品内部的资源组织。
SKIP_HTML_PREFIXES = {
    ("assets", "student-works"),
}


class LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []  # (属性名, 链接值, 标签名)

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        for attr in ("href", "src"):
            if attr in attrs_dict:
                self.links.append((attr, attrs_dict[attr], tag))


def resolve_local_path(base_file: Path, link: str) -> Path | None:
    """
    把 HTML 中的相对链接解析为 dist/ 下的绝对路径。
    只处理以 / 开头或相对路径的链接；忽略外部链接、锚点和查询参数。
    """
    if not link or link.startswith("#"):
        return None

    parsed = urlparse(link)
    if parsed.scheme in IGNORED_SCHEMES:
        return None

    path_part = unquote(parsed.path)
    if not path_part:
        return None

    if path_part.startswith("/"):
        resolved = DIST_DIR / path_part.lstrip("/")
    else:
        resolved = base_file.parent / path_part

    return resolved.resolve()


def check_links():
    if not DIST_DIR.exists():
        print("错误: dist 目录不存在，请先运行构建脚本")
        return 1

    html_files = sorted(DIST_DIR.rglob("*.html"))
    total_links = 0
    broken_links = []

    for html_file in html_files:
        # 跳过为画布生成的 pages/ 扁平副本，避免重复检查
        rel_parts = html_file.relative_to(DIST_DIR).parts
        if "pages" in rel_parts[:1]:
            continue

        if any(rel_parts[:len(prefix)] == prefix for prefix in SKIP_HTML_PREFIXES):
            continue

        content = html_file.read_text(encoding="utf-8")
        extractor = LinkExtractor()
        extractor.feed(content)

        for attr, link, tag in extractor.links:
            target = resolve_local_path(html_file, link)
            if target is None:
                continue

            total_links += 1
            # 目录链接默认解析为目录下的 index.html
            check_target = target
            if target.is_dir():
                check_target = target / "index.html"

            if not check_target.exists():
                broken_links.append({
                    "source": html_file.relative_to(DIST_DIR),
                    "tag": tag,
                    "attr": attr,
                    "link": link,
                    "expected": check_target.relative_to(DIST_DIR) if check_target.is_relative_to(DIST_DIR) else check_target
                })

    print("=" * 60)
    print(f"链接检查完成：共检查 {total_links} 个内部链接")
    print("=" * 60)

    if broken_links:
        print(f"\n发现 {len(broken_links)} 个无效链接：\n")
        for item in broken_links:
            print(f"  来源: {item['source']}")
            attr_escaped = item['attr'].replace('\\', '\\\\')
            print(f"  标签: <{item['tag']} {attr_escaped}=\"{item['link']}\">")
            print(f"  期望路径: {item['expected']}")
            print()
        return 1

    print("[通过] 所有内部链接均有效")
    return 0


if __name__ == "__main__":
    exit(check_links())
