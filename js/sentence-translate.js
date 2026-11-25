/* sentence-translate.js: כפתור "תרגום המשפט" בחלון המילון. מתרגם את כל המשפט שבו נמצאת המילה ומציג את התרגום בתוך האתר.
   משתמש באותה הסכמה ובאותו שירות כמו המילון (Google Translate), ומשתמש בפונקציות של dictionary.js.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען אחרי dictionary.js. */
'use strict';

const SENTENCE_MAX_CHARS = 500;   // משפט ארוך מזה נחתך, כדי שהבקשה לא תהיה ארוכה מדי

/** מחזיר את טקסט המשפט שבו נמצאת המילה הנוכחית (בלי יותר מ-SENTENCE_MAX_CHARS תווים). */
function currentSentenceText(){
  if (!words.length || !words[cur]) return '';
  const s = sentences[words[cur].s];
  if (!s) return '';
  const parts = [];
  for (let i = s.first; i <= s.last; i++) parts.push(words[i].t);
  return parts.join(' ').slice(0, SENTENCE_MAX_CHARS);
}

/** מתרגם משפט לעברית ב-Google Translate. זורק שגיאה אם אין תרגום בעברית. */
async function translateSentenceText(text){
  const j = await fetchJson('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&q=' + encodeURIComponent(text), 9000);
  const he = heClean(Array.isArray(j[0]) ? j[0].map(p => (p && p[0]) || '').join('') : '');
  if (!isHe(he)) throw new Error('empty');
  return he;
}

/** מנקה את אזור תרגום המשפט (נקרא כשחלון המילון נפתח למילה חדשה). */
function resetSentenceBox(){
  const box = $('#dictSentenceOut');
  box.hidden = true;
  box.textContent = '';
}

/** לחיצה על "תרגום המשפט": מבקש הסכמה אם צריך, מתרגם ומציג את התרגום בחלון המילון. */
async function onSentenceTranslateClick(){
  const text = currentSentenceText();
  const box = $('#dictSentenceOut');
  if (!text){ toast('אין משפט לתרגם. אפשר לבחור מילה אחרת.'); return; }
  if (!(await requestDictConsent())){
    box.hidden = false;
    box.textContent = 'התרגום לא הופעל, כי לא אושר שליחה ל-Google. אפשר ללחוץ שוב ולאשר.';
    return;
  }
  box.hidden = false;
  box.textContent = 'מתרגמת את המשפט…';
  try {
    const he = await translateSentenceText(text);
    box.textContent = he;
  } catch(err){
    box.textContent = 'לא הצלחתי לתרגם את המשפט עכשיו. אפשר לנסות שוב בעוד רגע.';
  }
}
