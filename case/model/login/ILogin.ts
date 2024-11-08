import { IsString, IsNotEmpty } from 'class-validator';

export class LoginParam  {
    @IsString({ message: '用户名必须是字符串' })
    @IsNotEmpty({ message: '用户名不能为空' })
    username: string;

    @IsString({ message: '密码必须是字符串' })
    @IsNotEmpty({ message: '密码不能为空' })
    password: string;

    constructor() {
        this.username =  '';
        this.password = '';
    }
}

export interface ILoginResult {
    token: string;
    isSuccess: boolean;
}