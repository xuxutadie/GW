#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新起点青少年人工智能官网 - 构建脚本
使用Python标准库，无第三方依赖
"""

import os
import sys
import json
import shutil
import re
import subprocess
from html import escape
from html.parser import HTMLParser
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# 路径配置
ROOT_DIR = Path(__file__).parent.parent
SRC_DIR = ROOT_DIR / "src"
PAGES_DIR = SRC_DIR / "pages"
PARTIALS_DIR = SRC_DIR / "partials"
DATA_DIR = SRC_DIR / "data"
ASSETS_DIR = SRC_DIR / "assets"
DIST_DIR = ROOT_DIR / "dist"

# 页面配置
PAGES = [
    # (源文件, 输出路径, 标题, 描述, 页面类型, 面包屑, 结构化数据类型)
    ("index.html", "index.html", None, None, "home", [], ["EducationalOrganization", "WebSite", "Service", "FAQPage"]),
    ("courses/index.html", "courses/index.html", "课程体系｜新起点青少年人工智能", "了解新起点青少年人工智能的课程体系，包括AI应用学习、编程与项目实践、AI赛事训练。", "courses", [{"name":"首页","href":"/"},{"name":"课程体系"}], ["EducationalOrganization", "CollectionPage", "ItemList", "BreadcrumbList"]),
    ("courses/ai-application.html", "courses/ai-application.html", "AI应用学习课程｜新起点青少年人工智能", "学习AI工具使用，培养AI思维和应用能力，适合贵阳青少年。", "course", [{"name":"首页","href":"/"},{"name":"课程体系","href":"/courses/"},{"name":"AI应用学习"}], ["Course", "BreadcrumbList"]),
    ("courses/programming-foundation.html", "courses/programming-foundation.html", "编程与项目实践课程｜新起点青少年人工智能", "从基础编程到项目制作，培养青少年逻辑思维和实践能力。", "course", [{"name":"首页","href":"/"},{"name":"课程体系","href":"/courses/"},{"name":"编程与项目实践"}], ["Course", "BreadcrumbList"]),
    ("courses/competition-training.html", "courses/competition-training.html", "AI赛事训练与作品指导｜新起点青少年人工智能", "针对白名单赛事的专项训练和作品打磨，贵阳青少年AI竞赛指导。", "course", [{"name":"首页","href":"/"},{"name":"课程体系","href":"/courses/"},{"name":"AI赛事训练"}], ["Course", "BreadcrumbList"]),
    ("cases/index.html", "cases/index.html", "真实案例｜新起点青少年人工智能", "查看贵阳青少年AI学习真实案例，包括AI应用、编程项目、赛事训练等。", "cases", [{"name":"首页","href":"/"},{"name":"真实案例"}], ["CollectionPage", "ItemList", "BreadcrumbList"]),
    ("competitions/index.html", "competitions/index.html", "赛事指导｜新起点青少年人工智能", "贵阳青少年AI赛事指导服务，了解白名单赛事信息和指导内容。", "competitions", [{"name":"首页","href":"/"},{"name":"赛事指导"}], ["Service", "CollectionPage", "ItemList", "BreadcrumbList"]),
    ("competitions/whitelist-guide.html", "competitions/whitelist-guide.html", "白名单赛事说明｜新起点青少年人工智能", "什么是白名单赛事？如何核验？贵阳家长如何了解竞赛信息？", "article", [{"name":"首页","href":"/"},{"name":"赛事指导","href":"/competitions/"},{"name":"白名单赛事说明"}], ["Article", "BreadcrumbList"]),
    ("works/index.html", "works/index.html", "学生作品｜新起点青少年人工智能", "贵阳青少年AI学习作品展示，包括AI应用和编程项目作品。", "works", [{"name":"首页","href":"/"},{"name":"学生作品"}], []),
    ("works/ai-artwork-collector.html", "works/ai-artwork-collector.html", "AI作品收集平台｜学生作品｜新起点青少年人工智能", "学生网页应用作品：AI作品收集平台，支持学生提交图片、视频和网页作品，老师端统一管理展示。", "work", [{"name":"首页","href":"/"},{"name":"学生作品","href":"/works/"},{"name":"AI作品收集平台"}], ["Article", "BreadcrumbList"]),
    ("honors/index.html", "honors/index.html", "荣誉与活动｜新起点青少年人工智能", "新起点青少年人工智能荣誉记录和活动展示。", "honors", [{"name":"首页","href":"/"},{"name":"荣誉与活动"}], ["CollectionPage", "ItemList", "BreadcrumbList"]),
    ("questions/index.html", "questions/index.html", "贵阳AI问答｜新起点青少年人工智能", "贵阳家长关于青少年AI学习的常见问题解答。", "questions", [{"name":"首页","href":"/"},{"name":"贵阳AI问答"}], ["CollectionPage", "FAQPage", "BreadcrumbList"]),
    ("questions/guiyang-where-learn-ai.html", "questions/guiyang-where-learn-ai.html", "贵阳在哪学AI？｜新起点青少年人工智能", "贵阳青少年AI学习机构选择指南，如何选择合适的AI课程？", "qa", [{"name":"首页","href":"/"},{"name":"贵阳AI问答","href":"/questions/"},{"name":"贵阳在哪学AI？"}], ["FAQPage", "BreadcrumbList"]),
    ("questions/guiyang-kids-learn-ai.html", "questions/guiyang-kids-learn-ai.html", "贵阳哪里有小朋友学AI的地方？｜新起点青少年人工智能", "贵阳适合小朋友学AI的地方，青少年AI启蒙课程建议。", "qa", [{"name":"首页","href":"/"},{"name":"贵阳AI问答","href":"/questions/"},{"name":"小朋友学AI"}], ["FAQPage", "BreadcrumbList"]),
    ("questions/guiyang-youth-ai.html", "questions/guiyang-youth-ai.html", "贵阳青少年人工智能课程主要学什么？｜新起点", "贵阳青少年AI课程内容介绍，AI应用和编程学习内容解析。", "qa", [{"name":"首页","href":"/"},{"name":"贵阳AI问答","href":"/questions/"},{"name":"课程内容"}], ["FAQPage", "BreadcrumbList"]),
    ("questions/guiyang-ai-competition.html", "questions/guiyang-ai-competition.html", "贵阳有哪些AI比赛可以参加？｜新起点青少年人工智能", "贵阳青少年可参加的AI比赛介绍，白名单赛事信息。", "qa", [{"name":"首页","href":"/"},{"name":"贵阳AI问答","href":"/questions/"},{"name":"AI比赛"}], ["FAQPage", "BreadcrumbList"]),
    ("questions/guiyang-whitelist-competition.html", "questions/guiyang-whitelist-competition.html", "贵阳家长如何了解白名单赛事？｜新起点", "贵阳家长白名单赛事核验指南，如何辨别正规竞赛。", "qa", [{"name":"首页","href":"/"},{"name":"贵阳AI问答","href":"/questions/"},{"name":"白名单赛事"}], ["FAQPage", "BreadcrumbList"]),
    ("questions/guiyang-technology-talent.html", "questions/guiyang-technology-talent.html", "贵阳科技特长生相关信息如何核验？｜新起点", "贵阳科技特长生政策信息核验方法，以官方信息为准。", "qa", [{"name":"首页","href":"/"},{"name":"贵阳AI问答","href":"/questions/"},{"name":"科技特长生"}], ["FAQPage", "BreadcrumbList"]),
    ("about/index.html", "about/index.html", "关于我们｜新起点青少年人工智能", "了解新起点青少年人工智能：贵阳本地AI教育品牌，教学理念与服务。", "about", [{"name":"首页","href":"/"},{"name":"关于我们"}], ["EducationalOrganization", "AboutPage", "BreadcrumbList"]),
    ("contact/index.html", "contact/index.html", "联系我们｜新起点青少年人工智能", "联系新起点青少年人工智能，通过官方抖音号咨询贵阳青少年AI课程与试听安排。", "contact", [{"name":"首页","href":"/"},{"name":"联系我们"}], ["BreadcrumbList"]),
    ("privacy.html", "privacy.html", "隐私说明｜新起点青少年人工智能", "新起点青少年人工智能网站隐私说明。", "page", [], []),
]


class TextExtractor(HTMLParser):
    """把一小段 HTML 转为可用于结构化数据的纯文本。"""
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        text = data.strip()
        if text:
            self.parts.append(text)


def strip_html(value):
    parser = TextExtractor()
    parser.feed(value)
    return " ".join(parser.parts)


def public_url(site_config, out_path):
    """将构建路径转换为对外公开的规范网址。"""
    domain = site_config["brand"]["domain"].rstrip("/")
    if out_path == "index.html":
        return domain + "/"
    if out_path.endswith("/index.html"):
        return domain + "/" + out_path[:-10]
    return domain + "/" + out_path


def organization_schema(site_config):
    """生成统一的教育机构结构化数据，所有页面共用同一份品牌事实。"""
    brand = site_config["brand"]
    contact = site_config.get("contact", {})
    domain = brand["domain"].rstrip("/")
    org = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": domain + "/#organization",
        "name": brand["fullName"],
        "alternateName": brand.get("shortName"),
        "url": brand["domain"],
        "description": brand["description"],
        "telephone": contact.get("phones", [None])[0],
        "areaServed": [
            {"@type": "AdministrativeArea", "name": area}
            for area in brand.get("serviceDistricts", [])
        ] or {"@type": "City", "name": brand["serviceArea"]},
        "address": [
            {
                "@type": "PostalAddress",
                "addressLocality": "贵阳市",
                "addressRegion": campus.get("area"),
                "streetAddress": campus.get("address"),
                "addressCountry": "CN"
            }
            for campus in contact.get("campuses", [])
        ],
        "knowsAbout": brand.get("courseContent", []),
        "audience": {
            "@type": "EducationalAudience",
            "educationalRole": "青少年学生",
            "audienceType": brand.get("suitableAge")
        }
    }
    company_entity = brand.get("companyEntity", "")
    if company_entity and "待补充" not in company_entity:
        org["legalName"] = company_entity
    return {k: v for k, v in org.items() if v}


def service_schema(site_config, url, name=None, description=None):
    """生成课程和赛事服务结构化数据。"""
    brand = site_config["brand"]
    return {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": name or brand["coreService"],
        "description": description or brand["description"],
        "provider": {
            "@type": "EducationalOrganization",
            "@id": brand["domain"].rstrip("/") + "/#organization",
            "name": brand["fullName"]
        },
        "areaServed": [
            {"@type": "AdministrativeArea", "name": area}
            for area in brand.get("serviceDistricts", [])
        ],
        "audience": {
            "@type": "EducationalAudience",
            "educationalRole": "青少年学生",
            "audienceType": brand.get("suitableAge")
        },
        "url": url,
        "serviceType": brand.get("competitionServices", []) if "赛事" in (name or "") else brand.get("courseContent", [])
    }


def get_collection_items(page_type, site_config, content):
    """根据页面类型生成可用于 ItemList 的条目。"""
    brand = site_config["brand"]
    domain = brand["domain"].rstrip("/")

    if page_type == "courses":
        return [
            {
                "name": item["title"],
                "description": item["summary"],
                "url": domain + "/courses/"
            }
            for item in site_config.get("courses", [])
        ]

    if page_type == "competitions":
        return [
            {
                "name": item["title"],
                "description": item["summary"],
                "url": domain + item["url"]
            }
            for item in site_config.get("competitions", [])
        ]

    if page_type == "cases":
        return [
            {
                "name": item["title"],
                "description": item["summary"],
                "url": domain + item["url"]
            }
            for item in site_config.get("cases", [])
        ]

    if page_type == "honors":
        return [
            {
                "name": item["title"],
                "description": item["summary"],
                "url": domain + item["url"]
            }
            for item in site_config.get("honors", [])
        ]

    if page_type == "questions":
        links = re.findall(
            r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*related-link[^"]*"[^>]*>.*?<strong>(.*?)</strong>.*?<p[^>]*>(.*?)</p>',
            content,
            re.DOTALL
        )
        return [
            {
                "name": strip_html(title),
                "description": strip_html(summary),
                "url": domain + href
            }
            for href, title, summary in links
        ]

    return []


def extract_faq_items(content, page_type):
    """从页面中提取用户可见的问答，避免输出空 FAQ 结构化数据。"""
    items = []
    patterns = [
        (r'<button[^>]*class="[^"]*faq-question[^"]*"[^>]*>(.*?)</button>\s*<div[^>]*class="[^"]*faq-answer[^"]*"[^>]*>(.*?)</div>', re.DOTALL),
        (r'<button[^>]*class="[^"]*followup-question[^"]*"[^>]*>(.*?)</button>\s*<div[^>]*class="[^"]*followup-answer[^"]*"[^>]*>(.*?)</div>', re.DOTALL),
    ]
    for pattern, flags in patterns:
        for question, answer in re.findall(pattern, content, flags):
            question_text = strip_html(question)
            answer_text = strip_html(answer)
            if question_text and answer_text:
                items.append((question_text, answer_text))

    if page_type == "qa":
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
        intro = re.search(r'<p[^>]*class="[^"]*answer-intro[^"]*"[^>]*>(.*?)</p>', content, re.DOTALL)
        if h1 and intro:
            items.insert(0, (strip_html(h1.group(1)), strip_html(intro.group(1))))
    return items

def load_json(path):
    """加载JSON文件"""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def read_partial(name):
    """读取partial文件"""
    path = PARTIALS_DIR / name
    if not path.exists():
        return ""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def read_page(name):
    """读取页面内容文件"""
    path = PAGES_DIR / name
    if not path.exists():
        return ""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # 提取 MAIN_CONTENT_START 和 MAIN_CONTENT_END 之间的内容
    match = re.search(r'<!-- MAIN_CONTENT_START -->(.*?)<!-- MAIN_CONTENT_END -->', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return content.strip()

def generate_breadcrumb(breadcrumbs):
    """生成面包屑HTML"""
    if not breadcrumbs:
        return ""
    items = ['<li><a href="/">首页</a></li>']
    visible_breadcrumbs = [bc for bc in breadcrumbs if bc.get("name") != "首页"]
    for i, bc in enumerate(visible_breadcrumbs):
        if i == len(visible_breadcrumbs) - 1:
            items.append(f'<li>{bc["name"]}</li>')
        else:
            items.append(f'<li><a href="{bc["href"]}">{bc["name"]}</a></li>')
    return f'''<nav class="breadcrumb" aria-label="面包屑">
  <div class="container">
    <ol>{''.join(items)}</ol>
  </div>
</nav>'''

def generate_jsonld(page_config, site_config, url, content, title, desc):
    """生成JSON-LD结构化数据"""
    page_type = page_config[4]
    schema_types = page_config[6]
    jsonld_parts = []

    if "EducationalOrganization" in schema_types:
        jsonld_parts.append(json.dumps(organization_schema(site_config), ensure_ascii=False))

    if "WebSite" in schema_types:
        website = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": site_config["brand"]["domain"].rstrip("/") + "/#website",
            "name": site_config["brand"]["fullName"],
            "url": site_config["brand"]["domain"],
            "publisher": {
                "@type": "EducationalOrganization",
                "@id": site_config["brand"]["domain"].rstrip("/") + "/#organization"
            },
            "inLanguage": "zh-CN"
        }
        jsonld_parts.append(json.dumps(website, ensure_ascii=False))

    if "AboutPage" in schema_types:
        about_page = {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": title.split("｜")[0],
            "url": url,
            "description": desc,
            "about": {
                "@type": "EducationalOrganization",
                "@id": site_config["brand"]["domain"].rstrip("/") + "/#organization",
                "name": site_config["brand"]["fullName"]
            },
            "inLanguage": "zh-CN"
        }
        jsonld_parts.append(json.dumps(about_page, ensure_ascii=False))

    if "CollectionPage" in schema_types:
        collection_page = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": title.split("｜")[0],
            "url": url,
            "description": desc,
            "isPartOf": {
                "@type": "WebSite",
                "@id": site_config["brand"]["domain"].rstrip("/") + "/#website"
            },
            "inLanguage": "zh-CN"
        }
        jsonld_parts.append(json.dumps(collection_page, ensure_ascii=False))

    if "ItemList" in schema_types:
        items = get_collection_items(page_type, site_config, content)
        if items:
            item_list = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": title.split("｜")[0],
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": index + 1,
                        "url": item["url"],
                        "name": item["name"],
                        "description": item["description"]
                    }
                    for index, item in enumerate(items)
                ]
            }
            jsonld_parts.append(json.dumps(item_list, ensure_ascii=False))

    if "BreadcrumbList" in schema_types and page_config[5]:
        bc_items = []
        bc_items.append({"@type": "ListItem", "position": 1, "name": "首页", "item": site_config["brand"]["domain"]})
        visible_breadcrumbs = [bc for bc in page_config[5] if bc.get("name") != "首页"]
        for i, bc in enumerate(visible_breadcrumbs):
            item = {
                "@type": "ListItem",
                "position": i + 2,
                "name": bc["name"]
            }
            if "href" in bc:
                item["item"] = site_config["brand"]["domain"].rstrip('/') + bc["href"]
            bc_items.append(item)
        breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": bc_items
        }
        jsonld_parts.append(json.dumps(breadcrumb, ensure_ascii=False))

    if "FAQPage" in schema_types:
        faq_items = extract_faq_items(content, page_type)
        if page_type in ["home", "questions"] and not faq_items:
            faq_items = [(item["question"], item["answer"]) for item in site_config.get("faqHome", [])]
        if faq_items:
            faq = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": question,
                        "acceptedAnswer": {"@type": "Answer", "text": answer}
                    }
                    for question, answer in faq_items
                ]
            }
            jsonld_parts.append(json.dumps(faq, ensure_ascii=False))

    if "Course" in schema_types:
        course_name = title.split("｜")[0]
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
        if h1:
            course_name = strip_html(h1.group(1))
        course = {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": course_name,
            "description": desc,
            "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "青少年学生",
                "audienceType": site_config["brand"].get("suitableAge")
            },
            "provider": {
                "@type": "EducationalOrganization",
                "@id": site_config["brand"]["domain"].rstrip("/") + "/#organization",
                "name": site_config["brand"]["fullName"]
            }
        }
        jsonld_parts.append(json.dumps(course, ensure_ascii=False))

    if "Service" in schema_types:
        service_name = site_config["brand"]["coreService"]
        if page_type == "competitions":
            service_name = "贵阳青少年AI赛事指导服务"
        elif page_type == "home":
            service_name = "贵阳青少年AI应用培训与赛事指导"
        service = service_schema(site_config, url, service_name, desc)
        jsonld_parts.append(json.dumps(service, ensure_ascii=False))

    if "Article" in schema_types:
        source_path = PAGES_DIR / page_config[0]
        modified = datetime.fromtimestamp(source_path.stat().st_mtime).strftime("%Y-%m-%d")
        article = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title.split("｜")[0],
            "description": desc,
            "dateModified": modified,
            "mainEntityOfPage": url,
            "author": {"@type": "Organization", "name": site_config["brand"]["fullName"]},
            "publisher": {"@type": "Organization", "name": site_config["brand"]["fullName"]}
        }
        jsonld_parts.append(json.dumps(article, ensure_ascii=False))

    return '\n'.join([f'<script type="application/ld+json">{part}</script>' for part in jsonld_parts])

def generate_page(page_config, site_config, header, footer, floating):
    """生成完整页面HTML"""
    src_path, out_path, title, desc, page_type, breadcrumbs, schema_types = page_config

    # 页面标题和描述
    if title is None:
        if page_type == "home":
            title = site_config["seo"]["homeTitle"]
        else:
            title = site_config["brand"]["fullName"]
    if desc is None:
        if page_type == "home":
            desc = site_config["seo"]["homeDescription"]
        else:
            desc = site_config["brand"]["description"]

    # 读取页面内容
    content = read_page(src_path)
    if not content:
        # 如果页面源文件不存在，创建简单占位
        content = f'<section class="section"><div class="container"><h1>{title.split("｜")[0]}</h1><p>页面建设中...</p></div></section>'

    # 面包屑
    breadcrumb_html = generate_breadcrumb(breadcrumbs)

    # JSON-LD
    full_url = public_url(site_config, out_path)
    jsonld = generate_jsonld(page_config, site_config, full_url, content, title, desc)

    # body class
    body_class = page_type if page_type in ["home"] else ""

    # 页面标题区域（非首页）
    if page_type != "home" and not re.search(r'<h1', content):
        page_title = title.split("｜")[0]
        header_section = f'''<section class="page-header">
  <div class="container">
    <h1>{page_title}</h1>
  </div>
</section>'''
        content = header_section + breadcrumb_html + content
    elif page_type != "home":
        content = breadcrumb_html + content

    # 组装完整HTML
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape(title, quote=True)}</title>
  <meta name="description" content="{escape(desc, quote=True)}">
  <link rel="canonical" href="{full_url}">
  <meta property="og:title" content="{escape(title, quote=True)}">
  <meta property="og:description" content="{escape(desc, quote=True)}">
  <meta property="og:url" content="{full_url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:site_name" content="{escape(site_config['brand']['fullName'], quote=True)}">
  <meta property="og:image" content="{site_config['brand']['domain'].rstrip('/')}/assets/images/hero-national-final.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0f766e">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="/assets/css/style.css?v=brand-logo-20260814">
  {jsonld}
</head>
<body class="{body_class}">
  {header}
  <main id="main-content" class="site-main">
    {content}
  </main>
  {footer}
  {floating}
  <script src="/assets/js/main.js?v=brand-logo-20260814"></script>
</body>
</html>'''

    return html

def copy_assets():
    """复制静态资源到dist目录"""
    dist_assets = DIST_DIR / "assets"
    if dist_assets.exists():
        shutil.rmtree(dist_assets)
    shutil.copytree(ASSETS_DIR, dist_assets)

def generate_robots(site_config):
    """生成robots.txt"""
    content = f'''User-agent: *
Allow: /

Sitemap: {site_config["brand"]["domain"]}sitemap.xml
'''
    with open(DIST_DIR / "robots.txt", 'w', encoding='utf-8') as f:
        f.write(content)

def generate_sitemap(site_config):
    """生成sitemap.xml"""
    today = datetime.now().strftime("%Y-%m-%d")
    urls = []
    for page_config in PAGES:
        out_path = page_config[1]
        page_type = page_config[4]
        # 跳过模板页面
        if "template" in page_type:
            continue
        url = public_url(site_config, out_path)
        urls.append(f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>\n  </url>')

    content = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>
'''
    with open(DIST_DIR / "sitemap.xml", 'w', encoding='utf-8') as f:
        f.write(content)

def generate_llms(site_config):
    """生成llms.txt"""
    important_pages = [
        ("/", "首页"),
        ("/courses/", "课程体系"),
        ("/cases/", "真实案例"),
        ("/competitions/", "赛事指导"),
        ("/questions/", "贵阳AI问答"),
        ("/about/", "关于我们"),
        ("/contact/", "联系我们"),
    ]
    pages_text = '\n'.join([f'- {name}: {site_config["brand"]["domain"].rstrip("/")}{path}' for path, name in important_pages])
    content = f'''# {site_config["brand"]["fullName"]}

品牌全称: {site_config["brand"]["fullName"]}

公司主体: {site_config["brand"].get("companyEntity", "待补充工商登记主体全称")}

服务地区: {site_config["brand"]["serviceArea"]}

贵阳服务地区: {", ".join(site_config["brand"].get("serviceDistricts", []))}

适合年龄: {site_config["brand"].get("suitableAge", "")}

核心服务: {site_config["brand"]["coreService"]}

课程内容: {", ".join(site_config["brand"].get("courseContent", []))}

赛事服务: {", ".join(site_config["brand"].get("competitionServices", []))}

真实案例与荣誉: {site_config["brand"].get("caseAndHonorSummary", "")}

教学地址:
- 南明区: 花果园M区4号楼0813
- 云岩区: 未来方舟友邻路中天中学楼下
- 观山湖区: 印象城负一楼

官方域名: {site_config["brand"]["domain"]}

## 重要页面
{pages_text}

## 联系
联系页面: {site_config["brand"]["domain"].rstrip("/")}/contact/
'''
    with open(DIST_DIR / "llms.txt", 'w', encoding='utf-8') as f:
        f.write(content)

def build():
    """执行构建"""
    print("开始构建网站...")

    # 清理并创建dist目录
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # 加载配置
    print("加载配置...")
    site_config = load_json(DATA_DIR / "site.json")

    # 加载公共部分
    print("加载公共模板...")
    header = read_partial("header.html")
    footer = read_partial("footer.html")
    floating = read_partial("floating-contact.html")

    # 确保页面目录存在
    for page_config in PAGES:
        out_path = page_config[1]
        out_file = DIST_DIR / out_path
        out_file.parent.mkdir(parents=True, exist_ok=True)

    # 生成所有页面
    print("生成页面...")
    for page_config in PAGES:
        src_path, out_path = page_config[0], page_config[1]
        print(f"  生成: {out_path}")
        try:
            html = generate_page(page_config, site_config, header, footer, floating)
            with open(DIST_DIR / out_path, 'w', encoding='utf-8') as f:
                f.write(html)
        except Exception as e:
            print(f"错误: 生成 {out_path} 失败: {e}", file=sys.stderr)
            sys.exit(1)

    # 处理404页面（直接复制完整HTML）
    print("  生成: 404.html")
    src_404 = PAGES_DIR / "404.html"
    if src_404.exists():
        shutil.copy2(src_404, DIST_DIR / "404.html")
    else:
        print("警告: 404.html 源文件不存在", file=sys.stderr)

    # 复制静态资源
    print("复制静态资源...")
    copy_assets()

    # 生成SEO文件
    print("生成SEO文件...")
    generate_robots(site_config)
    generate_sitemap(site_config)
    generate_llms(site_config)

    print(f"构建完成! 输出目录: {DIST_DIR}")
    print(f"共生成 {len(PAGES)} 个页面")

    # 仅在明确传入 --design 时生成设计画布文件，避免发布目录出现重复页面。
    generate_design_script = ROOT_DIR / "scripts" / "generate_design.py"
    if "--design" in sys.argv and generate_design_script.exists():
        print("生成 .design 项目文件...")
        try:
            subprocess.run(
                [sys.executable, str(generate_design_script)],
                cwd=str(ROOT_DIR),
                check=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
        except subprocess.CalledProcessError as e:
            print(f"警告: 生成 .design 文件失败: {e.stderr}", file=sys.stderr)

if __name__ == "__main__":
    build()
