// TypeScript declarations for aiService.js

import { AxiosInstance } from 'axios';

// Chat message interface
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string | Date;
}

// AI model types
export type AIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3' | 'gemini-pro' | string;

// Analysis types
export type AnalysisType = 'summary' | 'sentiment' | 'keywords' | 'topics' | 'entities' | string;

// Content types
export type ContentType = 'notes' | 'todos' | 'audio' | string;

// Improvement types
export type ImprovementType = 'grammar' | 'clarity' | 'tone' | 'structure' | 'expand' | 'summarize' | string;

// Audio analysis types
export type AudioAnalysisType = 'summary' | 'transcript' | 'sentiment' | 'keywords' | 'meeting_notes' | string;

// API response interfaces
export interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

export interface ChatResponse extends AIResponse {
  response?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AnalysisResponse extends AIResponse {
  result?: {
    summary?: string;
    sentiment?: string;
    keywords?: string[];
    topics?: string[];
    entities?: string[];
    [key: string]: any;
  };
  analysis_type?: AnalysisType;
}

export interface TodoGenerationResponse extends AIResponse {
  todos?: Array<{
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    due_date?: string;
  }>;
}

export interface ContentImprovementResponse extends AIResponse {
  improved_content?: string;
  suggestions?: string[];
  improvement_type?: ImprovementType;
}

export interface SmartSearchResponse extends AIResponse {
  results?: Array<{
    id: string | number;
    title: string;
    content: string;
    relevance_score: number;
    type: ContentType;
    [key: string]: any;
  }>;
  query?: string;
  content_type?: ContentType;
}

export interface AudioUploadResponse extends AIResponse {
  id?: string | number;
  file_info?: {
    filename: string;
    size: number;
    duration?: number;
    format?: string;
  };
}

export interface AudioTranscriptionResponse extends AIResponse {
  transcript?: string;
  confidence?: number;
  language?: string;
}

export interface AudioAnalysisResponse extends AIResponse {
  result?: {
    summary?: string;
    transcript?: string;
    sentiment?: string;
    keywords?: string[];
    meeting_notes?: string;
    action_items?: string[];
    [key: string]: any;
  };
  analysis_type?: AudioAnalysisType;
}

export interface AudioInfo {
  id: string | number;
  filename: string;
  size: number;
  duration?: number;
  format?: string;
  upload_date: string | Date;
  status?: 'uploaded' | 'transcribing' | 'analyzing' | 'completed' | 'error';
  transcript?: string;
  analysis?: any;
}

export interface AudioListResponse extends AIResponse {
  audios?: AudioInfo[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface AudioStatsResponse extends AIResponse {
  total_files?: number;
  total_duration?: number;
  total_size?: number;
  transcribed_count?: number;
  analyzed_count?: number;
}

// AIService class declaration
export declare class AIService {
  client: AxiosInstance;
  
  constructor();
  
  /**
   * Test AI connection
   * @returns Promise resolving to connection test response
   */
  testConnection(): Promise<AIResponse>;
  
  /**
   * Chat with AI
   * @param messages - Array of chat messages
   * @param model - AI model to use (default: 'gpt-3.5-turbo')
   * @param useGlobalContext - Whether to use global context
   * @returns Promise resolving to chat response
   */
  chat(messages: ChatMessage[], model?: AIModel, useGlobalContext?: boolean): Promise<ChatResponse>;
  
  /**
   * Send single message to AI
   * @param message - Message to send
   * @param model - AI model to use
   * @returns Promise resolving to message response
   */
  sendMessage(message: string, model?: string): Promise<{
    success: boolean;
    message: string;
    provider?: string;
    model?: string;
    usage?: any;
    error?: string;
  }>;
  
  /**
   * Generate topic name from first message
   * @param firstMessage - First message to generate topic name from
   * @returns Promise resolving to topic name response
   */
  generateTopicName(firstMessage: string): Promise<{
    success: boolean;
    topicName: string;
    error?: string;
  }>;
  
  /**
   * Analyze text content
   * @param text - Text to analyze
   * @param analysisType - Type of analysis to perform
   * @returns Promise resolving to analysis response
   */
  analyzeText(text: string, analysisType: AnalysisType): Promise<AnalysisResponse>;
  
  /**
   * Generate todos from text
   * @param text - Text to generate todos from
   * @returns Promise resolving to todo generation response
   */
  generateTodos(text: string): Promise<TodoGenerationResponse>;
  
  /**
   * Improve content
   * @param content - Content to improve
   * @param improvementType - Type of improvement to apply
   * @returns Promise resolving to content improvement response
   */
  improveContent(content: string, improvementType: ImprovementType): Promise<ContentImprovementResponse>;
  
  /**
   * Perform smart search
   * @param query - Search query
   * @param contentType - Type of content to search (default: 'notes')
   * @returns Promise resolving to search response
   */
  smartSearch(query: string, contentType?: ContentType): Promise<SmartSearchResponse>;
  
  /**
   * Upload audio file
   * @param formData - FormData containing audio file
   * @returns Promise resolving to upload response
   */
  uploadAudio(formData: FormData): Promise<AudioUploadResponse>;
  
  /**
   * Transcribe audio
   * @param audioId - Audio file ID
   * @returns Promise resolving to transcription response
   */
  transcribeAudio(audioId: string | number): Promise<AudioTranscriptionResponse>;
  
  /**
   * Analyze audio content
   * @param audioId - Audio file ID
   * @param analysisType - Type of analysis to perform (default: 'summary')
   * @returns Promise resolving to audio analysis response
   */
  analyzeAudio(audioId: string | number, analysisType?: AudioAnalysisType): Promise<AudioAnalysisResponse>;
  
  /**
   * Get audio file list
   * @returns Promise resolving to audio list response
   */
  getAudioList(): Promise<AudioListResponse>;
  
  /**
   * Get audio file details
   * @param audioId - Audio file ID
   * @returns Promise resolving to audio details
   */
  getAudioDetails(audioId: string | number): Promise<AudioInfo>;
  
  /**
   * Delete audio file
   * @param audioId - Audio file ID
   * @returns Promise resolving to deletion response
   */
  deleteAudio(audioId: string | number): Promise<AIResponse>;
  
  /**
   * Download audio file
   * @param audioId - Audio file ID
   * @returns Promise resolving to blob data
   */
  downloadAudio(audioId: string | number): Promise<Blob>;
  
  /**
   * Get audio statistics
   * @returns Promise resolving to audio statistics
   */
  getAudioStats(): Promise<AudioStatsResponse>;
}

// Default export - AI service instance
declare const aiService: AIService;
export default aiService;