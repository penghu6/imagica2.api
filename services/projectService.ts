import ProjectDao from '../dao/projectDao';
import { IProjectParam, IProjectResult } from '../case/model/project/IProject';

class ProjectService {
  private projectDao: ProjectDao;

  constructor() {
    this.projectDao = new ProjectDao();
  }

  /**
   * 创建新项目
   */
  async createProject(param: IProjectParam): Promise<IProjectResult> {
    try {
      return await this.projectDao.createProject(param);
    } catch (error: any) {
      throw new Error(`创建项目失败: ${error.message}`);
    }
  }

  /**
   * 获取用户的所有项目
   */
  async getUserProjects(userId: string): Promise<IProjectResult[]> {
    try {
      return await this.projectDao.findProjectsByUserId(userId);
    } catch (error: any) {
      throw new Error(`获取用户项目列表失败: ${error.message}`);
    }
  }

  /**
   * 更新项目信息
   */
  async updateProject(projectId: string, param: Partial<IProjectParam>): Promise<IProjectResult | null> {
    try {
      const project = await this.projectDao.updateProject(projectId, param);
      if (!project) {
        throw new Error('项目不存在');
      }
      return project;
    } catch (error: any) {
      throw new Error(`更新项目失败: ${error.message}`);
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const result = await this.projectDao.deleteProject(projectId);
      if (!result) {
        throw new Error('项目不存在');
      }
      return true;
    } catch (error: any) {
      throw new Error(`删除项目失败: ${error.message}`);
    }
  }

  /**
   * 根据ID查找项目
   */
  async findProjectById(projectId: string): Promise<IProjectResult | null> {
    try {
      const project = await this.projectDao.findProjectById(projectId);
      if (!project) {
        throw new Error('项目不存在');
      }
      return project;
    } catch (error: any) {
      throw new Error(`查找项目失败: ${error.message}`);
    }
  }
}

export default ProjectService; 