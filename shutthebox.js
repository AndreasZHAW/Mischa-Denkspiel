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

    // Check if any valid selection possible
    const canClose=c.phase==='select'&&openBoxes.some(b=>{
      return openBoxes.some(b2=>b2!==b&&b.num+b2.num===c.diceSum)||b.num===c.diceSum;
    });

    document.getElementById('game-area').innerHTML=`
      <div style="max-width:420px;margin:0 auto;padding:${isMob?'6px 4px':'10px 8px'};text-align:center">

        <!-- Top bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:clamp(0.82rem,3.8vw,0.95rem);font-weight:600;color:var(--text-mid)">
          <span>🎲 Wurf ${c.rolls}/${c.maxRolls}</span>
          <span>❌ ${c.errors} Fehler</span>
          <span>Offen: <b style="color:${openSum>20?'#E74C3C':openSum>10?'#F39C12':'#27AE60'}">${openSum}</b></span>
        </div>

        <!-- Number boxes - big touch targets -->
        <div style="display:flex;gap:clamp(4px,2vw,8px);justify-content:center;margin-bottom:14px;flex-wrap:wrap;padding:0 2px">
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
          ${c.phase==='roll'?'Würfeln!':c.phase==='select'?`Wähle Zahlen die zusammen <b>${c.diceSum}</b> ergeben!`:''}
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
              🎲 Würfeln!
            </button>
            <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}</style>`:''}
          ${c.phase==='select'&&c.selected.length>0?`
            <button onclick="ShutTheBoxGame._confirm()"
              style="background:linear-gradient(135deg,#27AE60,#1E8449);color:white;border:none;
                padding:clamp(16px,4.5vw,20px) clamp(32px,9vw,44px);border-radius:16px;
                font-size:clamp(1rem,4.5vw,1.2rem);font-weight:900;cursor:pointer;
                min-height:54px;touch-action:manipulation;box-shadow:0 4px 12px rgba(39,174,96,.4)">
              ✅ Schliessen
            </button>
            <button onclick="ShutTheBoxGame._cancel()"
              style="background:rgba(255,255,255,.6);color:var(--text-mid);border:2px solid #E0E6EE;
                padding:clamp(14px,4vw,18px) clamp(16px,5vw,24px);border-radius:14px;
                font-size:clamp(0.88rem,4vw,1rem);cursor:pointer;min-height:54px;touch-action:manipulation">
              ✕ Abbrechen
            </button>`:''}
        </div>
      </div>`;
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
    // Check if any valid move exists
    const vals=openBoxes.map(b=>b.num);
    const hasMove=vals.some(v=>v===c.diceSum)||vals.some((v,i)=>vals.some((v2,j)=>j>i&&v+v2===c.diceSum));
    if(!hasMove){c.errors++;c.phase='roll';this._render();if(c.rolls>=c.maxRolls)this._finish(false);return;}
    c.phase='select';
    this._render();
  },

  _toggleBox(i) {
    const c=this.current;if(c.phase!=='select')return;
    const box=c.boxes[i];if(box.closed)return;
    const idx=c.selected.indexOf(i);
    if(idx>=0)c.selected.splice(idx,1);
    else if(c.selected.length<3)c.selected.push(i);
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
