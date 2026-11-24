/* notes-store.js: שמירת ההערות על מילים במכשיר.
   כל ההערות במפתח אחד, tts.notes: אובייקט שבו המפתח מזהה את הטקסט (חישוב קצר מתוך תוכנו), והערך הוא רשימת ההערות שלו.
   הערה = { id, i: מילה ראשונה, n: כמה מילים, w: המילים עצמן, t: טקסט ההערה }.
   כך אותו טקסט שנפתח שוב (מהספרייה או בהדבקה) מקבל חזרה את ההערות שלו.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

const NOTES_STORAGE_KEY = 'tts.notes';
const NOTE_MAX_LENGTH = 500;
let notesAll = null;     // כל ההערות (נטען פעם אחת מהאחסון)
let noteTextKey = '';    // מזהה הטקסט שעל המסך

/** האם הערה אחת תקינה. */
function isNote(x){
  return x && typeof x.id === 'string' && typeof x.i === 'number' && typeof x.n === 'number'
    && typeof x.w === 'string' && typeof x.t === 'string';
}

/** האם כל מה שנשמר תקין (אם לא, מתחילים מרשימה ריקה ולא נכשלים). */
function isNotesMap(v){
  return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every(k => Array.isArray(v[k]) && v[k].every(isNote));
}

/** מזהה קצר לטקסט, מחושב מהתוכן שלו. */
function noteKeyOf(str){
  let h = 5381;
  for (let k = 0; k < str.length; k++) h = ((h << 5) + h + str.charCodeAt(k)) | 0;
  return (h >>> 0).toString(36) + '-' + str.length.toString(36);
}

/** המזהה של הטקסט שמוצג עכשיו. */
function notesCurrentKey(){ return noteKeyOf(currentTextAsString()); }

/** כל ההערות של כל הטקסטים (נטען פעם אחת). */
function notesAllMap(){
  if (!notesAll) notesAll = SafeStore.getJSON(NOTES_STORAGE_KEY, {}, isNotesMap);
  return notesAll;
}

/** כותב את ההערות לאחסון (בלי רשימות ריקות). מחזיר false אם אין מקום. */
function notesSaveAll(){
  const map = notesAllMap();
  Object.keys(map).forEach(k => { if (!map[k].length) delete map[k]; });
  return SafeStore.setJSON(NOTES_STORAGE_KEY, map);
}

/** ההערות של הטקסט שעל המסך, לפי סדר המילים. */
function notesList(){
  return (notesAllMap()[noteTextKey] || []).slice().sort((a, b) => a.i - b.i);
}

/** מוסיף הערה על n מילים שמתחילות ב-i. מחזיר false אם אין מקום לשמור. */
function notesAdd(i, n, text){
  const map = notesAllMap();
  if (!map[noteTextKey]) map[noteTextKey] = [];
  const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const w = words.slice(i, i + n).map(x => x.t).join(' ');
  map[noteTextKey].push({ id: id, i: i, n: n, w: w, t: text.slice(0, NOTE_MAX_LENGTH) });
  return notesSaveAll();
}

/** מחליף את הטקסט של הערה קיימת. */
function notesUpdate(id, text){
  const note = (notesAllMap()[noteTextKey] || []).find(x => x.id === id);
  if (!note) return false;
  note.t = text.slice(0, NOTE_MAX_LENGTH);
  return notesSaveAll();
}

/** מוחק הערה אחת. */
function notesRemove(id){
  const map = notesAllMap();
  map[noteTextKey] = (map[noteTextKey] || []).filter(x => x.id !== id);
  notesSaveAll();
}

/** אחרי עריכה: מעביר את ההערות מהטקסט הישן לחדש. הערה שהמילים שלה לא נגעו נשארת (ומוזזת אם נוספו מילים לפניה).
    הערה שהמילים שלה נמחקו או שונו נמחקת. מחזיר כמה הערות נמחקו. */
function notesMigrate(oldKey, newKey, oldTexts, newTexts){
  const map = notesAllMap();
  const edges = wordEdges(oldTexts, newTexts);
  const kept = [];
  let dropped = 0;
  (map[oldKey] || []).forEach(note => {
    if (!rangeUntouched(note.i, note.n, edges)){ dropped++; return; }
    note.i = mapWordIndex(note.i, edges);
    note.w = newTexts.slice(note.i, note.i + note.n).join(' ');
    kept.push(note);
  });
  if (oldKey !== newKey) delete map[oldKey];
  map[newKey] = (map[newKey] || []).concat(kept);
  notesSaveAll();
  return dropped;
}
