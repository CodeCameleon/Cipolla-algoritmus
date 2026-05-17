'use strict';

// ── Kifejezés-értelmező (pl.: 2^61 − 1) ──────────────────────────────────

function parseExpr(str) {
  str = str.replace(/\u2212/g, '-').replace(/\s+/g, '');
  let pos = 0;

  const peek = () => str[pos];
  const consume = () => str[pos++];

  function parseAddSub() {
    let left = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      left = op === '+' ? left + parseMulDiv() : left - parseMulDiv();
    }
    return left;
  }

  function parseMulDiv() {
    let left = parsePow();
    while (peek() === '*') { consume(); left *= parsePow(); }
    return left;
  }

  function parsePow() {
    const base = parseUnary();
    if (peek() !== '^') return base;
    consume();
    return base ** parsePow();
  }

  function parseUnary() {
    if (peek() === '-') { consume(); return -parseAtom(); }
    return parseAtom();
  }

  function parseAtom() {
    if (peek() === '(') {
      consume();
      const val = parseAddSub();
      if (peek() !== ')') throw new Error('Hiányzó zárójel');
      consume();
      return val;
    }
    let num = '';
    while (pos < str.length && str[pos] >= '0' && str[pos] <= '9') num += str[pos++];
    if (!num) throw new Error(`Váratlan karakter: ${peek() ?? 'EOF'}`);
    return BigInt(num);
  }

  const result = parseAddSub();
  if (pos !== str.length) throw new Error(`Váratlan karakter: ${peek()}`);
  return result;
}

// ── Moduláris aritmetika (BigInt) ──────────────────────────────────────────

function mod(a, n) {
  return ((a % n) + n) % n;
}

function modMul(a, b, n) {
  return mod(a * b, n);
}

function modPow(base, exp, n) {
  base = mod(base, n);
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = modMul(result, base, n);
    base = modMul(base, base, n);
    exp >>= 1n;
  }
  return result;
}

// ── Miller–Rabin primalitásteszt ───────────────────────────────────────────
// Determinisztikus az összes n < 3,317,044,064,679,887,385,961,981 értékre.

function millerRabin(n) {
  if (n < 2n) return false;
  const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const sp of smallPrimes) {
    if (n === sp) return true;
    if (n % sp === 0n) return false;
  }

  // n − 1 = 2^r · d írása
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) { d /= 2n; r++; }

  witnesses: for (const a of smallPrimes) {
    if (a >= n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let i = 0n; i < r - 1n; i++) {
      x = modMul(x, x, n);
      if (x === n - 1n) continue witnesses;
    }
    return false;
  }
  return true;
}

// ── Euler-kritérium (Legendre-szimbólum) ──────────────────────────────────

function eulerCriterion(a, p) {
  return modPow(a, (p - 1n) / 2n, p);
}

// ── Random keresés ────────────────────────────────────────────────────────

/**
 * A nem kvadratikus maradék random keresésének függvénye
 * @param {Number | BigInt} a - a szám amiből négyzetgyököt szeretnénk vonni
 * @param {Number | BigInt} p - a prím modulus
 * @returns {BigInt} a szám amire (t^2 - a)^(p - 1)/2 nem kvadratikus maradék (mod p)
 */
function randomSearch(a, p) {
  a = BigInt(a);
  p = BigInt(p);
  let alreadyTried = new Array();

  while (true) {
    let t = BigInt(Math.floor(Math.random() * Number(p)));
    while (alreadyTried.includes(t)) {
      t = BigInt(Math.floor(Math.random() * Number(p)));
    }
    alreadyTried.push(t);

    let base = ((t * t - a) + p) % p
    if (eulerCriterion(base, p) === p - 1n) {
      renderCard2("t végső értéke:", t, false);
      return t;
    }

    renderCard2("t jelenlegi értéke:", t, true);
  }
}

// ── Polinom szorzás (u0 + u1√t) * (v0 + v1√t) mod (x^2 - (t^2 - a)) ─────

