/* pocket-ui.js: חלון "המילון שלי" (המילים החדשות, לפי טקסט) וכפתור ההוספה בתוך חלון המילון.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- כפתור בתוך חלון המילון ---------------- */
/** מעדכן את כפתור הכיס שבחלון המילון לפי מצב המילה שמוצגת. */
function refreshDictPocket(){
  const e = pocketEntry(pocketKey(dictWordNow));
  const btn = $('#dictPocketBtn'), note = $('#dictPocketNote');
  btn.hidden = !dictWordNow;
  if (!e){ btn.textContent = 'הוסיפי למילון שלי'; note.textContent = ''; }
  else if (e.st === 'new'){ btn.textContent = 'זכרתי אותה (להוריד סימון)'; note.textContent = 'המילה במילון שלי ומסומנת בטקסט.'; }
  else { btn.textContent = 'לא זכרתי (לסמן שוב)'; note.textContent = 'סימנת שאת זוכרת את המילה.'; }
}

/** לחיצה על כפתור הכיס בחלון המילון: מוסיף את המילה, או מחליף בין "זכורה" ל"עוד לא זכורה". */
function onDictPocketClick(){
  const key = pocketKey(dictWordNow);
  const e = pocketEntry(key);
  if (!e){
    if (!addWordToMyDictionary(dictWordNow, dictHeNow)) return;
    toast('נוספה למילון שלי: ' + dictWordNow + (dictHeNow ? ' = ' + dictHeNow : ''));
    if (!dictHeNow) fillTranslation(key, false);   // התרגום עוד לא הגיע: משלימים אותו
  } else {
    pocketSetStatus(key, e.st === 'new' ? 'known' : 'new');
  }
  applyPocketMarks();
  refreshDictPocket();
}

/* ---------------- חלון מילון הכיס ---------------- */
/** בונה שורה של מילה אחת: המילה, התרגום, והכפתורים. */
function buildPocketRow(e){
  const row = DomBuild.make('div', 'pocketItem');
  const word = DomBuild.make('div', 'pWord', e.w);
  word.lang = 'en'; word.dir = 'ltr';
  row.appendChild(word);
  row.appendChild(DomBuild.make('div', 'pHe', e.he || 'אין תרגום שמור. אפשר לפתוח את המילה במילון בזמן קריאה.'));
  const btns = DomBuild.make('div', 'libBtns');
  btns.appendChild(DomBuild.button('שמעי', 'small', () => speakSingleWord(e.w)));
  if (!e.he) btns.appendChild(DomBuild.button('תרגום', 'small', () => fillTranslation(e.w, true)));
  btns.appendChild(DomBuild.button(e.st === 'new' ? 'זכרתי אותה' : 'לא זכרתי', 'small', () => {
    pocketSetStatus(e.w, e.st === 'new' ? 'known' : 'new');
    applyPocketMarks(); renderPocketList();
  }));
  btns.appendChild(DomBuild.confirmButton('מחיקה', 'בטוחה? מחקי', 'small', () => {
    pocketRemove(e.w); applyPocketMarks(); renderPocketList();
  }));
  row.appendChild(btns);
  return row;
}

/** מחליף את כותרת הקבוצה בתיבת כתיבה עם כפתור שמירה (שינוי הכותרת מעדכן גם את הספרייה). */
function startGroupRename(head, group){
  head.textContent = '';
  const inp = DomBuild.make('input', 'groupInput');
  inp.type = 'text'; inp.maxLength = 60; inp.value = group.src;
  inp.setAttribute('aria-label', 'כותרת חדשה לטקסט');
  head.appendChild(inp);
  head.appendChild(DomBuild.button('שמירה', 'small primary', () => { if (renameText(group.src, inp.value)) renderPocketList(); }));
  inp.focus();
}

/** מוסיף לרשימה קבוצה אחת: כותרת עם שם הטקסט, כפתור העתקה, והמילים. */
function addPocketGroup(box, group){
  const head = DomBuild.make('div', 'pocketGroupHead');
  const title = DomBuild.make('h3', 'pocketHead', group.src + ' (' + group.items.length + ')');
  title.dir = 'auto';
  head.appendChild(title);
  head.appendChild(DomBuild.button('העתקה לוורד', 'small', () => copyPocketGroups([group])));
  head.appendChild(DomBuild.button('שינוי כותרת', 'small', () => startGroupRename(head, group)));
  box.appendChild(head);
  group.items.forEach(e => box.appendChild(buildPocketRow(e)));
}

/** מצייר מחדש את רשימת המילון שלי, מקובצת לפי הטקסט שמהם נלקחו המילים. */
function renderPocketList(){
  const box = $('#pocketList');
  box.textContent = '';
  const groups = pocketGroups();
  $('#pocketEmpty').hidden = groups.length > 0;
  $('#pocketCopyAll').hidden = groups.length === 0;
  groups.forEach(g => addPocketGroup(box, g));
}

/** פותח את חלון מילון הכיס (ועוצר הקראה, אם היא רצה). */
function openPocket(){
  if (playing) pause();
  renderPocketList();
  openDialog('pocket', '#pocketClose');
  fillAllMissingTranslations();
}
