'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { T, setLangValue, LANG } from '@/lib/i18n';
import { LIMITS, TIER } from '@/config';

/* ---------- helpers ---------- */
export const money = (n) => {
  n = Math.round((Number(n) || 0) * 100) / 100;
  const neg = n < 0; n = Math.abs(n);
  let [i, d] = n.toFixed(2).split('.');
  let last3 = i.slice(-3), rest = i.slice(0, -3);
  if (rest) last3 = ',' + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (neg ? '-' : '') + '₹' + rest + last3 + '.' + d;
};
export const fmtDate = (d) => d ? String(d).slice(0, 10).split('-').reverse().join('-') : '';
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const n2 = (x) => Math.round((Number(x) || 0) * 100) / 100;

async function api(path, opts) {
  const r = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' }, ...opts
  });
  if (r.status === 401) { location.href = '/login'; throw new Error('UNAUTHORIZED'); }
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'ERROR');
  return d;
}

/* ---------- avatar ---------- */
function initials(name) {
  const p = String(name || '?').trim().split(/\s+/);
  return ((p[0] || '')[0] || '?') + ((p[1] || '')[0] || '');
}
function avColor(id) {
  const c = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return c[h % c.length];
}
export function Avatar({ c, size = 34 }) {
  if (c?.photo_url) return <img className="av" src={c.photo_url} alt=""
    style={{ width: size, height: size }} />;
  return <span className="av ini" style={{
    width: size, height: size, background: avColor(c?.id ?? 0),
    fontSize: Math.round(size * 0.38)
  }}>{initials(c?.name)}</span>;
}

/* ---------- toast ---------- */
let pushToast = () => {};
export const toast = (m, k) => pushToast(m, k);

function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    pushToast = (msg, kind) => {
      const id = Math.random();
      setList(l => [...l, { id, msg: T(msg), kind }]);
      setTimeout(() => setList(l => l.filter(x => x.id !== id)), 3200);
    };
  }, []);
  return <div id="toasts">{list.map(t =>
    <div key={t.id} className={'toast ' + (t.kind || '')}>{t.msg}</div>)}</div>;
}

/* ---------- photo capture ---------- */
async function resizePhoto(file) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('NOT_IMAGE'));
    if (file.size > 12e6) return rej(new Error('TOO_BIG'));
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const sc = Math.min(1, LIMITS.photoMaxPx / Math.max(w, h));
        w = Math.round(w * sc); h = Math.round(h * sc);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const cx = cv.getContext('2d');
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);
        cx.drawImage(img, 0, 0, w, h);
        res(cv.toDataURL('image/jpeg', LIMITS.photoQuality));
      };
      img.onerror = () => rej(new Error('BAD_IMAGE'));
      img.src = fr.result;
    };
    fr.onerror = () => rej(new Error('READ_FAIL'));
    fr.readAsDataURL(file);
  });
}

/* ---------- auto status calculator ---------- */
export function getCustomerStatus(c, shop) {
  const bal = Number(c?.balance || 0);
  if (bal <= 0.5) return { key: 'clear', label: 'Clear', icon: '⚪', tagCls: 't-clear', name: 'Clear' };
  const days = Number(c?.days_overdue || 0);
  const highAmt = Number(shop?.thresh_high_amt ?? 10000);
  const highDays = Number(shop?.thresh_high_days ?? 45);
  const medAmt = Number(shop?.thresh_med_amt ?? 2000);
  const medDays = Number(shop?.thresh_med_days ?? 15);

  if (bal >= highAmt || days >= highDays) {
    return { key: 'high', label: 'High Risk', icon: '🔴', tagCls: 't-high', name: 'High Risk' };
  }
  if (bal >= medAmt || days >= medDays) {
    return { key: 'med', label: 'Medium Risk', icon: '🟠', tagCls: 't-med', name: 'Medium Risk' };
  }
  return { key: 'low', label: 'Low Risk', icon: '🟢', tagCls: 't-low', name: 'Low Risk' };
}

