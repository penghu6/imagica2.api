import { IAiChatParam, IAiChatResult } from '../models/aiChatModel';
import axios from 'axios';
const https = require('https');

class AiChatService {
    private aiPrefix: string;

    constructor() {
        this.aiPrefix = process.env.AI_PREFIX || ''; // 获取 AI_PREFIX 环境变量
    }

    async sendMessage(param: IAiChatParam, headers: any): Promise<IAiChatResult> {
        try {
            const url = this.aiPrefix + "/be/openai/v1/chat/completions";
            // console.log(333, url)
            const instance = axios.create({
              httpsAgent: new https.Agent({  
                rejectUnauthorized: false
              })
            });
            const response = await instance.post(url, param, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json', // 确保设置正确的内容类型
                },
            });

            // 处理响应数据
            return response.data; // 假设返回的数据符合 IAiChatResult 的结构
        } catch (error: any) {
          // console.log(444, error)
            throw new Error(`发送消息失败: ${error.message}`);
        }
    }

    
}

export default AiChatService; 