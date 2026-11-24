/* events.js: חיבור כל הלחיצות והמקשים.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- חיבור אירועים ---------------- */
$('#src').addEventListener('input', () => { clearTimeout(countT); countT = setTimeout(updateCount, 250); });

$('#startBtn').addEventListener('click', () => {
  const t = $('#src').value;
  if (!t.trim()){ toast('כדאי להדביק קודם טקסט.'); $('#src').focus(); return; }
  if (openRead(t, 0)){
    if (!store.set('tts.text', t)){
      store.del('tts.text');
      toast('הטקסט ארוך מדי לשמירה לפעם הבאה, אבל הוא עובד כרגיל עכשיו.');
    }
    store.set('tts.pos', '0');
  }
});
$('#clearBtn').addEventListener('click', () => { $('#src').value = ''; updateCount(); $('#src').focus(); });
$('#backBtn').addEventListener('click', () => {
  $('#editView').hidden = true;
  $('#readView').hidden = false;
  setReading(true);
  if (curWordEl) follow(curWordEl, true);
});
$('#newBtn').addEventListener('click', showEdit);

$('#playBtn').addEventListener('click', toggle);
$('#wNext').addEventListener('click', wordNext);
$('#wPrev').addEventListener('click', wordPrev);
$('#sNext').addEventListener('click', sentNext);
$('#sPrev').addEventListener('click', sentPrev);
$('#pNext').addEventListener('click', paraNext);
$('#pPrev').addEventListener('click', paraPrev);
$('#rateDown').addEventListener('click', () => setRate(rate - 0.05));
$('#rateUp').addEventListener('click', () => setRate(rate + 0.05));
$('#restartBtn').addEventListener('click', () => go(0));
$('#leadDown').addEventListener('click', () => setLead(lead - 1));
$('#leadUp').addEventListener('click', () => setLead(lead + 1));
$('#moreBtn').addEventListener('click', () => {
  const c = $('#controls');
  const open = c.classList.toggle('open');
  $('#moreBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
  $('#moreBtn').textContent = open ? 'סגירה ▼' : 'מהירות, מילון ועוד ▲';
  if (curWordEl) setTimeout(() => follow(curWordEl, true), 30);
});
$('#dictBtn').addEventListener('click', openDict);
$('#dictClose').addEventListener('click', () => closeDialog('dict'));
$('#dictSay').addEventListener('click', sayWord);
$('#dict').addEventListener('click', e => { if (e.target.id === 'dict') closeDialog('dict'); });

// לחיצה על מילה מעבירה אליה את המיקום
$('#text').addEventListener('click', e => {
  const w = e.target.closest('.w');
  if (!w) return;
  if (String(window.getSelection()).length) return;
  go(parseInt(w.dataset.i, 10));
});

// הגדרות
$('#setBtn').addEventListener('click', () => openDialog('settings', '#closeSet'));
$('#closeSet').addEventListener('click', () => closeDialog('settings'));
$('#settings').addEventListener('click', e => { if (e.target.id === 'settings') closeDialog('settings'); });
$('#voiceSel').addEventListener('change', e => {
  voice = voices.find(v => v.name === e.target.value) || voice;
  store.set('tts.voice', voice.name);
  updateVoiceNote();
  if (playing){ halt(); speakFrom(cur); }
});
$('#sizeDown').addEventListener('click', () => setFont(fontSize - 2));
$('#sizeUp').addEventListener('click', () => setFont(fontSize + 2));
$('#fontDown').addEventListener('click', () => setFont(fontSize - 4));
$('#fontUp').addEventListener('click', () => setFont(fontSize + 4));
$('#testBtn').addEventListener('click', () => {
  if (!synth) return;
  if (playing) pause();
  halt();
  const u = new SpeechSynthesisUtterance('Hello. This is how I sound at this speed.');
  utterRef = u;
  if (voice){ u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
  u.rate = rate;
  synth.speak(u);
});

// מקלדת
document.addEventListener('keydown', e => {
  if ($('#readView').hidden) {
    if ($('#editView').hidden === false && e.ctrlKey && e.key === 'Enter') $('#startBtn').click();
    return;
  }
  if (!$('#settings').hidden){ if (e.key === 'Escape') closeDialog('settings'); return; }
  if (!$('#dict').hidden){ if (e.key === 'Escape') closeDialog('dict'); return; }
  if ($('#readView').classList.contains('editing')) return;     // עריכת טקסט פתוחה: בלי קיצורי ניווט
  if (document.querySelector('.sheet:not([hidden])')) return;   // חלון ספרייה או מילון כיס פתוח: בלי קיצורי ניווט
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  switch (e.key){
    case ' ': if (tag === 'button') return; e.preventDefault(); toggle(); break;
    case 'ArrowRight': e.preventDefault(); wordNext(); break;
    case 'ArrowLeft':  e.preventDefault(); wordPrev(); break;
    case 'ArrowDown':  e.preventDefault(); sentNext(); break;
    case 'ArrowUp':    e.preventDefault(); sentPrev(); break;
    case 'PageDown':   e.preventDefault(); paraNext(); break;
    case 'PageUp':     e.preventDefault(); paraPrev(); break;
  }
});

window.addEventListener('beforeunload', () => {
  store.set('tts.pos', String(cur));
  try { synth.cancel(); } catch(e){}
});
