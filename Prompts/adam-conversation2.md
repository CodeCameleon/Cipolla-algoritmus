# Cipolla Algoritmus – Fejlesztési Beszélgetés 2.

**AI:** Claude Sonnet 4.6  
**Dátum:** 2026-05-17

---

## 1. Felhasználói kérés

> Bekéri a felhasználótól a p prím értéket és az a értéket. Ellenőrzi, hogy p valóban prím-e (pl. próbaosztásokkal vagy a Miller–Rabin-teszttel), és hogy a kvadratikus maradék-e (Euler-kritérium: a^((p−1)/2) ≡ 1). Ez lenne a feladat, amit a 01-es résznél kellene megjeleníteni.
>
> Speciális szabályok: Mivel a böngésző natív Number típusa 53 bites pontosságú, nagy prímekre (p > 2⁵³) a BigInt típust kell használni. Minden aritmetikai műveletet (mod, szorzás Fp²-ben) külön függvényként valósítsanak meg. Az oldal ne használjon külső könyvtárat és ne igényeljen internetkapcsolatot.

---

## 1. Ügynök gondolatmenete

A `cipolla.js` fájlt (amit egy korábbi lépésben töröltek) újra létre kell hozni, ezúttal csak a 01-es kártya logikájával. A feladathoz szükséges elemek:

- **BigInt aritmetika**: `mod()`, `modMul()`, `modPow()` – ezek az alapfüggvények, amelyekre minden további lépés épül. Előre implementálva: `fp2Mul()` és `fp2Pow()` is, a majdani 03-as kártyához.
- **Miller–Rabin primalitásteszt**: determinisztikus az összes n < 3,317,044,064,679,887,385,961,981 értékre; a tanúk listája: `[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]` (mind BigInt).
- **Euler-kritérium**: `a^((p−1)/2) mod p` – ha az eredmény `1`, akkor `a` kvadratikus maradék; ha `p−1`, akkor nem.
- **Renderelés**: az `info-row` / `pill` CSS osztályokat használja; a 01-es kártyában megjelenik a primalitás eredménye, a kitevő értéke, az `a mod p`, és a Legendre-szimbólum értéke.
- **Hibakezelés**: nem egész bemenet, p < 3 vagy páros p esetén hibaüzenet jelenik meg.
- **Billentyűzet támogatás**: Enter lenyomásakor is elindul a számítás.

---

## 1. Ügynök válasza

- `cipolla.js` újra létrehozva.
- `index.html`-be visszakerült a `<script src="cipolla.js"></script>` sor.

### `cipolla.js` felépítése

```js
// Moduláris aritmetika
function mod(a, n) { ... }
function modMul(a, b, n) { ... }
function modPow(base, exp, n) { ... }

// 𝔽p² aritmetika (03-as kártyához előkészítve)
function fp2Mul([a, b], [c, d], omega, p) { ... }
function fp2Pow(re, im, exp, omega, p) { ... }

// Miller–Rabin primalitásteszt (determinisztikus, 12 tanúval)
function millerRabin(n) { ... }

// Euler-kritérium
function eulerCriterion(a, p) {
  return modPow(a, (p - 1n) / 2n, p);
}

// 01. kártya renderelése
function renderCard1(p, aMod, isPrime, legendreVal) { ... }

// Fő belépési pont
function compute() { ... }
```

A 01-es kártya a következőket jeleníti meg:

| Sor                       | Tartalom                                                                         |
|---------------------------|----------------------------------------------------------------------------------|
| p értéke                  | `p` + „Prím ✓" vagy „Nem prím ✗" pill                                           |
| Euler-kritérium kitevője  | `(p − 1) / 2` kiszámítva                                                         |
| a (mod p)                 | `a` redukálva                                                                    |
| a<sup>(p−1)/2</sup> mod p | Számított érték + „Kvadratikus maradék ✓" vagy „Nem kvadratikus maradék ✗" pill |

---

## 2. Felhasználói kérés

> Kérlek, hogy az előre létrehozott függvényeket töröld ki, azt majd más csinálja meg. Valamint mozgasd át a hibaüzenetet, a bemenetek alá, hogy jobban láthatóak legyenek.

---

## 2. Ügynök gondolatmenete

Két módosítás szükséges:
1. A `cipolla.js`-ből törölni kell az előre elkészített `fp2Mul()` és `fp2Pow()` függvényeket – ezek a 03-as kártyához lettek volna, de más fogja implementálni.
2. Az `index.html`-ben az `#error-msg` div jelenleg a kártyák után szerepel az oldal alján. A bemeneti szekció (`<section class="inputs">`) és a kártyák (`<div class="cards">`) közé kell áthelyezni.

---

## 2. Ügynök válasza

- `cipolla.js`: `fp2Mul()` és `fp2Pow()` törölve.
- `index.html`: `#error-msg` áthelyezve a `<section class="inputs">` és a `<div class="cards">` közé.
