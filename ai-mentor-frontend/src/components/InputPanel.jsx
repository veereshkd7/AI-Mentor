import { useState } from 'react'
import { Button, Input, Select, Card } from './UI'

const PLACEHOLDER = {
  roadmap:   'e.g. Machine Learning, Spring Boot, React',
  explain:   'e.g. React Hooks, JWT Authentication, Docker',
  interview: 'e.g. System Design, Java Concurrency, SQL',
  quiz:      'e.g. JavaScript Closures, REST API Design',
}

export default function InputPanel({ activeTab, onGenerate, loading }) {
  const [topic,         setTopic]         = useState('')
  const [level,         setLevel]         = useState('intermediate')
  const [questionCount, setQuestionCount] = useState(10)
  const [error,         setError]         = useState('')

  const showCount = activeTab === 'interview' || activeTab === 'quiz'

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!topic.trim()) { setError('Please enter a topic'); return }
    setError('')
    onGenerate(topic.trim(), level, questionCount)
  }

  return (
    <Card style={{ marginBottom: 0 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>

          {/* Topic */}
          <div style={{ flex: '2 1 220px' }}>
            <Input
              label="Topic"
              value={topic}
              onChange={e => { setTopic(e.target.value); setError('') }}
              placeholder={PLACEHOLDER[activeTab] || 'Enter a topic…'}
              error={error}
              autoFocus
            />
          </div>

          {/* Level */}
          <div style={{ flex: '1 1 140px' }}>
            <Select
              label="Skill Level"
              value={level}
              onChange={e => setLevel(e.target.value)}
              options={[
                { value: 'beginner',     label: '🌱 Beginner' },
                { value: 'intermediate', label: '🔥 Intermediate' },
                { value: 'advanced',     label: '⚡ Advanced' },
              ]}
            />
          </div>

          {/* Question count — only for interview & quiz */}
          {showCount && (
            <div style={{ flex: '0 1 130px' }}>
              <Select
                label="Questions"
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                options={[5,8,10,12,15,20].map(n => ({ value: n, label: `${n} questions` }))}
              />
            </div>
          )}

          {/* Generate button */}
          <div style={{ flex: '0 0 auto', paddingBottom: error ? 18 : 0 }}>
            <Button type="submit" size="md" loading={loading} disabled={!topic.trim()}>
              ✨ Generate
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
