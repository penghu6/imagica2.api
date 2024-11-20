import { Readable } from 'stream';
import { IAiChatParam, IAiChatResult } from '../models/aiChatModel';
import axios from 'axios';
const https = require('https');

class AiChatService {
    private aiPrefix: string;

    constructor() {
        this.aiPrefix = process.env.AI_PREFIX || ''; // 获取 AI_PREFIX 环境变量
    }

    async sendMessage(param: IAiChatParam, headers: any): Promise<IAiChatResult | Readable> {
        try {
            const url = 'http://openai-proxy.brain.loocaa.com/v1/chat/completions'
            // const url = this.aiPrefix + "/be/openai/v1/chat/completions";
            // console.log(333, url)
            // const instance = axios.create({
            //   httpsAgent: new https.Agent({  
            //     rejectUnauthorized: false
            //   })
            // });
            const response = await axios.post(url, param, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json', // 确保设置正确的内容类型
                    'Authorization': 'Bearer DlJYSkMVj1x4zoe8jZnjvxfHG6z5yGxK',
                    'Host': 'openai-proxy.brain.loocaa.com'
                },
                responseType: param.stream ? 'stream' : 'json',
                maxRedirects: 0,
                proxy: false,
            });
            return response.data; // 返回流
        } catch (error: any) {
            console.error('错误详情:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                url: error.config?.url,
                method: error.config?.method
            });
            throw new Error(`发送消息失败: ${error.message}`);
        }
    }

    async sendMessageNew(content: IAiChatParam["message"]["content"], headers: any): Promise<IAiChatResult | Readable> {
        try {
            const url = 'http://openai-proxy.brain.loocaa.com/v1/chat/completions'

            const param = {
                model: "gpt-4-vision-preview",
                temperature: 0.7,
                max_tokens: 4096,
                messages: [
                    //todo:历史聊天记录，
                    {
                        role: "user",
                        content: content
                    }
                ],
                stream: false
            };

            const body = JSON.stringify(param);
            const contentLength = Buffer.byteLength(body); // 计算请求体的字节长度

            const response = await axios.post(url, body, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json', // 确保设置正确的内容类型
                    'Authorization': 'Bearer DlJYSkMVj1x4zoe8jZnjvxfHG6z5yGxK',
                    'Host': 'openai-proxy.brain.loocaa.com',
                    'Content-Length': contentLength.toString() // 设置 Content-Length
                },
                maxRedirects: 0,
                proxy: false,
            });
            // todo: 处理聊天内容
            return response.data;
        } catch (error: any) {
            console.error('错误详情:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                url: error.config?.url,
                method: error.config?.method
            });
            throw new Error(`发送消息失败: ${error.message}`);
        }
    }
    
}

export default AiChatService; 