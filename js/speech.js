/* speech.js: ההקראה עצמה: הפעלה, עצירה והמשך.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- הקראה ---------------- */
/** עוצר הקראה: מבטל טיימרים ואת ההקראה הפתוחה, ומחליף את מזהה הדור כדי שאירועים ישנים יתעלמו. */
function halt(){
  gen++;
  clearInterval(estTimer); estTimer = null;
  clearTimeout(fbTimer); clearTimeout(watchT);
  try { synth.cancel(); } catch(e){}
}

/** מפתח שמירה של מהירות הדיבור: הקול והקצב יחד (קול מדבר לא באותו יחס בכל קצב). */
function speedKey(){ return (voice ? voice.name : '') + '@' + rate; }

/** כמה תווים בשנייה הקול הנוכחי מדבר בקצב הנוכחי (נלמד מהקראות קודמות), לצורך הערכת ההדגשה. */
function getCps(){ return cpsMap[speedKey()] || 14.5 * rate; }

/** לומד מהירות דיבור מהקראה שהסתיימה: text הוקרא תוך secs שניות. הממוצע נשמר לקול ולקצב הנוכחיים. */
function learnSpeed(text, secs){
  if (text.length < 15 || secs < 0.5) return;
  const measured = text.length / secs;
  if (measured < 5 * rate || measured > 40 * rate) return;
  const key = speedKey(), old = cpsMap[key];
  cpsMap[key] = old ? old * 0.5 + measured * 0.5 : measured;
  store.set('tts.cps', JSON.stringify(cpsMap));
}

/** בונה את טקסט ההקראה מהמילה idx עד סוף המשפט s, ושומר באיזה מקום בטקסט מתחילה כל מילה (offs). מילה בלי אותיות מוקראת כפסיק */
function buildSpeechText(idx, s){
  let text = '';
  const offs = [];
  for (let i = idx; i <= s.last; i++){
    if (i > idx) text += ' ';
    offs.push(text.length);
    const t = words[i].t;
    text += /[A-Za-z0-9À-ɏ]/.test(t) ? t : ',';
  }
  return { text, offs };
}

