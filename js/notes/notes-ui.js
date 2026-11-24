/* notes-ui.js: חלון ההערות: בחירת המילים, הוספת הערה, וצפייה, תיקון ומחיקה של הערות קיימות.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

const NOTE_MAX_WORDS = 60;   // הערה אחת לא תכסה יותר מזה
let noteTarget = { i: 0, n: 1 };

/** מחזיר { i, n } של המילים שסומנו בעכבר או באצבע בתוך הטקסט, או null אם לא סומן כלום. */
function readWordSelection(){
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!$('#text').contains(range.commonAncestorContainer)) return null;
  let first = -1, last = -1;
  for (let k = 0; k < words.length; k++){
    if (range.intersectsNode(words[k].el)){ if (first < 0) first = k; last = k; }
    else if (first >= 0) break;
  }
  return first < 0 ? null : { i: first, n: Math.min(last - first + 1, NOTE_MAX_WORDS) };
}

/** המילים שההערה תחול עליהן: מה שסומן, ואם לא סומן כלום, המילה המסומנת עכשיו בהקראה. */
function chooseNoteTarget(snapshot){
  return snapshot || readWordSelection() || { i: cur, n: 1 };
}

/** האם הערה חופפת למילים שנבחרו עכשיו. */
function noteOverlapsTarget(note){
  return note.i < noteTarget.i + noteTarget.n && noteTarget.i < note.i + note.n;
}

/** בונה שורה של הערה אחת: המילים, תיבה לתיקון, ושלושה כפתורים. */
function buildNoteRow(note){
  const row = DomBuild.make('div', 'libItem noteItem');
  const anchor = DomBuild.make('div', 'libTitle', note.w + (noteOverlapsTarget(note) ? '   (על המילים שבחרת)' : ''));
  anchor.lang = 'en'; anchor.dir = 'ltr';
  row.appendChild(anchor);
  const box = DomBuild.make('textarea', 'noteField');
  box.value = note.t; box.dir = 'auto'; box.maxLength = NOTE_MAX_LENGTH;
  box.setAttribute('aria-label', 'ההערה על: ' + note.w);
  row.appendChild(box);
  const btns = DomBuild.make('div', 'libBtns');
  btns.appendChild(DomBuild.button('שמירת התיקון', 'small primary', () => saveNoteEdit(note.id, box.value)));
  btns.appendChild(DomBuild.button('מעבר למילה', 'small', () => { closeDialog('notes'); go(note.i); }));
  btns.appendChild(DomBuild.confirmButton('מחיקה', 'בטוחה? מחקי', 'small', () => { notesRemove(note.id); afterNotesChange(); }));
  row.appendChild(btns);
  return row;
}

/** מצייר מחדש את רשימת ההערות של הטקסט. */
function renderNotesList(){
  const box = $('#notesList');
  box.textContent = '';
  const list = notesList();
  $('#notesEmpty').hidden = list.length > 0;
  list.forEach(note => box.appendChild(buildNoteRow(note)));
}

/** אחרי כל שינוי בהערות: מצייר מחדש את הרשימה ואת הסימונים בטקסט. */
function afterNotesChange(){
  renderNotesList();
  applyNoteMarks();
}

/** שומר תיקון של הערה קיימת. */
function saveNoteEdit(id, text){
  if (!text.trim()){ toast('ההערה ריקה. כדי להסיר אותה, אפשר ללחוץ על "מחיקה".'); return; }
  if (!notesUpdate(id, text.trim())){ toast('אין מקום לשמור בדפדפן.'); return; }
  afterNotesChange();
}

/** מוסיף הערה חדשה על המילים שנבחרו, מהתיבה שבחלון. */
function addNoteFromInput(){
  const text = $('#noteInput').value.trim();
  if (!text){ toast('כדאי לכתוב קודם את ההערה.'); $('#noteInput').focus(); return; }
  if (!notesAdd(noteTarget.i, noteTarget.n, text)){ toast('אין מקום לשמור בדפדפן.'); return; }
  $('#noteInput').value = '';
  afterNotesChange();
  $('#noteInput').focus();
}

/** פותח את חלון ההערות על המילים שנבחרו (ועוצר הקראה אם היא רצה). */
function openNotesDialog(snapshot){
  if (playing) pause();
  noteTarget = chooseNoteTarget(snapshot);
  const target = words.slice(noteTarget.i, noteTarget.i + noteTarget.n).map(x => x.t).join(' ');
  $('#notesTarget').textContent = target;
  $('#noteInput').value = '';
  renderNotesList();
  openDialog('notes', '#noteInput');
}
