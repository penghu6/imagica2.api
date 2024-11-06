import { IProjectParam, IProjectResult } from '../case/model/project/IProject';
import type { Document, Types } from 'mongoose';
import ProjectModel from '../models/projectModel';


class ProjectDao {
  /**
   * 创建新项目
   */
  async createProject(param: IProjectParam): Promise<IProjectResult> {
    const project = new ProjectModel(param);
    return project.save();
  }

  /**
   * 根据ID查找项目
   */
  async findProjectById(projectId: string): Promise<IProjectResult | null> {
    return ProjectModel.findById(projectId)
      .populate('owner')
      .populate('collaborators.user')
      .exec();
  }

  /**
   * 查找用户的所有项目
   */
  async findProjectsByUserId(userId: string | Types.ObjectId): Promise<IProjectResult[]> {
    return ProjectModel.find({ owner: userId })
      .populate('owner')
      .populate('collaborators.user')
      .exec();
  }

  /**
   * 更新项目信息
   */
  async updateProject(projectId: string, updateData: Partial<IProjectParam>): Promise<IProjectResult | null> {
    return ProjectModel.findByIdAndUpdate(
      projectId, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('owner collaborators.user');
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<IProjectResult | null> {
    return ProjectModel.findByIdAndDelete(projectId);
  }
}

export default ProjectDao;