/** המילה (יחסית להתחלת ההקראה) שבה נמצא התו c בטקסט ההקראה, בחיפוש בינארי על מקומות ההתחלה offs */
function wordIndexAtChar(offs, c){
  let lo = 0, hi = offs.length - 1;
  while (lo < hi){
    const mid = (lo + hi + 1) >> 1;
    if (offs[mid] <= c) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** הערכת מיקום ההדגשה לפי קצב הדיבור, לקולות שלא מדווחים על מילים. ses הוא מצב ההקראה הנוכחית */
function startEstimate(ses){
  if (ses.my !== gen || ses.gotBoundary) return;
  if (voice) { voiceHasBoundary[voice.name] = false; updateVoiceNote(); }
  clearInterval(estTimer);
  const my = ses.my, idx = ses.idx, s = ses.s, text = ses.text;
  const n = ses.offs.length;
  const cum = [];
  let total = 0;
  for (let k = 0; k < n; k++){
    const t = words[idx + k].t;
    cum.push(total);
    total += t.length + 1.2 + (/[,;:]["'”’)\]]*$/.test(t) ? 3 : 0) + (END_RE.test(t) ? 4 : 0);
  }
  const dur = (text.length / getCps()) * 1000;
  let k = 0;
  estTimer = setInterval(() => {
    if (my !== gen){ clearInterval(estTimer); return; }
    const el = performance.now() - ses.tStart;
    const pos = (el / dur) * total;
    while (k < n - 1 && cum[k + 1] <= pos) k++;
    const t = clamp(idx + k + (ses.lead === undefined ? lead : ses.lead), idx, s.last);
    if (t !== cur) setCur(t);
  }, 40);
}

/** ההקראה התחילה: מבטל את שעון העצר, ומתחיל הערכת מיקום אם הקול לא מדווח על מילים (או ממתין לדיווח) */
function onSpeechStart(ses){
  if (ses.my !== gen) return;
  ses.started = true; retries = 0;
  clearTimeout(watchT);
  ses.tStart = performance.now();
  if (voice && voiceHasBoundary[voice.name] === false) startEstimate(ses);
  else if (voice && voiceHasBoundary[voice.name] === undefined && !voice.localService) startEstimate(ses);
  else fbTimer = setTimeout(() => startEstimate(ses), 700);
}

/** הקול דיווח על מילה: מזיז את ההדגשה אליה ומבטל את ההערכה */
function onSpeechBoundary(ses, e){
  if (ses.my !== gen) return;
  if (e.name && e.name !== 'word') return;
  if (!ses.gotBoundary){
    ses.gotBoundary = true;
    clearInterval(estTimer); estTimer = null; clearTimeout(fbTimer);
    if (voice){ voiceHasBoundary[voice.name] = true; updateVoiceNote(); }
  }
  const k = wordIndexAtChar(ses.offs, e.charIndex || 0);
  const t = clamp(ses.idx + k + (ses.lead === undefined ? lead : ses.lead), ses.idx, ses.s.last);
  if (t !== cur) setCur(t);
}

/** המשפט הוקרא עד הסוף: לומד כמה מהר הקול באמת מדבר (להערכה מדויקת יותר), וממשיך למשפט הבא */
function onSpeechEnd(ses){
  if (ses.my !== gen) return;
  if (!ses.gotBoundary && ses.started && voice) learnSpeed(ses.text, (performance.now() - ses.tStart) / 1000);
  if (!playing) return;
  speakFrom(ses.s.last + 1);
}

/** שגיאת הקראה: קול מהרשת שנכשל מוחלף בקול מקומי, וכל שגיאה אחרת עוצרת עם הודעה */
function onSpeechError(ses, e){
  if (ses.my !== gen) return;
  if (e.error === 'interrupted' || e.error === 'canceled') return;
  const local = voices.find(v => v.localService);
  if (voice && !voice.localService && local){
    voice = local;
    $('#voiceSel').value = voice.name;
    store.set('tts.voice', voice.name);
    updateVoiceNote();
    toast('הקול הקודם לא הגיב, עברתי לקול אחר שנמצא במחשב.');
    speakFrom(ses.idx);
    return;
  }
  pause();
  toast('ההקראה נעצרה. אפשר לנסות קול אחר בהגדרות.');
}

/** שעון עצר: אם ההקראה לא התחילה תוך 5 שניות, מנסים שוב (עד פעמיים) ואז עוצרים עם הודעה */
function armWatchdog(ses){
  watchT = setTimeout(() => {
    if (ses.my !== gen || ses.started) return;
    if (retries < 2){ retries++; speakFrom(ses.idx); }
    else { pause(); toast('הקול לא מתחיל. אפשר לנסות קול אחר בהגדרות.'); }
  }, 5000);
}

/** יוצר הקראה של טקסט אחד עם הקול והקצב הנוכחיים. */
function makeUtterance(text){
  const u = new SpeechSynthesisUtterance(text);
  if (voice){ u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
  u.rate = rate; u.pitch = 1; u.volume = 1;
  return u;
}

/** מקריא מהמילה idx עד סוף המשפט שלה, ומסמן את המילים תוך כדי. בסוף המשפט ממשיך לבא (אם עדיין מקריאים).
    קול שלא הוכח שהוא מדווח על מילים מוקרא בקטעים לפי פסיקים (speech-chunks.js), כדי שהסימון יסתנכרן בכל קטע. */
function speakFrom(idx){
  halt();
  clearTimeout(queueT);
  if (idx >= words.length){ finish(); return; }
  setCur(idx);
  const my = gen;
  const s = sentences[words[idx].s];
  try { if (synth.paused) synth.resume(); } catch(e){}
  if (!voice || voiceHasBoundary[voice.name] !== true){ speakChunks(idx, s, my); return; }
  const { text, offs } = buildSpeechText(idx, s);
  const u = makeUtterance(text);
  utterRef = u;

  const ses = { my, idx, s, text, offs, started: false, gotBoundary: false, tStart: 0 };
  u.onstart = () => onSpeechStart(ses);
  u.onboundary = e => onSpeechBoundary(ses, e);
  u.onend = () => onSpeechEnd(ses);
  u.onerror = e => onSpeechError(ses, e);
  armWatchdog(ses);
  synth.speak(u);
}


/** סיום הטקסט: עוצר, מעדכן את הכפתור ומודיע. */
function finish(){
  playing = false; finished = true;
  halt();
  updatePlayBtn();
  toast('סיימנו את הטקסט.');
}

/** מתחיל או ממשיך הקראה מהמילה הנוכחית (ובסוף הטקסט מתחיל מההתחלה). */
function play(){
  if (!words.length) return;
  if (!synth){ toast('הדפדפן הזה לא תומך בהקראה. כדאי לפתוח ב-Chrome.'); return; }
  if (finished){ finished = false; setCur(0); }
  playing = true; retries = 0;
  updatePlayBtn();
  speakFrom(cur);
}

/** עוצר הקראה ושומר את המיקום. */
function pause(){
  playing = false;
  clearTimeout(queueT);
  halt();
  updatePlayBtn();
  store.set('tts.pos', String(cur));
}

/** הפעלה אם עוצרים, ועצירה אם מקריאים. */
function toggle(){ playing ? pause() : play(); }

/** מעדכן את כפתור ההפעלה והעצירה: סמל, טקסט ותווית לקורא מסך. */
function updatePlayBtn(){
  $('#icPlay').toggleAttribute('hidden', playing);
  $('#icPause').toggleAttribute('hidden', !playing);
  $('#playTxt').textContent = playing ? 'עצירה' : 'הפעלה';
  $('#playBtn').setAttribute('aria-label', playing ? 'עצירה' : 'הפעלה');
}
