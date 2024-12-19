import ProjectDao from "../dao/projectDao";
import { WebContainerFileSystem } from "../utils/WebContainerFileSystem";
import {
  ProjectPublishEncrypt,
  ProjectPublishEncryptInput,
  ProjectPublishEncryptOutput,
} from "../utils/ProjectPublishEncrypt";
import ProjectPublishDao from "../dao/projectPublishDao";
import { ProjectStructureMap } from "../utils/ProjectCompiler";
import { IProject } from "../models/projectModel";
import { FileStructure } from "../models/file";
import { IEncryptedProject } from "../models/encryptedProjectModel";

export type PublishResult = {
  project: IProject;
  // FileStructure[] 为了兼容之前的加密保存
  files: ProjectStructureMap | FileStructure[];
};

class ProjectPublishService {
  private projectDao: ProjectDao;
  private projectPublishDao: ProjectPublishDao;
  private fileSystem: WebContainerFileSystem;

  constructor() {
    this.projectDao = new ProjectDao();
    this.projectPublishDao = new ProjectPublishDao();
    this.fileSystem = new WebContainerFileSystem();
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

    return this.savePublishInput({ project, structures });
  }

  async savePublishInput(
    input: ProjectPublishEncryptInput
  ): Promise<IEncryptedProject> {
    const entryptKey = process.env.PROJECT_ENCRYPTION_KEY;

    if (!entryptKey) {
      throw new Error("Plublish faild!");
    }

    const entryptedObject = ProjectPublishEncrypt.encrypt(input);

    const result = await this.projectPublishDao.createProject(
      input.project,
      entryptedObject
    );

    return result;
  }

  async getPublishProject(
    projectId: string
  ): Promise<ProjectPublishEncryptInput> {
    const result = await this.projectPublishDao.getProjectById(projectId);
    if (!result) {
      throw new Error("Get Publish Project Failed!");
    }

    // 解密数据
    const value: ProjectPublishEncryptOutput = result.toJSON();
    const entryptedObject = ProjectPublishEncrypt.decrypt(value);

    // @ts-expect-error
    delete entryptedObject.project.fileMapping;

    return entryptedObject;
  }

  async savePublishResult(result: PublishResult): Promise<IEncryptedProject> {
    return this.savePublishInput({
      project: result.project,
      structures: result.files,
    });
  }

  async getPublishResult(project: IProject): Promise<PublishResult> {
    const encryptInput = await this.getPublishProject(project.id);

    return { project, files: encryptInput.structures };
  }
}

export default ProjectPublishService;
