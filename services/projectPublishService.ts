import ProjectDao from "../dao/projectDao";
import { WebContainerFileSystem } from "../utils/WebContainerFileSystem";
import { ProjectPublishEncrypt, ProjectPublishEncryptObject } from "../utils/ProjectPublishEncrypt";
import ProjectPublishDao from "../dao/projectPublishDao";

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

    const entryptKey = process.env.PROJECT_ENCRYPTION_KEY;

    if (!entryptKey) {
      throw new Error("Plublish faild!");
    }

    const entryptedObject = ProjectPublishEncrypt.encrypt(project, structures);

    const result = await this.projectPublishDao.createProject(
      project,
      entryptedObject
    );

    return result;
  }

  async getPublishProject(projectId: string) {
    const result = await this.projectPublishDao.getProjectById(projectId);

    if (!result) {
      throw new Error("Get Publish Project Failed!");
    }

    // 解密数据
    const value: ProjectPublishEncryptObject = result.toJSON();
    const entryptedObject = ProjectPublishEncrypt.decrypt(value);

    // @ts-expect-error
    delete entryptedObject.project.fileMapping

    return entryptedObject;
  }
}

export default ProjectPublishService;