function polMul([u0, u1], [v0, v1], t, a, p, exponent = null) {
  const u0v0 = modMul(u0, v0, p);
  const u0v1 = modMul(u0, v1, p);
  const u1v0 = modMul(u1, v0, p);
  const u1v1 = modMul(u1, v1, p);

  const tMinusA = mod(t * t - a, p);
  const newU0BeforeMod = u0v0 + modMul(u1v1, tMinusA, p);
  const newU0 = mod(newU0BeforeMod, p);
  const newU1BeforeMod = u0v1 + u1v0;
  const newU1 = mod(newU1BeforeMod, p);
  
  if(exponent !== null) {
    renderCard3(`Polinom szorzás eredménye (exponens: ${exponent}):`, u0, u1, newU0BeforeMod, newU1BeforeMod, newU0, newU1, p);
  }

  return [newU0, newU1];
}

// ── Bitműveletek ──────────────────────────────────────────────────────────────

function reverseBits(value, width) {
  let v = value;
  let out = 0n;
  for (let i = 0n; i < BigInt(width); i++) {
    out = (out << 1n) | (v & 1n);
    v >>= 1n;
  }
  return out;
}

function bitLength(value) {
  let v = value;
  let len = 0;
  while (v > 0n) { v >>= 1n; len++; }
  return len;
}

// ── DOM segédfüggvények ────────────────────────────────────────────────────

function infoRow(label, value) {
  const row = document.createElement('div');
  row.className = 'info-row';
  row.innerHTML = `<span class="info-label">${label}</span>
                   <span class="info-value">${value}</span>`;
  return row;
}

function pill(text, type) {
  return `<span class="pill pill-${type}">${text}</span>`;
}

// ── 01. kártya renderelése ─────────────────────────────────────────────────

function renderCard1(p, aMod, isPrime, legendreVal) {
  const body = document.getElementById('card-1-body');
  body.innerHTML = '';

  // p primalitás
  body.appendChild(infoRow(
    'p értéke',
    `${p} ${isPrime ? pill('Prím ✓', 'success') : pill('Nem prím ✗', 'danger')}`
  ));

  if (!isPrime) return;

  // Euler-kitevő
  const exp = (p - 1n) / 2n;
  body.appendChild(infoRow(
    'Euler-kritérium kitevője',
    `(p &#8722; 1) / 2 = (${p} &#8722; 1) / 2 = ${exp}`
  ));

  // a mod p
  body.appendChild(infoRow(
    'a (mod p)',
    `${aMod}`
  ));

  // Számított érték
  const isQR   = legendreVal === 1n;
  const isZero = legendreVal === 0n;
  let legendreLabel;
  if (isZero)      legendreLabel = pill('0 (a ≡ 0 mod p)', 'neutral');
  else if (isQR)   legendreLabel = pill('Kvadratikus maradék ✓', 'success');
  else             legendreLabel = pill('Nem kvadratikus maradék ✗', 'danger');

  body.appendChild(infoRow(
    `a<sup>(p&#8722;1)/2</sup> mod p`,
    `${aMod}<sup>${exp}</sup> ≡ ${legendreVal} (mod ${p}) ${legendreLabel}`
  ));
}

// ── 02. kártya renderelése ─────────────────────────────────────────────────

function renderCard2(msg, a, isQuadraticResidue) {
    const body = document.getElementById('card-2-body');
    let residueLabel = !isQuadraticResidue 
      ? pill('(t<sup>2</sup> - a)<sup>(p-1)/2</sup> nem kvadratikus maradék (mod p) ✓', 'success')
      : pill('(t<sup>2</sup> - a)<sup>(p-1)/2</sup> kvadratikus maradék (mod p) ✗', 'danger');
    body.appendChild(infoRow(msg, `${a} ${residueLabel}`));
}

// ── 03. kártya renderelése ─────────────────────────────────────────────────

function renderCard3(msg, u0, u1, newU0BeforeMod, newU1BeforeMod, newU0, newU1, p) {
    const body = document.getElementById('card-3-body');
    body.appendChild(infoRow(msg, `Hatványozás előtt: (${u0}, ${u1}), után: (${newU0BeforeMod}, ${newU1BeforeMod}), redukálva: (${newU0}, ${newU1})`));
}

