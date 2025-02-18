import React from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/auth";
import BookList from "@/components/BookList";
import { sampleBooks } from "@/constants";
import { redirect } from "next/navigation";

const Page = () => {
  return (
    <div>
      <form
        action={async () => {
          "use server";
          console.log("Déconnexion en cours..."); // Log avant la déconnexion
          await signOut();
          console.log("Déconnexion réussie. Redirection vers /sign-in..."); // Log après la déconnexion
          redirect("/sign-in"); // Redirigez vers la page de connexion
        }}
        className="mb-10"
      >
        <Button type="submit">Logout</Button>
      </form>
      <BookList title="Borrowed Books" books={sampleBooks} />
    </div>
  );
};

export default Page;
