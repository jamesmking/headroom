import { useState, useEffect, ReactNode } from "react";
import styles from "./Modal.module.scss";

interface Props {
  closeAction?: () => void;
  children: ReactNode;
}

export const Modal = ({ children }: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    document.body.classList.toggle(styles.modalOpen, isOpen);
  }, [isOpen]);

  return (
    <div>
      <div className={styles.modal}>
        <div className={styles.content}>{children}</div>
        <button onClick={closeModal}>Close</button>
      </div>
      <button onClick={openModal}>Add</button>
    </div>
  );
};
