/**
 * 该文件负责初始化数据
 */

// 首先连接数据库
require("./connect");

// 引入数据模型
const adminModel = require("../models/adminModel");
const buildModel = require("../models/buildModel");
const projectModel = require("../models/projectModel");

// 密码要进行 md5 加密
const md5 = require("md5");
const mongoose = require('mongoose');

// 接下来开始做数据初始化操作
(async function () {
  // admin 管理员表初始化
  const adminCount = await adminModel.countDocuments();
  if (!adminCount) {
    // 进入此 if，说明该表没有数据，我们进行一个初始化
    await adminModel.create({
      loginId: "admin",
      nickname: "超级管理员",
      loginPwd: md5("123456"),
      avatar: "/static/imgs/yinshi.jpg",
      permission: 1,
      enabled: true,
    });
    console.log("初始化管理员数据完毕...");
  }

  // project 项目表初始化
  const projectCount = await projectModel.countDocuments();
  if (!projectCount) {
    const testUserId = new mongoose.Types.ObjectId();
    await projectModel.create({
      name: "示例项目-React应用",
      description: "这是一个用于演示的React项目",
      owner: testUserId,
      type: "react",
      collaborators: [
        {
          user: new mongoose.Types.ObjectId(),
          role: "developer"
        }
      ],
      sourceCode: {
        bucket: "project-sources",
        key: "demo-project/source.zip",
        version: "1.0.0",
        size: 1024576,
        mimeType: "application/zip",
        etag: "demo123",
        lastUpdated: new Date()
      },
      buildConfig: {
        framework: "react",
        nodeVersion: "16.x",
        buildCommand: "npm run build",
        outputDir: "build",
        environmentVariables: new Map([
          ["NODE_ENV", "production"],
          ["API_URL", "https://api.example.com"]
        ])
      },
      deploymentConfig: {
        domain: "demo-project.example.com",
        customDomain: "demo.example.com",
        sslEnabled: true,
        containerConfig: {
          memory: "1024m",
          cpu: "1.0",
          port: 3000
        }
      },
      status: "active",
      stats: {
        builds: 0,
        deployments: 0,
        lastBuildAt: new Date(),
        lastDeployAt: new Date()
      },
      settings: {
        autoDeploy: true,
        buildNotification: true,
        maintenance: false
      }
    });
    console.log("初始化项目数据完毕...");
  }

  // builds 构建记录表初始化
  const buildCount = await buildModel.countDocuments();
  if (!buildCount) {
    // 创建一条测试记录
    await buildModel.create({
      project: "507f1f77bcf86cd799439011", // 注意：这需要是一个有效的项目ID
      version: "1.0.0",
      status: "pending",
      logs: [{
        level: "info",
        message: "系统初始化测试记录"
      }],
      buildInfo: {
        startTime: new Date(),
        buildCommand: "npm build"
      }
    });
    console.log("初始化构建记录完毕...");
  }
})();
