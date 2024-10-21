"use client";
import { useState, useEffect, ReactNode } from "react";
import { Fab } from "@/app/ui";
import styles from "./Modal.module.scss";

interface Props {
  triggerClose?: boolean;
  children: ReactNode;
}

export const Modal = ({
  triggerClose = false,
  children,
}: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    document.body.classList.toggle(styles.modalOpen, isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (triggerClose) closeModal();
  }, [triggerClose]);

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.code === "Escape") closeModal();
    };
    if (isOpen) {
      window.addEventListener("keydown", close);
      return () => window.removeEventListener("keydown", close);
    }
  }, [isOpen]);

  return (
    <>
      <div className={styles.modal}>
        <div className={styles.content}>
          <button onClick={closeModal} className={styles.closeButton}>
            Close
          </button>
          {children}
        </div>
      </div>
      <Fab handleClick={openModal} text={"Add a new task"} />
    </>
  );
};
