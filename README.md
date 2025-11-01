# Sunny Astro

> 🌤️ 基于 Astro + WordPress 的现代化 Headless 博客，采用 SunnyLite 主题风格

一个优雅、快速的静态博客解决方案，结合了 Astro 的极致性能和 WordPress 的强大内容管理能力。采用 SunnyLite 主题的精美设计，支持暗色模式、实时评论、代码高亮等现代化功能。

## ✨ 特性

### 🚀 核心功能
- **静态生成 (SSG)** - 极致的加载速度和 SEO 优化
- **Headless WordPress** - 强大的内容管理，灵活的前端展示
- **PJAX 导航** - 无刷新页面切换，流畅的用户体验
- **响应式设计** - 完美适配桌面和移动设备

### 💬 评论系统
- **完整的评论功能** - 支持多层级嵌套回复
- **实时更新** - 客户端轮询新评论，无需刷新页面
- **LocalStorage 记忆** - 自动保存用户信息
- **优雅的交互** - 平滑的表单移动和动画效果

### 🎨 界面与样式
- **SunnyLite 风格** - 精美的主题设计
- **暗色模式** - 支持日/夜间主题切换，无闪烁切换
- **macOS 风格代码块** - 仿 macOS 窗口的代码展示
- **一键复制代码** - 便捷的代码复制功能

### 📝 内容功能
- **文章列表与详情** - 完整的博客文章展示
- **分类与标签** - 灵活的内容组织方式
- **归档页面** - 时间线式的文章归档
- **友情链接** - 支持友链展示
- **搜索功能** - 站内内容搜索
- **自定义页面** - 支持 WordPress 页面

### 🎯 开发体验
- **TypeScript 支持** - 类型安全的开发体验
- **模块化组件** - 清晰的代码组织结构
- **热更新** - 开发时即时预览
- **自定义配置** - 灵活的 WordPress 设置集成

## 📦 技术栈

