import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tasksTable } from "@/app/db/schema";
import { auth } from "@/app/auth";
import { eq } from "drizzle-orm";

const client = postgres(`${process.env.POSTGRES_URL!}`);
const db = drizzle(client);

export async function fetchTasks() {
  const session = await auth();
  const userId = session?.user.id;
  try {
    return await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId!))
      .orderBy(tasksTable.created);
  } catch (error) {
    console.error("Database error:", error);
  }
}
