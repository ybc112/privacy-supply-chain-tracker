# 🚀 部署指南：GitHub + Vercel

本指南将帮助你将隐私供应链追踪项目部署到 GitHub 并通过 Vercel 发布。

## 📋 部署前准备

### 1. 检查项目文件
确保以下文件已正确配置：
- ✅ `.gitignore` - 已配置，排除敏感文件
- ✅ `vercel.json` - 已优化，包含安全头
- ✅ `.env.example` - 已更新为 Sepolia 配置模板
- ✅ `README.md` - 包含项目说明

### 2. 环境变量准备
你需要准备以下信息：
- **私钥**: 用于部署合约的钱包私钥（⚠️ 绝不要提交到 GitHub）
- **RPC URL**: Sepolia 测试网 RPC 端点
- **合约地址**: 已部署的合约地址（从 `sepolia-deployment.json` 获取）

## 🔧 第一步：上传到 GitHub

### 1. 创建 GitHub 仓库
```bash
# 在 GitHub 网站上创建新仓库
# 仓库名建议：privacy-supply-chain-tracker
# 设为 Public（如果要使用 Vercel 免费版）
```

### 2. 初始化本地 Git 仓库
```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit: Privacy-Preserving Supply Chain Tracker"
```

### 3. 连接远程仓库
```bash
# 替换为你的 GitHub 用户名和仓库名
git remote add origin https://github.com/你的用户名/privacy-supply-chain-tracker.git
git branch -M main
git push -u origin main
```

## 🌐 第二步：部署到 Vercel

### 方法一：通过 Vercel 网站（推荐）

1. **访问 Vercel Dashboard**
   - 打开 [vercel.com](https://vercel.com)
   - 使用 GitHub 账户登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你刚上传的 GitHub 仓库
   - 点击 "Import"

3. **配置项目设置**
   - **Project Name**: `privacy-supply-chain-tracker`
   - **Framework Preset**: `Other`
   - **Root Directory**: 保持默认（`.`）
   - **Build Command**: 留空（静态文件部署）
   - **Output Directory**: `frontend`

4. **配置环境变量**
   在 Vercel 项目设置中添加：
   ```
   # 这些变量不是必需的，因为前端使用硬编码的合约地址
   # 但如果将来需要动态配置，可以添加：
   NEXT_PUBLIC_PRIVATE_SUPPLY_CHAIN_ADDRESS=0x97FAb964a762feE3aF1bDddEF2138c8Ac5cb9238
   NEXT_PUBLIC_PRODUCT_TRACEABILITY_ADDRESS=0x54BcFC4BdfDEb4376fa844dFFd1A784570F82C56
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待部署完成（通常 1-2 分钟）

### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目根目录部署
vercel

# 按提示配置：
# ? Set up and deploy "~/privacy-supply-chain-tracker"? [Y/n] y
# ? Which scope do you want to deploy to? [你的用户名]
# ? Link to existing project? [y/N] n
# ? What's your project's name? privacy-supply-chain-tracker
# ? In which directory is your code located? ./
```

## 🔗 第三步：验证部署

### 1. 检查部署状态
- 在 Vercel Dashboard 查看部署日志
- 确认没有构建错误

### 2. 测试功能
访问你的 Vercel 域名（如 `https://privacy-supply-chain-tracker.vercel.app`），测试：
- ✅ 页面正常加载
- ✅ MetaMask 连接功能
- ✅ 切换到 Sepolia 网络
- ✅ 合约交互功能

### 3. 自定义域名（可选）
在 Vercel 项目设置中可以添加自定义域名。

## 📝 重要注意事项

### 🔒 安全提醒
- **绝不要**将 `.env` 文件提交到 GitHub
- **绝不要**在代码中硬编码私钥
- 使用环境变量管理敏感信息
- 定期轮换 API 密钥

### 🔄 自动部署
- 每次推送到 `main` 分支都会触发自动部署
- 可在 Vercel 设置中配置部署分支

### 🐛 常见问题

**问题 1**: 部署后页面空白
- **解决**: 检查 `vercel.json` 路由配置
- **解决**: 确认 `frontend` 目录结构正确

**问题 2**: 合约连接失败
- **解决**: 检查合约地址是否正确
- **解决**: 确认 MetaMask 连接到 Sepolia 网络

**问题 3**: 构建失败
- **解决**: 检查项目依赖和文件路径
- **解决**: 查看 Vercel 构建日志

## 🎯 后续优化

### 1. 性能优化
- 启用 Vercel Analytics
- 配置 CDN 缓存策略
- 压缩静态资源

### 2. 监控和日志
- 设置 Vercel 函数监控
- 配置错误报告
- 添加用户行为分析

### 3. CI/CD 增强
- 添加 GitHub Actions
- 自动化测试流程
- 代码质量检查

## 📞 获取帮助

如果遇到问题：
1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 检查 GitHub Issues
3. 联系项目维护者

---

🎉 **恭喜！** 你的隐私供应链追踪应用现在已经成功部署到云端了！