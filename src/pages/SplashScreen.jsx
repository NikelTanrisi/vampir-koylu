// src/pages/SplashScreen.jsx
import React from 'react'

export default function SplashScreen({ onNext }) {
  return (
    <div className="screen">
      <div className="splash">
        <div className="splash-icon">🧛</div>
        <h1 className="splash-title">VAMPİR KÖYLÜ</h1>
        <p className="splash-sub">Geceyi kimin sakladığını bul...</p>
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary" onClick={onNext}>
            Oyuna Gir
          </button>
        </div>
        <p style={{ marginTop: 40, color: 'var(--text3)', fontSize: 13, fontStyle: 'italic' }}>
          Arkadaşlarınla çok oyunculu
        </p>
      </div>
    </div>
  )
}
