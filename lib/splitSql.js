/* SQL splitter — handles comments and $$ blocks properly */
export function splitSql(s) {
  const out = [];
  let cur = '', i = 0, dollar = false;
  while (i < s.length) {
    // line comment -- ... (outside dollar block)
    if (!dollar && s[i] === '-' && s[i + 1] === '-') {
      const nl = s.indexOf('\n', i);
      i = nl === -1 ? s.length : nl + 1;
      cur += '\n';
      continue;
    }
    // block comment /* ... */
    if (!dollar && s[i] === '/' && s[i + 1] === '*') {
      const end = s.indexOf('*/', i);
      i = end === -1 ? s.length : end + 2;
      continue;
    }
    // single-quoted string
    if (!dollar && s[i] === "'") {
      const st = i; i++;
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") { i += 2; continue; }
        if (s[i] === "'") { i++; break; }
        i++;
      }
      cur += s.slice(st, i);
      continue;
    }
    // $$ body toggle
    if (s.startsWith('$$', i)) { dollar = !dollar; cur += '$$'; i += 2; continue; }
    // statement end
    if (s[i] === ';' && !dollar) { out.push(cur); cur = ''; i++; continue; }
    cur += s[i]; i++;
  }
  if (cur.trim()) out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}
