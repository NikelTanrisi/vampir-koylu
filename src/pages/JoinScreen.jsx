// src/pages/JoinScreen.jsx
import React, { useState } from 'react'
import { ref, set, get, push, update } from 'firebase/database'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function JoinScreen({ db, onJoin, onBack }) {
  const [tab, setTab] = useState('join') // join | create
  const [name, setName] = useState(localStorage.getItem('vk_name') || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    if (!name.trim()) { setError('İsim gir'); return }
    if (!code.trim()) { setError('Oda kodu gir'); return }
    setLoading(true); setError('')
    try {
      const roomRef = ref(db, `rooms/${code.toUpperCase()}`)
      const snap = await get(roomRef)
      if (!snap.exists()) { setError('Oda bulunamadı'); setLoading(false); return }
      const room = snap.val()
      if (room.phase !== 'lobby') { setError('Oyun başlamış, katılamazsın'); setLoading(false); return }

      // Add player
      const pid = Date.now().toString(36) + Math.random().toString(36).slice(2)
      await set(ref(db, `rooms/${code.toUpperCase()}/players/${pid}`), {
        id: pid, name: name.trim(), joinedAt: Date.now(), dead: false, left: false
      })
      onJoin(code.toUpperCase(), pid, name.trim(), false)
    } catch (e) {
      setError('Bağlantı hatası')
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) { setError('İsim gir'); return }
    setLoading(true); setError('')
    try {
      const roomCode = generateCode()
      const pid = Date.now().toString(36) + Math.random().toString(36).slice(2)
      await set(ref(db, `rooms/${roomCode}`), {
        id: roomCode,
        adminId: pid,
        phase: 'lobby',
        createdAt: Date.now(),
        roleConfig: { vampire: 1, doctor: 1 },
        players: {
          [pid]: { id: pid, name: name.trim(), joinedAt: Date.now(), dead: false, left: false }
        }
      })
      onJoin(roomCode, pid, name.trim(), true)
    } catch (e) {
      setError('Bağlantı hatası')
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ width: 'auto' }}>← Geri</button>
        <span className="game-title">VAMPİR KÖYLÜ</span>
        <span style={{ width: 60 }} />
      </div>

      <div className="screen-inner">
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className={`btn ${tab === 'join' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('join')}
            style={{ flex: 1, padding: '11px' }}
          >Odaya Katıl</button>
          <button
            className={`btn ${tab === 'create' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('create')}
            style={{ flex: 1, padding: '11px' }}
          >Oda Oluştur</button>
        </div>

        {/* Name */}
        <div className="gap">
          <div className="label">Adın</div>
          <input
            type="text"
            placeholder="Adını gir..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={16}
            autoComplete="off"
          />
        </div>

        {tab === 'join' ? (
          <>
            <div className="gap">
              <div className="label">Oda Kodu</div>
              <input
                type="text"
                placeholder="Örn: XKQR2"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={5}
                autoComplete="off"
                style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '22px', textAlign: 'center' }}
              />
            </div>
            {error && <p style={{ color: '#c44', marginBottom: 12, fontSize: 14, textAlign: 'center' }}>{error}</p>}
            <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
              {loading ? 'Katılıyor...' : 'Odaya Katıl'}
            </button>
          </>
        ) : (
          <>
            <div className="info-bar">
              Oda oluşturduğunda admin olursun. Diğerleri oda kodunu girerek katılır.
            </div>
            {error && <p style={{ color: '#c44', marginBottom: 12, fontSize: 14, textAlign: 'center' }}>{error}</p>}
            <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Oda Oluştur'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
