import { useState, useEffect, useRef } from 'react'
import { Badge, Card, SectionHeader, Button } from '../UI'

export default function QuizResult({ data }) {
  const [answers,   setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft,  setTimeLeft]  = useState((data?.timeLimit || 15) * 60)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const handleSubmit = () => {
    clearInterval(timerRef.current)
    setSubmitted(true)
  }

  if (!data) return null

  const questions    = data.questions || []
  const totalQ       = questions.length
  const answered     = Object.keys(answers).length
  const score        = submitted ? questions.reduce((acc, q) => acc + (answers[q.id] === q.correctAnswer ? 1 : 0), 0) : 0
  const pct          = submitted ? Math.round((score / totalQ) * 100) : 0
  const passing      = data.passingScore || 70
  const passed       = pct >= passing

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  const isLowTime = timeLeft < 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <Card style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(99,102,241,0.05))', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{data.title}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge color="green">{totalQ} Questions</Badge>
              <Badge color="blue">{data.difficulty}</Badge>
              <Badge color="amber">Pass: {passing}%</Badge>
            </div>
          </div>
          {!submitted && (
            <div style={{
              background: isLowTime ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${isLowTime ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)'}`,
              borderRadius: 12, padding: '12px 20px', textAlign: 'center',
              animation: isLowTime ? 'pulse 1s ease infinite' : 'none',
            }}>
              <div style={{ fontSize: 10, color: isLowTime ? '#f87171' : '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Time Left</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: isLowTime ? '#f87171' : '#a5b4fc' }}>{fmt(timeLeft)}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Score panel (after submit) */}
      {submitted && (
        <Card style={{
          background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `2px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>{passed ? '🏆' : '📚'}</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: passed ? '#4ade80' : '#f87171', marginBottom: 6 }}>{pct}%</div>
          <div style={{ color: '#94a3b8', fontSize: 15 }}>
            {score} / {totalQ} correct — {passed ? 'PASSED! Great work!' : `Need ${passing}% to pass. Keep studying!`}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Badge color={passed ? 'green' : 'red'}>{passed ? '✓ Passed' : '✗ Failed'}</Badge>
            <Badge color="blue">Score: {score}/{totalQ}</Badge>
            <Badge color="amber">Accuracy: {pct}%</Badge>
          </div>
        </Card>
      )}

      {/* Progress bar */}
      {!submitted && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#64748b' }}>
            <span>{answered} of {totalQ} answered</span>
            <span>{Math.round((answered/totalQ)*100)}% complete</span>
          </div>
          <div style={{ height: 4, background: '#1e293b', borderRadius: 2 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${(answered/totalQ)*100}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {questions.map((q, i) => {
          const selected  = answers[q.id]
          const isCorrect = selected === q.correctAnswer
          return (
            <Card key={i}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <Badge color="gray" size="sm">Q{q.id}</Badge>
                {q.difficulty && <Badge color={{ easy:'green', medium:'amber', hard:'red' }[q.difficulty] || 'gray'} size="sm">{q.difficulty}</Badge>}
                {q.topic && <Badge color="blue" size="sm">{q.topic}</Badge>}
                {submitted && <Badge color={isCorrect ? 'green' : 'red'} size="sm">{isCorrect ? '✓ Correct' : '✗ Wrong'}</Badge>}
              </div>
              <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>{q.question}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(q.options || {}).map(([key, val]) => {
                  const isSel = selected === key
                  const isAns = q.correctAnswer === key
                  let bg = 'rgba(255,255,255,0.02)', border = 'rgba(255,255,255,0.07)', color = '#cbd5e1'
                  if (submitted) {
                    if (isAns)         { bg = 'rgba(34,197,94,0.1)';  border = 'rgba(34,197,94,0.35)';  color = '#86efac' }
                    else if (isSel)    { bg = 'rgba(239,68,68,0.1)';  border = 'rgba(239,68,68,0.35)';  color = '#fca5a5' }
                  } else if (isSel)    { bg = 'rgba(99,102,241,0.12)'; border = 'rgba(99,102,241,0.4)'; color = '#a5b4fc' }

                  return (
                    <button key={key}
                      onClick={() => !submitted && setAnswers(a => ({ ...a, [q.id]: key }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', background: bg,
                        border: `1px solid ${border}`, borderRadius: 10,
                        color, cursor: submitted ? 'default' : 'pointer',
                        textAlign: 'left', fontSize: 14, fontFamily: 'inherit',
                        transition: 'all 0.15s', width: '100%',
                      }}>
                      <span style={{ fontWeight: 700, minWidth: 20, flexShrink: 0 }}>{key}.</span>
                      <span style={{ flex: 1 }}>{val}</span>
                      {submitted && isAns && <span style={{ flexShrink: 0, color: '#4ade80' }}>✓</span>}
                      {submitted && isSel && !isAns && <span style={{ flexShrink: 0, color: '#f87171' }}>✗</span>}
                    </button>
                  )
                })}
              </div>

              {submitted && q.explanation && (
                <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                  <span style={{ color: '#a5b4fc', fontSize: 13 }}>💡 {q.explanation}</span>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Submit button */}
      {!submitted && (
        <Button
          onClick={handleSubmit}
          size="lg"
          style={{ width: '100%' }}
          disabled={answered === 0}
        >
          Submit Quiz ({answered}/{totalQ} answered)
        </Button>
      )}
    </div>
  )
}
