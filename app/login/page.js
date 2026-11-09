'use client';
import { useState, useRef, useEffect } from 'react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

export default function Login() {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
    document.body.classList.add('auth');
    return () => document.body.classList.remove('auth');
  }, []);

  function toggleTheme() {
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  async function submit(value) {
    const p = value ?? pin;
    if (p.length < 4) { fail('Kam se kam 4 digit ka PIN daalein'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p })
      });
      const d = await r.json();
      if (d.ok) { location.href = '/'; return; }
      if (d.locked) fail(`Bahut saari galat koshishein — ${d.waitMin} minute baad koshish karein`);
      else if (d.error === 'PIN_NOT_SET') fail('PIN set nahi hai — npm run pin chalaayein');
      else fail(`Galat PIN${d.left != null ? ` — ${d.left} koshish baaki` : ''}`);
      setPin('');
    } catch { fail('Connection fail ho gaya — dobara koshish karein'); }
    setBusy(false);
  }

  function fail(msg) {
    setErr(msg);
    setShake(true);
    setTimeout(() => setShake(false), 420);
    if (navigator.vibrate) navigator.vibrate(60);
  }

  function press(d) {
    if (busy) return;
    if (d === 'del') { setPin(p => p.slice(0, -1)); setErr(''); return; }
    if (d === 'ok') { submit(); return; }
    const np = (pin + d).slice(0, 6);
    setPin(np); setErr('');
    if (np.length === 6) setTimeout(() => submit(np), 130);
  }

  return (
    <div className="auth-wrap">
      {/* ---------- brand / info panel ---------- */}
      <aside className="auth-brand">
        <div className="auth-brand-top">
          <div className="auth-logo">
            <img src="/logo.png" alt="Salhotra Multi Store" />
          </div>
          <div>
            <div className="auth-brand-name">Udhar Book</div>
            <div className="auth-brand-sub">Salhotra Multi Store</div>
          </div>
        </div>

        <div className="auth-brand-body">
          <h1>Apni dukaan ka<br />poora hisaab — <span>ek jagah.</span></h1>
          <p>Khata, billing, payment reminders aur munafa ki report — sab kuch aapke mobile aur computer par, bina internet ke bhi.</p>

          <ul className="auth-points">
            <li><span className="ap-ico">🔐</span>
              <span><b>Secure PIN</b>PIN hash hokar save hota hai, kabhi plain-text nahi</span></li>
            <li><span className="ap-ico">📒</span>
              <span><b>Khata &amp; Ledger</b>Har customer ka udhaar, bill-wise aur FIFO hisaab</span></li>
            <li><span className="ap-ico">💬</span>
              <span><b>WhatsApp Reminder</b>Ek tap mein payment yaad dilayein</span></li>
          </ul>
        </div>

        <div className="auth-brand-foot">
          <span className="auth-dot" /> Data aapke device aur secure database mein surakshit hai
        </div>
      </aside>

      {/* ---------- PIN panel ---------- */}
      <main className="auth-main">
        <button className="auth-theme" onClick={toggleTheme} title="Light / Dark theme">🌓</button>

        <div className="auth-card">
          <div className="auth-head">
            <h2>PIN daal kar kholein</h2>
            <p>Apna 4 se 6 digit ka shop PIN enter karein</p>
          </div>

          <div className={'pin-dots' + (shake ? ' shake' : '')} onClick={() => ref.current?.focus()}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <span key={i} className={
                'pin-dot' +
                (i < pin.length ? ' on' : '') +
                (i === pin.length && !busy ? ' next' : '')
              } />
            ))}
          </div>

          <input
            ref={ref} type="password" inputMode="numeric" autoComplete="current-password"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="pin-input" aria-label="PIN"
          />

          {err && <div className="auth-err"><span>⚠️</span>{err}</div>}

          <div className="keypad">
            {KEYS.map(k => (
              <button
                key={k} onClick={() => press(k)} disabled={busy}
                className={'key' + (k === 'ok' ? ' ok' : '') + (k === 'del' ? ' del' : '')}
                aria-label={k === 'del' ? 'Delete' : k === 'ok' ? 'Submit' : k}
              >
                {k === 'del' ? '⌫' : k === 'ok' ? (busy ? '…' : '✓') : k}
              </button>
            ))}
          </div>

          <div className="auth-secure">
            <span className="as-ico">🛡️</span>
            <span>5 baar galat PIN par 15 minute ke liye lock ho jayega</span>
          </div>
        </div>

        <p className="auth-fm">Udhar Book · Salhotra Multi Store</p>
      </main>
    </div>
  );
}
