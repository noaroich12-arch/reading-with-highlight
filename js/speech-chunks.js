/* speech-chunks.js: הקראה בקטעים קצרים, לקולות שלא הוכח שהם מדווחים על מילים.
   הבעיה: כשהקול לא מדווח איפה הוא, האתר מנחש את מיקום הסימון לפי זמן. בניחוש על משפט שלם הטעות גדלה והסימון רץ קדימה.
   הפתרון: המשפט מפוצל לקטעים של עד CHUNK_MAX_WORDS מילים (בפסיקים, ובחצי אם הקטע ארוך). כל הקטעים נכנסים לתור ההקראה יחד,
   ובתחילת כל קטע הסימון קופץ למילה הראשונה שלו. כך הטעות לא עוברת את אורך הקטע.
   אם הקול כן מדווח על מילים, אירוע הדיווח משמש כרגיל, ומהמשפט הבא ההקראה חוזרת להיות משפט שלם (speakFrom).
   סקריפט רגיל (לא מודול): נטען אחרי speech.js ומשתמש בפונקציות שלו. */
'use strict';

const CHUNK_MAX_WORDS = 6;                       // הכי הרבה מילים בקטע אחד
const CHUNK_BREAK_RE = /[,;:—–]["'”’)\]]*$/;     // מילה שמסתיימת בסימן עצירה: כאן אפשר לחתוך

/** מפצל את המשפט (מהמילה first עד last) לקטעים: חיתוך אחרי פסיק וכדומה, וקטע ארוך מתחלק לחלקים שווים. */
function splitIntoChunks(first, last){
  const chunks = [];
  let from = first;
  for (let i = first; i <= last; i++){
    if (i === last || CHUNK_BREAK_RE.test(words[i].t)){
      addEvenPieces(chunks, from, i);
      from = i + 1;
    }
  }
  return chunks;
}

/** מוסיף את המילים a..b כקטע אחד, או כמה קטעים שווים אם יש יותר מ-CHUNK_MAX_WORDS. */
function addEvenPieces(chunks, a, b){
  const n = b - a + 1;
  const size = Math.ceil(n / Math.ceil(n / CHUNK_MAX_WORDS));
  for (let s = a; s <= b; s += size) chunks.push({ first: s, last: Math.min(b, s + size - 1) });
}

/** תחילת קטע: מסנכרן את הסימון למילה הראשונה שלו ומתחיל הערכה בתוך הקטע (אלא אם כבר הוכח שהקול מדווח). */
function onChunkStart(ch){
  const p = ch.parent;
  if (p.my !== gen) return;
  p.started = true; retries = 0;
  clearTimeout(watchT); clearInterval(estTimer); clearTimeout(fbTimer);
  estTimer = null;
  ch.started = true;
  ch.tStart = performance.now();
  if (ch.idx !== cur) setCur(ch.idx);
  if (voice && voiceHasBoundary[voice.name] === true) fbTimer = setTimeout(() => startEstimate(ch), 700);
  else startEstimate(ch);
}

/** סוף קטע: מסמן את המילה האחרונה שלו. בסוף הקטע האחרון של המשפט ממשיך למשפט הבא (אם עדיין מקריאים). */
function onChunkEnd(ch){
  const p = ch.parent;
  if (p.my !== gen) return;
  clearInterval(estTimer); clearTimeout(fbTimer);
  estTimer = null;
  if (!ch.gotBoundary && ch.started && voice) learnSpeed(ch.text, (performance.now() - ch.tStart) / 1000);
  if (cur !== ch.s.last) setCur(ch.s.last);
  if (ch.isLast && playing) speakFrom(p.s.last + 1);
}

/** יוצר הקראה לקטע אחד ומחבר אליה את האירועים שלו. parent הוא מצב המשפט כולו. */
function buildChunkUtterance(parent, piece, isLast){
  const { text, offs } = buildSpeechText(piece.first, { last: piece.last });
  const ch = { my: parent.my, parent, idx: piece.first, s: { last: piece.last }, text, offs,
               started: false, gotBoundary: false, tStart: 0, lead: 0, isLast };
  const u = makeUtterance(text);
  u.onstart = () => onChunkStart(ch);
  u.onboundary = e => onSpeechBoundary(ch, e);
  u.onend = () => onChunkEnd(ch);
  u.onerror = e => onSpeechError(parent, e);
  return u;
}

/** מקריא את המשפט s מהמילה idx בקטעים קצרים: כל הקטעים נכנסים לתור ההקראה בבת אחת. */
function speakChunks(idx, s, my){
  const parent = { my, idx, s, started: false };
  const pieces = splitIntoChunks(idx, s.last);
  const utterances = pieces.map((pc, i) => buildChunkUtterance(parent, pc, i === pieces.length - 1));
  utterRef = utterances;   // הפניה לכולן, כדי ש-Chrome לא ימחק הקראה שעוד לא הגיעה
  armWatchdog(parent);
  utterances.forEach(u => synth.speak(u));
}
