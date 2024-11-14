import mongoose from "mongoose";
import { IMessageResult } from "../message/IMessage";

// API 响应结果接口，保证前端数据一致性，你也可以将类型发布到npm
export interface IProjectResult {
  // ===== 项目基础信息 =====
  id?: string;

  /**
   * 项目名称，项目名称不能超过100个字符
   */
  name: string;
  /**
   * 项目描述，项目描述不能超过500个字符
   */
  description: string;
  createdAt: string;
  updatedAt: string;
  type: "react" | "vue" | "html" | "nextjs";
  tags: string[];
  status: "development" | "completed";

  // ===== 项目代码与对话 =====
  code: string;
  messages?: IMessageResult[];
  token: string;

  // ===== 路径管理 =====
  // paths: {
  //   root: string;
  //   development: string;
  // };

  // ===== 版本管理 =====
  devVersions: Array<{
    version: string;
    description: string;
    createdAt: Date;
    snapshot: {
      path: string;
      size: number;
      etag: string;
      lastModified: Date;
    };
  }>;
  currentDevVersion: string;

  // ===== 文件管理 =====
  // fileMapping: Array<{
  //   id: string;
  //   relativePath: string;
  //   hash: string;
  //   lastModified: Date;
  //   lastSyncTime: Date;
  //   status: "synced" | "modified" | "conflict";
  // }>;

  // ===== UI状态 =====
  uiState: {
    /**
     * 是否显示代码编辑器
     */
    showCodeEditor: boolean;
    /**
     * 是否显示上传弹窗
     */
    showUploadModal: boolean;
    /**
     * 是否显示发布设置弹窗
     */
    showPublishSettings: boolean;
    /**
     * 是否正在发布
     */
    isPublishing: boolean;
    /**
     * 是否正在AI输入
     */
    isAITyping: boolean;
    /**
     * 是否禁用发布
     */
    isPublishDisabled: boolean;
  };
  [key: string]: any;
}

// API 请求参数接口
export interface IProjectParam {
  name: string;
  description?: string;
  type: "react" | "vue" | "html" | "nextjs";
  owner: string | mongoose.Types.ObjectId;
  tags?: string[];
  status?: "development" | "completed";
  messages?: IMessageResult[];
}

export interface ProjectParam {
  name: string;
  description?: string;
  type: "react" | "vue" | "html" | "nextjs";
  owner: string | mongoose.Types.ObjectId;
  tags?: string[];
  status?: "development" | "completed";
  messages?: IMessageResult[];
}
