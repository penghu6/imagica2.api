const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const { ServiceError, UnknownError } = require("./utils/errors");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// 默认读取项目根目录下的 .env 环境变量文件
require("dotenv").config();
// 进行数据库初始化
require("./db/init");

// 引入路由
const uploadRouter = require("./routes/upload");
const sourceUploadRouter = require("./routes/sourceUpload");

// 新增的路由模块
const userRouter = require("./routes/userController");
const projectRouter = require("./routes/projectController");
const buildRouter = require("./routes/buildController");
const deploymentRouter = require("./routes/deploymentController");

// 创建服务器实例
const app = express();

// 使用 session 中间件
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 使用路由中间件
app.use("/api/upload", uploadRouter);
app.use("/api/source-upload", sourceUploadRouter);

// 新增的路由中间件
app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);
app.use("/api/build", buildRouter);
app.use("/api/deployment", deploymentRouter);

// 配置 Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// 修改错误处理中间件
app.use(function (err, req, res, next) {
  console.error('Error:', err);
  if (err instanceof ServiceError) {
    res.status(err.status || 500).send(err.toResponseJSON());
  } else {
    const unknownError = new UnknownError();
    res.status(500).send(unknownError.toResponseJSON());
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器正在运行在 http://localhost:${PORT}`);
  console.log(`API 文档可在 http://localhost:${PORT}/api-docs 查看`);
});

module.exports = app;
