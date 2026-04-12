/**
 * games/anagram.js — Buchstaben sortieren (Anagramm)
 * Ein Wort ist durcheinander — bringe die Buchstaben in die richtige Reihenfolge
 * Tippe auf Buchstaben in der richtigen Reihenfolge
 */
const AnagramGame = {
  current: null, _lastConfig: null,
  _wordSets: {
    1: ['AUTO','KARTE','REISE','STRASSE','FAHRT','TANK','NACHT','WALD'],
    2: ['BURG','RITTER','SCHLOSS','KOENIG','TURM','HELD','RUESTUNG'],
    3: ['POOL','SONNE','WASSER','STRAND','SOMMER','FISCH','WELLE'],
    4: ['TENNIS','NETZ','BALL','SATZ','MATCH','PUNKT','AUFSCHLAG'],
    5: ['WUERFEL','ZAHL','SPIEL','SPASS','RUNDE','KNIFFEL','PUNKT'],
    6: ['FAHRRAD','HELM','WALD','NATUR','TOUR','BERG','BLUME'],
    7: ['BROT','KAESE','WEIN','SUPPE','MENU','GABEL','KUECHE'],
    8: ['FUSSBALL','TOR','JUBEL','SIEG','PASS','TRAINER','STADION'],
    9: ['KOFFER','REISE','PACKEN','FLUG','TICKET','HEIMWEG'],
    10:['FERIEN','ABSCHIED','URLAUB','ERINNERUNG','ZUHAUSE'],
  },
  start(config) {
    AnagramGame._lastConfig = config;
    const { worldId=1, onComplete } = config;
    const words = (this._wordSets[worldId]||this._wordSets[1]).sort(()=>Math.random()-0.5).slice(0,8);
    this.current = { words, index:0, results:[], errors:0, startTime:Date.now(), onComplete, selected:[] };
    this._nextWord();
  },
  _nextWord() {
    const c = this.current;
    if (c.index >= c.words.length) { this._showResult(); return; }
    const word = c.words[c.index];
    // Shuffle letters
    let shuffled;
    do { shuffled = word.split('').sort(()=>Math.random()-0.5); }
    while (shuffled.join('')===word && word.length>1);
    c.current = { word, shuffled, selected:[], remaining:[...shuffled] };
    this._renderWord();
  },
  _renderWord() {
    const c = this.current;
    const { word, selected, remaining } = c.current;
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Wort <b>${c.index+1}/${c.words.length}</b></span>
          <span>❌ ${c.errors} Fehler</span>
        </div>
        <div style="font-size:0.85rem;color:var(--text-mid);margin-bottom:14px">Tippe die Buchstaben in der richtigen Reihenfolge!</div>
        <!-- Answer slots -->
        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:18px;min-height:52px;flex-wrap:wrap">
          ${Array.from({length:word.length},(_,i)=>`
            <div style="width:44px;height:44px;border-radius:10px;
              background:${selected[i]?'linear-gradient(135deg,#27AE60,#1E8449)':'#F0F4F8'};
              border:2px solid ${selected[i]?'#1E8449':'#D0D8E4'};
              color:white;font-family:'Fredoka One',cursive;font-size:1.3rem;
              display:flex;align-items:center;justify-content:center">
              ${selected[i]||''}
            </div>`).join('')}
        </div>
        <!-- Shuffled letters -->
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
          ${remaining.map((ch,i)=>ch?`
            <button onclick="AnagramGame._pick(${i})"
              style="width:46px;height:46px;border-radius:12px;
                background:linear-gradient(135deg,#4A90D9,#2C75C0);
                color:white;font-family:'Fredoka One',cursive;font-size:1.4rem;border:none;cursor:pointer;
                box-shadow:0 4px 10px rgba(74,144,217,0.35);transition:transform 0.15s"
              onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform=''">
              ${ch}
            </button>`:`<div style="width:46px;height:46px;background:#F0F4F8;border-radius:12px;opacity:0.3"></div>`
          ).join('')}
        </div>
        <button onclick="AnagramGame._clear()" style="background:rgba(231,76,60,0.1);border:2px solid #E74C3C;
          color:#E74C3C;padding:8px 20px;border-radius:50px;cursor:pointer;font-weight:700;font-size:0.85rem">
          🔄 Zurücksetzen
        </button>
      </div>`;
  },
  _pick(i) {
    const c = this.current;
    const { word, selected, remaining } = c.current;
    const ch = remaining[i];
    if (!ch) return;
    remaining[i] = null;
    selected.push(ch);
    // Check if wrong
    const pos = selected.length-1;
    if (selected[pos] !== word[pos]) {
      c.errors++;
      setTimeout(()=>{ this._clear(); }, 600);
      // Flash red
      const btn = document.querySelectorAll('#game-area button')[i];
      if (btn) { btn.style.background='#E74C3C'; setTimeout(()=>{ this._renderWord(); },500); return; }
    }
    if (selected.length === word.length) {
      c.results.push(true);
      c.index++;
      setTimeout(()=>this._nextWord(), 600);
      return;
    }
    this._renderWord();
  },
  _clear() {
    const c = this.current;
    const { word, shuffled } = c.current;
    c.current.selected = [];
    c.current.remaining = [...shuffled];
    this._renderWord();
  },
  _showResult() {
    const c = this.current;
    const timeMs = Date.now()-c.startTime;
    const correct = c.results.filter(Boolean).length;
    const finalScore = State.calcFinalScore({rawScore:Math.round((correct/c.words.length)*100),timeMs,errors:c.errors,passed:correct>=5});
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🔤🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.words.length} Wörter!</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehler</span></div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="AnagramGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },
  _finish(s,t,e){ if(this.current?.onComplete) this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40}); }
};
window.AnagramGame = AnagramGame;
