/* highlight.js: סימון המילה והמשפט הנוכחיים, גלילה אחריהם והתקדמות.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- הדגשה ומיקום ---------------- */
/** מסמן את המילה והמשפט i כנוכחיים, מעדכן התקדמות וגולל אליהם (אלא אם opts.noScroll). */
function setCur(i, opts){
  if (!words.length) return;
  i = clamp(i, 0, words.length - 1);
  const w = words[i];
  if (i !== cur || !curWordEl){
    if (curWordEl) curWordEl.classList.remove('cur');
    w.el.classList.add('cur');
    curWordEl = w.el;
    cur = i;
  }
  if (w.s !== curSent || !curSentEl){
    if (curSentEl) curSentEl.classList.remove('cur');
    sentences[w.s].el.classList.add('cur');
    curSentEl = sentences[w.s].el;
    curSent = w.s;
  }
  updateProgress();
  if (!(opts && opts.noScroll)) follow(w.el);
  savePosSoon();
}

/** מדליק או מכבה את מצב הקריאה של הדף. */
function setReading(on){ document.documentElement.classList.toggle('reading', !!on); }

let lastFollow = 0, followT = null;
/** גולל את חלון הטקסט כך שהמילה el תישאר באזור נוח. לא מתחיל גלילה חדשה בזמן שגלילה רכה עדיין רצה. */
function follow(el, instant){
  // לא מתחילים גלילה חדשה בזמן שגלילה רכה עדיין רצה: זה מה שגרם לטקסט "לקפוץ"
  const now = performance.now();
  if (!instant && now - lastFollow < 550){
    clearTimeout(followT);
    followT = setTimeout(() => { if (curWordEl) follow(curWordEl); }, 570);   // בודקים שוב אחרי שהגלילה נגמרה
    return;
  }
  // הטקסט גולל בתוך החלון שלו (#page), לא בתוך העמוד. החלון הוא בדיוק מה שנשאר בין הפס העליון לפקדים.
  const pg = $('#page');
  const pr = pg.getBoundingClientRect();
  const area = pr.height;
  if (area < 60) return;
  const r = el.getBoundingClientRect();
  const topLimit = pr.top + area * 0.06;
  const bottomLimit = pr.top + area * 0.80;
  if (instant || r.top < topLimit || r.bottom > bottomLimit){
    lastFollow = now;
    const target = pr.top + area * 0.28;
    const delta = r.top - target;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    pg.scrollBy({ top: delta, behavior: (instant || calm) ? 'auto' : 'smooth' });
  }
}

/** מעדכן את מונה המילים ואת פס ההתקדמות. */
function updateProgress(){
  const n = words.length;
  const phone = window.matchMedia('(max-width:640px), (max-height:520px) and (orientation:landscape)').matches;
  $('#where').textContent = phone ? (cur + 1) + ' / ' + n : 'מילה ' + (cur + 1) + ' מתוך ' + n;
  $('#progFill').style.width = (n > 1 ? (cur / (n - 1)) * 100 : 100) + '%';
}

/** שומר את המיקום אחרי הפסקה קצרה, כדי לא לכתוב לאחסון בכל מילה. */
function savePosSoon(){
  clearTimeout(saveT);
  saveT = setTimeout(() => { store.set('tts.pos', String(cur)); libraryRememberPos(cur); }, 400);
}
