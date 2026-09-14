import { forwardRef, useState } from 'react'

// ── Button ────────────────────────────────────────────────────────────────────
// Fix: full-width support, proper min-height so buttons never feel tiny,
// hover lift effect, consistent padding across all sizes.
export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  fullWidth = false,
  className = '', style = {}, ...props
}) {
  const [hovered, setHovered] = useState(false)

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, border: 'none', borderRadius: 10, fontFamily: 'inherit',
    fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s ease', whiteSpace: 'nowrap',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : undefined,
    userSelect: 'none',
  }

  // Fixed: 'sm' was 7px top/bottom padding — too small for a tap target.
  // All sizes now meet a comfortable 36 px min-height.
  const sizes = {
    sm: { padding: '9px 16px',  fontSize: 13, minHeight: 36 },
    md: { padding: '11px 22px', fontSize: 14, minHeight: 40 },
    lg: { padding: '14px 28px', fontSize: 15, minHeight: 48 },
  }

  const variants = {
    primary: {
      background: hovered && !disabled && !loading
        ? 'linear-gradient(135deg,#818cf8,#a78bfa)'
        : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      color: '#fff',
      boxShadow: hovered && !disabled && !loading
        ? '0 6px 28px rgba(99,102,241,0.5)'
        : '0 4px 20px rgba(99,102,241,0.35)',
      transform: hovered && !disabled && !loading ? 'translateY(-1px)' : 'none',
    },
    secondary: {
      background: hovered && !disabled && !loading
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(255,255,255,0.06)',
      color: '#cbd5e1',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    danger: {
      background: hovered && !disabled && !loading
        ? 'rgba(239,68,68,0.25)'
        : 'rgba(239,68,68,0.15)',
      color: '#f87171',
      border: '1px solid rgba(239,68,68,0.3)',
    },
    ghost: {
      background: hovered && !disabled && !loading
        ? 'rgba(255,255,255,0.05)'
        : 'transparent',
      color: '#94a3b8',
    },
  }

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {loading && (
        <span
          className="animate-spin"
          style={{
            width: 15, height: 15,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input({
  label, error, hint, leftIcon, rightIcon, className = '', ...props
}, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.3 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {leftIcon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none',
          }}>
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            padding: leftIcon
              ? '12px 16px 12px 40px'
              : rightIcon
                ? '12px 40px 12px 16px'
                : '12px 16px',
            background: '#0f172a',
            border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10,
            color: '#f1f5f9',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border 0.18s',
            boxSizing: 'border-box',
            minHeight: 44,        // consistent tap target
          }}
          onFocus={e  => e.target.style.borderColor = error ? '#ef4444' : '#6366f1'}
          onBlur={e   => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.08)'}
          {...props}
        />
        {rightIcon && (
          <span style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#475569',
          }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>}
      {hint  && <span style={{ fontSize: 12, color: '#475569' }}>{hint}</span>}
    </div>
  )
})

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, options, value, onChange, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.3 }}>
          {label}
        </label>
      )}
      <select
        value={value} onChange={onChange}
        style={{
          width: '100%', padding: '12px 16px',
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, color: '#f1f5f9', fontSize: 14, fontFamily: 'inherit',
          cursor: 'pointer', outline: 'none', minHeight: 44,
        }}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: 24, ...style,
    }} {...props}>
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  purple: ['rgba(139,92,246,0.15)', 'rgba(139,92,246,0.35)', '#c4b5fd'],
  blue:   ['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.35)', '#a5b4fc'],
  teal:   ['rgba(6,182,212,0.15)',  'rgba(6,182,212,0.35)',  '#67e8f9'],
  green:  ['rgba(34,197,94,0.15)',  'rgba(34,197,94,0.35)',  '#86efac'],
  amber:  ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.35)', '#fde68a'],
  red:    ['rgba(239,68,68,0.15)',  'rgba(239,68,68,0.35)',  '#fca5a5'],
  gray:   ['rgba(100,116,139,0.15)','rgba(100,116,139,0.35)','#94a3b8'],
}
export function Badge({ children, color = 'blue', size = 'sm' }) {
  const [bg, border, text] = BADGE_COLORS[color] || BADGE_COLORS.blue
  return (
    <span style={{
      background: bg, border: `1px solid ${border}`, color: text,
      borderRadius: 6, padding: size === 'sm' ? '2px 8px' : '4px 12px',
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 600, whiteSpace: 'nowrap',
      lineHeight: 1.5,
    }}>{children}</span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 32, color = '#6366f1' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <div className="animate-spin" style={{
        width: size, height: size,
        border: `3px solid rgba(99,102,241,0.15)`,
        borderTopColor: color,
        borderRadius: '50%',
      }} />
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'error', children }) {
  const styles = {
    error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#fca5a5' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fde68a' },
    success: { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  color: '#86efac' },
    info:    { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc' },
  }
  const s = styles[type]
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: '12px 16px',
      color: s.color, fontSize: 13, lineHeight: 1.5,
    }}>{children}</div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      {label && <span style={{ color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#475569',
      textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

// ── CodeBlock ─────────────────────────────────────────────────────────────────
export function CodeBlock({ children }) {
  return (
    <pre style={{
      background: '#020817', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10, padding: 16, overflowX: 'auto',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
      color: '#86efac', lineHeight: 1.7, whiteSpace: 'pre-wrap',
    }}>{children}</pre>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
// New component — included on every page via App.jsx layout.
export function Footer() {
  const year = new Date().getFullYear()
  const links = [
    { label: 'Privacy', href: '#' },
    { label: 'Terms',   href: '#' },
    { label: 'GitHub',  href: '#' },
  ]
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(2,8,23,0.8)',
      backdropFilter: 'blur(12px)',
      padding: '18px 24px',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
            AI Mentor
          </span>
          <span style={{ fontSize: 12, color: '#334155' }}>
            © {year}
          </span>
        </div>

        {/* Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {links.map(l => (
            <a
              key={l.label}
              href={l.href}
              style={{
                fontSize: 12, color: '#475569', textDecoration: 'none',
                transition: 'color 0.18s',
              }}
              onMouseEnter={e => e.target.style.color = '#94a3b8'}
              onMouseLeave={e => e.target.style.color = '#475569'}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Tech stack badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {['Spring AI', 'Gemini', 'JWT', 'PostgreSQL'].map(t => (
            <span key={t} style={{
              fontSize: 10, fontWeight: 600, color: '#334155',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 4, padding: '2px 6px',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}
