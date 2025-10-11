import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AuthButton from './auth/AuthButton';
import YurufuwaMeter from './YurufuwaMeter';

const APP_NAME = "Flow手帳";

interface HeaderProps {
  title?: string;
}

export async function Header({ title }: HeaderProps) {
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
            {session?.user && <YurufuwaMeter currentValue={userMeter} />}
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