/* pocket-edit.js: עריכת התרגום של מילה ב"המילון שלי" (תיקון, הוספה, מחיקה), כשהמילון מתרגם לא נכון.
   תרגום שנערך ביד מסומן כ"ידני", ולכן התרגום האוטומטי לא ידרוס אותו.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

const POCKET_HE_MAX = 80;   // אורך מרבי לתרגום אחד

/** שומר את התרגום שנכתב ביד. תרגום ריק מוחק את התרגום. מחזיר true אם נשמר. */
function saveEditedHe(key, text){
  const he = text.trim();
  if (!pocketSetHe(key, he, true)){ toast('אין מקום לשמור בדפדפן.'); return false; }
  toast(he ? 'התרגום נשמר.' : 'התרגום נמחק.');
  return true;
}

/** מחליף את שורת התרגום בתיבת כתיבה עם כפתורי שמירה וביטול. */
function startHeEdit(heLine, e){
  heLine.textContent = '';
  const inp = DomBuild.make('input', 'heInput');
  inp.type = 'text'; inp.maxLength = POCKET_HE_MAX; inp.value = e.he || ''; inp.dir = 'auto';
  inp.setAttribute('aria-label', 'התרגום של: ' + e.w + '. אפשר לתקן, להוסיף או למחוק.');
  const save = () => { if (saveEditedHe(e.w, inp.value)) renderPocketList(); };
  inp.addEventListener('keydown', ev => {
    if (ev.key === 'Enter'){ ev.preventDefault(); save(); }
    if (ev.key === 'Escape'){ ev.stopPropagation(); renderPocketList(); }
  });
  heLine.appendChild(inp);
  const btns = DomBuild.make('div', 'libBtns');
  btns.appendChild(DomBuild.button('שמירת התרגום', 'small primary', save));
  btns.appendChild(DomBuild.button('ביטול', 'small', () => renderPocketList()));
  heLine.appendChild(btns);
  inp.focus();
  inp.select();
}
