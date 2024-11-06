import express, { Request, Response, NextFunction } from 'express';
import UserService from '../services/userService';
import { formatResponse, analysisToken } from '../utils/tools';
import { ValidationError } from '../utils/errors';

const router = express.Router();

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  }
}

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new UserService().createUser(req.body);
    res.send(formatResponse(0, "注册成功", result));
  } catch (error) {
    next(error);
  }
});