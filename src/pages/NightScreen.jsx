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
    // Sadece admin veya ilk tetikleyen çözer
    if (gameState?.resolvingNight) return;
    
    // Çift tetiklemeyi önlemek için bayrak koy
    await update(ref(db, `rooms/${roomId}`), { resolvingNight: true });

    const actions = gameState?.nightActions || {}
    
    // Vampir kurbanlarını ve Doktor korumalarını topla
    const vampireKills = Object.entries(actions)
      .filter(([k]) => k.startsWith('vampire_'))
      .map(([, v]) => v)

    const doctorSaves = Object.entries(actions)
      .filter(([k]) => k.startsWith('doctor_'))
      .map(([, v]) => v)

    // En çok oyu alan (veya ilk seçilen) hedef
    const killTarget = vampireKills[0] || null
    const wasSaved = killTarget && doctorSaves.includes(killTarget)

    let killed = null
    let updates = {} // Firebase güncellemelerini toplayacağımız obje

    if (killTarget && !wasSaved) {
      killed = killTarget
      // Oyuncuyu GERÇEKTEN öldürüyoruz
      updates[`rooms/${roomId}/players/${killed}/dead`] = true
    }

    const updatedPlayers = players.map(p =>
      p.id === killed ? { ...p, dead: true } : p
    )
    
    const win = checkWinCondition(updatedPlayers, gameState.roles || {})
    
    // Genel log kaydı
    const logEntry = killed
      ? `Gece ${gameState.round}: ${players.find(p => p.id === killed)?.name} öldürüldü.`
      : `Gece ${gameState.round}: Kimse ölmedi.`

    // Sabah mesajlarını hazırlıyoruz
    let personalMessages = {}

    // 1. Hedef alınan kişi için:
    if (killTarget) {
      if (!wasSaved) {
        personalMessages[killTarget] = "Bu gece saldırıya uğradın ve öldün."
      } else {
        personalMessages[killTarget] = "Bu gece saldırıya uğradın ama ölmedin, korundun."
      }
    }

    // 2. Doktor(lar) için:
    Object.entries(actions).forEach(([key, target]) => {
      if (key.startsWith('doctor_')) {
        const docId = key.split('_')[1];
        if (target === killTarget && wasSaved) {
          personalMessages[docId] = "Başarılı şekilde saldırganı savuşturdun!"
        }
      }
    });

    // 3. Vampir(ler) için:
    Object.entries(actions).forEach(([key, target]) => {
      if (key.startsWith('vampire_')) {
        const vampId = key.split('_')[1];
        if (target === killTarget) {
          if (!wasSaved) {
            personalMessages[vampId] = "Tebrikler, avını avladın."
          } else {
            personalMessages[vampId] = "Maalesef doktor hedefini korudu."
          }
        }
      }
    });

    // Tüm güncellemeleri Firebase'e tek seferde yolluyoruz
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
    updates[`rooms/${roomId}/lastNightResult`] = { killed, wasSaved