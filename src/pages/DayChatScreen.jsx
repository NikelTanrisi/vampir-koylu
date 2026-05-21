// src/pages/DayChatScreen.jsx
import React, { useState, useRef, useEffect } from 'react'
import { ref, update, push, set } from 'firebase/database'
import { ROLE_LABELS } from '../utils/gameLogic'

export default function DayChatScreen({ db, roomId, playerId, playerName, isAdmin, gameState, myRole, onLeave }) {
  const [msg, setMsg] = useState('')
  const chatEnd = useRef(null)

  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const messages = gameState?.chatMessages ? Object.values(gameState.chatMessages).sort((a, b) => a.ts - b.ts) : []
  const sleepVotes = gameState?.sleepVotes || {}
  const myPlayer = players.find(p => p.id === playerId)
  const isDead = myPlayer?.dead

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMsg = async () => {
    if (!msg.trim() || isDead) return
    const msgRef = push(ref(db, `rooms/${roomId}/chatMessages`))
    await set(msgRef, {
      id: msgRef.key,
      playerId,
      playerName,
      text: msg.trim(),
      ts: Date.now()
    })
    setMsg('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMsg()
  }

  const voteSleep = async () => {
    await update(ref(db, `rooms/${roomId}/sleepVotes`), { [playerId]: 'sleep' })
    const newVotes = { ...sleepVotes, [playerId]: 'sleep' }
    if (Object.keys(newVotes).length >= alivePlayers.length) {
      await goToNight()
    }
  }

  const voteDecision = async () => {
    await update(ref(db, `rooms/${roomId}`), {
      phase: 'day_vote_decision',
      sleepVotes: null,
      voteDecisionVotes: null
    })
  }

  const goToNight = async () => {
    await update(ref(db, `rooms/${roomId}`), {
      phase: 'night',
      sleepVotes: null,
      nightActions: null,
      nightTimer: Date.now() + 10000
    })
  }

  const alreadySlept = sleepVotes[playerId] === 'sleep'
  const sleepCount = Object.keys(sleepVotes).length
  const round = gameState?.round || 1
  const lastResult = gameState?.lastNightResult || {}

  // Kişisel gece özeti — sadece aktif roller için, 2. günden itibaren
  const getNightSummary = () => {
    if (round <= 1) return null

    const prevRound = round - 1

    if (myRole === 'doctor') {
      const myTarget = gameState?.lastDoctorTarget
      const targetName = myTarget ? (players.find(p => p.id === myTarget)?.name || '?') : null
      if (!targetName) return null
      if (lastResult.wasSaved) {
        return { icon: '✅', color: '#228844', text: `Gece ${prevRound}: ${targetName} adlı kişiyi bu gece saldırıdan korudun!` }
      } else {
        return { icon: '🛡️', color: '#4488cc', text: `Gece ${prevRound}: ${targetName} için tetikteydin ama geceyi kimse saldırmadı.` }
      }
    }

    if (myRole === 'vampire') {
      const personalMsg = gameState?.personalMessages?.[playerId]
      if (!personalMsg) return null
      if (personalMsg.includes('başarısız') || personalMsg.includes('korundu')) {
        return { icon: '😤', color: '#886622', text: `Gece ${prevRound}: Hedefin bu gece korunmuştu, saldırın başarısız oldu.` }
      }
      if (personalMsg.includes('başarılı')) {
        const killedName = lastResult.killed ? players.find(p => p.id === lastResult.killed)?.name : null
        return { icon: '🩸', color: '#8b2222', text: `Gece ${prevRound}: ${killedName ? killedName + ' adlı kişiyi' : 'Hedefini'} başarıyla öldürdün.` }
      }
    }

    return null
  }

  const nightSummary = getNightSummary()

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="top-bar">
        <span className="game-title">☀️ Gün {round}</span>
        <span className="phase-badge">SOHBET</span>
        <button className="btn btn-ghost btn-sm" onClick={onLeave} style={{ width: 'auto', fontSize: 12 }}>Çık</button>
      </div>

      {/* Rol hatırlatıcı */}
      <div style={{ padding: '8px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>Rolün: </span>
        <span style={{ fontSize: 13, color: myRole === 'vampire' ? 'var(--accent2)' : myRole === 'doctor' ? '#4488cc' : '#4a7a3a' }}>
          {ROLE_LABELS[myRole]}
        </span>
        {isDead && <span className="dead-chip" style={{ marginLeft: 8 }}>Öldün</span>}
      </div>

      {/* Kişisel gece özeti */}
      {nightSummary && (
        <div style={{
          margin: '10px 18px 0',
          padding: '10px 14px',
          background: `${nightSummary.color}18`,
          border: `1px solid ${nightSummary.color}55`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 13,
          color: 'var(--text2)',
          fontStyle: 'italic'
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{nightSummary.icon}</span>
          <span>{nightSummary.text}</span>
        </div>
      )}

      {/* Chat */}
      <div className="chat-container">
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontStyle: 'italic', marginTop: 32 }}>
            Tartışma başlasın...
          </p>
        )}
        {messages.map(m => {
          if (m.isSystem || m.playerId === 'system') {
            return (
              <div key={m.id} style={{
                alignSelf: 'center',
                background: 'rgba(139,34,82,0.15)',
                border: '1px solid var(--border2)',
                borderRadius: 10,
                padding: '10px 14px',
                textAlign: 'center',
                fontSize: 14,
                color: 'var(--gold)',
                fontStyle: 'italic',
                maxWidth: '95%',
                margin: '4px 0'
              }}>
                {m.text}
              </div>
            )
          }
          return (
            <div key={m.id}>
              {m.playerId !== playerId && (
                <div className="chat-sender">{m.playerName}</div>
              )}
              <div className={`chat-msg ${m.playerId === playerId ? 'mine' : 'other'}`}>
                {m.text}
              </div>
            </div>
          )
        })}
        <div ref={chatEnd} />
      </div>

      {/* Uyku/oylama butonu */}
      {!isDead && (
        <div style={{ padding: '10px 18px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-ghost"
              onClick={voteSleep}
              disabled={alreadySlept}
              style={{ flex: 1, padding: '9px', fontSize: 15 }}
            >
              {alreadySlept ? '😴 Yattın' : '😴 Yat'}
            </button>
            <button
              className="btn btn-danger"
              onClick={voteDecision}
              style={{ flex: 1, padding: '9px', fontSize: 15 }}
            >
              🗳 Oyla
            </button>
          </div>
          {sleepCount > 0 && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
              {sleepCount} oyuncu uyumak istiyor
            </p>
          )}
        </div>
      )}

      {/* Mesaj yazma alanı */}
      {!isDead && (
        <div className="chat-input-bar">
          <input
            className="chat-input"
            type="text"
            placeholder="Bir şey yaz..."
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
          />
          <button className="chat-send" onClick={sendMsg}>➤</button>
        </div>
      )}
      {isDead && (
        <div style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text3)', fontStyle: 'italic', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          Öldün — sadece izleyebilirsin 👻
        </div>
      )}
    </div>
  )
}
