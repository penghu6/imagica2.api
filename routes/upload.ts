import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { UploadError } from '../utils/errors';
import { uploading, formatResponse } from '../utils/tools';

const router = express.Router();

interface MulterRequest extends Request {
    file: Express.Multer.File;
}

// 上传文件接口
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    // single 方法里面书写上传控件的 name 值
    uploading.single("file")(req, res, function (err: any) {
        if (err instanceof multer.MulterError) {
            next(new UploadError("上传文件失败，请检查文件的大小，控制在 2MB 以内"));
        } else {
            const path = "/static/uploads/" + (req as MulterRequest).file.filename;
            res.send(formatResponse(0, "", path));
        }
    });
});

export default router; 