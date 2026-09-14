import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMentor } from '../hooks/useMentor'
import { Spinner, Alert } from '../components/UI'
import InputPanel     from '../components/InputPanel'
import RoadmapResult  from '../components/results/RoadmapResult'
import ExplainResult  from '../components/results/ExplainResult'
import InterviewResult from '../components/results/InterviewResult'
import QuizResult     from '../components/results/QuizResult'
import HistoryPanel   from '../components/HistoryPanel'
import ProfilePage    from './ProfilePage'

const TABS = [
  { id: 'roadmap',   label: 'Roadmap',   icon: '🗺️', desc: 'Phased learning plan'  },
  { id: 'explain',   label: 'Explain',   icon: '💡', desc: 'In-depth explanation'  },
  { id: 'interview', label: 'Interview', icon: '🎤', desc: 'Q&A preparation'       },
  { id: 'quiz',      label: 'Quiz',      icon: '📝', desc: 'Test your knowledge'   },
  { id: 'history',   label: 'History',   icon: '📚', desc: 'Past sessions'         },
  { id: 'profile',   label: 'Profile',   icon: '👤', desc: 'Account & settings'    },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab,   setActiveTab]   = useState('roadmap')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const {
    loading, result, error, history, histLoading,
    generate, loadHistory, loadSession, deleteSession, clearResult,
  } = useMentor()

  const handleTabChange = (id) => {
    setActiveTab(id)
    clearResult()
    if (id === 'history') loadHistory()
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  const renderResult = () => {
    if (!result) return null
    const p = { data: result.data, topic: result.topic, level: result.level, durationMs: result.durationMs }
    switch (result.type) {
      case 'roadmap':   return <RoadmapResult   {...p} />
      case 'explain':   return <ExplainResult   {...p} />
      case 'interview': return <InterviewResult {...p} />
      case 'quiz':      return <QuizResult      {...p} />
      default: return (
        <pre style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )
    }
  }

  const isToolTab = ['roadmap','explain','interview','quiz'].includes(activeTab)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#020817' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? 240 : 64, flexShrink: 0,
        background: '#080f1f', borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/>
            </svg>
          </div>
          {sidebarOpen && <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3, whiteSpace: 'nowrap' }}>AI Mentor</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {sidebarOpen && (
            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase',
              letterSpacing: 1.5, padding: '4px 8px', marginBottom: 4 }}>Features</div>
          )}
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              title={!sidebarOpen ? tab.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: sidebarOpen ? '10px 12px' : '10px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                color:      activeTab === tab.id ? '#a5b4fc' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: 14, transition: 'all 0.15s', width: '100%', textAlign: 'left',
                borderLeft: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{tab.icon}</span>
              {sidebarOpen && (
                <div>
                  <div>{tab.label}</div>
                  <div style={{ fontSize: 11, color: '#334155', fontWeight: 400 }}>{tab.desc}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Security badge */}
        {sidebarOpen && (
          <div style={{ margin: '0 8px 8px', padding: 12, background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🔐 Security</div>
            {['JWT HS512','BCrypt ×12','Rate Limited','Audit Log','XSS Guard','CORS'].map(s => (
              <div key={s} style={{ fontSize: 11, color: '#22c55e', padding: '1px 0' }}>✓ {s}</div>
            ))}
          </div>
        )}

        {/* User / logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => handleTabChange('profile')}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{user?.username}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{user?.email}</div>
                </div>
              </button>
              <button onClick={handleLogout} title="Logout"
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <button onClick={() => handleTabChange('profile')} title="Profile"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#64748b' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </button>
              <button onClick={handleLogout} title="Logout"
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(8,15,31,0.8)', backdropFilter: 'blur(12px)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(v => !v)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                padding: 6, borderRadius: 6, display: 'flex' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>
                {TABS.find(t => t.id === activeTab)?.icon}{' '}
                {TABS.find(t => t.id === activeTab)?.label}
              </span>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#475569' }}>
                {TABS.find(t => t.id === activeTab)?.desc}
              </span>
            </div>
          </div>
          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8',
            fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>BETA</span>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {activeTab === 'history' && (
            <HistoryPanel
              history={history}
              loading={histLoading}
              onLoad={loadSession}
              onDelete={deleteSession}
              onViewResult={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === 'profile' && <ProfilePage />}

          {isToolTab && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <InputPanel activeTab={activeTab} onGenerate={(topic, level, qc) => generate(activeTab, topic, level, qc)} loading={loading} />
              {loading && <div style={{ marginTop: 24 }}><Spinner /></div>}
              {error && !loading && <div style={{ marginTop: 16 }}><Alert type="error">{error}</Alert></div>}
              {result && !loading && (
                <div style={{ marginTop: 24 }} className="animate-fadeUp">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={clearResult} style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#64748b', borderRadius: 8, padding: '6px 14px',
                      cursor: 'pointer', fontSize: 13 }}>
                      ✕ Clear
                    </button>
                  </div>
                  {renderResult()}
                </div>
              )}
              {!result && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#1e293b' }}>
                  <div style={{ fontSize: 72, marginBottom: 16, filter: 'grayscale(0.5) opacity(0.4)' }}>
                    {TABS.find(t => t.id === activeTab)?.icon}
                  </div>
                  <p style={{ fontSize: 15 }}>Enter a topic above and hit Generate</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
