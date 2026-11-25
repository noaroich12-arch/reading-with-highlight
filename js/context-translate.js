/* context-translate.js: תרגום המילה הנוכחית לפי ההקשר של המשפט שלה.
   הבעיה: תרגום של מילה לבד יכול לבחור משמעות לא נכונה (bear = דוב, גם כשהמשפט אומר "לסבול").
   הפתרון: שולחים ל-Google Translate את המשפט כשהמילה עטופה ב-<b>, ו-Google מחזיר את התרגום עם אותו סימון סביב המילה בעברית.
   משתמש באותה הסכמה ובאותו שירות של המילון, ובפונקציות של dictionary.js (fetchJson, heClean, isHe).
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען אחרי dictionary.js. */
'use strict';

const CONTEXT_WORDS_EACH_SIDE = 15;   // כמה מילים מכל צד נשלחות כהקשר (בתוך המשפט בלבד)

/** מנקה טקסט לפני שהוא נשלח כ-HTML: סימנים שיכולים להתפרש כתגית הופכים לטקסט רגיל. */
function escapeForHtmlQuery(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** בונה את המשפט שסביב המילה הנוכחית, כשהמילה עטופה ב-<b>. מחזיר '' אם במילה אין אותיות. */
function buildMarkedContext(){
  if (!words.length || !words[cur]) return '';
  const s = sentences[words[cur].s];
  const from = Math.max(s.first, cur - CONTEXT_WORDS_EACH_SIDE);
  const to = Math.min(s.last, cur + CONTEXT_WORDS_EACH_SIDE);
  const parts = [];
  for (let i = from; i <= to; i++){
    const safe = escapeForHtmlQuery(words[i].t);
    parts.push(i === cur ? safe.replace(/[A-Za-z][A-Za-z'’-]*/, m => '<b>' + m + '</b>') : safe);
  }
  const q = parts.join(' ');
  return q.includes('<b>') ? q : '';
}

/** מוציא מהתרגום את הטקסט שבתוך הסימון <b> (בלי להריץ שום דבר מהתוכן), או '' אם אין. */
function extractMarkedWord(html){
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const b = doc.querySelector('b');
  return b ? heClean(b.textContent) : '';
}

/** מחזיר את התרגום של המילה הנוכחית בהקשר המשפט, או '' אם לא הצלחנו (אז משתמשים בתרגום הרגיל). */
async function contextTranslationNow(){
  const q = buildMarkedContext();
  if (!q) return '';
  try {
    const j = await fetchJson('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&q=' + encodeURIComponent(q), 9000);
    const html = Array.isArray(j[0]) ? j[0].map(p => (p && p[0]) || '').join('') : '';
    const he = extractMarkedWord(html);
    return isHe(he) ? he : '';
  } catch(e){ return ''; }
}
