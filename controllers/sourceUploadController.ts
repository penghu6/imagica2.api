import { Controller, Post, Get } from '../decorators/controller';
import { BaseController } from './baseController';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { UploadError } from '../utils/errors';
import { formatResponse } from '../utils/tools';
import sourceCodeHandler from '../utils/sourceCodeHandler';
import { bucket } from '../config/storage';
import archiver from 'archiver';

interface UploadRequest extends Request {
  uploadType?: 'zip' | 'file';
  file?: Express.Multer.File;
}

/**
 * @swagger
 * tags:
 *   name: SourceUpload
 *   description: 源代码上传相关接口
 */
@Controller('source-upload')
export class SourceUploadController extends BaseController {
  private storage = multer.diskStorage({
    destination: async (req: UploadRequest, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      const { userId, projectId } = req.params;
      const baseDir = path.join(process.env.STORAGE_PATH || 'storage', 'temp', userId, projectId);
      await fs.mkdir(baseDir, { recursive: true });
      cb(null, baseDir);
    },
    filename: (req: UploadRequest, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      if (req.uploadType === 'zip') {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `source-${uniqueSuffix}.zip`);
      } else {
        cb(null, file.originalname);
      }
    }
  });

  private uploader = multer({
    storage: this.storage,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB
    }
  });

  /**
   * @swagger
   * /api/source-upload/zip/{userId}/{projectId}:
   *   post:
   *     summary: 上传项目ZIP包
   *     tags: [SourceUpload]
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: projectId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               version:
   *                 type: string
   *                 default: '1.0.0'
   *     responses:
   *       200:
   *         description: 上传成功
   */
  @Post('/zip/:userId/:projectId')
  async uploadZip(req: UploadRequest, res: Response, next: NextFunction) {
    this.uploader.single('file')(req, res, async (err: any) => {
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
  }

  /**
   * @swagger
   * /api/source-upload/snapshot/{userId}/{projectId}/{version}:
   *   get:
   *     summary: 获取项目源代码快照
   *     tags: [SourceUpload]
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: projectId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: version
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 快照数据
   */
  @Get('/snapshot/:userId/:projectId/:version')
  async getSnapshot(req: Request, res: Response) {
    try {
      console.log("req.params", req.params);
      const { userId, projectId, version } = req.params;
      const codePath = path.join(bucket.root, userId, projectId, 'releases', version, 'code');
      console.log("codePath", codePath, userId, projectId, version);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=source-${version}.zip`);
      
      // 使用 archiver 创建 zip
      const archive = archiver('zip', {
        zlib: { level: 9 } // 最大压缩级别
      });

      // 管道输出到响应
      archive.pipe(res);

      // 添加目录到压缩包
      archive.directory(codePath, false);

      // 完成压缩
      await archive.finalize();
      
    } catch (error: any) {
      console.error('生成快照失败:', error);
      res.status(500).json(formatResponse(-1, '生成快照失败', { error: error.message }));
    }
  }
}
