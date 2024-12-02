import { Request, Response } from 'express';
import { Controller, Post, Get } from '../decorators/controller';
import AiChatService from '../services/aiChatService';
import { formatResponse } from '../utils/tools';
import { IAiChatParam } from '../models/aiChatModel';
import { BaseController } from './baseController';
import { Readable } from 'stream';
import ProjectModel from '../models/projectModel';

/**
 * @swagger
 * tags:
 *   name: AiChat
 *   description: AI 聊天相关接口
 */
@Controller('aichat')
export class AiChatController extends BaseController{
    private aiChatService: AiChatService;

    constructor() {
        super();
        this.aiChatService = new AiChatService();
    }

    /**
     * @swagger
     * /aichat/send:
     *   post:
     *     summary: 发送消息
     *     tags: [AiChat]
     *     description: 发送用户消息并获取响应。请求体应包含模型信息和消息内容。
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               model:
     *                 type: string
     *                 description: 使用的模型名称，例如 "gpt-4-vision-preview"
     *               messages:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     role:
     *                       type: string
     *                       description: 消息角色（如 "user", "assistant", "system"）
     *                     content:
     *                       type: string
     *                       description: 消息内容
     *               max_tokens:
     *                 type: integer
     *                 description: 最大令牌数
     *               temperature:
     *                 type: number
     *                 description: 温度设置，控制生成文本的随机性
     *               stream:
     *                 type: boolean
     *                 description: 是否使用流式响应
     *     responses:
     *       200:
     *         description: 返回消息响应
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 response:
     *                   type: string
     *       400:
     *         description: 缺少必要的参数
     *       500:
     *         description: 服务器内部错误
     */
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

    /**
     * @swagger
     * /aichat/sendmessage:
     *   post:
     *     summary: 发送新消息
     *     tags: [AiChat]
     *     description: 发送新消息并获取响应。
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               projectId:
     *                 type: string
     *                 description: 项目的 ID
     *               content:
     *                 type: string
     *                 description: 用户发送的新消息内容
     *     responses:
     *       200:
     *         description: 返回消息响应
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 response:
     *                   type: string
     *       400:
     *         description: 缺少必要的参数
     *       500:
     *         description: 服务器内部错误
     */
    @Post('/sendmessage')
    async sendMessageNew(req: Request, res: Response) {
        try {
            const headers = req.headers; // 获取请求头
            const response = await this.aiChatService.sendMessageNew(req.body, headers); // 传递参数和请求头

            return formatResponse(0, '消息发送成功', response);
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }

    /**
     * @swagger
     * /aichat/resetVersion:
     *   get:
     *     summary: 重置版本
     *     tags: [AiChat]
     *     description: 根据 projectId 和 messageId 重置项目的版本。
     *     parameters:
     *       - in: query
     *         name: projectId
     *         required: true
     *         description: 项目的 ID
     *         schema:
     *           type: string
     *       - in: query
     *         name: messageId
     *         required: true
     *         description: 消息的 ID
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: 返回完整路径
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 fullPath:
     *                   type: string
     *       400:
     *         description: 缺少必要的参数
     *       404:
     *         description: 项目未找到
     *       500:
     *         description: 服务器内部错误
     */
    @Get('/resetVersion')
    async resetVersion(req: Request, res: Response) {
        const { projectId, messageId } = req.query;

        if (!projectId || !messageId) {
            return res.status(400).json({ message: '缺少必要的参数: projectId 或 messageId' });
        }
        try {
            const response = await this.aiChatService.resetCodeAndMsg(projectId as string, messageId as string);
            return formatResponse(0, '回退版本成功', response);
        } catch (error: any) {
            console.error('错误:', error);
            return formatResponse(1, error.message);
        }
    }
} 