// src/pages/LobbyScreen.jsx
import React, { useState } from 'react'
import { ref, update } from 'firebase/database'
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

  // 🤖 TEST MODU: 4 TANE YAPAY ZEKA OYUNCUSU ENJEKTE EDER
  const addTestBots = async () => {
    const botPlayers = {
      bot_1: { id: 'bot_1', name: '🤖 Bot Ahmet', left: false, dead: false },
      bot_2: { id: 'bot_2', name: '🤖 Bot Ayşe', left: false, dead: false },
      bot_3: { id: 'bot_3', name: '🤖 Bot Mehmet', left: false, dead: false },
      bot_4: { id: 'bot_4', name: '🤖 Bot Elif', left: false, dead: false }
    }

    await update(ref(db, `rooms/${roomId}`), {
      players: { ...gameState.players, ...botPlayers },
      roleConfig: { vampire: 1, doctor: 1 }, // 5 kişilik ideal lobi ayarı
      isTestMode: true // Diğer ekranların botları tanıması için test bayrağı
    })
  }

  const startGame = async () => {
    const roles = assignRoles(players, roleConfig)
    await update(ref(db, `rooms/${roomId}`), {
      roles,
      phase: 'role_reveal',
      round: 1,
      gameLog: []
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
            En az 3 oyuncu gerekli (veya bot ekle)
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
                <div key={r.key} style={{ display: 'flex', alignItems: 'center', justify-content: 'space-between', marginBottom: 16 }}>
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

            {/* 🤖 TEST PANEL BUTONLARI */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                className="btn btn-gold"
                onClick={addTestBots}
                style={{ flex: 1, padding: '12px', fontSize: 14 }}
              >
                🤖 Botları Ekle
              </button>
              <button
                className="btn btn-primary"
                onClick={startGame}
                disabled={!canStart}
                style={{ flex: 1, padding: '12px', fontSize: 14 }}
              >
                Oyunu Başlat 🧛
              </button>
            </div>
          </>
        )}

        {!isAdmin && (
          <div className="info-bar">Admin oyunu başlatmayı bekle...</div>
        )}
      </div>
    </div>
  )
}