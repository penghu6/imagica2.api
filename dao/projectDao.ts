import { IProjectParam, IProjectResult } from "../case/model/project/IProject";
import ProjectModel, { IProject } from "../models/projectModel";
import { Types } from "mongoose";
import path from "path";
import fs from "fs-extra";
import mongoose from "mongoose";
import MessageDao from "./messageDao";
import MessageModel from "../models/messageModel";
import { IMessageResult } from "../case/model/message/IMessage";
import AiChatService from "../services/aiChatService";

interface ProjectList {
  total: number;
  items: IProjectResult[];
}

class ProjectDao {
  private messageDao: MessageDao;
  constructor() {
    this.messageDao = new MessageDao();
  }

  /**
   * 创建新项目
   */
  async createProject(projectData: IProjectParam): Promise<IProjectResult> {
    // 创建项目记录
    const project = await new ProjectModel(projectData).save();
    const result = this.convertToProjectResult(project);
    return result;
  }

  private async getOwnerInfo(ownerId: mongoose.Types.ObjectId) {
    // TODO: 后续替换为真实用户数据
    return {
      id: ownerId.toString(),
      name: "Test User",
      email: "test@example.com",
    };
  }

  /**
   * 根据ID查找项目，需要用path等，不直接返回
   */
  async findProjectByIdNoReturn(projectId: string): Promise<(IProject & 
    {_id: Types.ObjectId;}) | null> {
    const project = await ProjectModel.findById(projectId)
      .populate("owner")
      .exec();

    if (!project) return null;

    return project;
  }

  /**
   * 根据ID查找项目
   */
  async findProjectById(projectId: string): Promise<IProjectResult | null> {
    const project = await ProjectModel.findById(projectId)
      .populate("owner")
      .exec();

    if (!project) return null;

    // 转换为 API 响应格式
    const result = this.convertToProjectResult(project);

    return result;
  }

  /**
   * 查找用户的所有项目
   */
  async findProjectsByUserId(
    userId: string | Types.ObjectId
  ): Promise<IProjectResult[]> {
    const projects = await ProjectModel.find({ owner: userId })
      .populate("owner")
      .sort({ updatedAt: -1 })
      .exec();

    // 转换为 API 响应格式
    const results: IProjectResult[] = projects.map((project) =>
      this.convertToProjectResult(project)
    );

    return results;
  }

  /**
   * 更新项目基本信息
   */
  async updateProject(
    projectId: string,
    updateData: Partial<IProjectParam>
  ): Promise<IProjectResult | null> {
    // 1. 验证项目是否存在
    const existingProject = await ProjectModel.findById(projectId);
    if (!existingProject) {
      return null;
    }

    //2.删除当前项目所有消息
    // await this.messageDao.deleteNonPreservedMessages(
    //   projectId,
    //   existingProject.currentDevVersion
    // );
    
    //3. 更新项目消息
    if (updateData.messages) {
      existingProject.messages = [];
      for (const msg of updateData.messages) {
        // 获取序列号 (不使用session)
        // const sequence = await MessageModel
        //   .findOne({ projectId })
        //   .sort({ sequence: -1 })
        //   .select('sequence')
        //   .then(doc => (doc?.sequence || 0) + 1);
        
        // 创建 Message 文档并保存
        // const message = await new MessageModel({
        //   projectId,
        //   devVersion: msg.devVersion || existingProject.currentDevVersion,
        //   role: msg.role,
        //   content: msg.content,
        //   type: msg.type || 'text',
        //   sequence,
        //   status: 'pending',
        //   preserved: false
        // }).save();

        // 将消息添加到项目中
        existingProject.messages.push({
          // messageId: message._id.toString(),
          projectId: projectId,
          devVersion: msg.devVersion  || existingProject.currentDevVersion,
          role: msg.role,
          content: msg.content,
          type: msg.type || "text",
          // sequence: sequence,
          status: 'sent',
          preserved: false,
          createdAt: msg.createdAt,
          // updatedAt: new Date()
        });
      }
    }

    // 4. 更新项目
    const project = await ProjectModel.findByIdAndUpdate(
      projectId,
      { 
        ...updateData,
        messages: existingProject.messages
      },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).populate("owner");

    if (!project) return null;

    // 5. 转换为 API 响应格式
    const result = this.convertToProjectResult(project);
    return result;
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<boolean> {
    // 1. 查找项目信息
    const project = await ProjectModel.findById(projectId);
    if (!project) return false;

    // 2. 删除项目文件
    try {
      await fs.remove(project.paths.root);
    } catch (error) {
      console.error("Failed to delete project files:", error);
      // 继续执行数据库删除
    }

    // 3. 删除数据库记录
    const result = await ProjectModel.findByIdAndDelete(projectId);

    return result !== null;
  }

  private convertToProjectResult(project: IProject): IProjectResult {
    return {
      // ===== 项目基础信息 =====
      id: project._id.toString(),
      name: project.name,
      description: project.description || "",
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      token: (project as any).token,
      type: project.type,
      status: project.status,
      tags: project.tags,

      // ===== 项目代码与对话 =====
      code: (project as any).code,
      messages: project.messages,
      runCommand: project.runCommand,
      // ===== 路径管理 =====
      // paths: project.paths,
      // ===== 文件管理 =====
      // fileMapping: project.fileMapping,

      // ===== 版本管理 =====
      devVersions: project.devVersions,
      currentDevVersion: project.currentDevVersion,

      // ===== UI 管理 =====
      uiState: project.uiState,

      // ===== 发布管理 =====
      publishSettings: project.publishSettings,
      version: project.version,
    };
  }

  /**
   * 添加消息
   */
  async addProjectMessage(
    projectId: string,
    messages: Array<IMessageResult>
  ): Promise<void | null> {
    // 1. 验证项目是否存在
    const existingProject = await ProjectModel.findById(projectId);
    if (!existingProject) {
      throw new Error('没有找到项目')
    }

    const handleMsg: IMessageResult[]  = []
    for (const msg of messages) {
      // 将消息添加到项目中
      handleMsg.push({
        messageId: msg?.messageId || "",
        projectId: projectId,
        devVersion: msg.devVersion  || existingProject.currentDevVersion,
        role: msg.role,
        content: msg.content,
        type: msg.type || "text",
        // sequence: sequence,
        status: 'sent',
        preserved: false,
        createdAt: msg.createdAt,
        metadata: {
          needUpdateFiles: msg?.metadata?.needUpdateFiles || []
        }
      });
    }
    const allMessage = [...existingProject.messages, ...handleMsg]
    this.updateMessage(projectId, allMessage)
  }

  async updateMessage(projectId: string, allMessage:IMessageResult[]) {
    await ProjectModel.findByIdAndUpdate(
      projectId,
      { 
        messages: allMessage
      }
    );
  }

  /**
   * 根据项目ID获取消息列表
   * @param projectId 项目ID
   * @param page 页码（可选）
   * @param pageSize 每页大小（可选）
   * @returns 消息列表
   */
  async getMessagesByProjectId(projectId: string): Promise<IMessageResult[]> {
    try {
      // 获取消息列表，支持分页
      const project = await ProjectModel.findById(projectId)
      if(!project){
        return []
      }
      return project.messages || []
    } catch (error) {
      throw new Error(`获取消息列表失败`);
    }
  }

}

export default ProjectDao;
