import Link from 'next/link'

interface ErrorPageProps {
  searchParams: {
    error?: string
  }
}

const ERROR_MESSAGES = {
  Configuration: 'サーバーの設定に問題があります。管理者にお問い合わせください。',
  AccessDenied: 'アクセスが拒否されました。権限がない可能性があります。',
  Verification: 'トークンの有効期限が切れているか、既に使用されています。',
  Default: '認証中に予期しないエラーが発生しました。',
  OAuthSignin: 'OAuth認証の開始でエラーが発生しました。',
  OAuthCallback: 'OAuth認証のコールバックでエラーが発生しました。',
  OAuthCreateAccount: 'アカウントの作成に失敗しました。',
  EmailCreateAccount: 'メールアカウントの作成に失敗しました。',
  Callback: 'コールバック処理でエラーが発生しました。',
  OAuthAccountNotLinked: 'このメールアドレスは既に別のアカウントで登録されています。',
  EmailSignin: 'メールでのサインインに失敗しました。',
  CredentialsSignin: '認証情報が正しくありません。',
  SessionRequired: 'ログインが必要です。',
} as const

export default function ErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = searchParams
  const errorMessage = error 
    ? ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] ?? ERROR_MESSAGES.Default
    : ERROR_MESSAGES.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            認証エラー
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            サインイン中に問題が発生しました
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                エラーの詳細
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {errorMessage}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            サインインページに戻る
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            ホームに戻る
          </Link>
        </div>

        {error && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              エラーコード: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
