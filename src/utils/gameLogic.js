// src/utils/gameLogic.js

export function assignRoles(players, roleConfig) {
  // roleConfig örnek: { vampire: 2, doctor: 1 }
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const roles = {}
  let idx = 0

  for (const [role, count] of Object.entries(roleConfig)) {
    for (let i = 0; i < count; i++) {
      if (idx < shuffled.length) {
        roles[shuffled[idx].id] = role
        idx++
      }
    }
  }

  // Kalanlar köylü
  for (let i = idx; i < shuffled.length; i++) {
    roles[shuffled[i].id] = 'villager'
  }

  return roles
}

export function checkWinCondition(players, roles) {
  const alive = players.filter(p => !p.dead)
  const aliveVampires = alive.filter(p => roles[p.id] === 'vampire')
  const aliveVillagers = alive.filter(p => roles[p.id] !== 'vampire')

  if (aliveVampires.length === 0) return 'villager'
  if (aliveVampires.length >= aliveVillagers.length) return 'vampire'
  return null
}

export function tallyVotes(votes) {
  // votes: { voterId: targetId }
  const counts = {}
  for (const targetId of Object.values(votes)) {
    counts[targetId] = (counts[targetId] || 0) + 1
  }
  if (Object.keys(counts).length === 0) return null

  const max = Math.max(...Object.values(counts))
  const leaders = Object.entries(counts).filter(([, c]) => c === max)
  if (leaders.length > 1) return 'tie'
  return leaders[0][0] // kazanan oyuncunun id'si
}

export const ROLE_LABELS = {
  vampire: '🧛 Vampir',
  doctor: '💉 Doktor',
  villager: '👨‍🌾 Köylü',
}

export const ROLE_COLORS = {
  vampire: '#8b2252',
  doctor: '#2252a0',
  villager: '#4a7a3a',
}

export const ROLE_DESC = {
  vampire: 'Her gece bir oyuncuyu öldürürsün. Köylülerden çok sayıda veya eşit sayıda kalırsan kazanırsın.',
  doctor: 'Her gece bir oyuncuyu (veya kendini) kurtarabilirsin.',
  villager: 'Gündüzleri vampiri bulmaya çalış ve oyla!',
}

export const PHASE_LABELS = {
  lobby: 'Lobi',
  day_chat: 'Gündüz — Tartışma',
  day_vote_decision: 'Gündüz — Oylama mı, Yatmak mı?',
  day_vote: 'Gündüz — Oylama',
  night: 'Gece',
  game_over: 'Oyun Bitti',
}
