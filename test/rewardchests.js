// Shared reward chest system (Denkspiel + Zoo)
const RewardChests = {
  // Round 1 tiers; round 2 (after all opened) uses TIERS2
  TIERS: [
    {min:5,   name:'5 MIN TRUHE',   color:'#2ecc40', glow:'rgba(46,204,64,.6)',  hell:0.05,  dist:[0.60,0.35,0.045,0.005,0.0]},
    {min:10,  name:'10 MIN TRUHE',  color:'#0074d9', glow:'rgba(0,116,217,.6)',  hell:0.03,  dist:[0.45,0.42,0.10,0.03,0.0]},
    {min:30,  name:'30 MIN TRUHE',  color:'#b10dc9', glow:'rgba(177,13,201,.6)', hell:0.01,  dist:[0.25,0.45,0.22,0.075,0.005]},
    {min:60,  name:'60 MIN TRUHE',  color:'#ff851b', glow:'rgba(255,133,27,.6)', hell:0.007, dist:[0.10,0.38,0.32,0.18,0.02]},
    {min:120, name:'120 MIN TRUHE', color:'#ffd700', glow:'rgba(255,215,0,.7)',  hell:0.005, dist:[0.02,0.20,0.35,0.355,0.075]},
  ],
  TIERS2: [
    {min:5,   name:'5 MIN TRUHE+',  color:'#2ecc40', glow:'rgba(46,204,64,.6)',  hell:0.03,  dist:[0.45,0.42,0.10,0.03,0.0]},
    {min:10,  name:'10 MIN TRUHE+', color:'#0074d9', glow:'rgba(0,116,217,.6)',  hell:0.01,  dist:[0.25,0.45,0.22,0.075,0.005]},
    {min:30,  name:'30 MIN TRUHE+', color:'#b10dc9', glow:'rgba(177,13,201,.6)', hell:0.007, dist:[0.10,0.38,0.32,0.18,0.02]},
    {min:60,  name:'60 MIN TRUHE+', color:'#ff851b', glow:'rgba(255,133,27,.6)', hell:0.005, dist:[0.02,0.20,0.35,0.355,0.075]},
    {min:120, name:'120 MIN TRUHE+',color:'#9b59ff', glow:'rgba(155,89,255,.8)', hell:0.0,   dist:[0.0,0.05,0.15,0.30,0.50], space:true},
  ],
  RARITIES:[
    {id:'normal',    name:'Normal',        bg:'#7f8c8d'},
    {id:'rare',      name:'Selten',        bg:'#3498db'},
    {id:'epic',      name:'Episch',        bg:'#9b59b6'},
    {id:'superepic', name:'Super-Episch',  bg:'#e74c3c'},
    {id:'overdim',   name:'Überdimensional',bg:'#7b2fff'},
  ],
  _tiers(){ return this._round()>=2 ? this.TIERS2 : this.TIERS; },
  _round(){ try{ return parseInt(sessionStorage.getItem('mischa_chest_round')||'1'); }catch(e){ return 1; } },
  _setRound(r){ try{ sessionStorage.setItem('mischa_chest_round',String(r)); }catch(e){} },

  // ── professional SVG treasure chest ──
  _chestSVG(color, size, opened, space){
    size=size||90;
    const dark=this._darken(color,0.6), light=this._lighten(color,0.3);
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 100 100" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.5))">'+
      (space?'<defs><radialGradient id="sp'+size+'" cx="50%" cy="40%"><stop offset="0%" stop-color="#b388ff"/><stop offset="100%" stop-color="#2a0a5e"/></radialGradient></defs>':'')+
      '<path d="M15 42 Q50 18 85 42 L85 50 L15 50 Z" fill="'+(space?'url(#sp'+size+')':light)+'" stroke="#c0c0c8" stroke-width="3"/>'+
      '<rect x="15" y="50" width="70" height="34" rx="3" fill="'+(space?'url(#sp'+size+')':color)+'" stroke="#c0c0c8" stroke-width="3"/>'+
      '<line x1="15" y1="62" x2="85" y2="62" stroke="'+dark+'" stroke-width="2"/>'+
      '<line x1="15" y1="73" x2="85" y2="73" stroke="'+dark+'" stroke-width="2"/>'+
      '<rect x="28" y="40" width="7" height="44" fill="#b8b8c0" stroke="#888" stroke-width="1"/>'+
      '<rect x="65" y="40" width="7" height="44" fill="#b8b8c0" stroke="#888" stroke-width="1"/>'+
      '<rect x="44" y="56" width="12" height="14" rx="2" fill="#d0d0d8" stroke="#888" stroke-width="1.5"/>'+
      '<circle cx="50" cy="62" r="2.5" fill="#444"/>'+
      (space?'<circle cx="35" cy="46" r="1.2" fill="#fff"/><circle cx="62" cy="44" r="1" fill="#fff"/><circle cx="50" cy="55" r="1.3" fill="#ffe"/>':'')+
      (opened?'<text x="50" y="38" font-size="16" text-anchor="middle">📭</text>':'')+
    '</svg>';
  },
  _darken(hex,f){ return this._shade(hex,-f); },
  _lighten(hex,f){ return this._shade(hex,f); },
  _shade(hex,f){ try{ hex=hex.replace('#','');let r=parseInt(hex.substr(0,2),16),g=parseInt(hex.substr(2,2),16),b=parseInt(hex.substr(4,2),16);if(f<0){r=Math.round(r*(1+f));g=Math.round(g*(1+f));b=Math.round(b*(1+f));}else{r=Math.round(r+(255-r)*f);g=Math.round(g+(255-g)*f);b=Math.round(b+(255-b)*f);}return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,x)).toString(16).padStart(2,'0')).join('');}catch(e){return hex;} },

  // ── SOUNDS (Web Audio, synthetic) ──
  _ac(){ try{ if(!this._actx)this._actx=new(window.AudioContext||window.webkitAudioContext)(); if(this._actx.state==='suspended')this._actx.resume(); return this._actx; }catch(e){ return null; } },
  _unlockAudio(){
    // iPad/Safari: AudioContext must be created+resumed inside a user gesture, and primed with a silent blip
    try{
      const a=this._ac(); if(!a)return;
      if(a.state==='suspended')a.resume();
      const o=a.createOscillator(),g=a.createGain(); g.gain.value=0.0001; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.02);
      this._audioUnlocked=true;
    }catch(e){}
  },
  _initAudioUnlock(){
    if(this._audioInit)return; this._audioInit=true;
    const unlock=()=>{ this._unlockAudio(); };
    ['touchstart','touchend','pointerdown','mousedown','click','keydown'].forEach(ev=>{
      document.addEventListener(ev, unlock, {passive:true});
    });
  },
  _beep(freq,dur,type,vol){ const a=this._ac(); if(!a)return; const o=a.createOscillator(),g=a.createGain(); o.type=type||'sine'; o.frequency.value=freq; g.gain.setValueAtTime(vol||0.2,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+(dur||0.15)); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+(dur||0.15)); },
  _sndClick(){ this._beep(420+Math.random()*80,0.12,'square',0.12); },
  _sndSuperEpic(){ const a=this._ac(); if(!a)return; [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this._beep(f,0.3,'sawtooth',0.18),i*90)); },
  _sndHell(){ const a=this._ac(); if(!a)return; this._beep(110,0.5,'sawtooth',0.25); setTimeout(()=>this._beep(80,0.6,'square',0.22),150); },
  _sndOverdim(){ const a=this._ac(); if(!a)return; [392,523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>this._beep(f,0.35,'triangle',0.18),i*80)); },
  _sndStar(){ const a=this._ac(); if(!a)return; const o=a.createOscillator(),g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(1800,a.currentTime); o.frequency.exponentialRampToValueAtTime(200,a.currentTime+0.5); g.gain.setValueAtTime(0.25,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.6); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.6); },

  // ── timing ──
  _startTs(){ let t=0; try{ t=parseInt(sessionStorage.getItem('mischa_session_start')||'0'); }catch(e){} if(!t){ t=Date.now(); try{sessionStorage.setItem('mischa_session_start',String(t));}catch(e){} } return t; },
  _opened(){ try{ return JSON.parse(sessionStorage.getItem('mischa_chests_opened')||'[]'); }catch(e){ return []; } },
  _markOpened(min){ const o=this._opened(); if(!o.includes(min)){o.push(min);try{sessionStorage.setItem('mischa_chests_opened',JSON.stringify(o));}catch(e){}}
    // if all opened → start round 2 and reset timer
    if(this._tiers().every(t=>this._opened().includes(t.min))){
      this._setRound(this._round()+1);
      try{ sessionStorage.setItem('mischa_chests_opened','[]'); sessionStorage.setItem('mischa_session_start',String(Date.now())); }catch(e){}
    }
  },
  _minsPlayed(){ return (Date.now()-this._startTs())/60000; },
  _isReady(tier){ return this._minsPlayed()>=tier.min && !this._opened().includes(tier.min); },
  _anyReady(){ return this._tiers().some(t=>this._isReady(t)); },
  updateBadge(){ const b=document.getElementById('reward-badge'); if(b) b.style.display = this._anyReady() ? 'block' : 'none'; const b2=document.getElementById('reward-badge-zoo'); if(b2) b2.style.display=this._anyReady()?'block':'none'; },
  startBadgeTimer(){ if(this._badgeIv)clearInterval(this._badgeIv); this._badgeIv=setInterval(()=>this.updateBadge(),5000); this.updateBadge(); },

  // ── place check ──
  _hasZoo(){ try{ return !!(typeof ZS!=='undefined' && ZS.zoo); }catch(e){ return false; } },
  _hasFreeSlot(){ try{ const z=ZS.zoo; if(!z||!z.enc)return false; return z.enc.some(e=>!e||!e.animal) || z.enc.length<(ZS.maxE?ZS.maxE():5); }catch(e){ return false; } },

  // ── chest list page ──
  open(){
    this._initAudioUnlock(); this._unlockAudio();
    document.getElementById('chest-overlay')?.remove();
    const tiers=this._tiers(); const round=this._round();
    const cards=tiers.map(t=>{
      const ready=this._isReady(t); const opened=this._opened().includes(t.min);
      const minsLeft=Math.max(0,t.min-this._minsPlayed());
      const mm=String(Math.floor(minsLeft)).padStart(2,'0'), ss=String(Math.floor((minsLeft%1)*60)).padStart(2,'0');
      return '<div style="flex:1;min-width:150px;max-width:240px;background:linear-gradient(180deg,'+t.color+'22,'+t.color+'08);border:2px solid '+t.color+';border-radius:16px;padding:14px;text-align:center;box-shadow:0 0 24px '+t.glow+'">'+
        '<div style="font-size:clamp(1rem,4vw,1.3rem);font-weight:900;color:'+t.color+';text-shadow:0 0 10px '+t.glow+';margin-bottom:10px">'+t.name+'</div>'+
        '<div style="margin:6px 0;display:flex;justify-content:center">'+this._chestSVG(t.color,90,opened,t.space)+'</div>'+
        (opened
          ? '<div style="color:rgba(255,255,255,.4);font-weight:700;margin-top:8px">Schon geöffnet</div>'
          : ready
            ? '<div style="color:'+t.color+';font-weight:900;margin:8px 0">Bereit zum Öffnen!</div><button onclick="RewardChests.openChest('+t.min+')" style="width:100%;background:linear-gradient(135deg,'+t.color+','+t.color+'cc);color:#fff;border:none;padding:11px;border-radius:10px;font-weight:900;font-size:1rem;cursor:pointer;text-shadow:0 1px 2px rgba(0,0,0,.4)">ÖFFNEN</button>'
            : '<div style="color:rgba(255,255,255,.6);font-size:.85rem;margin-top:6px">Öffne in:</div><div style="background:#000;border-radius:8px;padding:6px;margin-top:4px;font-size:1.1rem;font-weight:900">🕐 '+mm+':'+ss+'</div>'
        )+
        (t.min===120?'<div style="font-size:.62rem;color:'+t.color+';margin-top:6px;font-weight:700">ENTHÄLT SEHR SELTENE BELOHNUNGEN!</div>':'')+
      '</div>';
    }).join('');
    const ov=document.createElement('div');
    ov.id='chest-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:99970;background:linear-gradient(160deg,#0a0e1a,#161b2e);overflow:auto;font-family:Arial,sans-serif;color:#fff';
    ov.innerHTML=
      '<div style="position:sticky;top:0;background:repeating-linear-gradient(45deg,#1a1a1a,#1a1a1a 14px,#3a1010 14px,#3a1010 28px);border-bottom:2px solid #c0392b;padding:10px;text-align:center;z-index:5">'+
        '<button onclick="document.getElementById(\'chest-overlay\').remove()" style="position:absolute;left:12px;top:8px;background:rgba(255,255,255,.15);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:1.2rem;cursor:pointer">✕</button>'+
        '<span style="color:#e74c3c;font-weight:900;font-size:clamp(.8rem,3.2vw,1rem)">⚠️ WENN DU DAS SPIEL SCHLIESST, WERDEN DIE BELOHNUNGEN ZURÜCKGESETZT!</span>'+
      '</div>'+
      '<div style="text-align:center;padding:14px"><h1 style="margin:6px 0;font-size:clamp(1.3rem,6vw,2rem);background:linear-gradient(90deg,#FFD700,#FF8C00);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">🎁 Belohnungs-Truhen'+(round>=2?' — RUNDE '+round:'')+'</h1>'+
        '<div style="color:rgba(255,255,255,.55);font-size:.85rem">Spiele länger → bessere Truhen. Spielzeit: '+Math.floor(this._minsPlayed())+' Min</div>'+
        (round<2?'<div style="color:#FFD700;font-size:.8rem;margin-top:4px;font-weight:700">✨ Wenn alle Truhen abgeholt sind, gibt es VIEL bessere Belohnungen!</div>':'<div style="color:#9b59ff;font-size:.8rem;margin-top:4px;font-weight:700">🌌 Runde '+round+' — stärkere Truhen freigeschaltet!</div>')+
      '</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:0 14px 20px;max-width:900px;margin:0 auto">'+cards+'</div>'+
      '<div style="text-align:center;padding:0 14px 30px"><button onclick="RewardChests._ffTest()" style="background:rgba(255,107,0,.25);border:1px dashed #ff6b00;color:#ff6b00;padding:8px 16px;border-radius:10px;font-size:.8rem;cursor:pointer;font-weight:700">🧪 +130 Min vorspulen (Test)</button></div>';
    document.body.appendChild(ov);
  },
  _ffTest(){ try{ const t=this._startTs()-130*60000; sessionStorage.setItem('mischa_session_start',String(t)); }catch(e){} this.open(); this.updateBadge(); },

  // ── open a chest ──
  openChest(min){
    this._unlockAudio();
    const tier=this._tiers().find(t=>t.min===min); if(!tier)return;
    if(!this._isReady(tier))return;
    // roll hell first
    const isHell = Math.random() < tier.hell;
    let rarityIdx=0;
    if(!isHell){
      const r=Math.random(); let acc=0;
      for(let i=0;i<tier.dist.length;i++){ acc+=tier.dist[i]; if(r<acc){ rarityIdx=i; break; } }
    }
    // determine reward now (so we can place-check for animal rewards)
    const reward = isHell ? this._pickHell() : this._pickReward(rarityIdx);
    // place check if reward is an animal
    if(reward && reward.needsSlot){
      if(!this._hasZoo()){ /* no zoo yet → swap to non-animal */ reward._noZoo=true; }
      else if(!this._hasFreeSlot()){ alert('🦁 Du brauchst mehr Platz in deinem Zoo! Baue ein Gehege frei, dann öffne die Truhe.'); return; }
    }
    this._animState={tier,isHell,rarityIdx,reward,clicks:0,curIdx:0,isOverdim:(!isHell&&rarityIdx===4)};
    // overdimensional → special star-crash intro first
    if(this._animState.isOverdim){ this._starCrashIntro(); }
    else { this._renderOpenAnim(); }
  },

  // ── star crash intro for overdimensional ──
  _starCrashIntro(){
    document.getElementById('chest-anim')?.remove();
    const ov=document.createElement('div'); ov.id='chest-anim';
    ov.style.cssText='position:fixed;inset:0;z-index:99975;background:radial-gradient(circle at 50% 45%,#3a1a6e,#05010f);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;font-family:Arial,sans-serif;color:#fff';
    ov.innerHTML='<canvas id="star-cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>'+
      '<div id="star-txt" style="position:absolute;bottom:14%;left:0;right:0;text-align:center;font-weight:900;font-size:clamp(1rem,4.5vw,1.4rem);color:#d8b4ff;text-shadow:0 0 14px #9b59ff;z-index:2">🌌 Eine überdimensionale Kraft naht...</div>';
    document.body.appendChild(ov);
    this._unlockAudio(); this._sndOverdim();
    const cv=document.getElementById('star-cv'),ctx=cv.getContext('2d');
    let W,H; const rs=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;}; rs(); window.addEventListener('resize',rs);
    const stars=Array.from({length:90},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.3}));
    // rainbow super-epic chest drawn with the same SVG style, rasterized via emoji-free vector
    const self=this;
    const drawChest=(cx,cy,scale,space,shake)=>{
      ctx.save();
      ctx.translate(cx+(shake||0),cy);
      ctx.scale(scale,scale);
      // rainbow gradient body (super-epic) OR purple space
      let grad;
      if(space){ grad=ctx.createRadialGradient(0,-10,5,0,-10,60); grad.addColorStop(0,'#b388ff'); grad.addColorStop(1,'#2a0a5e'); }
      else { grad=ctx.createLinearGradient(-45,0,45,0); ['#ff0000','#ff8c00','#ffee00','#00ff00','#0088ff','#8800ff'].forEach((c,i,a)=>grad.addColorStop(i/(a.length-1),c)); }
      // lid
      ctx.fillStyle=grad; ctx.strokeStyle='#c0c0c8'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-45,-8); ctx.quadraticCurveTo(0,-44,45,-8); ctx.lineTo(45,0); ctx.lineTo(-45,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      // body
      ctx.fillStyle=grad; ctx.fillRect(-45,0,90,34); ctx.strokeRect(-45,0,90,34);
      // metal bands
      ctx.fillStyle='#b8b8c0'; ctx.fillRect(-20,-10,7,44); ctx.fillRect(13,-10,7,44);
      // lock
      ctx.fillStyle='#d0d0d8'; ctx.fillRect(-6,6,12,14); ctx.fillStyle='#444'; ctx.beginPath(); ctx.arc(0,12,2.5,0,7); ctx.fill();
      if(space){ ctx.fillStyle='#fff'; [[-15,-4],[12,-6],[0,5]].forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],1.2,0,7);ctx.fill();}); }
      ctx.restore();
    };
    let f=0; const TOTAL=110; const cx=()=>W/2, cy=()=>H*0.5;
    const loop=()=>{
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='rgba(10,2,25,0.45)'; ctx.fillRect(0,0,W,H);
      stars.forEach(s=>{ctx.fillStyle='rgba(255,255,255,'+(0.3+Math.random()*0.4)+')';ctx.fillRect(s.x,s.y,s.r,s.r);});
      const baseScale=Math.min(W,H)/300;
      const isSpace = f>72; // after impact → galactic chest
      const shake = (f>=66&&f<78)? (Math.random()*10-5) : 0;
      // chest grows slightly after impact
      const sc = baseScale*(isSpace?1.25:1);
      drawChest(cx(),cy(),sc,isSpace,shake);
      // incoming star aims exactly at the chest center
      if(f<66){
        const t=f/66;
        const sx=cx()+(W*0.55)*(1-t);
        const sy=cy()-(H*0.55)*(1-t);
        // glowing star
        ctx.save(); ctx.translate(sx,sy);
        ctx.shadowColor='#ffe680'; ctx.shadowBlur=25;
        ctx.font=(38+t*30)+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('⭐',0,0);
        ctx.restore();
        // trail
        ctx.strokeStyle='rgba(255,230,120,'+(0.5)+')'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+50,sy-38); ctx.stroke();
      } else if(f>=66 && f<82){
        // impact flash + sparkles
        if(f===66){ self._sndStar(); }
        const a=Math.max(0,1-(f-66)/16);
        ctx.fillStyle='rgba(255,240,180,'+a+')'; ctx.fillRect(0,0,W,H);
        // burst sparkles
        for(let i=0;i<14;i++){ const ang=i/14*Math.PI*2, rad=(f-66)*9; ctx.fillStyle='rgba(200,160,255,'+a+')'; ctx.beginPath(); ctx.arc(cx()+Math.cos(ang)*rad,cy()+Math.sin(ang)*rad,3,0,7); ctx.fill(); }
      }
      f++;
      if(f<=TOTAL){ requestAnimationFrame(loop); }
      else { try{window.removeEventListener('resize',rs);}catch(e){} const tx=document.getElementById('star-txt'); if(tx)tx.textContent='💥 Aus der Super-Episch-Truhe wurde eine ÜBERDIMENSIONALE Truhe! Tippe zum Öffnen!'; this._animState.curIdx=4; this._renderOpenAnim(); }
    };
    loop();
  },
    _renderOpenAnim(){
    const s=this._animState; if(!s)return;
    document.getElementById('chest-anim')?.remove();
    const ov=document.createElement('div'); ov.id='chest-anim';
    const isHell=s.isHell;
    const shownIdx = isHell ? -1 : Math.min(s.curIdx, s.rarityIdx);
    const r=this.RARITIES[shownIdx]||this.RARITIES[0];
    let bg=this._bgFor(isHell,r,s.isOverdim);
    ov.style.cssText='position:fixed;inset:0;z-index:99975;background:'+bg+';display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;text-align:center;padding:20px;transition:background .4s;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none';
    const label = isHell ? '🔥 HÖLLEN-TRUHE 🔥' : (s.isOverdim&&s.curIdx>=4?'🌌 ÜBERDIMENSIONAL 🌌':r.name.toUpperCase());
    const labelCol = this._colFor(isHell,r,s.isOverdim&&s.curIdx>=4);
    const chestCol = isHell?'#8b0000':(s.isOverdim&&s.curIdx>=4?'#7b2fff':r.bg);
    ov.innerHTML=
      '<div id="chest-rarity" style="font-size:clamp(1.4rem,6vw,2.1rem);font-weight:900;margin-bottom:10px;color:'+labelCol+';text-shadow:0 0 14px '+labelCol+'">'+label+'</div>'+
      '<div id="chest-3d" style="transition:transform .3s cubic-bezier(.3,1.6,.5,1);filter:drop-shadow(0 0 34px '+labelCol+')">'+this._chestSVG(chestCol,260,false,s.isOverdim&&s.curIdx>=4)+'</div>'+
      '<div id="chest-hint" style="margin-top:18px;font-size:clamp(1.1rem,4.5vw,1.4rem);font-weight:900;color:#fff;text-shadow:0 0 10px '+labelCol+'">👆 Tippe '+(5-s.clicks)+'× zum Öffnen!</div>'+
      '<div id="chest-dots" style="margin-top:12px;font-size:1.4rem;letter-spacing:6px;color:'+labelCol+'">'+'●'.repeat(s.clicks)+'○'.repeat(5-s.clicks)+'</div>';
    // Tap anywhere on the whole screen counts (touch + click), big easy hit area
    ov.onclick=()=>this._chestClick();
    ov.ontouchstart=(e)=>{ e.preventDefault(); this._chestClick(); };
    document.body.appendChild(ov);
  },
  _bgFor(isHell,r,isOverdim){
    if(isHell) return 'radial-gradient(circle at 50% 40%,#5a0000,#1a0000)';
    if(isOverdim) return 'radial-gradient(circle at 50% 40%,#3a1a6e,#05010f)';
    if(r.id==='superepic') return 'linear-gradient(135deg,#ff0000,#ff8c00,#ffee00,#00ff00,#0088ff,#8800ff)';
    return 'radial-gradient(circle at 50% 40%,'+r.bg+',#0a0a14)';
  },
  _colFor(isHell,r,overdim){ if(isHell)return '#ff3030'; if(overdim)return '#c89bff'; if(r.id==='superepic')return '#fff'; return r.bg; },
  _chestClick(){
    const s=this._animState; if(!s)return;
    // debounce so touchstart+click don't both count
    const now=Date.now(); if(this._lastClick && now-this._lastClick<250) return; this._lastClick=now;
    if(s.clicks>=5) return;
    s.clicks++; this._sndClick();
    if(s.curIdx < s.rarityIdx) s.curIdx++;
    const chest=document.getElementById('chest-3d');
    if(chest){
      chest.style.transform='rotateY('+(s.clicks*360)+'deg) scale('+(1+s.clicks*0.06)+')';
      const shownIdx2 = s.isHell ? -1 : Math.min(s.curIdx, s.rarityIdx);
      const r2=this.RARITIES[shownIdx2]||this.RARITIES[0];
      const col2 = s.isHell ? '#8b0000' : (s.isOverdim&&s.curIdx>=4?'#7b2fff':r2.bg);
      chest.innerHTML=this._chestSVG(col2,260,false,s.isOverdim&&s.curIdx>=4);
    }
    this._updateAnimVisual();
    if(s.clicks>=5){
      const sIdx=s.isHell?-1:s.rarityIdx; const rr=this.RARITIES[sIdx]||this.RARITIES[0];
      if(s.isHell)this._sndHell(); else if(s.isOverdim)this._sndOverdim(); else if(rr.id==='superepic')this._sndSuperEpic();
      setTimeout(()=>this._revealReward(),450);
    }
  },
  _updateAnimVisual(){
    const s=this._animState; if(!s)return; const ov=document.getElementById('chest-anim'); if(!ov)return;
    const shownIdx = s.isHell ? -1 : Math.min(s.curIdx, s.rarityIdx);
    const r=this.RARITIES[shownIdx]||this.RARITIES[0];
    const overdimNow=s.isOverdim&&s.curIdx>=4;
    ov.style.background=this._bgFor(s.isHell,r,overdimNow);
    const rEl=document.getElementById('chest-rarity'), hEl=document.getElementById('chest-hint'), dEl=document.getElementById('chest-dots');
    const label = s.isHell ? '🔥 HÖLLEN-TRUHE 🔥' : (overdimNow?'🌌 ÜBERDIMENSIONAL 🌌':r.name.toUpperCase());
    const labelCol = this._colFor(s.isHell,r,overdimNow);
    if(rEl){ rEl.textContent=label; rEl.style.color=labelCol; rEl.style.textShadow='0 0 14px '+labelCol; }
    if(hEl){ hEl.textContent = s.clicks>=5?'✨ Öffnet sich...':'Tippe '+(5-s.clicks)+'× zum Öffnen!'; }
    if(dEl){ dEl.textContent='●'.repeat(s.clicks)+'○'.repeat(5-s.clicks); }
  },
  _revealReward(){
    const s=this._animState; if(!s)return;
    this._markOpened(s.tier.min);
    const reward=s.reward;
    try{ reward.apply(); }catch(e){}
    const ov=document.getElementById('chest-anim'); if(!ov)return;
    const r=this.RARITIES[s.isHell?0:s.rarityIdx]||this.RARITIES[0];
    const overdim=s.isOverdim;
    const col=s.isHell?'#ff3030':(overdim?'#c89bff':(r.id==='superepic'?'#FFD700':r.bg));
    const titleTxt=s.isHell?'🔥 HÖLLEN-TRUHE 🔥':(overdim?'🌌 ÜBERDIMENSIONAL 🌌':r.name.toUpperCase()+'-TRUHE');
    ov.innerHTML=
      '<div style="font-size:clamp(1.1rem,4.5vw,1.6rem);font-weight:900;color:'+col+';text-shadow:0 0 14px '+col+';margin-bottom:10px">'+titleTxt+'</div>'+
      '<div style="font-size:5rem;margin:10px 0;animation:bounce 1s infinite">'+reward.icon+'</div>'+
      '<div style="font-size:clamp(1.2rem,5vw,1.7rem);font-weight:900;color:#fff;margin-bottom:6px">'+reward.label+'</div>'+
      '<div style="font-size:.85rem;color:rgba(255,255,255,.5);margin-bottom:20px">'+(s.isHell?'Autsch! Pech gehabt...':'Belohnung erhalten!')+'</div>'+
      '<button id="chest-claim-btn" style="background:linear-gradient(135deg,#FFD700,#FF8C00);color:#1a1a2e;border:none;padding:14px 36px;border-radius:14px;font-weight:900;font-size:1.15rem;cursor:pointer;box-shadow:0 4px 14px rgba(255,140,0,.5)">Super! ➜</button>';
    // Clear the chest-tap handlers so they don't swallow the button
    ov.onclick=null; ov.ontouchstart=null;
    const btn=document.getElementById('chest-claim-btn');
    if(btn){
      const claim=(e)=>{ if(e){e.preventDefault();e.stopPropagation();} this._closeAnim(); };
      btn.onclick=claim;
      btn.addEventListener('touchend',claim,{passive:false});
    }
    this.updateBadge();
  },
  _closeAnim(){ document.getElementById('chest-anim')?.remove(); this._animState=null; this.open(); this.updateBadge(); },

  // ── reward picking per rarity ──
  _pickReward(rarityIdx){
    const pools=[
      // normal → seltenes Tier
      [{icon:'🐾',label:'Seltenes Tier',needsSlot:true,apply:()=>this._giveAnimal('rare')}],
      // selten → episches Tier / 1000 MT / 1× Kehrmaschine gratis
      [{icon:'🦃',label:'Episches Tier',needsSlot:true,apply:()=>this._giveAnimal('epic')},
       {icon:'🌀',label:'+1000 MT',apply:()=>this._giveMT(1000)},
       {icon:'🧹',label:'1× Kehrmaschine gratis',apply:()=>this._pending('freeSweep',1)}],
      // episch → Glücksrad-Dreh
      [{icon:'🎡',label:'1 Glücksrad-Dreh',apply:()=>this._pending('spins',1)}],
      // super-episch → 1 Spin / lebenslange Versicherung
      [{icon:'🎡',label:'1 Glücksrad-Dreh',apply:()=>this._pending('spins',1)},
       {icon:'🛡️',label:'Lebenslange Versicherung!',apply:()=>this._pending('lifeInsurance',1)}],
      // überdimensional → mythisches Tier / 10% Dino
      [{icon:'🦕',label:'DINOSAURIER!',apply:()=>this._giveAnimal('dino'),needsSlot:true,_dino:true},
       {icon:'🦄',label:'Mythisches Tier!',needsSlot:true,apply:()=>this._giveAnimal('mythic')}],
    ];
    const pool=pools[rarityIdx]||pools[0];
    // overdim: 10% dino, else mythic
    if(rarityIdx===4){ return Math.random()<0.10 ? pool[0] : pool[1]; }
    return pool[Math.floor(Math.random()*pool.length)];
  },
  _pickHell(){
    const pool=[
      {icon:'💀',label:'-10.000 MT',apply:()=>this._giveMT(-10000)},
      {icon:'🔥',label:'-5.000 MT',apply:()=>this._giveMT(-5000)},
      {icon:'🚜',label:'Unfall!',apply:()=>{ try{sessionStorage.setItem('mischa_pending_accident','1');}catch(e){} }},
      {icon:'🕳️',label:'Nichts...',apply:()=>{}},
    ];
    return pool[Math.floor(Math.random()*pool.length)];
  },

  // ── reward appliers ──
  _inZoo(){ try{ return typeof ZS!=='undefined' && ZS.zoo && typeof ZG!=='undefined'; }catch(e){ return false; } },
  _giveMT(amount){
    // In the zoo, MT = zoo money (z.mt). In the menu, MT = totalScore.
    if(this._inZoo()){ const z=ZS.zoo; z.mt=Math.max(0,(z.mt||0)+amount); ZG._updHUD&&ZG._updHUD(); ZS.save&&ZS.save(); return; }
    const p=State.currentPlayer; if(!p)return; p.totalScore=Math.max(0,(p.totalScore||0)+amount); State.savePlayer&&State.savePlayer(p);
  },
  _giveAnimal(kind){
    if(this._inZoo() && this._applyAnimalNow(kind)) return;
    this._pending('animal_'+kind,1);
  },
  _applyAnimalNow(rarity){
    try{
      const z=ZS.zoo; if(!z||!z.enc)return false;
      const slot=z.enc.findIndex(e=>!e||!e.animal); if(slot<0){ if(typeof ZP!=='undefined')ZP.toast('🦁 Kein Platz für ein Tier!',3000); return true; }
      if(rarity==='dino'){ const a={id:'chest_dino',n:'Dinosaurier',e:'🦕',r:'mythic',p:0,earn:800,w:0}; z.enc[slot]={animal:a,shiny:null,traits:[],xm:1,addedAt:Date.now(),sl:0}; }
      else { let pool=(window.ANIMALS||[]).filter(a=>a.r===rarity); if(!pool.length)pool=(window.ANIMALS||[]).filter(a=>a.r==='epic'); const a=pool[Math.floor(Math.random()*pool.length)]; if(!a)return false; z.enc[slot]={animal:{...a},shiny:(rarity==='mythic'?'rainbow':null),traits:[],xm:1,addedAt:Date.now(),sl:0}; }
      ZG._encs&&ZG._encs(); ZS.save&&ZS.save();
      if(typeof ZP!=='undefined')ZP.toast('🎁 Tier erhalten!',3000);
      return true;
    }catch(e){ return false; }
  },
  _pending(key,n){
    // Apply immediately if in the zoo, else store for next zoo entry
    if(this._inZoo()){
      try{
        const z=ZS.zoo;
        if(key==='spins'){ if(typeof LW!=='undefined'){LW.spins=(LW.spins||0)+n; LW._saveSpins&&LW._saveSpins();} ZP.toast('🎡 +'+n+' Glücksrad-Dreh!',3000); ZS.save&&ZS.save(); return; }
        if(key==='freeSweep'){ z.freeSweeps=(z.freeSweeps||0)+n; ZP.toast('🧹 +'+n+'× Gratis-Kehren!',3000); ZS.save&&ZS.save(); return; }
        if(key==='treats'){ z.treats=(z.treats||0)+n; ZP.toast('🍬 +'+n+' Leckerli!',3000); ZS.save&&ZS.save(); return; }
        if(key==='tokens'){ z.tokens=(z.tokens||0)+n; ZP.toast('🥇 +'+n+' Token!',3000); ZS.save&&ZS.save(); return; }
        if(key==='lifeInsurance'){ z.insuranceActive=true; z.lifeInsurance=true; z.insuranceUntil=Date.now()+9e12; ZP.toast('🛡️ Lebenslange Versicherung!',3500); ZS.save&&ZS.save(); return; }
        if(key==='event'){ if(typeof EVENTS!=='undefined'){ setTimeout(()=>{const ev=EVENTS[Math.floor(Math.random()*EVENTS.length)]; ZG.startEv&&ZG.startEv(ev,300000);},800);} return; }
      }catch(e){}
    }
    try{ const p=JSON.parse(sessionStorage.getItem('mischa_pending_rewards')||'{}'); p[key]=(p[key]||0)+n; sessionStorage.setItem('mischa_pending_rewards',JSON.stringify(p)); }catch(e){}
  },
};
window.RewardChests = RewardChests;
