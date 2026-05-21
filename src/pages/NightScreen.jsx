// src/pages/NightScreen.jsx
import React, { useState, useEffect, useRef } from 'react'
import { ref, update, get } from 'firebase/database'
import { checkWinCondition } from '../utils/gameLogic'

export default function NightScreen({ db, roomId, playerId, gameState, myRole }) {
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const [done, setDone] = useState(false)
  const [personalMsg, setPersonalMsg] = useState(null)
  const resolvedRef = useRef(false)

  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const roles = gameState?.roles || {}
  const nightTimer = gameState?.nightTimer || (Date.now() + 10000)
  const isActive = myRole === 'vampire' || myRole === 'doctor'
  const myPlayer = players.find(p => p.id === playerId)
  const isDead = myPlayer?.dead

  // Reset resolved flag when night starts (nightTimer changes)
  useEffect(() => {
    resolvedRef.current = false
    setDone(false)
    setSelected(null)
    setPersonalMsg(null)
  }, [nightTimer])

  // Timer
  useEffect(() => {
    resolvedRef.current = false
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((nightTimer - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        clearInterval(tick)
        handleResolve()
      }
    }, 500)
    return () => clearInterval(tick)
  }, [nightTimer])

  // Kişisel mesajı göster (Firebase'den gelince)
  useEffect(() => {
    const msg = gameState?.personalMessages?.[playerId]
    if (msg) setPersonalMsg(msg)
  }, [gameState?.personalMessages])

  const submitAction = async (targetId) => {
    if (done || isDead) return
    setSelected(targetId)
    setDone(true)
    await update(ref(db, `rooms/${roomId}/nightActions`), {
      [`${myRole}_${playerId}`]: targetId
    })
  }

  const handleResolve = async () => {
    // Sadece bir kere çalışsın — ilk tetikleyen resolve eder
    if (resolvedRef.current) return
    resolvedRef.current = true

    // Firebase'den EN GÜNCEL veriyi oku
    const snap = await get(ref(db, `rooms/${roomId}`))
    if (!snap.exists()) return
    const room = snap.val()

    // Zaten phase değişmişse bir şey yapma
    if (room.phase !== 'night') return

    const actions = room.nightActions || {}
    const allPlayers = Object.values(room.players || {}).filter(p => !p.left)
    const roles = room.roles || {}

    // Vampir hedeflerini topla
    const vampireKills = Object.entries(actions)
      .filter(([k]) => k.startsWith('vampire_'))
      .map(([, v]) => v)

    // Doktor kurtarmalarını topla
    const doctorSaves = Object.entries(actions)
      .filter(([k]) => k.startsWith('doctor_'))
      .map(([, v]) => v)

    const killTarget = vampireKills[0] || null
    const wasSaved = !!(killTarget && doctorSaves.includes(killTarget))

    // Kişisel mesajları hazırla
    const personalMessages = {}

    if (killTarget) {
      if (wasSaved) {
        // Hedef kurtarıldı
        personalMessages[killTarget] = '🛡️ Bu gece saldırıya uğradın ama birisi seni başarıyla korudu!'

        // Vampire mesaj
        Object.entries(actions)
          .filter(([k]) => k.startsWith('vampire_'))
          .forEach(([k]) => {
            const vid = k.replace('vampire_', '')
            personalMessages[vid] = '😤 Hedefin bu gece korundu, saldırın başarısız oldu!'
          })

        // Doktora mesaj
        Object.entries(actions)
          .filter(([k]) => k.startsWith('doctor_'))
          .forEach(([k, savedId]) => {
            if (savedId === killTarget) {
              const did = k.replace('doctor_', '')
              personalMessages[did] = '✅ Başarılı! Koruduğun kişi bu gece saldırıdan kurtuldu!'
            }
          })
      } else {
        // Hedef öldürüldü — kurban bilgilendirilmez (zaten ölü)
        Object.entries(actions)
          .filter(([k]) => k.startsWith('vampire_'))
          .forEach(([k]) => {
            const vid = k.replace('vampire_', '')
            personalMessages[vid] = '🩸 Saldırın başarılı oldu!'
          })
      }
    }

    // Öldürülen oyuncuyu güncelle
    let killed = null
    if (killTarget && !wasSaved) {
      killed = killTarget
      await update(ref(db, `rooms/${roomId}/players/${killed}`), { dead: true })
    }

    // Güncel listeyle kazanma kontrolü
    const updatedPlayers = allPlayers.map(p =>
      p.id === killed ? { ...p, dead: true } : p
    )
    const win = checkWinCondition(updatedPlayers, roles)

    // Sistem mesajı (sabah gündüz chatinde görünecek)
    const killedName = killed ? allPlayers.find(p => p.id === killed)?.name : null
    let systemAnnouncement = null
    if (killedName) {
      systemAnnouncement = `🌅 Sabah oldu... ${killedName} bu gece hayatını kaybetti! 💀`
    } else if (wasSaved) {
      systemAnnouncement = '🌅 Sabah oldu... Bu gece kimse ölmedi. Köy huzurla uyudu.'
    } else {
      systemAnnouncement = '🌅 Sabah oldu... Bu gece kimse ölmedi.'
    }

    const logEntry = killed
      ? `Gece ${room.round}: ${killedName} öldürüldü`
      : `Gece ${room.round}: Kimse ölmedi${wasSaved ? ' (doktor kurtardı)' : ''}`

    await update(ref(db, `rooms/${roomId}`), {
      phase: win ? 'game_over' : 'day_chat',
      showMorning: win ? false : true,
      winner: win || null,
      nightActions: null,
      nightTimer: null,
      sleepVotes: null,
      voteDecisionVotes: null,
      votes: null,
      chatMessages: {
        system_morning: {
          id: 'system_morning',
          playerId: 'system',
          playerName: 'Sistem',
          text: systemAnnouncement,
          ts: Date.now(),
          isSystem: true
        }
      },
      personalMessages,
      round: win ? room.round : (room.round || 1) + 1,
      gameLog: [...(room.gameLog || []), logEntry],
      lastNightResult: { killed, wasSaved }
    })
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
          <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 40, padding: '8px 20px' }}>
            <span style={{
              fontFamily: 'Cinzel', fontSize: 26, fontWeight: 700,
              color: timeLeft <= 3 ? 'var(--accent2)' : 'var(--gold)'
            }}>{timeLeft}s</span>
          </div>
        </div>

        {personalMsg && (
          <div style={{
            padding: '14px 16px',
            background: personalMsg.includes('saldırıya uğradın') ? 'rgba(139,34,34,0.2)' :
                        personalMsg.includes('başarısız') ? 'rgba(80,60,20,0.2)' : 'rgba(34,80,34,0.2)',
            border: `1px solid ${personalMsg.includes('saldırıya uğradın') ? '#8b2222' :
                     personalMsg.includes('başarısız') ? '#886622' : '#228822'}`,
            borderRadius: 'var(--rad2)',
            marginBottom: 14,
            textAlign: 'center',
            fontSize: 15,
            fontStyle: 'italic',
            color: 'var(--text)'
          }}>
            {personalMsg}
          </div>
        )}

        {!isActive || isDead ? (
          <div className="night-waiting">
            {isDead ? '👻 Sen ölüsün. Geceyi izliyorsun...' : '😴 Uyuyorsun. Aktif roller harekete geçiyor...'}
          </div>
        ) : done ? (
          <div className="info-bar">
            ✓ Seçimini yaptın. Süre dolunca sonuç açıklanacak...
          </div>
        ) : (
          <>
            {instruction && (
              <div style={{
                padding: '12px 16px', background: 'var(--bg2)',
                border: `1px solid ${instruction.color}44`,
                borderRadius: 'var(--rad2)', marginBottom: 14, textAlign: 'center'
              }}>
                <span style={{ color: instruction.color }}>{instruction.icon} {instruction.text}</span>
              </div>
            )}

            {alivePlayers
              .filter(p => myRole === 'vampire' ? roles?.[p.id] !== 'vampire' : true)
              .filter(p => myRole === 'vampire' ? true : true)
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
