// node update-prices.mjs  (Node 18+, бесплатно, ключ не нужен)
// Скачивает цены Skinport (GET /v1/items, кэш 5 мин, лимит 8 запросов / 5 мин)
// и пишет prices.js рядом с glacier-up.html. Сайт подхватит его как резервный источник.
import { writeFileSync } from "node:fs";

const CUR = "RUB";
const WEAR = /\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/;

// Документация Skinport требует заголовок Accept-Encoding: br для /v1/items
const res = await fetch(`https://api.skinport.com/v1/items?app_id=730&currency=${CUR}`, {
  headers: { "Accept-Encoding": "br" },
});
if (!res.ok) throw new Error(`Skinport HTTP ${res.status}`);
const items = await res.json();

const by = {};
for (const it of items) {
  const n = it?.market_hash_name, p = it?.min_price;
  if (typeof n !== "string" || typeof p !== "number" || !(p > 0) || /StatTrak|Souvenir/.test(n)) continue;
  const b = n.replace(WEAR, "");
  if (b === n) continue;
  (by[b] ??= []).push(p);
}
const map = {};
for (const k in by) {
  const a = by[k].sort((x, y) => x - y), h = a.length >> 1;
  map[k] = Math.round((a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2) * 100) / 100;
}
if (Object.keys(map).length < 100) throw new Error("Слишком мало цен в ответе");

writeFileSync("prices.js", `window.PRICE_SNAPSHOT=${JSON.stringify({ ts: Date.now(), cur: CUR, map })};\n`);
console.log(`prices.js готов: ${Object.keys(map).length} скинов, валюта ${CUR}`);
