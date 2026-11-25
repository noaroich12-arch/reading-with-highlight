/* pocket-store.js: מילון הכיס: שמירה וקריאה של המילים החדשות במכשיר.
   כל מילה: { w: המילה, he: התרגום, st: 'new' (עוד לא זכורה) או 'known' (זכורה), at: זמן הוספה }.
   המפתח הוא המילה באותיות קטנות בלי סימני פיסוק. נשמר במפתח tts.pocket.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

const POCKET_KEY = 'tts.pocket';
const POCKET_NO_SRC = 'טקסט בלי שם';   // שם הקבוצה למילים שנוספו מטקסט שלא נשמר בספרייה
let pocketCache = null;

/** האם הנתון השמור הוא אובייקט רגיל (ולא משובש). */
function isPocketData(v){ return !!v && typeof v === 'object' && !Array.isArray(v); }

/** כל מילות הכיס (נטען פעם אחת מהאחסון). */
function pocketAll(){
  if (!pocketCache) pocketCache = SafeStore.getJSON(POCKET_KEY, {}, isPocketData);
  return pocketCache;
}

/** שומר את מילון הכיס באחסון. מחזיר false אם אין מקום. */
function pocketWrite(){ return SafeStore.setJSON(POCKET_KEY, pocketAll()); }

/** מפתח של מילה: בלי סימנים ובאותיות קטנות. */
function pocketKey(raw){ return cleanWord(raw || '').toLowerCase(); }

/** המילה במילון הכיס לפי מפתח, או null אם אין. */
function pocketEntry(key){
  const all = pocketAll();
  if (!key || !Object.prototype.hasOwnProperty.call(all, key)) return null;
  const e = all[key];
  return e && typeof e === 'object' ? e : null;
}

/** מוסיף מילה חדשה (עוד לא זכורה) עם התרגום שלה ושם הטקסט שממנו נלקחה. מחזיר false אם לא נשמר. */
function pocketAdd(word, he, src){
  const key = pocketKey(word);
  if (!key) return false;
  pocketAll()[key] = { w: key, he: he || '', st: 'new', at: Date.now(), src: src || POCKET_NO_SRC };
  if (pocketWrite()) return true;
  delete pocketAll()[key];
  return false;
}

/** משנה מצב של מילה ל-'new' או 'known'. */
function pocketSetStatus(key, st){
  const e = pocketEntry(key);
  if (!e) return false;
  e.st = st;
  return pocketWrite();
}

/** מעדכן את התרגום של מילה שכבר במילון שלי. manual=true: נכתב ביד, ולא ישלימו אותו אוטומטית. */
function pocketSetHe(key, he, manual){
  const e = pocketEntry(key);
  if (!e) return false;
  e.he = he;
  if (manual) e.man = true;
  return pocketWrite();
}

/** מחליף את שם הטקסט בכל המילים שנלקחו ממנו. */
function pocketRenameSrc(oldSrc, newSrc){
  const all = pocketAll();
  Object.keys(all).forEach(k => { if (all[k] && (all[k].src || POCKET_NO_SRC) === oldSrc) all[k].src = newSrc; });
  pocketWrite();
}

/** מוחק מילה מהכיס. */
function pocketRemove(key){
  if (!pocketEntry(key)) return;
  delete pocketAll()[key];
  pocketWrite();
}

/** כל המילים מקובצות לפי הטקסט שמהם נלקחו: [{ src, items }]. הקבוצה עם המילה החדשה ביותר ראשונה, ובתוך קבוצה מילים שעוד לא זכורות קודם. */
function pocketGroups(){
  const all = pocketAll(), bySrc = {};
  Object.keys(all).forEach(k => {
    const e = all[k];
    if (!e || typeof e !== 'object') return;
    const src = e.src || POCKET_NO_SRC;
    (bySrc[src] = bySrc[src] || []).push(e);
  });
  const newest = list => Math.max.apply(null, list.map(e => e.at || 0));
  return Object.keys(bySrc).map(src => {
    const items = bySrc[src].sort((a, b) => (a.st === b.st ? (b.at || 0) - (a.at || 0) : (a.st === 'new' ? -1 : 1)));
    return { src: src, items: items };
  }).sort((a, b) => newest(b.items) - newest(a.items));
}
