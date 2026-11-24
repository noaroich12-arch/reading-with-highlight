/* notes-marks.js: סימון בטקסט של מילים שיש עליהן הערה (קו גלי מתחת), ועדכון כפתור "הערה" עם מספר ההערות.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** מצייר מחדש את הסימונים לפי ההערות של הטקסט שעל המסך. מוסיף גם תיאור קצר (title) שמופיע כשמחזיקים את העכבר על המילה. */
function applyNoteMarks(){
  noteTextKey = notesCurrentKey();
  const hints = {};
  const list = notesList();
  list.forEach(note => {
    for (let k = note.i; k < note.i + note.n && k < words.length; k++){
      hints[k] = (hints[k] ? hints[k] + ' | ' : '') + note.t;
    }
  });
  words.forEach((w, k) => {
    w.el.classList.toggle('hasnote', hints[k] !== undefined);
    if (hints[k] !== undefined) w.el.title = 'הערה: ' + hints[k]; else w.el.removeAttribute('title');
  });
  $('#noteBtn').textContent = list.length ? 'הערה (' + list.length + ')' : 'הערה';
}
