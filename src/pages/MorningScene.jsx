// src/pages/MorningScene.jsx
import React, { useEffect, useState } from 'react'
import { ref, update } from 'firebase/database'
import { ROLE_LABELS } from '../utils/gameLogic'

export default function MorningScene({ db, roomId, playerId, isAdmin, gameState }) {
  const [ready, setReady] = useState(false)

  const players = Object.values(gameState?.players || {}).filter(p => !p.left)
  const alivePlayers = players.filter(p => !p.dead)
  const deadPlayers = players.filter(p => p.dead)
  const lastResult = gameState?.lastNightResult || {}
  const roles = gameState?.roles || {}

  const killedName = lastResult.killed
    ? players.find(p => p.id === lastResult.killed)?.name
    : null

  const COLORS = [
    '#5a2252','#22525a','#524a22','#22524a','#52224a',
    '#225252','#3a3a22','#223a52','#523a22','#3a2252'
  ]

  const getColor = (name) => {
    let h = 0
    for (let c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
    return COLORS[h % COLORS.length]
  }

  const handleContinue = async () => {
    await update(ref(db, `rooms/${roomId}`), {
      showMorning: false,
      lastNightResult: null,
      personalMessages: null,
    })
  }

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <style>{`
        @keyframes vk-sunRise {
          0% { transform: translateX(-50%) translateY(50px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes vk-fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vk-breathe {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes vk-gravePop {
          0% { opacity: 0; transform: scaleY(0) translateY(4px); }
          60% { transform: scaleY(1.06) translateY(-1px); }
          100% { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        @keyframes vk-titleIn {
          from { opacity: 0; letter-spacing: 6px; }
          to { opacity: 1; letter-spacing: 2px; }
        }
        @keyframes vk-pulse {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes vk-msgIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .vk-villager { animation: vk-breathe 3s infinite ease-in-out; }
        .vk-villager:nth-child(2) { animation-delay: 0.4s; }
        .vk-villager:nth-child(3) { animation-delay: 0.8s; }
        .vk-villager:nth-child(4) { animation-delay: 0.2s; }
        .vk-villager:nth-child(5) { animation-delay: 0.6s; }
        .vk-villager:nth-child(6) { animation-delay: 1s; }
        .vk-star { animation: vk-pulse 2s infinite ease-in-out; }
      `}</style>

      {/* Gökyüzü */}
      <div style={{
        height: 130,
        background: 'linear-gradient(to bottom, #080414, #1a0c30)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Yıldızlar */}
        {[
          [30,15,2,0],[80,25,1,0.5],[140,10,2,1],[200,30,1,0.3],
          [260,18,2,0.7],[310,8,1,0.2],[350,28,2,0.9],[50,40,1,0.4],[170,35,1,0.6],[290,12,2,0.1]
        ].map(([x,y,r,d], i) => (
          <div key={i} className="vk-star" style={{
            position:'absolute', left: x, top: y,
            width: r, height: r,
            borderRadius:'50%', background:'#c8a96e',
            animationDelay: `${d}s`
          }}/>
        ))}

        {/* Güneş */}
        <div style={{
          position:'absolute', bottom:-8, left:'50%',
          width: 48, height: 48,
          background: '#c8601a',
          borderRadius:'50%',
          animation: 'vk-sunRise 1.8s 0.3s cubic-bezier(0.34,1.4,0.64,1) both',
          boxShadow: '0 0 0 10px #c8601a18, 0 0 0 20px #c8601a0a'
        }}/>

        {/* Ufuk çizgisi renk geçişi */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:30,
          background:'linear-gradient(to top, #2a1040, transparent)'
        }}/>
      </div>

      {/* Ufuk */}
      <div style={{ height:5, background:'#1e0c34', borderTop:'1px solid #3a1a60' }}/>

      {/* Zemin - köy meydanı */}
      <div style={{
        background:'#0e0818',
        padding:'18px 16px 28px',
        minHeight: 300
      }}>

        {/* Başlık */}
        <div style={{
          textAlign:'center', marginBottom:18,
          animation:'vk-titleIn 1s 0.2s ease both', opacity:0
        }}>
          <p style={{
            fontFamily:'Cinzel,serif', fontSize:13,
            color:'#c8a96e', letterSpacing:'2px',
            fontWeight:400
          }}>KÖY MEYDANI</p>
          <p style={{
            fontSize:12, color:'#5a3a4a',
            fontStyle:'italic', marginTop:3
          }}>Sabah oldu — halk meydanda toplandı</p>
        </div>

        {/* Yaşayan köylüler */}
        <div style={{
          display:'flex', flexWrap:'wrap',
          gap:10, justifyContent:'center',
          marginBottom:20,
          animation:'vk-fadeUp 0.6s 0.5s ease both', opacity:0
        }}>
          {alivePlayers.map((p, i) => (
            <div key={p.id} className="vk-villager" style={{
              display:'flex', flexDirection:'column',
              alignItems:'center', gap:4,
              animationDelay: `${0.1 + i * 0.15}s`
            }}>
              {/* Karakter figürü */}
              <div style={{ position:'relative' }}>
                {/* Baş */}
                <div style={{
                  width:32, height:32,
                  borderRadius:'50%',
                  background: getColor(p.name),
                  border:'1.5px solid #5a3a5a',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:600, color:'#fff'
                }}>
                  {p.name[0].toUpperCase()}
                </div>
                {/* Vampir rozeti */}
                {roles[p.id] === 'vampire' && playerId === p.id && (
                  <div style={{
                    position:'absolute', top:-4, right:-4,
                    fontSize:10, lineHeight:1
                  }}>🧛</div>
                )}
                {roles[p.id] === 'doctor' && playerId === p.id && (
                  <div style={{
                    position:'absolute', top:-4, right:-4,
                    fontSize:10, lineHeight:1
                  }}>💉</div>
                )}
              </div>
              {/* Vücut */}
              <div style={{
                width:22, height:16,
                borderRadius:'4px 4px 0 0',
                background: getColor(p.name),
                opacity:0.6
              }}/>
              <div style={{
                fontSize:9, color:'#8a6a5a',
                maxWidth:44, textAlign:'center',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
              }}>
                {p.name}
              </div>
              {p.id === playerId && (
                <div style={{
                  fontSize:8, color:'#c8a96e88',
                  fontStyle:'italic'
                }}>sen</div>
              )}
            </div>
          ))}
        </div>

        {/* Mezarlık — ölüler */}
        {deadPlayers.length > 0 && (
          <div style={{
            borderTop:'1px solid #2a1040',
            paddingTop:14, marginTop:4
          }}>
            <p style={{
              fontSize:9, color:'#4a2a3a',
              textAlign:'center', letterSpacing:'1px',
              fontStyle:'italic', marginBottom:10
            }}>— bu geceyi göremeyenler —</p>

            <div style={{
              display:'flex', gap:14,
              justifyContent:'center', flexWrap:'wrap'
            }}>
              {deadPlayers.map((p, i) => (
                <div key={p.id} style={{
                  display:'flex', flexDirection:'column',
                  alignItems:'center', gap:3,
                  animation:'vk-gravePop 0.5s ease both',
                  animationDelay: `${1 + i * 0.2}s`,
                  opacity:0,
                  transformOrigin:'bottom center'
                }}>
                  {/* Mezar taşı SVG */}
                  <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
                    {/* Toprak */}
                    <ellipse cx="14" cy="33" rx="11" ry="3" fill="#1a0830"/>
                    {/* Taş gövde */}
                    <rect x="4" y="14" width="20" height="18" rx="2" fill="#1e0c2a" stroke="#5a2a50" strokeWidth="1"/>
                    {/* Üst yuvarlak */}
                    <path d="M14 3 Q22 3 22 11 Q22 14 14 14 Q6 14 6 11 Q6 3 14 3Z" fill="#1e0c2a" stroke="#5a2a50" strokeWidth="1"/>
                    {/* Haç */}
                    <line x1="14" y1="18" x2="14" y2="28" stroke="#5a2a50" strokeWidth="1"/>
                    <line x1="9" y1="21" x2="19" y2="21" stroke="#5a2a50" strokeWidth="1"/>
                    {/* R.İ.P yazısı */}
                    <text x="14" y="10" textAnchor="middle" fontSize="4.5" fill="#7a4a6a" fontFamily="Georgia">R.İ.P</text>
                    {/* İsim baş harfi */}
                    <text x="14" y="26" textAnchor="middle" fontSize="6" fill="#5a3a5a" fontFamily="Georgia">
                      {p.name[0].toUpperCase()}
                    </text>
                  </svg>
                  <div style={{
                    fontSize:9, color:'#5a3a4a',
                    fontStyle:'italic',
                    maxWidth:44, textAlign:'center',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                  }}>
                    {p.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gece mesajı */}
        <div style={{
          marginTop:16,
          background:'#14082a',
          border:'1px solid #3a1a50',
          borderRadius:10,
          padding:'11px 14px',
          animation:'vk-msgIn 0.5s 1.4s ease both',
          opacity:0
        }}>
          <p style={{
            fontSize:13, color:'#c8a96e',
            textAlign:'center', fontStyle:'italic', lineHeight:1.6
          }}>
            {killedName ? (
              <>🌅 Sabah oldu... <span style={{color:'#c4405a', fontStyle:'normal'}}>{killedName}</span> bu gece hayatını kaybetti! 💀</>
            ) : lastResult.wasSaved ? (
              <>🌅 Sabah oldu... Bu gece kimse ölmedi. Birileri korundu.</>
            ) : (
              <>🌅 Sabah oldu... Bu gece köy huzurla uyudu.</>
            )}
          </p>
        </div>

        {/* Devam butonu */}
        <button
          onClick={handleContinue}
          style={{
            display:'block', width:'100%',
            marginTop:14, padding:'13px',
            background:'#8b2252',
            border:'1px solid #c4405a',
            color:'#fff', borderRadius:10,
            fontFamily:'Cinzel,serif', fontSize:13,
            letterSpacing:'0.5px', cursor:'pointer',
            animation:'vk-fadeUp 0.5s 2s ease both',
            opacity:0,
            WebkitTapHighlightColor:'transparent'
          }}
        >
          Tartışmaya Başla →
        </button>
      </div>
    </div>
  )
}
