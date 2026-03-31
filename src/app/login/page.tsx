import { login, signup, resetPassword } from './actions';

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

      <div className="w-full max-w-sm p-8 bg-surface-container-low rounded-2xl border border-surface-container-high text-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        
        {/* Candado / Logo de Seguridad */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-6 shadow-[0_0_30px_rgba(151,169,255,0.3)] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full translate-y-4" />
            <svg className="w-8 h-8 text-black relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-on-surface tracking-tight">Acceso Espacio de Trabajo</h1>
        <p className="text-sm text-on-surface-variant mb-6">Autenticación segura por Supabase GoTrue</p>
        
        {/* Formulario conectado a Next.js Server Actions */}
        <form className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider" htmlFor="email">Email</label>
            <input 
               id="email" 
               name="email" 
               type="email" 
               required 
               className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm transition-all text-on-surface placeholder:text-on-surface-variant" 
               placeholder="ejemplo@email.com" 
            />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider" htmlFor="password">Contraseña</label>
            <input 
               id="password" 
               name="password" 
               type="password" 
               required 
               className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm transition-all text-on-surface" 
               placeholder="••••••••" 
            />
          </div>
          
          <div className="flex flex-col gap-3 mt-2">
            <button formAction={login} className="w-full flex justify-center items-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-black font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(151,169,255,0.2)] hover:shadow-[0_0_30px_rgba(151,169,255,0.4)] transition-all">
               Iniciar Sesión
            </button>
            <div className="flex items-center justify-between mt-1 px-1">
               <button formAction={resetPassword} formNoValidate className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors py-2 uppercase tracking-wide">
                  Olvidé mi Clave
               </button>
               <button formAction={signup} className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors py-2 uppercase tracking-wide">
                  Crear Cuenta
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
