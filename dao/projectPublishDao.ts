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

    // 删除旧的
    await EncryptedProjectModel.deleteMany({ projectId: project.id });

    return await encryptedProject.save();
  }

  async getProjectById(projectId: string) {
    const result = await EncryptedProjectModel.findOne({
      projectId: projectId,
    })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .exec();

    return result;
  }
}

export default ProjectPublishDao;
