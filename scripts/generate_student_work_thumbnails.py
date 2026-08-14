#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为学生作品生成缩略图。

运行前请先执行 scripts/build.py，并保持本地服务 http://localhost:8080 可访问。
脚本会用 Chrome 打开每个作品入口并截图，保存到 src/assets/student-works/public-20260814/thumbs/。
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen


ROOT_DIR = Path(__file__).parent.parent
WORKS_DIR = ROOT_DIR / "src" / "assets" / "student-works" / "public-20260814"
DATA_FILE = WORKS_DIR / "works-data.json"
THUMBS_DIR = WORKS_DIR / "thumbs"
BASE_URL = "http://localhost:8080"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def check_local_server() -> bool:
    try:
        with urlopen(BASE_URL + "/works/", timeout=5) as response:
            return 200 <= response.status < 400
    except Exception:
        return False


def generate_thumbnail(index: int, url: str, output: Path) -> bool:
    target_url = BASE_URL + url
    cmd = [
        str(CHROME),
        "--headless",
        "--disable-gpu",
        "--disable-application-cache",
        "--hide-scrollbars",
        "--window-size=1200,800",
        "--virtual-time-budget=2500",
        f"--screenshot={output}",
        target_url,
    ]
    try:
        output.unlink(missing_ok=True)
        subprocess.run(cmd, cwd=ROOT_DIR, check=False, timeout=35, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(20):
            if output.exists() and output.stat().st_size > 0:
                return True
            time.sleep(0.2)
    except subprocess.TimeoutExpired:
        return False
    except Exception:
        return False
    return False


def main() -> int:
    if not CHROME.exists():
        print(f"未找到 Chrome: {CHROME}")
        return 1
    if not DATA_FILE.exists():
        print(f"缺少数据文件: {DATA_FILE}")
        return 1
    if not check_local_server():
        print(f"本地服务不可访问: {BASE_URL}。请先启动本地服务。")
        return 1

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)

    ok_count = 0
    fail_count = 0
    for item in data:
        index = int(item["index"])
        output = THUMBS_DIR / f"work-{index:03d}.png"
        ok = generate_thumbnail(index, item["url"], output)
        if ok:
            ok_count += 1
            print(f"[通过] {index:03d} {item.get('title', '')}")
        else:
            fail_count += 1
            print(f"[失败] {index:03d} {item.get('title', '')}")

    print(f"缩略图生成完成：成功 {ok_count} 个，失败 {fail_count} 个。")
    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
