import { auth, signOut } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// import { signOut } from 'next-auth/react';
// import { useRouter } from 'next/router'

interface UserInfo {
  name?: string | null
  email?: string | null
  image?: string | null
}

function SignOutButton() {
  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: "/auth/signin" })
    revalidatePath('/')
  }

  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="text-sm text-white hover:text-gray-300 font-medium transition-colors duration-200"
      >
        サインアウト
      </button>
    </form>
  )
}

function UserProfile({ user }: { user: UserInfo }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {user.image && (
          <img
            src={user.image}
            alt="User avatar"
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {user.name || 'ユーザー'}
          </span>
          <span className="text-xs text-gray-300">
            {user.email}
          </span>
        </div>
      </div>
      <SignOutButton />
    </div>
  )
}

function SignInLink() {
  return (
    <Link
      href="/auth/signin"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
    >
      サインイン
    </Link>
  )
}

export default async function AuthButton() {
  const session = await auth()
  
  if (session?.user) {
    return <UserProfile user={session.user} />
  }
  
  return <SignInLink />
}
