'use strict';

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

// ── Fő számítás ────────────────────────────────────────────────────────────

function compute() {
  const pRaw = document.getElementById('input-p').value.trim();
  const aRaw = document.getElementById('input-a').value.trim();
  const errorEl = document.getElementById('error-msg');
  const cardsEl = document.getElementById('cards');

  errorEl.hidden = true;
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
    p = BigInt(pRaw);
    a = BigInt(aRaw);
  } catch {
    errorEl.textContent = 'Érvénytelen bemenet, csak egész számokat adjon meg!';
    errorEl.hidden = false;
    return;
  }

  if (p < 3n || p % 2n === 0n) {
    errorEl.textContent = 'p legalább 3 kell legyen és páratlan kell legyen!';
    errorEl.hidden = false;
    return;
  }

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

  // TODO: 02–04. kártyák (következő lépések)
}

document.getElementById('btn-compute').addEventListener('click', compute);
document.addEventListener('keydown', e => { if (e.key === 'Enter') compute(); });
