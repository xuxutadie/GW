# 新起点青少年人工智能官网

贵阳青少年人工智能应用培训与AI赛事指导官方网站。

## 项目结构

```
xqd-ai-static-site/
├─ src/
│  ├─ pages/          # 页面内容
│  ├─ partials/       # 公共模板（页头、页脚等）
│  ├─ data/
│  │  └─ site.json    # 站点配置（联系方式等）
│  └─ assets/
│     ├─ css/         # 样式文件
│     ├─ js/          # JavaScript文件
│     ├─ icons/       # 图标资源
│     └─ images/      # 图片资源
├─ scripts/
│  ├─ build.py        # 构建脚本
│  └─ check_site.py   # 站点检查脚本
├─ dist/              # 构建输出目录（可部署）
├─ PRD.md             # 产品需求文档
└─ README.md
```

## 快速开始

### 构建站点

使用Python 3运行构建脚本：

```bash
python scripts/build.py
```

构建完成后，完整的静态站点将生成在 `dist/` 目录中。

### 本地预览

构建完成后，可以使用任何静态文件服务器预览。例如使用Python内置服务器：

```bash
cd dist
python -m http.server 8000
```

然后在浏览器中访问 `http://localhost:8000`

### 站点检查

运行检查脚本验证站点：

```bash
python scripts/check_site.py
```

## 配置说明

所有可配置信息（联系方式、备案号等）集中在 `src/data/site.json` 中：

- `contact.phones`: 联系电话列表
- `contact.wechatIds`: 微信号列表
- `contact.wechatQrCode`: 微信二维码图片路径
- `contact.address`: 教学地址
- `contact.consultingHours`: 咨询时间
- `contact.douyinUrl`: 抖音主页链接
- `contact.icpNumber`: ICP备案号
- `contact.psbNumber`: 公安备案号
- `contact.mapCoordinates`: 地图坐标

配置项为空时，对应内容不会在页面中显示。

## 页面列表

- `/` - 首页
- `/courses/` - 课程体系
  - `/courses/ai-application.html` - AI应用学习
  - `/courses/programming-foundation.html` - 编程与项目实践
  - `/courses/competition-training.html` - AI赛事训练
- `/cases/` - 真实案例
- `/competitions/` - 赛事指导
  - `/competitions/whitelist-guide.html` - 白名单赛事说明
- `/works/` - 学生作品
- `/honors/` - 荣誉与活动
- `/questions/` - 贵阳AI问答（6个本地问题详情页）
- `/about/` - 关于我们
- `/contact/` - 联系我们
- `/privacy.html` - 隐私说明
- `/404.html` - 404页面
- `/robots.txt` - 搜索引擎配置
- `/sitemap.xml` - 站点地图
- `/llms.txt` - 大模型可读的站点信息

## 部署

`dist/` 目录包含完整的静态文件，可以部署到：

- Nginx
- 对象存储（OSS/COS）
- CDN
- GitHub Pages
- 其他静态托管环境

## 技术说明

- 纯静态HTML/CSS/JavaScript，无后端依赖
- 使用Python标准库构建，无第三方依赖
- 响应式设计，支持桌面和移动端
- 包含完整SEO元数据和JSON-LD结构化数据
- 支持图片懒加载、键盘导航、基础无障碍