/* ---------- whatsapp modal with smart suggestions ---------- */
export function WhatsAppModal({ cust, shop, onClose }) {
  const bal = Number(cust?.balance || 0);
  const shopName = (shop?.name && shop.name !== 'मेरी दुकान') ? shop.name : 'Salhotra Multi Store';
  const shopMobile = shop?.mobile || '';
  const days = Number(cust?.days_overdue || 0);
  const st = getCustomerStatus(cust, shop);

  const templates = [
    {
      id: 'gentle',
      icon: '🟢',
      title: 'Gentle / Polite',
      desc: 'Polite reminder for normal pending',
      text: `Hello ${cust.name},\nThis is a polite reminder from ${shopName}. Your total balance is ${money(bal)}.\nPlease clear it at your earliest convenience.\nThank you! 🙏`
    },
    {
      id: 'standard',
      icon: '🟠',
      title: 'Standard / Due Date',
      desc: 'Standard reminder with days overdue',
      text: `Hello ${cust.name},\nYour account balance of ${money(bal)} is pending for ${days > 0 ? days + ' days' : 'a while'} at ${shopName}.\nKindly settle the pending payment soon.\nThank you 🙏`
    },
    {
      id: 'urgent',
      icon: '🔴',
      title: 'Urgent / High Priority',
      desc: 'Firm notice for long overdue accounts',
      text: `⚠️ URGENT NOTICE:\nDear ${cust.name},\nYour outstanding amount of ${money(bal)} has been pending for over ${days} days at ${shopName}.\nPlease clear this balance immediately today to keep your account active.\nContact: ${shopMobile} - ${shopName}`
    },
    {
      id: 'statement',
      icon: '📄',
      title: 'Account Statement',
      desc: 'Detailed summary with store contact',
      text: `Hello ${cust.name},\nAccount summary from ${shopName}:\n• Outstanding Balance: ${money(bal)}\n• Pending Days: ${days || 0}\n• Date: ${fmtDate(today())}\nFor any questions or payment confirmation, please contact us.\nThank you! 🙏`
    }
  ];

  const defaultTpl = st.key === 'high' ? 'urgent' : st.key === 'med' ? 'standard' : 'gentle';
  const [selectedId, setSelectedId] = useState(defaultTpl);
  const [msg, setMsg] = useState(templates.find(t => t.id === defaultTpl)?.text || templates[0].text);

  function selectTemplate(t) {
    setSelectedId(t.id);
    setMsg(t.text);
  }

  function copyText() {
    navigator.clipboard.writeText(msg);
    toast('Message copied to clipboard');
  }

  function sendWhatsApp() {
    if (!cust?.mobile) {
      toast('Mobile number missing', 'err');
      return;
    }
    const cleanNum = String(cust.mobile).replace(/\D/g, '');
    const url = 'https://wa.me/91' + cleanNum + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
    onClose?.();
  }

  return <div className="modal wide">
    <div className="mh">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <b>💬 WhatsApp Reminder</b>
        <span className={'tag ' + st.tagCls}>{st.icon} {st.label}</span>
      </div>
      <button className="x" onClick={onClose}>×</button>
    </div>
    <div className="mb">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: 'var(--panel2)', borderRadius: 10, marginBottom: 16,
        border: '1px solid var(--line)', flexWrap: 'wrap', gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar c={cust} size={36} />
          <div>
            <b>{cust.name}</b>
            <div className="mut sml">{cust.mobile || 'Mobile not available'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="sml mut">Total Balance</div>
          <b style={{ fontSize: 18, color: 'var(--dan)' }}>{money(bal)}</b>
          {days > 0 && <span className="sml mut" style={{ marginLeft: 6 }}>({days} days)</span>}
        </div>
      </div>

      <label style={{ marginBottom: 8 }}>Message Suggestions (Choose as needed)</label>
      <div className="tpl-list">
        {templates.map(t => (
          <div
            key={t.id}
            className={'tpl-card ' + (selectedId === t.id ? 'active' : '')}
            onClick={() => selectTemplate(t)}
          >
            <div className="tpl-title">
              <span>{t.icon} {t.title}</span>
              {selectedId === t.id && <span style={{ color: 'var(--acc2)', fontSize: 12 }}>✓</span>}
            </div>
            <div className="tpl-desc">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="field" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ margin: 0 }}>Live Preview & Edit Message</label>
          <button className="btn sm o" onClick={copyText} style={{ padding: '3px 9px', fontSize: 12 }}>
            📋 Copy
          </button>
        </div>
        <textarea
          rows={6}
          value={msg}
          onChange={e => { setMsg(e.target.value); setSelectedId('custom'); }}
          style={{ width: '100%', resize: 'vertical', lineHeight: 1.5, fontSize: 14 }}
        />
      </div>
    </div>
    <div className="mf">
      <button className="btn o" onClick={onClose}>Cancel</button>
      <button
        className="btn g"
        onClick={sendWhatsApp}
        style={{ background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span>📱</span> <b>Send via WhatsApp</b>
      </button>
    </div>
  </div>;
}

/* =====================================================================
   SHELL
   ===================================================================== */
const NAV = [
  ['Main', [['dash', '⌂', 'Dashboard'], ['pos', '🧾', 'New Bill'], ['bills', '📄', 'Bill List']]],
  ['Accounts', [['customers', '👥', 'Customers / Credit'], ['payments', '💵', 'Payments'], ['expenses', '📉', 'Expenses']]],
  ['Lists', [['items', '🏷', 'Rate List']]],
  ['Other', [['reports', '📊', 'Reports'], ['settings', '⚙', 'Settings']]]
];
const TITLES = {
  dash: 'Dashboard', pos: 'New Bill', bills: 'Bill List', customers: 'Customers & Credit',
  payments: 'Payments', expenses: 'Expenses', items: 'Rate List', reports: 'Reports', settings: 'Settings'
};

export default function Shell() {
  const [view, setView] = useState('dash');
  const [modal, setModal] = useState(null);
  const [nav, setNav] = useState(false);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  // Load shop settings and weekly summary for alerts
  const { data: shopData } = useApi('/shop', [tick]);
  const shop = shopData?.shop || null;
  const { data: weeklyData } = useApi('/weekly', [tick]);
  const highRiskCount = weeklyData?.highRisk?.length || 0;
  const alertCount = highRiskCount + (weeklyData?.overdue?.length || 0);

  // theme localStorage se
  useEffect(() => {
    const th = localStorage.getItem('theme');
    if (th === 'light') document.body.classList.add('light');
  }, []);

  function toggleTheme() {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  }
  function go(v) { setView(v); setNav(false); }

  const ctx = { refresh, setModal, go, busy, setBusy, lang: 'en', shop, weeklyData };
  const Screen = {
    dash: Dash, pos: POS, bills: Bills, customers: Customers,
    payments: Payments, expenses: Expenses, items: Items,
    reports: Reports, settings: Settings
  }[view];

  return (
    <>
      <div id="app">
        <aside id="side" className={nav ? 'open' : ''}>
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <b style={{ fontSize: 16, lineHeight: 1.2, display: 'block' }}>Udhar Book</b>
              <span style={{ fontSize: 11, color: 'var(--mut)' }}>Salhotra Multi Store</span>
            </div>
          </div>
          <nav id="nav">
            {NAV.map(([g, xs]) => (
              <div key={g}>
                <div className="grp">{T(g)}</div>
                {xs.map(([id, ic, t]) => (
                  <a key={id} className={view === id ? 'on' : ''} onClick={() => go(id)}>
                    <i>{ic}</i>{T(t)}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="foot">
            <button className="btn sm o" onClick={toggleTheme} style={{ flex: 1 }} title="Toggle Theme">🌓</button>
            <button className="btn sm o" onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/login';
            }} title="Logout">⏻</button>
          </div>
        </aside>

        {nav && <div className="navmask" onClick={() => setNav(false)} />}

        <main id="main">
          <header id="top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn sm o hamb" onClick={() => setNav(true)}>☰</button>
              <h2 id="title">{T(TITLES[view])}</h2>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className="btn sm o notif-btn"
                title={T('साप्ताहिक अलर्ट')}
                onClick={() => setModal(<Weekly shop={shop} onClose={() => setModal(null)} setModal={setModal} />)}
              >
                🔔
                {alertCount > 0 && <span className="notif-badge">{alertCount}</span>}
              </button>
              <button className="btn sm o" onClick={refresh} title="Refresh">
                {busy ? '⏳' : '↻'}
              </button>
            </div>
          </header>
          <section id="view">
            <Screen key={view + tick} {...ctx} />
          </section>
        </main>

        {modal && <div className="mask" onClick={e => e.target === e.currentTarget && setModal(null)}>
          {modal}
        </div>}
        <Toasts />
      </div>
      <div id="printarea" />
    </>
  );
}

/* ---------- data hook ---------- */
function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoad] = useState(true);
  useEffect(() => {
    let live = true;
    setLoad(true);
    api(path).then(d => { if (live) { setData(d); setErr(null); } })
      .catch(e => live && setErr(e.message))
      .finally(() => live && setLoad(false));
    return () => { live = false; };
  }, deps);
  return { data, err, loading, setData };
}

function Loading() { return <div className="empty">Loading…</div>; }
function ErrBox({ e }) {
  return <div className="card"><div className="tag t-r" style={{ display: 'block', padding: 12 }}>
    Failed to load data — {e}
  </div></div>;
}

/* =====================================================================
   DASHBOARD
   ===================================================================== */
function Dash({ go, setModal, shop, weeklyData }) {
  const { data, err, loading } = useApi('/dashboard');
  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;
  const { today: td, recv, od, topDebtors, oldest, last6, pl } = data;
  const mx = Math.max(...last6.map(m => Number(m.sale)), 1);

  const highRiskCount = weeklyData?.highRisk?.length || 0;
  const highRiskTotal = weeklyData?.highRisk?.reduce((s, c) => s + Number(c.balance), 0) || 0;

  return <>
    {/* Weekly Alert Banner */}
    {highRiskCount > 0 && (
      <div className="alert-banner">
        <div className="alert-banner-content">
          <span className="alert-banner-icon">🔔</span>
          <div>
            <b style={{ color: 'var(--dan)' }}>{T('साप्ताहिक उधार समीक्षा')}</b>
            <div className="sml mut" style={{ marginTop: 2 }}>
              {highRiskCount} {T('ग्राहक उच्च जोखिम में हैं')} · {money(highRiskTotal)} {T('फँसी रकम')}
            </div>
          </div>
        </div>
        <button
          className="btn sm w"
          onClick={() => setModal(<Weekly shop={shop} onClose={() => setModal(null)} setModal={setModal} />)}
        >
          💬 {T('रिपोर्ट देखें / WhatsApp')}
        </button>
      </div>
    )}

    <div className="grid g4" style={{ marginBottom: 16 }}>
      <Kpi cls="bl" l="आज की बिक्री" v={money(td.sale)} s={`${td.bills} ${T('बिल')}`} />
      <Kpi cls="ok" l="आज का मुनाफा" v={money(td.profit)} />
      <Kpi cls="dg" l="कुल उधार बाकी" v={money(recv.total)} s={`${recv.cnt} ${T('ग्राहक')}`} />
      <Kpi cls="wr" l="पुराने उधार" v={od.cnt} s={money(od.total)} />
    </div>

    <div className="bar">
      <button className="btn" onClick={() => go('pos')}>＋ {T('नया बिल')}</button>
      <button className="btn o" onClick={() => setModal(<CustomerForm onDone={() => { setModal(null); go('customers'); }} onClose={() => setModal(null)} />)}>
        👤 {T('नया ग्राहक')}
      </button>
      <button className="btn g" onClick={() => setModal(<PaymentForm onClose={() => setModal(null)} onDone={() => { setModal(null); go('dash'); }} />)}>
        💵 {T('भुगतान लें')}
      </button>
      <span className="sp" />
      <button className="btn w" onClick={() => setModal(<Weekly shop={shop} onClose={() => setModal(null)} setModal={setModal} />)}>
        🔔 {T('साप्ताहिक रिपोर्ट')}
      </button>
    </div>

    <div className="grid g2">
      <div className="card">
        <h3>{T('इस महीने')}</h3>
        <Row l="कुल बिक्री" v={money(pl.sale)} />
        <Row l="लागत (COGS)" v={money(pl.cogs)} />
        <Row l="ग्रॉस प्रॉफिट" v={money(pl.grossProfit)} color="var(--acc2)" />
        <Row l="खर्च" v={money(pl.expenses)} color="var(--dan)" />
        <div className="tot big"><span>{T('नेट प्रॉफिट')}</span>
          <span style={{ color: pl.netProfit >= 0 ? 'var(--acc2)' : 'var(--dan)' }}>{money(pl.netProfit)}</span></div>
      </div>
      <div className="card">
        <h3>{T('पिछले 6 महीने की बिक्री')}</h3>
        <div className="bars">{last6.map(m => (
          <div className="b" key={m.ym} title={money(m.sale)}>
            <i style={{ height: `${Math.max(3, Number(m.sale) / mx * 100)}%` }} />
            <span>{m.ym.slice(5)}</span>
          </div>
        ))}</div>
      </div>
    </div>

    <div className="grid g2">
      <DebtorCard title="सबसे ज़्यादा उधार" rows={topDebtors} setModal={setModal} shop={shop} empty="कोई उधार नहीं ✓" />
      <DebtorCard title="सबसे पुराने उधार" rows={oldest} setModal={setModal} shop={shop} empty="कोई पुराना उधार नहीं ✓" />
    </div>
  </>;
}

function Kpi({ cls, l, v, s }) {
  return <div className={'kpi ' + cls}>
    <div className="l">{T(l)}</div><div className="v">{v}</div>
    {s && <div className="s">{s}</div>}
  </div>;
}
function Row({ l, v, color }) {
  return <div className="tot"><span className="mut">{T(l)}</span><b style={color ? { color } : {}}>{v}</b></div>;
}
function DebtorCard({ title, rows, setModal, empty, shop }) {
  return <div className="card"><h3>{T(title)}</h3>
    {rows.length ? <div className="tw"><table>
      <thead><tr><th>{T('ग्राहक')}</th><th className="r">{T('रकम')}</th><th className="r">{T('दिन')}</th><th>{T('स्थिति')}</th><th /></tr></thead>
      <tbody>{rows.map(c => {
        const st = getCustomerStatus(c, shop);
        return <tr key={c.id}>
          <td style={{ cursor: 'pointer' }} onClick={() => setModal(<Ledger id={c.id} shop={shop} onClose={() => setModal(null)} setModal={setModal} />)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar c={c} size={26} /><b>{c.name}</b></div>
          </td>
          <td className="num"><b style={{ color: 'var(--dan)' }}>{money(c.balance)}</b></td>
          <td className="num">{c.days_overdue}</td>
          <td><span className={'tag ' + st.tagCls}>{st.icon} {T(st.label)}</span></td>
          <td className="c">
            {c.mobile && (
              <button
                className="btn sm w"
                title={T('व्हाट्सएप रिमाइंडर')}
                onClick={() => setModal(<WhatsAppModal cust={c} shop={shop} onClose={() => setModal(null)} />)}
              >
                WA
              </button>
            )}
          </td>
        </tr>;
      })}</tbody>
    </table></div> : <div className="empty">{T(empty)}</div>}
  </div>;
}

/* =====================================================================
   POS
   ===================================================================== */
function POS({ refresh, setModal }) {
  const [lines, setLines] = useState([]);
  const [custId, setCustId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [mode, setMode] = useState('Cash');
  const [paid, setPaid] = useState(0);
  const [q, setQ] = useState('');
  const [sug, setSug] = useState([]);
  const [hi, setHi] = useState(0);
  const [saving, setSaving] = useState(false);
  const { data: custs } = useApi('/customers');
  const searchRef = useRef(null);

  const sub = n2(lines.reduce((s, l) => s + l.qty * l.rate - l.disc, 0));
  const total = n2(sub - discount);
  const cust = custs?.find(c => String(c.id) === String(custId));

  useEffect(() => { if (mode === 'Cash' || mode === 'UPI') setPaid(total); }, [total, mode]);

  useEffect(() => {
    if (!q.trim()) { setSug([]); return; }
    const t = setTimeout(() => {
      api('/items?q=' + encodeURIComponent(q)).then(r => { setSug(r.slice(0, 8)); setHi(0); }).catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  function addLine(i) {
    setLines(ls => {
      const ex = ls.find(l => l.item_id === i.id);
      if (ex) return ls.map(l => l.item_id === i.id ? { ...l, qty: n2(l.qty + 1) } : l);
      return [...ls, {
        item_id: i.id, name: i.name, unit: i.unit, qty: 1,
        rate: Number(i.sale_rate), cost_rate: Number(i.cost_rate), disc: 0
      }];
    });
    setQ(''); setSug([]); searchRef.current?.focus();
  }
  function setL(idx, f, v) {
    setLines(ls => ls.map((l, i) => i === idx ? { ...l, [f]: Number(v) || 0 } : l));
  }
  function key(e) {
    if (!sug.length) return;
    if (e.key === 'ArrowDown') { setHi(h => (h + 1) % sug.length); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setHi(h => (h - 1 + sug.length) % sug.length); e.preventDefault(); }
    else if (e.key === 'Enter') { addLine(sug[hi]); e.preventDefault(); }
  }

  async function save(print) {
    if (!lines.length) return;
    if ((mode === 'Udhaar' || mode === 'Partial') && !custId) {
      toast('उधार के लिए ग्राहक चुनना ज़रूरी है', 'err'); return;
    }
    setSaving(true);
    try {
      const sale = await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          items: lines, discount, paid, pay_mode: mode,
          customer_id: custId || null, customer_name: cust?.name || 'नकद ग्राहक'
        })
      });
      toast(`${T('बिल')} ${sale.bill_no} ${T('सेव हुआ')} — ${money(sale.total)}`);
      setLines([]); setCustId(''); setDiscount(0); setMode('Cash'); setPaid(0);
      refresh();
      if (print) { const full = await api('/sales/' + sale.id); printBill(full, cust); }
    } catch (e) { toast('बिल सेव नहीं हुआ: ' + e.message, 'err'); }
    setSaving(false);
  }

  return <div className="pos">
    <div>
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <label>{T('ग्राहक')}</label>
            <select value={custId} onChange={e => setCustId(e.target.value)}>
              <option value="">{T('नकद ग्राहक (Walk-in)')}</option>
              {custs?.map(c => <option key={c.id} value={c.id}>{c.name} — {c.mobile}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn o" onClick={() => setModal(
              <CustomerForm onClose={() => setModal(null)} onDone={c => { setModal(null); setCustId(String(c.id)); }} />
            )}>＋ {T('नया')}</button>
          </div>
        </div>
        {cust && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Avatar c={cust} size={30} /><b>{cust.name}</b>
          {Number(cust.balance) > 0 && <span className="tag t-w">{T('पुराना उधार')}: {money(cust.balance)}</span>}
          {Number(cust.credit_limit) > 0 && Number(cust.balance) > Number(cust.credit_limit) &&
            <span className="tag t-r">{T('लिमिट पार')}</span>}
        </div>}

        <label>{T('आइटम खोजें — नाम / कोड / बारकोड टाइप करें')}</label>
        <div className="sug">
          <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={key}
            placeholder={T('जैसे: चीनी, आटा, I1001 …')} autoComplete="off" />
          {sug.length > 0 && <div className="sugbox">
            {sug.map((i, x) => (
              <div key={i.id} className={x === hi ? 'hi' : ''} onClick={() => addLine(i)}>
                <b>{i.name}</b> <span className="mut">· {i.code}</span>
                <div className="sml mut">{money(i.sale_rate)}/{i.unit}</div>
              </div>
            ))}
          </div>}
        </div>
      </div>

      <div className="card">
        <div className="tw"><table>
          <thead><tr><th style={{ width: 34 }}>#</th><th>{T('आइटम')}</th>
            <th className="r" style={{ width: 90 }}>{T('मात्रा')}</th>
            <th className="r" style={{ width: 100 }}>{T('भाव')}</th>
            <th className="r" style={{ width: 90 }}>{T('छूट')}</th>
            <th className="r">{T('रकम')}</th><th style={{ width: 34 }} /></tr></thead>
          <tbody>{lines.length ? lines.map((l, i) => (
            <tr key={i}>
              <td className="mut">{i + 1}</td>
              <td><b>{l.name}</b><div className="sml mut">{l.unit}</div></td>
              <td><input className="num" type="number" step="0.01" value={l.qty} onChange={e => setL(i, 'qty', e.target.value)} /></td>
              <td><input className="num" type="number" step="0.01" value={l.rate} onChange={e => setL(i, 'rate', e.target.value)} /></td>
              <td><input className="num" type="number" step="0.01" value={l.disc} onChange={e => setL(i, 'disc', e.target.value)} /></td>
              <td className="num"><b>{money(l.qty * l.rate - l.disc)}</b></td>
              <td><button className="x" onClick={() => setLines(ls => ls.filter((_, x) => x !== i))}>×</button></td>
            </tr>
          )) : <tr><td colSpan={7} className="empty">{T('ऊपर सर्च करके आइटम जोड़ें')}</td></tr>}</tbody>
        </table></div>
      </div>
    </div>

    <div>
      <div className="card">
        <h3>{T('भुगतान')}</h3>
        <div className="tot"><span className="mut">{T('सब-टोटल')}</span><b>{money(sub)}</b></div>
        <div className="tot"><span className="mut">{T('बिल छूट')}</span>
          <input className="num" type="number" style={{ width: 110 }} value={discount}
            onChange={e => setDiscount(Number(e.target.value) || 0)} /></div>
        <div className="tot big"><span>{T('कुल')}</span><span>{money(total)}</span></div>
        <div style={{ height: 14 }} />
        <label>{T('पेमेंट मोड')}</label>
        <div className="pm">
          {[['Cash', '💵 ' + T('नकद')], ['UPI', '📱 UPI'], ['Udhaar', '📒 ' + T('उधार')], ['Partial', '½ ' + T('आंशिक')]]
            .map(([m, lbl]) => (
              <button key={m} className={mode === m ? 'on' : ''}
                onClick={() => { setMode(m); setPaid(m === 'Udhaar' ? 0 : total); }}>{lbl}</button>
            ))}
        </div>
        {mode === 'Partial' && <div className="field"><label>{T('अभी मिले')}</label>
          <input className="num" type="number" value={paid} onChange={e => setPaid(Number(e.target.value) || 0)} /></div>}
        {(mode === 'Udhaar' || mode === 'Partial') &&
          <div className="tot"><span className="mut">{T('खाते में जाएगा')}</span>
            <b style={{ color: 'var(--dan)' }}>{money(total - paid)}</b></div>}
        {(mode === 'Udhaar' || mode === 'Partial') && !custId &&
          <div className="tag t-r" style={{ margin: '8px 0', display: 'block', padding: 8 }}>{T('उधार के लिए ग्राहक चुनें')}</div>}
        <div style={{ height: 12 }} />
        <button className="btn g" style={{ width: '100%', padding: 14, fontSize: 16 }}
          disabled={!lines.length || saving} onClick={() => save(true)}>
          {saving ? '…' : T('सेव + प्रिंट')}
        </button>
        <div style={{ height: 8 }} />
        <div className="row">
          <button className="btn o" disabled={!lines.length || saving} onClick={() => save(false)}>{T('सिर्फ सेव')}</button>
          <button className="btn r" onClick={() => { setLines([]); setDiscount(0); setMode('Cash'); }}>{T('रद्द')}</button>
        </div>
      </div>
    </div>
  </div>;
}

/* =====================================================================
   CUSTOMERS
   ===================================================================== */
function Customers({ setModal, refresh, shop }) {
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('');
  const [dq, setDq] = useState('');
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  const { data, err, loading } = useApi('/customers?q=' + encodeURIComponent(dq), [dq]);

  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;
  let rows = data;
  if (only === 'high') rows = rows.filter(c => getCustomerStatus(c, shop).key === 'high');
  else if (only === 'med') rows = rows.filter(c => getCustomerStatus(c, shop).key === 'med');
  else if (only === 'low') rows = rows.filter(c => getCustomerStatus(c, shop).key === 'low');
  else if (only === 'due') rows = rows.filter(c => Number(c.balance) > 0.5);
  else if (only === 'clear') rows = rows.filter(c => Number(c.balance) <= 0.5);

  const ag = {};
  data.filter(c => Number(c.balance) > 0.5).forEach(c => {
    ag[c.ageing_bucket] = (ag[c.ageing_bucket] || 0) + Number(c.balance);
  });

  const highCnt = data.filter(c => getCustomerStatus(c, shop).key === 'high').length;
  const medCnt = data.filter(c => getCustomerStatus(c, shop).key === 'med').length;
  const lowCnt = data.filter(c => getCustomerStatus(c, shop).key === 'low').length;
  const clearCnt = data.filter(c => getCustomerStatus(c, shop).key === 'clear').length;

  return <>
    <div className="bar">
      <div style={{ flex: 2 }}><label>{T('खोजें')}</label>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={T('नाम / मोबाइल')} /></div>
      <div><label>{T('फ़िल्टर (ऑटो स्टेटस)')}</label>
        <select value={only} onChange={e => setOnly(e.target.value)}>
          <option value="">{T('सभी ग्राहक')} ({data.length})</option>
          <option value="high">🔴 {T('उच्च जोखिम')} ({highCnt})</option>
          <option value="med">🟠 {T('मध्यम जोखिम')} ({medCnt})</option>
          <option value="low">🟢 {T('सामान्य जोखिम')} ({lowCnt})</option>
          <option value="due">{T('जिन पर उधार है')}</option>
          <option value="clear">⚪ {T('क्लियर')} ({clearCnt})</option>
        </select></div>
      <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
        <button className="btn" onClick={() => setModal(
          <CustomerForm onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />
        )}>＋ {T('ग्राहक')}</button></div>
      <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
        <button className="btn r" onClick={() => printDefaulters(data.filter(c => Number(c.balance) > 0.5), ag)}>
          📄 {T('उधार PDF')}</button></div>
    </div>

    <div className="grid g4" style={{ marginBottom: 14 }}>
      <div className="kpi dg" style={{ cursor: 'pointer' }} onClick={() => setOnly(only === 'high' ? '' : 'high')}>
        <div className="l">🔴 {T('उच्च जोखिम')}</div>
        <div className="v">{highCnt} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--mut)' }}>{T('ग्राहक')}</span></div>
      </div>
      <div className="kpi wr" style={{ cursor: 'pointer' }} onClick={() => setOnly(only === 'med' ? '' : 'med')}>
        <div className="l">🟠 {T('मध्यम जोखिम')}</div>
        <div className="v">{medCnt} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--mut)' }}>{T('ग्राहक')}</span></div>
      </div>
      <div className="kpi ok" style={{ cursor: 'pointer' }} onClick={() => setOnly(only === 'low' ? '' : 'low')}>
        <div className="l">🟢 {T('सामान्य जोखिम')}</div>
        <div className="v">{lowCnt} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--mut)' }}>{T('ग्राहक')}</span></div>
      </div>
      <div className="kpi bl" style={{ cursor: 'pointer' }} onClick={() => setOnly(only === 'clear' ? '' : 'clear')}>
        <div className="l">⚪ {T('क्लियर')}</div>
        <div className="v">{clearCnt} <span style={{ fontSize: 13, fontWeight: 'normal', color: 'var(--mut)' }}>{T('ग्राहक')}</span></div>
      </div>
    </div>

    <div className="card"><div className="tw"><table>
      <thead><tr><th>{T('नाम')}</th><th>{T('मोबाइल')}</th><th className="r">{T('बाकी रकम')}</th>
        <th className="r">{T('दिन')}</th><th>{T('ऑटो स्टेटस')}</th><th /></tr></thead>
      <tbody>{rows.length ? rows.map(c => {
        const bal = Number(c.balance);
        const st = getCustomerStatus(c, shop);
        return <tr key={c.id}>
          <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar c={c} size={34} /><b>{c.name}</b></div></td>
          <td className="mut">{c.mobile}</td>
          <td className="num"><b style={{ color: bal > 0 ? 'var(--dan)' : 'var(--acc2)' }}>{money(bal)}</b></td>
          <td className="num">{bal > 0 ? c.days_overdue : '—'}</td>
          <td><span className={'tag ' + st.tagCls}>{st.icon} {T(st.label)}</span></td>
          <td className="c" style={{ whiteSpace: 'nowrap' }}>
            <button className="btn sm o" onClick={() => setModal(<Ledger id={c.id} shop={shop} onClose={() => setModal(null)} setModal={setModal} />)}>{T('खाता')}</button>{' '}
            <button className="btn sm g" onClick={() => setModal(<PaymentForm cust={c} onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />)}>💵</button>{' '}
            {c.mobile && bal > 0 && <button className="btn sm w" title={T('व्हाट्सएप रिमाइंडर')} onClick={() => setModal(<WhatsAppModal cust={c} shop={shop} onClose={() => setModal(null)} />)}>WA</button>}{' '}
            <button className="btn sm o" onClick={() => setModal(<CustomerForm cust={c} onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />)}>✎</button>
          </td>
        </tr>;
      }) : <tr><td colSpan={6} className="empty">{T('कोई ग्राहक नहीं')}</td></tr>}</tbody>
    </table></div></div>
  </>;
}

function wa(c, shop) {
  const shopName = (shop?.name && shop.name !== 'मेरी दुकान') ? shop.name : 'Salhotra Multi Store';
  const msg = LANG === 'en'
    ? `Hello ${c.name},\nYour outstanding amount is ${money(c.balance)}.\nKindly clear it soon.\nThank you 🙏`
    : `नमस्ते ${c.name} जी,\nआपकी दुकान ${shopName} से कुल ${money(c.balance)} बकाया है।\nकृपया जल्दी जमा करें।\nधन्यवाद 🙏`;
  window.open('https://wa.me/91' + String(c.mobile).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg), '_blank');
}

/* ---------- customer form (photo ke saath) ---------- */
function CustomerForm({ cust, onClose, onDone }) {
  const [f, setF] = useState({
    name: cust?.name || '', mobile: cust?.mobile || '', address: cust?.address || '',
    opening: cust?.opening || 0, credit_limit: cust?.credit_limit || 0, note: cust?.note || ''
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPrev] = useState(cust?.photo_url || null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cam, setCam] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  async function pick(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
      const d = await resizePhoto(file);
      setPhoto(d); setPrev(d); setRemoved(false); toast('फोटो जुड़ गई');
    } catch (err) {
      toast({ NOT_IMAGE: 'यह इमेज फाइल नहीं है', TOO_BIG: 'फोटो बहुत बड़ी है' }[err.message] || 'फोटो लोड नहीं हुई', 'err');
    }
    e.target.value = '';
  }
  async function save() {
    if (!f.name.trim()) { toast('नाम ज़रूरी है', 'err'); return; }
    setBusy(true);
    try {
      const body = { ...f, ...(photo ? { photo } : {}), ...(removed ? { removePhoto: true } : {}) };
      const c = cust
        ? await api('/customers/' + cust.id, { method: 'PUT', body: JSON.stringify(body) })
        : await api('/customers', { method: 'POST', body: JSON.stringify(body) });
      toast('ग्राहक सेव हुआ'); onDone?.(c);
    } catch (e) { toast('सेव नहीं हुआ: ' + e.message, 'err'); }
    setBusy(false);
  }

  return <div className="modal">
    <div className="mh"><b>{T(cust ? 'ग्राहक एडिट' : 'नया ग्राहक')}</b>
      <button className="x" onClick={onClose}>×</button></div>
    <div className="mb">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        {preview ? <img className="av" src={preview} style={{ width: 76, height: 76 }} alt="" />
          : <span className="av ini" style={{ width: 76, height: 76, background: 'var(--line)', fontSize: 29 }}>?</span>}
        <div style={{ flex: 1 }}>
          <label>{T('ग्राहक की फोटो')}</label>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn sm o" onClick={() => fileRef.current.click()}>📁 {T('फोटो चुनें')}</button>
            <button className="btn sm o" onClick={() => setCam(true)}>📷 {T('कैमरा')}</button>
            {preview && <button className="btn sm r" onClick={() => { setPhoto(null); setPrev(null); setRemoved(true); }}>{T('हटाएँ')}</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
          <div className="sml mut" style={{ marginTop: 6 }}>{T('वैकल्पिक — पहचान के लिए')}</div>
        </div>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 2 }}><label>{T('नाम *')}</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
        <div className="field"><label>{T('मोबाइल')}</label>
          <input value={f.mobile} onChange={e => set('mobile', e.target.value)} /></div>
      </div>
      <div className="field"><label>{T('पता')}</label>
        <input value={f.address} onChange={e => set('address', e.target.value)} /></div>
      <div className="row">
        <div className="field"><label>{T('ओपनिंग बैलेंस (पुराना उधार)')}</label>
          <input type="number" value={f.opening} onChange={e => set('opening', e.target.value)} /></div>
        <div className="field"><label>{T('क्रेडिट लिमिट')}</label>
          <input type="number" value={f.credit_limit} onChange={e => set('credit_limit', e.target.value)} /></div>
      </div>
      <div className="field"><label>{T('नोट')}</label>
        <input value={f.note} onChange={e => set('note', e.target.value)} /></div>
    </div>
    <div className="mf">
      <button className="btn o" onClick={onClose}>{T('रद्द')}</button>
      <button className="btn g" onClick={save} disabled={busy}>{busy ? '…' : T('सेव')}</button>
    </div>
    {cam && <Camera onClose={() => setCam(false)} onShot={d => { setPhoto(d); setPrev(d); setRemoved(false); setCam(false); toast('फोटो ले ली गई'); }} />}
  </div>;
}

function Camera({ onClose, onShot }) {
  const v = useRef(null);
  const stream = useRef(null);
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: 640 } })
      .then(s => { stream.current = s; if (v.current) v.current.srcObject = s; })
      .catch(() => { toast('कैमरा नहीं खुला — अनुमति दें', 'err'); onClose(); });
    return () => stream.current?.getTracks().forEach(t => t.stop());
  }, []);
  function shot() {
    const vid = v.current; if (!vid) return;
    const sz = LIMITS.photoMaxPx;
    const cv = document.createElement('canvas'); cv.width = sz; cv.height = sz;
    const m = Math.min(vid.videoWidth, vid.videoHeight);
    cv.getContext('2d').drawImage(vid, (vid.videoWidth - m) / 2, (vid.videoHeight - m) / 2, m, m, 0, 0, sz, sz);
    onShot(cv.toDataURL('image/jpeg', LIMITS.photoQuality));
  }
  return <div className="mask" style={{ zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal" style={{ maxWidth: 420 }}>
      <div className="mh"><b>{T('फोटो लें')}</b><button className="x" onClick={onClose}>×</button></div>
      <div className="mb c"><video ref={v} autoPlay playsInline style={{ width: '100%', borderRadius: 10, background: '#000' }} /></div>
      <div className="mf"><button className="btn o" onClick={onClose}>{T('रद्द')}</button>
        <button className="btn g" onClick={shot}>📷 {T('खींचें')}</button></div>
    </div>
  </div>;
}

/* ---------- ledger ---------- */
function Ledger({ id, onClose, setModal, shop }) {
  const { data: c, err, loading } = useApi('/customers/' + id);
  if (loading) return <div className="modal"><div className="mb"><Loading /></div></div>;
  if (err) return <div className="modal"><div className="mb"><ErrBox e={err} /></div></div>;
  const bal = Number(c.balance);
  const st = getCustomerStatus(c, shop);

  return <div className="modal wide">
    <div className="mh">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <b>{T('खाता')} — {c.name}</b>
        <span className={'tag ' + st.tagCls}>{st.icon} {T(st.label)}</span>
      </div>
      <button className="x" onClick={onClose}>×</button>
    </div>
    <div className="mb">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <Avatar c={c} size={64} />
        <div><div style={{ fontSize: 19, fontWeight: 700 }}>{c.name}</div>
          <div className="sml mut">{c.mobile || '—'}{c.address ? ' · ' + c.address : ''}</div>
          {c.note && <div className="sml mut">{c.note}</div>}</div>
      </div>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className={'kpi ' + (bal > 0 ? 'dg' : 'ok')}>
          <div className="l">{T(bal < 0 ? 'एडवांस जमा' : 'बकाया')}</div>
          <div className="v">{money(Math.abs(bal))}</div></div>
        <div className="kpi wr"><div className="l">{T('क्रेडिट लिमिट')}</div>
          <div className="v" style={{ fontSize: 18 }}>{Number(c.credit_limit) ? money(c.credit_limit) : '—'}</div></div>
        <div className="kpi bl"><div className="l">{T('दिन')}</div><div className="v">{c.days_overdue || 0}</div></div>
        <div className="kpi ok"><div className="l">{T('कुल लेन-देन')}</div><div className="v">{c.ledger.length}</div></div>
      </div>

      <div className="tw"><table>
        <thead><tr><th>{T('तारीख')}</th><th>{T('विवरण')}</th>
          <th className="r">{T('उधार (Dr)')}</th><th className="r">{T('जमा (Cr)')}</th>
          <th className="r">{T('बैलेंस')}</th></tr></thead>
        <tbody>
          {c.ledger.length ? c.ledger.map((r, i) => (
            <tr key={i}><td>{fmtDate(r.date)}</td><td>{T(r.desc)}</td>
              <td className="num">{Number(r.dr) ? money(r.dr) : '—'}</td>
              <td className="num" style={{ color: 'var(--acc2)' }}>{Number(r.cr) ? money(r.cr) : '—'}</td>
              <td className="num"><b>{money(r.bal)}</b></td></tr>
          )) : <tr><td colSpan={5} className="empty">{T('कोई लेन-देन नहीं')}</td></tr>}
          {c.ledger.length > 0 && <tr style={{ background: 'var(--panel2)' }}>
            <td colSpan={4} className="r"><b>{T(bal < 0 ? 'एडवांस जमा' : 'कुल बकाया')}</b></td>
            <td className="num"><b style={{ color: bal > 0 ? 'var(--dan)' : 'var(--acc2)' }}>{money(Math.abs(bal))}</b></td>
          </tr>}
        </tbody>
      </table></div>

      {c.bills?.length > 0 && <>
        <h3 style={{ marginTop: 18 }}>{T('बिल-वार बाकी')}</h3>
        <div className="tw"><table>
          <thead><tr><th>{T('बिल नं')}</th><th>{T('तारीख')}</th>
            <th className="r">{T('कुल उधार था')}</th><th className="r">{T('अब बाकी')}</th></tr></thead>
          <tbody>{c.bills.map(b => (
            <tr key={b.sale_id}><td>{b.bill_no}</td><td>{fmtDate(b.bill_date)}</td>
              <td className="num mut">{money(b.original_due)}</td>
              <td className="num"><b style={{ color: Number(b.remaining) > 0 ? 'var(--dan)' : 'var(--acc2)' }}>
                {Number(b.remaining) > 0 ? money(b.remaining) : T('चुका दिया')}</b></td></tr>
          ))}</tbody>
        </table></div>
      </>}
    </div>
    <div className="mf">
      {c.mobile && bal > 0 && (
        <button
          className="btn w"
          title={T('व्हाट्सएप रिमाइंडर')}
          onClick={() => setModal(<WhatsAppModal cust={c} shop={shop} onClose={() => setModal(null)} />)}
        >
          💬 WhatsApp
        </button>
      )}
      <button className="btn o" onClick={() => printLedger(c)}>📄 {T('स्टेटमेंट PDF')}</button>
      <button className="btn g" onClick={() => setModal(<PaymentForm cust={c} onClose={onClose} onDone={onClose} />)}>
        💵 {T('भुगतान लें')}</button>
      <button className="btn o" onClick={onClose}>{T('बंद')}</button>
    </div>
  </div>;
}

/* ---------- payment ---------- */
function PaymentForm({ cust, onClose, onDone }) {
  const { data: custs } = useApi('/customers');
  const [cid, setCid] = useState(cust?.id || '');
  const [amt, setAmt] = useState(cust ? Math.max(0, Number(cust.balance)) : '');
  const [date, setDate] = useState(today());
  const [mode, setMode] = useState('Cash');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const sel = custs?.find(c => String(c.id) === String(cid));

  async function save() {
    if (!cid || !Number(amt)) { toast('पार्टी और रकम ज़रूरी है', 'err'); return; }
    setBusy(true);
    try {
      await api('/payments', {
        method: 'POST',
        body: JSON.stringify({ customer_id: Number(cid), amount: Number(amt), pay_date: date, mode, note })
      });
      toast(`${T('भुगतान दर्ज हुआ')} — ${money(amt)}`); onDone?.();
    } catch (e) { toast('सेव नहीं हुआ: ' + e.message, 'err'); }
    setBusy(false);
  }

  return <div className="modal">
    <div className="mh"><b>{T('ग्राहक से भुगतान प्राप्त')}</b><button className="x" onClick={onClose}>×</button></div>
    <div className="mb">
      <div className="field"><label>{T('ग्राहक')} *</label>
        <select value={cid} onChange={e => {
          setCid(e.target.value);
          const c = custs?.find(x => String(x.id) === e.target.value);
          if (c && Number(c.balance) > 0) setAmt(Number(c.balance));
        }}>
          <option value="">— {T('चुनें')} —</option>
          {custs?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></div>
      {sel && <div className="sml mut" style={{ marginBottom: 12 }}>
        <span className={'tag ' + (Number(sel.balance) > 0 ? 't-r' : 't-g')}>
          {T('बकाया')}: {money(sel.balance)}</span></div>}
      <div className="row">
        <div className="field"><label>{T('रकम *')}</label>
          <input type="number" step="0.01" value={amt} onChange={e => setAmt(e.target.value)} autoFocus /></div>
        <div className="field"><label>{T('तारीख')}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="field"><label>{T('मोड')}</label>
          <select value={mode} onChange={e => setMode(e.target.value)}>
            {['Cash', 'UPI', 'Bank', 'Cheque'].map(m => <option key={m} value={m}>{m}</option>)}
          </select></div>
      </div>
      <div className="field"><label>{T('नोट')}</label>
        <input value={note} onChange={e => setNote(e.target.value)} /></div>
    </div>
    <div className="mf"><button className="btn o" onClick={onClose}>{T('रद्द')}</button>
      <button className="btn g" onClick={save} disabled={busy}>{busy ? '…' : T('सेव')}</button></div>
  </div>;
}

/* =====================================================================
   BILLS / PAYMENTS / EXPENSES / ITEMS / REPORTS / SETTINGS
   ===================================================================== */
function Bills({ setModal, refresh }) {
  const [from, setFrom] = useState(addDays(today(), -30));
  const [to, setTo] = useState(today());
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  const { data, err, loading } = useApi(`/sales?from=${from}&to=${to}&q=${encodeURIComponent(dq)}`, [from, to, dq]);
  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;
  const live = data.filter(s => !s.is_void);

  return <>
    <div className="bar">
      <div style={{ flex: '0 0 150px' }}><label>{T('से')}</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
      <div style={{ flex: '0 0 150px' }}><label>{T('तक')}</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
      <div style={{ flex: 1 }}><label>{T('खोजें')}</label>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={T('बिल नं / ग्राहक')} /></div>
    </div>
    <div className="grid g4" style={{ marginBottom: 14 }}>
      <Kpi cls="bl" l="बिल" v={live.length} />
      <Kpi cls="ok" l="कुल बिक्री" v={money(live.reduce((s, r) => s + Number(r.total), 0))} />
      <Kpi cls="ok" l="मुनाफा" v={money(live.reduce((s, r) => s + Number(r.profit), 0))} />
      <Kpi cls="dg" l="उधार गया" v={money(live.reduce((s, r) => s + Number(r.due), 0))} />
    </div>
    <div className="card"><div className="tw"><table>
      <thead><tr><th>{T('बिल नं')}</th><th>{T('तारीख')}</th><th>{T('ग्राहक')}</th>
        <th className="r">{T('कुल')}</th><th className="r">{T('मिले')}</th><th className="r">{T('उधार')}</th>
        <th>{T('मोड')}</th><th /></tr></thead>
      <tbody>{data.length ? data.map(s => (
        <tr key={s.id} style={s.is_void ? { opacity: .4, textDecoration: 'line-through' } : {}}>
          <td><b>{s.bill_no}</b></td><td>{fmtDate(s.bill_date)}</td><td>{s.customer_name}</td>
          <td className="num"><b>{money(s.total)}</b></td><td className="num">{money(s.paid)}</td>
          <td className="num">{Number(s.due) > 0 ? <span className="tag t-r">{money(s.due)}</span> : <span className="tag t-g">0</span>}</td>
          <td><span className="tag t-b">{s.pay_mode}</span></td>
          <td className="c" style={{ whiteSpace: 'nowrap' }}>
            <button className="btn sm o" onClick={async () => printBill(await api('/sales/' + s.id))}>🖨</button>{' '}
            {!s.is_void && <button className="btn sm r" onClick={async () => {
              if (!confirm(T('यह बिल रद्द करें?'))) return;
              await api('/sales/' + s.id, { method: 'DELETE' }); toast('बिल रद्द हुआ', 'warn'); refresh();
            }}>{T('रद्द')}</button>}
          </td></tr>
      )) : <tr><td colSpan={8} className="empty">{T('कोई बिल नहीं')}</td></tr>}</tbody>
    </table></div></div>
  </>;
}

function Payments({ setModal, refresh }) {
  const { data, err, loading } = useApi('/payments');
  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;
  return <>
    <div className="bar">
      <button className="btn g" onClick={() => setModal(
        <PaymentForm onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />
      )}>💵 {T('ग्राहक से भुगतान लें')}</button>
      <span className="sp" />
      <span className="tag t-g">{T('कुल प्राप्त')} {money(data.reduce((s, p) => s + Number(p.amount), 0))}</span>
    </div>
    <div className="card"><div className="tw"><table>
      <thead><tr><th>{T('तारीख')}</th><th>{T('ग्राहक')}</th><th className="r">{T('रकम')}</th>
        <th>{T('मोड')}</th><th>{T('नोट')}</th></tr></thead>
      <tbody>{data.length ? data.map(p => (
        <tr key={p.id}><td>{fmtDate(p.pay_date)}</td><td>{p.customer_name}</td>
          <td className="num"><b>{money(p.amount)}</b></td><td>{p.mode}</td>
          <td className="mut sml">{p.note}</td></tr>
      )) : <tr><td colSpan={5} className="empty">{T('कोई भुगतान नहीं')}</td></tr>}</tbody>
    </table></div></div>
  </>;
}

function Expenses({ setModal, refresh }) {
  const { data, err, loading } = useApi('/expenses');
  const [f, setF] = useState({ category: 'किराया', amount: '', exp_date: today(), note: '' });
  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;
  const ym = today().slice(0, 7);
  const mtot = data.filter(e => String(e.exp_date).startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0);

  async function add() {
    if (!Number(f.amount)) { toast('रकम डालें', 'err'); return; }
    await api('/expenses', { method: 'POST', body: JSON.stringify(f) });
    toast('खर्च दर्ज हुआ'); setF({ ...f, amount: '', note: '' }); refresh();
  }

  return <>
    <div className="card"><h3>{T('नया खर्च')}</h3>
      <div className="row">
        <div className="field"><label>{T('श्रेणी')}</label>
          <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
            {['किराया', 'बिजली', 'तनख्वाह', 'ट्रांसपोर्ट', 'चाय-पानी', 'मरम्मत', 'पैकिंग', 'अन्य']
              .map(c => <option key={c} value={c}>{T(c)}</option>)}
          </select></div>
        <div className="field"><label>{T('रकम *')}</label>
          <input type="number" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></div>
        <div className="field"><label>{T('तारीख')}</label>
          <input type="date" value={f.exp_date} onChange={e => setF({ ...f, exp_date: e.target.value })} /></div>
        <div className="field"><label>{T('नोट')}</label>
          <input value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></div>
        <div className="field" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn g" onClick={add}>＋ {T('जोड़ें')}</button></div>
      </div>
    </div>
    <div className="bar"><span className="sp" /><span className="tag t-r">{T('इस महीने')} {money(mtot)}</span></div>
    <div className="card"><div className="tw"><table>
      <thead><tr><th>{T('तारीख')}</th><th>{T('श्रेणी')}</th><th className="r">{T('रकम')}</th><th>{T('नोट')}</th><th /></tr></thead>
      <tbody>{data.length ? data.map(e => (
        <tr key={e.id}><td>{fmtDate(e.exp_date)}</td><td><span className="tag t-m">{T(e.category)}</span></td>
          <td className="num"><b>{money(e.amount)}</b></td><td className="mut sml">{e.note}</td>
          <td className="c"><button className="btn sm r" onClick={async () => {
            await api('/expenses/' + e.id, { method: 'DELETE' }); refresh();
          }}>×</button></td></tr>
      )) : <tr><td colSpan={5} className="empty">{T('कोई खर्च नहीं')}</td></tr>}</tbody>
    </table></div></div>
  </>;
}

function Items({ setModal, refresh }) {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  const { data, err, loading } = useApi('/items?q=' + encodeURIComponent(dq), [dq]);
  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;

  return <>
    <div className="bar">
      <div style={{ flex: 2 }}><label>{T('खोजें')}</label>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={T('नाम / कोड / बारकोड')} /></div>
      <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
        <button className="btn" onClick={() => setModal(
          <ItemForm onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />
        )}>＋ {T('नया आइटम')}</button></div>
    </div>
    <div className="card sml mut" style={{ padding: '10px 14px' }}>
      {T('यह सिर्फ रेट लिस्ट है — बिल जल्दी बनाने के लिए। स्टॉक track नहीं होता।')}
    </div>
    <div className="card"><div className="tw"><table>
      <thead><tr><th>{T('कोड')}</th><th>{T('नाम')}</th><th>{T('श्रेणी')}</th><th>{T('यूनिट')}</th>
        <th className="r">{T('लागत')}</th><th className="r">{T('बिक्री भाव')}</th><th className="r">{T('मार्जिन')}</th><th /></tr></thead>
      <tbody>{data.length ? data.map(i => {
        const mg = Number(i.sale_rate) ? n2((i.sale_rate - i.cost_rate) / i.sale_rate * 100) : 0;
        return <tr key={i.id}>
          <td className="mut">{i.code}</td><td><b>{i.name}</b></td>
          <td className="sml mut">{T(i.category)}</td><td className="sml mut">{i.unit}</td>
          <td className="num mut">{money(i.cost_rate)}</td><td className="num"><b>{money(i.sale_rate)}</b></td>
          <td className="num" style={{ color: mg > 0 ? 'var(--acc2)' : 'var(--dan)' }}>{mg}%</td>
          <td className="c"><button className="btn sm o" onClick={() => setModal(
            <ItemForm item={i} onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />
          )}>✎</button></td></tr>;
      }) : <tr><td colSpan={8} className="empty">{T('कोई आइटम नहीं')}</td></tr>}</tbody>
    </table></div></div>
  </>;
}

function ItemForm({ item, onClose, onDone }) {
  const [f, setF] = useState({
    code: item?.code || '', name: item?.name || '', barcode: item?.barcode || '',
    category: item?.category || 'किराना', unit: item?.unit || 'pcs',
    cost_rate: item?.cost_rate || 0, sale_rate: item?.sale_rate || '', mrp: item?.mrp || ''
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => { setF(x => ({ ...x, [k]: v })); setErr(''); };

  useEffect(() => {
    if (!item) api('/items?nextCode=1').then(r => setF(x => x.code ? x : { ...x, code: r.code })).catch(() => {});
  }, []);

  async function save() {
    if (!f.name.trim() || !Number(f.sale_rate)) { toast('नाम और बिक्री भाव ज़रूरी है', 'err'); return; }
    setBusy(true);
    try {
      item ? await api('/items/' + item.id, { method: 'PUT', body: JSON.stringify(f) })
        : await api('/items', { method: 'POST', body: JSON.stringify(f) });
      toast('आइटम सेव हुआ'); onDone?.();
    } catch (e) {
      if (e.message === 'DUP_CODE') setErr(T('यह कोड पहले से इस्तेमाल में है'));
      else if (e.message === 'DUP_BARCODE') setErr(T('यह बारकोड पहले से इस्तेमाल में है'));
      else toast('सेव नहीं हुआ: ' + e.message, 'err');
    }
    setBusy(false);
  }

  return <div className="modal">
    <div className="mh"><b>{T(item ? 'आइटम एडिट' : 'नया आइटम')}</b><button className="x" onClick={onClose}>×</button></div>
    <div className="mb">
      <div className="row">
        <div className="field" style={{ flex: 2 }}><label>{T('आइटम का नाम *')}</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
        <div className="field"><label>{T('कोड *')}</label>
          <input value={f.code} onChange={e => set('code', e.target.value)} />
          {err && <div className="ferr">{err}</div>}</div>
      </div>
      <div className="row">
        <div className="field"><label>{T('श्रेणी')}</label>
          <select value={f.category} onChange={e => set('category', e.target.value)}>
            {['किराना', 'तेल-घी', 'दाल-चावल', 'मसाले', 'बिस्किट-नमकीन', 'साबुन-डिटर्जेंट', 'पेय', 'अन्य']
              .map(c => <option key={c} value={c}>{T(c)}</option>)}
          </select></div>
        <div className="field"><label>{T('यूनिट')}</label>
          <select value={f.unit} onChange={e => set('unit', e.target.value)}>
            {['pcs', 'kg', 'gram', 'ltr', 'ml', 'packet', 'dozen', 'box'].map(u => <option key={u} value={u}>{u}</option>)}
          </select></div>
        <div className="field"><label>{T('बारकोड')}</label>
          <input value={f.barcode} onChange={e => set('barcode', e.target.value)} /></div>
      </div>
      <div className="row">
        <div className="field"><label>{T('लागत')}</label>
          <input type="number" step="0.01" value={f.cost_rate} onChange={e => set('cost_rate', e.target.value)} /></div>
        <div className="field"><label>{T('बिक्री भाव *')}</label>
          <input type="number" step="0.01" value={f.sale_rate} onChange={e => set('sale_rate', e.target.value)} /></div>
        <div className="field"><label>MRP</label>
          <input type="number" step="0.01" value={f.mrp} onChange={e => set('mrp', e.target.value)} /></div>
      </div>
    </div>
    <div className="mf"><button className="btn o" onClick={onClose}>{T('रद्द')}</button>
      <button className="btn g" onClick={save} disabled={busy}>{busy ? '…' : T('सेव')}</button></div>
  </div>;
}

function Reports() {
  const [ym, setYm] = useState(today().slice(0, 7));
  const { data, err, loading } = useApi('/reports?ym=' + ym, [ym]);
  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;
  const { pl, last6, items, ageing, debtors } = data;
  const mx = Math.max(...last6.map(m => Math.abs(Number(m.profit))), 1);
  const agObj = {}; ageing.forEach(a => agObj[a.ageing_bucket] = Number(a.total));

  return <>
    <div className="bar">
      <div style={{ flex: '0 0 190px' }}><label>{T('महीना')}</label>
        <input type="month" value={ym} onChange={e => setYm(e.target.value)} /></div>
      <span className="sp" />
      <button className="btn" onClick={() => printPL(pl, items)}>📄 P&L PDF</button>
      <button className="btn r" onClick={() => printDefaulters(debtors.filter(c => Number(c.balance) > 0.5), agObj)}>
        📄 {T('उधार लिस्ट PDF')}</button>
    </div>
    <div className="grid g4" style={{ marginBottom: 14 }}>
      <Kpi cls="bl" l="बिक्री" v={money(pl.sale)} s={`${pl.bills} ${T('बिल')}`} />
      <Kpi cls="ok" l="ग्रॉस प्रॉफिट" v={money(pl.grossProfit)} s={`${pl.margin}%`} />
      <Kpi cls="dg" l="खर्च" v={money(pl.expenses)} />
      <Kpi cls={pl.netProfit >= 0 ? 'ok' : 'dg'} l="नेट प्रॉफिट" v={money(pl.netProfit)} />
    </div>
    <div className="grid g2">
      <div className="card"><h3>{T('लाभ-हानि')}</h3>
        <Row l="कुल बिक्री" v={money(pl.sale)} />
        <Row l="माल की लागत (COGS)" v={money(pl.cogs)} />
        <Row l="ग्रॉस प्रॉफिट" v={money(pl.grossProfit)} color="var(--acc2)" />
        {pl.expByCat.map(c => <Row key={c.category} l={c.category} v={money(c.total)} />)}
        <div className="tot big"><span>{T('नेट प्रॉफिट')}</span>
          <span style={{ color: pl.netProfit >= 0 ? 'var(--acc2)' : 'var(--dan)' }}>{money(pl.netProfit)}</span></div>
      </div>
      <div className="card"><h3>{T('6 महीने का मुनाफा')}</h3>
        <div className="bars">{last6.map(m => (
          <div className="b" key={m.ym} title={money(m.profit)}>
            <i style={{
              height: `${Math.max(3, Math.abs(Number(m.profit)) / mx * 100)}%`,
              background: Number(m.profit) >= 0 ? 'var(--acc2)' : 'var(--dan)'
            }} /><span>{m.ym.slice(5)}</span></div>
        ))}</div>
      </div>
    </div>
    <div className="card"><h3>{T('आइटम-वार मुनाफा')}</h3>
      <div className="tw"><table>
        <thead><tr><th>#</th><th>{T('आइटम')}</th><th className="r">{T('मात्रा')}</th>
          <th className="r">{T('बिक्री')}</th><th className="r">{T('लागत')}</th><th className="r">{T('मुनाफा')}</th></tr></thead>
        <tbody>{items.length ? items.slice(0, 25).map((r, i) => (
          <tr key={i}><td className="mut">{i + 1}</td><td>{r.name}</td>
            <td className="num">{n2(r.qty)}</td><td className="num">{money(r.sale)}</td>
            <td className="num mut">{money(r.cost)}</td>
            <td className="num" style={{ color: Number(r.profit) >= 0 ? 'var(--acc2)' : 'var(--dan)' }}>
              <b>{money(r.profit)}</b></td></tr>
        )) : <tr><td colSpan={6} className="empty">{T('डेटा नहीं')}</td></tr>}</tbody>
      </table></div>
    </div>
  </>;
}

function Settings({ refresh }) {
  const { data, err, loading, setData } = useApi('/shop');
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (err) return <ErrBox e={err} />;
  const { shop, stats } = data;
  const set = (k, v) => setData(d => ({ ...d, shop: { ...d.shop, [k]: v } }));
  const custPct = Math.round(stats.customers / LIMITS.maxCustomers * 100);
  const dbPct = Math.round(stats.dbMB / (LIMITS.dbQuotaMB) * 100);

  async function save() {
    setBusy(true);
    try {
      await api('/shop', { method: 'PUT', body: JSON.stringify(shop) });
      toast('सेटिंग्स सेव हुईं');
      refresh?.();
    } catch (e) {
      toast('सेव नहीं हुआ: ' + e.message, 'err');
    }
    setBusy(false);
  }

  return <>
    <div className="grid g2" style={{ marginBottom: 16 }}>
      <div className="card"><h3>{T('दुकान की जानकारी')}</h3>
        <div className="field"><label>{T('दुकान का नाम')}</label>
          <input value={shop.name || ''} onChange={e => set('name', e.target.value)} /></div>
        <div className="field"><label>{T('पता')}</label>
          <input value={shop.address || ''} onChange={e => set('address', e.target.value)} /></div>
        <div className="field"><label>{T('मोबाइल')}</label>
          <input value={shop.mobile || ''} onChange={e => set('mobile', e.target.value)} /></div>
        <div className="row">
          <div className="field"><label>{T('बिल प्रीफिक्स')}</label>
            <input value={shop.bill_prefix || ''} onChange={e => set('bill_prefix', e.target.value)} /></div>
          <div className="field"><label>{T('ओवरड्यू उधार (दिन)')}</label>
            <input type="number" value={shop.overdue_days || 30} onChange={e => set('overdue_days', Number(e.target.value))} /></div>
        </div>
        <button className="btn g" onClick={save} disabled={busy}>{busy ? '…' : T('सेव करें')}</button>
      </div>

      <div className="card"><h3>⚙️ {T('ऑटो स्टेटस सीमाएँ')}</h3>
        <p className="sml mut" style={{ marginBottom: 12 }}>
          {T('सिस्टम ग्राहकों के बाकी रुपये और दिनों के आधार पर 🟢 Low, 🟠 Medium, 🔴 High स्टेटस अपने आप तय करेगा।')}
        </p>

        <div style={{ background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--warn)' }}>
            🟠 {T('मध्यम जोखिम सीमा (Medium Risk)')}
          </div>
          <div className="row">
            <div className="field"><label>{T('मध्यम जोखिम सीमा (₹)')}</label>
              <input type="number" value={shop.thresh_med_amt ?? 2000} onChange={e => set('thresh_med_amt', Number(e.target.value))} /></div>
            <div className="field"><label>{T('मध्यम लंबित दिन')}</label>
              <input type="number" value={shop.thresh_med_days ?? 15} onChange={e => set('thresh_med_days', Number(e.target.value))} /></div>
          </div>
        </div>

        <div style={{ background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--dan)' }}>
            🔴 {T('उच्च जोखिम सीमा (High Risk)')}
          </div>
          <div className="row">
            <div className="field"><label>{T('उच्च जोखिम सीमा (₹)')}</label>
              <input type="number" value={shop.thresh_high_amt ?? 10000} onChange={e => set('thresh_high_amt', Number(e.target.value))} /></div>
            <div className="field"><label>{T('उच्च लंबित दिन')}</label>
              <input type="number" value={shop.thresh_high_days ?? 45} onChange={e => set('thresh_high_days', Number(e.target.value))} /></div>
          </div>
        </div>

        <div className="sml mut" style={{ marginBottom: 14, lineHeight: 1.4 }}>
          🟢 <b>Low</b>: ₹ &lt; {money(shop.thresh_med_amt ?? 2000)} &amp; &lt; {shop.thresh_med_days ?? 15} दिन<br />
          🟠 <b>Medium</b>: ₹ ≥ {money(shop.thresh_med_amt ?? 2000)} या ≥ {shop.thresh_med_days ?? 15} दिन<br />
          🔴 <b>High</b>: ₹ ≥ {money(shop.thresh_high_amt ?? 10000)} या ≥ {shop.thresh_high_days ?? 45} दिन
        </div>

        <button className="btn g" onClick={save} disabled={busy}>{busy ? '…' : T('सेव करें')}</button>
      </div>
    </div>

    <div className="card"><h3>{T('प्लान और सीमाएँ')}</h3>
      <div className="tot"><span className="mut">{T('प्लान')}</span>
        <b><span className={'tag ' + (TIER === 'free' ? 't-b' : 't-g')}>{LIMITS.label}</span></b></div>
      <div className="tot"><span className="mut">{T('ग्राहक')}</span>
        <b style={{ color: custPct > 80 ? 'var(--warn)' : '' }}>{stats.customers} / {LIMITS.maxCustomers}</b></div>
      <Bar pct={custPct} />
      <div className="tot"><span className="mut">{T('डेटाबेस')}</span>
        <b style={{ color: dbPct > 80 ? 'var(--warn)' : '' }}>{stats.dbMB} MB / {LIMITS.dbQuotaMB} MB</b></div>
      <Bar pct={dbPct} />
      <div className="tot"><span className="mut">{T('फोटो')}</span><b>{stats.photos} / {LIMITS.maxPhotos}</b></div>
      <div className="tot"><span className="mut">{T('कुल बिल')}</span><b>{stats.sales}</b></div>
      <div className="tot"><span className="mut">{T('रेट लिस्ट आइटम')}</span><b>{stats.items}</b></div>
      {(custPct > 80 || dbPct > 80) && <div className="tag t-w" style={{ display: 'block', padding: 10, marginTop: 10 }}>
        ⚠ {T('सीमा के करीब — Paid plan की ज़रूरत पड़ सकती है')}</div>}
      {TIER === 'free' && <p className="sml mut" style={{ marginTop: 12 }}>
        {T('Free plan में रोज़ का auto-backup नहीं है। हफ़्ते में एक बार डेटा export करें।')}
      </p>}
    </div>
  </>;
}

function Bar({ pct }) {
  return <div style={{ background: 'var(--panel2)', borderRadius: 6, height: 8, overflow: 'hidden', margin: '6px 0 12px' }}>
    <div style={{
      height: '100%', width: `${Math.max(2, Math.min(100, pct))}%`,
      background: pct > 80 ? 'var(--dan)' : pct > 60 ? 'var(--warn)' : 'var(--acc2)'
    }} />
  </div>;
}

function Weekly({ onClose, setModal, shop }) {
  const { data, err, loading } = useApi('/weekly');
  const [tab, setTab] = useState('high');
  if (loading) return <div className="modal"><div className="mb"><Loading /></div></div>;
  if (err) return <div className="modal"><div className="mb"><ErrBox e={err} /></div></div>;
  const { highRisk = [], medRisk = [], overdue = [], big = [], newCredit = [] } = data;
  const shopData = shop || data.shop;
  const highTot = highRisk.reduce((s, c) => s + Number(c.balance), 0);
  const medTot = medRisk.reduce((s, c) => s + Number(c.balance), 0);
  const odTot = overdue.reduce((s, c) => s + Number(c.balance), 0);

  return <div className="modal wide">
    <div className="mh">
      <b>🔔 {T('साप्ताहिक उधार समीक्षा')} — {fmtDate(today())}</b>
      <button className="x" onClick={onClose}>×</button>
    </div>
    <div className="mb">
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="kpi dg" style={{ cursor: 'pointer' }} onClick={() => setTab('high')}>
          <div className="l">🔴 {T('उच्च जोखिम')}</div>
          <div className="v">{highRisk.length}</div>
          <div className="s">{money(highTot)}</div>
        </div>
        <div className="kpi wr" style={{ cursor: 'pointer' }} onClick={() => setTab('med')}>
          <div className="l">🟠 {T('मध्यम जोखिम')}</div>
          <div className="v">{medRisk.length}</div>
          <div className="s">{money(medTot)}</div>
        </div>
        <div className="kpi bl" style={{ cursor: 'pointer' }} onClick={() => setTab('overdue')}>
          <div className="l">⏳ {T('पुराने उधार')}</div>
          <div className="v">{overdue.length}</div>
          <div className="s">{money(odTot)}</div>
        </div>
        <div className="kpi ok" style={{ cursor: 'pointer' }} onClick={() => setTab('new')}>
          <div className="l">🧾 {T('इस हफ़्ते नया उधार')}</div>
          <div className="v">{newCredit.length} {T('बिल')}</div>
          <div className="s">{money(newCredit.reduce((s, x) => s + Number(x.due), 0))}</div>
        </div>
      </div>

      <div className="pm" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 14 }}>
        <button className={tab === 'high' ? 'on' : ''} onClick={() => setTab('high')}>
          🔴 {T('उच्च जोखिम')} ({highRisk.length})
        </button>
        <button className={tab === 'med' ? 'on' : ''} onClick={() => setTab('med')}>
          🟠 {T('मध्यम')} ({medRisk.length})
        </button>
        <button className={tab === 'overdue' ? 'on' : ''} onClick={() => setTab('overdue')}>
          ⏳ {T('पुराना')} ({overdue.length})
        </button>
        <button className={tab === 'big' ? 'on' : ''} onClick={() => setTab('big')}>
          ⚠ {T('लिमिट पार')} ({big.length})
        </button>
      </div>

      {tab === 'high' && (
        highRisk.length ? (
          <div className="tw"><table>
            <thead><tr><th>{T('ग्राहक')}</th><th>{T('मोबाइल')}</th><th className="r">{T('रकम')}</th><th className="r">{T('दिन')}</th><th /></tr></thead>
            <tbody>{highRisk.map(c => (
              <tr key={c.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar c={c} size={28} /><b>{c.name}</b></div></td>
                <td className="mut">{c.mobile || '—'}</td>
                <td className="num"><b style={{ color: 'var(--dan)' }}>{money(c.balance)}</b></td>
                <td className="num">{c.days_overdue}</td>
                <td className="c">
                  {c.mobile && (
                    <button
                      className="btn sm w"
                      title={T('व्हाट्सएप रिमाइंडर')}
                      onClick={() => setModal?.(<WhatsAppModal cust={c} shop={shopData} onClose={() => setModal(null)} />)}
                    >
                      💬 WA
                    </button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty">{T('कोई उच्च जोखिम ग्राहक नहीं ✓')}</div>
      )}

      {tab === 'med' && (
        medRisk.length ? (
          <div className="tw"><table>
            <thead><tr><th>{T('ग्राहक')}</th><th>{T('मोबाइल')}</th><th className="r">{T('रकम')}</th><th className="r">{T('दिन')}</th><th /></tr></thead>
            <tbody>{medRisk.map(c => (
              <tr key={c.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar c={c} size={28} /><b>{c.name}</b></div></td>
                <td className="mut">{c.mobile || '—'}</td>
                <td className="num"><b style={{ color: 'var(--warn)' }}>{money(c.balance)}</b></td>
                <td className="num">{c.days_overdue}</td>
                <td className="c">
                  {c.mobile && (
                    <button
                      className="btn sm w"
                      title={T('व्हाट्सएप रिमाइंडर')}
                      onClick={() => setModal?.(<WhatsAppModal cust={c} shop={shopData} onClose={() => setModal(null)} />)}
                    >
                      💬 WA
                    </button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty">{T('कोई मध्यम जोखिम ग्राहक नहीं ✓')}</div>
      )}

      {tab === 'overdue' && (
        overdue.length ? (
          <div className="tw"><table>
            <thead><tr><th>{T('ग्राहक')}</th><th>{T('मोबाइल')}</th><th className="r">{T('रकम')}</th><th className="r">{T('दिन')}</th><th /></tr></thead>
            <tbody>{overdue.map(c => (
              <tr key={c.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar c={c} size={28} /><b>{c.name}</b></div></td>
                <td className="mut">{c.mobile || '—'}</td>
                <td className="num"><b>{money(c.balance)}</b></td>
                <td className="num">{c.days_overdue}</td>
                <td className="c">
                  {c.mobile && (
                    <button
                      className="btn sm w"
                      onClick={() => setModal?.(<WhatsAppModal cust={c} shop={shopData} onClose={() => setModal(null)} />)}
                    >
                      💬 WA
                    </button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty">{T('कोई पुराना उधार नहीं ✓')}</div>
      )}

      {tab === 'big' && (
        big.length ? (
          <div className="tw"><table>
            <thead><tr><th>{T('ग्राहक')}</th><th className="r">{T('बकाया')}</th><th className="r">{T('लिमिट')}</th><th /></tr></thead>
            <tbody>{big.map(c => (
              <tr key={c.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar c={c} size={28} /><b>{c.name}</b></div></td>
                <td className="num"><b style={{ color: 'var(--dan)' }}>{money(c.balance)}</b></td>
                <td className="num mut">{money(c.credit_limit)}</td>
                <td className="c">
                  {c.mobile && (
                    <button
                      className="btn sm w"
                      onClick={() => setModal?.(<WhatsAppModal cust={c} shop={shopData} onClose={() => setModal(null)} />)}
                    >
                      💬 WA
                    </button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty">{T('कोई लिमिट पार ग्राहक नहीं ✓')}</div>
      )}
    </div>
    <div className="mf"><button className="btn g" onClick={onClose}>{T('ठीक है, देख लिया')}</button></div>
  </div>;
}

/* =====================================================================
   PRINT / PDF
   ===================================================================== */
let SHOP_CACHE = null;
async function shopInfo() {
  if (!SHOP_CACHE) { try { SHOP_CACHE = (await api('/shop')).shop; } catch { SHOP_CACHE = {}; } }
  return SHOP_CACHE;
}
async function doPrint(bodyHtml, title) {
  const s = await shopInfo();
  const shopName = (s?.name && s.name !== 'मेरी दुकान') ? s.name : 'Salhotra Multi Store';
  const head = `
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:14px">
        <img src="/logo.png" style="width:52px;height:52px;border-radius:10px;object-fit:cover" alt="Logo" />
        <div style="text-align:left">
          <h1 style="font-size:22px;font-weight:800;margin:0;color:#0f172a;letter-spacing:-0.02em">${shopName}</h1>
          <p style="margin:3px 0 0;font-size:12px;color:#475569">${s.address || 'मुख्य बाज़ार'} ${s.mobile ? `· ${T('मो.')} ${s.mobile}` : ''}</p>
        </div>
      </div>
      <div style="text-align:right">
        <span style="display:inline-block;padding:5px 12px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-weight:700;color:#0f172a">${title}</span>
        <div style="font-size:11px;color:#64748b;margin-top:4px">${T('तारीख')}: ${fmtDate(today())}</div>
      </div>
    </div>`;
  const foot = `<div class="pf" style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:8px;font-size:11px;text-align:center;color:#64748b">${T('जनरेट')}: ${fmtDate(today())} · Udhar Book — Salhotra Multi Store</div>`;
  const el = document.getElementById('printarea');
  if (el) {
    el.innerHTML = head + bodyHtml + foot;
    setTimeout(() => window.print(), 100);
  }
}

function printBill(s) {
  doPrint(`
  <table style="width:100%;border:0;margin-bottom:12px;border-collapse:collapse">
    <tr style="border:0">
      <td style="border:0;padding:4px 0;font-size:12px"><b>${T('बिल नं')}:</b> ${s.bill_no}<br><b>${T('तारीख')}:</b> ${fmtDate(s.bill_date)}</td>
      <td style="border:0;padding:4px 0;text-align:right;font-size:12px"><b>${T('ग्राहक')}:</b> ${s.customer_name || 'नकद ग्राहक'}</td>
    </tr>
  </table>
  <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
    <thead>
      <tr style="background:#f1f5f9">
        <th style="border:1px solid #cbd5e1;padding:7px;font-size:11px;text-align:center;width:32px">#</th>
        <th style="border:1px solid #cbd5e1;padding:7px;font-size:11px;text-align:left">${T('आइटम')}</th>
        <th style="border:1px solid #cbd5e1;padding:7px;font-size:11px;text-align:right;width:70px">${T('मात्रा')}</th>
        <th style="border:1px solid #cbd5e1;padding:7px;font-size:11px;text-align:right;width:80px">${T('भाव')}</th>
        <th style="border:1px solid #cbd5e1;padding:7px;font-size:11px;text-align:right;width:90px">${T('रकम')}</th>
      </tr>
    </thead>
    <tbody>
      ${s.items.map((l, i) => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:7px;text-align:center;font-size:11px">${i + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:7px;font-size:11px">${l.name}</td>
          <td style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-size:11px">${l.qty} ${l.unit}</td>
          <td style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-size:11px">${money(l.rate)}</td>
          <td style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-size:11px;font-weight:600">${money(l.amount)}</td>
        </tr>`).join('')}
      <tr>
        <td colspan="4" style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-weight:700;font-size:12px">${T('कुल')}</td>
        <td style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-weight:700;font-size:12px">${money(s.total)}</td>
      </tr>
      <tr>
        <td colspan="4" style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-size:11px">${T('भुगतान')} (${s.pay_mode})</td>
        <td style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-size:11px">${money(s.paid)}</td>
      </tr>
      ${Number(s.due) ? `
      <tr style="background:#fff1f2">
        <td colspan="4" style="border:1px solid #fecdd3;padding:7px;text-align:right;font-weight:700;color:#e11d48;font-size:12px">${T('बाकी (उधार)')}</td>
        <td style="border:1px solid #fecdd3;padding:7px;text-align:right;font-weight:700;color:#e11d48;font-size:12px">${money(s.due)}</td>
      </tr>` : ''}
    </tbody>
  </table>`, T('बिल / INVOICE'));
}

function printDefaulters(rows, ageing) {
  const tot = rows.reduce((s, c) => s + Number(c.balance), 0);
  doPrint(`
  <p style="font-size:12px;margin-bottom:10px">${T('कुल बकाया')}: <b>${money(tot)}</b> · ${T('ग्राहक')}: <b>${rows.length}</b></p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
    <thead>
      <tr style="background:#f1f5f9">
        ${['0-15', '16-30', '31-60', '60+'].map(k => `<th style="border:1px solid #cbd5e1;padding:6px;text-align:center;font-size:11px">${k} ${T('दिन')}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      <tr>
        ${['0-15', '16-30', '31-60', '60+'].map(k => `<td style="border:1px solid #cbd5e1;padding:6px;text-align:center;font-size:11px;font-weight:600">${money(ageing[k] || 0)}</td>`).join('')}
      </tr>
    </tbody>
  </table>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f1f5f9">
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;width:30px">#</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:left">${T('ग्राहक')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:left">${T('मोबाइल')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:right">${T('बकाया')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:center">${T('दिन')}</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((c, i) => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;font-size:11px">${i + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;font-size:11px">${c.name}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;font-size:11px">${c.mobile || ''}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px;font-weight:700;color:#e11d48">${money(c.balance)}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;font-size:11px">${c.days_overdue}</td>
        </tr>`).join('')}
      <tr style="background:#f8fafc">
        <td colspan="3" style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-weight:700;font-size:12px"><b>${T('कुल')}</b></td>
        <td style="border:1px solid #cbd5e1;padding:7px;text-align:right;font-weight:800;font-size:12px;color:#e11d48">${money(tot)}</td>
        <td style="border:1px solid #cbd5e1"></td>
      </tr>
    </tbody>
  </table>`,
  T('उधार / बकाया ग्राहक सूची'));
}

function printLedger(c) {
  doPrint(`
  <div style="margin-bottom:12px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:12px">
    <b>${c.name}</b> ${c.mobile ? `· ${c.mobile}` : ''} ${c.address ? `· ${c.address}` : ''}
  </div>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f1f5f9">
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;font-size:11px">${T('तारीख')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:left;font-size:11px">${T('विवरण')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px">${T('उधार')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px">${T('जमा')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px">${T('बैलेंस')}</th>
      </tr>
    </thead>
    <tbody>
      ${(c.ledger || []).map(r => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:6px;font-size:11px">${fmtDate(r.date)}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;font-size:11px">${T(r.desc)}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px;color:#e11d48">${Number(r.dr) ? money(r.dr) : ''}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px;color:#16a34a">${Number(r.cr) ? money(r.cr) : ''}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px;font-weight:700">${money(r.bal)}</td>
        </tr>`).join('')}
      <tr style="background:#f8fafc">
        <td colspan="4" style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-weight:700;font-size:12px"><b>${T('कुल बकाया')}</b></td>
        <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-weight:800;font-size:12px;color:#e11d48">${money(c.balance)}</td>
      </tr>
    </tbody>
  </table>`,
  T('ग्राहक खाता विवरण'));
}

function printPL(pl, items) {
  doPrint(`
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
    <tbody>
      <tr><td style="border:1px solid #cbd5e1;padding:6px;font-size:12px">${T('कुल बिक्री')} (${pl.bills} ${T('बिल')})</td><td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:12px;font-weight:700">${money(pl.sale)}</td></tr>
      <tr><td style="border:1px solid #cbd5e1;padding:6px;font-size:12px">${T('माल की लागत (COGS)')}</td><td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:12px">${money(pl.cogs)}</td></tr>
      <tr style="background:#f0fdf4"><td style="border:1px solid #cbd5e1;padding:6px;font-size:12px"><b>${T('ग्रॉस प्रॉफिट')}</b></td><td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:12px;font-weight:700;color:#16a34a">${money(pl.grossProfit)} (${pl.margin}%)</td></tr>
      ${pl.expByCat.map(c => `<tr><td style="border:1px solid #cbd5e1;padding:6px;font-size:12px">${T('खर्च')} — ${T(c.category)}</td><td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:12px">${money(c.total)}</td></tr>`).join('')}
      <tr><td style="border:1px solid #cbd5e1;padding:6px;font-size:12px"><b>${T('कुल खर्च')}</b></td><td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:12px">${money(pl.expenses)}</td></tr>
      <tr style="background:#f8fafc"><td style="border:1px solid #cbd5e1;padding:8px;font-size:13px"><b>${T('नेट प्रॉफिट')}</b></td><td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-size:13px;font-weight:800;color:#16a34a">${money(pl.netProfit)}</td></tr>
    </tbody>
  </table>
  <h2 style="font-size:14px;margin:14px 0 8px">${T('आइटम-वार मुनाफा')}</h2>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f1f5f9">
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;width:30px">#</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:left">${T('आइटम')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:right">${T('मात्रा')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:right">${T('बिक्री')}</th>
        <th style="border:1px solid #cbd5e1;padding:6px;font-size:11px;text-align:right">${T('मुनाफा')}</th>
      </tr>
    </thead>
    <tbody>
      ${items.slice(0, 20).map((r, i) => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;font-size:11px">${i + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;font-size:11px">${r.name}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px">${n2(r.qty)}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px">${money(r.sale)}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-size:11px;font-weight:700;color:#16a34a">${money(r.profit)}</td>
        </tr>`).join('')}
    </tbody>
  </table>`,
  T('मासिक लाभ-हानि रिपोर्ट') + ' — ' + pl.ym);
}
