// src/pages/NightScreen.jsx
import React, { useState, useEffect } from 'react'
import { ref, update } from 'firebase/database'
import { checkWinCondition } from '../utils/gameLogic'

export default function NightScreen({ db, roomId, playerId, gameState, myRole }) {
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const [done, setDone] = useState(false)

  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const nightActions = gameState?.nightActions || {}
  const nightTimer = gameState?.nightTimer || (Date.now() + 10000)
  const isActive = myRole === 'vampire' || myRole === 'doctor'
  const myPlayer = players.find(p => p.id === playerId)
  const isDead = myPlayer?.dead

  // Timer
  useEffect(() => {
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((nightTimer - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        clearInterval(tick)
        resolveNight()
      }
    }, 500)
    return () => clearInterval(tick)
  }, [nightTimer])

  const submitAction = async (targetId) => {
    if (done || isDead) return
    setSelected(targetId)
    setDone(true)
    await update(ref(db, `rooms/${roomId}/nightActions`), {
      [`${myRole}_${playerId}`]: targetId
    })
  }

  const resolveNight = async () => {
    if (gameState?.resolvingNight) return
    await update(ref(db, `rooms/${roomId}`), { resolvingNight: true })

    const actions = gameState?.nightActions || {}
    
    const vampireKills = Object.entries(actions)
      .filter(([k]) => k.startsWith('vampire_'))
      .map(([, v]) => v)

    const doctorSaves = Object.entries(actions)
      .filter(([k]) => k.startsWith('doctor_'))
      .map(([, v]) => v)

    const killTarget = vampireKills[0] || null
    const wasSaved = killTarget && doctorSaves.includes(killTarget)

    let killed = null
    let updates = {}

    if (killTarget && !wasSaved) {
      killed = killTarget
      updates[`rooms/${roomId}/players/${killed}/dead`] = true
    }

    const updatedPlayers = players.map(p =>
      p.id === killed ? { ...p, dead: true } : p
    )
    
    const win = checkWinCondition(updatedPlayers, gameState.roles || {})
    
    const logEntry = killed
      ? `Gece ${gameState.round}: ${players.find(p => p.id === killed)?.name} öldürüldü.`
      : `Gece ${gameState.round}: Kimse ölmedi.`

    let personalMessages = {}

    if (killTarget) {
      if (!wasSaved) {
        personalMessages[killTarget] = "Bu gece saldırıya uğradın ve öldün."
      } else {
        personalMessages[killTarget] = "Bu gece saldırıya uğradın ama ölmedin, korundun."
      }
    }

    Object.entries(actions).forEach(([key, target]) => {
      if (key.startsWith('doctor_')) {
        const docId = key.split('_')[1]
        if (target === killTarget && wasSaved) {
          personalMessages[docId] = "Başarılı şekilde saldırganı savuşturdun!"
        }
      }
    })

    Object.entries(actions).forEach(([key, target]) => {
      if (key.startsWith('vampire_')) {
        const vampId = key.split('_')[1]
        if (target === killTarget) {
          if (!wasSaved) {
            personalMessages[vampId] = "Tebrikler, avını avladın."
          } else {
            personalMessages[vampId] = "Maalesef doktor hedefini korudu."
          }
        }
      }
    })

    updates[`rooms/${roomId}/phase`] = win ? 'game_over' : 'day_chat'
    updates[`rooms/${roomId}/winner`] = win || null
    updates[`rooms/${roomId}/nightActions`] = null
    updates[`rooms/${roomId}/nightTimer`] = null
    updates[`rooms/${roomId}/chatMessages`] = null
    updates[`rooms/${roomId}/sleepVotes`] = null
    updates[`rooms/${roomId}/voteDecisionVotes`] = null
    updates[`rooms/${roomId}/votes`] = null
    updates[`rooms/${roomId}/round`] = win ? gameState.round : (gameState.round || 1) + 1
    updates[`rooms/${roomId}/gameLog`] = [...(gameState.gameLog || []), logEntry]
    updates[`rooms/${roomId}/lastNightResult`] = { killed, wasSaved }
    updates[`rooms/${roomId}/personalMessages`] = personalMessages
    updates[`rooms/${roomId}/resolvingNight`] = null

    await update(ref(db), updates)
  }

  const getInstruction = () => {
    if (isDead) return null
    if (myRole === 'vampire') return { text: 'Öldürmek istediğin oyuncuyu seç', color: 'var(--accent2)', icon: '🧛' }
    if (myRole === 'doctor') return { text: 'Korumak istediğin oyuncuyu seç', color: '#4488cc', icon: '💉' }
    return null
  }

  const instruction = getInstruction()

  return (
    <div className="screen">
      <div className="top-bar">
        <span className="game-title">🌙 Gece {gameState?.round || 1}</span>
        <div className="timer-circle" style={{ width: 40, height: 40, fontSize: 16, margin: 0 }}>
          {timeLeft}
        </div>
        <span />
      </div>
      <div className="screen-inner">
        <div className="night-overlay" style={{ flex: 'none', borderRadius: 14, marginBottom: 16, padding: '24px 18px' }}>
          <div className="moon">🌙</div>
          <p style={{ color: 'var(--text3)', fontStyle: 'italic', marginTop: 12 }}>
            Köy uyuyor...
          </p>
          <div style={{
            marginTop: 16,
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 40,
            padding: '8px 20px'
          }}>
            <span style={{
              fontFamily: 'Cinzel',
              fontSize: 26,
              fontWeight: 700,
              color: timeLeft <= 3 ? 'var(--accent2)' : 'var(--gold)'
            }}>{timeLeft}s</span>
          </div>
        </div>

        {!isActive || isDead ? (
          <div className="night-waiting">
            {isDead ? '👻 Sen ölüsün. Geceyi izliyorsun...' : '😴 Uyuyorsun. Aktif roller harekete geçiyor...'}
          </div>
        ) : done ? (
          <div className="info-bar">
            ✓ Seçimini yaptın. Diğerleri bekleniyor...
          </div>
        ) : (
          <>
            {instruction && (
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg2)',
                border: `1px solid ${instruction.color}44`,
                borderRadius: 'var(--rad2)',
                marginBottom: 14,
                textAlign: 'center'
              }}>
                <span style={{ color: instruction.color }}>
                  {instruction.icon} {instruction.text}
                </span>
              </div>
            )}

            {alivePlayers
              .filter(p => myRole === 'vampire' ? (gameState?.roles || {})[p.id] !== 'vampire' : true)
              .filter(p => p.id !== playerId || myRole === 'doctor')
              .map(p => (
                <div
                  key={p.id}
                  className={`player-item ${selected === p.id ? 'selected' : ''}`}
                  onClick={() => submitAction(p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="player-avatar">{p.name[0].toUpperCase()}</div>
                  <span className="player-name">{p.name}</span>
                  {selected === p.id && <span style={{ color: 'var(--accent2)' }}>✓</span>}
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  )
}