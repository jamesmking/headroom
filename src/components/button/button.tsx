'use client';

import {LucideLoaderCircle} from 'lucide-react';
import {useFormStatus} from 'react-dom';
import styles from './button.module.scss';

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

const Button = ({children, onClick, type = 'submit'}: ButtonProps) => {
  const {pending} = useFormStatus();
  return (
    <button onClick={onClick} className={styles.Button} type={type} disabled={pending}>
      {pending && <LucideLoaderCircle className={styles.Icon}>Loading</LucideLoaderCircle>}
      {!pending && <span>{children}</span>}
    </button>
  );
};

export {Button};
