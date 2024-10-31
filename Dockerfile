# 使用 Node.js 官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建 imagica2 目录及其子目录
RUN mkdir -p /app/imagica2/storage/temp \
    && mkdir -p /app/imagica2/bucket/temp \
    && chown -R node:node /app/imagica2 \
    && chmod -R 755 /app/imagica2

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]