import { IUser } from "../../../models/userModel";
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export interface IUserResult  {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

export interface IUserParam  {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}


export class UserParam {
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  avatar?: string;

  constructor(data: Partial<UserParam> = {}) {
      this.username = data.username || '';
      this.email = data.email || '';
      this.password = data.password || '';
      this.avatar = data.avatar;
  }
}

