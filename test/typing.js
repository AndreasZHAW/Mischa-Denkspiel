/**
 * games/typing.js — Tipp-Schnelligkeit
 * Tippe Wörter so schnell wie möglich ab — altersgerechte Wörter
 */

const TypingGame = {
  current: null,

  start(config) {
    const { ageGroup = 'einfach', worldId = 1, onComplete } = config;
    const words = this._getWords(ageGroup, worldId);
    this.current = {
      words, index: 0,
      input: '',
      correct: 0,
      errors: 0,
      startTime: null,
      wordStart: null,
      totalTime: 0,
      onComplete,
    };
    this._render();
  },

  _getWords(ageGroup, worldId) {
    const easy = {
      1: ['Auto','Weg','Zug','Karte','Fahrt','Strasse','Reise','Tank'],
      2: ['Burg','Tor','Turm','König','Schloss','Ritter','Held'],
      3: ['Pool','See','Sonne','Meer','Welle','Fisch','Strand'],
      4: ['Ball','Netz','Satz','Match','Sport','Spiel'],
      5: ['Sechs','Vier','Würfel','Zahl','Spiel','Punkt'],
      6: ['Rad','Weg','Natur','Wald','Blume','Baum'],
      7: ['Brot','Käse','Wein','Suppe','Essen','Koch'],
      8: ['Tor','Ball','Spiel','Team','Sieg','Jubel'],
      9: ['Pack','Heim','Koffer','Reise','Flug'],
      10:['Haus','Spass','Ende','Dank','Ferien'],
    };
    const hard = {
      1: ['Autobahn','Strassenkarte','Kilometer','Tankstelle','Reisepass'],
      2: ['Burggraben','Mittelalter','Schlosskeller','Ritterrüstung'],
      3: ['Schwimmbecken','Wasserrutsche','Sonnencreme','Badeurlaub'],
      4: ['Tennisplatz','Aufschlag','Rückhand','Punktestand'],
      5: ['Würfelbecher','Spielrunde','Highscore','Strategie'],
      6: ['Fahrradweg','Gebirgspass','Naturlandschaft','Radtour'],
      7: ['Speisekarte','Trinkgeld','Mittagessen','Weinkarte'],
      8: ['Elfmeter','Torwart','Torschuss','Meisterschaft'],
      9: ['Reisegepäck','Abflugzeit','Handgepäck','Passkontrolle'],
      10:['Heimreise','Ferienerinnerung','Abschiedsfoto','Urlaubsende'],
    };
    const base = (ageGroup==='sehr_einfach'||ageGroup==='einfach') ? easy : hard;
    const pool = base[worldId] || base[1];
    return [...pool].sort(()=>Math.random()-0.5).slice(0,10);
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:10px">
          <span>Wort <b>${c.index+1}/10</b></span>
          <span>✅ <b>${c.correct}</b> richtig</span>
          <span>❌ <b>${c.errors}</b> Fehler</span>
        </div>

        <!-- Progress -->
        <div style="background:#E8F5E9;border-radius:50px;height:10px;margin-bottom:16px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#27AE60,#1E8449);border-radius:50px;width:${c.index*10}%;transition:width 0.3s"></div>
        </div>

        <!-- Word to type -->
        <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border-radius:14px;padding:20px;margin-bottom:16px">
          <div id="type-word" style="font-family:'Fredoka One',cursive;font-size:2.2rem;color:var(--mountain-dark);letter-spacing:3px">
            ${this._coloredWord('', c.words[c.index]||'')}
          </div>
          <div style="font-size:0.8rem;color:var(--text-mid);margin-top:6px">Tippe dieses Wort!</div>
        </div>

        <!-- Input -->
        <input id="type-input" type="text" autocomplete="off" autocorrect="off" spellcheck="false"
          style="width:100%;padding:14px 18px;font-size:1.3rem;font-family:'Fredoka One',cursive;
            border:3px solid #E0E6EE;border-radius:14px;text-align:center;letter-spacing:2px;
            transition:border-color 0.2s"
          placeholder="Hier tippen..."
          oninput="TypingGame._onInput(this.value)"
          onkeydown="if(event.key==='Enter')TypingGame._submit()"/>

        <button class="btn btn-primary btn-full" style="margin-top:12px" onclick="TypingGame._submit()">
          Bestätigen ➜
        </button>
      </div>`;

    c.wordStart = Date.now();
    if (!c.startTime) c.startTime = Date.now();

    setTimeout(()=>{
      const inp=document.getElementById('type-input');
      if(inp) inp.focus();
    },100);
  },

  _coloredWord(typed, target) {
    if (!target) return '';
    return target.split('').map((ch, i) => {
      if (i >= typed.length) return `<span style="color:var(--mountain-dark)">${ch}</span>`;
      if (typed[i].toLowerCase()===ch.toLowerCase()) return `<span style="color:#27AE60">${ch}</span>`;
      return `<span style="color:#E74C3C">${ch}</span>`;
    }).join('');
  },

  _onInput(val) {
    const c = this.current;
    const target = c.words[c.index]||'';
    const wordEl = document.getElementById('type-word');
    const inputEl = document.getElementById('type-input');
    if (wordEl) wordEl.innerHTML = this._coloredWord(val, target);

    // Color input border
    if (inputEl) {
      if (val.length === 0) inputEl.style.borderColor='#E0E6EE';
      else if (target.toLowerCase().startsWith(val.toLowerCase())) inputEl.style.borderColor='#27AE60';
      else inputEl.style.borderColor='#E74C3C';
    }

    // Auto-submit if correct and complete
    if (val.toLowerCase()===target.toLowerCase()) {
      setTimeout(()=>this._submit(),100);
    }
  },

  _submit() {
    const c = this.current;
    const inp = document.getElementById('type-input');
    const val = inp?.value.trim() || '';
    const target = c.words[c.index]||'';
    const timeTaken = Date.now()-(c.wordStart||Date.now());
    c.totalTime += timeTaken;

    if (val.toLowerCase()===target.toLowerCase()) {
      c.correct++;
    } else {
      c.errors++;
      // Flash red
      if (inp) { inp.style.background='#FFF5F5'; setTimeout(()=>{if(inp)inp.style.background='';},400); }
    }

    c.index++;
    if (c.index >= c.words.length) {
      this._showResult();
    } else {
      this._render();
    }
  },

  _showResult() {
    const c = this.current;
    const timeMs = Date.now()-(c.startTime||Date.now());
    const accuracy = Math.round((c.correct/c.words.length)*100);
    const rawScore = accuracy;
    const finalScore = State.calcFinalScore({rawScore, timeMs, errors:c.errors, passed:c.correct>=6});

    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${c.correct>=8?'⌨️🏆':c.correct>=6?'⌨️😊':'⌨️😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          ${c.correct}/10 richtig getippt!
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🎯</div><b>${accuracy}%</b><br><span style="color:var(--text-mid)">Genauigkeit</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="TypingGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({rawScore:score,timeMs,errors,passed:score>=40});
  },
};

window.TypingGame = TypingGame;
