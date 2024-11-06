import express, { Request, Response, NextFunction } from 'express';
import { formatResponse, analysisToken } from '../utils/tools';

const router = express.Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.send(formatResponse(0, "访问成功"));
  } catch (error) {
    next(error);
  }
});

export default router;