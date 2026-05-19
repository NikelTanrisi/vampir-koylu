// src/pages/GameOverScreen.jsx
import React from 'react'
import { ref, update } from 'firebase/database'
import { ROLE_LABELS } from '../utils/gameLogic'

export default function GameOverScreen({ db, roomId, playerId, isAdmin, gameState, myRole, onLeave }) {
  const winner = gameState?.winner
  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const roles = gameState?.roles || {}
  const gameLog = gameState?.gameLog || []

  const isVampireWin = winner === 'vampire'
  const myTeamWon = (isVampireWin && myRole === 'vampire') || (!isVampireWin && myRole !== 'vampire')

  const playAgain = async () => {
    await update(ref(db, `rooms/${roomId}`), {
      phase: 'lobby',
      roles: null,
      roleRevealReady: null,
      chatMessages: null,
      nightActions: null,
      nightTimer: null,
      sleepVotes: null,
      voteDecisionVotes: null,
      votes: null,
      winner: null,
      round: 1,
      gameLog: null,
      lastNightResult: null,
      players: Object.fromEntries(
        players.map(p => [p.id, { ...p, dead: false }])
      )
    })
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="game-title">VAMPİR KÖYLÜ</span>
        <span className="phase-badge">OYUN BİTTİ</span>
        <span />
      </div>
      <div className="screen-inner">
        <div className="win-screen">
          <div className="win-icon">{isVampireWin ? '🧛' : '👨‍🌾'}</div>
          <h2 className="win-title" style={{ color: isVampireWin ? 'var(--accent2)' : '#5a9a4a' }}>
            {isVampireWin ? 'Vampirler Kazandı!' : 'Köylüler Kazandı!'}
          </h2>
          <p style={{ color: 'var(--text2)', fontStyle: 'italic', marginBottom: 24 }}>
            {myTeamWon ? '🎉 Tebrikler, kazandın!' : '😔 Bu sefer olmadı...'}
          </p>
        </div>

        {/* Role reveal */}
        <div className="card">
          <div className="card-title">Gerçek Roller</div>
          {players.map(p => {
            const role = roles[p.id]
            const isVamp = role === 'vampire'
            const isDoc = role === 'doctor'
            return (
              <div key={p.id} className="player-item" style={{ marginBottom: 8 }}>
                <div className="player-avatar" style={{ background: isVamp ? 'var(--accent)' : isDoc ? '#2252a0' : '#2a5a2a' }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span className="player-name">{p.name}</span>
                <span style={{
                  fontSize: 13,
                  color: isVamp ? 'var(--accent2)' : isDoc ? '#4488cc' : '#5a9a4a'
                }}>
                  {ROLE_LABELS[role] || role}
                </span>
                {p.dead && <span className="dead-chip">💀</span>}
              </div>
            )
          })}
        </div>

        {/* Game log */}
        {gameLog.length > 0 && (
          <div className="card">
            <div className="card-title">Oyun Günlüğü</div>
            {gameLog.map((entry, i) => (
              <p key={i} style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 6, paddingLeft: 8, borderLeft: '2px solid var(--border2)' }}>
                {entry}
              </p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {isAdmin && (
            <button className="btn btn-primary" onClick={playAgain}>
              Tekrar Oyna 🔄
            </button>
          )}
          <button className="btn btn-ghost" onClick={onLeave}>
            Çıkış
          </button>
        </div>
      </div>
    </div>
  )
}
