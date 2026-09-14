import { Badge, Card, Spinner } from './UI'

const TYPE_META = {
  ROADMAP:      { icon: '🗺️', label: 'Roadmap',   color: 'purple' },
  EXPLANATION:  { icon: '💡', label: 'Explain',   color: 'teal'   },
  INTERVIEW_QA: { icon: '🎤', label: 'Interview', color: 'blue'   },
  QUIZ:         { icon: '📝', label: 'Quiz',      color: 'green'  },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  )
}

function formatDuration(ms) {
  if (!ms) return ''
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

/**
 * HistoryPanel
 *
 * Props:
 *   history      — array of SessionHistoryResponse (includes cloudinaryUrl)
 *   loading      — boolean
 *   onLoad       — async (sessionItem) => { resultObj, tabId }
 *   onDelete     — async (id) => void
 *   onViewResult — (tabId) => void  — called AFTER result is in state
 */
export default function HistoryPanel({ history, loading, onLoad, onDelete, onViewResult }) {
  if (loading) return <Spinner />

  const handleView = async (session) => {
    // onLoad sets result in state AND returns the correct tabId
    const loaded = await onLoad(session)
    if (loaded?.tabId) {
      onViewResult(loaded.tabId)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📚 Session History</h2>
        <Badge color="gray">{history.length} session{history.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Empty state */}
      {history.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.3 }}>📭</div>
          <p style={{ color: '#475569', fontSize: 15 }}>No sessions yet. Start learning!</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((session) => {
            const meta = TYPE_META[session.sessionType] || {
              icon: '📄', label: session.sessionType, color: 'gray',
            }
            return (
              <Card
                key={session.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px', transition: 'border-color 0.15s',
                }}
              >
                {/* Type icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20,
                }}>
                  {meta.icon}
                </div>

                {/* Session info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, color: '#e2e8f0', fontSize: 14,
                    marginBottom: 4, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {session.topic}
                  </div>
                  <div style={{
                    display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
                  }}>
                    <Badge color={meta.color} size="sm">{meta.label}</Badge>
                    {session.skillLevel && (
                      <Badge color="gray" size="sm">{session.skillLevel}</Badge>
                    )}
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      {formatDate(session.createdAt)}
                    </span>
                    {session.durationMs > 0 && (
                      <span style={{ fontSize: 12, color: '#334155' }}>
                        ⚡ {formatDuration(session.durationMs)}
                      </span>
                    )}
                    {session.cloudinaryUrl && (
                      <span style={{ fontSize: 11, color: '#22c55e' }} title="Full result stored in Cloudinary">
                        ☁️ saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {/* View — loads full content from Cloudinary then switches tab */}
                  <button
                    onClick={() => handleView(session)}
                    style={{
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      color: '#a5b4fc', borderRadius: 8, padding: '6px 14px',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                  >
                    View
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(session.id)}
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#f87171', borderRadius: 8, padding: '6px 10px',
                      cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    title="Delete session"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
