// src/pages/DayVoteScreen.jsx
import React, { useState, useEffect } from 'react'
import { ref, update } from 'firebase/database'
import { tallyVotes, checkWinCondition } from '../utils/gameLogic'

export default function DayVoteScreen({ db, roomId, playerId, gameState, myRole }) {
  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const myPlayer = players.find(p => p.id === playerId)
  const isDead = myPlayer?.dead

  const votes = gameState?.votes || {}
  const myVote = votes[playerId]
  const totalVoted = Object.keys(votes).length
  const aliveVoters = alivePlayers.length

  // 🤖 TEST MODU: Botların anında oy kullanmasını sağlayan sistem
  useEffect(() => {
    if (!gameState?.isTestMode || !gameState?.adminId) return
    
    // Sadece admin bilgisayarı tetikleme yapsın (çakışmayı önlemek için)
    if (playerId !== gameState.adminId) return

    const currentVotes = { ...votes }
    let changed = false

    alivePlayers.forEach(p => {
      if (p.id.startsWith('bot_') && !currentVotes[p.id]) {
        // Bot kendisi hariç rastgele hayatta kalan birine oy verir
        const targets = alivePlayers.filter(t => t.id !== p.id)
        if (targets.length > 0) {
          const randomTarget = targets[Math.floor(Math.random() * targets.length)].id
          currentVotes[p.id] = randomTarget
          changed = true
        }
      }
    })

    if (changed) {
      update(ref(db, `rooms/${roomId}/votes`), currentVotes)
    }
  }, [totalVoted, aliveVoters, gameState?.isTestMode])

  const voteCounts = {}
  Object.values(votes).forEach(tid => {
    voteCounts[tid] = (voteCounts[tid] || 0) + 1
  })

  const canVote = !isDead && !myVote

  useEffect(() => {
    if (aliveVoters === 0 || totalVoted < aliveVoters) return
    resolveVote()
  }, [totalVoted, aliveVoters])

  const castVote = async (targetId) => {
    if (!canVote || targetId === playerId) return
    await update(ref(db, `rooms/${roomId}/votes`), { [playerId]: targetId })
  }

  const resolveVote = async () => {
    if (gameState?.resolvingVote) return
    await update(ref(db, `rooms/${roomId}`), { resolvingVote: true })

    const winner = tallyVotes(votes)
    let updates = { votes: null, chatMessages: null, personalMessages: null, resolvingVote: null }

    if (winner === 'tie' || !winner) {
      updates.phase = 'night'
      updates.nightActions = null
      updates.nightTimer = Date.now() + 10000
      updates.gameLog = [...(gameState.gameLog || []), `Tur ${gameState.round}: Eşitlik sağlandı — kimse asılmadı. Gece oluyor...`]
    } else {
      const hangedPlayer = players.find(p => p.id === winner)
      await update(ref(db, `rooms/${roomId}/players/${winner}`), { dead: true })

      const updatedPlayers = players.map(p => p.id === winner ? { ...p, dead: true } : p)
      const win = checkWinCondition(updatedPlayers, gameState.roles || {})
      
      const roleText = gameState.roles?.[winner] === 'vampire' ? '🧛 Vampir' : '🧑‍🌾 Köylü'
      updates.gameLog = [...(gameState.gameLog || []), `Tur ${gameState.round}: Köy halkı ${hangedPlayer?.name} isimli oyuncuyu astı! Rolü: ${roleText}`]

      if (win) {
        updates.phase = 'game_over'
        updates.winner = win
      } else {
        updates.phase = 'night'
        updates.nightActions = null
        updates.nightTimer = Date.now() + 10000
        updates.round = (gameState.round || 1) + 1
      }
    }

    await update(ref(db, `rooms/${roomId}`), updates)
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="game-title">☀️ Oylama</span>
        <span className="phase-badge" style={{ background: 'var(--accent2)' }}>KİMİ ASALIM?</span>
        <span />
      </div>
      <div className="screen-inner">
        <p style={{ color: 'var(--text2)', fontStyle: 'italic', marginBottom: 16, textAlign: 'center', fontSize: 15 }}>
          Kimi asmak istiyorsun? ({totalVoted}/{aliveVoters} oy kullanıldı)
        </p>

        {isDead && <div className="info-bar" style={{ background: 'rgba(230, 57, 70, 0.15)', color: 'var(--accent2)' }}>👻 Ölüler oy kullanamaz. Köy halkının kararını izliyorsun...</div>}

        {alivePlayers.map(p => {
          if (p.id === playerId) return null
          const count = voteCounts[p.id] || 0
          const isSelected = myVote === p.id
          return (
            <div key={p.id} className={`player-item ${isSelected ? 'selected' : ''}`} onClick={() => castVote(p.id)} style={{ cursor: canVote ? 'pointer' : 'default' }}>
              <div className="player-avatar">{p.name[0].toUpperCase()}</div>
              <span className="player-name">{p.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {count > 0 && (
                  <span style={{ background: 'var(--accent2)', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel', fontSize: 13, fontWeight: 600 }}>{count}</span>
                )}
                {isSelected && <span style={{ color: 'var(--accent2)', fontSize: 18 }}>✓</span>}
              </div>
            </div>
          )
        })}

        {myVote && !isDead && (
          <div className="info-bar" style={{ marginTop: 12 }}>✓ Oyunuzu kullandınız. Diğer köylülerin kararları bekleniyor...</div>
        )}
      </div>
    </div>
  )
}