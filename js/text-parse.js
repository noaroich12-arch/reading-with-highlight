/* text-parse.js: פירוק הטקסט למילים, משפטים ופסקאות, ובניית התצוגה.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- פירוק הטקסט ---------------- */
const TITLES = new Set(['mr','mrs','ms','dr','prof','sr','jr','st','vs','mt','fig','no','gen','gov','hon','rev','sen','rep','lt','col','sgt','capt','cf','inc','ltd','co','dept','approx']);
const END_RE = /[.!?…]+["'”’)\]]*$/;

/** האם המילה tok מסיימת משפט. לא מסיימים אחרי ראשי תיבות וכינויים (Mr.) או כשהמילה הבאה באות קטנה. */
function isSentenceEnd(tok, next){
  if (!END_RE.test(tok)) return false;
  const bare = tok.replace(/["'”’)\]]+$/, '');
  const core = bare.replace(/^[("'“‘\[]+/, '');
  if (/^[A-Za-z]\.$/.test(core)) return false;               // ראשי תיבות של שם: J.
  if (/^([A-Za-z]\.){2,}$/.test(core)) return false;          // U.S.
  if (TITLES.has(core.replace(/\.$/, '').toLowerCase()) && core.endsWith('.')) return false;
  if (next && /^[("'“‘\[]*[a-z]/.test(next)) return false;    // המילה הבאה באות קטנה
  return true;
}

/** מפרק טקסט למילים, משפטים ופסקאות (משפט ארוך מאוד נחתך בנקודה טבעית) ושומר אותם במשתני המצב. */
function parse(text){
  words = []; sentences = []; paras = [];
  const clean = text.replace(/[​-‏‪-‮﻿­]/g, '').replace(/\r/g, '');
  for (const line of clean.split(/\n+/)){
    const toks = line.trim().split(/\s+/).filter(Boolean);
    if (!toks.length) continue;
    const pIdx = paras.length;
    const para = { first: words.length, last: 0, el: null };
    let sFirst = words.length, count = 0;
    for (let k = 0; k < toks.length; k++){
      const tok = toks[k];
      words.push({ t: tok, s: sentences.length, p: pIdx, el: null });
      count++;
      let end = false;
      if (k === toks.length - 1) end = true;
      else if (isSentenceEnd(tok, toks[k+1])) end = true;
      else if (count >= 60 || (count >= 35 && /[,;:]["'”’)\]]*$/.test(tok))) end = true;   // משפט ארוך מאוד נחתך בנקודה טבעית
      if (end){
        sentences.push({ first: sFirst, last: words.length - 1, p: pIdx, el: null });
        sFirst = words.length; count = 0;
      }
    }
    para.last = words.length - 1;
    paras.push(para);
  }
}

/** מצייר את הטקסט במסך: פסקה, משפט ומילה בתוך אלמנטים נפרדים, ושומר הפניה לכל אלמנט. */
function render(){
  const root = $('#text');
  root.textContent = '';
  const frag = document.createDocumentFragment();
  for (const pa of paras){
    const p = document.createElement('p');
    p.className = 'para';
    const sFrom = words[pa.first].s, sTo = words[pa.last].s;
    for (let si = sFrom; si <= sTo; si++){
      const s = sentences[si];
      const sp = document.createElement('span');
      sp.className = 's';
      for (let i = s.first; i <= s.last; i++){
        const w = document.createElement('span');
        w.className = 'w';
        w.dataset.i = i;
        w.textContent = words[i].t;
        words[i].el = w;
        sp.appendChild(w);
        if (i < s.last) sp.appendChild(document.createTextNode(' '));
      }
      s.el = sp;
      p.appendChild(sp);
      p.appendChild(document.createTextNode(' '));
    }
    pa.el = p;
    frag.appendChild(p);
  }
  root.appendChild(frag);
  applyPocketMarks();   // מסמן מילים ממילון הכיס
  applyNoteMarks();     // מסמן מילים שיש עליהן הערה
  curWordEl = null; curSentEl = null; curSent = -1;
}
