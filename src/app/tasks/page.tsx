import { fetchTasks } from "@/app/lib/data";
import { Main } from "@/app/ui/components/Main";
import { StatusType } from "@/app/types";

import React from "react";
import { TaskFormAdd, TaskList } from "@/app/components";
import { Modal } from "@/app/ui";

export default async function Tasks() {
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
  const closeModal = false;
  return (
    <Main>
      <TaskList tasks={tasks} statuses={statuses} />
      <Modal triggerClose={closeModal}>
        <TaskFormAdd />
      </Modal>
      <noscript>
        <TaskFormAdd />
      </noscript>
    </Main>
  );
}
