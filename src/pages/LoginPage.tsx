import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

export default function LoginPage() {
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    const result = await login({ username, password })
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.error || 'Invalid username or password')
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-main)]">
      {/* Left Side - Branded Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, #00003c, #000080)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 xl:w-80 xl:h-80 bg-[var(--color-secondary)]/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 xl:w-72 xl:h-72 bg-[var(--color-accent-teal)]/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 text-center px-8 lg:px-12 xl:px-16 max-w-md">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="flex items-center justify-center mb-6 lg:mb-8">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 animate-float">
                <svg className="w-7 h-7 lg:w-8 lg:h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white tracking-tight mb-3 lg:mb-4">KSP WorkBoard</h1>
            <p className="text-sm lg:text-base text-white/70 leading-relaxed mb-8 lg:mb-10">
              {t('ksp_duty_roster')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            {[
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Scheduling' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Personnel' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Reports' },
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className={`group p-3 lg:p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div className="w-8 h-8 lg:w-9 lg:h-9 mx-auto mb-2 rounded-lg bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <div className="font-medium text-white text-xs lg:text-sm">{feature.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-[var(--color-bg-card)]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[var(--color-primary)]/5 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[var(--color-accent-indigo)]/5 rounded-full blur-3xl opacity-40" />
        </div>

        <div className={`w-full max-w-sm relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl border border-[var(--color-border)]/60 p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
            {/* Top gradient border line */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #FFC107, #6b5c42, #000080, #8B5CF6)' }} />
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #00003c, #000080)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-[var(--color-text-dark)]">KSP WorkBoard</h1>
            </div>

            <div className={`text-center mb-6 transition-all duration-500 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-2xl font-bold text-[var(--color-text-dark)] mb-1.5">Welcome back</h2>
              <p className="text-[var(--color-text-medium)] text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] px-4 py-3 rounded-xl text-sm animate-shake">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className={`space-y-1.5 transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <label htmlFor="username" className="block text-sm font-medium text-[var(--color-text-dark)]">Username</label>
                <div className={`relative transition-transform duration-200 ${focusedField === 'username' ? 'scale-[1.01]' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className={`w-4.5 h-4.5 transition-colors duration-200 ${focusedField === 'username' ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text-light)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-main)]/50 text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:bg-[var(--color-bg-card)] focus:outline-none transition-all text-sm"
                    placeholder="Enter username"
                    required
                    autoComplete="username"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={`space-y-1.5 transition-all duration-500 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-dark)]">Password</label>
                <div className={`relative transition-transform duration-200 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className={`w-4.5 h-4.5 transition-colors duration-200 ${focusedField === 'password' ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text-light)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-10 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-main)]/50 text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:bg-[var(--color-bg-card)] focus:outline-none transition-all text-sm"
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-light)] hover:text-[var(--color-secondary)] transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                    </svg>
                  </button>
                </div>
              </div>

              <div className={`flex justify-end transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <button type="button" className="text-sm text-[var(--color-secondary)] hover:text-[var(--color-secondary-dark)] font-medium transition-colors">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`relative w-full py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm disabled:opacity-60 overflow-hidden group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ 
                  transitionDelay: '600ms',
                  background: 'linear-gradient(135deg, #554a35, #6b5c42)',
                  boxShadow: '0 4px 16px rgba(107, 92, 66, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>

          <p className={`text-center text-xs text-[var(--color-text-light)] mt-6 transition-all duration-500 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            © 2026 KSP WorkBoard. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25%, 75% { transform: translateX(-3px); } 50% { transform: translateX(3px); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
