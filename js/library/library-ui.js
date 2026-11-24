/* library-ui.js: חלון "הטקסטים השמורים שלי" וחלון שמירה בשם.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** תאריך קצר בעברית. */
function formatDate(ts){ return ts ? new Date(ts).toLocaleDateString('he-IL') : ''; }

/** שומר את הטקסט שמוצג עכשיו בשם title. מחזיר true אם נשמר. */
function saveCurrentText(title){
  const name = title.trim();
  if (!name){ toast('כדאי לתת שם, למשל "הארי פוטר, פרק 1".'); return false; }
  const r = librarySave(name, currentTextAsString(), cur);
  if (!r.ok){ toast('אין מקום לשמור בדפדפן. אפשר למחוק טקסט ישן מהרשימה.'); return false; }
  librarySetCurrent(r.id);
  refreshTextTitle();
  toast(r.updated ? 'הטקסט "' + name + '" עודכן.' : 'הטקסט נשמר בשם "' + name + '".');
  return true;
}

/** פותח טקסט שמור וממשיך מהמקום שבו הפסקת. */
function openLibraryItem(id){
  const item = libraryFind(id), text = libraryText(id);
  if (!item || !text){ toast('הטקסט הזה לא נמצא במכשיר.'); return; }
  pause();
  closeDialog('library');
  if (!openRead(text, item.pos)) return;
  if (!store.set('tts.text', text)) store.del('tts.text');
  store.set('tts.pos', String(item.pos || 0));
  librarySetCurrent(id);
  refreshTextTitle();
}

/** בונה שורה של טקסט שמור: שם, פרטים וכפתורים. */
function buildLibraryRow(item){
  const row = DomBuild.make('div', 'libItem');
  const title = DomBuild.make('div', 'libTitle', item.title);
  title.dir = 'auto';
  row.appendChild(title);
  const pct = item.words > 1 ? Math.round(((item.pos || 0) / (item.words - 1)) * 100) : 0;
  row.appendChild(DomBuild.make('div', 'libMeta',
    item.words.toLocaleString('he-IL') + ' מילים. נקראו ' + pct + '%. נשמר ב-' + formatDate(item.saved)));
  const btns = DomBuild.make('div', 'libBtns');
  btns.appendChild(DomBuild.button('פתיחה והמשך קריאה', 'small primary', () => openLibraryItem(item.id)));
  btns.appendChild(DomBuild.confirmButton('מחיקה', 'בטוחה? מחקי', 'small', () => { libraryRemove(item.id); renderLibraryList(); }));
  row.appendChild(btns);
  return row;
}

/** מצייר מחדש את רשימת הטקסטים השמורים. */
function renderLibraryList(){
  const box = $('#libraryList');
  box.textContent = '';
  const idx = libraryIndex();
  $('#libraryEmpty').hidden = idx.length > 0;
  idx.forEach(item => box.appendChild(buildLibraryRow(item)));
}

/** פותח את חלון הטקסטים השמורים (ועוצר הקראה, אם היא רצה). */
function openLibrary(){
  if (playing) pause();
  renderLibraryList();
  openDialog('library', '#libraryClose');
}

/** פותח את חלון השמירה בשם. אם הטקסט כבר שמור, השם שלו מופיע בתיבה. */
function openSaveDialog(){
  const item = libraryFind(libraryCurrentId());
  $('#saveTitle').value = item ? item.title : '';
  openDialog('saveText', '#saveTitle');
}
