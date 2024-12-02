import { Controller, Post } from '../decorators/controller';
import { BaseController } from './baseController';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { UploadError } from '../utils/errors';
import { formatResponse } from '../utils/tools';
import { createDatePath, ensureDir, getAccessPath } from '../utils/fileHelper';
import UploadService from '../services/uploadService';

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
  private uploadService: UploadService
  constructor() {
    super();
    this.uploadService = new UploadService();
}

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
   *     description: 支持上传.zip，大小限制为50MB
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
   *                   example: "/static/uploads/20240101120000"
   *                   description: 压缩文件解压后的文件夹路径
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
    try {
      const filePath = await new Promise<string>((resolve, reject) => {
        this.uploader.single("file")(req, res, async (err: any) => {
          if (err instanceof multer.MulterError) {
            reject(new UploadError("上传文件失败，请检查文件的大小，控制在 50MB 以内"));
          } else if(!req || !(req as MulterRequest).file) {
            reject(new UploadError("文件不能为空"));
          } else if (err) {
            reject(new UploadError("上传文件失败"));
          } else{
            const file = (req as MulterRequest).file;
            const basePath = process.env.FILE_PATH || './public';
            const accessPath = getAccessPath(file.path, basePath);
            try {
              await this.uploadService.unzipFiles(file.path)
              resolve(accessPath);
            } catch (error: any) {
              res.status(400).send(formatResponse(1, error.message))
            }
            
          }
        });
      });
      const outputDir = path.dirname(filePath)
      res.send(formatResponse(0, "", outputDir));
    } catch (error: any) {
      return formatResponse(1, error.message);
    }
  }
}
