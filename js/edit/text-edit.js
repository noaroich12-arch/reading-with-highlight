/* text-edit.js: עריכת הטקסט בזמן קריאה: למחוק, להקליד, להוסיף מילים, ולמחוק הכול.
   השינוי נכנס לתוקף רק בלחיצה על "שמירה". "ביטול" מחזיר את הטקסט כמו שהיה.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

const EDIT_CANCEL_LABEL = 'ביטול';
let editOriginal = '';       // הטקסט כפי שהיה ברגע שנפתחה העריכה
let editCancelArmed = false; // האם כבר לחצו פעם אחת על ביטול אחרי שינוי

/** כמה תווים יש לפני המילה שמסומנת עכשיו (מילה אחת = המילה + רווח או שורה חדשה). */
function charOffsetOfCurrentWord(){
  let off = 0;
  for (let k = 0; k < cur && k < words.length; k++) off += words[k].t.length + 1;
  return off;
}

/** מחזיר את כפתור הביטול למצב רגיל. */
function resetEditCancel(){
  editCancelArmed = false;
  $('#editCancel').textContent = EDIT_CANCEL_LABEL;
}

/** פותח את עריכת הטקסט: עוצר הקראה, מציג את הטקסט בתיבה, ומציב את הסמן ליד המילה שהוקראה. */
function openTextEdit(){
  if (!words.length) return;
  pause();
  editOriginal = currentTextAsString();
  const box = $('#editText');
  box.value = editOriginal;
  resetEditCancel();
  $('#readView').classList.add('editing');
  const off = charOffsetOfCurrentWord();
  box.focus();
  box.setSelectionRange(off, off);
  box.scrollTop = Math.max(0, (off / Math.max(1, editOriginal.length)) * box.scrollHeight - box.clientHeight / 2);
}

/** סוגר את העריכה בלי לשנות כלום. */
function closeTextEdit(){
  $('#readView').classList.remove('editing');
}

/** ביטול: אם יש שינויים, צריך לחיצה שנייה כדי לא לאבד אותם בטעות. */
function cancelTextEdit(){
  const changed = $('#editText').value !== editOriginal;
  if (changed && !editCancelArmed){
    editCancelArmed = true;
    $('#editCancel').textContent = 'בטוחה? ביטול כל השינויים';
    return;
  }
  resetEditCancel();
  closeTextEdit();
  if (curWordEl) follow(curWordEl, true);
}

/** מוחק את כל הטקסט מהתיבה. הוא נמחק באמת רק בשמירה, וביטול מחזיר אותו. */
function clearEditBox(){
  $('#editText').value = '';
  $('#editText').focus();
  toast('התיבה ריקה. לחיצה על "שמירה" תמחק את הטקסט, ו"ביטול" יחזיר אותו.');
}

/** שמירה של טקסט ריק: מנקים את הדף וחוזרים למסך ההדבקה. טקסט ששמור בספרייה לא נמחק. */
function finishEmptyText(){
  words = []; sentences = []; paras = []; curWordEl = null; curSentEl = null; curSent = -1;
  $('#text').textContent = '';
  store.del('tts.text'); store.set('tts.pos', '0');
  librarySetCurrent('');
  showEdit();
  toast('הטקסט נמחק מהדף. טקסטים ששמרת בספרייה נשארו.');
}

/** מעדכן את הטקסט השמור (האחרון, ואם הוא שמור בספרייה גם שם) אחרי עריכה. */
function persistEditedText(pos){
  const text = currentTextAsString();
  if (!store.set('tts.text', text)) store.del('tts.text');
  store.set('tts.pos', String(pos));
  const item = libraryFind(libraryCurrentId());
  if (item && !librarySave(item.title, text, pos).ok) toast('השינוי עובד, אבל אין מקום לעדכן את הטקסט בספרייה.');
}

/** שומר את הטקסט שנערך, מזיז את ההערות בהתאם, וממשיך להקריא: מההתחלה או מהמקום שבו היינו. */
function saveTextEdit(fromStart){
  const oldKey = notesCurrentKey(), oldTexts = words.map(w => w.t), oldPos = cur;
  parse($('#editText').value);
  if (!words.length){ closeTextEdit(); finishEmptyText(); return; }
  const newTexts = words.map(w => w.t);
  const dropped = notesMigrate(oldKey, notesCurrentKey(), oldTexts, newTexts);
  const pos = fromStart ? 0 : mapWordIndex(oldPos, wordEdges(oldTexts, newTexts));
  resetEditCancel();
  closeTextEdit();
  openRead($('#editText').value, pos);
  persistEditedText(cur);
  toast(dropped ? 'הטקסט נשמר. ' + dropped + ' הערות נמחקו כי המילים שלהן נמחקו.' : 'הטקסט נשמר.');
}
