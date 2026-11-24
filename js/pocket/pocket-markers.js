/* pocket-markers.js: סימון במרקר, בתוך הטקסט, של מילים ממילון הכיס שעוד לא זכורות.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** מסמן בטקסט שעל המסך כל מילה שנמצאת בכיס ועדיין לא זכורה, ומסיר סימון ממילים אחרות. */
function applyPocketMarks(){
  if (!words.length) return;
  for (const w of words){
    if (w.k === undefined) w.k = pocketKey(w.t);
    const e = w.k ? pocketEntry(w.k) : null;
    w.el.classList.toggle('newword', !!(e && e.st === 'new'));
  }
}
