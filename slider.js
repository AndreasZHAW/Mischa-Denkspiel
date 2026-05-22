/**
 * games/slider.js v3 — Schiebepuzzle (mobile-optimized)
 * 3×3 grid, fills screen width, large touch targets
 */
const SliderGame = {
  current: null, _timerInterval: null, _lastConfig: null,

  _themes: {
    1:{bg:'#EBF5FB',tile:'#2980B9',tileGood:'#1A5276',empty:'#D6EAF8',text:'white',label:'🚗 Anreise'},
    2:{bg:'#F4ECF7',tile:'#8E44AD',tileGood:'#6C3483',empty:'#E8DAEF',text:'white',label:'🏰 Schloss'},
    3:{bg:'#E9F7EF',tile:'#27AE60',tileGood:'#1E8449',empty:'#D5F5E3',text:'white',label:'🏊 Pool'},
    4:{bg:'#FEF9E7',tile:'#E67E22',tileGood:'#CA6F1E',empty:'#FDEBD0',text:'white',label:'🎾 Tennis'},
    5:{bg:'#FDEDEC',tile:'#E74C3C',tileGood:'#B03A2E',empty:'#FADBD8',text:'white',label:'🎲 Kniffel'},
    default:{bg:'#EBF5FB',tile:'#2980B9',tileGood:'#1A5276',empty:'#D6EAF8',text:'white',label:'🧩 Puzzle'},
  },
  _getEmojis(wId){const s={1:['🚗','🗺️','⛽','🚦','🎒','🏔️','🌲','🌸'],2:['🏰','👑','⚔️','🛡️','🗝️','🕯️','🦅','🌹'],3:['🏊','🌞','🏖️','🍦','🐠','🌊','🦀','🐚']};return s[wId]||s[1];},

  start(config){
    const{worldId=1,onComplete}=config;
    SliderGame._lastConfig=config;
    const tiles=this._generatePuzzle(3);
    const theme=this._themes[worldId]||this._themes.default;
    this.current={size:3,tiles,theme,moves:0,elapsed:0,onComplete,worldId,emojis:this._getEmojis(worldId)};
    this._render();
    if(this._timerInterval)clearInterval(this._timerInterval);
    this._timerInterval=setInterval(()=>{if(!this.current)return;this.current.elapsed++;const el=document.getElementById('sl-timer');if(el)el.textContent=this.current.elapsed+'s';},1000);
  },

  _generatePuzzle(size){
    const n=size*size;
    let t;do{t=[...Array(n-1).keys()].map(i=>i+1).concat([0]);for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[t[i],t[j]]=[t[j],t[i]];}}while(!this._isSolvable(t,size)||this._isSolved(t));
    return t;
  },
  _isSolvable(t,s){const f=t.filter(x=>x!==0);let inv=0;for(let i=0;i<f.length;i++)for(let j=i+1;j<f.length;j++)if(f[i]>f[j])inv++;if(s%2===1)return inv%2===0;const er=Math.floor(t.indexOf(0)/s);return(inv+er)%2===1;},
  _isSolved(t){for(let i=0;i<t.length-1;i++)if(t[i]!==i+1)return false;return t[t.length-1]===0;},

  _render(){
    const c=this.current, t=c.theme;
    const isMob='ontouchstart' in window;
    // Cell size: fill screen width on mobile
    const avW=Math.min(window.innerWidth-24,420);
    const CELL=Math.round((avW-16)/3);  // 3 columns, 8px padding each side
    const GAP=5;
    const BOARD=CELL*3+GAP*2;
    const FONT=Math.round(CELL*0.46); // emoji size proportional to cell

    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center;padding:8px 4px;max-width:480px;margin:0 auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 4px;font-size:clamp(0.82rem,3.5vw,0.92rem);color:var(--text-mid)">
          <span style="font-weight:700;color:${t.tile}">${t.label}</span>
          <span>Züge: <b id="sl-moves" style="color:var(--text-dark)">0</b></span>
          <span>⏱ <b id="sl-timer" style="color:var(--text-dark)">0s</b></span>
        </div>
        <div id="sl-board" style="
          display:grid;grid-template-columns:repeat(3,${CELL}px);
          gap:${GAP}px;margin:0 auto;width:${BOARD}px;
          background:${t.empty};padding:${GAP}px;border-radius:16px;
          box-shadow:0 4px 16px rgba(0,0,0,0.12)">
          ${c.tiles.map((tile,i)=>this._tileHTML(tile,i,c,CELL,FONT)).join('')}
        </div>
        <div style="font-size:clamp(0.76rem,3vw,0.84rem);color:var(--text-mid);margin-top:8px">
          Grün = am richtigen Platz ✅ · Tippe auf Nachbarfeld zum Schieben
        </div>
        <button class="btn btn-secondary" onclick="SliderGame._shuffle()" style="margin-top:10px;font-size:0.88rem;padding:9px 20px">
          🔀 Neu mischen
        </button>
      </div>`;
    this._attachHandlers();
  },

  _tileHTML(tile,i,c,CELL,FONT){
    const t=c.theme;
    if(tile===0)return`<div style="width:${CELL}px;height:${CELL}px;background:${t.empty};border-radius:10px"></div>`;
    const correct=tile===i+1;
    const emoji=c.emojis[(tile-1)%c.emojis.length]||'❓';
    const num=tile;
    return`<div data-idx="${i}" onclick="SliderGame._tap(${i})"
      style="width:${CELL}px;height:${CELL}px;background:${correct?t.tileGood:t.tile};
        border-radius:10px;display:flex;flex-direction:column;align-items:center;
        justify-content:center;cursor:pointer;touch-action:manipulation;
        box-shadow:${correct?'inset 0 2px 4px rgba(0,0,0,.2)':'0 4px 8px rgba(0,0,0,.2)'};
        transition:all .12s;user-select:none">
      <span style="font-size:${FONT}px;line-height:1">${emoji}</span>
      <span style="font-size:${Math.round(FONT*0.38)}px;color:rgba(255,255,255,.85);font-weight:700;margin-top:2px">${num}</span>
    </div>`;
  },

  _attachHandlers(){
    const board=document.getElementById('sl-board');
    if(!board)return;
    // Swipe support
    let sx,sy;
    board.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
    board.addEventListener('touchend',e=>{
      if(sx===undefined)return;
      const dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy;
      const absDx=Math.abs(dx), absDy=Math.abs(dy);
      if(Math.max(absDx,absDy)<15)return;
      // Find tile under start point (approximate)
      const target=document.elementFromPoint(sx,sy);
      const idx=target?.dataset?.idx!=null?parseInt(target.dataset.idx):(target?.closest('[data-idx]')?.dataset?.idx!=null?parseInt(target.closest('[data-idx]').dataset.idx):-1);
      if(idx<0)return;
      // Swipe direction → move that tile
      if(absDx>absDy){if(dx>0)this._moveTile(idx,-1);else this._moveTile(idx,1);}
      else{if(dy>0)this._moveTile(idx,-3);else this._moveTile(idx,3);}
    },{passive:true});
  },

  _tap(i){
    const c=this.current;
    const empty=c.tiles.indexOf(0);
    const size=c.size;
    const row=Math.floor(i/size), col=i%size;
    const er=Math.floor(empty/size), ec=empty%size;
    if((Math.abs(row-er)===1&&col===ec)||(Math.abs(col-ec)===1&&row===er)){
      [c.tiles[i],c.tiles[empty]]=[c.tiles[empty],c.tiles[i]];
      c.moves++;
      const el=document.getElementById('sl-moves');if(el)el.textContent=c.moves;
      this._updateBoard();
      if(this._isSolved(c.tiles))setTimeout(()=>this._finish(),300);
    }
  },

  _moveTile(tileIdx,delta){
    const c=this.current;
    const targetIdx=tileIdx-delta;
    if(targetIdx<0||targetIdx>=c.tiles.length)return;
    if(c.tiles[targetIdx]===0)this._tap(tileIdx);
  },

  _updateBoard(){
    const c=this.current;
    const avW=Math.min(window.innerWidth-24,420);
    const CELL=Math.round((avW-16)/3);
    const FONT=Math.round(CELL*0.46);
    const tiles=document.querySelectorAll('#sl-board > div');
    tiles.forEach((el,i)=>{
      const tile=c.tiles[i];
      if(tile===0){el.style.background=c.theme.empty;el.innerHTML='';return;}
      const correct=tile===i+1;
      const emoji=c.emojis[(tile-1)%c.emojis.length]||'❓';
      el.style.background=correct?c.theme.tileGood:c.theme.tile;
      el.style.boxShadow=correct?'inset 0 2px 4px rgba(0,0,0,.2)':'0 4px 8px rgba(0,0,0,.2)';
      el.innerHTML=`<span style="font-size:${FONT}px;line-height:1">${emoji}</span><span style="font-size:${Math.round(FONT*0.38)}px;color:rgba(255,255,255,.85);font-weight:700;margin-top:2px">${tile}</span>`;
    });
  },

  _shuffle(){
    const c=this.current;if(!c)return;
    c.tiles=this._generatePuzzle(c.size);c.moves=0;c.elapsed=0;
    const mv=document.getElementById('sl-moves');if(mv)mv.textContent='0';
    const tm=document.getElementById('sl-timer');if(tm)tm.textContent='0s';
    this._render();
  },

  _finish(){
    if(this._timerInterval){clearInterval(this._timerInterval);this._timerInterval=null;}
    const c=this.current;if(!c)return;
    const timeMs=c.elapsed*1000;
    const rawScore=Math.max(10,Math.min(100,Math.round(100-c.moves/2-c.elapsed/5)));
    const finalScore=State.calcFinalScore({rawScore,timeMs,errors:0,passed:true});
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center;padding:20px;max-width:400px;margin:0 auto">
        <div style="font-size:3rem;margin-bottom:12px">🎉</div>
        <div style="font-size:1.4rem;font-weight:900;color:var(--mountain-dark);margin-bottom:8px">Puzzle gelöst!</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0">
          <div style="background:#E8F8F5;border-radius:10px;padding:10px"><b style="font-size:1.2rem">${c.moves}</b><div style="font-size:.8rem;color:#555">Züge</div></div>
          <div style="background:#E8F8F5;border-radius:10px;padding:10px"><b style="font-size:1.2rem">${c.elapsed}s</b><div style="font-size:.8rem;color:#555">Zeit</div></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="SliderGame._done(${finalScore},${timeMs})">Weiter ➜</button>
      </div>`;
  },

  _done(score,timeMs){
    if(this.current?.onComplete)this.current.onComplete({rawScore:score,timeMs,errors:0,passed:true});
    this.current=null;
  },
};
window.SliderGame=SliderGame;
