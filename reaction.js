/**
 * games/reaction.js — Reaktionsspiel (mobile-optimized)
 */
const ReactionGame = {
  current: null,

  start(config) {
    const { onComplete } = config;
    this.current = {
      round:0, totalRounds:10, results:[], phase:'wait',
      timer:null, startTime:Date.now(), errors:0, onComplete, canTap:false,
    };
    this._render();
    setTimeout(()=>this._nextRound(), 900);
  },

  _render() {
    const c = this.current;
    const isMob = 'ontouchstart' in window;
    const dotsHTML = Array.from({length:c.totalRounds},(_,i)=>{
      const res=c.results[i]; let cls='pending';
      if(res!==undefined){
        const r=typeof res==='object'?res.result:res;
        cls=r==='correct'?'correct':r==='wrong'?'wrong':'pending';
      }
      return `<div style="width:clamp(22px,6vw,28px);height:clamp(22px,6vw,28px);border-radius:50%;
        background:${cls==='correct'?'#27AE60':cls==='wrong'?'#E74C3C':'#E0E6EE'};
        display:flex;align-items:center;justify-content:center;font-size:clamp(10px,3vw,12px);color:white;font-weight:700">
        ${cls==='correct'?'✓':cls==='wrong'?'✗':''}
      </div>`;
    }).join('');

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;max-width:420px;margin:0 auto;padding:${isMob?'6px 4px':'10px 8px'}">
        <div style="font-size:clamp(0.8rem,3.5vw,0.9rem);color:var(--text-mid);margin-bottom:8px">
          ${typeof t!=='undefined'?t('reaction.round'):'Runde'} ${c.round+1}/${c.totalRounds} · ❌ ${c.errors} ${typeof t!=='undefined'?t('math.errors'):'Fehler'}
        </div>
        <div id="reaction-light"
          style="width:clamp(140px,45vw,200px);height:clamp(140px,45vw,200px);border-radius:50%;
            background:#E0E6EE;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;
            font-size:clamp(2.5rem,10vw,3.5rem);border:4px solid #BDC3C7;
            box-shadow:0 4px 16px rgba(0,0,0,.1);cursor:pointer;touch-action:manipulation"
          onclick="ReactionGame._tap()">
        </div>
        <div id="reaction-rt" style="min-height:clamp(22px,5vw,28px);font-size:clamp(0.9rem,4vw,1rem);color:#27AE60;font-weight:700;margin-bottom:10px"></div>
        <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-bottom:4px">
          ${dotsHTML}
        </div>
        <div style="font-size:clamp(0.72rem,3vw,0.82rem);color:rgba(0,0,0,.35);margin-top:6px">
          ${typeof t!=='undefined'?t('reaction.legend'):'🟢 = Tippen · 🔴 = NICHT tippen'}
        </div>
      </div>`;
  },

  _nextRound() {
    const c=this.current;
    if(c.round>=c.totalRounds){this._showResult();return;}
    const isGreen=Math.random()>0.35;
    const el=document.getElementById('reaction-light');
    if(!el)return;
    const rtEl=document.getElementById('reaction-rt');
    if(rtEl)rtEl.textContent='';
    const waitMs=900+Math.random()*1800;
    el.style.background='#E0E6EE';
    el.style.borderColor='#BDC3C7';
    el.innerHTML='';
    c.canTap=false;c.phase='wait';
    c.timer=setTimeout(()=>{
      if(!this.current)return;
      el.style.background=isGreen?'#27AE60':'#E74C3C';
      el.style.borderColor=isGreen?'#1E8449':'#C0392B';
      el.innerHTML=isGreen?'🟢':'🔴';
      c.canTap=true;c.phase='show';c._roundStart=Date.now();c._isGreen=isGreen;
      if(!isGreen){
        c.timer=setTimeout(()=>{
          if(!this.current||!c.canTap)return;
          c.results[c.round]={result:'correct',rt:null};
          c.canTap=false;c.round++;
          el.style.background='#E0E6EE';el.innerHTML='';
          this._render();
          setTimeout(()=>this._nextRound(),400);
        },1200);
      }else{
        c.timer=setTimeout(()=>{
          if(!this.current||!c.canTap)return;
          c.results[c.round]={result:'wrong',rt:null};c.errors++;
          c.canTap=false;c.round++;
          el.style.background='#E74C3C';el.innerHTML='⏰';
          if(rtEl)rtEl.textContent=typeof t!=='undefined'?t('reaction.too_slow'):'Zu langsam!';
          this._render();
          setTimeout(()=>this._nextRound(),600);
        },1800);
      }
    },waitMs);
  },

  _tap() {
    const c=this.current;if(!c||!c.canTap)return;
    clearTimeout(c.timer);c.canTap=false;
    const wasGreen=c._isGreen;
    const rt=Date.now()-c._roundStart;
    const el=document.getElementById('reaction-light');
    const rtEl=document.getElementById('reaction-rt');
    if(wasGreen){
      c.results[c.round]={result:'correct',rt};
      if(el){el.style.background='#27AE60';el.innerHTML='✅';}
      if(rtEl)rtEl.textContent=rt+' ms ⚡';
    }else{
      c.results[c.round]={result:'wrong',rt:null};c.errors++;
      if(el){el.style.background='#E74C3C';el.innerHTML='❌';}
      if(rtEl)rtEl.textContent=typeof t!=='undefined'?t('reaction.dont_tap'):'Falsch! Nicht tippen!';
    }
    c.round++;
    this._render();
    setTimeout(()=>this._nextRound(),600);
  },

  async _showResult() {
    const c=this.current;clearTimeout(c.timer);
    const correct=c.results.filter(r=>(typeof r==='object'?r.result:r)==='correct').length;
    const rts=c.results.filter(r=>typeof r==='object'&&r.rt&&r.result==='correct').map(r=>r.rt);
    const avgRt=rts.length>0?Math.round(rts.reduce((a,b)=>a+b,0)/rts.length):null;
    const timeMs=Date.now()-c.startTime;
    const rawScore=Math.round((correct/c.totalRounds)*100);
    const finalScore=State.calcFinalScore({rawScore,timeMs,errors:c.errors,passed:correct>=6});

    // Save this player's average reaction time to a shared pool (own,
    // dedicated collection — not the generic 0-100 calibration store,
    // since that tracks accuracy-based scores for every game, not raw
    // speed in ms) so a percentile comparison against everyone else who's
    // played can be shown below.
    let percentile=null;
    if(avgRt && typeof _db!=='undefined' && _db){
      try{
        const playerName=State.currentPlayer?.name||'anon';
        const dedupKey=playerName.toLowerCase()+'_'+Math.floor(Date.now()/5000);
        // Await this (with its own short timeout) — a fire-and-forget write
        // followed immediately by a read could easily miss the round just
        // played, since there was no guarantee it landed before the read
        // below ran.
        await Promise.race([
          _db.collection('reaction_times').doc(dedupKey).set({player:playerName,avgRt,ts:Date.now()}),
          new Promise(r=>setTimeout(r,1500))
        ]).catch(()=>{});
        // orderBy+limit, not just limit — without an explicit order,
        // Firestore has no obligation to return the newest documents once
        // the collection grows past the limit; it could just as easily
        // keep handing back an arbitrary older slice forever, which would
        // make it LOOK like new rounds never factor into the comparison
        // even though they're being saved correctly.
        const snap=await Promise.race([_db.collection('reaction_times').orderBy('ts','desc').limit(1000).get(),new Promise(r=>setTimeout(()=>r(null),3000))]);
        if(snap){
          const allRts=[]; snap.forEach(d=>{const v=d.data()?.avgRt; if(typeof v==='number'&&isFinite(v)&&v>0) allRts.push(v);});
          if(allRts.length>=3){
            const slower=allRts.filter(v=>v>avgRt).length;
            percentile=Math.round((slower/allRts.length)*100);
          }
        }
      }catch(e){}
    }

    // Per-round detail list
    const detailRows=c.results.map((r,i)=>{
      const res=typeof r==='object'?r.result:r;
      const rt=typeof r==='object'?r.rt:null;
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;border-radius:8px;background:${res==='correct'?'rgba(39,174,96,.08)':'rgba(231,76,60,.08)'};margin-bottom:3px">
        <span style="font-size:clamp(0.82rem,3.8vw,0.92rem);color:var(--text-dark)">${typeof t!=='undefined'?t('reaction.round'):'Runde'} ${i+1}</span>
        <span style="font-size:clamp(0.82rem,3.8vw,0.92rem);color:${res==='correct'?'#27AE60':'#E74C3C'};font-weight:700">${res==='correct'?'✓ '+( rt?rt+' ms':'OK'):'✗ '+(typeof t!=='undefined'?t('math.errors'):'Fehler')}</span>
      </div>`;
    }).join('');

    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center;max-width:420px;margin:0 auto;padding:10px 8px">
        <div style="font-size:clamp(2rem,8vw,2.5rem)">${correct>=7?'⚡🏆':'😅'}</div>
        <div style="font-size:clamp(1.3rem,5.5vw,1.7rem);font-weight:900;color:var(--mountain-dark);margin:6px 0">
          ${correct}/${c.totalRounds} ${typeof t!=='undefined'?t('math.correct_n'):'richtig!'}
        </div>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:10px 0">
          <div style="background:#E8F8F5;border-radius:10px;padding:8px 4px;font-size:clamp(0.78rem,3.5vw,0.88rem)">
            <div style="font-size:clamp(1rem,4.5vw,1.3rem)">⚡</div>
            <b style="font-size:clamp(0.9rem,4vw,1.05rem)">${avgRt?avgRt+' ms':'—'}</b>
            <div style="color:var(--text-mid);font-size:clamp(0.7rem,3vw,0.8rem)">${typeof t!=='undefined'?t('reaction.avg'):'Ø Reaktion'}</div>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:8px 4px;font-size:clamp(0.78rem,3.5vw,0.88rem)">
            <div style="font-size:clamp(1rem,4.5vw,1.3rem)">❌</div>
            <b style="font-size:clamp(0.9rem,4vw,1.05rem)">${c.errors}</b>
            <div style="color:var(--text-mid);font-size:clamp(0.7rem,3vw,0.8rem)">${typeof t!=='undefined'?t('math.errors'):'Fehler'}</div>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:8px 4px;font-size:clamp(0.78rem,3.5vw,0.88rem)">
            <div style="font-size:clamp(1rem,4.5vw,1.3rem)">⭐</div>
            <b style="font-size:clamp(0.9rem,4vw,1.05rem)">${finalScore}</b>
            <div style="color:var(--text-mid);font-size:clamp(0.7rem,3vw,0.8rem)">${typeof t!=='undefined'?t('math.points'):'Punkte'}</div>
          </div>
        </div>

        ${percentile!==null?`<div style="background:linear-gradient(135deg,rgba(155,89,182,.12),rgba(52,152,219,.12));border-radius:10px;padding:8px 12px;margin:8px 0;font-size:clamp(0.82rem,3.8vw,0.92rem);color:var(--text-dark)">
          🏅 ${(typeof t!=='undefined'?t('reaction.percentile'):'Deine Reaktion war schneller als {n}% aller Spieler!').replace('{n}',percentile)}
        </div>`:''}

        <!-- Per-round detail -->
        <div style="margin:10px 0;max-height:240px;overflow-y:auto;border-radius:10px;background:rgba(255,255,255,.5);padding:4px">
          ${detailRows}
        </div>

        <button class="btn btn-primary btn-full" onclick="ReactionGame._finish(${finalScore},${timeMs},${c.errors})">${typeof t!=='undefined'?t('game.continue'):'Weiter ➜'}</button>
      </div>`;
  },

  _finish(score,timeMs,errors){
    if(this.current?.onComplete)this.current.onComplete({rawScore:score,timeMs,errors,passed:score>=40});
  }
};
window.ReactionGame=ReactionGame;
