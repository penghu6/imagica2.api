import { IUser } from "../../../models/userModel";

export interface IUserResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  projectCount: number;
  lastActive: Date;
}

export interface IUserParam {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}