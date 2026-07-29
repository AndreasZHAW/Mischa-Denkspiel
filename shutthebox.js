/**
 * games/shutthebox.js — Shut the Box (mobile-optimized)
 */
const ShutTheBoxGame = {
  current: null,

  start(config) {
    const { onComplete } = config;
    this.current = {
      boxes:Array.from({length:9},(_,i)=>({num:i+1,closed:false})),
      dice:[0,0], diceSum:0, rolls:0, maxRolls:10,
      selected:[], phase:'roll', startTime:Date.now(), errors:0, onComplete,
    };
    this._render();
  },

  _render() {
    const c=this.current;
    const openBoxes=c.boxes.filter(b=>!b.closed);
    const openSum=openBoxes.reduce((s,b)=>s+b.num,0);
    const allClosed=openBoxes.length===0;
    const isMob='ontouchstart' in window;

    // Any subset of open boxes summing to the dice total counts — not just
    // pairs/triples. With fewer boxes left open later in the game, some
    // reachable sums genuinely need 4+ of them; capping the check at 3
    // could wrongly call a real move "impossible".
    const canClose=c.phase==='select'&&ShutTheBoxGame._subsetSumExists(openBoxes.map(b=>b.num), c.diceSum);

    document.getElementById('game-area').innerHTML=`
      <div style="max-width:420px;margin:0 auto;padding:${isMob?'6px 4px':'10px 8px'};text-align:center">

        <!-- Top bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:clamp(0.82rem,3.8vw,0.95rem);font-weight:600;color:var(--text-mid)">
          <span>🎲 ${typeof t!=='undefined'?t('stb.roll_n'):'Wurf'} ${c.rolls}/${c.maxRolls}</span>
          <span>❌ ${c.errors} ${typeof t!=='undefined'?t('math.errors'):'Fehler'}</span>
          <span>${typeof t!=='undefined'?t('stb.open'):'Offen:'} <b style="color:${openSum>20?'#E74C3C':openSum>10?'#F39C12':'#27AE60'}">${openSum}</b></span>
        </div>

        <!-- Number boxes - big touch targets -->
        <div style="display:flex;gap:clamp(4px,2vw,8px);justify-content:center;margin-bottom:6px;flex-wrap:wrap;padding:0 2px">
          ${c.boxes.map((box,i)=>`
            <div id="box-${i}" onclick="${!box.closed&&c.phase==='select'?`ShutTheBoxGame._toggleBox(${i})`:''}"
              style="width:clamp(44px,11vw,58px);height:clamp(44px,11vw,58px);border-radius:10px;
                display:flex;align-items:center;justify-content:center;
                font-size:clamp(1.1rem,5vw,1.45rem);font-weight:900;
                cursor:${!box.closed&&c.phase==='select'?'pointer':'default'};
                background:${box.closed?'#27AE60':c.selected.includes(i)?'#3498DB':'white'};
                color:${box.closed?'white':c.selected.includes(i)?'white':'var(--text-dark)'};
                border:3px solid ${box.closed?'#1E8449':c.selected.includes(i)?'#2980B9':'#E0E6EE'};
                transition:all 0.18s;box-shadow:${c.selected.includes(i)?'0 0 0 3px rgba(52,152,219,.3)':'0 2px 4px rgba(0,0,0,.08)'};
                opacity:${box.closed?'0.45':'1'};transform:${box.closed?'scale(0.88)':'scale(1)'}">
              ${box.closed?'✓':box.num}
            </div>`).join('')}
        </div>
        <div style="font-size:.7rem;color:rgba(0,0,0,.4);margin-bottom:14px;line-height:1.3">
          ${typeof t!=='undefined'?t('stb.scoring_info'):'💡 Alles geschlossen = beste Wertung. Sonst: je weniger am Ende offen bleibt, desto besser.'}
        </div>

        <!-- Dice display -->
        <div style="display:flex;justify-content:center;align-items:center;gap:clamp(10px,4vw,16px);margin-bottom:12px">
          ${c.dice[0]>0?c.dice.map(d=>`
            <div style="width:clamp(52px,15vw,68px);height:clamp(52px,15vw,68px);background:white;
              border-radius:14px;display:flex;align-items:center;justify-content:center;
              font-size:clamp(1.6rem,7vw,2.2rem);border:3px solid #E0E6EE;
              box-shadow:0 3px 10px rgba(0,0,0,.12)">
              ${['','⚀','⚁','⚂','⚃','⚄','⚅'][d]}
            </div>`).join('')+'<div style="font-size:clamp(1.2rem,5vw,1.5rem);font-weight:900;color:var(--text-dark)">= '+c.diceSum+'</div>':''}
        </div>

        <!-- Instruction -->
        <div style="margin-bottom:14px;font-size:clamp(0.85rem,4vw,1rem);color:var(--text-dark);font-weight:${c.phase==='select'?700:400}">
          ${c.phase==='roll'?(typeof t!=='undefined'?t('stb.roll_dice'):'Würfeln!'):c.phase==='bust'?`<span style="color:#E74C3C;font-weight:900">${typeof t!=='undefined'?t('stb.no_move'):'❌ Kein Zug möglich! Spiel endet.'}</span>`:c.phase==='select'?`${typeof t!=='undefined'?t('stb.choose_sum'):'Wähle Zahlen die zusammen'} <b>${c.diceSum}</b>!`:''}
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:8px;justify-content:center">
          ${c.phase==='roll'?`
            <button onclick="ShutTheBoxGame._roll()"
              style="background:linear-gradient(135deg,#3498DB,#2980B9);color:white;border:none;
                padding:clamp(16px,4.5vw,20px) clamp(36px,10vw,52px);border-radius:16px;
                font-size:clamp(1.1rem,5vw,1.4rem);font-weight:900;cursor:pointer;
                min-height:clamp(60px,16vw,72px);touch-action:manipulation;
                box-shadow:0 4px 12px rgba(52,152,219,.4);animation:pulse .8s ease-in-out infinite">
              🎲 ${typeof t!=='undefined'?t('stb.roll_dice'):'Würfeln!'}
            </button>
            <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}</style>`:''}
          ${c.phase==='select'&&c.selected.length>0?`
            <button onclick="ShutTheBoxGame._confirm()"
              style="background:linear-gradient(135deg,#27AE60,#1E8449);color:white;border:none;
                padding:clamp(16px,4.5vw,20px) clamp(32px,9vw,44px);border-radius:16px;
                font-size:clamp(1rem,4.5vw,1.2rem);font-weight:900;cursor:pointer;
                min-height:54px;touch-action:manipulation;box-shadow:0 4px 12px rgba(39,174,96,.4)">
              ${typeof t!=='undefined'?t('stb.close'):'✅ Schliessen'}
            </button>
            <button onclick="ShutTheBoxGame._cancel()"
              style="background:rgba(255,255,255,.6);color:var(--text-mid);border:2px solid #E0E6EE;
                padding:clamp(14px,4vw,18px) clamp(16px,5vw,24px);border-radius:14px;
                font-size:clamp(0.88rem,4vw,1rem);cursor:pointer;min-height:54px;touch-action:manipulation">
              ${typeof t!=='undefined'?t('stb.cancel'):'✕ Abbrechen'}
            </button>`:''}
        </div>
      </div>`;
  },

  // True if ANY subset of `nums` sums to `target` — with at most 9 open
  // boxes this is cheap (at most 2^9=512 subsets) and correct regardless
  // of how many boxes a valid move actually needs.
  _subsetSumExists(nums, target){
    if(target===0) return true;
    if(!nums.length) return false;
    const [first,...rest]=nums;
    if(first<=target && this._subsetSumExists(rest, target-first)) return true;
    return this._subsetSumExists(rest, target);
  },

  _roll() {
    const c=this.current;
    if(c.phase!=='roll')return;
    c.dice=[Math.ceil(Math.random()*6),Math.ceil(Math.random()*6)];
    c.diceSum=c.dice[0]+c.dice[1];
    c.rolls++;c.selected=[];
    const openBoxes=c.boxes.filter(b=>!b.closed);
    const openSum=openBoxes.reduce((s,b)=>s+b.num,0);
    if(openBoxes.length===0){this._finish(true);return;}
    // Check if any valid move exists — any subset of open boxes, not just
    // up to 3 of them (see _subsetSumExists below for why this matters).
    const vals=openBoxes.map(b=>b.num);
    const hasMove=ShutTheBoxGame._subsetSumExists(vals, c.diceSum);
    if(!hasMove){
      // No valid move → bust! Game ends with remaining open sum
      c.phase='bust';
      this._render();
      setTimeout(()=>this._finish(false), 800);
      return;
    }
    c.phase='select';
    this._render();
  },

  _toggleBox(i) {
    const c=this.current;if(c.phase!=='select')return;
    const box=c.boxes[i];if(box.closed)return;
    const idx=c.selected.indexOf(i);
    if(idx>=0)c.selected.splice(idx,1);
    else c.selected.push(i); // no cap — any combination of open boxes is fair game, matching real Shut the Box rules
    this._render();
  },

  _confirm() {
    const c=this.current;
    const sum=c.selected.reduce((s,i)=>s+c.boxes[i].num,0);
    if(sum!==c.diceSum){c.errors++;const el=document.getElementById('reaction-rt');this._render();return;}
    c.selected.forEach(i=>c.boxes[i].closed=true);
    c.selected=[];
    const openBoxes=c.boxes.filter(b=>!b.closed);
    if(openBoxes.length===0){this._finish(true);return;}
    if(c.rolls>=c.maxRolls){this._finish(false);return;}
    // Auto-roll after short delay
    c.phase='roll';
    this._render();
    setTimeout(()=>{ if(this.current&&this.current.phase==='roll') this._roll(); }, 600);
  },

  _cancel(){const c=this.current;c.selected=[];this._render();},

  _finish(allClosed) {
    const c=this.current;
    const openBoxes=c.boxes.filter(b=>!b.closed);
    const openSum=openBoxes.reduce((s,b)=>s+b.num,0);
    const timeMs=Date.now()-c.startTime;
    const rawScore=allClosed?100:Math.max(0,Math.round(100-openSum*3));
    const finalScore=State.calcFinalScore({rawScore,timeMs,errors:c.errors,passed:allClosed||openSum<=10});
    if(c.onComplete)c.onComplete({rawScore:finalScore,timeMs,errors:c.errors,passed:allClosed||openSum<=10});
  }
};
window.ShutTheBoxGame=ShutTheBoxGame;
