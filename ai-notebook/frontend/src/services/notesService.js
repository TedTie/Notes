import { notesService as supabaseNotesService } from './supabaseService.js'

class NotesService {
  async getAllNotes() {
    return await supabaseNotesService.getAllNotes()
  }

  async createNote(noteData) {
    return await supabaseNotesService.createNote(noteData)
  }

  async updateNote(id, noteData) {
    return await supabaseNotesService.updateNote(id, noteData)
  }

  async deleteNote(id) {
    return await supabaseNotesService.deleteNote(id)
  }

  async searchNotes(query) {
    return await supabaseNotesService.searchNotes(query)
  }

  async getNoteById(id) {
    return await supabaseNotesService.getNoteById(id)
  }

  async getNotesByCategory(category) {
    return await supabaseNotesService.getNotesByCategory(category)
  }

  async getRecentNotes(limit = 10) {
    return await supabaseNotesService.getRecentNotes(limit)
  }

  async exportNotes(format = 'json') {
    return await supabaseNotesService.exportNotes(format)
  }

  async importNotes(file) {
    return await supabaseNotesService.importNotes(file)
  }
}

export default new NotesService()