import { IEncryptedProject } from "../models/encryptedProjectModel";
import { FileStructure } from "../models/file";
import { IProject } from "../models/projectModel";
import { StringZlibEncrypt } from "./StringZlibEncrypt";

const stringZlibEntrypt = new StringZlibEncrypt(
  process.env.PROJECT_ENCRYPTION_KEY!
);

export type ProjectPublishEncryptObject = Pick<
  IEncryptedProject,
  "projectEncrypted" | "structuresEncrypted"
>;

export class ProjectPublishEncrypt {
  static encrypt(
    project: IProject,
    structures: FileStructure[]
  ): ProjectPublishEncryptObject {
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

  static decrypt(entryptedObject: ProjectPublishEncryptObject): {
    project: IProject;
    structures: FileStructure[];
  } {
    const project = JSON.parse(
      stringZlibEntrypt.decrypt(entryptedObject.projectEncrypted)
    );
    const structures = JSON.parse(
      stringZlibEntrypt.decrypt(entryptedObject.structuresEncrypted)
    );
    return { project, structures };
  }
}
