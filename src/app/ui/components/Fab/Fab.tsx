import styles from "./Fab.module.scss";

interface FabProps {
  handleClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  text: string;
}

export const Fab = ({ handleClick, text }: FabProps) => {
  return (
    <button onClick={handleClick} className={styles.button}>
      {text}
    </button>
  );
};
