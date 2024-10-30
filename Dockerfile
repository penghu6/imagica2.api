# 使用 Node.js 官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录为根目录
WORKDIR /

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p /bucket /bucket/temp /storage /storage/temp

# 设置目录权限
RUN chown -R node:node /bucket /storage

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
