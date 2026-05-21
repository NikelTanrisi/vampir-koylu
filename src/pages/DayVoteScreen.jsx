// src/pages/DayVoteScreen.jsx
import React, { useEffect, useRef } from 'react'
import { ref, update, get } from 'firebase/database'
import { tallyVotes, checkWinCondition } from '../utils/gameLogic'

export default function DayVoteScreen({ db, roomId, playerId, gameState, myRole }) {
  const resolvedRef = useRef(false)

  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const myPlayer = players.find(p => p.id === playerId)
  const isDead = myPlayer?.dead

  const votes = gameState?.votes || {}
  const myVote = votes[playerId]
  const totalVoted = Object.keys(votes).length
  const aliveVoters = alivePlayers.length

  const voteCounts = {}
  Object.values(votes).forEach(tid => {
    voteCounts[tid] = (voteCounts[tid] || 0) + 1
  })

  const canVote = !isDead && !myVote

  // Oylama phase değişince flag sıfırla
  useEffect(() => {
    resolvedRef.current = false
  }, [gameState?.phase])

  // Herkes oyunu verince otomatik çöz
  useEffect(() => {
    if (totalVoted < aliveVoters || aliveVoters === 0) return
    if (resolvedRef.current) return
    resolvedRef.current = true
    resolveVote()
  }, [totalVoted, aliveVoters])

  const castVote = async (targetId) => {
    if (!canVote || targetId === playerId) return
    await update(ref(db, `rooms/${roomId}/votes`), { [playerId]: targetId })
  }

  const resolveVote = async () => {
    // Firebase'den EN GÜNCEL veriyi oku
    const snap = await get(ref(db, `rooms/${roomId}`))
    if (!snap.exists()) return
    const room = snap.val()

    if (room.phase !== 'day_vote') return

    const freshVotes = room.votes || {}
    const allPlayers = Object.values(room.players || {}).filter(p => !p.left)
    const roles = room.roles || {}

    const winner = tallyVotes(freshVotes)
    let updates = { votes: null }

    if (winner === 'tie' || !winner) {
      // Eşitlik → gece, sistem mesajıyla
      updates.phase = 'night'
      updates.nightActions = null
      updates.nightTimer = Date.now() + 10000
      updates.sleepVotes = null
      updates.voteDecisionVotes = null
      updates.chatMessages = {
        system_tie: {
          id: 'system_tie',
          playerId: 'system',
          playerName: 'Sistem',
          text: '⚖️ Oylar eşit çıktı! Kimse asılmadı. Gece oluyor...',
          ts: Date.now(),
          isSystem: true
        }
      }
      updates.gameLog = [...(room.gameLog || []), `Tur ${room.round}: Eşitlik — gece oluyor`]
    } else {
      // Seçilen kişiyi öldür
      const hangedPlayer = allPlayers.find(p => p.id === winner)
      const hangedRole = roles[winner]

      // Önce oyuncuyu öldür
      await update(ref(db, `rooms/${roomId}/players/${winner}`), { dead: true })

      // Kazanma kontrolü
      const updatedPlayers = allPlayers.map(p => p.id === winner ? { ...p, dead: true } : p)
      const win = checkWinCondition(updatedPlayers, roles)

      const roleLabel = hangedRole === 'vampire' ? '🧛 Vampir' : hangedRole === 'doctor' ? '💉 Doktor' : '👨‍🌾 Köylü'
      const announcement = `⚰️ ${hangedPlayer?.name} asıldı! Meğer ${roleLabel}miş!`

      updates.gameLog = [...(room.gameLog || []), `Tur ${room.round}: ${hangedPlayer?.name} asıldı (${hangedRole})`]
      updates.chatMessages = {
        system_hang: {
          id: 'system_hang',
          playerId: 'system',
          playerName: 'Sistem',
          text: announcement,
          ts: Date.now(),
          isSystem: true
        }
      }

      if (win) {
        updates.phase = 'game_over'
        updates.winner = win
      } else {
        updates.phase = 'night'
        updates.nightActions = null
        updates.nightTimer = Date.now() + 10000
        updates.sleepVotes = null
        updates.voteDecisionVotes = null
        updates.round = (room.round || 1) + 1
      }
    }

    await update(ref(db, `rooms/${roomId}`), updates)
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="game-title">☀️ Oylama</span>
        <span className="phase-badge">KİMİ ASALIM?</span>
        <span />
      </div>
      <div className="screen-inner">
        <p style={{ color: 'var(--text2)', fontStyle: 'italic', marginBottom: 16, textAlign: 'center', fontSize: 15 }}>
          Kimi asmak istiyorsun? ({totalVoted}/{aliveVoters} oy kullandı)
        </p>

        {isDead && <div className="info-bar">Öldün — sadece izleyebilirsin 👻</div>}

        {alivePlayers.map(p => {
          if (p.id === playerId && !isDead) return null // Kendine oy veremez (ölüler izler)
          if (p.id === playerId) return null
          const count = voteCounts[p.id] || 0
          const isSelected = myVote === p.id
          return (
            <div
              key={p.id}
              className={`player-item ${isSelected ? 'selected' : ''}`}
              onClick={() => castVote(p.id)}
              style={{ cursor: canVote ? 'pointer' : 'default' }}
            >
              <div className="player-avatar">{p.name[0].toUpperCase()}</div>
              <span className="player-name">{p.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {count > 0 && (
                  <span style={{
                    background: 'var(--accent)', color: '#fff', borderRadius: '50%',
                    width: 26, height: 26, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontFamily: 'Cinzel', fontSize: 13, fontWeight: 600
                  }}>{count}</span>
                )}
                {isSelected && <span style={{ color: 'var(--accent2)', fontSize: 18 }}>✓</span>}
              </div>
            </div>
          )
        })}

        {myVote && !isDead && (
          <div className="info-bar" style={{ marginTop: 12 }}>
            Oy kullandın. Herkes oyunu verince sonuç açıklanacak...
          </div>
        )}
      </div>
    </div>
  )
}
