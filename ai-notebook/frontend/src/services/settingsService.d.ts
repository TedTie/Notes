// TypeScript declarations for settingsService.js

export interface ApiProvider {
  name: string;
  apiKey: string;
  isConnected: boolean;
  models: string[];
  selectedModel: string;
}

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  autoSaveInterval: number;
  fontSize: number;
  fontFamily: string;
  apiProviders: {
    openrouter: ApiProvider;
  };
  currentProvider: 'openrouter';
  enableNotifications: boolean;
  enableSounds: boolean;
  dataExport: boolean;
}

export interface SaveResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  message?: string;
  error?: string;
}

export type SettingsListener = (settings: Settings) => void;

export interface SettingsNotifier {
  showNotification(message: string, type?: 'info' | 'success' | 'error' | 'warning'): void;
  showSaveSuccess(): void;
  showSaveError(error: string): void;
  showSettingChanged(key: string, value: any): void;
}

export declare class SettingsService {
  settings: Settings;
  listeners: Set<SettingsListener>;
  isInitialized: boolean;

  constructor();
  
  init(): Promise<void>;
  
  addListener(callback: SettingsListener): () => boolean;
  
  notifyListeners(): void;
  
  loadSettings(): Promise<Settings>;
  
  saveSettings(newSettings?: Settings | null): Promise<SaveResult>;
  
  updateSetting(key: string, value: any): Promise<UpdateResult>;
  
  getSetting(key: string): any;
  
  setSetting(key: string, value: any): void;
  
  applySettings(): void;
  
  getCurrentProvider(): 'openrouter';
  
  getApiKey(provider: 'openrouter'): string;
  
  getSelectedModel(provider: 'openrouter'): string;
}

export declare const settingsNotifier: SettingsNotifier;

declare const settingsService: SettingsService;
export default settingsService;