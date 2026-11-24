/* screens.js: מעבר בין מסכים, גודל טקסט והודעות.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** קובע גודל טקסט (20 עד 72 פיקסלים), שומר ומעדכן את התצוגה. */
function setFont(px){
  fontSize = clamp(px, 20, 72);
  document.documentElement.style.setProperty('--fs', fontSize + 'px');
  $('#sizeVal').textContent = fontSize + ' px';
  store.set('tts.size', String(fontSize));
  if (curWordEl) setTimeout(() => follow(curWordEl, true), 30);
}

/* ---------------- חלונות קופצים ---------------- */
const dialogRelease = {};
/* פותח חלון: הפוקוס ננעל בתוכו, ו-Esc סוגר. focusSel הוא הרכיב שיקבל את הפוקוס ראשון */
function openDialog(id, focusSel){
  const el = $('#' + id);
  el.hidden = false;
  dialogRelease[id] = A11y.trapFocus(el, () => closeDialog(id));
  if (focusSel) $(focusSel).focus();
}
/* סוגר חלון ומחזיר את הפוקוס לכפתור שפתח אותו */
function closeDialog(id){
  $('#' + id).hidden = true;
  if (dialogRelease[id]){ dialogRelease[id](); dialogRelease[id] = null; }
}

/* ---------------- מסכים ---------------- */
/** מציג את מסך ההדבקה: עוצר הקראה ומנקה את תיבת הטקסט. */
function showEdit(){
  pause();
  closeTextEdit();   // אם עריכת טקסט הייתה פתוחה, סוגרים אותה
  $('#readView').hidden = true;
  setReading(false);
  $('#editView').hidden = false;
  $('#src').value = '';
  $('#backBtn').hidden = !words.length;
  updateCount();
  $('#src').focus();
  window.scrollTo(0, 0);
}

/** פותח את מסך הקריאה עם הטקסט: מפרק, מצייר ומסמן את המילה pos. מחזיר false אם אין טקסט. */
function openRead(text, pos, instant){
  parse(text);
  if (!words.length){ toast('לא נמצא טקסט. אפשר להדביק שוב.'); return false; }
  render();
  refreshTextTitle();   // כותרת הטקסט בראש הקריאה
  $('#editView').hidden = true;
  $('#readView').hidden = false;
  setReading(true);
  playing = false; finished = false;
  updatePlayBtn();
  cur = 0;
  setCur(clamp(pos || 0, 0, words.length - 1), { noScroll: true });
  window.scrollTo(0, 0);
  $('#page').scrollTop = 0;
  requestAnimationFrame(() => { if (pos) follow(curWordEl, true); });
  return true;
}

/** מעדכן את מונה המילים בתיבת ההדבקה. */
function updateCount(){
  const t = $('#src').value.trim();
  $('#count').textContent = t ? (t.split(/\s+/).length.toLocaleString('he-IL') + ' מילים') : '';
}

let countT = null;
/** הודעה קצרה שנעלמת מעצמה. */
function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, 4500);
}
