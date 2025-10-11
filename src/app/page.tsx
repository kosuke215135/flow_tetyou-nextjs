import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NotesPage from "@/app/components/NotesPage";
import DoitKunArea from '@/app/components/DoitKunArea';

export default async function Home() {
  const session = await auth();
  let userMeter = 0;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { yurufuwaMeter: true },
    });
    if (user) {
      userMeter = user.yurufuwaMeter;
    }
  }

  return (
    <main className="flex min-h-screen">
      <div className="flex-1">
        <NotesPage />
      </div>
      <aside className="w-96 p-8 bg-gray-50 border-l border-gray-200">
        {/* ログインしている場合のみDoitKunAreaを表示 */}
        {session?.user && <DoitKunArea currentValue={userMeter} />}
      </aside>
    </main>
  );
}