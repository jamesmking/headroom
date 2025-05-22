import styles from './button.module.scss';

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

const Button = ({children, onClick, type = 'submit'}: ButtonProps) => {
  return (
    <button onClick={onClick} className={styles.Button} type={type}>
      {children}
    </button>
  );
};

export {Button};
