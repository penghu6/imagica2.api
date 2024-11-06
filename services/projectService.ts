import projectDao from '../dao/projectDao';
import { IProjectParam, IProjectResult } from '../case/model/project/IProject';
import { List } from 'lodash';
import ProjectDao from '../dao/projectDao';

class ProjectService {
  private projectDao: ProjectDao;

  constructor() {
    this.projectDao = new projectDao();
  }

  /**
   * 创建新项目
   */
  async createProject(param: IProjectParam): Promise<IProjectResult> {
    try {
      const project = await this.projectDao.createProject(param);

      return project;
    } catch (error: any) {
      throw new Error(`创建项目失败: ${error.message}`);
    }
  }

  /**
   * 获取用户的所有项目
   */
  async getUserProjects(userId: string): Promise<List<IProjectResult>> {
    return this.projectDao.findProjectsByUserId(userId);
  }

  /**
   * 更新项目信息
   */
  async updateProject(projectId: string, param: IProjectParam): Promise<IProjectResult | null> {
    return this.projectDao.updateProject(projectId, param);
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<IProjectResult | null> {
    return this.projectDao.deleteProject(projectId);
  }

  /**
   * 根据ID查找项目
   */
  async findProjectById(projectId: string): Promise<IProjectResult | null> {
    return this.projectDao.findProjectById(projectId);
  }
}

export default ProjectService; 