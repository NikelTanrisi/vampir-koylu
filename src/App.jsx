// src/App.jsx
import React, { useState, useEffect } from 'react'
import { db } from './firebase'
import { ref, onValue, set, update, push, get, serverTimestamp } from 'firebase/database'
import SplashScreen from './pages/SplashScreen'
import JoinScreen from './pages/JoinScreen'
import LobbyScreen from './pages/LobbyScreen'
import RoleRevealScreen from './pages/RoleRevealScreen'
import DayChatScreen from './pages/DayChatScreen'
import MorningScene from './pages/MorningScene'
import DayVoteDecisionScreen from './pages/DayVoteDecisionScreen'
import DayVoteScreen from './pages/DayVoteScreen'
import NightScreen from './pages/NightScreen'
import GameOverScreen from './pages/GameOverScreen'

export default function App() {
  const [screen, setScreen] = useState('splash') // splash | join | lobby | role_reveal | game
  const [roomId, setRoomId] = useState(null)
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('vk_pid') || null)
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('vk_name') || '')
  const [isAdmin, setIsAdmin] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [showRoleReveal, setShowRoleReveal] = useState(false)

  // Restore session
  useEffect(() => {
    const savedRoom = localStorage.getItem('vk_room')
    const savedPid = localStorage.getItem('vk_pid')
    if (savedRoom && savedPid) {
      setRoomId(savedRoom)
      setPlayerId(savedPid)
      setScreen('reconnecting')
    }
  }, [])

  // Listen to game state
  useEffect(() => {
    if (!roomId) return
    const roomRef = ref(db, `rooms/${roomId}`)
    const unsub = onValue(roomRef, snap => {
      if (!snap.exists()) {
        // Room gone
        localStorage.removeItem('vk_room')
        localStorage.removeItem('vk_pid')
        setScreen('splash')
        return
      }
      const data = snap.val()
      setGameState(data)

      const pid = localStorage.getItem('vk_pid')
      if (!pid) return

      // Check if we're admin
      setIsAdmin(data.adminId === pid)

      // Get my role
      if (data.roles && data.roles[pid]) {
        setMyRole(data.roles[pid])
      }

      // Route based on phase
      if (data.phase === 'lobby') {
        setScreen('lobby')
      } else if (data.phase === 'role_reveal') {
        setShowRoleReveal(true)
        setScreen('role_reveal')
      } else if (data.phase === 'day_chat') {
        setShowRoleReveal(false)
        if (data.showMorning) {
          setScreen('morning')
        } else {
          setScreen('day_chat')
        }
      } else if (data.phase === 'day_vote_decision') {
        setScreen('day_vote_decision')
      } else if (data.phase === 'day_vote') {
        setScreen('day_vote')
      } else if (data.phase === 'night') {
        setScreen('night')
      } else if (data.phase === 'game_over') {
        setScreen('game_over')
      }
    })
    return () => unsub()
  }, [roomId])

  // Reconnecting handler
  useEffect(() => {
    if (screen !== 'reconnecting') return
    const pid = localStorage.getItem('vk_pid')
    const room = localStorage.getItem('vk_room')
    const name = localStorage.getItem('vk_name')
    if (!pid || !room) { setScreen('splash'); return }
    setPlayerName(name || '')
    // Will be routed by gameState listener
    setScreen('lobby')
  }, [screen])

  const handleJoin = (rid, pid, name, admin) => {
    setRoomId(rid)
    setPlayerId(pid)
    setPlayerName(name)
    setIsAdmin(admin)
    localStorage.setItem('vk_room', rid)
    localStorage.setItem('vk_pid', pid)
    localStorage.setItem('vk_name', name)
    setScreen('lobby')
  }

  const handleLeave = async () => {
    if (roomId && playerId) {
      await update(ref(db, `rooms/${roomId}/players/${playerId}`), { left: true })
    }
    localStorage.removeItem('vk_room')
    localStorage.removeItem('vk_pid')
    setRoomId(null)
    setPlayerId(null)
    setGameState(null)
    setMyRole(null)
    setScreen('splash')
  }

  const sharedProps = {
    db, roomId, playerId, playerName, isAdmin, gameState, myRole,
    onLeave: handleLeave
  }

  if (screen === 'splash') return <SplashScreen onNext={() => setScreen('join')} />
  if (screen === 'join') return <JoinScreen db={db} onJoin={handleJoin} onBack={() => setScreen('splash')} />
  if (screen === 'morning') return <MorningScene db={db} roomId={roomId} playerId={playerId} isAdmin={isAdmin} gameState={gameState} />
  if (screen === 'role_reveal') return <RoleRevealScreen {...sharedProps} onDone={() => setScreen('day_chat')} />
  if (screen === 'day_chat') return <DayChatScreen {...sharedProps} />
  if (screen === 'day_vote_decision') return <DayVoteDecisionScreen {...sharedProps} />
  if (screen === 'day_vote') return <DayVoteScreen {...sharedProps} />
  if (screen === 'night') return <NightScreen {...sharedProps} />
  if (screen === 'game_over') return <GameOverScreen {...sharedProps} />

  // lobby & reconnecting
  return <LobbyScreen {...sharedProps} />
}
