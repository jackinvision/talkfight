const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 创建输出目录
const outputDir = path.join(__dirname, '..', 'downloads');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 创建zip文件
const output = fs.createWriteStream(path.join(outputDir, 'fight-win-app.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // 最高压缩级别
});

// 监听事件
output.on('close', function() {
  console.log('✅ 打包完成！');
  console.log(`📦 文件大小: ${archive.pointer()} bytes`);
  console.log(`📁 保存位置: ${path.join(outputDir, 'fight-win-app.zip')}`);
});

archive.on('error', function(err) {
  console.error('❌ 打包失败:', err);
  throw err;
});

// 连接输出流
archive.pipe(output);

console.log('🚀 开始打包项目文件...');

// 添加项目文件
const filesToInclude = [
  // 配置文件
  'package.json',
  'next.config.js',
  'tailwind.config.ts',
  'tsconfig.json',
  'postcss.config.js',
  'components.json',
  '.eslintrc.json',
  
  // 源代码
  'app/',
  'lib/',
  'components/',
  'hooks/',
  
  // 说明文件
  'README.md'
];

// 排除的文件和目录
const excludePatterns = [
  'node_modules',
  '.next',
  'out',
  '.git',
  'downloads',
  '.bolt',
  'package-lock.json'
];

// 递归添加文件
function addFilesToArchive(basePath, archivePath = '') {
  const items = fs.readdirSync(basePath);
  
  items.forEach(item => {
    const fullPath = path.join(basePath, item);
    const relativePath = path.join(archivePath, item);
    
    // 检查是否应该排除
    if (excludePatterns.some(pattern => fullPath.includes(pattern))) {
      return;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addFilesToArchive(fullPath, relativePath);
    } else {
      archive.file(fullPath, { name: relativePath });
    }
  });
}

// 添加根目录下的特定文件
filesToInclude.forEach(fileOrDir => {
  const fullPath = path.join(__dirname, '..', fileOrDir);
  
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addFilesToArchive(fullPath, fileOrDir);
    } else {
      archive.file(fullPath, { name: fileOrDir });
    }
  }
});

// 创建README文件
const readmeContent = `# 吵架包赢 - AI智能反驳助手

## 项目简介
这是一个基于AI的智能反驳助手应用，帮助用户生成完美的反驳回复。

## 技术栈
- Next.js 13
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- OpenRouter AI API

## 安装和运行

### 1. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 2. 运行开发服务器
\`\`\`bash
npm run dev
\`\`\`

### 3. 构建生产版本
\`\`\`bash
npm run build
\`\`\`

## 功能特点
- 🤖 AI智能生成反驳回复
- 📱 响应式设计，支持移动端
- ⚡ 打字机效果，提升用户体验
- 🎯 可调节语气强烈程度
- 💾 本地历史记录保存

## 部署
项目支持静态部署，可以部署到 Netlify、Vercel 等平台。

## 注意事项
- 需要配置 OpenRouter API Key
- 仅供娱乐参考，请理性讨论

---
由 Bolt AI 生成 | ${new Date().toLocaleDateString()}
`;

archive.append(readmeContent, { name: 'README.md' });

// 完成打包
archive.finalize();