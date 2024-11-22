import mongoose, { Document } from 'mongoose';
import { needUpdateFilesType } from '../case/model/message/IMessage';

export interface IAiChatParam {
  model: string;
  max_tokens?: number;
  messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<{
        type: string;
        text?: string;
        image_url?: {
          url: string;
        }
      }>;
  }>;
  stream?: boolean;
  temperature?: number;
  // 允许其他参数
  [key:string]: any;
}

export interface IAiChatResult {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index?: number;
    message: {
      role: string;
      content: string;
      metadata?: {
        needUpdateFiles?: Array<needUpdateFilesType>;
      }
    }
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    prompt_tokens_details?: {
      cached_tokens?: number
      audio_tokens?: number;
    },
    completion_tokens_details?: {
      reasoning_tokens?: number;
      audio_tokens?: number;
      accepted_prediction_tokens?: number;
      rejected_prediction_tokens?: number;
    }
  },
}

const AiChatSchema = new mongoose.Schema({
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    // 其他字段...
});

const AiChatModel = mongoose.model<IAiChatParam & Document>('AiChat', AiChatSchema);

export default AiChatModel; 