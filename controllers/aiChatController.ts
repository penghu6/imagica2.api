import { Request, Response } from 'express';
import { Controller, Post } from '../decorators/controller';
import AiChatService from '../services/aiChatService';
import { formatResponse } from '../utils/tools';
import { IAiChatParam } from '../models/aiChatModel';
import { BaseController } from './baseController';

@Controller('aichat')
export class AiChatController extends BaseController{
    private aiChatService: AiChatService;

    constructor() {
        super();
        this.aiChatService = new AiChatService();
    }

    @Post('/send')
    async sendMessage(req: Request) {
        try {
            const headers = req.headers; // 获取请求头
            const response = await this.aiChatService.sendMessage(req.body, headers); // 传递参数和请求头
            return formatResponse(0, '消息发送成功', response);
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }
} 