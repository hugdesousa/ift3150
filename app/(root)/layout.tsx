// ift3150/app/(root)/layout.tsx

import { ReactNode } from "react";
import Header from "@/components/ui/Header";
import { auth } from "@/auth";
import { after } from "next/server";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  if (session) {
    after(async () => {
      if (!session?.user?.id) return;

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (user[0]?.last_activity_at === new Date()) return;

      await db
        .update(users)
        .set({ last_activity_at: new Date() })
        .where(eq(users.id, session.user.id));
    });
  }

  return (
    <main className="root-container min-h-screen pt-14">
      {" "}
      {/* 56 px pour Header */}
      <Header />
      <div className="">{children}</div>
    </main>
  );
};

export default Layout;
