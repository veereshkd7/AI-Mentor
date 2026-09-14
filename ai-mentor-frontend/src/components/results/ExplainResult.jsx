import { Badge, Card, SectionHeader, CodeBlock } from '../UI'

export default function ExplainResult({ data }) {
  if (!data) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <Card style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(99,102,241,0.05))', border: '1px solid rgba(6,182,212,0.2)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{data.title}</h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>{data.summary}</p>
      </Card>

      {data.concepts?.length > 0 && (
        <div>
          <SectionHeader>Core Concepts</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.concepts.map((c,i) => (
              <Card key={i}>
                <div style={{ fontWeight: 700, color: '#67e8f9', fontSize: 16, marginBottom: 8 }}>{c.name}</div>
                <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 10 }}>{c.explanation}</p>
                {c.analogy && (
                  <div style={{ background: 'rgba(99,102,241,0.08)', borderLeft: '3px solid #6366f1', padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: 10 }}>
                    <span style={{ color: '#a5b4fc', fontSize: 13 }}>🔍 Analogy: {c.analogy}</span>
                  </div>
                )}
                {c.example && <CodeBlock>{c.example}</CodeBlock>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.howItWorks && (
        <Card>
          <SectionHeader>How It Works</SectionHeader>
          <p style={{ color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data.howItWorks}</p>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {data.pros?.length > 0 && (
          <Card>
            <SectionHeader>✅ Advantages</SectionHeader>
            {data.pros.map((p,i) => <div key={i} style={{ color: '#4ade80', fontSize: 13, padding: '4px 0' }}>• {p}</div>)}
          </Card>
        )}
        {data.cons?.length > 0 && (
          <Card>
            <SectionHeader>⚠️ Limitations</SectionHeader>
            {data.cons.map((c,i) => <div key={i} style={{ color: '#fca5a5', fontSize: 13, padding: '4px 0' }}>• {c}</div>)}
          </Card>
        )}
      </div>

      {data.codeExample && (
        <Card>
          <SectionHeader>Code Example</SectionHeader>
          <CodeBlock>{data.codeExample}</CodeBlock>
        </Card>
      )}

      {data.useCases?.length > 0 && (
        <Card>
          <SectionHeader>Use Cases</SectionHeader>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.useCases.map((u,i) => <Badge key={i} color="teal">{u}</Badge>)}
          </div>
        </Card>
      )}

      {data.commonMistakes?.length > 0 && (
        <Card>
          <SectionHeader>Common Mistakes</SectionHeader>
          {data.commonMistakes.map((m,i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < data.commonMistakes.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span>❌</span>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>{m}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
