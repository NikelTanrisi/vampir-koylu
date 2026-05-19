// src/pages/DayChatScreen.jsx
import React, { useState, useRef, useEffect } from 'react'
import { ref, update, push, set } from 'firebase/database'
import { ROLE_LABELS } from '../utils/gameLogic'

export default function DayChatScreen({ db, roomId, playerId, playerName, isAdmin, gameState, myRole, onLeave }) {
  const [msg, setMsg] = useState('')
  const [showDeathAnimation, setShowDeathAnimation] = useState(false)
  const chatEnd = useRef(null)

  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const messages = gameState?.chatMessages ? Object.values(gameState.chatMessages).sort((a, b) => a.ts - b.ts) : []
  const sleepVotes = gameState?.sleepVotes || {}
  const myPlayer = players.find(p => p.id === playerId)
  const isDead = myPlayer?.dead

  // Gece hesaplanan kişiye özel bildirim mesajı
  const myPersonalMessage = gameState?.personalMessages?.[playerId] || null

  // 🚨 SINEMATİK ÖLÜM ANİMASYONU TETİKLEYİCİ 🚨
  useEffect(() => {
    if (isDead) {
      // Oyuncu bu tur elendiyse ve animasyonu henüz görmediyse tetikle
      const hasWatched = sessionStorage.getItem(`vampir_death_watched_r${gameState?.round}`)
      if (!hasWatched) {
        setShowDeathAnimation(true)
      }
    }
  }, [isDead, gameState?.round])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const closeDeathAnimation = () => {
    // Animasyonu bu tur için bir daha göstermemek üzere kaydet ve kapat
    sessionStorage.setItem(`vampir_death_watched_r${gameState?.round}`, 'true')
    setShowDeathAnimation(false)
  }

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
    if (isDead) return
    await update(ref(db, `rooms/${roomId}/sleepVotes`), { [playerId]: 'sleep' })
    
    const newVotes = { ...sleepVotes, [playerId]: 'sleep' }
    if (Object.keys(newVotes).length >= alivePlayers.length) {
      await goToNight()
    }
  }

  const voteDecision = async () => {
    if (isDead) return
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

  // 🚨 TAM EKRAN SİNEMATİK ÖLÜM SİSİ 🚨
  if (showDeathAnimation) {
    return (
      <div className="death-overlay-screen">
        {/* Farklı sürelerde aşağıdan yukarı uçuşan hayaletler */}
        <div className="ghost-particle" style={{ left: '10%', animationDelay: '0s', animationDuration: '5s' }}>👻</div>
        <div className="ghost-particle" style={{ left: '40%', animationDelay: '1.8s', animationDuration: '6s' }}>👻</div>
        <div className="ghost-particle" style={{ left: '70%', animationDelay: '0.5s', animationDuration: '5.5s' }}>👻</div>
        <div className="ghost-particle" style={{ left: '85%', animationDelay: '2.5s', animationDuration: '4.8s' }}>👻</div>

        <h1 className="death-title">KATLEDİLDİN</h1>
        <p className="death-subtitle">
          {myPersonalMessage ? myPersonalMessage : "Köy halkı senin bir vampir olduğunu düşündü ve seni ipe gönderdi... Artık bir hayaletsin."}
        </p>
        <button className="death-btn" onClick={closeDeathAnimation}>
          RUH OLARAK İZLE 👻
        </button>
      </div>
    )
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="top-bar">
        <span className="game-title">☀️ Gün {round}</span>
        <span className="phase-badge">SOHBET</span>
        <button className="btn btn-ghost btn-sm" onClick={onLeave} style={{ width: 'auto', fontSize: 12 }}>Çık</button>
      </div>

      {/* Rol Göstergesi */}
      <div style={{ padding: '8px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>Rolün: </span>
        <span style={{ fontSize: 13, color: myRole === 'vampire' ? 'var(--accent2)' : myRole === 'doctor' ? '#4488cc' : '#4a7a3a' }}>
          {ROLE_LABELS[myRole]}
        </span>
        {isDead && <span className="dead-chip" style={{ marginLeft: 8, background: 'var(--accent2)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>Öldün</span>}
      </div>

      {/* Kişiye Özel Gece Bildirimi */}
      {myPersonalMessage && (
        <div style={{
          padding: '12px 18px',
          background: isDead ? 'rgba(196, 64, 90, 0.15)' : 'rgba(74, 122, 58, 0.15)',
          borderBottom: isDead ? '1px solid var(--accent2)' : '1px solid #4a7a3a',
          color: isDead ? 'var(--accent2)' : '#a3e635',
          fontSize: '13px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          📢 {myPersonalMessage}
        </div>
      )}

      {/* Chat Mesaj Alanı */}
      <div className="chat-container">
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontStyle: 'italic', marginTop: 32 }}>
            Tartışma başlasın...
          </p>
        )}
        {messages.map(m => (
          <div key={m.id}>
            {m.playerId !== playerId && (
              <div className="chat-sender">{m.playerName}</div>
            )}
            <div className={`chat-msg ${m.playerId === playerId ? 'mine' : 'other'}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEnd} />
      </div>

      {/* Yat / Oyla Butonları (Sadece Yaşayanlara Görünür) */}
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

      {/* Chat Mesaj Yazma Girişi */}
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

      {/* Ölüler İçin Alt Bilgi */}
      {isDead && (
        <div style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text3)', fontStyle: 'italic', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          👻 Öldün — sadece izleyebilirsin. Konuşamaz veya oylamaya katılamazsınız.
        </div>
      )}
    </div>
  )
}