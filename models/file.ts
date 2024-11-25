export interface FileStructure {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileStructure[];
  content?: string;
} 