- **框架**: [Astro](https://astro.build/) - 现代化静态站点生成器
- **内容管理**: WordPress + REST API
- **语言**: TypeScript
- **代码高亮**: Shiki (VS Code 的语法引擎)
- **样式**: 原生 CSS (SunnyLite 风格)
- **工具库**:
  - jQuery (用于主题交互)
  - Fancybox (图片灯箱)
  - lazysizes (图片懒加载)
  - instant.page (预加载优化)

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 pnpm
- 一个运行中的 WordPress 站点（支持 REST API）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd sunny
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，设置您的 WordPress 站点地址：
   ```env
   PUBLIC_WP_URL=https://your-wordpress-site.com
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

   访问 `http://localhost:4321` 查看您的博客

5. **构建生产版本**
   ```bash
   npm run build
   ```

   构建产物位于 `dist/` 目录

## ⚙️ 配置说明

### 环境变量

在项目根目录创建 `.env` 文件：

```env
# WordPress 站点地址（必填）
PUBLIC_WP_URL=https://your-wordpress-site.com

# 页面排除配置（可选）
# 按 slug 排除页面（逗号分隔）
PUBLIC_PAGES_EXCLUDE_SLUGS=privacy-policy,example-page

# 按标题排除页面（逗号分隔）
PUBLIC_PAGES_EXCLUDE_TITLES=隐私,示例

# 按 slug 包含页面（逗号分隔，留空则包含所有）
PUBLIC_PAGES_INCLUDE_SLUGS=

# 头像镜像地址（可选）
# 例如：cn.cravatar.com（用于加速 Gravatar）
PUBLIC_AVATAR_MIRROR=
```

### WordPress 设置

本项目支持通过 WordPress REST API 的 `/wp-json/wp/v2/settings` 端点进行自定义配置：

#### 1. 自定义头部 HTML (`head_html`)

在 WordPress 后台添加自定义 HTML 到每个页面的 `<head>` 部分，适用于：
- 自定义字体引入
- 第三方统计代码
- SEO meta 标签
- 其他需要在 head 中的代码

示例：
```html
<link rel="stylesheet" href="https://cdnjs.imsun.org/lxgw-wenkai-screen-webfont/style.css" />
<style>
  body {
    font-family: "LXGW WenKai Screen", sans-serif;
  }
</style>
```

#### 2. 自定义页脚文本 (`site_footer_text`)

自定义网站底部的版权信息或其他文本，支持 HTML。

示例：
```html
©️ 2025 版权所有
<p>使用Cloudflare Workers + D1 + R2 + AI + Pages部署的博客</p>
```

**如何设置**：在 WordPress 中通过插件或主题的 `functions.php` 添加这些字段到 settings API。

### 资源配置

CSS 和 JS 资源列表已硬编码在 `src/layouts/BaseLayout.astro` 中，无需通过环境变量配置。

如需修改资源列表，请直接编辑该文件中的 `cssList` 和 `jsList` 数组。

## 📁 项目结构

```
sunny/
├── src/
│   ├── components/          # Astro 组件
│   │   ├── Comments.astro   # 评论系统（含表单和列表）
│   │   ├── Menu.astro       # 导航菜单
│   │   ├── PostList.astro   # 文章列表
│   │   └── Sidebar.astro    # 侧边栏
│   ├── layouts/
│   │   └── BaseLayout.astro # 基础布局模板
│   ├── lib/
│   │   └── wp.ts            # WordPress API 封装
│   └── pages/               # 页面路由
│       ├── index.astro      # 首页
│       ├── [slug].astro     # 文章详情页
│       ├── [pageSlug].astro # 自定义页面
│       ├── archives.astro   # 归档页
│       ├── links.astro      # 友链页
│       ├── search.astro     # 搜索页
│       ├── 404.astro        # 404 页面
│       ├── category/
│       │   └── [slug].astro # 分类页
│       └── tag/
│           └── [slug].astro # 标签页
├── public/
│   └── style/               # 静态资源
│       ├── *.css            # 样式文件
│       ├── *.js             # JavaScript 文件
│       └── lazy.png         # 懒加载占位图
├── .env.example             # 环境变量示例
├── astro.config.mjs         # Astro 配置
├── package.json             # 项目依赖
└── tsconfig.json            # TypeScript 配置
```

## 🛠️ 开发

### 命令说明

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 核心文件说明

#### `src/lib/wp.ts`

WordPress REST API 封装，提供以下功能：
- `fetchPosts()` - 获取文章列表
- `fetchPostBySlug()` - 获取单篇文章
- `fetchCategories()` - 获取分类
- `fetchTags()` - 获取标签
- `fetchPages()` - 获取页面
- `fetchComments()` - 获取评论
- `fetchSettings()` - 获取站点设置
- `fetchUserById()` - 获取用户信息

#### `src/components/Comments.astro`

完整的评论系统组件：
- **评论表单**: 支持回复功能，表单动态移动
- **评论列表**: 树形结构显示嵌套评论
- **实时更新**: 每 30 秒轮询新评论
- **LocalStorage**: 记忆用户信息

#### `src/layouts/BaseLayout.astro`

基础布局模板：
- 响应式 meta 标签
- 暗色模式预加载脚本（避免闪烁）
- CSS/JS 资源管理
- WordPress 自定义 head_html 注入
- PJAX 导航脚本

## 🎨 功能详解

### 暗色模式

- **Cookie 存储**: 使用 `night=1` cookie 记录用户偏好
- **无闪烁切换**: 在 HTML 解析前注入脚本设置暗色类
- **预加载样式**: 首次渲染前设置背景色和文字色
- **平滑过渡**: DOMContentLoaded 后移除过渡禁用样式

### 代码高亮

- **Shiki 引擎**: 使用 VS Code 的语法高亮引擎
- **macOS 窗口样式**: 仿 macOS 的代码块设计
- **一键复制**: 鼠标悬停显示复制按钮
- **行号显示**: 支持代码行号展示

### 评论动态加载

静态生成模式下实现评论实时更新：

1. **构建时**: 将所有评论渲染到 HTML（SEO 友好）
2. **运行时**:
   - 记录构建时间戳
   - 每 30 秒轮询 WordPress API
   - 对比时间戳，发现新评论后刷新页面
3. **可配置**: 通过 `enableDynamicLoading` prop 控制

### PJAX 导航

客户端无刷新页面切换：
- 拦截站内链接点击
- Fetch 获取目标页面 HTML
- 替换 `.main_screen` 容器内容
- 更新浏览器历史记录
- 重新初始化懒加载和代码复制

## 📦 部署

### 静态托管部署

项目构建后生成纯静态 HTML，可部署到任何静态托管服务：

#### Cloudflare Pages

```bash
# 1. 构建项目
npm run build

# 2. 在 Cloudflare Pages 中配置
构建命令: npm run build
构建输出目录: dist
```

#### Vercel

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署
vercel
```

#### Netlify

```bash
# 1. 构建项目
npm run build

# 2. 在 Netlify 中配置
构建命令: npm run build
发布目录: dist
```

#### GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 环境变量设置

在部署平台中设置环境变量：
- `PUBLIC_WP_URL`: 您的 WordPress 站点地址
- 其他可选配置（见上方配置说明）

## ❓ 常见问题

### Q: 评论提交后看不到新评论？

A: 新评论可能需要通过 WordPress 审核。检查 WordPress 后台的评论设置。评论通过审核后，最多 30 秒会自动显示（动态加载功能）。

### Q: 代码块没有高亮？

A: 确保您的 WordPress 文章使用了标准的 Markdown 代码块格式，并指定了语言类型，例如：
````markdown
```javascript
console.log('Hello World');
```
````

### Q: 如何禁用评论动态加载？

A: 在文章页面组件中设置 `enableDynamicLoading={false}`：
```astro
<Comments
  postId={post.id}
  comments={comments}
  enableDynamicLoading={false}
/>
```

### Q: 如何更换字体？

A: 通过 WordPress 设置中的 `head_html` 字段添加字体引入和样式。

### Q: 页面加载很慢？

A:
1. 检查 WordPress API 响应速度
2. 使用 CDN 加速静态资源
3. 配置头像镜像 `PUBLIC_AVATAR_MIRROR`
4. 优化 WordPress 插件和主题

### Q: 如何添加统计代码？

A: 通过 WordPress 设置中的 `head_html` 字段添加统计代码（Google Analytics、百度统计等）。

## 🔧 WordPress 配置建议

### 必要设置

1. **启用 REST API**: 确保 WordPress REST API 可访问
2. **固定链接**: 建议使用 `/%postname%/` 格式
3. **评论设置**: 根据需求配置评论审核规则

### 推荐插件

- **WP REST API Controller**: 控制 REST API 访问权限
- **Better REST API Featured Images**: 增强特色图片 API
- **Disable Gutenberg**: 如果不使用区块编辑器

### 跨域设置

如果 WordPress 和前端部署在不同域名，需要在 WordPress 中添加 CORS 头：

```php
// functions.php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

<p align="center">Made with ❤️ using Astro & WordPress</p>
