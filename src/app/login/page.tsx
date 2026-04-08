import { LoginForm } from './LoginForm';

export default async function LoginPage(props: { searchParams: Promise<{ message?: string, type?: string }> }) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message;
  const isError = searchParams?.type === 'error';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
      
      {/* Toast Pop-up Notification */}
      {message && (
        <div className={`absolute top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md border flex items-center gap-3 z-50
          animate-in slide-in-from-top-10 fade-in duration-300
          ${isError 
            ? 'bg-error/10 border-error/30 text-error' 
            : 'bg-tertiary/10 border-tertiary/30 text-tertiary'}`}>
          <div className={`w-2 h-2 rounded-full ${isError ? 'bg-error' : 'bg-tertiary'} shadow-[0_0_8px_currentColor]`} />
          <p className="font-medium text-sm">{message}</p>
        </div>
      )}

      <LoginForm />
    </div>
  )
}
