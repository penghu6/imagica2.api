# 使用 Node.js 官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，因为需要 TypeScript）
RUN npm ci

# 复制源代码
COPY . .

# 编译 TypeScript
RUN npm run build

# 创建 imagica2 目录及其子目录，并设置权限
RUN mkdir -p /app/imagica2/storage/temp \
    && mkdir -p /app/imagica2/bucket/temp \
    && chown -R node:node /app/imagica2 \
    && chmod -R 777 /app/imagica2

# 清理开发依赖
RUN npm ci --only=production

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 启动应用（使用编译后的代码）
CMD ["node", "dist/app.js"]