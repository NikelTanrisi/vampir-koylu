// src/pages/RoleRevealScreen.jsx
import React, { useState } from 'react'
import { ref, update } from 'firebase/database'
import { ROLE_LABELS, ROLE_DESC, ROLE_COLORS } from '../utils/gameLogic'

const ROLE_ICONS = { vampire: '🧛', doctor: '💉', villager: '👨‍🌾' }

export default function RoleRevealScreen({ db, roomId, playerId, isAdmin, myRole, gameState }) {
  const [revealed, setRevealed] = useState(false)

  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const readyCount = gameState?.roleRevealReady ? Object.keys(gameState.roleRevealReady).length : 0

  const handleReady = async () => {
    await update(ref(db, `rooms/${roomId}/roleRevealReady`), { [playerId]: true })
    // If all ready, admin advances (or auto-detect)
    const newCount = readyCount + 1
    if (newCount >= players.length) {
      await update(ref(db, `rooms/${roomId}`), {
        phase: 'day_chat',
        roleRevealReady: null,
        chatMessages: null,
        nightActions: null,
        votes: null,
        voteDecision: null,
      })
    }
  }

  const alreadyReady = gameState?.roleRevealReady?.[playerId]
  const color = ROLE_COLORS[myRole] || '#4a4a4a'

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="game-title">VAMPİR KÖYLÜ</span>
        <span className="phase-badge">ROL REVELASYONu</span>
        <span />
      </div>
      <div className="role-reveal">
        {!revealed ? (
          <>
            <p style={{ color: 'var(--text2)', fontStyle: 'italic', marginBottom: 32 }}>
              Rolünü görmek için dokun
            </p>
            <button
              onClick={() => setRevealed(true)}
              style={{
                width: 160, height: 160, borderRadius: '50%',
                background: 'var(--bg3)',
                border: '2px solid var(--border2)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8,
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: 48 }}>🃏</span>
              <span style={{ fontFamily: 'Cinzel', fontSize: 12, color: 'var(--text3)', letterSpacing: 1 }}>DOKUN</span>
            </button>
          </>
        ) : (
          <>
            <div className="role-card" style={{ borderColor: color, background: `${color}18` }}>
              <div className="role-icon">{ROLE_ICONS[myRole] || '❓'}</div>
              <div className="role-name" style={{ color }}>{ROLE_LABELS[myRole] || myRole}</div>
              <p className="role-desc">{ROLE_DESC[myRole]}</p>
            </div>

            <div style={{ marginTop: 24, width: '100%' }}>
              {!alreadyReady ? (
                <button className="btn btn-gold" onClick={handleReady}>
                  Hazırım ✓
                </button>
              ) : (
                <div className="info-bar">
                  ✓ Hazır — {readyCount}/{players.length} oyuncu hazır
                </div>
              )}
            </div>

            {isAdmin && readyCount < players.length && (
              <p style={{ marginTop: 12, color: 'var(--text3)', fontSize: 13, fontStyle: 'italic' }}>
                Herkes rolünü görene kadar bekle
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
