/* highlight-toggle.js: כפתור שמכבה ומדליק את הסימון הכתום (צבע המשפט וצבע המילה).
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען אחרי state.js. */
'use strict';

const HL_KEY = 'tts.hlOff';   // '1' = הסימון כבוי

/** האם הסימון הכתום כבוי כרגע. */
function isHighlightOff(){ return document.documentElement.classList.contains('hl-off'); }

/** מעדכן את הדף ואת הכפתור לפי המצב: on=true אומר שהסימון דולק. */
function applyHighlight(on){
  document.documentElement.classList.toggle('hl-off', !on);
  const b = $('#hlBtn');
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.textContent = on ? 'סימון כתום: דולק' : 'סימון כתום: כבוי';
}

/** מחליף בין דולק לכבוי ושומר את הבחירה. */
function toggleHighlight(){
  const on = isHighlightOff();   // היה כבוי, עכשיו נדליק
  applyHighlight(on);
  store.set(HL_KEY, on ? '0' : '1');
  toast(on ? 'הסימון הכתום דולק.' : 'הסימון הכתום כבוי.');
}

$('#hlBtn').addEventListener('click', toggleHighlight);
applyHighlight(store.get(HL_KEY, '0') !== '1');