// ── 04. kártya renderelése ─────────────────────────────────────────────────

function renderCard4(label, res, xsqmodp, a) {
    const body = document.getElementById('card-4-body');
    const isCorrect = xsqmodp === a;
    const correctnessLabel = isCorrect
      ? pill('Egyezik a-val ✓', 'success')
      : pill('Nem egyezik a-val ✗', 'danger');
    body.appendChild(infoRow(label, `${xsqmodp} ${correctnessLabel}`));
}

// ── Fő számítás ────────────────────────────────────────────────────────────

function compute() {
  const pRaw = document.getElementById('input-p').value.trim();
  const aRaw = document.getElementById('input-a').value.trim();
  const errorEl = document.getElementById('error-msg');
  const successEl = document.getElementById('success-msg');
  const cardsEl = document.getElementById('cards');

  errorEl.hidden = true;
  successEl.hidden = true;
  cardsEl.hidden = true;
  ['card-1-body', 'card-2-body', 'card-3-body', 'card-4-body']
    .forEach(id => { document.getElementById(id).innerHTML = ''; });

  if (!pRaw || !aRaw) {
    errorEl.textContent = 'Kérjük, adja meg mind a p, mind az a értékét!';
    errorEl.hidden = false;
    return;
  }

  let p, a;
  try {
    p = parseExpr(pRaw);
    a = parseExpr(aRaw);
  } catch {
    errorEl.textContent = 'Érvénytelen kifejezés! Használhat számokat, ^, *, +, \u2212 és zárójeleket.';
    errorEl.hidden = false;
    return;
  }

  if (p < 3n || p % 2n === 0n) {
    errorEl.textContent = 'p legalább 3 kell legyen és páratlan kell legyen!';
    errorEl.hidden = false;
    return;
  }

  // 01. kártya

  const isPrime    = millerRabin(p);
  const aMod       = mod(a, p);
  const legendreVal = isPrime ? eulerCriterion(aMod, p) : null;

  renderCard1(p, aMod, isPrime, legendreVal);
  cardsEl.hidden = false;

  if (!isPrime) {
    errorEl.textContent = `p = ${p} nem prímszám, az algoritmus nem futtatható.`;
    errorEl.hidden = false;
    return;
  }

  if (legendreVal !== 1n) {
    errorEl.textContent = legendreVal === 0n
      ? `a ≡ 0 (mod p), triviális eset, x = 0.`
      : `a = ${aMod} nem kvadratikus maradék mod ${p}, az egyenletnek nincs megoldása.`;
    errorEl.hidden = false;
    return;
  }

  // 02. kártya

  a = aMod; // továbbiakban csak a mod p értékével dolgozunk
  const t = randomSearch(a, p);

  // 03. kártya

  let weights = [t, 1n];
  let exponent = (p + 1n) / 2n;
  let b = [1n, 0n];
  let targetExponent = exponent;
  let actualExponent = 0n;

  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      actualExponent += 1n;
      const width = bitLength(actualExponent);
      const flippedExponent = reverseBits(actualExponent, width);
      console.log(`Exponent: ${exponent}, actualExponent: ${actualExponent}, flippedExponent: ${flippedExponent}`);
      b = polMul(b, weights, t, a, p, flippedExponent);
    }
    weights = polMul(weights, weights, t, a, p);
    exponent >>= 1n; // exponent = exponent // 2n
    actualExponent <<= 1n;
  }

  // 04. kártya
  const xsqmodp = modPow(b[0], 2n, p);
  console.log(`x^2 mod p = ${xsqmodp}, a mod p = ${a}`);
  renderCard4(`x<sup>2</sup> mod p:`, b[0], xsqmodp, a);
  if(xsqmodp === a) {
    successEl.innerHTML = `Siker! x<sub>1</sub> = ${b[0]} és x<sub>2</sub> = ${p-b[0]} megoldásai az egyenletnek.`;
    successEl.hidden = false;
  }
}

document.getElementById('btn-compute').addEventListener('click', compute);
document.addEventListener('keydown', e => { if (e.key === 'Enter') compute(); });
