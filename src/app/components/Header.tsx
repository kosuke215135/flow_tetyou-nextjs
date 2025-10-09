import AuthButton from './auth/AuthButton';

/**
 * アプリ共通ヘッダー
 */
const APP_NAME = "Flow手帳";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-gray-800 shadow-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-white">
              {title ?? APP_NAME}
            </h1>
          </div>
          <div className="flex items-center">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
};