/* boot.js: הפעלת האתר: שחזור מצב שמור, טעינת קולות והצגת המסך הראשון.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- התחלה ---------------- */
$('#rateVal').textContent = rate.toFixed(2);
$('#leadVal').textContent = String(lead);
setFont(fontSize);

if (!synth){
  toast('הדפדפן הזה לא תומך בהקראה. כדאי לפתוח את הקובץ ב-Chrome.');
} else {
  loadVoices();
  synth.onvoiceschanged = loadVoices;
  setTimeout(loadVoices, 600);
  setTimeout(loadVoices, 1800);
}

const savedText = store.get('tts.text', '');
if (savedText.trim()) {
  if (!openRead(savedText, parseInt(store.get('tts.pos', '0'), 10) || 0)) showEdit();
} else {
  $('#editView').hidden = false;
  $('#src').focus();
}

// לבדיקות
window.__tts = {
  get words(){ return words; }, get sentences(){ return sentences; }, get paras(){ return paras; },
  get cur(){ return cur; }, get playing(){ return playing; }, get rate(){ return rate; },
  parse, openRead
};
