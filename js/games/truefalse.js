/**
 * games/truefalse.js — Wahr oder Falsch?
 * 10 Aussagen, schnell entscheiden ob Wahr ✅ oder Falsch ❌
 * Weltspezifische Fragen, altersangepasst
 */

const TrueFalseGame = {
  current: null,
  _lastConfig: null,

  _questions: {
    1: [ // Anreise
      { q:'Frankreich liegt in Europa.', a:true },
      { q:'Die Autobahn hat ein Tempolimit von 50 km/h.', a:false },
      { q:'Paris ist die Hauptstadt von Frankreich.', a:true },
      { q:'Der Eiffelturm steht in Lyon.', a:false },
      { q:'Man braucht einen Reisepass für Frankreich wenn man aus der Schweiz kommt.', a:false },
      { q:'Frankreich grenzt an die Schweiz.', a:true },
      { q:'1 Stunde = 60 Minuten.', a:true },
      { q:'100 km/h ist schneller als 80 km/h.', a:true },
      { q:'Die Schweiz ist ein Teil von Frankreich.', a:false },
      { q:'Ein Auto hat 4 Räder.', a:true },
    ],
    2: [ // Schloss
      { q:'Ein Ritter trägt eine Rüstung.', a:true },
      { q:'Schlösser wurden im Weltraum gebaut.', a:false },
      { q:'Ein Burggraben ist mit Wasser gefüllt.', a:true },
      { q:'Könige wohnen in Schlössern.', a:true },
      { q:'Ein Schwert ist ein Musikinstrument.', a:false },
      { q:'Das Mittelalter war vor 500 Jahren.', a:true },
      { q:'Drachen können fliegen.', a:false }, // in der realen Welt
      { q:'Ein Schloss hat meistens viele Zimmer.', a:true },
      { q:'Ritter hatten meistens Pferde.', a:true },
      { q:'Eine Zugbrücke kann hochgezogen werden.', a:true },
    ],
    3: [ // Pool
      { q:'Wasser ist nass.', a:true },
      { q:'Man sollte nach dem Essen sofort schwimmen.', a:false },
      { q:'Ein Schwimmbecken ist mit Wasser gefüllt.', a:true },
      { q:'Die Sonne ist heiß.', a:true },
      { q:'Man kann im Pool Ski fahren.', a:false },
      { q:'Sonnencreme schützt vor Sonnenbrand.', a:true },
      { q:'Fische können schwimmen.', a:true },
      { q:'Ein Hai ist ein Hausschwein.', a:false },
      { q:'Im Sommer ist es wärmer als im Winter.', a:true },
      { q:'33°C ist kälter als 20°C.', a:false },
    ],
    4: [ // Tennis
      { q:'Ein Tennisball ist rund.', a:true },
      { q:'Tennis wird mit einem Fussball gespielt.', a:false },
      { q:'Das Netz trennt die beiden Seiten.', a:true },
      { q:'Wimbledon ist ein bekanntes Tennis-Turnier.', a:true },
      { q:'Man kann Tennis alleine spielen.', a:false }, // braucht min. 2
      { q:'Ein Tennis-Match kann mehrere Stunden dauern.', a:true },
      { q:'Der erste Punkt heisst "15".', a:true },
      { q:'Ein Ass ist ein Fehler beim Aufschlag.', a:false },
      { q:'Roger Federer ist ein bekannter Tennisspieler.', a:true },
      { q:'Beim Tennis darf man den Ball mit dem Fuss schlagen.', a:false },
    ],
    5: [ // Kniffel
      { q:'Ein normaler Würfel hat 6 Seiten.', a:true },
      { q:'Die Augen eines Würfels gehen von 1 bis 7.', a:false },
      { q:'Drei gleiche Zahlen nennt man "Drilling".', a:true },
      { q:'Beim Kniffel darf man 3 mal würfeln.', a:true },
      { q:'Fünf gleiche Zahlen ist ein Kniffel.', a:true },
      { q:'Man kann mit einem Würfel 8 bekommen.', a:false },
      { q:'1+2+3+4+5+6 = 21.', a:true },
      { q:'Würfel sind immer dreieckig.', a:false },
      { q:'Beim Kniffel gibt es einen Highscore.', a:true },
      { q:'Man braucht 5 Würfel für Kniffel.', a:true },
    ],
    6: [ // Fahrrad
      { q:'Ein Fahrrad hat 2 Räder.', a:true },
      { q:'Radfahren ist gut für die Gesundheit.', a:true },
      { q:'Man braucht keinen Helm beim Radfahren.', a:false },
      { q:'Fahrräder haben einen Motor.', a:false },
      { q:'Bergauf radeln ist anstrengender als bergab.', a:true },
      { q:'Ein Fahrrad kann fliegen.', a:false },
      { q:'Die Kette treibt das Hinterrad an.', a:true },
      { q:'Ein Mountainbike ist für Gebirge gemacht.', a:true },
      { q:'Fahrräder fahren mit Benzin.', a:false },
      { q:'Tour de France ist ein bekanntes Radrennen.', a:true },
    ],
    7: [ // Essen
      { q:'Croissants kommen ursprünglich aus Frankreich.', a:true },
      { q:'Käse wird aus Milch gemacht.', a:true },
      { q:'Baguette ist ein französisches Brot.', a:true },
      { q:'Man trinkt Suppe mit einer Gabel.', a:false },
      { q:'Ein Koch arbeitet in der Küche.', a:true },
      { q:'"Bon appétit" bedeutet guten Hunger.', a:true },
      { q:'Wein wird aus Trauben gemacht.', a:true },
      { q:'Ein Salat ist ein warmes Gericht.', a:false },
      { q:'Frankreich ist bekannt für seine Küche.', a:true },
      { q:'Pommes frites kommen ursprünglich aus der Schweiz.', a:false },
    ],
    8: [ // Fussball
      { q:'Ein Fussball ist rund.', a:true },
      { q:'Eine Mannschaft hat 11 Spieler.', a:true },
      { q:'Der Torwart darf den Ball mit den Händen berühren.', a:true },
      { q:'Ein Tor zählt 2 Punkte.', a:false },
      { q:'VfB Stuttgart spielt in der Bundesliga.', a:true },
      { q:'Ein Elfmeter wird aus 11 Metern geschossen.', a:true },
      { q:'Ein Fussballspiel dauert 90 Minuten.', a:true },
      { q:'Das Netz ist hinter dem Tor.', a:true },
      { q:'Man darf mit den Händen kicken.', a:false },
      { q:'Die Rote Karte bedeutet Ausschluss.', a:true },
    ],
    9: [ // Packen
      { q:'Ein Koffer hat Rollen.', a:true },
      { q:'Man darf flüssige Sachen unbegrenzt ins Flugzeug mitnehmen.', a:false },
      { q:'Ein Reisepass ist ein offizielles Dokument.', a:true },
      { q:'Man packt warme Sachen für den Strand.', a:false },
      { q:'Sonnencreme gehört in den Sommerurlaub.', a:true },
      { q:'Ein Koffer kann zu schwer sein für das Flugzeug.', a:true },
      { q:'Man braucht Geld für Reisen.', a:true },
      { q:'Ein Handgepäck ist sehr gross.', a:false },
      { q:'Ferien enden irgendwann.', a:true },
      { q:'Man packt gerne am letzten Tag.', a:false },
    ],
    10: [ // Abreise
      { q:'Die Heimreise ist die Rückfahrt.', a:true },
      { q:'Ferien sind immer schlecht.', a:false },
      { q:'Gute Erinnerungen bleiben für immer.', a:true },
      { q:'Fotos helfen sich zu erinnern.', a:true },
      { q:'Nach Ferien kommt wieder der Alltag.', a:true },
      { q:'Man kann Ferien-Souvenirs kaufen.', a:true },
      { q:'Eine Abreise ist immer traurig.', a:false },
      { q:'Ferien machen glücklich.', a:true },
      { q:'Zuhause ist man nie wieder glücklich.', a:false },
      { q:'Nächstes Jahr gibt es wieder Ferien!', a:true },
    ],
  },

  start(config) {
    const { worldId = 1, onComplete } = config;
    TrueFalseGame._lastConfig = config;
    const pool = this._questions[worldId] || this._questions[1];
    const questions = [...pool].sort(()=>Math.random()-0.5).slice(0,10);
    this.current = {
      questions, index:0,
      results:[], errors:0,
      startTime: Date.now(),
      answered: false,
      onComplete,
    };
    this._render();
  },

  _render() {
    const c = this.current;
    if (c.index >= c.questions.length) { this._showResult(); return; }
    const q = c.questions[c.index];
    const elapsed = Math.round((Date.now()-c.startTime)/1000);

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <!-- Progress -->
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:10px">
          <span>Frage <b>${c.index+1}/10</b></span>
          <span>⏱ ${elapsed}s</span>
          <span>❌ ${c.errors}</span>
        </div>
        <div style="background:#E8F5E9;border-radius:50px;height:10px;margin-bottom:18px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#27AE60,#1E8449);border-radius:50px;width:${c.index*10}%;transition:width 0.3s"></div>
        </div>

        <!-- Question card -->
        <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border:2px solid #85C1E9;
          border-radius:18px;padding:24px 20px;margin-bottom:20px;min-height:100px;
          display:flex;align-items:center;justify-content:center">
          <div style="font-family:'Fredoka One',cursive;font-size:1.25rem;color:var(--mountain-dark);line-height:1.4">
            "${q.q}"
          </div>
        </div>

        <!-- True / False buttons -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <button onclick="TrueFalseGame._answer(true)"
            style="padding:22px 10px;border-radius:18px;border:none;cursor:pointer;
              background:linear-gradient(135deg,#27AE60,#1E8449);color:white;
              font-family:'Fredoka One',cursive;font-size:1.6rem;
              box-shadow:0 6px 16px rgba(39,174,96,0.4);transition:transform 0.15s"
            onmousedown="this.style.transform='scale(0.95)'"
            onmouseup="this.style.transform=''">
            ✅ Wahr
          </button>
          <button onclick="TrueFalseGame._answer(false)"
            style="padding:22px 10px;border-radius:18px;border:none;cursor:pointer;
              background:linear-gradient(135deg,#E74C3C,#C0392B);color:white;
              font-family:'Fredoka One',cursive;font-size:1.6rem;
              box-shadow:0 6px 16px rgba(231,76,60,0.4);transition:transform 0.15s"
            onmousedown="this.style.transform='scale(0.95)'"
            onmouseup="this.style.transform=''">
            ❌ Falsch
          </button>
        </div>

        <!-- Dots -->
        <div style="display:flex;gap:5px;justify-content:center;margin-top:16px">
          ${Array.from({length:10},(_,i)=>{
            const r=c.results[i];
            return `<div style="width:10px;height:10px;border-radius:50%;background:${
              r===true?'#27AE60':r===false?'#E74C3C':'#E0E6EE'}"></div>`;
          }).join('')}
        </div>
      </div>`;
  },

  _answer(chosen) {
    const c = this.current;
    if (c.answered) return;
    c.answered = true;
    const q = c.questions[c.index];
    const correct = chosen === q.a;
    if (!correct) c.errors++;
    c.results[c.index] = correct;

    // Brief feedback overlay on buttons
    const btns = document.querySelectorAll('#game-area button');
    btns.forEach(b=>b.disabled=true);

    // Show correct answer
    const feedback = document.createElement('div');
    feedback.style.cssText = `text-align:center;margin-top:12px;font-family:'Fredoka One',cursive;font-size:1.1rem;color:${correct?'#27AE60':'#E74C3C'}`;
    feedback.textContent = correct ? '✅ Richtig!' : `❌ Falsch! Die Antwort war: ${q.a ? 'Wahr' : 'Falsch'}`;
    document.getElementById('game-area')?.appendChild(feedback);

    setTimeout(() => {
      c.index++;
      c.answered = false;
      this._render();
    }, 1000);
  },

  _showResult() {
    const c = this.current;
    const correct = c.results.filter(Boolean).length;
    const timeMs = Date.now()-c.startTime;
    const rawScore = Math.round((correct/10)*100);
    const finalScore = State.calcFinalScore({rawScore,timeMs,errors:c.errors,passed:correct>=6});

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${correct>=9?'🧠🏆':correct>=7?'🧠😊':correct>=5?'🧠😐':'🧠😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          ${correct}/10 richtig!
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b>
            <br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b>
            <br><span style="color:var(--text-mid)">Fehler</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b>
            <br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${correct<6?`<button class="btn btn-secondary btn-full" onclick="TrueFalseGame.start(TrueFalseGame._lastConfig)">🔄 Nochmal</button>`:''}
          <button class="btn btn-primary btn-full" onclick="TrueFalseGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
        </div>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({rawScore:score,timeMs,errors,passed:score>=40});
  },
};

window.TrueFalseGame = TrueFalseGame;
