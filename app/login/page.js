'use client';
import { useState, useRef, useEffect } from 'react';

export default function Login() {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  async function submit(value) {
    const p = value ?? pin;
    if (p.length < 4) { setErr('कम से कम 4 अंक'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p })
      });
      const d = await r.json();
      if (d.ok) { location.href = '/'; return; }
      if (d.locked) setErr(`बहुत ज़्यादा गलत कोशिशें — ${d.waitMin} मिनट बाद कोशिश करें`);
      else if (d.error === 'PIN_NOT_SET') setErr('PIN सेट नहीं है — npm run pin चलाएँ');
      else setErr(`गलत PIN${d.left != null ? ` — ${d.left} कोशिश बाकी` : ''}`);
      setPin('');
    } catch { setErr('कनेक्शन नहीं हुआ'); }
    setBusy(false);
  }

  function press(d) {
    if (busy) return;
    if (d === 'del') { setPin(p => p.slice(0, -1)); setErr(''); return; }
    if (d === 'ok') { submit(); return; }
    const np = (pin + d).slice(0, 6);
    setPin(np); setErr('');
    if (np.length === 6) setTimeout(() => submit(np), 120);
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box',
      background: 'radial-gradient(circle at top, #1e293b 0%, #0f1420 100%)'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: 360,
        margin: '0 auto',
        padding: '32px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
        border: '1px solid var(--line)',
        borderRadius: 16
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          border: '1px solid var(--line)'
        }}>
          <img src="/logo.png" alt="Salhotra Multi Store" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2, letterSpacing: '-0.02em' }}>Udhar Book</h2>
        <p className="mut sml" style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Salhotra Multi Store</p>
        <p className="mut sml" style={{ marginBottom: 20, fontSize: 12 }}>अपना PIN डालें</p>

        {/* PIN Indicators */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i < pin.length ? 'var(--acc)' : 'var(--line)',
              transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
              boxShadow: i < pin.length ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none',
              transition: 'all .18s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          ))}
        </div>

        <input
          ref={ref} type="password" inputMode="numeric" value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        />

        {err && (
          <div className="tag t-r" style={{
            display: 'block',
            width: '100%',
            padding: '10px 12px',
            marginBottom: 16,
            fontSize: 12,
            lineHeight: 1.4,
            borderRadius: 8
          }}>
            {err}
          </div>
        )}

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          width: '100%',
          maxWidth: 280,
          margin: '0 auto'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(k => (
            <button key={k} onClick={() => press(k)} disabled={busy}
              className={'btn ' + (k === 'ok' ? 'g' : k === 'del' ? 'o' : 'o')}
              style={{
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: k.length === 1 ? 22 : 16,
                fontWeight: 600,
                borderRadius: 12,
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease'
              }}>
              {k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}
            </button>
          ))}
        </div>

        <p className="mut sml" style={{ marginTop: 22, fontSize: 12 }}>
          {busy ? 'जाँच रहे हैं…' : '5 गलत कोशिशों पर 15 मिनट का लॉक'}
        </p>
      </div>
    </div>
  );
}
