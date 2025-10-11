'use client'; // クライアントコンポーネント化

import useSWR from 'swr';
import AuthButton from './auth/AuthButton';
import YurufuwaMeter from './YurufuwaMeter';

// SWRのfetcher関数
const fetcher = (url: string) => fetch(url).then(res => res.json());

const APP_NAME = "Flow手帳";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  // SWRでユーザーデータを取得
  const { data: user, error } = useSWR('/api/user', fetcher, {
    refreshInterval: 5000, // 5秒ごとにポーリング
  });

  const userMeter = user?.yurufuwaMeter ?? 0;

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

          {/* 中央 */}
          <div className="flex-1 flex justify-center">
            {/* userが存在する場合のみメーターを表示 */}
            {user && <YurufuwaMeter currentValue={userMeter} />}
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