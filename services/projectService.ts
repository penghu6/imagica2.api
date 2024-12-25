import ProjectDao from "../dao/projectDao";
import fs from "fs-extra";
import { IProjectParam, IProjectResult } from "../case/model/project/IProject";
import { WebContainerFileSystem } from "../utils/WebContainerFileSystem";
import { FileStructure } from "../models/file";
import { FileManager } from "../utils/FileManager";
import ProjectShareModel from "../models/projectShareModel";
import mongoose, { Types } from "mongoose";
import path from "path";
import AiChatService from "./aiChatService";
import { ProjectPublishEncrypt } from "../utils/ProjectPublishEncrypt";
import ProjectPublishDao from "../dao/projectPublishDao";

class ProjectService {
  public projectDao: ProjectDao;
  private projectPublishDao: ProjectPublishDao;
  private fileSystem: WebContainerFileSystem;
  private aiChatService: AiChatService;

  constructor() {
    this.projectDao = new ProjectDao();
    this.projectPublishDao = new ProjectPublishDao();
    this.fileSystem = new WebContainerFileSystem();
    this.aiChatService = new AiChatService();
  }

  async handleProjectData(param: IProjectParam) {
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

    // 确定 runCommand 的内容
    let runCommand: string[] = [];
    switch (param.type) {
      case "html":
        runCommand = [];
        break;
      case "react":
        runCommand = ["npm install", "npm run start"];
        break;
    }

    if (param.type === "upload") {
      await FileManager.cpProjectCode(param.uploadPath, paths.development);
      runCommand = await this.aiChatService.getRunCommandWithAI(
        paths.development
      );
    } else {
      // 使用 FileManager 初始化项目
      await FileManager.initializeProject(param.type, paths.development);
    }
    return {
      _id: projectId,
      ...param,
      theme: param.theme || 'light',
      paths,
      devVersions: [
        {
          version: "dev-1",
          description: "Initial version",
          createdAt: new Date(),
        },
      ],
      fileMapping: await FileManager.generateFileMapping(paths.development),
      messages: [],
      currentDevVersion: "dev-1",
      isAITyping: false,
      runCommand,
    };
  }
  /**
   * Create a new project
   */
  async createProject(param: IProjectParam): Promise<IProjectResult> {
    try {
      const projectData = await this.handleProjectData(param);
      return await this.projectDao.createProject(projectData);
    } catch (error: any) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Get all projects of a user
   */
  async getUserProjects(userId: string): Promise<IProjectResult[]> {
    try {
      return await this.projectDao.findProjectsByUserId(userId);
    } catch (error: any) {
      throw new Error(`Failed to get user project list: ${error.message}`);
    }
  }

  /**
   * Update project information
   */
  async updateProject(
    projectId: string,
    param: Partial<IProjectParam>
  ): Promise<IProjectResult | null> {
    try {
      //fileMapping and paths
      const oldProject = await this.projectDao.findProjectByIdNoReturn(
        projectId
      );
      const paths = oldProject?.paths || { root: "", development: "" };
      const fileMapping = paths.development
        ? await FileManager.generateFileMapping(paths.development)
        : [];
      Object.assign(param, { paths, fileMapping });
      const project = await this.projectDao.updateProject(projectId, param);
      if (!project) {
        throw new Error("Project not found");
      }
      return project;
    } catch (error: any) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const result = await this.projectDao.deleteProject(projectId);
      if (!result) {
        throw new Error("Project not found");
      }
      return true;
    } catch (error: any) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Find a project by ID
   */
  async findProjectById(projectId: string): Promise<IProjectResult | null> {
    try {
      const project = await this.projectDao.findProjectById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      return project;
    } catch (error: any) {
      throw new Error(`Failed to find project: ${error.message}`);
    }
  }

  /**
   * Get project file structure
   */
  async getProjectStructure(
    userId: string,
    projectId: string
  ): Promise<FileStructure[]> {
    try {
      const project = await this.projectDao.findProjectByIdNoReturn(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      const developmentPath = project.paths.development;
      return await this.fileSystem.getProjectDevelopmentFiles(developmentPath);
    } catch (error: any) {
      throw new Error(`Failed to get project structure: ${error.message}`);
    }
  }

  /**
   * Get file content
   */
  async getFileContent(
    userId: string,
    projectId: string,
    filePath: string
  ): Promise<string> {
    try {
      const project = await this.projectDao.findProjectByIdNoReturn(projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      console.log("developmentPath", project);
      const developmentPath = project.paths.development;
      return await this.fileSystem.getFileContent(developmentPath, filePath);
    } catch (error: any) {
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * Update project files
   */
  async updateProjectFiles(
    projectId: string,
    data: FileStructure[]
  ): Promise<void> {
    try {
      // Find the project to get path information
      const oldProject = await this.projectDao.findProjectByIdNoReturn(
        projectId
      );
      if (!oldProject) {
        throw new Error("Project not found");
      }
      if (
        !oldProject.paths ||
        !oldProject.paths.root ||
        !oldProject.paths.development
      ) {
        throw new Error("path not found");
      }

      const paths = oldProject.paths;
      // Delete existing code
      await fs.remove(paths.root);

      // Update files using the file system
      await this.fileSystem.updateFiles(paths, data);
    } catch (error: any) {
      throw new Error(`Failed to update project files: ${error.message}`);
    }
  }

  /**
   * Create project share
   */
  async createProjectShare(projectId: string) {
    try {
      // Validate projectId is a valid ObjectId
      if (!Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid project ID format");
      }

      const project = await this.findProjectById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      const share = await new ProjectShareModel({
        projectId: new Types.ObjectId(projectId),
        isActive: true,
      }).save();

      return share;
    } catch (error: any) {
      throw new Error(`Failed to create project share: ${error.message}`);
    }
  }

  /**
   * Get shared project list for a user
   */
  async getSharedProjects(projectId: string) {
    const shares = await ProjectShareModel.find({
      projectId,
      isActive: true,
    }).populate("projectId");

    return shares;
  }

  /**
   * Delete project share
   */
  async deleteProjectShare(shareId: string) {
    const share = await ProjectShareModel.findById(shareId);

    if (!share) {
      throw new Error("Share record not found");
    }

    share.isActive = false;
    await share.save();

    return true;
  }

  /**
   * Get shared project information (for visitors)
   */
  async getSharedProject(shareId: string) {
    const share = await ProjectShareModel.findOne({
      _id: shareId,
      isActive: true,
    }).populate("projectId");

    if (!share) {
      throw new Error("Shared project not found or sharing has been cancelled");
    }

    return share.projectId;
  }

  async publishProject(projectId: string) {
    // 1. 获取项目
    const project = await this.projectDao.findProjectByIdNoReturn(projectId);
    if (!project) {
      return null;
    }

    // 2. 获取项目代码
    const developmentPath = project.paths.development;
    const structures = await this.fileSystem.getProjectDevelopmentFiles(
      developmentPath
    );

    const entryptKey = process.env.PROJECT_ENCRYPTION_KEY;

    if (!entryptKey) {
      throw new Error("Plublish faild!");
    }

    const entryptedObject = ProjectPublishEncrypt.encrypt({
      project,
      structures,
    });

    const result = await this.projectPublishDao.createProject(project, entryptedObject);

    return result;
  }
}

export default ProjectService;
