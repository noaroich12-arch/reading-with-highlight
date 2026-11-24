/* library-rename.js: כותרת הטקסט: שינוי שם בחלק העליון של הקריאה ומתוך "המילון שלי".
   שינוי שם מעדכן גם את הספרייה וגם את קיבוץ המילים במילון שלי.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** מציג בתיבת הכותרת שבראש הקריאה את שם הטקסט הפתוח (או ריק אם הוא לא שמור). */
function refreshTextTitle(){
  const item = libraryFind(libraryCurrentId());
  $('#textTitle').value = item ? item.title : '';
}

/** משנה שם של טקסט, בספרייה ובמילון שלי. מחזיר true אם הצליח. */
function renameText(oldTitle, newTitle){
  const name = newTitle.trim();
  if (!name){ toast('כדאי לכתוב כותרת.'); return false; }
  if (name === oldTitle) return true;
  const idx = libraryIndex();
  if (idx.some(x => x.title === name)){ toast('כבר יש טקסט בשם הזה.'); return false; }
  const item = idx.find(x => x.title === oldTitle);
  if (item){
    item.title = name;
    if (!libraryWriteIndex()){ item.title = oldTitle; toast('אין מקום לשמור בדפדפן.'); return false; }
  }
  pocketRenameSrc(oldTitle, name);
  refreshTextTitle();
  return true;
}

/** נקרא כשמסיימים לכתוב בתיבת הכותרת: משנה שם לטקסט שמור, או שומר טקסט חדש בשם הזה. */
function commitTextTitle(){
  const value = $('#textTitle').value.trim();
  const item = libraryFind(libraryCurrentId());
  if (item){ if (!value || !renameText(item.title, value)) refreshTextTitle(); }
  else if (value && !saveCurrentText(value)) refreshTextTitle();
}
