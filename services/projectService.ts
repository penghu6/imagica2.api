import ProjectDao from '../dao/projectDao';
import fs from 'fs-extra';
import { IProjectParam, IProjectResult } from '../case/model/project/IProject';
import { WebContainerFileSystem } from '../utils/WebContainerFileSystem';
import { FileStructure } from '../models/file';
import { FileManager } from '../utils/FileManager';
import ProjectShareModel from '../models/projectShareModel';

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
      throw new Error(`获取用户项目表失败: ${error.message}`);
    }
  }

  /**
   * 更新项目信息
   */
  async updateProject(projectId: string, param: Partial<IProjectParam>): Promise<IProjectResult | null> {
    try {
      //fileMapping和paths
      const oldProject = await this.projectDao.findProjectByIdNoReturn(projectId)
      const paths= oldProject?.paths || {root:"", development:""}
      const fileMapping = paths.development ? await FileManager.generateFileMapping(paths.development) : []
      Object.assign(param, {paths, fileMapping})
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
      const project = await this.projectDao.findProjectByIdNoReturn(projectId);
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
      const project = await this.projectDao.findProjectByIdNoReturn(projectId);
      if (!project) {
        throw new Error('项目不存在');
      }
      console.log("developmentPath", project);
      const developmentPath = project.paths.development;
      return await this.fileSystem.getFileContent(developmentPath, filePath);
    } catch (error: any) {
      throw new Error(`获取文件容失败: ${error.message}`);
    }
  }

  /**
   * 更新项目文件
   */
  async updateProjectFiles(projectId: string, data: FileStructure[]): Promise<void> {
    try {
      // 查找项目以获取路径信息
      const oldProject = await this.projectDao.findProjectByIdNoReturn(projectId);
      if (!oldProject) {
        throw new Error('项目不存在');
      }
      if(!oldProject.paths || !oldProject.paths.root || !oldProject.paths.development) {
        throw new Error('path不存在');
      }

      const paths = oldProject.paths
      //删除已有代码
      await fs.remove(paths.root);

      // 调用文件系统更新文件
      await this.fileSystem.updateFiles(paths, data);
    } catch (error: any) {
      throw new Error(`更新项目文件失败: ${error.message}`);
    }
  }

  /**
   * 创建项目分享
   */
  async createProjectShare(projectId: string) {
    const project = await this.findProjectById(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const share = await new ProjectShareModel({
      projectId: project.id,
      isActive: true
    }).save();

    return share;
  }

  /**
   * 获取用户分享的项目列表
   */
  async getSharedProjects(projectId: string) {
    // 查找项目的所有有效分享记录
    const shares = await ProjectShareModel.find({
      projectId,
      isActive: true
    }).populate('projectId');

    return shares;
  }

  /**
   * 删除项目分享
   */
  async deleteProjectShare(shareId: string) {
    const share = await ProjectShareModel.findById(shareId);

    if (!share) {
      throw new Error('分享记录不存在');
    }

    share.isActive = false;
    await share.save();

    return true;
  }

  /**
   * 获取分享的项目信息（供访问者查看）
   */
  async getSharedProject(shareId: string) {
    const share = await ProjectShareModel.findOne({
      _id: shareId,
      isActive: true
    }).populate('projectId');

    if (!share) {
      throw new Error('分享的项目不存在或已被取消分享');
    }

    return await this.findProjectById(share.projectId.toString());
  }
}

export default ProjectService;