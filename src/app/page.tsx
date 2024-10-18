import React from "react";
import { Main, Modal } from "@/app/ui";
import { auth } from "@/app/auth";
import { SignInButton } from "@/app/components/Auth/SignInButton";
import { fetchTasks } from "@/app/lib/data";
import { TaskFormAdd, TaskList } from "@/app/components";
import { StatusType } from "@/app/types";

export default async function Home() {
  const session = await auth();
  const tasks = await fetchTasks();
  const statuses: StatusType[] = [
    {
      id: "TODO",
      title: "To do",
    },
    {
      id: "DOING",
      title: "Doing",
    },
    {
      id: "DONE",
      title: "Done",
    },
  ];
  if (!session)
    return (
      <Main>
        <SignInButton />
      </Main>
    );
  return (
    <Main>
      <TaskList tasks={tasks} statuses={statuses} />
      <Modal>
        <TaskFormAdd />
      </Modal>
      <noscript>
        <TaskFormAdd />
      </noscript>
    </Main>
  );
}
