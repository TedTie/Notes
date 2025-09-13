// TypeScript declarations for notesService.js

// Note data interface
export interface Note {
  id?: string | number;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

// Note creation data interface
export interface CreateNoteData {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

// Note update data interface
export interface UpdateNoteData {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

// API response interfaces
export interface NotesResponse {
  notes: Note[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface NoteResponse {
  note: Note;
  success?: boolean;
  message?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  message?: string;
}

// NotesService class declaration
export declare class NotesService {
  /**
   * Get all notes
   * @returns Promise resolving to array of notes
   */
  getAllNotes(): Promise<Note[]>;
  
  /**
   * Create a new note
   * @param noteData - Note data to create
   * @returns Promise resolving to created note response
   */
  createNote(noteData: CreateNoteData): Promise<NoteResponse>;
  
  /**
   * Update an existing note
   * @param id - Note ID
   * @param noteData - Note data to update
   * @returns Promise resolving to updated note response
   */
  updateNote(id: string | number, noteData: UpdateNoteData): Promise<NoteResponse>;
  
  /**
   * Delete a note
   * @param id - Note ID
   * @returns Promise resolving to deletion response
   */
  deleteNote(id: string | number): Promise<{ success: boolean; message?: string }>;
  
  /**
   * Search notes by query
   * @param query - Search query string
   * @returns Promise resolving to array of matching notes
   */
  searchNotes(query: string): Promise<Note[]>;
  
  /**
   * Get a note by ID
   * @param id - Note ID
   * @returns Promise resolving to note response
   */
  getNoteById(id: string | number): Promise<NoteResponse>;
  
  /**
   * Get notes by category
   * @param category - Category name
   * @returns Promise resolving to array of notes in category
   */
  getNotesByCategory(category: string): Promise<Note[]>;
  
  /**
   * Get recent notes
   * @param limit - Maximum number of notes to return (default: 10)
   * @returns Promise resolving to array of recent notes
   */
  getRecentNotes(limit?: number): Promise<Note[]>;
  
  /**
   * Export notes
   * @param format - Export format (default: 'json')
   * @returns Promise resolving to blob data
   */
  exportNotes(format?: string): Promise<Blob>;
  
  /**
   * Import notes from file
   * @param file - File to import
   * @returns Promise resolving to import result
   */
  importNotes(file: File): Promise<ImportResult>;
}

// Default export - notes service instance
declare const notesService: NotesService;
export default notesService;