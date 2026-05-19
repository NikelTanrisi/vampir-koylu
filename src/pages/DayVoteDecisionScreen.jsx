// src/pages/DayVoteDecisionScreen.jsx
import React, { useEffect } from 'react'
import { ref, update } from 'firebase/database'

export default function DayVoteDecisionScreen({ db, roomId, playerId, gameState }) {
  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const myPlayer = players.find(p => p.id === playerId)
  const isDead = myPlayer?.dead

  const voteDecisionVotes = gameState?.voteDecisionVotes || {}
  const myVote = voteDecisionVotes[playerId]
  const voteCount = Object.values(voteDecisionVotes).filter(v => v === 'vote').length
  const sleepCount = Object.values(voteDecisionVotes).filter(v => v === 'sleep').length
  const totalVoted = Object.keys(voteDecisionVotes).length

  // Auto-resolve when all alive players voted
  useEffect(() => {
    const aliveCount = alivePlayers.length
    if (totalVoted < aliveCount) return

    if (voteCount > sleepCount) {
      // Oylama
      update(ref(db, `rooms/${roomId}`), {
        phase: 'day_vote',
        voteDecisionVotes: null,
        votes: null
      })
    } else {
      // Yat → gece
      update(ref(db, `rooms/${roomId}`), {
        phase: 'night',
        voteDecisionVotes: null,
        nightActions: null,
        nightTimer: Date.now() + 10000
      })
    }
  }, [totalVoted, voteCount, sleepCount, alivePlayers.length])

  const castVote = async (choice) => {
    if (isDead || myVote) return
    await update(ref(db, `rooms/${roomId}/voteDecisionVotes`), { [playerId]: choice })
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="game-title">☀️ Gündüz</span>
        <span className="phase-badge">KARAR</span>
        <span />
      </div>
      <div className="screen-inner" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Cinzel', fontSize: 18, color: 'var(--gold)', marginBottom: 8 }}>
          Oylama mı, Uyku mu?
        </p>
        <p style={{ color: 'var(--text2)', fontStyle: 'italic', marginBottom: 32, fontSize: 15 }}>
          Çoğunluk kazanır. Eşitlik → gece
        </p>

        {isDead ? (
          <div className="info-bar">Öldün — sadece izleyebilirsin 👻</div>
        ) : myVote ? (
          <div className="info-bar">
            {myVote === 'vote' ? '🗳 Oylama oyladın' : '😴 Uyku oyladın'}
            <br />
            <span style={{ fontSize: 13 }}>{totalVoted}/{alivePlayers.length} oyuncu oy kullandı</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
            <button className="btn btn-danger" onClick={() => castVote('vote')} style={{ fontSize: 20, padding: '18px' }}>
              🗳 Oylama
            </button>
            <button className="btn btn-ghost" onClick={() => castVote('sleep')} style={{ fontSize: 20, padding: '18px' }}>
              😴 Yat
            </button>
          </div>
        )}

        {totalVoted > 0 && (
          <div style={{ marginTop: 24, fontSize: 14, color: 'var(--text3)' }}>
            🗳 {voteCount} — 😴 {sleepCount} ({totalVoted}/{alivePlayers.length})
          </div>
        )}
      </div>
    </div>
  )
}
