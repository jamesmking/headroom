export interface TaskType {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  lastUpdated: Date;
}

export interface ColumnType {
  id: string;
  title: string;
}
