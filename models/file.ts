export interface FileStructure {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileStructure[];
} 