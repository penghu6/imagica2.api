import { IProjectParam, IProjectResult } from "../case/model/project/IProject";
import ProjectModel, { IProject } from "../models/projectModel";
import { Types } from "mongoose";
import path from "path";
import fs from "fs-extra";
import mongoose from "mongoose";
import { FileManager } from "../utils/FileManager";
import MessageDao from "./messageDao";
import MessageModel from "../models/messageModel";

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
  async createProject(param: IProjectParam): Promise<IProjectResult> {
    const projectId = new mongoose.Types.ObjectId();
    const basePath = process.env.FILE_PATH || "bucket";

    // 生成项目路径
    const paths = {
      root: path.join(
        basePath,
        "users",
        param.owner.toString(),
        "projects",
        projectId.toString()
      ),
      development: path.join(
        basePath,
        "users",
        param.owner.toString(),
        "projects",
        projectId.toString(),
        "development"
      ),
    };

    // 使用 FileManager 初始化项目
    await FileManager.initializeProject(param.type, paths.development);

    // 创建项目记录
    const project = await new ProjectModel({
      _id: projectId,
      ...param,
      paths,
      devVersions: [
        {
          version: "dev-1",
          description: "初始版本",
          createdAt: new Date(),
        },
      ],
      fileMapping: await FileManager.generateFileMapping(paths.development),
      messages: [],
      currentDevVersion: "dev-1",
      isAITyping: false,
    }).save();

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
    await this.messageDao.deleteNonPreservedMessages(
      projectId,
      existingProject.currentDevVersion
    );
    
    //3. 更新项目消息
    if (updateData.messages) {
      existingProject.messages = [];
      for (const msg of updateData.messages) {
        // 获取序列号 (不使用session)
        const sequence = await MessageModel
          .findOne({ projectId })
          .sort({ sequence: -1 })
          .select('sequence')
          .then(doc => (doc?.sequence || 0) + 1);
        
        // 创建 Message 文档并保存
        const message = await new MessageModel({
          projectId,
          devVersion: msg.devVersion || existingProject.currentDevVersion,
          role: msg.role,
          content: msg.content,
          type: msg.type || 'text',
          sequence,
          status: 'pending',
          preserved: false
        }).save();

        // 将消息添加到项目中
        existingProject.messages.push({
          messageId: message._id.toString(),
          projectId: projectId,
          devVersion: message.devVersion,
          role: message.role,
          content: message.content,
          type: message.type,
          sequence: message.sequence,
          status: message.status,
          preserved: message.preserved,
          createdAt: new Date(),
          updatedAt: new Date()
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
    };
  }
}

export default ProjectDao;
