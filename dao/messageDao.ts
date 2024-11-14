import { Types } from 'mongoose';
import MessageModel from '../models/messageModel';
import { IMessageParam, IMessageResult } from '../case/model/message/IMessage';
import mongoose from 'mongoose';

interface MessageList {
  total: number;
  items: IMessageResult[];
}

class MessageDao {
  /**
   * 创建新消息
   * @param param 消息创建参数
   * @returns 创建的消息结果
   */
  async createMessage(projectId: string, param: IMessageParam): Promise<IMessageResult> {
    const session = await MessageModel.startSession();
    
    try {
      let result: IMessageResult;
      
      await session.withTransaction(async () => {
        const latestSequence = await this.getLatestSequence(projectId, session);
        
        const newMessage = new MessageModel({
          ...param,
          projectId,
          sequence: latestSequence,
          status: 'pending'
        });

        const savedMessage = await newMessage.save({ session });
        result = this.convertToMessageResult(savedMessage);
      });

      return result!;
    } finally {
      await session.endSession();
    }
  }

  /**
   * 批量创建消息
   * @param params 消息创建参数数组
   */
  async batchCreateMessages(projectId: string, params: IMessageParam[]): Promise<IMessageResult[]> {
    const session = await MessageModel.startSession();
    
    try {
      let messages: IMessageResult[] = [];
      
      await session.withTransaction(async () => {
        for (const param of params) {
          const latestSequence = await this.getLatestSequence(projectId, session);
          const newMessage = new MessageModel({
            ...param,
            projectId,
            sequence: latestSequence,
            status: 'pending'
          });
          const savedMessage = await newMessage.save({ session });
          messages.push(this.convertToMessageResult(savedMessage));
        }
      });

      return messages;
    } finally {
      await session.endSession();
    }
  }

  /**
   * 分页查询项目消息
   * @param projectId 项目ID
   * @param page 页码
   * @param pageSize 每页大小
   * @param devVersion 可选的开发版本号
   */
  async findMessagesByProjectPaginated(
    projectId: string | Types.ObjectId,
    page: number = 1,
    pageSize: number = 20,
    devVersion?: string
  ): Promise<MessageList> {
    const query: any = { projectId };
    if (devVersion) {
      query.devVersion = devVersion;
    }

    const total = await MessageModel.countDocuments(query);
    const messages = await MessageModel.find(query)
      .sort({ sequence: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return {
      total,
      items: messages.map(msg => this.convertToMessageResult(msg))
    };
  }

  /**
   * 更新消息状态
   * @param messageId 消息ID
   * @param status 新状态
   */
  async updateMessageStatus(
    messageId: string,
    status: 'pending' | 'sent' | 'error'
  ): Promise<IMessageResult | null> {
    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      { status },
      { new: true }
    );
    
    if (!message) return null;
    return this.convertToMessageResult(message);
  }

  /**
   * 批量删除指定版本的非保留消息
   * @param projectId 项目ID
   * @param devVersion 开发版本号
   */
  async deleteNonPreservedMessages(
    projectId: string | Types.ObjectId,
    devVersion: string
  ): Promise<boolean> {
    const result = await MessageModel.deleteMany({
      projectId,
      devVersion,
      preserved: false
    });

    return result.deletedCount > 0;
  }

  /**
   * 删除消息
   * @param messageId 消息ID
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await MessageModel.findByIdAndDelete(messageId);
    return result !== null;
  }

  /**
   * 获取项目的最新消息序号
   */
  private async getLatestSequence(
    projectId: string | Types.ObjectId, 
    session: mongoose.ClientSession
  ): Promise<number> {
    const latestMessage = await MessageModel
      .findOne({ projectId })
      .sort({ sequence: -1 })
      .select('sequence')
      .session(session)
      .exec();
    
    return (latestMessage?.sequence || 0) + 1;
  }

  /**
   * 将数据库消息对象转换为API响应格式
   */
  private convertToMessageResult(message: any): IMessageResult {
    return {
      messageId: message._id.toString(),
      projectId: message.projectId.toString(),
      devVersion: message.devVersion,
      role: message.role,
      content: message.content,
      type: message.type,
      sequence: message.sequence,
      status: message.status || 'pending',
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      codeSnippet: message.codeSnippet,
      relatedFiles: message.relatedFiles,
      metadata: message.metadata,
      parentId: message.parentId?.toString(),
      preserved: message.preserved
    };
  }

  /**
   * 获取下一个消息序列号
   */
  async getNextSequence(
    projectId: string | Types.ObjectId,
    session: mongoose.ClientSession
  ): Promise<number> {
    const latestMessage = await MessageModel
      .findOne({ projectId })
      .sort({ sequence: -1 })
      .select('sequence')
      .session(session)
      .exec();
    
    return (latestMessage?.sequence || 0) + 1;
  }
}

export default MessageDao; 