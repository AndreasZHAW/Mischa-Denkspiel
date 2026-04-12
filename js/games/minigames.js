/**
 * games/minigames.js — Sammlung einfacher Minispiele
 * Enthält: clock, flags, hangman, wordchain, tictactoe, weight, basketball, emojistory, geo, french, riddles
 */

// ============================================================
// CLOCK READING — Uhr lesen
// ============================================================
const ClockGame = {
  current: null, _lastConfig: null,
  start(config) {
    ClockGame._lastConfig = config;
    const { ageGroup='einfach', onComplete } = config;
    const qs = this._genQuestions(ageGroup);
    this.current = { qs, index:0, errors:0, startTime:Date.now(), onComplete };
    this._render();
  },
  _genQuestions(ageGroup) {
    const times = ageGroup==='sehr_einfach'||ageGroup==='einfach'
      ? [{h:3,m:0},{h:6,m:0},{h:9,m:0},{h:12,m:0},{h:1,m:30},{h:4,m:30},{h:7,m:0},{h:10,m:0},{h:2,m:0},{h:11,m:0}]
      : [{h:3,m:15},{h:6,m:45},{h:9,m:20},{h:12,m:35},{h:1,m:50},{h:4,m:10},{h:7,m:25},{h:10,m:40},{h:2,m:55},{h:11,m:5}];
    return times.sort(()=>Math.random()-0.5).slice(0,8);
  },
  _clockSVG(h,m) {
    const mAngle = (m/60)*360-90;
    const hAngle = ((h%12)/12)*360+(m/60)*30-90;
    const mRad = (mAngle*Math.PI)/180, hRad = (hAngle*Math.PI)/180;
    const mx=Math.cos(mRad)*65, my=Math.sin(mRad)*65;
    const hx=Math.cos(hRad)*45, hy=Math.sin(hRad)*45;
    const nums = Array.from({length:12},(_,i)=>{
      const a=((i+1)/12)*Math.PI*2-Math.PI/2;
      return `<text x="${Math.cos(a)*78}" y="${Math.sin(a)*78+5}" text-anchor="middle" font-size="12" font-family="Fredoka One,cursive" fill="#2C3E50">${i+1}</text>`;
    }).join('');
    return `<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg" style="width:180px;height:180px">
      <circle r="95" fill="white" stroke="#2C3E50" stroke-width="4"/>
      <circle r="90" fill="#F8F9FA"/>
      ${nums}
      ${Array.from({length:60},(_,i)=>{const a=(i/60)*Math.PI*2;return `<line x1="${Math.cos(a)*82}" y1="${Math.sin(a)*82}" x2="${Math.cos(a)*90}" y2="${Math.sin(a)*90}" stroke="${i%5===0?'#2C3E50':'#BDC3C7'}" stroke-width="${i%5===0?2:1}"/>`;}).join('')}
      <line x1="0" y1="0" x2="${hx}" y2="${hy}" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="${mx}" y2="${my}" stroke="#E74C3C" stroke-width="3" stroke-linecap="round"/>
      <circle r="5" fill="#2C3E50"/>
    </svg>`;
  },
  _render() {
    const c = this.current;
    if (c.index>=c.qs.length){ this._showResult(); return; }
    const q = c.qs[c.index];
    const correct = `${q.h}:${String(q.m).padStart(2,'0')} Uhr`;
    const wrongs = this._genWrongs(q);
    const opts = [correct,...wrongs].sort(()=>Math.random()-0.5);
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Frage <b>${c.index+1}/${c.qs.length}</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="font-size:0.9rem;color:var(--text-mid);margin-bottom:10px">Wie viel Uhr ist es?</div>
        <div style="display:flex;justify-content:center;margin-bottom:16px">${this._clockSVG(q.h,q.m)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${opts.map(o=>`<button onclick="ClockGame._answer('${o}','${correct}')"
            style="padding:14px;border-radius:14px;border:2px solid #E0E6EE;background:white;
              font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer;transition:all 0.15s">${o}</button>`).join('')}
        </div>
      </div>`;
  },
  _genWrongs(q) {
    const ws=new Set(); const all=[];
    while(ws.size<3){const h=Math.floor(Math.random()*12)+1,m=[0,15,30,45][Math.floor(Math.random()*4)];const s=`${h}:${String(m).padStart(2,'0')} Uhr`;if(s!==`${q.h}:${String(q.m).padStart(2,'0')} Uhr`)ws.add(s);}
    return [...ws];
  },
  _answer(chosen, correct) {
    const c = this.current;
    const ok = chosen===correct;
    if(!ok) c.errors++;
    document.querySelectorAll('#game-area button').forEach(b=>{
      b.disabled=true;
      if(b.textContent===correct) b.style.background='#27AE60',b.style.color='white',b.style.borderColor='#27AE60';
      if(b.textContent===chosen&&!ok) b.style.background='#E74C3C',b.style.color='white';
    });
    c.index++;
    setTimeout(()=>this._render(),900);
  },
  _showResult() {
    const c=this.current; const timeMs=Date.now()-c.startTime;
    const correct=c.qs.length-c.errors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/c.qs.length)*100),timeMs,errors:c.errors,passed:correct>=5});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">🕐🏆</div>
      <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.qs.length} richtig!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="ClockGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.ClockGame = ClockGame;

// ============================================================
// FLAGS — Flaggen raten
// ============================================================
const FlagsGame = {
  current: null, _lastConfig: null,
  _data: [
    {flag:'🇫🇷',name:'Frankreich',wrong:['Deutschland','Belgien','Italien']},
    {flag:'🇩🇪',name:'Deutschland',wrong:['Österreich','Schweiz','Niederlande']},
    {flag:'🇨🇭',name:'Schweiz',wrong:['Österreich','Liechtenstein','Deutschland']},
    {flag:'🇮🇹',name:'Italien',wrong:['Spanien','Portugal','Griechenland']},
    {flag:'🇪🇸',name:'Spanien',wrong:['Portugal','Mexiko','Argentinien']},
    {flag:'🇬🇧',name:'Grossbritannien',wrong:['Irland','Australien','Neuseeland']},
    {flag:'🇯🇵',name:'Japan',wrong:['China','Südkorea','Taiwan']},
    {flag:'🇺🇸',name:'USA',wrong:['Kanada','Australien','Grossbritannien']},
    {flag:'🇧🇷',name:'Brasilien',wrong:['Argentinien','Portugal','Kolumbien']},
    {flag:'🇳🇱',name:'Niederlande',wrong:['Belgien','Luxemburg','Deutschland']},
    {flag:'🇦🇹',name:'Österreich',wrong:['Schweiz','Deutschland','Ungarn']},
    {flag:'🇵🇹',name:'Portugal',wrong:['Spanien','Brasilien','Angola']},
  ],
  start(config) {
    FlagsGame._lastConfig=config;
    const qs=[...this._data].sort(()=>Math.random()-0.5).slice(0,10);
    this.current={qs,index:0,errors:0,startTime:Date.now(),onComplete:config.onComplete};
    this._render();
  },
  _render() {
    const c=this.current;
    if(c.index>=c.qs.length){this._showResult();return;}
    const q=c.qs[c.index];
    const opts=[q.name,...q.wrong].sort(()=>Math.random()-0.5);
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Flagge <b>${c.index+1}/10</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="font-size:6rem;margin:10px 0">${q.flag}</div>
        <div style="font-size:0.9rem;color:var(--text-mid);margin-bottom:14px">Welches Land ist das?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${opts.map(o=>`<button onclick="FlagsGame._ans('${o}','${q.name}')"
            style="padding:14px;border-radius:14px;border:2px solid #E0E6EE;background:white;
              font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer">${o}</button>`).join('')}
        </div>
      </div>`;
  },
  _ans(chosen,correct){
    const c=this.current; const ok=chosen===correct;
    if(!ok)c.errors++;
    document.querySelectorAll('#game-area button').forEach(b=>{b.disabled=true;
      if(b.textContent===correct)b.style.cssText+='background:#27AE60;color:white;border-color:#27AE60';
      if(b.textContent===chosen&&!ok)b.style.cssText+='background:#E74C3C;color:white';
    });
    c.index++; setTimeout(()=>this._render(),900);
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;const correct=10-c.errors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/10)*100),timeMs,errors:c.errors,passed:correct>=6});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">🌍🏆</div><div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/10 Flaggen!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="FlagsGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.FlagsGame = FlagsGame;

// ============================================================
// HANGMAN — Galgenmännchen
// ============================================================
const HangmanGame = {
  current:null, _lastConfig:null,
  _words:{
    1:['AUTO','REISE','KARTE','FAHRT'],2:['BURG','RITTER','KOENIG','SCHLOSS'],
    3:['POOL','SONNE','STRAND','WELLE'],4:['TENNIS','NETZ','BALL','MATCH'],
    5:['WUERFEL','KNIFFEL','SPIEL','SPASS'],6:['FAHRRAD','NATUR','WALD','TOUR'],
    7:['KAESE','WEIN','BROT','SUPPE'],8:['FUSSBALL','TOR','SIEG','JUBEL'],
    9:['KOFFER','REISE','FLUG','PACK'],10:['FERIEN','ABSCHIED','HEIMWEG','URLAUB'],
  },
  _hangmanSVG(wrong) {
    const parts = [
      `<line x1="60" y1="10" x2="60" y2="40" stroke="#E74C3C" stroke-width="3"/>`, // head
      `<line x1="60" y1="50" x2="60" y2="90" stroke="#E74C3C" stroke-width="3"/>`, // body
      `<line x1="60" y1="60" x2="40" y2="80" stroke="#E74C3C" stroke-width="3"/>`, // left arm
      `<line x1="60" y1="60" x2="80" y2="80" stroke="#E74C3C" stroke-width="3"/>`, // right arm
      `<line x1="60" y1="90" x2="40" y2="110" stroke="#E74C3C" stroke-width="3"/>`,// left leg
      `<line x1="60" y1="90" x2="80" y2="110" stroke="#E74C3C" stroke-width="3"/>`,// right leg
    ];
    const headCircle = wrong>0?`<circle cx="60" cy="30" r="10" fill="none" stroke="#E74C3C" stroke-width="3"/>`:'';
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:120px;height:120px">
      <line x1="10" y1="115" x2="110" y2="115" stroke="#2C3E50" stroke-width="3"/>
      <line x1="30" y1="10" x2="30" y2="115" stroke="#2C3E50" stroke-width="3"/>
      <line x1="30" y1="10" x2="65" y2="10" stroke="#2C3E50" stroke-width="3"/>
      <line x1="65" y1="10" x2="65" y2="20" stroke="#2C3E50" stroke-width="3"/>
      ${headCircle}
      ${parts.slice(0,wrong-1).join('')}
    </svg>`;
  },
  start(config) {
    HangmanGame._lastConfig=config;
    const {worldId=1,onComplete}=config;
    const pool=this._words[worldId]||this._words[1];
    const words=pool.sort(()=>Math.random()-0.5).slice(0,5);
    this.current={words,index:0,errors:0,totalErrors:0,startTime:Date.now(),onComplete};
    this._nextWord();
  },
  _nextWord(){
    const c=this.current;
    if(c.index>=c.words.length){this._showResult();return;}
    const word=c.words[c.index];
    c.current={word,guessed:new Set(),wrong:0,maxWrong:6};
    this._renderWord();
  },
  _renderWord(){
    const c=this.current; const {word,guessed,wrong,maxWrong}=c.current;
    const display=word.split('').map(ch=>guessed.has(ch)?ch:'_').join(' ');
    const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:8px">
          <span>Wort <b>${c.index+1}/${c.words.length}</b></span><span>Fehler: <b>${wrong}/${maxWrong}</b></span>
        </div>
        <div style="display:flex;justify-content:center">${this._hangmanSVG(wrong)}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:2rem;letter-spacing:8px;margin:12px 0;color:var(--mountain-dark)">${display}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;max-width:320px;margin:0 auto">
          ${alpha.split('').map(ch=>`
            <button onclick="HangmanGame._guess('${ch}')" id="hbtn-${ch}"
              ${guessed.has(ch)||c.current.wrong>=maxWrong?'disabled':''} 
              style="width:32px;height:32px;border-radius:8px;border:2px solid #E0E6EE;background:${guessed.has(ch)?(word.includes(ch)?'#27AE60':'#E74C3C'):'white'};
              color:${guessed.has(ch)?'white':'var(--text-dark)'};font-weight:700;font-size:0.82rem;cursor:pointer">${ch}</button>`).join('')}
        </div>
      </div>`;
  },
  _guess(ch){
    const c=this.current; const {word,guessed}=c.current;
    if(guessed.has(ch))return;
    guessed.add(ch);
    if(!word.includes(ch)){c.current.wrong++;c.errors++;}
    const solved=word.split('').every(l=>guessed.has(l));
    const failed=c.current.wrong>=c.current.maxWrong;
    if(solved||failed){
      if(!solved)c.totalErrors++;
      c.index++;
      setTimeout(()=>this._nextWord(),600);
      return;
    }
    this._renderWord();
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;
    const correct=c.words.length-c.totalErrors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/c.words.length)*100),timeMs,errors:c.errors,passed:correct>=3});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">🎯🏆</div><div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.words.length} Wörter erraten!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="HangmanGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.HangmanGame = HangmanGame;

// ============================================================
// TIC-TAC-TOE — gegen KI
// ============================================================
const TicTacToeGame = {
  current:null,_lastConfig:null,
  start(config){
    TicTacToeGame._lastConfig=config;
    this.current={board:Array(9).fill(null),xWins:0,oWins:0,draws:0,round:0,maxRounds:5,errors:0,startTime:Date.now(),onComplete:config.onComplete};
    this._newGame();
  },
  _newGame(){const c=this.current;c.board=Array(9).fill(null);c.xTurn=true;c.done=false;this._render();},
  _render(){
    const c=this.current;
    const cells=c.board.map((v,i)=>`<div onclick="TicTacToeGame._click(${i})"
      style="width:80px;height:80px;border-radius:12px;background:${v?'white':'#F0F4F8'};
        display:flex;align-items:center;justify-content:center;font-size:2.5rem;cursor:${v||c.done?'default':'pointer'};
        border:3px solid #E0E6EE;transition:all 0.15s;box-shadow:0 2px 6px rgba(0,0,0,0.08)">${v||''}</div>`).join('');
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px;padding:0 4px">
          <span>Runde <b>${c.round}/${c.maxRounds}</b></span>
          <span>Du ❌ ${c.xWins} · Unent. ${c.draws} · KI ⭕ ${c.oWins}</span>
        </div>
        <div style="font-size:0.88rem;color:var(--text-mid);margin-bottom:12px">${c.done?'':'Du bist ❌ — deine Runde!'}</div>
        <div style="display:grid;grid-template-columns:repeat(3,80px);gap:8px;margin:0 auto;width:256px">${cells}</div>
        <div id="ttt-msg" style="margin-top:14px;font-family:'Fredoka One',cursive;font-size:1.2rem;min-height:28px;color:var(--mountain-dark)"></div>
      </div>`;
  },
  _click(i){
    const c=this.current;
    if(c.board[i]||!c.xTurn||c.done)return;
    c.board[i]='❌';c.xTurn=false;
    const w=this._checkWin(c.board);
    if(w){c.xWins++;c.done=true;this._render();document.getElementById('ttt-msg').textContent='🎉 Du gewinnst!';setTimeout(()=>this._nextRound(),1200);return;}
    if(!c.board.includes(null)){c.draws++;c.done=true;this._render();document.getElementById('ttt-msg').textContent='🤝 Unentschieden!';setTimeout(()=>this._nextRound(),1200);return;}
    this._render();
    setTimeout(()=>this._aiMove(),500);
  },
  _aiMove(){
    const c=this.current;
    if(c.done)return;
    // Try to win, then block, then random
    const ai=this._bestMove(c.board,'⭕','❌');
    c.board[ai]='⭕';c.xTurn=true;
    const w=this._checkWin(c.board);
    if(w){c.oWins++;c.errors++;c.done=true;this._render();document.getElementById('ttt-msg').textContent='😢 KI gewinnt!';setTimeout(()=>this._nextRound(),1400);return;}
    if(!c.board.includes(null)){c.draws++;c.done=true;this._render();document.getElementById('ttt-msg').textContent='🤝 Unentschieden!';setTimeout(()=>this._nextRound(),1200);return;}
    this._render();
  },
  _bestMove(board,me,opp){
    for(const m of this._empty(board)){const b=[...board];b[m]=me;if(this._checkWin(b))return m;}
    for(const m of this._empty(board)){const b=[...board];b[m]=opp;if(this._checkWin(b))return m;}
    const e=this._empty(board);return e[Math.floor(Math.random()*e.length)];
  },
  _empty(b){return b.map((v,i)=>v?null:i).filter(i=>i!==null);},
  _checkWin(b){const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];return L.some(([a,b2,c])=>b[a]&&b[a]===b[b2]&&b[a]===b[c]);},
  _nextRound(){
    const c=this.current;c.round++;
    if(c.round>=c.maxRounds){this._showResult();return;}
    this._newGame();
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;
    const score=State.calcFinalScore({rawScore:Math.round((c.xWins/c.maxRounds)*100),timeMs,errors:c.errors,passed:c.xWins>=2});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">${c.xWins>c.oWins?'❌🏆':'⭕😅'}</div>
      <div style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:var(--mountain-dark);margin:10px 0">Du: ${c.xWins} · KI: ${c.oWins} · Unent: ${c.draws}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="TicTacToeGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=20});}
};
window.TicTacToeGame = TicTacToeGame;

// ============================================================
// WEIGHT ESTIMATION — Gewicht schätzen
// ============================================================
const WeightGame = {
  current:null,_lastConfig:null,
  _qs:[
    {q:'Was ist schwerer?',a:'🐘 Elefant (6000kg)',b:'🚗 Auto (1500kg)',correct:'a'},
    {q:'Was ist schwerer?',a:'🍎 Apfel (200g)',b:'🍇 Weintraube (5g)',correct:'a'},
    {q:'Was ist schwerer?',a:'🐭 Maus (20g)',b:'🐱 Katze (4kg)',correct:'b'},
    {q:'Was wiegt mehr?',a:'💧 1 Liter Wasser (1kg)',b:'🪶 1 Feder (0.01g)',correct:'a'},
    {q:'Was ist schwerer?',a:'🚀 Rakete (500 Tonnen)',b:'✈️ Flugzeug (80 Tonnen)',correct:'a'},
    {q:'Was wiegt mehr?',a:'🧲 Eisenkugel (1kg)',b:'🎈 Luftballon (2g)',correct:'a'},
    {q:'Was ist schwerer?',a:'📱 Handy (200g)',b:'💻 Laptop (2kg)',correct:'b'},
    {q:'Was wiegt mehr?',a:'🐋 Blauwal (150 Tonnen)',b:'🦏 Nashorn (2 Tonnen)',correct:'a'},
    {q:'Was ist schwerer?',a:'🥚 Ei (60g)',b:'🥪 Sandwich (200g)',correct:'b'},
    {q:'Was wiegt mehr?',a:'🧲 1kg Eisen',b:'🪶 1kg Federn',correct:'gleich'},
  ],
  start(config){
    WeightGame._lastConfig=config;
    const qs=[...this._qs].sort(()=>Math.random()-0.5).slice(0,8);
    this.current={qs,index:0,errors:0,startTime:Date.now(),onComplete:config.onComplete};
    this._render();
  },
  _render(){
    const c=this.current;
    if(c.index>=c.qs.length){this._showResult();return;}
    const q=c.qs[c.index];
    const opts=q.correct==='gleich'
      ? [{label:q.a,key:'a'},{label:q.b,key:'b'},{label:'⚖️ Gleich schwer',key:'gleich'}]
      : [{label:q.a,key:'a'},{label:q.b,key:'b'}];
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Frage <b>${c.index+1}/${c.qs.length}</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="font-size:3rem;margin:14px 0">⚖️</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:var(--mountain-dark);margin-bottom:18px">${q.q}</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${opts.map(o=>`<button onclick="WeightGame._ans('${o.key}','${q.correct}')"
            style="padding:16px;border-radius:14px;border:2px solid #E0E6EE;background:white;
              font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer">${o.label}</button>`).join('')}
        </div>
      </div>`;
  },
  _ans(chosen,correct){
    const c=this.current;const ok=chosen===correct;if(!ok)c.errors++;
    document.querySelectorAll('#game-area button').forEach(b=>{b.disabled=true;});
    c.index++;setTimeout(()=>this._render(),ok?600:1000);
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;const correct=c.qs.length-c.errors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/c.qs.length)*100),timeMs,errors:c.errors,passed:correct>=5});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">⚖️🏆</div><div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.qs.length} richtig!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="WeightGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.WeightGame = WeightGame;

// ============================================================
// FRENCH QUIZ — Französisch lernen
// ============================================================
const FrenchGame = {
  current:null,_lastConfig:null,
  _qs:[
    {fr:'Bonjour',de:'Guten Tag',wrong:['Gute Nacht','Auf Wiedersehen','Danke']},
    {fr:'Merci',de:'Danke',wrong:['Bitte','Entschuldigung','Hallo']},
    {fr:'Au revoir',de:'Auf Wiedersehen',wrong:['Guten Morgen','Danke','Bitte']},
    {fr:'Oui',de:'Ja',wrong:['Nein','Vielleicht','Nie']},
    {fr:'Non',de:'Nein',wrong:['Ja','Manchmal','Immer']},
    {fr:"S'il vous plaît",de:'Bitte',wrong:['Danke','Entschuldigung','Ja']},
    {fr:'Chat',de:'Katze',wrong:['Hund','Maus','Vogel']},
    {fr:'Chien',de:'Hund',wrong:['Katze','Pferd','Fisch']},
    {fr:'Maison',de:'Haus',wrong:['Auto','Schule','Park']},
    {fr:"L'eau",de:'Wasser',wrong:['Milch','Saft','Brot']},
    {fr:'Pain',de:'Brot',wrong:['Butter','Käse','Milch']},
    {fr:'Fromage',de:'Käse',wrong:['Brot','Wein','Apfel']},
    {fr:'Vin',de:'Wein',wrong:['Bier','Saft','Wasser']},
    {fr:'Château',de:'Schloss',wrong:['Turm','Kirche','Brücke']},
    {fr:'Soleil',de:'Sonne',wrong:['Mond','Stern','Wolke']},
    {fr:'Piscine',de:'Schwimmbad',wrong:['Strand','See','Fluss']},
    {fr:'Vélo',de:'Fahrrad',wrong:['Auto','Zug','Bus']},
    {fr:'Restaurant',de:'Restaurant',wrong:['Supermarkt','Schule','Hotel']},
    {fr:'Football',de:'Fussball',wrong:['Tennis','Basketball','Volleyball']},
    {fr:'Valise',de:'Koffer',wrong:['Rucksack','Tasche','Box']},
  ],
  start(config){
    FrenchGame._lastConfig=config;
    const qs=[...this._qs].sort(()=>Math.random()-0.5).slice(0,10);
    this.current={qs,index:0,errors:0,startTime:Date.now(),onComplete:config.onComplete};
    this._render();
  },
  _render(){
    const c=this.current;if(c.index>=c.qs.length){this._showResult();return;}
    const q=c.qs[c.index];
    const opts=[q.de,...q.wrong].sort(()=>Math.random()-0.5);
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Frage <b>${c.index+1}/10</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border-radius:14px;padding:20px;margin-bottom:16px">
          <div style="font-size:0.8rem;color:var(--text-mid);margin-bottom:4px">🇫🇷 Was bedeutet auf Deutsch:</div>
          <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:var(--mountain-dark)">${q.fr}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${opts.map(o=>`<button onclick="FrenchGame._ans('${o.replace(/'/g,"\\'")}','${q.de.replace(/'/g,"\\'")}')"
            style="padding:14px;border-radius:14px;border:2px solid #E0E6EE;background:white;
              font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer">${o}</button>`).join('')}
        </div>
      </div>`;
  },
  _ans(chosen,correct){
    const c=this.current;const ok=chosen===correct;if(!ok)c.errors++;
    document.querySelectorAll('#game-area button').forEach(b=>{b.disabled=true;
      if(b.textContent===correct)b.style.cssText+='background:#27AE60;color:white;border-color:#27AE60';
      if(b.textContent===chosen&&!ok)b.style.cssText+='background:#E74C3C;color:white';
    });
    c.index++;setTimeout(()=>this._render(),900);
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;const correct=10-c.errors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/10)*100),timeMs,errors:c.errors,passed:correct>=6});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">🇫🇷🏆</div><div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/10 Wörter!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="FrenchGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.FrenchGame = FrenchGame;

// ============================================================
// RIDDLES — Rätsel
// ============================================================
const RiddleGame = {
  current:null,_lastConfig:null,
  _qs:[
    {r:'Ich habe Zeiger aber keine Hände. Was bin ich?',a:'Eine Uhr',w:['Ein Kompass','Ein Lineal','Ein Kalender']},
    {r:'Ich bin immer vor dir aber kann nicht gesehen werden. Was bin ich?',a:'Die Zukunft',w:['Der Schatten','Der Wind','Die Vergangenheit']},
    {r:'Was hat viele Zähne aber kaut nie?',a:'Ein Kamm',w:['Eine Bürste','Eine Säge','Eine Gabel']},
    {r:'Was läuft aber hat keine Beine?',a:'Wasser',w:['Der Wind','Ein Geist','Die Zeit']},
    {r:'Ich werde nasser je mehr ich trockne. Was bin ich?',a:'Ein Handtuch',w:['Ein Schwamm','Eine Wäsche','Ein Fisch']},
    {r:'Was hat ein Gesicht aber keine Augen?',a:'Eine Münze',w:['Ein Kissen','Ein Spiegel','Ein Buch']},
    {r:'Was kann man immer brechen ohne es zu berühren?',a:'Ein Versprechen',w:['Ein Rekord','Eine Stille','Eine Welle']},
    {r:'Ich habe Städte aber keine Häuser. Was bin ich?',a:'Eine Landkarte',w:['Ein Buch','Ein Puzzle','Ein Atlas']},
    {r:'Was ist leichter: eine Tonne Federn oder eine Tonne Eisen?',a:'Gleich schwer',w:['Federn','Eisen','Kommt darauf an']},
    {r:'Was fliegt den ganzen Tag und kommt nie vom Fleck?',a:'Eine Fahne',w:['Ein Drachen','Eine Biene','Ein Vogel']},
  ],
  start(config){
    RiddleGame._lastConfig=config;
    const qs=[...this._qs].sort(()=>Math.random()-0.5).slice(0,6);
    this.current={qs,index:0,errors:0,startTime:Date.now(),onComplete:config.onComplete};
    this._render();
  },
  _render(){
    const c=this.current;if(c.index>=c.qs.length){this._showResult();return;}
    const q=c.qs[c.index];
    const opts=[q.a,...q.w].sort(()=>Math.random()-0.5);
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Rätsel <b>${c.index+1}/${c.qs.length}</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="font-size:3rem;margin:10px 0">🤔</div>
        <div style="background:linear-gradient(135deg,#FEF9E7,#FDEBD0);border:2px solid #F39C12;
          border-radius:16px;padding:20px;margin-bottom:18px;font-size:1rem;color:var(--mountain-dark);line-height:1.5">
          "${q.r}"
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${opts.map(o=>`<button onclick="RiddleGame._ans(${JSON.stringify(o)},${JSON.stringify(q.a)})"
            style="padding:14px;border-radius:14px;border:2px solid #E0E6EE;background:white;
              font-family:'Fredoka One',cursive;font-size:0.95rem;cursor:pointer">${o}</button>`).join('')}
        </div>
      </div>`;
  },
  _ans(chosen,correct){
    const c=this.current;const ok=chosen===correct;if(!ok)c.errors++;
    document.querySelectorAll('#game-area button').forEach(b=>{b.disabled=true;
      if(b.textContent===correct)b.style.cssText+='background:#27AE60;color:white;border-color:#27AE60';
      if(b.textContent===chosen&&!ok)b.style.cssText+='background:#E74C3C;color:white';
    });
    c.index++;setTimeout(()=>this._render(),ok?700:1200);
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;const correct=c.qs.length-c.errors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/c.qs.length)*100),timeMs,errors:c.errors,passed:correct>=3});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">🤔🏆</div><div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.qs.length} Rätsel!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#FEF9E7;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="RiddleGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.RiddleGame = RiddleGame;

// ============================================================
// GEO QUIZ — Wo liegt das?
// ============================================================
const GeoGame = {
  current:null,_lastConfig:null,
  _qs:[
    {q:'Paris liegt in...',a:'Frankreich',w:['Deutschland','Belgien','Spanien']},
    {q:'Der Eiffelturm ist in...',a:'Frankreich',w:['Italien','England','Österreich']},
    {q:'Bern ist die Hauptstadt von...',a:'Schweiz',w:['Österreich','Deutschland','Liechtenstein']},
    {q:'Die Alpen liegen in...',a:'Europa',w:['Asien','Afrika','Amerika']},
    {q:'Nizza liegt in...',a:'Frankreich',w:['Italien','Spanien','Monaco']},
    {q:'Der Rhein fliesst durch...',a:'Deutschland',w:['Frankreich','Polen','Dänemark']},
    {q:'Genf liegt in der...',a:'Schweiz',w:['Frankreich','Italien','Deutschland']},
    {q:'Die Côte d\'Azur ist die Küste von...',a:'Frankreich',w:['Spanien','Italien','Portugal']},
    {q:'Strasbourg liegt an der Grenze zwischen Frankreich und...',a:'Deutschland',w:['Belgien','Schweiz','Luxemburg']},
    {q:'Mont Blanc ist der höchste Berg von...',a:'Europa',w:['Asien','Afrika','Nordamerika']},
  ],
  start(config){
    GeoGame._lastConfig=config;
    const qs=[...this._qs].sort(()=>Math.random()-0.5).slice(0,8);
    this.current={qs,index:0,errors:0,startTime:Date.now(),onComplete:config.onComplete};
    this._render();
  },
  _render(){
    const c=this.current;if(c.index>=c.qs.length){this._showResult();return;}
    const q=c.qs[c.index];
    const opts=[q.a,...q.w].sort(()=>Math.random()-0.5);
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Frage <b>${c.index+1}/${c.qs.length}</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="font-size:2.5rem;margin:10px 0">🗺️</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:var(--mountain-dark);margin-bottom:16px">${q.q}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${opts.map(o=>`<button onclick="GeoGame._ans('${o}','${q.a}')"
            style="padding:14px;border-radius:14px;border:2px solid #E0E6EE;background:white;
              font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer">${o}</button>`).join('')}
        </div>
      </div>`;
  },
  _ans(c2,correct){
    const c=this.current;const ok=c2===correct;if(!ok)c.errors++;
    document.querySelectorAll('#game-area button').forEach(b=>{b.disabled=true;
      if(b.textContent===correct)b.style.cssText+='background:#27AE60;color:white;border-color:#27AE60';
      if(b.textContent===c2&&!ok)b.style.cssText+='background:#E74C3C;color:white';
    });
    c.index++;setTimeout(()=>this._render(),900);
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;const correct=c.qs.length-c.errors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/c.qs.length)*100),timeMs,errors:c.errors,passed:correct>=5});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">🗺️🏆</div><div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.qs.length} richtig!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="GeoGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.GeoGame = GeoGame;

// ============================================================
// BASKETBALL — Tap at right time
// ============================================================
const BasketballGame = {
  current:null,_lastConfig:null,_raf:null,
  start(config){
    BasketballGame._lastConfig=config;
    this.current={shots:0,maxShots:10,scored:0,errors:0,startTime:Date.now(),power:0,dir:1,phase:'aim',onComplete:config.onComplete};
    this._render();
    this._startLoop();
  },
  _render(){
    const c=this.current;
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Wurf <b>${c.shots}/${c.maxShots}</b></span>
          <span>🏀 ${c.scored} Körbe</span>
          <span>❌ ${c.errors} daneben</span>
        </div>
        <!-- Court -->
        <div style="position:relative;background:linear-gradient(180deg,#87CEEB 0%,#87CEEB 60%,#C17F24 60%,#C17F24 100%);
          border-radius:16px;height:220px;margin-bottom:14px;overflow:hidden" id="bball-court">
          <svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
            <!-- Backboard -->
            <rect x="120" y="20" width="60" height="10" fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2"/>
            <!-- Hoop -->
            <ellipse cx="150" cy="38" rx="22" ry="5" fill="none" stroke="#E74C3C" stroke-width="3"/>
            <line x1="128" y1="38" x2="128" y2="30" stroke="#E74C3C" stroke-width="2"/>
            <line x1="172" y1="38" x2="172" y2="30" stroke="#E74C3C" stroke-width="2"/>
            <!-- Net -->
            ${Array.from({length:5},(_,i)=>`<line x1="${128+i*11}" y1="38" x2="${130+i*10}" y2="60" stroke="white" stroke-width="1" opacity="0.7"/>`).join('')}
            <!-- Floor -->
            <rect y="132" width="300" height="88" fill="#C17F24"/>
            <ellipse cx="150" cy="132" rx="60" ry="8" fill="rgba(139,90,36,0.3)"/>
            <!-- Ball -->
            <circle id="bball" cx="150" cy="180" r="18" fill="#E67E22"/>
            <path d="M135,175 Q150,165 165,175" fill="none" stroke="#8B4513" stroke-width="1.5"/>
            <path d="M135,185 Q150,175 165,185" fill="none" stroke="#8B4513" stroke-width="1.5"/>
            <line x1="150" y1="162" x2="150" y2="198" stroke="#8B4513" stroke-width="1.5"/>
          </svg>
        </div>
        <!-- Power bar -->
        <div style="font-size:0.82rem;color:var(--text-mid);margin-bottom:6px">Tippe wenn die Kraft stimmt!</div>
        <div style="background:#E0E6EE;border-radius:50px;height:24px;overflow:hidden;margin-bottom:12px;position:relative">
          <div id="bball-power" style="height:100%;background:linear-gradient(90deg,#27AE60,#E67E22,#E74C3C);border-radius:50px;width:0%;transition:none"></div>
          <div style="position:absolute;top:50%;right:12px;transform:translateY(-50%);font-size:0.7rem;color:var(--text-mid)">💪</div>
        </div>
        <button class="btn btn-primary btn-full btn-big" id="shoot-btn" onclick="BasketballGame._shoot()">
          🏀 Werfen!
        </button>
      </div>`;
  },
  _startLoop(){
    cancelAnimationFrame(this._raf);
    let last=0;
    const loop=(ts)=>{
      const c=this.current;
      if(!c||c.shots>=c.maxShots)return;
      if(ts-last>16){last=ts;
        c.power+=c.dir*2.5;
        if(c.power>=100){c.power=100;c.dir=-1;}
        if(c.power<=0){c.power=0;c.dir=1;}
        const bar=document.getElementById('bball-power');
        if(bar)bar.style.width=c.power+'%';
      }
      this._raf=requestAnimationFrame(loop);
    };
    this._raf=requestAnimationFrame(loop);
  },
  _shoot(){
    const c=this.current;
    cancelAnimationFrame(this._raf);
    c.shots++;
    // Score based on power (50-80% = perfect)
    const p=c.power;
    const scored = p>=45&&p<=85;
    if(scored)c.scored++;else c.errors++;
    // Animate ball
    const court=document.getElementById('bball-court');
    if(court){
      const msg=document.createElement('div');
      msg.style.cssText=`position:absolute;top:30%;left:50%;transform:translateX(-50%);font-family:'Fredoka One',cursive;font-size:1.4rem;color:${scored?'#27AE60':'#E74C3C'}`;
      msg.textContent=scored?'🏀 Korb!':'❌ Daneben!';
      court.appendChild(msg);
      setTimeout(()=>msg.remove(),700);
    }
    if(c.shots>=c.maxShots){setTimeout(()=>this._showResult(),800);return;}
    c.power=0;c.dir=1;
    setTimeout(()=>this._startLoop(),700);
  },
  _showResult(){
    cancelAnimationFrame(this._raf);
    const c=this.current;const timeMs=Date.now()-c.startTime;
    const score=State.calcFinalScore({rawScore:Math.round((c.scored/c.maxShots)*100),timeMs,errors:c.errors,passed:c.scored>=5});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">${c.scored>=7?'🏀🏆':'🏀😅'}</div>
      <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${c.scored}/${c.maxShots} Körbe!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Daneben</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="BasketballGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=30});}
};
window.BasketballGame = BasketballGame;

