/* =========================================================================
   app/(root)/my-profile/page.tsx – Profil + édition
   ========================================================================= */
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { users, workers } from "@/database/schema";
import { eq } from "drizzle-orm";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProfileForm from "@/components/auth/ProfileForm";

export const dynamic = "force-dynamic";

/* skeleton */
function FormSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-20">
      <div className="size-20 animate-pulse rounded-full bg-gray-200" />
      <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="h-[380px] w-full max-w-2xl animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const id = session.user.id;

  const [user, worker] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, id) }),
    db.query.workers.findFirst({ where: eq(workers.id, id) }),
  ]);
  if (!user) redirect("/sign-in");

  return (
    <section
      className="h-screen overflow-y-auto bg-gradient-to-b
                        from-amber-50/60 via-white to-white
                        px-4 py-8 lg:py-12"
    >
      <Card
        className="mx-auto w-full max-w-4xl border-none bg-white/90 shadow-xl
                       ring-1 ring-gray-100 backdrop-blur"
      >
        <CardHeader className="flex flex-col items-center gap-4 pb-0">
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
            Mon&nbsp;profil
          </h1>
        </CardHeader>

        <CardContent className="px-6 pb-20 pt-6 sm:px-10">
          <Suspense fallback={<FormSkeleton />}>
            <ProfileForm
              userId={id}
              current={{
                fullName: user.full_name,
                email: user.email,
                profileImageUrl:
                  worker?.profile_image_url ?? user.profile_image_url,
              }}
              isWorker={Boolean(worker)}
              worker={
                worker && {
                  category: worker.category,
                  description: worker.description,
                  hourlyRate: worker.hourly_rate,
                  location: worker.location,
                  latitude: worker.latitude,
                  longitude: worker.longitude,
                  skill: worker.skill
                    ? worker.skill.split(",").map((s) => s.trim())
                    : [],
                  availability:
                    typeof worker.availability === "string"
                      ? JSON.parse(worker.availability)
                      : worker.availability,
                }
              }
            />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  );
}
