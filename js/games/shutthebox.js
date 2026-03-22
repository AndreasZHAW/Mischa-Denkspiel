/**
 * games/shutthebox.js — Shut the Box
 * Würfle und schliesse die Zahlen 1-9 die die Würfelsumme ergeben.
 * Max 10 Runden / so wenig offene Felder wie möglich.
 */

const ShutTheBoxGame = {
  current: null,

  start(config) {
    const { onComplete } = config;
    this.current = {
      boxes: Array.from({length: 9}, (_, i) => ({ num: i+1, closed: false })),
      dice: [0, 0],
      diceSum: 0,
      rolls: 0,
      maxRolls: 10,
      selected: [],
      phase: 'roll', // 'roll' | 'select' | 'done'
      startTime: Date.now(),
      errors: 0,
      onComplete,
    };
    this._render();
  },

  _render() {
    const c = this.current;
    const openBoxes = c.boxes.filter(b => !b.closed);
    const openSum = openBoxes.reduce((s, b) => s + b.num, 0);
    const allClosed = openBoxes.length === 0;

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <!-- Info row -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:0.85rem;color:var(--text-mid)">
          <span>🎲 Wurf ${c.rolls}/${c.maxRolls}</span>
          <span>❌ ${c.errors} Fehler</span>
          <span>Offen: <b>${openSum}</b></span>
        </div>

        <!-- Box grid -->
        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:20px;flex-wrap:wrap">
          ${c.boxes.map((box, i) => `
            <div id="box-${i}"
              onclick="${!box.closed && c.phase === 'select' ? `ShutTheBoxGame._toggleBox(${i})` : ''}"
              style="
                width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center;
                justify-content: center; font-family: 'Fredoka One', cursive; font-size: 1.2rem;
                cursor: ${!box.closed && c.phase === 'select' ? 'pointer' : 'default'};
                background: ${box.closed ? '#27AE60' : (c.selected.includes(i) ? '#3498DB' : 'white')};
                color: ${box.closed ? 'white' : (c.selected.includes(i) ? 'white' : 'var(--text-dark)')};
                border: 3px solid ${box.closed ? '#1E8449' : (c.selected.includes(i) ? '#2980B9' : '#E0E6EE')};
                transition: all 0.2s;
                transform: ${box.closed ? 'scale(0.9)' : 'scale(1)'};
                opacity: ${box.closed ? '0.5' : '1'};
              ">
              ${box.closed ? '✓' : box.num}
            </div>
          `).join('')}
        </div>

        <!-- Dice display -->
        <div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px">
          ${c.dice.map(d => `
            <div style="width:56px;height:56px;background:white;border-radius:12px;border:3px solid #E0E6EE;
              display:flex;align-items:center;justify-content:center;font-size:2rem;
              box-shadow:0 4px 12px rgba(0,0,0,0.1)">
              ${this._diceEmoji(d)}
            </div>
          `).join('')}
          ${c.diceSum > 0 ? `<div style="display:flex;align-items:center;font-family:'Fredoka One',cursive;font-size:1.5rem;color:var(--mountain-dark)"> = ${c.diceSum}</div>` : ''}
        </div>

        <!-- Status & hint -->
        ${c.phase === 'select' ? `
          <div style="background:#EBF5FB;border-radius:12px;padding:10px;margin-bottom:12px;font-size:0.9rem;color:var(--text-dark)">
            Wähle Zahlen die zusammen <b>${c.diceSum}</b> ergeben!
            ${c.selected.length > 0 ? `<br>Ausgewählt: <b>${c.selected.map(i => c.boxes[i].num).join(' + ')} = ${c.selected.reduce((s,i)=>s+c.boxes[i].num,0)}</b>` : ''}
          </div>
        ` : ''}

        <!-- Buttons -->
        ${allClosed ? `
          <div style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:#27AE60;margin-bottom:12px">🎉 Box geschlossen!</div>
          <button class="btn btn-primary btn-full" onclick="ShutTheBoxGame._finish()">Weiter ➜</button>
        ` : c.phase === 'done' ? `
          <div style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:var(--mountain-dark);margin-bottom:8px">
            Noch offen: ${openSum} Punkte
          </div>
          <button class="btn btn-primary btn-full" onclick="ShutTheBoxGame._finish()">Weiter ➜</button>
        ` : c.phase === 'roll' ? `
          <button class="btn btn-gold btn-full btn-big" onclick="ShutTheBoxGame._roll()">
            🎲 Würfeln!
          </button>
        ` : `
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary" style="flex:1" onclick="ShutTheBoxGame._confirmSelection()" 
              ${c.selected.length === 0 ? 'disabled style="opacity:0.5"' : ''}>
              ✅ Schliessen
            </button>
            <button class="btn" style="flex:1;background:#F5F5F5;color:var(--text-mid)" onclick="ShutTheBoxGame._clearSelection()">
              ✕ Abbrechen
            </button>
          </div>
        `}
      </div>
    `;
  },

  _diceEmoji(n) {
    return ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][n] || '🎲';
  },

  _roll() {
    const c = this.current;
    const openBoxes = c.boxes.filter(b => !b.closed);
    // Use 1 die if remaining sum <= 6
    const openSum = openBoxes.reduce((s, b) => s + b.num, 0);
    const oneDie = openSum <= 6;

    c.dice[0] = Math.ceil(Math.random() * 6);
    c.dice[1] = oneDie ? 0 : Math.ceil(Math.random() * 6);
    c.diceSum = c.dice[0] + c.dice[1];
    c.rolls++;
    c.selected = [];
    c.phase = 'select';

    // Check if any combination possible
    const possible = this._hasPossibleMove(openBoxes, c.diceSum);
    if (!possible) {
      c.phase = 'done';
    }

    this._render();
  },

  _hasPossibleMove(openBoxes, target) {
    const nums = openBoxes.map(b => b.num);
    // Check all subsets
    for (let mask = 1; mask < (1 << nums.length); mask++) {
      let sum = 0;
      for (let i = 0; i < nums.length; i++) {
        if (mask & (1 << i)) sum += nums[i];
      }
      if (sum === target) return true;
    }
    return false;
  },

  _toggleBox(index) {
    const c = this.current;
    if (c.boxes[index].closed) return;
    const pos = c.selected.indexOf(index);
    if (pos >= 0) {
      c.selected.splice(pos, 1);
    } else {
      c.selected.push(index);
    }
    this._render();
  },

  _clearSelection() {
    this.current.selected = [];
    this._render();
  },

  _confirmSelection() {
    const c = this.current;
    const selSum = c.selected.reduce((s, i) => s + c.boxes[i].num, 0);

    if (selSum !== c.diceSum) {
      c.errors++;
      // Flash error
      document.querySelectorAll('[id^="box-"]').forEach(el => {
        if (c.selected.some(i => el.id === `box-${i}`)) {
          el.style.background = '#E74C3C';
          el.style.color = 'white';
        }
      });
      setTimeout(() => {
        c.selected = [];
        this._render();
      }, 700);
      return;
    }

    // Close selected boxes
    c.selected.forEach(i => { c.boxes[i].closed = true; });
    c.selected = [];

    const openBoxes = c.boxes.filter(b => !b.closed);
    if (openBoxes.length === 0) {
      c.phase = 'done';
      this._render();
      return;
    }

    if (c.rolls >= c.maxRolls) {
      c.phase = 'done';
    } else {
      c.phase = 'roll';
    }
    this._render();
  },

  _finish() {
    const c = this.current;
    const openSum = c.boxes.filter(b => !b.closed).reduce((s, b) => 0, 0);
    // Wait — actually count closed boxes for score
    const closedCount = c.boxes.filter(b => b.closed).length;
    const allClosed = closedCount === 9;
    const rawScore = allClosed ? 100 : Math.round((closedCount / 9) * 80);
    const timeMs = Date.now() - c.startTime;

    if (c.onComplete) {
      c.onComplete({ rawScore, timeMs, errors: c.errors, passed: closedCount >= 5 });
    }
  },
};

window.ShutTheBoxGame = ShutTheBoxGame;
