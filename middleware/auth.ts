import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }

        // 请确保设置了 JWT_SECRET 环境变量
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 将解码后的用户信息添加到请求对象中
        (req as any).user = decoded;
        
        next();
    } catch (error) {
        return res.status(401).json({ message: '无效的认证令牌' });
    }
}; 