const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require('fs').promises;
const { UploadError } = require("../utils/errors");
const { formatResponse } = require("../utils/tools");
const sourceCodeHandler = require("../utils/sourceCodeHandler");
const router = express.Router();
const AdmZip = require('adm-zip');
const { bucket } = require('../config/storage');

// 添加在路由文件开头
router.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Params:', req.params);
  next();
});

// 配置存储
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const { userId, projectId } = req.params;
    const baseDir = path.join(process.env.STORAGE_PATH || 'storage', 'temp', userId, projectId);
    
    // 确保目录存在
    await fs.mkdir(baseDir, { recursive: true });
    cb(null, baseDir);
  },
  filename: function (req, file, cb) {
    if (req.uploadType === 'zip') {
      // ZIP文件命名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `source-${uniqueSuffix}.zip`);
    } else {
      // 单文件保持原始文件名
      cb(null, file.originalname);
    }
  }
});

// 文件上传配置
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
}).single('file');

/**
 * ZIP包上传
 * @swagger
 * /api/source-upload/zip/{userId}/{projectId}:
 *   post:
 *     tags:
 *       - Upload
 *     summary: 上传项目ZIP包
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectId
 *         in: path
 *         required: true
 *         type: string
 *       - name: version
 *         in: formData
 *         type: string
 *       - name: file
 *         in: formData
 *         type: file
 *         required: true
 */
router.post("/zip/:userId/:projectId", async function (req, res, next) {
  upload.single('file')(req, res, async function (err) {
    try {
      if (err instanceof multer.MulterError) {
        throw new UploadError('上传文件失败，请检查文件大小');
      } else if (err) {
        throw err;
      }

      const { userId, projectId } = req.params;
      const version = req.body.version || '1.0.0';

      // 处理ZIP包
      const sourceInfo = await sourceCodeHandler.processSourceCode(
        req.file.path,
        userId,
        projectId,
        version
      );

      // 删除临时文件
      await fs.unlink(req.file.path);

      res.send(formatResponse(0, "ZIP包上传成功", sourceInfo));
    } catch (error) {
      next(error);
    }
  });
});

/**
 * 单文件上传
 * @swagger
 * /api/upload/file/{userId}/{projectId}:
 *   post:
 *     summary: 上传项目源代码文件
 *     tags: [Upload]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 */
router.post("/file/:userId/:projectId", async function (req, res, next) {
  console.log('处理文件上传请求');
  
  upload(req, res, async function (err) {
    try {
      if (err instanceof multer.MulterError) {
        throw new Error('上传文件失败：' + err.message);
      } else if (err) {
        throw err;
      }

      const { userId, projectId } = req.params;
      const timestamp = Date.now();  // 使用时间戳作为版本标识
      
      // 构建存储路径
      const projectRoot = path.join(bucket.root, userId, projectId);
      const versionPath = path.join(projectRoot, 'source', 'latest');  // 固定使用 latest
      const zipPath = path.join(versionPath, 'source.zip');
      const extractPath = path.join(versionPath, 'code');

      try {
        // 确保目录存在
        await fs.mkdir(versionPath, { recursive: true });
        await fs.mkdir(extractPath, { recursive: true });

        // 清理已存在的文件
        await fs.rm(extractPath, { recursive: true, force: true });
        await fs.mkdir(extractPath);
        
        if (await fs.access(zipPath).then(() => true).catch(() => false)) {
          await fs.unlink(zipPath);
        }

        // 移动上传的zip文件
        await fs.rename(req.file.path, zipPath);
        const stats = await fs.stat(zipPath);

        // 解压文件
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // 获取解压后的文件列表
        const extractedFiles = [];
        const processDirectory = async (dir, baseDir = '') => {
          const items = await fs.readdir(dir, { withFileTypes: true });
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            const relativePath = path.join(baseDir, item.name).replace(/\\/g, '/');
            
            if (item.isDirectory()) {
              await processDirectory(fullPath, relativePath);
            } else {
              const fileStats = await fs.stat(fullPath);
              extractedFiles.push({
                filename: item.name,
                relativePath: relativePath,
                size: fileStats.size,
                lastModified: fileStats.mtime.toISOString()
              });
            }
          }
        };

        await processDirectory(extractPath);

        // 更新 source-info.json
        const sourceInfoPath = path.join(projectRoot, 'source-info.json');
        let sourceInfo = {
          lastUpdated: new Date().toISOString(),
          timestamp: timestamp,
          source: {
            filename: 'source.zip',
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            relativePath: 'source/latest/source.zip',
            storagePath: path.join(userId, projectId, 'source', 'latest').replace(/\\/g, '/'),
            mimeType: req.file.mimetype
          },
          extractedFiles: extractedFiles
        };

        await fs.writeFile(sourceInfoPath, JSON.stringify(sourceInfo, null, 2));

        // 返回简化的响应
        res.send({
          code: 0,
          msg: "源代码已更新",
          data: {
            accessUrl: `http://brain.seolove.cn/projects/${userId}/${projectId}/`,
            lastUpdated: sourceInfo.lastUpdated,
            fileCount: extractedFiles.length
          }
        });

      } catch (error) {
        // 清理文件
        try {
          await fs.rm(extractPath, { recursive: true, force: true });
          if (await fs.access(zipPath).then(() => true).catch(() => false)) {
            await fs.unlink(zipPath);
          }
        } catch (e) {
          // 忽略清理错误
        }
        throw error;
      }

    } catch (error) {
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (e) {
          // 忽略临时文件清理错误
        }
      }
      console.error('上传处理错误:', error);
      next(error);
    }
  });
});

/**
 * 获取源代码快照
 * @swagger
 * /api/source-upload/snapshot/{userId}/{projectId}/{version}:
 *   get:
 *     summary: 获取项目源代码快照
 *     tags: [Upload]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: string
 *       - name: projectId
 *         in: path
 *         required: true
 *         type: string
 *       - name: version
 *         in: path
 *         required: true
 *         type: string
 */
router.get("/snapshot/:userId/:projectId/:version", async function (req, res) {
  try {
    const { userId, projectId, version } = req.params;
    
    // 构建源代码目录路径
    const codePath = path.join(bucket.root, userId, projectId, 'source', version, 'code');
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=source-${version}.zip`);
    
    // 创建快照
    const snapshot = await createSnapshot(codePath);
    
    // 发送快照
    res.send(snapshot);
  } catch (error) {
    console.error('生成快照失败:', error);
    res.status(500).json({
      code: -1,
      msg: '生成快照失败',
      error: error.message
    });
  }
});

/**
 * 创建目录快照
 * @param {string} sourcePath 源代码目录路径
 * @returns {Promise<Buffer>} 快照数据
 */
async function createSnapshot(sourcePath) {
  const { snapshot } = require('@webcontainer/snapshot');
  
  try {
    // 生成快照
    const folderSnapshot = await snapshot(sourcePath);
    return folderSnapshot;
  } catch (error) {
    console.error('创建快照失败:', error);
    throw error;
  }
}

module.exports = router;
