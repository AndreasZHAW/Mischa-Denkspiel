// Shared reward chest system — Denkspiel + Zoo (v239)
const RewardChests = {
  // ── TIER CONFIG ──
  // hell = chance for hell chest (rolled first)
  // upChance = per-click upgrade probability (Brawl-Stars style)
  TIERS: [
    {min:5,   name:'5 MIN TRUHE',   color:'#2ecc40', glow:'rgba(46,204,64,.6)',   hell:0.08,  upChance:0.40},
    {min:10,  name:'10 MIN TRUHE',  color:'#0074d9', glow:'rgba(0,116,217,.6)',   hell:0.06,  upChance:0.50},
    {min:30,  name:'30 MIN TRUHE',  color:'#b10dc9', glow:'rgba(177,13,201,.6)',  hell:0.04,  upChance:0.60},
    {min:60,  name:'60 MIN TRUHE',  color:'#ff851b', glow:'rgba(255,133,27,.6)',  hell:0.02,  upChance:0.72},
    {min:120, name:'120 MIN TRUHE', color:'#ffd700', glow:'rgba(255,215,0,.7)',   hell:0.008, upChance:0.85},
  ],
  TIERS2: [
    {min:5,   name:'5 MIN TRUHE+',  color:'#2ecc40', glow:'rgba(46,204,64,.6)',   hell:0.06,  upChance:0.50},
    {min:10,  name:'10 MIN TRUHE+', color:'#0074d9', glow:'rgba(0,116,217,.6)',   hell:0.04,  upChance:0.60},
    {min:30,  name:'30 MIN TRUHE+', color:'#b10dc9', glow:'rgba(177,13,201,.6)',  hell:0.02,  upChance:0.72},
    {min:60,  name:'60 MIN TRUHE+', color:'#ff851b', glow:'rgba(255,133,27,.6)',  hell:0.008, upChance:0.85},
    {min:120, name:'120 MIN TRUHE+',color:'#9b59ff', glow:'rgba(155,89,255,.8)',  hell:0.0,   upChance:0.92, space:true},
  ],
  // Rarity tiers (index 0-4)
  RARITIES:[
    {id:'normal',    name:'Normal',          bg:'#7f8c8d'},
    {id:'rare',      name:'Selten',          bg:'#3498db'},
    {id:'epic',      name:'Episch',          bg:'#9b59b6'},
    {id:'superepic', name:'Super-Episch',    bg:'#e74c3c'},
    {id:'overdim',   name:'Überdimensional', bg:'#7b2fff'},
  ],
  _tiers(){ return this._round()>=2 ? this.TIERS2 : this.TIERS; },
  _round(){ try{ return parseInt(sessionStorage.getItem('mischa_chest_round')||'1'); }catch(e){ return 1; } },
  _setRound(r){ try{ sessionStorage.setItem('mischa_chest_round',String(r)); }catch(e){} },

  // ── SVG CHEST ──
  _chestSVG(color, size, opened, space){
    size=size||90;
    const dark=this._darken(color,0.6), light=this._lighten(color,0.3);
    const spGrad=space?'<defs><radialGradient id="spg'+size+'" cx="50%" cy="40%"><stop offset="0%" stop-color="#b388ff"/><stop offset="100%" stop-color="#2a0a5e"/></radialGradient></defs>':'';
    const fill=space?'url(#spg'+size+')':null;
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 100 100" style="filter:drop-shadow(0 4px 12px rgba(0,0,0,.6))">'+spGrad+
      '<path d="M15 42 Q50 18 85 42 L85 50 L15 50 Z" fill="'+(fill||light)+'" stroke="#c0c0c8" stroke-width="3"/>'+
      '<rect x="15" y="50" width="70" height="34" rx="3" fill="'+(fill||color)+'" stroke="#c0c0c8" stroke-width="3"/>'+
      '<line x1="15" y1="62" x2="85" y2="62" stroke="'+dark+'" stroke-width="2"/>'+
      '<line x1="15" y1="73" x2="85" y2="73" stroke="'+dark+'" stroke-width="2"/>'+
      '<rect x="28" y="40" width="7" height="44" fill="#b8b8c0" stroke="#888" stroke-width="1"/>'+
      '<rect x="65" y="40" width="7" height="44" fill="#b8b8c0" stroke="#888" stroke-width="1"/>'+
      '<rect x="44" y="56" width="12" height="14" rx="2" fill="#d0d0d8" stroke="#888" stroke-width="1.5"/>'+
      '<circle cx="50" cy="62" r="2.5" fill="#444"/>'+
      (space?'<circle cx="32" cy="46" r="1.5" fill="rgba(255,255,255,.9)"/><circle cx="60" cy="44" r="1.2" fill="rgba(255,255,255,.8)"/><circle cx="48" cy="54" r="1" fill="rgba(255,255,255,.7)"/>':'')+
    '</svg>';
  },
  _darken(hex,f){ return this._shade(hex,-f); },
  _lighten(hex,f){ return this._shade(hex,f); },
  _shade(hex,f){ try{ hex=hex.replace('#',''); let r=parseInt(hex.substr(0,2),16),g=parseInt(hex.substr(2,2),16),b=parseInt(hex.substr(4,2),16); if(f<0){r=Math.round(r*(1+f));g=Math.round(g*(1+f));b=Math.round(b*(1+f));}else{r=Math.round(r+(255-r)*f);g=Math.round(g+(255-g)*f);b=Math.round(b+(255-b)*f);} return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,x)).toString(16).padStart(2,'0')).join(''); }catch(e){return hex;} },

  // ── SOUNDS (Web Audio — musical, not beepy) ──
  _ac(){
    try{
      if(!this._actx) this._actx=new(window.AudioContext||window.webkitAudioContext)();
      if(this._actx.state==='suspended') this._actx.resume();
      return this._actx;
    }catch(e){ return null; }
  },
  _unlockAudio(){
    try{ const a=this._ac(); if(!a)return; if(a.state==='suspended')a.resume(); const o=a.createOscillator(),g=a.createGain(); g.gain.value=0.0001; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.02); this._audioUnlocked=true; }catch(e){}
  },
  _initAudioUnlock(){
    if(this._audioInit)return; this._audioInit=true;
    const u=()=>this._unlockAudio();
    ['touchstart','touchend','pointerdown','mousedown','click','keydown'].forEach(ev=>document.addEventListener(ev,u,{passive:true}));
  },
  // Musical click — a gentle xylophone-like tap
  _sndClick(){
    const a=this._ac(); if(!a)return;
    const notes=[523,659,784,880,1047]; // C5 E5 G5 A5 C6
    const note=notes[Math.floor(Math.random()*notes.length)];
    const o=a.createOscillator(),g=a.createGain();
    o.type='triangle'; o.frequency.value=note;
    g.gain.setValueAtTime(0.18,a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.25);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.25);
  },
  // Upgrade sound — ascending glimmer
  _sndUpgrade(rarityIdx){
    const a=this._ac(); if(!a)return;
    const chords=[[523,659],[659,784,988],[784,988,1319],[880,1108,1568],[523,659,784,1047,1319]];
    const chord=chords[Math.min(rarityIdx,4)];
    chord.forEach((f,i)=>{
      setTimeout(()=>{
        const o=a.createOscillator(),g=a.createGain();
        o.type='sine'; o.frequency.value=f;
        g.gain.setValueAtTime(0.15,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.4);
        o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.4);
      },i*55);
    });
  },
  // Super-epic fanfare — triumphant ascending arpeggio
  _sndSuperEpic(){
    const a=this._ac(); if(!a)return;
    const seq=[523,659,784,1047,1319,1568];
    seq.forEach((f,i)=>setTimeout(()=>{
      const o=a.createOscillator(),g=a.createGain();
      o.type='sawtooth'; o.frequency.value=f;
      g.gain.setValueAtTime(0.18,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.35);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.35);
    },i*80));
  },
  // Hell sound — dark descending rumble
  _sndHell(){
    const a=this._ac(); if(!a)return;
    [220,185,155,130,110].forEach((f,i)=>setTimeout(()=>{
      const o=a.createOscillator(),g=a.createGain();
      o.type='sawtooth'; o.frequency.value=f;
      g.gain.setValueAtTime(0.22,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.45);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.5);
    },i*90));
  },
  // Overdim sound — cosmic shimmer
  _sndOverdim(){
    const a=this._ac(); if(!a)return;
    [196,262,330,392,523,659,784,1047].forEach((f,i)=>setTimeout(()=>{
      const o=a.createOscillator(),g=a.createGain();
      o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.14,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.5);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.5);
    },i*65));
  },
  // Star crash impact
  _sndStar(){
    const a=this._ac(); if(!a)return;
    const o=a.createOscillator(),g=a.createGain();
    o.type='sine'; o.frequency.setValueAtTime(1800,a.currentTime);
    o.frequency.exponentialRampToValueAtTime(150,a.currentTime+0.6);
    g.gain.setValueAtTime(0.28,a.currentTime); g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.7);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.7);
  },

  // ── TIMING ──
  _startTs(){ let t=0; try{ t=parseInt(sessionStorage.getItem('mischa_session_start')||'0'); }catch(e){} if(!t){ t=Date.now(); try{sessionStorage.setItem('mischa_session_start',String(t));}catch(e){} } return t; },
  _opened(){ try{ return JSON.parse(sessionStorage.getItem('mischa_chests_opened')||'[]'); }catch(e){ return []; } },
  _markOpened(min){
    const o=this._opened(); if(!o.includes(min)){ o.push(min); try{sessionStorage.setItem('mischa_chests_opened',JSON.stringify(o));}catch(e){} }
    // All opened → round 2
    if(this._tiers().every(t=>o.includes(t.min))){
      this._setRound(this._round()+1);
      try{ sessionStorage.setItem('mischa_chests_opened','[]'); sessionStorage.setItem('mischa_session_start',String(Date.now())); }catch(e){}
    }
  },
  _minsPlayed(){ return (Date.now()-this._startTs())/60000; },
  _isReady(tier){ return this._minsPlayed()>=tier.min && !this._opened().includes(tier.min); },
  _anyReady(){ return this._tiers().some(t=>this._isReady(t)); },
  updateBadge(){
    const ready=this._anyReady();
    ['reward-badge','reward-badge-zoo'].forEach(id=>{ const b=document.getElementById(id); if(b)b.style.display=ready?'block':'none'; });
  },
  startBadgeTimer(){ if(this._badgeIv)clearInterval(this._badgeIv); this._badgeIv=setInterval(()=>this.updateBadge(),5000); this.updateBadge(); },

  // ── PLACE CHECK ──
  _hasZoo(){ try{ return !!(typeof ZS!=='undefined'&&ZS.zoo); }catch(e){ return false; } },
  _hasFreeSlot(){ try{ const z=ZS.zoo; if(!z||!z.enc)return false; while(z.enc.length<(ZS.maxE?ZS.maxE():5))z.enc.push(null); return z.enc.some(e=>!e||!e.animal); }catch(e){ return false; } },

  // ── CHEST LIST PAGE ──
  open(){
    this._initAudioUnlock(); this._unlockAudio();
    document.getElementById('chest-overlay')?.remove();
    const tiers=this._tiers(), round=this._round();
    const cards=tiers.map(t=>{
      const ready=this._isReady(t), opened=this._opened().includes(t.min);
      const minsLeft=Math.max(0,t.min-this._minsPlayed());
      const mm=String(Math.floor(minsLeft)).padStart(2,'0'), ss=String(Math.floor((minsLeft%1)*60)).padStart(2,'0');
      return '<div style="flex:1;min-width:150px;max-width:220px;background:linear-gradient(180deg,'+t.color+'22,'+t.color+'08);border:2.5px solid '+t.color+';border-radius:16px;padding:14px;text-align:center;box-shadow:0 0 24px '+t.glow+'">'+
        '<div style="font-size:clamp(.95rem,3.5vw,1.2rem);font-weight:900;color:'+t.color+';text-shadow:0 0 10px '+t.glow+';margin-bottom:8px">'+t.name+'</div>'+
        '<div style="margin:6px 0;display:flex;justify-content:center">'+this._chestSVG(t.color,90,opened,t.space)+'</div>'+
        (opened
          ? '<div style="color:rgba(255,255,255,.4);font-weight:700;margin-top:8px;font-size:.85rem">Schon geöffnet</div>'
          : ready
            ? '<div style="color:'+t.color+';font-weight:900;margin:8px 0;font-size:.9rem">✨ Bereit zum Öffnen!</div>'+
              '<button onclick="RewardChests.openChest('+t.min+')" style="width:100%;background:linear-gradient(135deg,'+t.color+','+t.color+'cc);color:#fff;border:none;padding:12px;border-radius:10px;font-weight:900;font-size:1rem;cursor:pointer">ÖFFNEN</button>'
            : '<div style="color:rgba(255,255,255,.6);font-size:.8rem;margin-top:6px">Öffne in:</div>'+
              '<div style="background:#000;border-radius:8px;padding:6px;margin-top:4px;font-size:1.1rem;font-weight:900">🕐 '+mm+':'+ss+'</div>'
        )+
        (t.min===120?'<div style="font-size:.62rem;color:'+t.color+';margin-top:6px;font-weight:700">SEHR SELTENE BELOHNUNGEN!</div>':'')+
      '</div>';
    }).join('');
    const ov=document.createElement('div'); ov.id='chest-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:99970;background:linear-gradient(160deg,#0a0e1a,#161b2e);overflow:auto;font-family:Arial,sans-serif;color:#fff';
    ov.innerHTML=
      '<div style="position:sticky;top:0;background:repeating-linear-gradient(45deg,#1a1a1a,#1a1a1a 14px,#3a1010 14px,#3a1010 28px);border-bottom:2px solid #c0392b;padding:10px;text-align:center;z-index:5">'+
        '<button onclick="document.getElementById(\'chest-overlay\').remove()" style="position:absolute;left:12px;top:8px;background:rgba(255,255,255,.15);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:1.2rem;cursor:pointer">✕</button>'+
        '<span style="color:#e74c3c;font-weight:900;font-size:clamp(.75rem,3vw,.95rem)">⚠️ BEIM SCHLIESSEN DES SPIELS WERDEN DIE BELOHNUNGEN ZURÜCKGESETZT!</span>'+
      '</div>'+
      '<div style="text-align:center;padding:14px">'+
        '<h1 style="margin:6px 0;font-size:clamp(1.3rem,6vw,2rem);background:linear-gradient(90deg,#FFD700,#FF8C00);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">🎁 Belohnungs-Truhen'+(round>=2?' — RUNDE '+round:'')+'</h1>'+
        '<div style="color:rgba(255,255,255,.55);font-size:.85rem">Spielzeit: '+Math.floor(this._minsPlayed())+' Min</div>'+
        (round<2?'<div style="color:#FFD700;font-size:.8rem;margin-top:4px;font-weight:700">✨ Alle öffnen → VIEL bessere Runde 2!</div>':'<div style="color:#9b59ff;font-size:.8rem;margin-top:4px;font-weight:700">🌌 Runde '+round+' — stärkere Truhen!</div>')+
      '</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:0 14px 20px;max-width:900px;margin:0 auto">'+cards+'</div>'+
      '<div style="text-align:center;padding:0 14px 30px"><button onclick="RewardChests._ffTest()" style="background:rgba(255,107,0,.25);border:1px dashed #ff6b00;color:#ff6b00;padding:8px 16px;border-radius:10px;font-size:.8rem;cursor:pointer;font-weight:700">🧪 +130 Min vorspulen (Test)</button></div>';
    document.body.appendChild(ov);
  },
  _ffTest(){ try{ sessionStorage.setItem('mischa_session_start',String(this._startTs()-130*60000)); }catch(e){} this.open(); this.updateBadge(); },

  // ── OPEN A CHEST (Brawl-Stars style: per-click upgrade chance) ──
  openChest(min){
    this._unlockAudio();
    const tier=this._tiers().find(t=>t.min===min); if(!tier)return;
    if(!this._isReady(tier))return;
    // Roll hell first
    const isHell=Math.random()<tier.hell;
    // Start at Normal (0), upgrade happens per-click
    const animState={tier, isHell, rarityIdx:0, clicks:0, isOverdim:false, reward:null};
    // Place-check for non-hell (we'll check again when reward is picked at reveal)
    this._animState=animState;
    if(isHell){ this._renderOpenAnim(); }
    else {
      if(this._hasFreeSlot&&!this._hasFreeSlot()&&this._hasZoo()){ alert('🦁 Du brauchst mehr Platz in deinem Zoo!'); return; }
      this._renderOpenAnim();
    }
  },

  // ── ANIMATION ──
  _renderOpenAnim(){
    const s=this._animState; if(!s)return;
    document.getElementById('chest-anim')?.remove();
    const ov=document.createElement('div'); ov.id='chest-anim';
    const r=this.RARITIES[s.rarityIdx]||this.RARITIES[0];
    let bg=this._bgFor(s.isHell,r,s.rarityIdx===4);
    ov.style.cssText='position:fixed;inset:0;z-index:99975;background:'+bg+';display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;text-align:center;padding:20px;transition:background .5s;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none';
    const labelCol=this._colFor(s.isHell,r,s.rarityIdx===4);
    const chestCol=s.isHell?'#8b0000':(s.rarityIdx===4?'#7b2fff':r.bg);
    const label=s.isHell?'🔥 HÖLLEN-TRUHE 🔥':(s.rarityIdx===4?'🌌 ÜBERDIMENSIONAL 🌌':r.name.toUpperCase());
    const remaining=5-s.clicks;
    ov.innerHTML=
      '<div id="cr-label" style="font-size:clamp(1.3rem,5.5vw,2.1rem);font-weight:900;margin-bottom:12px;color:'+labelCol+';text-shadow:0 0 18px '+labelCol+'">'+label+'</div>'+
      '<div id="cr-chest" style="transition:transform .3s cubic-bezier(.15,1.6,.4,1);filter:drop-shadow(0 0 36px '+labelCol+')">'+this._chestSVG(chestCol,260,false,s.rarityIdx===4)+'</div>'+
      '<div id="cr-hint" style="margin-top:18px;font-size:clamp(1.1rem,4.5vw,1.4rem);font-weight:900;color:#fff">👆 Tippe '+remaining+'× zum Öffnen!</div>'+
      '<div id="cr-dots" style="margin-top:10px;font-size:1.4rem;letter-spacing:6px;color:'+labelCol+'">'+'●'.repeat(s.clicks)+'○'.repeat(remaining)+'</div>';
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
  _colFor(isHell,r,overdim){ if(isHell)return '#ff3030'; if(overdim)return '#c89bff'; if(r&&r.id==='superepic')return '#fff'; return (r&&r.bg)||'#fff'; },

  _chestClick(){
    const s=this._animState; if(!s)return;
    const now=Date.now(); if(this._lastClick&&now-this._lastClick<220)return; this._lastClick=now;
    if(s.clicks>=5)return;
    s.clicks++;
    // Brawl-Stars upgrade: each click has a chance to upgrade (can't go down)
    if(!s.isHell && s.rarityIdx<4){
      const p=s.tier.upChance;
      if(Math.random()<p){ s.rarityIdx=Math.min(4,s.rarityIdx+1); this._sndUpgrade(s.rarityIdx); }
      else { this._sndClick(); }
    } else { this._sndClick(); }
    // Update visuals
    const chest=document.getElementById('cr-chest');
    if(chest){
      chest.style.transform='rotateY('+(s.clicks*360)+'deg) scale('+(1+s.clicks*0.05)+')';
      const r=this.RARITIES[s.rarityIdx]||this.RARITIES[0];
      const col=s.isHell?'#8b0000':(s.rarityIdx===4?'#7b2fff':r.bg);
      chest.innerHTML=this._chestSVG(col,260,false,s.rarityIdx===4);
    }
    this._updateAnimVisual();
    if(s.clicks>=5){
      // play final sound
      if(!s.isHell){
        if(s.rarityIdx===4)this._sndOverdim();
        else if(s.rarityIdx===3)this._sndSuperEpic();
      } else { this._sndHell(); }
      // Overdim → star crash animation before reveal
      if(!s.isHell&&s.rarityIdx===4){ setTimeout(()=>this._starCrashIntro(),300); }
      else { setTimeout(()=>this._revealReward(),450); }
    }
  },
  _updateAnimVisual(){
    const s=this._animState; if(!s)return;
    const ov=document.getElementById('chest-anim'); if(!ov)return;
    const r=this.RARITIES[s.rarityIdx]||this.RARITIES[0];
    const overdim=s.rarityIdx===4&&!s.isHell;
    ov.style.background=this._bgFor(s.isHell,r,overdim);
    const labelCol=this._colFor(s.isHell,r,overdim);
    const label=s.isHell?'🔥 HÖLLEN-TRUHE 🔥':(overdim?'🌌 ÜBERDIMENSIONAL 🌌':r.name.toUpperCase());
    const remaining=5-s.clicks;
    const lEl=document.getElementById('cr-label'),hEl=document.getElementById('cr-hint'),dEl=document.getElementById('cr-dots');
    if(lEl){ lEl.textContent=label; lEl.style.color=labelCol; lEl.style.textShadow='0 0 18px '+labelCol; }
    if(hEl){ hEl.textContent=s.clicks>=5?'✨ Öffnet sich...':(remaining?'👆 Tippe '+remaining+'× zum Öffnen!':''); }
    if(dEl){ dEl.textContent='●'.repeat(s.clicks)+'○'.repeat(remaining); dEl.style.color=labelCol; }
  },

  // ── STAR CRASH INTRO (overdimensional) ──
  _starCrashIntro(){
    document.getElementById('chest-anim')?.remove();
    const ov=document.createElement('div'); ov.id='chest-anim';
    ov.style.cssText='position:fixed;inset:0;z-index:99975;background:radial-gradient(circle at 50% 45%,#3a1a6e,#05010f);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;font-family:Arial,sans-serif;color:#fff';
    ov.innerHTML='<canvas id="star-cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>'+
      '<div id="star-txt" style="position:absolute;bottom:14%;left:0;right:0;text-align:center;font-weight:900;font-size:clamp(1rem,4vw,1.3rem);color:#d8b4ff;text-shadow:0 0 14px #9b59ff;z-index:2">🌌 Eine überdimensionale Kraft naht...</div>';
    document.body.appendChild(ov);
    this._unlockAudio(); this._sndOverdim();
    const cv=document.getElementById('star-cv'),ctx=cv.getContext('2d');
    let W,H; const rs=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;}; rs();
    const stars=Array.from({length:100},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.3}));
    const self=this;
    const drawChest=(cx,cy,scale,space,shake)=>{
      ctx.save(); ctx.translate(cx+(shake||0),cy); ctx.scale(scale,scale);
      let grad=ctx.createLinearGradient(-45,0,45,0);
      if(space){ grad=ctx.createRadialGradient(0,-10,5,0,-10,60); grad.addColorStop(0,'#b388ff'); grad.addColorStop(1,'#2a0a5e'); }
      else { ['#ff0000','#ff8c00','#ffee00','#00ff00','#0088ff','#8800ff'].forEach((c,i,a)=>grad.addColorStop(i/(a.length-1),c)); }
      ctx.fillStyle=grad; ctx.strokeStyle='#c0c0c8'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-45,-8); ctx.quadraticCurveTo(0,-44,45,-8); ctx.lineTo(45,0); ctx.lineTo(-45,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle=grad; ctx.fillRect(-45,0,90,34); ctx.strokeRect(-45,0,90,34);
      ctx.fillStyle='#b8b8c0'; ctx.fillRect(-20,-10,7,44); ctx.fillRect(13,-10,7,44);
      ctx.fillStyle='#d0d0d8'; ctx.fillRect(-6,6,12,14); ctx.fillStyle='#444'; ctx.beginPath(); ctx.arc(0,12,2.5,0,7); ctx.fill();
      ctx.restore();
    };
    let f=0; const TOTAL=110, cx=()=>W/2, cy=()=>H*0.5;
    const loop=()=>{
      ctx.clearRect(0,0,W,H); ctx.fillStyle='rgba(10,2,25,.45)'; ctx.fillRect(0,0,W,H);
      stars.forEach(s=>{ctx.fillStyle='rgba(255,255,255,'+(0.3+Math.random()*.4)+')'; ctx.fillRect(s.x,s.y,s.r,s.r);});
      const sc=Math.min(W,H)/300, isSpace=f>72, shake=(f>=66&&f<78)?(Math.random()*10-5):0;
      drawChest(cx(),cy(),sc*(isSpace?1.25:1),isSpace,shake);
      if(f<66){
        const t=f/66, sx=cx()+(W*.55)*(1-t), sy=cy()-(H*.55)*(1-t);
        ctx.save(); ctx.shadowColor='#ffe680'; ctx.shadowBlur=25;
        ctx.font=(38+t*30)+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('⭐',sx,sy); ctx.restore();
        ctx.strokeStyle='rgba(255,230,120,.5)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+50,sy-38); ctx.stroke();
      } else if(f>=66&&f<82){
        if(f===66)self._sndStar();
        const a=Math.max(0,1-(f-66)/16); ctx.fillStyle='rgba(255,240,180,'+a+')'; ctx.fillRect(0,0,W,H);
        for(let i=0;i<14;i++){const ang=i/14*Math.PI*2,rad=(f-66)*9; ctx.fillStyle='rgba(200,160,255,'+a+')'; ctx.beginPath(); ctx.arc(cx()+Math.cos(ang)*rad,cy()+Math.sin(ang)*rad,3,0,7); ctx.fill();}
      }
      f++;
      if(f<=TOTAL) requestAnimationFrame(loop);
      else { const tx=document.getElementById('star-txt'); if(tx)tx.textContent='💥 ÜBERDIMENSIONAL! Tippe zum Öffnen!'; this._revealReward(); }
    };
    loop();
  },

  // ── REVEAL REWARD ──
  _revealReward(){
    const s=this._animState; if(!s)return;
    this._markOpened(s.tier.min);
    const reward=s.isHell ? this._pickHell() : this._pickReward(s.rarityIdx, s.tier.q||1);
    try{ if(reward.apply) reward.apply(); }catch(e){ console.warn('reward apply error',e); }
    const ov=document.getElementById('chest-anim'); if(!ov)return;
    const r=this.RARITIES[s.rarityIdx]||this.RARITIES[0];
    const overdim=s.rarityIdx===4&&!s.isHell;
    const col=s.isHell?'#ff3030':(overdim?'#c89bff':(r.id==='superepic'?'#FFD700':r.bg));
    const title=s.isHell?'🔥 HÖLLEN-TRUHE 🔥':(overdim?'🌌 ÜBERDIMENSIONAL 🌌':r.name.toUpperCase()+' TRUHE');
    ov.style.background=this._bgFor(s.isHell,r,overdim);
    ov.innerHTML=
      '<div style="font-size:clamp(1.1rem,4.5vw,1.6rem);font-weight:900;color:'+col+';text-shadow:0 0 14px '+col+';margin-bottom:10px">'+title+'</div>'+
      '<div id="rv-icon" style="font-size:5.5rem;margin:10px 0;animation:bounce 1s infinite">'+reward.icon+'</div>'+
      '<div style="font-size:clamp(1.2rem,5vw,1.7rem);font-weight:900;color:#fff;margin-bottom:6px">'+reward.label+'</div>'+
      '<div style="font-size:.85rem;color:rgba(255,255,255,.5);margin-bottom:24px">'+(s.isHell?'Autsch! Pech gehabt...':'Belohnung erhalten!')+'</div>'+
      '<button id="chest-claim-btn" style="background:linear-gradient(135deg,#FFD700,#FF8C00);color:#1a1a2e;border:none;padding:14px 40px;border-radius:14px;font-weight:900;font-size:1.15rem;cursor:pointer;box-shadow:0 4px 18px rgba(255,140,0,.6)">Super! ➜</button>';
    ov.onclick=null; ov.ontouchstart=null;
    const btn=document.getElementById('chest-claim-btn');
    if(btn){ const claim=(e)=>{ if(e){e.preventDefault();e.stopPropagation();} this._closeAnim(); }; btn.onclick=claim; btn.addEventListener('touchend',claim,{passive:false}); }
    this.updateBadge();
  },
  _closeAnim(){ document.getElementById('chest-anim')?.remove(); this._animState=null; this.open(); this.updateBadge(); },

  // ── REWARD POOLS ──
  _pickReward(rarityIdx){
    const pools=[
      [{icon:'🐾',label:'Seltenes Tier!',needsSlot:true,apply:()=>this._giveAnimal('rare')}],
      [{icon:'🦁',label:'Episches Tier!',needsSlot:true,apply:()=>this._giveAnimal('epic')},
       {icon:'🌀',label:'+1000 MT',apply:()=>this._giveMT(1000)},
       {icon:'🧹',label:'1× Kehrmaschine gratis',apply:()=>this._pending('freeSweep',1)}],
      [{icon:'🎡',label:'1 Glücksrad-Dreh!',apply:()=>this._pending('spins',1)}],
      [{icon:'🎡',label:'1 Glücksrad-Dreh!',apply:()=>this._pending('spins',1)},
       {icon:'🛡️',label:'Lebenslange Versicherung!',apply:()=>this._pending('lifeInsurance',1)}],
      [  {icon:'🦕',label:'DINOSAURIER! 🦕',needsSlot:true,apply:()=>this._giveAnimal('dino')},
         {icon:'🦄',label:'Mythisches Tier!',needsSlot:true,apply:()=>this._giveAnimal('mythic')}],
    ];
    const pool=pools[Math.min(rarityIdx,4)]||pools[0];
    if(rarityIdx===4) return Math.random()<0.10?pool[0]:pool[1];
    return pool[Math.floor(Math.random()*pool.length)];
  },
  _pickHell(){
    const p=[{icon:'💀',label:'-10.000 MT',apply:()=>this._giveMT(-10000)},
             {icon:'🔥',label:'-5.000 MT',apply:()=>this._giveMT(-5000)},
             {icon:'🚜',label:'Unfall!',apply:()=>{ try{sessionStorage.setItem('mischa_pending_accident','1');}catch(e){} }},
             {icon:'🕳️',label:'Nichts...',apply:()=>{}}];
    return p[Math.floor(Math.random()*p.length)];
  },

  // ── REWARD APPLIERS ──
  _inZoo(){ try{ return typeof ZS!=='undefined'&&ZS.zoo&&typeof ZG!=='undefined'; }catch(e){ return false; } },
  _giveMT(amount){
    if(this._inZoo()){ const z=ZS.zoo; z.mt=Math.max(0,(z.mt||0)+amount); try{ZG._updHUD&&ZG._updHUD();}catch(e){} try{ZS.save&&ZS.save();}catch(e){} if(typeof ZP!=='undefined')ZP.toast((amount>=0?'🌀 +':'')+amount+' MT!',3000); return; }
    const p=State.currentPlayer; if(p){ p.totalScore=Math.max(0,(p.totalScore||0)+amount); State.savePlayer&&State.savePlayer(p); }
  },
  _giveAnimal(kind){
    if(!this._hasZoo()){ if(typeof ZP!=='undefined')ZP.toast('🦁 Kein Zoo — Tier wartet bis du einen hast.',3500); return; }
    this._pending('animal_'+kind,1);
    if(this._inZoo()) this.applyPending();
  },
  _pending(key,n){
    try{ const p=JSON.parse(sessionStorage.getItem('mischa_pending_rewards')||'{}'); p[key]=(p[key]||0)+n; sessionStorage.setItem('mischa_pending_rewards',JSON.stringify(p)); }catch(e){}
    if(this._inZoo()) this.applyPending();
  },
  // Apply all pending rewards (safe to call repeatedly; only acts on what's stored)
  applyPending(){
    if(!this._inZoo())return;
    let pr; try{ pr=JSON.parse(sessionStorage.getItem('mischa_pending_rewards')||'{}'); }catch(e){ return; }
    if(!Object.keys(pr).length)return;
    const z=ZS.zoo; if(!z)return;
    if(!z.enc) z.enc=[];
    while(z.enc.length<(ZS.maxE?ZS.maxE():5)) z.enc.push(null);
    const msg=[];
    if(pr.tokens){ z.tokens=(z.tokens||0)+pr.tokens; msg.push(pr.tokens+'🥇'); delete pr.tokens; }
    if(pr.spins){ if(typeof LW!=='undefined'){LW.spins=(LW.spins||0)+pr.spins; try{LW._saveSpins&&LW._saveSpins();}catch(e){}} msg.push(pr.spins+'🎡'); delete pr.spins; }
    if(pr.treats){ z.treats=(z.treats||0)+pr.treats; msg.push(pr.treats+'🍬'); delete pr.treats; }
    if(pr.freeSweep){ z.freeSweeps=(z.freeSweeps||0)+pr.freeSweep; msg.push(pr.freeSweep+'×🧹'); delete pr.freeSweep; }
    if(pr.lifeInsurance){ z.insuranceActive=true; z.lifeInsurance=true; z.insuranceUntil=Date.now()+9e12; msg.push('🛡️'); delete pr.lifeInsurance; }
    if(pr.event){ if(typeof EVENTS!=='undefined'&&ZG.startEv){ setTimeout(()=>{const ev=EVENTS[Math.floor(Math.random()*EVENTS.length)]; ZG.startEv(ev,300000);},800);} delete pr.event; }
    // Animals
    const giveAnimal=(rarity)=>{
      const slot=z.enc.findIndex(e=>!e||!e.animal);
      if(slot<0){ if(typeof ZP!=='undefined')ZP.toast('🦁 Kein Platz! Tier-Belohnung wartet.',3500); return false; }
      if(rarity==='dino') z.enc[slot]={animal:{id:'chest_dino',n:'Dinosaurier',e:'🦕',r:'mythic',p:0,earn:800,w:0},shiny:null,traits:[],xm:1,addedAt:Date.now(),sl:0};
      else { let pool=(window.ANIMALS||[]).filter(a=>a.r===rarity); if(!pool.length)pool=(window.ANIMALS||[]).filter(a=>a.r==='epic'); const a=pool[Math.floor(Math.random()*pool.length)]; if(!a)return false; z.enc[slot]={animal:{...a},shiny:(rarity==='mythic'?'rainbow':null),traits:[],xm:1,addedAt:Date.now(),sl:0}; }
      return true;
    };
    let gaveAnimal=false;
    ['rare','epic','mythic','dino'].forEach(rar=>{
      let cnt=pr['animal_'+rar]||0; if(!cnt)return;
      let failed=0;
      for(let i=0;i<cnt;i++){ if(giveAnimal(rar)) gaveAnimal=true; else failed++; }
      msg.push((cnt-failed)+'×🐾'+rar);
      if(failed) pr['animal_'+rar]=failed; else delete pr['animal_'+rar];
    });
    if(gaveAnimal){ try{ZG._encs&&ZG._encs();}catch(e){} }
    // Persist remaining (animals without space)
    try{
      if(Object.keys(pr).length) sessionStorage.setItem('mischa_pending_rewards',JSON.stringify(pr));
      else sessionStorage.removeItem('mischa_pending_rewards');
    }catch(e){}
    if(msg.length&&typeof ZP!=='undefined') ZP.toast('🎁 Belohnung: '+msg.join(' · '),5000);
    try{ ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){}
  },
};
window.RewardChests = RewardChests;
