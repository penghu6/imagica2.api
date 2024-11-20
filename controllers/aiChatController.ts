import { Request, Response } from 'express';
import { Controller, Post } from '../decorators/controller';
import AiChatService from '../services/aiChatService';
import { formatResponse } from '../utils/tools';
import { IAiChatParam } from '../models/aiChatModel';
import { BaseController } from './baseController';
import { Readable } from 'stream';

@Controller('aichat')
export class AiChatController extends BaseController{
    private aiChatService: AiChatService;

    constructor() {
        super();
        this.aiChatService = new AiChatService();
    }

    @Post('/send')
    async sendMessage(req: Request, res: Response) {
        try {
            const headers = req.headers; // 获取请求头
            const response = await this.aiChatService.sendMessage(req.body, headers); // 传递参数和请求头

            // 检查返回类型
            if (response instanceof Readable) {
                // 如果是流，直接将流管道到响应
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                response.pipe(res);
                // 创建一个 Promise 来处理流的结束和错误
                await new Promise((resolve, reject) => {
                    response.on('end', () => {
                        console.log('Stream ended');
                        res.end(); // 结束响应
                        resolve("end"); // 解决 Promise
                    });

                    response.on('error', (err) => {
                        console.error('Stream error:', err);
                        res.status(500).end(); // 处理流错误
                        reject(err); // 拒绝 Promise
                    });
                });
            } else {
                // 否则返回 JSON 响应
                return formatResponse(0, '消息发送成功', response);
            }
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }

    @Post('/sendmessage')
    async sendMessageNew(req: Request, res: Response) {
        try {
            const headers = req.headers; // 获取请求头
            const response = await this.aiChatService.sendMessageNew(req.body.content, headers); // 传递参数和请求头

            // 检查返回类型
            if (response instanceof Readable) {
                // 如果是流，直接将流管道到响应
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                response.pipe(res);
                // 创建一个 Promise 来处理流的结束和错误
                await new Promise((resolve, reject) => {
                    response.on('end', () => {
                        console.log('Stream ended');
                        res.end(); // 结束响应
                        resolve("end"); // 解决 Promise
                    });

                    response.on('error', (err) => {
                        console.error('Stream error:', err);
                        res.status(500).end(); // 处理流错误
                        reject(err); // 拒绝 Promise
                    });
                });
            } else {
                // 否则返回 JSON 响应
                return formatResponse(0, '消息发送成功', response);
            }
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }
} 