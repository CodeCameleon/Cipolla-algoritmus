# Cipolla Algoritmus – Fejlesztési Beszélgetés 3.

**AI:** Claude Sonnet 4.6  
**Dátum:** 2026-05-17

---

## 1. Felhasználói kérés

> Can you update the p and a fields to supports inputs like "2^61 −1"

---

## 1. Ügynök gondolatmenete

A `p` és `a` mezők jelenleg `type="number"` típusúak, így csak nyers egész számokat fogadnak el. Matematikai kifejezések (pl. `2^61 − 1`) beviteléhez szöveges mezőre és egy kifejezés-értelmezőre van szükség.

Szükséges módosítások:
- **`index.html`**: mindkét `<input type="number">` → `<input type="text">`, a placeholder frissítve.
- **`cipolla.js`**: `parseExpr()` függvény hozzáadása, amely a következőket kezeli:
  - egész literálok (BigInt-ként értelmezve)
  - `^` – hatványozás (jobbról asszociatív)
  - `*` – szorzás
  - `+`, `-`, `−` (Unicode mínusz, U+2212) – összeadás és kivonás
  - egyoperandusú negáció
  - zárójelek
  - vezető/közbülső szóközök
- A `compute()` függvényben a `BigInt(pRaw)` / `BigInt(aRaw)` hívások `parseExpr(pRaw)` / `parseExpr(aRaw)`-ra cserélve.

---

## 1. Ügynök válasza

### `index.html` – módosítások

```html
<!-- Előtte -->
<input type="number" id="input-p" placeholder="pl.: 10007" />
<input type="number" id="input-a" placeholder="pl.: 5" />

<!-- Utána -->
<input type="text" id="input-p" placeholder="pl.: 2^61 − 1" />
<input type="text" id="input-a" placeholder="pl.: 3" />
```

### `cipolla.js` – `parseExpr()` hozzáadva

```js
function parseExpr(str) {
  str = str.replace(/−/g, '-').replace(/\s+/g, '');
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
```

A `compute()` függvényben:

```js
// Előtte
p = BigInt(pRaw);
a = BigInt(aRaw);

// Utána
p = parseExpr(pRaw);
a = parseExpr(aRaw);
```

---

## 2. Felhasználói kérés

> Can you replace the added '−' characters with their codes?

---

## 2. Ügynök gondolatmenete

A `cipolla.js`-be bekerült néhány `−` (U+2212, Unicode mínusz jel) karakter – kommentekben, a regex literálban és a hibaüzenet szövegében. A felhasználó ezeket a megfelelő JavaScript Unicode escape-szel (`−`) szeretné helyettesíteni.

Érintett helyek:
- **3. sor** – comment: `2^61 − 1`
- **6. sor** – regex literál: `/−/g` → `/−/g` (ez az egyetlen funkcionálisan kritikus csere)
- **90. sor** – comment: `n − 1`
- **193. sor** – hibaüzenet szövege: `+, − és zárójeleket`

Az Edit eszköz nem tudja megkülönböztetni a U+2212 karaktert a saját bevitelétől, ezért PowerShell `.Replace()` metódussal (nem regex alapú, nincs escape-értelmezés) végeztük el a cserét, ahol a `[char]92 + 'u2212'` kifejezéssel állítottuk elő a literális `−` szöveget.

---

## 2. Ügynök válasza

A `cipolla.js` négy sorában az U+2212 karakter `−` escape-re cserélve:

```js
// 3. sor – comment
// ── Kifejezés-értelmező (pl.: 2^61 − 1) ──────────────────────────────────

// 6. sor – regex (funkcionálisan fontos: a − a JS regex-ben U+2212-t jelöl)
str = str.replace(/−/g, '-').replace(/\s+/g, '');

// 90. sor – comment
// n − 1 = 2^r · d írása

// 193. sor – hibaüzenet
errorEl.textContent = 'Érvénytelen kifejezés! Használhat számokat, ^, *, +, − és zárójeleket.';
```
