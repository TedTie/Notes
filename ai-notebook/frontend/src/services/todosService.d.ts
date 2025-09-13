// TypeScript declarations for todosService.js

// Todo priority levels
export type TodoPriority = 'high' | 'medium' | 'low';

// Todo status
export type TodoStatus = 'pending' | 'completed';

// Todo category
export type TodoCategory = 'work' | 'personal' | 'study' | 'health' | 'other';

// Todo data interface
export interface Todo {
  id?: string | number;
  title: string;
  description?: string;
  content?: string; // For frontend compatibility
  priority: TodoPriority;
  category: TodoCategory;
  status?: TodoStatus;
  completed?: boolean;
  due_date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

// Todo creation data interface
export interface CreateTodoData {
  content: string; // Frontend uses 'content' field
  title?: string;
  description?: string;
  priority: TodoPriority;
  category: TodoCategory;
  due_date?: string | Date;
  [key: string]: any;
}

// Todo update data interface
export interface UpdateTodoData {
  title?: string;
  description?: string;
  priority?: TodoPriority;
  category?: TodoCategory;
  status?: TodoStatus;
  completed?: boolean;
  due_date?: string | Date;
  [key: string]: any;
}

// API response interfaces
export interface TodosResponse {
  todos: Todo[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface TodoResponse {
  todo?: Todo;
  success?: boolean;
  message?: string;
  error?: string;
}

export interface CreateTodoResponse {
  success: boolean;
  todo?: Todo;
  error?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export interface BatchOperationResponse {
  success: boolean;
  updated?: number;
  deleted?: number;
  failed?: number;
  message?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  message?: string;
}

// TodosService class declaration
export declare class TodosService {
  /**
   * Get all todos
   * @returns Promise resolving to array of todos
   */
  getAllTodos(): Promise<Todo[]>;
  
  /**
   * Create a new todo
   * @param todoData - Todo data to create
   * @returns Promise resolving to creation response
   */
  createTodo(todoData: CreateTodoData): Promise<CreateTodoResponse>;
  
  /**
   * Update an existing todo
   * @param id - Todo ID
   * @param todoData - Todo data to update
   * @returns Promise resolving to updated todo response
   */
  updateTodo(id: string | number, todoData: UpdateTodoData): Promise<TodoResponse>;
  
  /**
   * Delete a todo
   * @param id - Todo ID
   * @returns Promise resolving to deletion response
   */
  deleteTodo(id: string | number): Promise<{ success: boolean; message?: string }>;
  
  /**
   * Toggle todo completion status
   * @param id - Todo ID
   * @returns Promise resolving to updated todo response
   */
  toggleTodo(id: string | number): Promise<TodoResponse>;
  
  /**
   * Search todos by query
   * @param query - Search query string
   * @returns Promise resolving to array of matching todos
   */
  searchTodos(query: string): Promise<Todo[]>;
  
  /**
   * Get a todo by ID
   * @param id - Todo ID
   * @returns Promise resolving to todo response
   */
  getTodoById(id: string | number): Promise<TodoResponse>;
  
  /**
   * Get todos by status
   * @param status - Todo status
   * @returns Promise resolving to array of todos with specified status
   */
  getTodosByStatus(status: TodoStatus): Promise<Todo[]>;
  
  /**
   * Get todos by priority
   * @param priority - Todo priority
   * @returns Promise resolving to array of todos with specified priority
   */
  getTodosByPriority(priority: TodoPriority): Promise<Todo[]>;
  
  /**
   * Get todos by category
   * @param category - Todo category
   * @returns Promise resolving to array of todos in category
   */
  getTodosByCategory(category: TodoCategory): Promise<Todo[]>;
  
  /**
   * Get overdue todos
   * @returns Promise resolving to array of overdue todos
   */
  getOverdueTodos(): Promise<Todo[]>;
  
  /**
   * Get today's todos
   * @returns Promise resolving to array of today's todos
   */
  getTodayTodos(): Promise<Todo[]>;
  
  /**
   * Get upcoming todos
   * @param days - Number of days to look ahead (default: 7)
   * @returns Promise resolving to array of upcoming todos
   */
  getUpcomingTodos(days?: number): Promise<Todo[]>;
  
  /**
   * Get todo statistics
   * @returns Promise resolving to todo statistics
   */
  getTodoStats(): Promise<TodoStats>;
  
  /**
   * Batch update multiple todos
   * @param todoIds - Array of todo IDs
   * @param updateData - Data to update
   * @returns Promise resolving to batch operation response
   */
  batchUpdateTodos(todoIds: (string | number)[], updateData: UpdateTodoData): Promise<BatchOperationResponse>;
  
  /**
   * Batch delete multiple todos
   * @param todoIds - Array of todo IDs
   * @returns Promise resolving to batch operation response
   */
  batchDeleteTodos(todoIds: (string | number)[]): Promise<BatchOperationResponse>;
  
  /**
   * Export todos
   * @param format - Export format (default: 'json')
   * @returns Promise resolving to blob data
   */
  exportTodos(format?: string): Promise<Blob>;
  
  /**
   * Import todos from file
   * @param file - File to import
   * @returns Promise resolving to import result
   */
  importTodos(file: File): Promise<ImportResult>;
}

// Default export - todos service instance
declare const todosService: TodosService;
export default todosService;