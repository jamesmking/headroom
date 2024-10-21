import { signOut } from "@/app/auth";
import styles from "./SignOutButton.module.scss";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
      className={styles.form}
    >
      <button type="submit" className={styles.button}>
        Sign out
      </button>
    </form>
  );
}
