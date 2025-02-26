// src/pages/SignInPage.tsx
import { SignIn } from "@clerk/clerk-react";

const SignInPage = () => {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}
    >
      <SignIn />
    </div>
  );
};

export default SignInPage;
