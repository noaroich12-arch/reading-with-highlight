/* highlight-toggle.js: שני כפתורים שמכבים ומדליקים את הסימון הכתום: אחד לצבע המילה ואחד לצבע המשפט.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען אחרי state.js. */
'use strict';

/** שני הסימונים: מפתח אחסון ('1' = כבוי), מחלקת CSS על הדף, כפתור ושם להצגה. */
const HL_PARTS = {
  word: { key: 'tts.hlWordOff', cls: 'hl-word-off', btn: '#hlWordBtn', name: 'סימון המילה', label: 'מילה' },
  sent: { key: 'tts.hlSentOff', cls: 'hl-sent-off', btn: '#hlSentBtn', name: 'סימון המשפט', label: 'משפט' }
};

/** מעדכן את הדף ואת הכפתור של part לפי המצב: on=true אומר שהסימון דולק. */
function applyHighlight(part, on){
  const p = HL_PARTS[part];
  document.documentElement.classList.toggle(p.cls, !on);
  const b = $(p.btn);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.textContent = p.label + ': ' + (on ? 'דולק' : 'כבוי');
}

/** מחליף את part בין דולק לכבוי ושומר את הבחירה. */
function toggleHighlight(part){
  const p = HL_PARTS[part];
  const on = document.documentElement.classList.contains(p.cls);   // היה כבוי, עכשיו נדליק
  applyHighlight(part, on);
  store.set(p.key, on ? '0' : '1');
  toast(p.name + (on ? ' דולק.' : ' כבוי.'));
}

// בגרסה הקודמת היה מפתח אחד לשניהם (tts.hlOff). אם הוא נשמר, שני הסימונים מתחילים כבויים ואז המפתח נמחק.
const oldHlOff = store.get('tts.hlOff', null);
store.del('tts.hlOff');

Object.keys(HL_PARTS).forEach(part => {
  const p = HL_PARTS[part];
  if (oldHlOff === '1') store.set(p.key, '1');
  $(p.btn).addEventListener('click', () => toggleHighlight(part));
  applyHighlight(part, store.get(p.key, '0') !== '1');
});
