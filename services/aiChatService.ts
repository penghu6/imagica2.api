import { Readable } from 'stream';
import { IAiChatParam, IAiChatResult } from '../models/aiChatModel';
import axios from 'axios';
import ProjectDao from '../dao/projectDao';
import { IMessageResult, MessageRole, MessageType, needUpdateFilesType } from '../case/model/message/IMessage';
import { FileManager } from '../utils/FileManager';
const https = require('https');
import fs from 'fs-extra';
import { WebContainerFileSystem } from '../utils/WebContainerFileSystem';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
class AiChatService {
    private aiPrefix: string;
    private projectDao: ProjectDao
    private fileSystem: WebContainerFileSystem

    constructor() {
        this.aiPrefix = process.env.AI_PREFIX || ''; // 获取 AI_PREFIX 环境变量
        this.projectDao = new ProjectDao()
        this.fileSystem = new WebContainerFileSystem()
    }

    async sendMessage(param: IAiChatParam, headers: any): Promise<IAiChatResult | Readable> {
        try {
            // const url = 'http://openai-proxy.brain.loocaa.com/v1/chat/completions'
            const url = this.aiPrefix + "/be/openai/v1/chat/completions";

            const response = await axios.post(url, param, {
                headers: {
                    ...headers,
                    // 'Authorization': 'Bearer DlJYSkMVj1x4zoe8jZnjvxfHG6z5yGxK',
                    'host': 'dashboard.braininc.net',
                },
                responseType: param.stream ? 'stream' : 'json',
                maxRedirects: 0,
                proxy: false, //本地需屏蔽，上传到服务器需要
            });
            return response.data; // 返回流
        } catch (error: any) {
            console.error('错误详情:', {
                message: error.message,
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

    async getPaths(projectId: string): Promise<{ root: string, development: string }> {
      const project = await this.projectDao.findProjectByIdNoReturn(projectId);
      return project?.paths || { root: "", development: "" };
    }

    async getFileMapping(projectId: string): Promise<Array<{ path: string; content: string }>> {
        const paths = await this.getPaths(projectId);
        const developmentPath = paths?.development;
        if (!developmentPath) return [];
        if (!await fs.pathExists(developmentPath)) {
            return [];
        }
        const res = await this.getFileContent(developmentPath)
        return res
    }

    async getFileContent(developmentPath: string): Promise<Array<{ path: string; content: string }>> {
        const fileMapping = await FileManager.generateFileMapping(developmentPath);
        
        // 使用 Promise.all 等待所有文件内容的获取
        const files = await Promise.all(fileMapping.map(async file => {
            try {
                const fileContent = await this.fileSystem.getFileContent(developmentPath, file.relativePath);
                return {
                    path: file.relativePath,
                    content: fileContent
                };
            } catch (error) {
                return undefined; // 处理错误时返回 undefined
            }
        }));

        return files.filter(x => !!x) as Array<{ path: string; content: string }>; // 确保返回类型正确
    }

    handleFileResult(result: string): Array<needUpdateFilesType> | string {
      try {
        const startTag = '<CODE_START>';
        const endTag = '<CODE_END>';
  
        const startIndex = result.indexOf(startTag) + startTag.length;
        const endIndex = result.indexOf(endTag);
        
        if (startIndex < startTag.length || endIndex === -1) {
            throw new Error('Invalid format: Missing <CODE_START> or <CODE_END>');
        }
        
        const jsonString = result.substring(startIndex, endIndex).trim();
        return JSON.parse(jsonString);
      } catch (error) {
        //没能成功提取到代码修改，就返回原本的字符串
        return result
      }
    }

    private async buildRequestParam(projectId: string, userContent: string, model: string, headers: any): Promise<IAiChatParam> {
        const assistantChat = {
            role: "assistant",
            content: "对于用户的修改，请将代码文件的内容放入一个 JSON 数组中，每个元素包含 'path' 、 'content'和'type'，path为文件路径，content为该文件完整的内容, 'type'值为'add'、'update'、'delete',文件为新增使用'add', 文件为修改使用'update', 文件需要删除使用'delete'。文件JSON数组使用<CODE_START>和<CODE_END>作为开始和结束标签。代码内容后面加上当前的修改文本描述"
        };
    
        // 获取代码文件映射
        const codes = await this.getFileMapping(projectId);
        const codeChat = {
            role: "system",
            content: codes.map(file => {
                const ignorFile = [/package\-lock/, /node_modules/, /\.git/, /dockerfile/i, /\.jpg/, /\.jpeg/, /\.png/, /\.gif/, /\.ico/, /\.svg/, /build\//];
                if (file.path && !ignorFile.some(pattern => pattern.test(file.path))) {
                    return `@Codebase\nPath: ${file.path}\nCode:\n${file.content}`;
                }
                return '';
            }).filter(Boolean).join('\n\n')
        };
    
        // 聊天记录
        let historyChat: IAiChatParam["message"] = [];
        if (projectId) {
            let historyMessage = await this.projectDao.getMessagesByProjectId(projectId);
            historyMessage = historyMessage.filter(x => x.type !== "handledContent" && !!x.content);
            historyChat = historyMessage.slice(-5).map(x => ({
                role: x.role,
                content: x.content
            }));
        }
    
        return {
            model,
            temperature: 0.7,
            max_tokens: 4096,
            messages: [
                assistantChat,
                codeChat,
                ...historyChat,
                {
                    role: "user",
                    content: userContent
                }
            ],
            stream: false
        };
    }
    
    private async handleResponseResult(response: any, projectId: string, userContent: string): Promise<IAiChatResult | Readable> {
        const newMessage = response.data?.choices?.[0]?.message;
        const messageId = response.data?.id || uuidv4();
        
        let newHandleChat: IMessageResult = {
            messageId,
            projectId,
            role: newMessage?.role || "assistant",
            content: newMessage?.content || "",
            type: MessageType["handledContent"],
            createdAt: response.data.created * 1000,
        };
    
        if (newMessage) {
            const codeJson = this.handleFileResult(newMessage.content);
            let needUpdateFiles: needUpdateFilesType[] = [];
            let handledContent = newMessage.content;
    
            if (Array.isArray(codeJson) && codeJson.length > 0) {
                const paths = await this.getPaths(projectId);
                if (paths.development) {
                    await this.fileSystem.handleFileOperations(paths.development, messageId, codeJson);
                    needUpdateFiles = codeJson as needUpdateFilesType[];
                    handledContent = handledContent.replace(/<CODE_START>.*<CODE_END>/s, "");
                }
            }
    
            const userChat = {
                messageId,
                projectId,
                role: MessageRole['user'],
                content: userContent,
                type: MessageType['text'],
                createdAt: Number(new Date())
            };
    
            const newOriginChat = {
                messageId,
                projectId,
                role: newMessage.role,
                content: newMessage.content,
                type: MessageType["originContent"],
                createdAt: response.data.created * 1000
            };
    
            newHandleChat = {
                messageId,
                projectId,
                role: newMessage.role,
                content: handledContent,
                type: MessageType["handledContent"],
                createdAt: response.data.created * 1000,
                metadata: {
                    needUpdateFiles
                }
            } as IMessageResult;
            
            this.projectDao.addProjectMessage(projectId, [userChat, newOriginChat, newHandleChat]);
        }
    
        return {
            ...response.data,
            choices: [
                {
                    ...response.data?.choices?.[0] || {},
                    message: {
                        role: newMessage.role,
                        content: newHandleChat.content || "",
                        metadata: newHandleChat.metadata
                    }
                }
            ]
        };
    }
    async sendMessageNew(data: {projectId:string, content: IAiChatParam["message"]["content"]}, headers: any): Promise<IAiChatResult | Readable> {
        try {
            // const url = 'http://openai-proxy.brain.loocaa.com/v1/chat/completions'
            const url = this.aiPrefix + "/be/openai/v1/chat/completions";
            const model = "gpt-4o"
            const param = await this.buildRequestParam(data.projectId, data.content, model, headers);

            const body = JSON.stringify(param);
            const contentLength = Buffer.byteLength(body); // 计算请求体的字节长度
            
            const response = await axios.post(url, body, {
                headers: {
                    ...headers,
                    // 'Authorization': 'Bearer DlJYSkMVj1x4zoe8jZnjvxfHG6z5yGxK',
                    'Host': 'dashboard.braininc.net',
                    'Content-Length': contentLength.toString() // 设置 Content-Length
                },
                maxRedirects: 0,
                proxy: false,
            });
            return this.handleResponseResult(response, data.projectId, data.content)
        } catch (error: any) {
            console.error('错误详情:',  error.response.data.error);
            throw new Error(`发送消息失败: ${error.message}`);
        }
    }

    async deleteAfterCodeAndMsg(projectId: string, messageId: string) {
        try {
            const project = await this.projectDao.findProjectByIdNoReturn(projectId);
            const allMessages = project?.messages || []
            // 查找最后一个 messageId 一致的 index
            const lastIndex = allMessages.map(msg => msg.messageId).lastIndexOf(messageId);
            if (lastIndex === -1) {
                throw new Error('未找到匹配的消息');
            }

            // 获取该 index及之前的所有消息
            const previousMessages = allMessages.slice(0, lastIndex +1);
            // 重置消息
            await this.projectDao.updateMessage(projectId, previousMessages)
            const afterMessages = allMessages.slice(lastIndex + 1);
            // 通过messageId查找代码，如果有则删除
            if(!project?.paths?.development) {
                throw new Error('项目未找到path');
            }

            // messageId去重
            const messageIds = afterMessages.map(x => x.messageId)
            const uniqueMessageIds = Array.from(new Set(messageIds)).filter(x => x) as string[];
            // 删除之后的代码
            return Promise.all(uniqueMessageIds.map(async (msgId: string) => {
                 // 拼接完整路径
                const versionPath = path.join(project.paths.development.replace('development', ''), msgId);
                // 检查当前消息是否有保存代码
                if (!await fs.pathExists(versionPath)) {
                    return;
                }
                // 删除已有developmentPath
                await fs.remove(versionPath);
            }));
            
        } catch (error: any) {
            throw new Error(`重置消息和删除code失败: ${error.message}`);
        }
    }

    async resetCodeAndMsg(projectId: string, messageId: string): Promise<void> {
        try {
            const project = await this.projectDao.findProjectByIdNoReturn(projectId);
            if (!project) {
                throw new Error('项目未找到');
            }
            if(!project.paths?.development) {
                throw new Error('项目未找到path');
            }
            const developmentPath = project.paths.development;
            const versionPath = path.join(developmentPath.replace('development', ''), messageId); // 拼接完整路径
            if (!await fs.pathExists(versionPath)) {
                return;
            }
            // 删除已有developmentPath
            await fs.remove(project.paths.development);
            // 复制模板到项目目录
            await fs.copy(versionPath, developmentPath);
            await this.deleteAfterCodeAndMsg(projectId, messageId)
        } catch (error) {
            console.error('获取完整路径错误:', error);
            throw new Error('重置代码失败');
        }
    }

    private async getRunCommandRequestParam(pdevelopmentPath: string): Promise<IAiChatParam> {
        const assistantChat = {
            role: "assistant" as "assistant",
            content: `根据整个项目的代码，给出运行该项目的命令，使用json字符串的格式返回，key值为runCommand， value为包含命令字符串的数组。比如
            '''
            <COMMAND_START>{"runCommand":["xxx"]}<COMMAND_END>
            '''
            <COMMAND_START>和<COMMAND_END>作为开始和结束标签
            不使用yarn
            如果是html,本地安装http-server，并使用http-server运行
            `
        }
    
        // 获取代码文件映射
        const codes = await this.getFileContent(pdevelopmentPath)
        const userChat = {
            role: "user" as "user",
            content: codes.map(file => {
                const ignorFile = [/package\-lock/, /node_modules/, /\.git/, /dockerfile/i, /\.jpg/, /\.jpeg/, /\.png/, /\.gif/, /\.ico/, /\.svg/, /build\//];
                if (file.path && !ignorFile.some(pattern => pattern.test(file.path))) {
                    return `@Codebase\nPath: ${file.path}\nCode:\n${file.content}`;
                }
                return '';
            }).filter(Boolean).join('\n\n')
        };
    

        return {
            model:"gpt-4-vision-preview",
            temperature: 0.7,
            max_tokens: 4096,
            messages: [
                assistantChat,
                userChat
            ],
            stream: false
        };
    }

    async getRunCommandWithAI(developmentPath: string): Promise<Array<string>> {
        try {
            const url = 'http://openai-proxy.brain.loocaa.com/v1/chat/completions'
            // const url = this.aiPrefix + "/be/openai/v1/chat/completions";
            const param = await this.getRunCommandRequestParam(developmentPath)
            const body = JSON.stringify(param);
            const contentLength = Buffer.byteLength(body); // 计算请求体的字节长度
            const response = await axios.post(url, body, {
                headers: {
                    'Content-Type': 'application/json', // 确保设置正确的内容类型
                    'Authorization': 'Bearer DlJYSkMVj1x4zoe8jZnjvxfHG6z5yGxK',
                    'Host': 'openai-proxy.brain.loocaa.com',
                    'Content-Length': contentLength.toString() // 设置 Content-Length
                },
                maxRedirects: 0,
                proxy: false,
            });
            const message = response?.data?.choices?.[0]?.message || "";
            const runCommandMatch = message?.content?.match(/<COMMAND_START>(.*?)<COMMAND_END>/s);
            if (runCommandMatch && runCommandMatch[1]) {
                const runCommandJson = JSON.parse(runCommandMatch[1]) || {};
                const runCommandArr = runCommandJson.runCommand.map((x: any) => {
                    return x.replace(/-g\s/g, "")
                })
                return runCommandArr;
            }
            return [];
        } catch (error: any) {
            console.error('错误详情:',  error);
            return []
            // throw new Error(`获取初始化命令失败: ${error.message}`);
        }
    }
    
}

export default AiChatService; 