import { IUser } from "../../../models/userModel";

export interface IUserResult extends IUser {
  id?: string;
  email: string;
  avatar: string;
}

export interface IUserParam extends IUser {
  name: string;
  email: string;
  password: string;
  avatar: string;
}