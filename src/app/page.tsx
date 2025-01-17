import React from "react";
import { Main } from "@/app/ui";
import { auth } from "@/app/auth";
import { SignInButton } from "@/app/components/Auth/SignInButton";
import { fetchTasks } from "@/app/lib/data";
import { ModalWrap, TaskFormAdd, TaskList } from "@/app/components";
import { StatusType } from "@/app/types";
import styles from "./page.module.scss";

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
      <div className={styles.homepage}>
        <div className={styles.mainWrap}>
          <main>
            <div className={styles.content}>
              <p className={styles.lead}>Give yourself some head room.</p>
              <p>
                Clear your mind and tackle your tasks with ease. Transfer your
                long to-do list into this simple, intuitive app, and take
                control of your day.
              </p>
              <p>
                You will need a Google account to access the app and save your
                list—keeping everything safe and accessible wherever you go.
              </p>
              <SignInButton />
            </div>
          </main>
        </div>
        <footer className={styles.footer}>
          <p>
            This is a work in progress project, and there are plenty of things
            on my todo list to improve the code and user experience.
          </p>
          <p>
            If you have any suggestions, send me an email{" "}
            <a href="mailto:hello@jamesmichaelking.com">
              hello@jamesmichaelking.com
            </a>
          </p>
          <p>
            Source code available on{" "}
            <a href="https://github.com/jamesmking/headroom">GitHub</a>
          </p>
        </footer>
      </div>
    );
  return (
    <Main>
      <TaskList tasks={tasks} statuses={statuses} />
      <ModalWrap />
      <noscript>
        <TaskFormAdd />
      </noscript>
    </Main>
  );
}
