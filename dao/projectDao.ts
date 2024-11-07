import { IProjectParam, IProjectResult } from '../case/model/project/IProject';
import ProjectModel from '../models/projectModel';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs-extra';
import mongoose from 'mongoose';
import { FileManager } from '../utils/FileManager';
import UserModel from '../models/userModel';

interface ProjectList {
  total: number;
  items: IProjectResult[];
}

class ProjectDao {
  /**
   * 创建新项目
   */
  async createProject(param: IProjectParam): Promise<IProjectResult> {
    const projectId = new mongoose.Types.ObjectId();

    // 生成项目路径
    const paths = {
      root: path.join('bucket', 'users', param.owner.toString(), 'projects', projectId.toString()),
      development: path.join('bucket', 'users', param.owner.toString(), 'projects', projectId.toString(), 'development')
    };

    // 使用 FileManager 初始化项目
    await FileManager.initializeProject(param.type, paths.development);

    // 创建项目记录
    const project = await new ProjectModel({
      _id: projectId,
      ...param,
      paths,
      devVersions: [{
        version: 'dev-1',
        description: '初始版本',
        createdAt: new Date()
      }],
      fileMapping: await FileManager.generateFileMapping(paths.development),
      chatHistory: [],
      currentDevVersion: 'dev-1',
      isAITyping: false
    }).save();

    const result = this.convertToProjectResult(project);

    return result;
  }

  private async getOwnerInfo(ownerId: mongoose.Types.ObjectId) {
    // TODO: 后续替换为真实用户数据
    return {
      id: ownerId.toString(),
      name: 'Test User',
      email: 'test@example.com'
    };
  }

  /**
   * 根据ID查找项目
   */
  async findProjectById(projectId: string): Promise<IProjectResult | null> {
    const project = await ProjectModel.findById(projectId)
      .populate('owner')
      .exec();

    if (!project) return null;

    // 转换为 API 响应格式
    const result = this.convertToProjectResult(project);

    return result;
  }

  /**
   * 查找用户的所有项目
   */
  async findProjectsByUserId(userId: string | Types.ObjectId): Promise<IProjectResult[]> {
    const projects = await ProjectModel.find({ owner: userId })
      .populate('owner')
      .sort({ updatedAt: -1 })
      .exec();

    // 转换为 API 响应格式
    const results: IProjectResult[] = projects.map(project => (this.convertToProjectResult(project)));

    return results;
  }

  /**
   * 更新项目基本信息
   */
  async updateProject(projectId: string, updateData: Partial<IProjectParam>): Promise<IProjectResult | null> {
    // 1. 验证项目是否存在
    const existingProject = await ProjectModel.findById(projectId);
    if (!existingProject) {
      return null;
    }

    // 2. 过滤不允许更新的字段
    const allowedUpdates = {
      name: updateData.name,
      description: updateData.description,
      tags: updateData.tags,
      status: updateData.status
    };

    // 3. 更新项目
    const project = await ProjectModel.findByIdAndUpdate(
      projectId,
      { $set: allowedUpdates },
      { 
        new: true,           // 返回更新后的文档
        runValidators: true, // 运行验证器
        context: 'query'     // 在查询上下文中运行
      }
    ).populate('owner');

    if (!project) return null;

    // 4. 转换为 API 响应格式
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
      console.error('Failed to delete project files:', error);
      // 继续执行数据库删除
    }

    // 3. 删除数据库记录
    const result = await ProjectModel.findByIdAndDelete(projectId);
    
    return result !== null;
  }

  private convertToProjectResult(project: any): IProjectResult {
    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      type: project.type,
      owner: {
        id: project.owner._id?.toString() || project.owner.toString(),
        name: 'Test User',  // 暂时使用假数据
        email: 'test@example.com'  // 暂时使用假数据
      },
      versionCount: project.devVersions?.length || 0,
      fileCount: project.fileMapping?.length || 0,
      chatCount: project.chatHistory?.length || 0,
      lastModified: new Date(project._id.getTimestamp()),
      status: project.status,
      currentDevVersion: project.currentDevVersion,
      tags: project.tags
    };
  }
}

export default ProjectDao;
