"use server";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { tasksTable, createTaskSchema } from "@/app/db/schema";
import {
  fromErrorToFormState,
  toFormState,
  FormState,
} from "@/app/utils/taskForm";
import { auth } from "@/app/auth";

const client = postgres(`${process.env.POSTGRES_URL!}`);
const db = drizzle(client, { casing: "snake_case" });

export async function createTask(formState: FormState, formData: FormData) {
  const session = await auth();
  const userId = session?.user.id || "";
  try {
    const { title, description } = createTaskSchema.parse({
      userId: "921820d0-c018-42cb-b90a-fdc6d5910454",
      title: formData.get("title"),
      description: formData.get("description"),
    });
    await db.insert(tasksTable).values({
      userId,
      title,
      description,
    });
  } catch (error) {
    return fromErrorToFormState(error);
  }

  revalidatePath("/tasks");
  return toFormState("SUCCESS", "Created");
}

export async function deleteTask(id: string) {
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  revalidatePath("/");
}

export async function updateTask(formState: FormState, formData: FormData) {
  try {
    const { id, title, description, status } = createTaskSchema.parse({
      id: formData.get("taskId"),
      userId: "921820d0-c018-42cb-b90a-fdc6d5910454",
      title: formData.get("title"),
      description: formData.get("description"),
      status: formData.get("status"),
    });
    console.log(title, description, status);
    await db
      .update(tasksTable)
      .set({
        title,
        description,
        status,
      })
      .where(eq(tasksTable.id, id!));
  } catch (error) {
    console.log(error);
    return fromErrorToFormState(error);
  }
  revalidatePath("/");
  return toFormState("SUCCESS", "Updated");
}
