'use client';

import { useState } from 'react';
import { login, signup, resetPassword } from './actions';

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="w-full max-w-sm p-8 bg-surface-container-low rounded-2xl border border-surface-container-high text-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      
      {/* Brand Logo */}
      <div className="w-20 h-20 rounded-3xl bg-white mx-auto mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden p-2 group transition-all duration-500 hover:scale-105">
          <img src="/logo.png" alt="TaskZen Logo" className="w-full h-full object-contain relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2 text-on-surface tracking-tight">
        {mode === 'login' ? 'Acceso Espacio de Trabajo' : 'Crear nueva cuenta'}
      </h1>
      <p className="text-sm text-on-surface-variant mb-6">
        {mode === 'login' ? 'Autenticación segura por Supabase GoTrue' : 'Únete a TaskZen hoy mismo'}
      </p>
      
      {/* Formulario conectado a Next.js Server Actions */}
      <form className="flex flex-col gap-4 text-left">
        {mode === 'signup' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider" htmlFor="full_name">Nombre Completo</label>
            <input 
               id="full_name" 
               name="full_name" 
               type="text" 
               required
               className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm transition-all text-on-surface placeholder:text-on-surface-variant" 
               placeholder="Tu nombre completo" 
            />
          </div>
        )}
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
          {mode === 'login' ? (
            <button formAction={login} className="w-full flex justify-center items-center gap-2 bg-gradient-to-br from-primary to-primary-dim text-black font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(151,169,255,0.2)] hover:shadow-[0_0_30px_rgba(151,169,255,0.4)] transition-all">
               Iniciar Sesión
            </button>
          ) : (
            <button formAction={signup} className="w-full flex justify-center items-center gap-2 bg-gradient-to-br from-secondary to-secondary-dim text-black font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(167,243,208,0.2)] hover:shadow-[0_0_30px_rgba(167,243,208,0.4)] transition-all">
               Crear Cuenta
            </button>
          )}

          <div className="flex items-center justify-between mt-1 px-1">
             {mode === 'login' ? (
               <>
                 <button formAction={resetPassword} className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors py-2 uppercase tracking-wide">
                    Olvidé mi Clave
                 </button>
                 <button type="button" onClick={() => setMode('signup')} className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors py-2 uppercase tracking-wide">
                    Registrarme
                 </button>
               </>
             ) : (
               <button type="button" onClick={() => setMode('login')} className="w-full text-center text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors py-2 uppercase tracking-wide">
                  Ya tengo una cuenta, entrar
               </button>
             )}
          </div>
        </div>
      </form>
    </div>
  );
}
