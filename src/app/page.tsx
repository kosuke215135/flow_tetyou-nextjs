import NoteEditor from "@/app/components/Editor";
import NotesList from "@/app/components/NotesList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* エディタセクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              新しいノートを作成
            </h1>
            <NoteEditor />
          </div>

          {/* ノート一覧セクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <NotesList className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}