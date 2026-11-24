/* notes-events.js: חיבור הלחיצות של ההערות.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

let noteSnapshot = null;   // מה שסומן ברגע שהתחילה הלחיצה על הכפתור (לפני שהמסך מבטל את הסימון)

$('#noteBtn').addEventListener('pointerdown', () => { noteSnapshot = readWordSelection(); });
$('#noteBtn').addEventListener('click', () => {
  const snap = noteSnapshot;
  noteSnapshot = null;
  openNotesDialog(snap);
});

$('#noteAdd').addEventListener('click', addNoteFromInput);
$('#noteInput').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); addNoteFromInput(); } });
$('#notesClose').addEventListener('click', () => closeDialog('notes'));
$('#notes').addEventListener('click', e => { if (e.target.id === 'notes') closeDialog('notes'); });
