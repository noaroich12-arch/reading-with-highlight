/* library-store.js: ספריית הטקסטים השמורים: שמירה וקריאה במכשיר.
   רשימה קצרה (שם, מיקום, תאריך) במפתח tts.lib, והטקסט המלא של כל פריט במפתח נפרד tts.libtext.<מזהה>,
   כדי שעדכון מיקום הקריאה יכתוב רק את הרשימה הקטנה. tts.libId = הפריט הפתוח עכשיו.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

const LIB_INDEX_KEY = 'tts.lib';
const LIB_TEXT_PREFIX = 'tts.libtext.';
const LIB_CURRENT_KEY = 'tts.libId';
let libIndexCache = null;

/** האם הרשימה השמורה תקינה. */
function isLibIndex(v){ return Array.isArray(v) && v.every(x => x && typeof x.id === 'string' && typeof x.title === 'string'); }

/** רשימת הפריטים השמורים (נטענת פעם אחת מהאחסון). החדש ביותר ראשון. */
function libraryIndex(){
  if (!libIndexCache) libIndexCache = SafeStore.getJSON(LIB_INDEX_KEY, [], isLibIndex);
  return libIndexCache;
}

/** כותב את הרשימה לאחסון. מחזיר false אם אין מקום. */
function libraryWriteIndex(){ return SafeStore.setJSON(LIB_INDEX_KEY, libraryIndex()); }

/** הטקסט המלא של פריט, או מחרוזת ריקה אם אין. */
function libraryText(id){ return SafeStore.get(LIB_TEXT_PREFIX + id, ''); }

/** מזהה הפריט הפתוח עכשיו (או ריק אם הטקסט הפתוח לא שמור). */
function libraryCurrentId(){ return SafeStore.get(LIB_CURRENT_KEY, ''); }

/** קובע איזה פריט פתוח עכשיו. מזהה ריק = טקסט שלא שמור בספרייה. */
function librarySetCurrent(id){
  if (id) SafeStore.set(LIB_CURRENT_KEY, id); else SafeStore.del(LIB_CURRENT_KEY);
}

/** הפריט עם המזהה id, או undefined. */
function libraryFind(id){ return libraryIndex().find(x => x.id === id); }

/** הטקסט שמוצג עכשיו על המסך, כמחרוזת אחת (פסקה בכל שורה). */
function currentTextAsString(){
  return paras.map(p => words.slice(p.first, p.last + 1).map(w => w.t).join(' ')).join('\n');
}

/** שומר טקסט בשם title. אם כבר יש פריט באותו שם, מעדכן אותו. מחזיר { ok, id, updated }. */
function librarySave(title, text, pos){
  const idx = libraryIndex();
  let item = idx.find(x => x.title === title);
  const updated = !!item;
  if (!item){
    item = { id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: title };
    idx.unshift(item);
  }
  item.saved = Date.now();
  item.pos = pos || 0;
  item.words = text.trim().split(/\s+/).length;
  if (SafeStore.set(LIB_TEXT_PREFIX + item.id, text) && libraryWriteIndex()) return { ok: true, id: item.id, updated: updated };
  if (!updated){ idx.shift(); SafeStore.del(LIB_TEXT_PREFIX + item.id); }
  return { ok: false };
}

/** מוחק פריט (את הטקסט שלו ואת השורה ברשימה). */
function libraryRemove(id){
  libIndexCache = libraryIndex().filter(x => x.id !== id);
  SafeStore.del(LIB_TEXT_PREFIX + id);
  libraryWriteIndex();
  if (libraryCurrentId() === id) librarySetCurrent('');
}

/** זוכר את מיקום הקריאה בפריט הפתוח (נקרא אחרי הפסקה קצרה, לא בכל מילה). */
function libraryRememberPos(pos){
  const item = libraryFind(libraryCurrentId());
  if (!item || item.pos === pos) return;
  item.pos = pos;
  libraryWriteIndex();
}
