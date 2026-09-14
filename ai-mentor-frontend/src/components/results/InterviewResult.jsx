import { useState } from 'react'
import { Badge, Card, SectionHeader } from '../UI'

const DIFF_COLOR = { easy: 'green', medium: 'amber', hard: 'red' }
const CAT_COLOR  = { conceptual: 'blue', behavioral: 'purple', coding: 'teal', 'system-design': 'amber' }

export default function InterviewResult({ data }) {
  const [expanded, setExpanded] = useState(null)
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <Card style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(99,102,241,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{data.title}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge color="purple">{data.totalQuestions} Questions</Badge>
          <Badge color="blue">{data.level}</Badge>
        </div>
      </Card>

      <div>
        <SectionHeader>Interview Questions</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.questions?.map((q, i) => (
            <div key={i} style={{
              background: '#0f172a', border: `1px solid ${expanded === i ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 12, overflow: 'hidden', transition: 'border 0.2s',
            }}>
              {/* Question header */}
              <div
                onClick={() => setExpanded(expanded === i ? null : i)}
                style={{ padding: 18, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Badge color={CAT_COLOR[q.category] || 'gray'} size="sm">{q.category}</Badge>
                    <Badge color={DIFF_COLOR[q.difficulty] || 'gray'} size="sm">{q.difficulty}</Badge>
                  </div>
                  <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 600, lineHeight: 1.5, fontSize: 14 }}>
                    Q{q.id}. {q.question}
                  </p>
                </div>
                <div style={{ color: expanded === i ? '#6366f1' : '#475569', fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                  {expanded === i ? '−' : '+'}
                </div>
              </div>

              {/* Answer panel */}
              {expanded === i && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Model Answer</div>
                    <p style={{ color: '#cbd5e1', lineHeight: 1.75, margin: 0 }}>{q.answer}</p>
                  </div>

                  {q.keyPoints?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Key Points</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {q.keyPoints.map((kp, j) => (
                          <div key={j} style={{ display: 'flex', gap: 8 }}>
                            <span style={{ color: '#6366f1', flexShrink: 0 }}>▸</span>
                            <span style={{ color: '#a5b4fc', fontSize: 13 }}>{kp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.tips && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
                      <span style={{ color: '#fde68a', fontSize: 13 }}>💡 {q.tips}</span>
                    </div>
                  )}

                  {q.redFlags && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 10 }}>
                      <span style={{ color: '#fca5a5', fontSize: 13 }}>🚩 Avoid: {q.redFlags}</span>
                    </div>
                  )}

                  {q.followUp && (
                    <div style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>
                      🔄 Follow-up: <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>{q.followUp}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {data.generalTips?.length > 0 && (
        <Card>
          <SectionHeader>General Interview Tips</SectionHeader>
          {data.generalTips.map((t,i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < data.generalTips.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ color: '#22c55e' }}>✦</span>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>{t}</span>
            </div>
          ))}
        </Card>
      )}

      {data.topicsToRevise?.length > 0 && (
        <Card>
          <SectionHeader>Topics to Revise</SectionHeader>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.topicsToRevise.map((t,i) => <Badge key={i} color="purple">{t}</Badge>)}
          </div>
        </Card>
      )}
    </div>
  )
}
