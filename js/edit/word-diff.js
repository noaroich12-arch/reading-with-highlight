/* word-diff.js: השוואה פשוטה בין שתי רשימות מילים: מה נשאר זהה בהתחלה ובסוף, ומה השתנה באמצע.
   משמש את עריכת הטקסט ואת הזזת ההערות אחרי עריכה.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** מחזיר { p: כמה מילים זהות בהתחלה, s: כמה זהות בסוף, delta: הפרש האורכים, oldLen } בין רשימה ישנה a לחדשה b. */
function wordEdges(a, b){
  const m = Math.min(a.length, b.length);
  let p = 0;
  while (p < m && a[p] === b[p]) p++;
  let s = 0;
  while (s < m - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  return { p: p, s: s, delta: b.length - a.length, oldLen: a.length };
}

/** האם הטווח של n מילים שמתחיל ב-i לא נגע באזור ששונה. */
function rangeUntouched(i, n, e){
  return i + n <= e.p || i >= e.oldLen - e.s;
}

/** המקום החדש של מילה שהייתה במקום i: לפני השינוי ללא שינוי, אחריו מוזזת, ובתוך האזור ששונה היא חוזרת לתחילתו. */
function mapWordIndex(i, e){
  if (i < e.p) return i;
  if (i >= e.oldLen - e.s) return i + e.delta;
  return e.p;
}
