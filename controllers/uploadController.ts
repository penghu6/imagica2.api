import { Controller, Post } from '../decorators/controller';
import { BaseController } from './baseController';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { UploadError } from '../utils/errors';
import { formatResponse } from '../utils/tools';
import { createDatePath, ensureDir, getAccessPath } from '../utils/fileHelper';

interface MulterRequest extends Request {
  file: Express.Multer.File;
}

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: 文件上传相关接口
 */
@Controller('upload')
export class UploadController extends BaseController {
  private uploader = multer({
    limits: {
      fileSize: 50 * 1024 * 1024
    },
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const basePath = process.env.FILE_PATH || './public';
        const uploadPath = path.join(basePath, 'uploads', createDatePath());
        ensureDir(uploadPath);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    })
  });

  /**
   * @swagger
   * /api/upload:
   *   post:
   *     summary: 上传文件
   *     description: 支持上传单个文件，大小限制为50MB
   *     tags: [Upload]
   *     consumes:
   *       - multipart/form-data
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
   *                 description: 要上传的文件
   *     responses:
   *       200:
   *         description: 上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 0
   *                   description: 状态码，0表示成功
   *                 msg:
   *                   type: string
   *                   example: ""
   *                   description: 提示信息
   *                 data:
   *                   type: string
   *                   example: "/static/uploads/20240101120000/1234567890-file.jpg"
   *                   description: 文件访问路径
   *       400:
   *         description: 上传失败
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 400
   *                 msg:
   *                   type: string
   *                   example: "上传文件失败，请检查文件的大小，控制在 50MB 以内"
   */
  @Post('/')
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    this.uploader.single("file")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        next(new UploadError("上传文件失败，请检查文件的大小，控制在 50MB 以内"));
      } else if (err) {
        next(new UploadError("上传文件失败"));
      } else {
        const file = (req as MulterRequest).file;
        const basePath = process.env.FILE_PATH || './public';
        const accessPath = getAccessPath(file.path, basePath);
        res.send(formatResponse(0, "", accessPath));
      }
    });
  }
}
