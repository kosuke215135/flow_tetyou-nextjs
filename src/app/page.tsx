import NotesPage from "@/app/components/NotesPage";
import DoitKunArea from '@/app/components/DoitKunArea';

export default function Home() {
  return (
    <main className="flex min-h-screen">
      <div className="flex-1">
        <NotesPage />
      </div>
      <aside className="w-96 p-8 bg-gray-50 border-l border-gray-200">
        <DoitKunArea />
      </aside>
    </main>
  );
}