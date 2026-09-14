import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Alert } from '../components/UI'

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form,   setForm]   = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: undefined, general: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.username || form.username.length < 3) e.username = 'Minimum 3 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(form.username))   e.username = 'Letters, digits, _ and - only'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (form.password.length < 8)                   e.password = 'Minimum 8 characters'
    if (!/[A-Z]/.test(form.password))               e.password = 'Must include uppercase letter'
    if (!/[0-9]/.test(form.password))               e.password = 'Must include a digit'
    if (!/[@$!%*?&^#]/.test(form.password))         e.password = 'Must include a special character'
    if (form.password !== form.confirm)             e.confirm  = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    const res = await register(form.username, form.email, form.password)
    if (res.success) navigate('/dashboard')
    else setErrors({ ...res.fieldErrors, general: res.error })
  }

  const pwStrength = () => {
    if (!form.password) return 0
    let s = 0
    if (form.password.length >= 8)         s++
    if (/[A-Z]/.test(form.password))       s++
    if (/[0-9]/.test(form.password))       s++
    if (/[@$!%*?&^#]/.test(form.password)) s++
    return s
  }
  const strength = pwStrength()
  const strengthColor = ['#ef4444','#f59e0b','#f59e0b','#22c55e','#22c55e'][strength]
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 40% 30%, rgba(139,92,246,0.1) 0%, transparent 60%), #020817',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="animate-fadeUp">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.8">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>Create Account</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Join AI Mentor and start learning</p>
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '32px 28px',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <Input
                label="Username"
                placeholder="your_username"
                value={form.username}
                onChange={set('username')}
                error={errors.username}
                autoFocus
                leftIcon={
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                }
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                leftIcon={
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                }
              />

              <div>
                <Input
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 chars, mixed"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  leftIcon={
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  }
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex' }}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  }
                />
                {form.password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= strength ? strengthColor : '#1e293b',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    {strengthLabel && (
                      <span style={{ fontSize: 11, color: strengthColor }}>{strengthLabel}</span>
                    )}
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={set('confirm')}
                error={errors.confirm}
                leftIcon={
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                }
              />

              {errors.general && <Alert type="error">{errors.general}</Alert>}

              {/* Fix: fullWidth prop ensures the button spans the entire card */}
              <Button
                type="submit"
                size="lg"
                loading={loading}
                fullWidth
                style={{ marginTop: 4 }}
              >
                Create Account
              </Button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