// ============================================================
// EMOJI STORY — Was passiert?
// ============================================================
const EmojiStoryGame = {
  current:null,_lastConfig:null,
  _stories:[
    {e:'🌅 → 🚗 → 🛣️ → 🏰',q:'Was passiert in dieser Geschichte?',a:'Ein Morgen-Ausflug zum Schloss',w:['Eine Nachtfahrt','Ein Unfall auf der Strasse','Ein Spaziergang im Wald']},
    {e:'☀️ → 👙 → 🏊 → 🍦',q:'Was macht die Person?',a:'Baden gehen und danach Eis essen',w:['Skifahren im Winter','Im Regen tanzen','Einkaufen gehen']},
    {e:'🎾 → 🏃 → 💦 → 🏆',q:'Was passiert?',a:'Ein Tennismatch spielen und gewinnen',w:['Eine Wanderung machen','Schwimmen und verlieren','Kochen und essen']},
    {e:'🎲 → 🤔 → 😊 → 🏆',q:'Was passiert beim Spiel?',a:'Nachdenken und das Spiel gewinnen',w:['Würfeln und verlieren','Schlafen und träumen','Arbeiten und müde werden']},
    {e:'🚴 → 🌻 → 🏡 → 😴',q:'Was passiert?',a:'Fahrradtour nach Hause und schlafen',w:['Im Auto fahren und aufwachen','Kochen und essen','Schwimmen und trocknen']},
    {e:'🥐 → ☕ → 😊 → 💪',q:'Was passiert?',a:'Frühstück essen und fit für den Tag sein',w:['Abendessen und schlafen','Sport treiben und hungrig werden','Einkaufen und kochen']},
    {e:'⚽ → 🏃 → 🥅 → 🎉',q:'Was passiert?',a:'Fussball spielen und ein Tor schiessen',w:['Basketball spielen und verlieren','Tennis spielen und unentschieden','Schwimmen und nichts gewinnen']},
    {e:'🧳 → ✈️ → 🌍 → 😊',q:'Was passiert?',a:'Mit dem Flugzeug in die Welt reisen',w:['Zu Fuss nach Hause gehen','Mit dem Auto einkaufen','Mit dem Zug in die Schule']},
    {e:'🌙 → 😴 → ☀️ → 😃',q:'Was passiert?',a:'Schlafen und ausgeruht aufwachen',w:['Träumen und weinen','Schlafen und krank werden','Tanzen und müde werden']},
    {e:'📚 → 🤓 → ✅ → 🎉',q:'Was passiert?',a:'Lernen und die Prüfung bestehen',w:['Spielen und alles vergessen','Kochen und satt werden','Schlafen und träumen']},
  ],
  start(config){
    EmojiStoryGame._lastConfig=config;
    const qs=[...this._stories].sort(()=>Math.random()-0.5).slice(0,8);
    this.current={qs,index:0,errors:0,startTime:Date.now(),onComplete:config.onComplete};
    this._render();
  },
  _render(){
    const c=this.current;if(c.index>=c.qs.length){this._showResult();return;}
    const q=c.qs[c.index];
    const opts=[q.a,...q.w].sort(()=>Math.random()-0.5);
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Geschichte <b>${c.index+1}/${c.qs.length}</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="background:linear-gradient(135deg,#FEF9E7,#FDEBD0);border:2px solid #F39C12;
          border-radius:16px;padding:20px;margin-bottom:16px">
          <div style="font-size:2rem;letter-spacing:4px;margin-bottom:8px">${q.e}</div>
          <div style="font-size:0.9rem;color:var(--text-mid)">${q.q}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${opts.map(o=>`<button onclick="EmojiStoryGame._ans(${JSON.stringify(o)},${JSON.stringify(q.a)})"
            style="padding:12px;border-radius:12px;border:2px solid #E0E6EE;background:white;
              font-size:0.88rem;cursor:pointer;text-align:left">${o}</button>`).join('')}
        </div>
      </div>`;
  },
  _ans(chosen,correct){
    const c=this.current;const ok=chosen===correct;if(!ok)c.errors++;
    document.querySelectorAll('#game-area button').forEach(b=>{b.disabled=true;
      if(b.textContent===correct)b.style.cssText+='background:#27AE60;color:white;border-color:#27AE60';
      if(b.textContent===chosen&&!ok)b.style.cssText+='background:#E74C3C;color:white';
    });
    c.index++;setTimeout(()=>this._render(),900);
  },
  _showResult(){
    const c=this.current;const timeMs=Date.now()-c.startTime;const correct=c.qs.length-c.errors;
    const score=State.calcFinalScore({rawScore:Math.round((correct/c.qs.length)*100),timeMs,errors:c.errors,passed:correct>=5});
    document.getElementById('game-area').innerHTML=`<div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem">📖🏆</div><div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.qs.length} Geschichten!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <div style="background:#FEF9E7;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
        <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${score}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
      </div>
      <button class="btn btn-primary btn-full" onclick="EmojiStoryGame._finish(${score},${timeMs},${c.errors})">Weiter ➜</button>
    </div>`;
  },
  _finish(s,t,e){if(this.current?.onComplete)this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40});}
};
window.EmojiStoryGame = EmojiStoryGame;
