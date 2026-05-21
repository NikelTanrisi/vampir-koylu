// src/pages/LobbyScreen.jsx
import React, { useState } from 'react'
import { ref, update, set } from 'firebase/database'
import { assignRoles } from '../utils/gameLogic'

export default function LobbyScreen({ db, roomId, playerId, isAdmin, gameState, onLeave }) {
  const [copying, setCopying] = useState(false)

  if (!gameState) return (
    <div className="screen">
      <div className="night-overlay">
        <div className="moon">🌙</div>
        <p style={{ color: 'var(--text3)', marginTop: 16 }}>Bağlanıyor...</p>
      </div>
    </div>
  )

  const players = Object.values(gameState.players || {}).filter(p => !p.left)
  const roleConfig = gameState.roleConfig || { vampire: 1, doctor: 1 }
  const totalActive = (roleConfig.vampire || 0) + (roleConfig.doctor || 0)
  const canStart = isAdmin && players.length >= 3 && totalActive < players.length

  const copyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopying(true)
      setTimeout(() => setCopying(false), 1500)
    })
  }

  const updateRole = (role, delta) => {
    const current = roleConfig[role] || 0
    const next = Math.max(0, current + delta)
    update(ref(db, `rooms/${roomId}/roleConfig`), { [role]: next })
  }

  const startGame = async () => {
    const roles = assignRoles(players, roleConfig)
    await update(ref(db, `rooms/${roomId}`), {
      roles,
      phase: 'role_reveal',
      round: 1,
      log: []
    })
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="game-title">VAMPİR KÖYLÜ</span>
        <span className="phase-badge">LOBİ</span>
        <button className="btn btn-ghost btn-sm" onClick={onLeave} style={{ width: 'auto' }}>Çık</button>
      </div>

      <div className="screen-inner">
        {/* Room code */}
        <div className="card">
          <div className="card-title">Oda Kodu</div>
          <div className="copy-box" onClick={copyCode} style={{ cursor: 'pointer' }}>
            {roomId}
          </div>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text3)' }}>
            {copying ? '✓ Kopyalandı!' : 'Arkadaşlarına bu kodu ver'}
          </p>
        </div>

        {/* Players */}
        <div className="section-title">{players.length} Oyuncu</div>
        {players.map(p => (
          <div key={p.id} className="player-item">
            <div className="player-avatar">{p.name[0].toUpperCase()}</div>
            <span className="player-name">{p.name}</span>
            {gameState.adminId === p.id && <span className="player-badge">Admin</span>}
            {p.id === playerId && <span className="player-badge">Sen</span>}
          </div>
        ))}

        {players.length < 3 && (
          <p style={{ color: 'var(--text3)', fontSize: 14, fontStyle: 'italic', textAlign: 'center', margin: '8px 0 14px' }}>
            En az 3 oyuncu gerekli
          </p>
        )}

        <div className="divider" />

        {/* Role config - only admin */}
        {isAdmin && (
          <>
            <div className="section-title">Rol Ayarları</div>
            <div className="card">
              {[
                { key: 'vampire', label: '🧛 Vampir', color: 'var(--accent2)' },
                { key: 'doctor', label: '💉 Doktor', color: '#4488cc' },
              ].map(r => (
                <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: r.color, fontSize: 17 }}>{r.label}</span>
                  <div className="stepper">
                    <button className="step-btn" onClick={() => updateRole(r.key, -1)}>−</button>
                    <span className="step-val">{roleConfig[r.key] || 0}</span>
                    <button className="step-btn" onClick={() => updateRole(r.key, 1)}>+</button>
                  </div>
                </div>
              ))}
              <p style={{ color: 'var(--text3)', fontSize: 13, fontStyle: 'italic' }}>
                👨‍🌾 Köylü: {Math.max(0, players.length - totalActive)} kişi (otomatik)
              </p>
              {totalActive >= players.length && (
                <p style={{ color: '#c44', fontSize: 13, marginTop: 6 }}>⚠ Aktif roller oyuncu sayısından az olmalı</p>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={startGame}
              disabled={!canStart}
              style={{ marginTop: 8 }}
            >
              Oyunu Başlat 🧛
            </button>
          </>
        )}

        {!isAdmin && (
          <div className="info-bar">Admin oyunu başlatmayı bekle...</div>
        )}
      </div>
    </div>
  )
}
