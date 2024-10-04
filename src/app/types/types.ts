type Status = "TODO" | "DOING" | "DONE";

export interface TaskType {
  id: string;
  title: string;
  description?: string;
  status: Status;
  lastUpdated: Date;
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
  description?: string;
  status: Status;
}

export type FormValues = UpdateFormValues | AddFormValues;
