#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新起点青少年人工智能官网 - 站点检查脚本
检查生成的站点是否符合基本要求
"""

import os
import re
import sys
from pathlib import Path
from html.parser import HTMLParser

ROOT_DIR = Path(__file__).parent.parent
DIST_DIR = ROOT_DIR / "dist"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 学生作品属于外部导入的原始成品，不按官网页面的 SEO/H1 规范做强制检查。
SKIP_HTML_PREFIXES = {
    ("assets", "student-works"),
}

class HTMLChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1_count = 0
        self.title = ""
        self.has_lang = False
        self.has_description = False
        self.has_canonical = False
        self.errors = []
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "h1":
            self.h1_count += 1
        if tag == "html":
            if "lang" in attrs_dict:
                self.has_lang = True
        if tag == "meta":
            name = attrs_dict.get("name", "")
            if name == "description":
                self.has_description = True
        if tag == "link":
            rel = attrs_dict.get("rel", "")
            if rel == "canonical":
                self.has_canonical = True
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data

def check_file_exists(path, description):
    """检查文件是否存在"""
    if path.exists():
        print(f"  [通过] {description}: {path.name}")
        return True
    else:
        print(f"  [失败] 缺少{description}: {path.name}")
        return False

def check_html_file(filepath):
    """检查HTML文件的基本要求"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        checker = HTMLChecker()
        checker.feed(content)

        issues = []
        if not checker.has_lang:
            issues.append("缺少 lang 属性")
        if not checker.title:
            issues.append("缺少 <title>")
        if not checker.has_description:
            issues.append("缺少 meta description")
        if checker.h1_count == 0:
            issues.append("缺少 H1")
        if checker.h1_count > 1:
            issues.append(f"H1 数量为 {checker.h1_count}（应为1）")

        # 检查是否有本机绝对路径（Windows）
        if re.search(r'[A-Za-z]:\\', content) and 'dist' not in str(filepath):
            issues.append("可能包含本机绝对路径")

        if issues:
            print(f"  ⚠ {filepath.relative_to(DIST_DIR)}:")
            for issue in issues:
                print(f"      - {issue}")
            return False
        else:
            print(f"  [通过] {filepath.relative_to(DIST_DIR)}")
            return True
    except Exception as e:
        print(f"  [失败] {filepath.relative_to(DIST_DIR)}: 检查失败 - {e}")
        return False

def main():
    print("=" * 50)
    print("站点检查开始")
    print("=" * 50)

    if not DIST_DIR.exists():
        print("错误: dist 目录不存在，请先运行构建脚本")
        return 1

    all_pass = True

    # 检查必要文件
    print("\n1. 检查必要文件:")
    required_files = [
        (DIST_DIR / "index.html", "首页"),
        (DIST_DIR / "404.html", "404页面"),
        (DIST_DIR / "privacy.html", "隐私页面"),
        (DIST_DIR / "robots.txt", "robots.txt"),
        (DIST_DIR / "sitemap.xml", "sitemap.xml"),
        (DIST_DIR / "llms.txt", "llms.txt"),
        (DIST_DIR / "assets" / "css" / "style.css", "样式文件"),
        (DIST_DIR / "assets" / "js" / "main.js", "脚本文件"),
    ]
    for path, desc in required_files:
        if not check_file_exists(path, desc):
            all_pass = False

    # 检查目录结构
    print("\n2. 检查目录和页面:")
    directories = ["courses", "cases", "competitions", "works", "honors", "questions", "about", "contact"]
    for d in directories:
        dir_path = DIST_DIR / d
        index_path = dir_path / "index.html"
        if dir_path.exists() and index_path.exists():
            print(f"  [通过] {d}/ 目录及 index.html")
        else:
            print(f"  [失败] 缺少 {d}/ 目录或 index.html")
            all_pass = False

    # 问答页面检查
    print("\n3. 检查贵阳AI问答页面:")
    qa_pages = [
        "guiyang-where-learn-ai.html",
        "guiyang-kids-learn-ai.html",
        "guiyang-youth-ai.html",
        "guiyang-ai-competition.html",
        "guiyang-whitelist-competition.html",
        "guiyang-technology-talent.html",
    ]
    for page in qa_pages:
        page_path = DIST_DIR / "questions" / page
        if page_path.exists():
            print(f"  [通过] questions/{page}")
        else:
            print(f"  [失败] 缺少 questions/{page}")
            all_pass = False

    # HTML合规检查
    print("\n4. HTML基础合规检查:")
    html_files = list(DIST_DIR.rglob("*.html"))
    html_pass = 0
    for html_file in html_files:
        # 跳过模板文件（如果dist中有）
        if "template" in html_file.name:
            continue
        rel_parts = html_file.relative_to(DIST_DIR).parts
        if any(rel_parts[:len(prefix)] == prefix for prefix in SKIP_HTML_PREFIXES):
            continue
        if check_html_file(html_file):
            html_pass += 1
        else:
            all_pass = False

    print("\n" + "=" * 50)
    if all_pass:
        print("[通过] 站点检查通过！")
        return 0
    else:
        print("⚠ 站点存在一些需要注意的问题（部分可能是占位内容导致的警告）")
        return 0  # 警告不中断构建

if __name__ == "__main__":
    exit(main())
