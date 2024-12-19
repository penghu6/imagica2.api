import { IEncryptedProject } from "../models/encryptedProjectModel";
import { FileStructure } from "../models/file";
import { IProject } from "../models/projectModel";
import { ProjectStructureMap } from "./ProjectCompiler";
import { StringZlibEncrypt } from "./StringZlibEncrypt";

const stringZlibEntrypt = new StringZlibEncrypt(
  process.env.PROJECT_ENCRYPTION_KEY!
);

export type ProjectPublishEncryptOutput = Pick<
  IEncryptedProject,
  "projectEncrypted" | "structuresEncrypted"
>;

export type ProjectPublishEncryptInput = {
  project: IProject;
  structures: FileStructure[] | ProjectStructureMap;
};

export class ProjectPublishEncrypt {
  static encrypt(
    result: ProjectPublishEncryptInput
  ): ProjectPublishEncryptOutput {
    const { project, structures } = result;
    const encrypted = stringZlibEntrypt.encrypt(
      JSON.stringify(project.toJSON())
    );
    const structuresEncrypted = stringZlibEntrypt.encrypt(
      JSON.stringify(structures)
    );

    return {
      projectEncrypted: encrypted,
      structuresEncrypted,
    };
  }

  static decrypt(
    entryptedObject: ProjectPublishEncryptOutput
  ): ProjectPublishEncryptInput {
    const project = JSON.parse(
      stringZlibEntrypt.decrypt(entryptedObject.projectEncrypted)
    );
    const structures = JSON.parse(
      stringZlibEntrypt.decrypt(entryptedObject.structuresEncrypted)
    );
    return { project, structures };
  }
}
