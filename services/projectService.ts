import ProjectDao from '../dao/projectDao';
import { IProjectParam, IProjectResult } from '../case/model/project/IProject';
import { WebContainerFileSystem } from '../utils/WebContainerFileSystem';
import { FileStructure } from '../models/file';

class ProjectService {
  private projectDao: ProjectDao;
  private fileSystem: WebContainerFileSystem;

  constructor() {
    this.projectDao = new ProjectDao();
    this.fileSystem = new WebContainerFileSystem();
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

  /**
   * 获取项目文件结构
   */
  async getProjectStructure(userId: string, projectId: string): Promise<FileStructure[]> {
    try {
      const project = await this.projectDao.findProjectById(projectId, true);
      if (!project) {
        throw new Error('项目不存在');
      }
     
      const developmentPath = project.paths.development;
      return await this.fileSystem.getProjectDevelopmentFiles( developmentPath);
    } catch (error: any) {
      throw new Error(`获取项目结构失败: ${error.message}`);
    }
  }

  /**
   * 获取文件内容
   */
  async getFileContent(userId: string, projectId: string, filePath: string): Promise<string> {
    try {
      const project = await this.projectDao.findProjectById(projectId, true);
      if (!project) {
        throw new Error('项目不存在');
      }
      console.log("developmentPath", project);
      const developmentPath = project.paths.development;
      return await this.fileSystem.getFileContent(developmentPath, filePath);
    } catch (error: any) {
      throw new Error(`获取文件内容失败: ${error.message}`);
    }
  }
}

export default ProjectService; 