'use client';

import AuthButton from './auth/AuthButton';

const APP_NAME = "Flow手帳";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {

  return (
    <header className="bg-gray-800 shadow-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左側 */}
          <div className="flex-1 flex items-center">
            <h1 className="text-xl font-semibold text-white">
              {title ?? APP_NAME}
            </h1>
          </div>

          {/* 右側 */}
          <div className="flex-1 flex justify-end items-center">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
};