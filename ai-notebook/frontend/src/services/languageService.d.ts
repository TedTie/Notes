// TypeScript declarations for languageService.js

// Language option interface
export interface LanguageOption {
  value: string;
  label: string;
}

// Translation dictionary type
export type TranslationDictionary = Record<string, string>;

// Translations object type
export type Translations = Record<string, TranslationDictionary>;

// Language change listener callback type
export type LanguageChangeListener = (language: string) => void;

// LanguageService class declaration
export declare class LanguageService {
  currentLanguage: string;
  translations: Translations;
  listeners: Set<LanguageChangeListener>;

  constructor();
  
  /**
   * Initialize the language service
   */
  init(): void;
  
  /**
   * Set the current language
   * @param lang - Language code (e.g., 'zh-CN', 'en-US')
   */
  setLanguage(lang: string): void;
  
  /**
   * Get the current language
   * @returns Current language code
   */
  getLanguage(): string;
  
  /**
   * Translate a key to the current language
   * @param key - Translation key
   * @param fallback - Fallback value if translation not found
   * @returns Translated string or fallback
   */
  t(key: string, fallback?: string): string;
  
  /**
   * Add a language change listener
   * @param callback - Callback function to be called when language changes
   * @returns Function to remove the listener
   */
  addListener(callback: LanguageChangeListener): () => boolean;
  
  /**
   * Notify all listeners of language change
   */
  notifyListeners(): void;
  
  /**
   * Get available languages
   * @returns Array of language options
   */
  getAvailableLanguages(): LanguageOption[];
}

// Default export - language service instance
declare const languageService: LanguageService;
export default languageService;

// Named export - translation helper function
export declare const t: (key: string, fallback?: string) => string;