import { List } from "lodash";
import { IProject } from "../../../models/projectModel";
import mongoose from 'mongoose';
import { IMessageParam } from "../message/IMessage";

// API 响应结果接口
export interface IProjectResult {
  id: string;
  name: string;
  description?: string;
  type: 'react' | 'vue' | 'html' | 'nextjs';
  owner: {
    id: string;
    name: string;
    email: string;
  };
  versionCount: number;
  fileCount: number;
  chatCount: number;
  lastModified: Date;
  status: 'development' | 'completed';
  currentDevVersion: string;
  tags?: string[];
  path: {
    root: string;           
    development: string;    
  };
}

// API 请求参数接口
export interface IProjectParam {
  name: string;
  description?: string;
  type: 'react' | 'vue' | 'html' | 'nextjs';
  owner: string | mongoose.Types.ObjectId;
  tags?: string[];
  status?: 'development' | 'completed';
  messages?: IMessageParam[];
}

export interface ProjectParam {
    name: string;
    description?: string;
    type: 'react' | 'vue' | 'html' | 'nextjs';
    owner: string | mongoose.Types.ObjectId;
    tags?: string[];
    status?: 'development' | 'completed';
    messages?: IMessageParam[];
  }
