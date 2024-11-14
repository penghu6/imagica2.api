import { IAiChatParam, IAiChatResult } from '../models/aiChatModel';
import axios from 'axios';

class AiChatService {
    private aiPrefix: string;

    constructor() {
        this.aiPrefix = process.env.AI_PREFIX || ''; // 获取 AI_PREFIX 环境变量
    }

    async sendMessage(param: IAiChatParam, headers: any): Promise<IAiChatResult> {
        try {
            const url = this.aiPrefix + "/be/openai/v1/chat/completions";
            const response = await axios.post(url, param, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json', // 确保设置正确的内容类型
                },
            });

            // 处理响应数据
            return response.data; // 假设返回的数据符合 IAiChatResult 的结构
        } catch (error: any) {
            throw new Error(`发送消息失败: ${error.message}`);
        }
    }

    
}

export default AiChatService; 