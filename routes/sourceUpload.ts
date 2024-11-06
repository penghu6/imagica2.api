import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { UploadError } from '../utils/errors';
import { formatResponse } from '../utils/tools';
import sourceCodeHandler from '../utils/sourceCodeHandler';
import AdmZip from 'adm-zip';
import { bucket } from '../config/storage';
import { snapshot } from '@webcontainer/snapshot';

const router = express.Router();

interface UploadRequest extends Request {
  uploadType?: 'zip' | 'file';
  file?: Express.Multer.File;
}

// 中间件日志
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Params:', req.params);
  next();
});

// 配置存储
const storage = multer.diskStorage({
  destination: async function (req: UploadRequest, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const { userId, projectId } = req.params;
    const baseDir = path.join(process.env.STORAGE_PATH || 'storage', 'temp', userId, projectId);
    
    await fs.mkdir(baseDir, { recursive: true });
    cb(null, baseDir);
  },
  filename: function (req: UploadRequest, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    if (req.uploadType === 'zip') {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `source-${uniqueSuffix}.zip`);
    } else {
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
router.post("/zip/:userId/:projectId", async (req: UploadRequest, res: Response, next: NextFunction) => {
  upload(req, res, async function (err: any) {
    try {
      if (err instanceof multer.MulterError) {
        throw new UploadError('上传文件失败，请检查文件大小');
      } else if (err) {
        throw err;
      }

      const { userId, projectId } = req.params;
      const version = req.body.version || '1.0.0';

      if (!req.file) {
        throw new UploadError('未找到上传的文件');
      }

      // 处理ZIP包
      const sourceInfo = await sourceCodeHandler.processSourceCode(
        req.file.path,
        userId,
        projectId,
        version
      );

      res.send(formatResponse(0, "文件上传成功", sourceInfo));

    } catch (error: any) {
      if (req.file?.path) {
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
router.get("/snapshot/:userId/:projectId/:version", async (req: Request, res: Response) => {
  try {
    const { userId, projectId, version } = req.params;
    const codePath = path.join(bucket.root, userId, projectId, 'releases', version, 'code');
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=source-${version}.zip`);
    
    const snapshotData = await createSnapshot(codePath);
    res.send(snapshotData);
  } catch (error: any) {
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
async function createSnapshot(sourcePath: string): Promise<Buffer> {
  try {
    const folderSnapshot = await snapshot(sourcePath);
    return folderSnapshot;
  } catch (error) {
    console.error('创建快照失败:', error);
    throw error;
  }
}

export default router;