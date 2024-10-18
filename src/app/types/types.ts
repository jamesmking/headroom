type Status = "TODO" | "DOING" | "DONE";

export interface TaskType {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: Status;
  created: Date;
  updated: Date | null;
}

export interface StatusType {
  id: Status;
  title: string;
}

export interface AddFormValues {
  title: string;
  description?: string;
}

export interface UpdateFormValues {
  id: string;
  title: string;
  description: string;
  status: Status;
}

export type FormValues = UpdateFormValues | AddFormValues;
