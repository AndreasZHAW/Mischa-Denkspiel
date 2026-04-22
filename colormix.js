/**
 * games/colormix.js — Farben mischen
 * Welche zwei Farben ergeben die gesuchte Farbe?
 * Tippe auf die zwei richtigen Farbflächen
 */
const ColorMixGame = {
  current: null, _lastConfig: null,
  _mixes: [
    { result:'🟢 Grün', resultColor:'#27AE60', a:'🟡 Gelb', aC:'#F1C40F', b:'🔵 Blau', bC:'#3498DB', opts:['🔴 Rot','#E74C3C','🟡 Gelb','#F1C40F','🔵 Blau','#3498DB','⚫ Schwarz','#2C3E50'] },
    { result:'🟠 Orange', resultColor:'#E67E22', a:'🔴 Rot', aC:'#E74C3C', b:'🟡 Gelb', bC:'#F1C40F', opts:['🔴 Rot','#E74C3C','🟡 Gelb','#F1C40F','🔵 Blau','#3498DB','⚪ Weiss','#ECF0F1'] },
    { result:'🟣 Lila', resultColor:'#9B59B6', a:'🔴 Rot', aC:'#E74C3C', b:'🔵 Blau', bC:'#3498DB', opts:['🔴 Rot','#E74C3C','🟡 Gelb','#F1C40F','🔵 Blau','#3498DB','🟢 Grün','#27AE60'] },
    { result:'🟤 Braun', resultColor:'#8B4513', a:'🔴 Rot', aC:'#E74C3C', b:'🟢 Grün', bC:'#27AE60', opts:['🔴 Rot','#E74C3C','🟡 Gelb','#F1C40F','🟢 Grün','#27AE60','🔵 Blau','#3498DB'] },
    { result:'🩷 Rosa', resultColor:'#FF6B9D', a:'🔴 Rot', aC:'#E74C3C', b:'⚪ Weiss', bC:'#ECF0F1', opts:['🔴 Rot','#E74C3C','⚪ Weiss','#ECF0F1','🔵 Blau','#3498DB','🟡 Gelb','#F1C40F'] },
    { result:'Türkis', resultColor:'#1ABC9C', a:'🔵 Blau', aC:'#3498DB', b:'🟢 Grün', bC:'#27AE60', opts:['🔵 Blau','#3498DB','🟢 Grün','#27AE60','🔴 Rot','#E74C3C','🟡 Gelb','#F1C40F'] },
    { result:'🟤 Dunkelrot', resultColor:'#922B21', a:'🔴 Rot', aC:'#E74C3C', b:'⚫ Schwarz', bC:'#2C3E50', opts:['🔴 Rot','#E74C3C','⚫ Schwarz','#2C3E50','⚪ Weiss','#ECF0F1','🔵 Blau','#3498DB'] },
    { result:'Hellblau', resultColor:'#85C1E9', a:'🔵 Blau', aC:'#3498DB', b:'⚪ Weiss', bC:'#ECF0F1', opts:['🔵 Blau','#3498DB','⚪ Weiss','#ECF0F1','🟡 Gelb','#F1C40F','🔴 Rot','#E74C3C'] },
    { result:'Olivgrün', resultColor:'#808000', a:'🟡 Gelb', aC:'#F1C40F', b:'⚫ Schwarz', bC:'#2C3E50', opts:['🟡 Gelb','#F1C40F','⚫ Schwarz','#2C3E50','🔴 Rot','#E74C3C','🔵 Blau','#3498DB'] },
    { result:'🟡 Hellgelb', resultColor:'#F9E79F', a:'🟡 Gelb', aC:'#F1C40F', b:'⚪ Weiss', bC:'#ECF0F1', opts:['🟡 Gelb','#F1C40F','⚪ Weiss','#ECF0F1','🔴 Rot','#E74C3C','🟢 Grün','#27AE60'] },
  ],
  start(config) {
    ColorMixGame._lastConfig = config;
    const qs = [...this._mixes].sort(()=>Math.random()-0.5).slice(0,8);
    this.current = { qs, index:0, results:[], errors:0, startTime:Date.now(), selected:[], onComplete:config.onComplete };
    this._renderQ();
  },
  _renderQ() {
    const c = this.current;
    if (c.index>=c.qs.length){ this._showResult(); return; }
    const q = c.qs[c.index];
    // Build 4 color options (pairs of label+color)
    const opts = [];
    for(let i=0;i<q.opts.length;i+=2) opts.push({label:q.opts[i],color:q.opts[i+1]});
    c.currentOpts = opts;
    c.selected = [];
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Frage <b>${c.index+1}/${c.qs.length}</b></span><span>❌ ${c.errors}</span>
        </div>
        <div style="font-size:0.9rem;color:var(--text-mid);margin-bottom:10px">Welche 2 Farben ergeben zusammen...</div>
        <!-- Result color -->
        <div style="width:120px;height:60px;border-radius:14px;background:${q.resultColor};margin:0 auto 6px;
          box-shadow:0 4px 12px rgba(0,0,0,0.2)"></div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:var(--mountain-dark);margin-bottom:16px">${q.result}?</div>
        <!-- Color options -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:280px;margin:0 auto 12px">
          ${opts.map((o,i)=>`
            <div id="copt-${i}" onclick="ColorMixGame._pick(${i})"
              style="height:70px;border-radius:14px;background:${o.color};cursor:pointer;
                display:flex;align-items:center;justify-content:center;
                font-family:'Fredoka One',cursive;font-size:0.9rem;color:${o.color==='#ECF0F1'||o.color==='#F9E79F'||o.color==='#F1C40F'?'#333':'white'};
                border:4px solid transparent;box-shadow:0 4px 10px rgba(0,0,0,0.15);transition:all 0.15s;
                text-shadow:${o.color==='#ECF0F1'||o.color==='#F9E79F'?'none':'0 1px 3px rgba(0,0,0,0.3)'}">
              ${o.label}
            </div>`).join('')}
        </div>
        <div style="font-size:0.8rem;color:var(--text-mid)">Wähle 2 Farben!</div>
        <div style="display:flex;gap:6px;justify-content:center;margin-top:8px">
          ${Array.from({length:2},(_,i)=>`
            <div style="width:36px;height:36px;border-radius:10px;background:${c.selected[i]?c.currentOpts[c.selected[i]].color:'#E0E6EE'};border:2px solid #DDD"></div>`).join('')}
        </div>
      </div>`;
  },
  _pick(i) {
    const c = this.current;
    if (c.selected.includes(i)) return;
    if (c.selected.length>=2) return;
    const el = document.getElementById(`copt-${i}`);
    if (el) { el.style.border='4px solid #2C3E50'; el.style.transform='scale(0.95)'; }
    c.selected.push(i);
    // Update selection display
    const dots = document.querySelectorAll('#game-area > div > div:last-child > div');
    if (dots[c.selected.length-1]) dots[c.selected.length-1].style.background = c.currentOpts[i].color;
    if (c.selected.length===2) {
      const q = c.qs[c.index];
      const sel = c.selected.map(i=>c.currentOpts[i]);
      const correct = sel.some(s=>s.color===q.aC) && sel.some(s=>s.color===q.bC);
      if (!correct) c.errors++;
      c.results.push(correct);
      // Feedback
      const dots2 = document.querySelectorAll('#game-area > div > div:last-child > div');
      dots2.forEach(d=>d.style.border=`3px solid ${correct?'#27AE60':'#E74C3C'}`);
      if (!correct) {
        // Show correct
        [q.aC,q.bC].forEach(col=>{
          const idx = c.currentOpts.findIndex(o=>o.color===col);
          const el2 = document.getElementById(`copt-${idx}`);
          if (el2) { el2.style.border='4px solid #27AE60'; el2.style.transform='scale(1.05)'; }
        });
      }
      c.index++;
      setTimeout(()=>this._renderQ(), correct?700:1400);
    }
  },
  _showResult() {
    const c = this.current;
    const timeMs = Date.now()-c.startTime;
    const correct = c.results.filter(Boolean).length;
    const finalScore = State.calcFinalScore({rawScore:Math.round((correct/c.qs.length)*100),timeMs,errors:c.errors,passed:correct>=5});
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🎨🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">${correct}/${c.qs.length} richtig!</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span></div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehler</span></div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem"><div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="ColorMixGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },
  _finish(s,t,e){ if(this.current?.onComplete) this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=40}); }
};
window.ColorMixGame = ColorMixGame;
