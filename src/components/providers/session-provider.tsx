'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { Session } from 'next-auth' // Session型をインポート

interface SessionProviderWrapperProps {
  children: ReactNode;
  session: Session | null; // sessionプロパティを追加
}

export default function SessionProviderWrapper({ children, session }: SessionProviderWrapperProps) {
  return (
    <SessionProvider session={session}> {/* sessionプロパティを渡す */}
      {children}
    </SessionProvider>
  )
}
