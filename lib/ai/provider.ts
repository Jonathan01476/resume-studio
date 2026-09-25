import { Resume } from '../resume/schema';
import { ResumeSource } from '../ingestion/types';
export interface AIInput {
  resume: Resume;
  instruction: string;
  sources: (ResumeSource & { dataUrl?: string })[];
}
export interface AIResult {
  resume: Resume;
  mode: 'mock' | 'provider';
  message: string;
}
export interface ResumeAIProvider {
  updateResume(input: AIInput): Promise<AIResult>;
  createResume(input: AIInput): Promise<AIResult>;
}
