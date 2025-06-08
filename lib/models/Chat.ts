import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  _id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export interface IChat extends Document {
  _id: string;
  title: string;
  userId: string;
  provider: string;
  modelName: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const ChatSchema = new Schema<IChat>({
  title: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  provider: {
    type: String,
    default: 'openai',
  },
  modelName: {
    type: String,
    default: 'gpt-4o',
  },
  messages: [MessageSchema],
}, {
  timestamps: true,
});

ChatSchema.index({ userId: 1 });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema); 