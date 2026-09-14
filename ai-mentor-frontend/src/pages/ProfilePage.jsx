import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../services/api'
import { Card, Input, Button, Alert, Spinner, Badge } from '../components/UI'
import toast from 'react-hot-toast'

function Section({ title, children }) {
  return (
    <Card style={{ marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#e2e8f0',
        borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
        {title}
      </h3>
      {children}
    </Card>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile,       setProfile]       = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Update form state
  const [upForm,  setUpForm]  = useState({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [upError, setUpError] = useState('')
  const [upSaving, setUpSaving] = useState(false)
  const [showCurr, setShowCurr] = useState(false)
  const [showNew,  setShowNew]  = useState(false)

  // Delete form state
  const [delPassword,  setDelPassword]  = useState('')
  const [delConfirm,   setDelConfirm]   = useState('')
  const [delError,     setDelError]     = useState('')
  const [deleting,     setDeleting]     = useState(false)
  const [showDelModal, setShowDelModal] = useState(false)
  const [showDelPw,    setShowDelPw]    = useState(false)

  useEffect(() => {
    userApi.getProfile()
      .then(({ data }) => { setProfile(data); setUpForm(f => ({ ...f, email: data.email })) })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setProfileLoading(false))
  }, [])

  // ── Update profile ──────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpError('')

    if (!upForm.currentPassword) { setUpError('Current password is required'); return }
    if (upForm.newPassword && upForm.newPassword !== upForm.confirmPassword) {
      setUpError('New passwords do not match'); return
    }
    if (upForm.newPassword && upForm.newPassword.length < 8) {
      setUpError('New password must be at least 8 characters'); return
    }

    const payload = { currentPassword: upForm.currentPassword }
    if (upForm.email && upForm.email !== profile?.email) payload.email = upForm.email
    if (upForm.newPassword) payload.newPassword = upForm.newPassword

    if (!payload.email && !payload.newPassword) {
      setUpError('No changes to save — update your email or enter a new password'); return
    }

    setUpSaving(true)
    try {
      const { data } = await userApi.updateProfile(payload)
      setProfile(data)
      setUpForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
      toast.success('Profile updated!')
      // If password changed, sign out since all tokens are invalidated
      if (upForm.newPassword) {
        toast('Password changed — please sign in again', { icon: '🔒' })
        setTimeout(async () => { await logout(); navigate('/login') }, 1800)
      }
    } catch (err) {
      setUpError(err.response?.data?.message || 'Update failed')
    } finally {
      setUpSaving(false)
    }
  }

  // ── Delete account ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDelError('')
    if (!delPassword) { setDelError('Password is required'); return }
    if (delConfirm !== 'DELETE') { setDelError('Type DELETE to confirm'); return }

    setDeleting(true)
    try {
      await userApi.deleteAccount(delPassword)
      toast.success('Account deleted')
      await logout()
      navigate('/login')
    } catch (err) {
      setDelError(err.response?.data?.message || 'Deletion failed. Check your password.')
    } finally {
      setDeleting(false)
    }
  }

  if (profileLoading) return <div style={{ padding: 40 }}><Spinner /></div>

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* ── Stats banner ─────────────────────────────────────────────────────── */}
      <Section title="👤 Account Overview">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <StatBox label="Username"       value={profile?.username} />
          <StatBox label="Email"          value={profile?.email} />
          <StatBox label="Sessions"       value={profile?.totalSessions ?? 0} />
          <StatBox label="Member since"   value={fmt(profile?.createdAt)} />
          <StatBox label="Last login"     value={fmt(profile?.lastLogin)} />
        </div>
      </Section>

      {/* ── Update profile ────────────────────────────────────────────────────── */}
      <Section title="✏️ Update Profile">
        <form onSubmit={handleUpdate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email address"
              type="email"
              value={upForm.email}
              onChange={e => setUpForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
            />

            <Input
              label="Current password *"
              type={showCurr ? 'text' : 'password'}
              value={upForm.currentPassword}
              onChange={e => setUpForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Required to save any change"
              rightIcon={
                <button type="button" onClick={() => setShowCurr(v => !v)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                  {showCurr ? '🙈' : '👁️'}
                </button>
              }
            />

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
              <p style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                Leave blank to keep the current password
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input
                  label="New password"
                  type={showNew ? 'text' : 'password'}
                  value={upForm.newPassword}
                  onChange={e => setUpForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min 8 characters"
                  rightIcon={
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                      {showNew ? '🙈' : '👁️'}
                    </button>
                  }
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={upForm.confirmPassword}
                  onChange={e => setUpForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            {upError && <Alert type="error">{upError}</Alert>}

            <Button type="submit" loading={upSaving} size="md" style={{ alignSelf: 'flex-start' }}>
              Save changes
            </Button>
          </div>
        </form>
      </Section>

      {/* ── Danger zone ───────────────────────────────────────────────────────── */}
      <Card style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#f87171' }}>
          ⚠️ Danger Zone
        </h3>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          Permanently delete your account, all sessions, and all stored results from Cloudinary.
          This cannot be undone.
        </p>
        <Button variant="danger" size="sm" onClick={() => setShowDelModal(true)}>
          Delete my account
        </Button>
      </Card>

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {showDelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 16, padding: 28, width: '100%', maxWidth: 420,
          }}>
            <h3 style={{ margin: '0 0 8px', color: '#f87171', fontSize: 17 }}>Delete Account</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              This will permanently delete your account and all {profile?.totalSessions ?? 0} session
              {profile?.totalSessions !== 1 ? 's' : ''}. You cannot undo this.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Your password"
                type={showDelPw ? 'text' : 'password'}
                value={delPassword}
                onChange={e => setDelPassword(e.target.value)}
                placeholder="Confirm with your password"
                rightIcon={
                  <button type="button" onClick={() => setShowDelPw(v => !v)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                    {showDelPw ? '🙈' : '👁️'}
                  </button>
                }
              />
              <Input
                label='Type DELETE to confirm'
                value={delConfirm}
                onChange={e => setDelConfirm(e.target.value)}
                placeholder="DELETE"
              />
              {delError && <Alert type="error">{delError}</Alert>}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Button variant="danger" loading={deleting} onClick={handleDelete} size="md">
                Yes, delete my account
              </Button>
              <Button variant="secondary" size="md"
                onClick={() => { setShowDelModal(false); setDelPassword(''); setDelConfirm(''); setDelError('') }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div style={{
      flex: '1 1 140px', background: 'rgba(99,102,241,0.07)',
      border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{value ?? '—'}</div>
    </div>
  )
}

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-US',
    { day: 'numeric', month: 'short', year: 'numeric' })
}
