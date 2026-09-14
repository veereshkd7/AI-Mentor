import { Badge, Card, SectionHeader, CodeBlock } from '../UI'

const PHASE_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ec4899']

export default function RoadmapResult({ data }) {
  if (!data) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: -0.3 }}>{data.title}</h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 14 }}>{data.overview}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {data.estimatedTime && <Badge color="purple">⏱ {data.estimatedTime}</Badge>}
          {data.careerPaths?.slice(0,3).map((p,i) => <Badge key={i} color="teal">💼 {p}</Badge>)}
        </div>
      </Card>

      {/* Prerequisites */}
      {data.prerequisites?.length > 0 && (
        <Card>
          <SectionHeader>Prerequisites</SectionHeader>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.prerequisites.map((p,i) => <Badge key={i} color="gray">{p}</Badge>)}
          </div>
        </Card>
      )}

      {/* Phases */}
      <div>
        <SectionHeader>Learning Phases</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.phases?.map((phase, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${PHASE_COLORS[i % PHASE_COLORS.length]}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: PHASE_COLORS[i % PHASE_COLORS.length] + '22',
                  border: `1px solid ${PHASE_COLORS[i % PHASE_COLORS.length]}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16, color: PHASE_COLORS[i % PHASE_COLORS.length],
                }}>{phase.phase}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{phase.title}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>⏱ {phase.duration}</div>
                </div>
              </div>
              <p style={{ color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 }}>{phase.description}</p>

              {phase.topics?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6 }}>TOPICS</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {phase.topics.map((t,j) => <Badge key={j} color="gray" size="sm">{t}</Badge>)}
                  </div>
                </div>
              )}

              {phase.resources?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6 }}>RESOURCES</div>
                  {phase.resources.map((r,j) => <div key={j} style={{ color: '#818cf8', fontSize: 13, padding: '2px 0' }}>→ {r}</div>)}
                </div>
              )}

              {phase.milestone && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
                  <span style={{ color: '#4ade80', fontSize: 13 }}>🎯 Milestone: {phase.milestone}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Tools */}
      {data.tools?.length > 0 && (
        <Card>
          <SectionHeader>Tools & Technologies</SectionHeader>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.tools.map((t,i) => <Badge key={i} color="blue">{t}</Badge>)}
          </div>
        </Card>
      )}

      {/* Tips */}
      {data.tips?.length > 0 && (
        <Card>
          <SectionHeader>Pro Tips</SectionHeader>
          {data.tips.map((tip,i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < data.tips.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ color: '#f59e0b', flexShrink: 0 }}>💡</span>
              <span style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
