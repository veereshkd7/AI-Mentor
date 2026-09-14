import { useState, useCallback } from 'react'
import { mentorApi } from '../services/api'
import toast from 'react-hot-toast'

// Map backend session type enum → frontend tab id
const TYPE_TO_TAB = {
  ROADMAP:      'roadmap',
  EXPLANATION:  'explain',
  INTERVIEW_QA: 'interview',
  QUIZ:         'quiz',
}

export function useMentor() {
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState(null)
  const [error,       setError]       = useState(null)
  const [history,     setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(false)

  // ── Generate ────────────────────────────────────────────────────────────────
  const generate = useCallback(async (type, topic, level, questionCount = 10) => {
    setLoading(true)
    setError(null)
    setResult(null)

    const payload = { topic, level, questionCount }
    const apiCall = {
      roadmap:   () => mentorApi.roadmap(payload),
      explain:   () => mentorApi.explain(payload),
      interview: () => mentorApi.interview(payload),
      quiz:      () => mentorApi.quiz(payload),
    }[type]

    if (!apiCall) {
      setLoading(false)
      setError('Unknown session type: ' + type)
      return null
    }

    try {
      const { data } = await apiCall()
      const resultObj = buildResultObj(data, type)
      setResult(resultObj)
      return resultObj
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate content. Please try again.'
      setError(msg)
      toast.error(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // ── History ─────────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const { data } = await mentorApi.history()
      setHistory(data)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setHistLoading(false)
    }
  }, [])

  // ── Load session (called when user clicks "View" in history) ────────────────
  /**
   * Loads a past session.  Returns { resultObj, tabId } so DashboardPage can
   * switch to the right tab AFTER state is set (avoids a race condition).
   *
   * Strategy:
   *   1. If the history item already carries a cloudinaryUrl, fetch the full
   *      JSON directly from Cloudinary (no extra backend round-trip).
   *   2. Otherwise fall back to GET /mentor/history/{id} which does the same
   *      Cloudinary fetch on the backend.
   */
  const loadSession = useCallback(async (sessionItem) => {
    setLoading(true)
    setError(null)

    try {
      let content = null
      let sessionData = null

      // Path A: fetch full JSON straight from Cloudinary
      if (sessionItem.cloudinaryUrl) {
        try {
          const resp = await fetch(sessionItem.cloudinaryUrl)
          if (resp.ok) {
            content = await resp.text()
          }
        } catch {
          // fall through to Path B
        }
      }

      // Path B: backend fetches from Cloudinary for us
      if (!content) {
        const { data } = await mentorApi.getSession(sessionItem.id)
        sessionData = data
        content = data.content
      }

      const type   = TYPE_TO_TAB[sessionItem.sessionType] || sessionItem.sessionType?.toLowerCase()
      const topic  = sessionItem.topic
      const level  = sessionItem.skillLevel

      let parsed
      try { parsed = JSON.parse(content) } catch { parsed = { raw: content } }

      const resultObj = {
        sessionId:    sessionItem.id,
        type,
        topic,
        level,
        durationMs:   sessionItem.durationMs,
        createdAt:    sessionItem.createdAt,
        cloudinaryUrl: sessionItem.cloudinaryUrl,
        data: parsed,
      }

      setResult(resultObj)
      return { resultObj, tabId: type }
    } catch (err) {
      toast.error('Failed to load session')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteSession = useCallback(async (id) => {
    try {
      await mentorApi.deleteSession(id)
      setHistory(h => h.filter(s => s.id !== id))
      toast.success('Session deleted')
    } catch {
      toast.error('Failed to delete session')
    }
  }, [])

  // ── Clear ───────────────────────────────────────────────────────────────────
  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    loading, result, error, history, histLoading,
    generate, loadHistory, loadSession, deleteSession, clearResult,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildResultObj(data, type) {
  let parsed
  try { parsed = JSON.parse(data.content) } catch { parsed = { raw: data.content } }
  return {
    sessionId:    data.sessionId,
    type,
    topic:        data.topic,
    level:        data.level,
    durationMs:   data.durationMs,
    createdAt:    data.createdAt,
    cloudinaryUrl: data.cloudinaryUrl,
    data: parsed,
  }
}
