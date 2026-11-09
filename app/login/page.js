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
    if (p.length < 4) { fail('Please enter at least 4 digits'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p })
      });
      const d = await r.json();
      if (d.ok) { location.href = '/'; return; }
      if (d.locked) fail(`Too many failed attempts — please try again in ${d.waitMin} minutes`);
      else if (d.error === 'PIN_NOT_SET') fail('No PIN is configured yet — run: npm run pin');
      else fail(`Incorrect PIN${d.left != null ? ` — ${d.left} attempts left` : ''}`);
      setPin('');
    } catch { fail('Connection failed — please try again'); }
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
          <h1>Your entire shop record,<br /><span>all in one place.</span></h1>
          <p>Ledgers, billing, payment reminders and profit reports — on your phone or your computer, even without an internet connection.</p>

          <ul className="auth-points">
            <li><span className="ap-ico">🔐</span>
              <span><b>Secure PIN</b>Your PIN is stored as a hash, never as plain text</span></li>
            <li><span className="ap-ico">📒</span>
              <span><b>Ledger &amp; Credit</b>Every balance tracked bill by bill with FIFO accounting</span></li>
            <li><span className="ap-ico">💬</span>
              <span><b>WhatsApp Reminders</b>Send a payment reminder in a single tap</span></li>
          </ul>
        </div>

        <div className="auth-brand-foot">
          <span className="auth-dot" /> Your data stays safe on your device and in a secure database
        </div>
      </aside>

      {/* ---------- PIN panel ---------- */}
      <main className="auth-main">
        <button className="auth-theme" onClick={toggleTheme} title="Light / Dark theme">🌓</button>

        <div className="auth-card">
          <div className="auth-head">
            <h2>Enter your PIN</h2>
            <p>Use your 4 to 6 digit shop PIN to continue</p>
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
            <span>Access locks for 15 minutes after 5 incorrect attempts</span>
          </div>
        </div>

        <p className="auth-fm">Udhar Book · Salhotra Multi Store</p>
      </main>
    </div>
  );
}
