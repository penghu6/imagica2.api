import { IProject } from "../models/projectModel";
import EncryptedProjectModel, {
  IEncryptedProject,
} from "../models/encryptedProjectModel";
import { ProjectPublishEncryptOutput } from "../utils/ProjectPublishEncrypt";

class ProjectPublishDao {
  constructor() {}

  /**
   * 创建新项目
   */
  async createProject(
    project: IProject,
    projectData: ProjectPublishEncryptOutput
  ): Promise<IEncryptedProject> {
    // 保存加密结果到数据库
    const encryptedProject = new EncryptedProjectModel({
      projectId: project.id,
      projectEncrypted: projectData.projectEncrypted,
      structuresEncrypted: projectData.structuresEncrypted,
    });

    return await encryptedProject.save();
  }


  async getProjectById(projectId: string) {
    const result = await EncryptedProjectModel.findOne({
      projectId: projectId,
    });

    return result;
  }
}

export default ProjectPublishDao;
