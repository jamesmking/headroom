import { signIn } from "@/app/auth";

export const SignInButton = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <button type="submit">Sign in</button>
    </form>
  );
};
