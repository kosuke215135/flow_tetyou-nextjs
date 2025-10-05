/**
 * アプリ共通ヘッダー
 */
const APP_NAME = "Flow手帳";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="w-full bg-gray-900 text-white py-4 px-6 shadow">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">{title ?? APP_NAME}</h1>
        {/* ここにナビゲーションやアイコンなど追加可能 */}
      </div>
    </header>
  );
};