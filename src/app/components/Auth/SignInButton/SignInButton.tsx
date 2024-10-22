import { signIn } from "@/app/auth";
import styles from "./SignInButton.module.scss";

export const SignInButton = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <button type="submit" className={styles.button}>
        Sign in with Google
      </button>
    </form>
  );
};
