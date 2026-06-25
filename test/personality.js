// Personality module — color + avatar customization (v251)
const Personality = {
  // ── COLOR PALETTE ── (10×10 grid like the user's reference image)
  COLORS: [
    // Greys (row 1)
    '#000000','#1a1a1a','#333333','#4d4d4d','#666666','#808080','#999999','#b3b3b3','#cccccc','#f2f2f2',
    // Reds-Oranges (row 2)
    '#7a0000','#a30000','#cc0000','#ff0000','#ff3333','#ff6633','#ff8c1a','#ffa64d','#ffbf80','#ffd9b3',
    // Yellows-Oranges (row 3)
    '#996600','#b37700','#cc8800','#e69900','#ffaa00','#ffcc00','#ffdd33','#ffe666','#fff099','#fff5cc',
    // Greens (row 4)
    '#003300','#006622','#009933','#00b33c','#00cc44','#33d966','#66e088','#99e6aa','#c0eecc','#dff5e6',
    // Cyans/Teals (row 5)
    '#003333','#006666','#009999','#00b3b3','#00cccc','#33d9d9','#66e0e0','#99eaea','#c0f0f0','#e0f5f5',
    // Blues (row 6)
    '#000a4d','#001a66','#002999','#0044cc','#0066ff','#3388ff','#66a3ff','#99c2ff','#c0d9ff','#dfeaff',
    // Indigos/Purples (row 7)
    '#1a0033','#330066','#4d0099','#6600cc','#8000ff','#9933ff','#b366ff','#c999ff','#dcc0ff','#ecdfff',
    // Pinks/Magentas (row 8)
    '#4d004d','#660066','#990099','#cc00cc','#ff00ff','#ff33cc','#ff66cc','#ff99cc','#ffc0e0','#ffdfee',
    // Hot pinks/roses (row 9)
    '#660033','#990033','#cc1a4d','#e63366','#ff4d80','#ff7ba6','#ffa3bf','#ffc7d6','#ffe0e8','#fff0f4',
    // Browns/Earth (row 10)
    '#3d1a00','#5c2900','#7a3300','#996633','#b3804d','#c79968','#d4ad84','#e0c1a0','#ecd5bd','#f5e8d6',
  ],
  DEFAULT_COLOR: '#3498db', // friendly blue

  // ── AVATAR CATEGORIES ──
  FACES: [
    '🐱','🐶','🦊','🐸','🐼','🦁','🐯','🐨','🐰','🐹',
    '🐭','🐮','🐷','🐵','🐻','🐺','🐲','🦄','🦝','🦓',
    '😀','😎','🥳','🤩','😇','🤠','🤓','🧙','🦸','🧚',
    '👶','👧','👦','👩','👨','👵','👴','👽','🤖','👻',
  ],
  HATS: [
    '',  // no hat
    '🎩','👑','🧢','🎓','⛑️','🪖','🎀','👒','🧕','🎄',
    '👼','🪅','🎃','🌸','🌺','🌟','⭐','✨','💎','🔥',
  ],
  GLASSES: [
    '',  // none
    '👓','🕶️','🥽','🧿','👁️','💫','✨','🌈','🌟','⚡',
  ],
  EARRINGS: [
    '',  // none
    '💎','💍','⭐','🌟','✨','💖','💜','💙','💚','💛',
    '🔮','🌸','🌺','🍀','❄️',
  ],

  // ── STATE ──
  _data(){
    const p=State.currentPlayer; if(!p)return {color:this.DEFAULT_COLOR,face:'',hat:'',glasses:'',earring:''};
    if(!p.personality) p.personality={color:this.DEFAULT_COLOR,face:'',hat:'',glasses:'',earring:''};
    return p.personality;
  },
  _save(){
    const p=State.currentPlayer; if(!p)return;
    State.savePlayer&&State.savePlayer(p).catch(()=>{});
    // also save to localStorage for instant offline restore
    try{ localStorage.setItem('mischa_personality_'+(p.name||'').toLowerCase(), JSON.stringify(p.personality||{})); }catch(e){}
  },

  // Apply the chosen color globally as CSS variable
  applyColor(){
    const d=this._data();
    const col=d.color||this.DEFAULT_COLOR;
    document.documentElement.style.setProperty('--user-color', col);
    document.documentElement.style.setProperty('--user-color-dark', this._shade(col,-0.3));
    document.documentElement.style.setProperty('--user-color-light', this._shade(col,0.3));
    document.documentElement.style.setProperty('--user-color-rgba', this._toRgba(col,0.18));
    // Inject global style: tint the body background with the user color
    let el=document.getElementById('personality-style');
    if(!el){ el=document.createElement('style'); el.id='personality-style'; document.head.appendChild(el); }
    const r=parseInt(col.replace('#','').substr(0,2),16),
          g=parseInt(col.replace('#','').substr(2,2),16),
          b=parseInt(col.replace('#','').substr(4,2),16);
    const darkBg = 'rgb('+Math.round(r*0.15)+','+Math.round(g*0.15)+','+Math.round(b*0.15)+')';
    const midBg  = 'rgb('+Math.round(r*0.35)+','+Math.round(g*0.35)+','+Math.round(b*0.35)+')';
    // Build the tinted gradient as a CSS background-image string
    const bgGrad = 'linear-gradient(160deg,'+darkBg+' 0%,'+midBg+' 100%)';
    el.textContent =
      // Body/html — base background
      'html,body{background:'+bgGrad+' fixed !important}'+
      // #app container
      '#app{background:'+bgGrad+' !important}'+
      // The menu's inner background-gradient div: override its inline style by targeting first child of .mountain-bg
      '.mountain-bg > div:first-child{background:'+bgGrad+' !important}'+
      // The final dark fade-overlay too
      '.mountain-bg > div:last-child{background:linear-gradient(180deg,transparent 40%,'+this._toRgba(col,0.25)+' 100%) !important}'+
      // Decorative accent classes
      '.p-accent{color:'+col+'!important}'+
      '.p-bg{background:'+col+'!important}'+
      '.p-border{border-color:'+col+'!important}';
  },
  // Remove all color overrides (in case user wants pure default)
  clearColor(){
    document.getElementById('personality-style')?.remove();
  },
  _shade(hex,f){ try{ hex=hex.replace('#',''); let r=parseInt(hex.substr(0,2),16),g=parseInt(hex.substr(2,2),16),b=parseInt(hex.substr(4,2),16); if(f<0){r=Math.round(r*(1+f));g=Math.round(g*(1+f));b=Math.round(b*(1+f));}else{r=Math.round(r+(255-r)*f);g=Math.round(g+(255-g)*f);b=Math.round(b+(255-b)*f);} return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,x)).toString(16).padStart(2,'0')).join(''); }catch(e){return hex;} },
  _toRgba(hex,a){ try{ hex=hex.replace('#',''); const r=parseInt(hex.substr(0,2),16),g=parseInt(hex.substr(2,2),16),b=parseInt(hex.substr(4,2),16); return 'rgba('+r+','+g+','+b+','+a+')'; }catch(e){return hex;} },

  // Get the combined avatar string (face + hat + glasses + earring)
  getAvatar(){
    const d=this._data();
    if(!d.face) return '';
    // Build a stacked avatar (small overlays)
    return d.face;
  },
  // Full HTML avatar with overlays (for menu display)
  getAvatarHTML(size){
    size=size||64;
    const d=this._data();
    if(!d.face) return '';
    // The face emoji is rendered at ~85% of size, roughly centered, with its visual content
    // typically occupying the middle 60-70% of its em-box.
    // Accessories use these tuned offsets to land in believable places for most emojis.
    const hatSize     = Math.round(size*0.55);  // hat: bigger, more prominent
    const glassesSize = Math.round(size*0.45);  // glasses: cover the eye area
    const earringSize = Math.round(size*0.30);  // earring: small, side
    return '<div style="position:relative;display:inline-block;width:'+size+'px;height:'+size+'px;text-align:center;font-size:'+Math.round(size*0.92)+'px;line-height:'+size+'px;vertical-align:middle">'+
      // Face (base)
      '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'+d.face+'</span>'+
      // Hat: sits ON TOP, slightly overlapping the head crown (top of head area)
      (d.hat?'<span style="position:absolute;top:'+Math.round(size*-0.10)+'px;left:50%;transform:translateX(-50%);font-size:'+hatSize+'px;line-height:1;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,.3)">'+d.hat+'</span>':'')+
      // Glasses: covers the eye region (roughly 30-45% from top)
      (d.glasses?'<span style="position:absolute;top:'+Math.round(size*0.28)+'px;left:50%;transform:translateX(-50%);font-size:'+glassesSize+'px;line-height:1;pointer-events:none">'+d.glasses+'</span>':'')+
      // Earring: bottom-right of the face, near the cheek/ear
      (d.earring?'<span style="position:absolute;top:'+Math.round(size*0.50)+'px;right:'+Math.round(size*0.02)+'px;font-size:'+earringSize+'px;line-height:1;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,.3)">'+d.earring+'</span>':'')+
    '</div>';
  },

  // ── UI ──
  show(){
    document.getElementById('personality-overlay')?.remove();
    const ov=document.createElement('div'); ov.id='personality-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:99980;background:linear-gradient(160deg,#0d1b2a,#1a2a3a);overflow:auto;font-family:Arial,sans-serif;color:#fff';
    ov.innerHTML=this._renderShell();
    document.body.appendChild(ov);
    this._renderTab(this._curTab||'color');
  },
  _renderShell(){
    return '<div style="position:sticky;top:0;background:linear-gradient(135deg,#1a2a3a,#0d1b2a);border-bottom:2px solid rgba(255,255,255,.1);padding:14px 16px;z-index:5;display:flex;align-items:center;gap:12px">'+
        '<button onclick="document.getElementById(\'personality-overlay\').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.2rem;cursor:pointer">✕</button>'+
        '<h2 style="margin:0;font-size:clamp(1.1rem,4.5vw,1.4rem);font-weight:900">🎨 Persönlichkeit</h2>'+
      '</div>'+
      '<div style="display:flex;gap:8px;padding:14px;justify-content:center;flex-wrap:wrap">'+
        '<button id="p-tab-color" onclick="Personality._switchTab(\'color\')" class="p-tab" style="background:#3498db;color:#fff;border:none;padding:10px 22px;border-radius:24px;font-weight:900;font-size:1rem;cursor:pointer;min-height:44px">🎨 Farbe</button>'+
        '<button id="p-tab-avatar" onclick="Personality._switchTab(\'avatar\')" class="p-tab" style="background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:none;padding:10px 22px;border-radius:24px;font-weight:900;font-size:1rem;cursor:pointer;min-height:44px">👤 Avatar</button>'+
      '</div>'+
      '<div id="p-content" style="padding:0 14px 30px"></div>';
  },
  _switchTab(tab){
    this._curTab=tab;
    document.getElementById('p-tab-color').style.background = tab==='color'?'#3498db':'rgba(255,255,255,.1)';
    document.getElementById('p-tab-color').style.color = tab==='color'?'#fff':'rgba(255,255,255,.7)';
    document.getElementById('p-tab-avatar').style.background = tab==='avatar'?'#3498db':'rgba(255,255,255,.1)';
    document.getElementById('p-tab-avatar').style.color = tab==='avatar'?'#fff':'rgba(255,255,255,.7)';
    this._renderTab(tab);
  },
  _renderTab(tab){
    const el=document.getElementById('p-content'); if(!el)return;
    if(tab==='color') el.innerHTML=this._renderColor();
    else el.innerHTML=this._renderAvatar();
  },

  _renderColor(){
    const d=this._data();
    const grid=this.COLORS.map(c=>{
      const selected=c.toLowerCase()===d.color.toLowerCase();
      return '<div onclick="Personality._pickColor(\''+c+'\')" style="width:100%;aspect-ratio:1;background:'+c+';border-radius:6px;cursor:pointer;border:'+(selected?'3px solid #FFD700':'2px solid rgba(255,255,255,.1)')+';box-sizing:border-box;transition:transform .1s" onmouseover="this.style.transform=\'scale(1.1)\'" onmouseout="this.style.transform=\'scale(1)\'"></div>';
    }).join('');
    return '<div style="max-width:480px;margin:0 auto">'+
      '<div style="text-align:center;margin-bottom:14px;color:rgba(255,255,255,.6);font-size:.9rem">Wähle deine Lieblingsfarbe — sie färbt Knöpfe und Akzente überall ein.</div>'+
      '<div style="background:'+d.color+';border-radius:14px;padding:18px;margin-bottom:18px;text-align:center;box-shadow:0 4px 20px '+this._toRgba(d.color,0.5)+'">'+
        '<div style="color:#fff;font-size:.75rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:.85">Vorschau</div>'+
        '<div style="color:#fff;font-size:1.3rem;font-weight:900;margin-top:4px">Aktive Farbe: '+d.color+'</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;background:rgba(255,255,255,.04);padding:10px;border-radius:12px">'+grid+'</div>'+
      '<button onclick="Personality._pickColor(\''+this.DEFAULT_COLOR+'\')" style="display:block;margin:18px auto 0;background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:none;padding:9px 18px;border-radius:10px;font-size:.85rem;cursor:pointer">↺ Auf Standardfarbe zurücksetzen</button>'+
    '</div>';
  },
  _pickColor(c){
    const d=this._data(); d.color=c;
    this._save(); this.applyColor();
    this._renderTab('color');
  },

  _renderAvatar(){
    const d=this._data();
    const previewHTML = d.face
      ? this.getAvatarHTML(120)
      : '<div style="font-size:3rem;color:rgba(255,255,255,.3)">?</div><div style="color:rgba(255,255,255,.4);font-size:.8rem;margin-top:6px">Wähle ein Gesicht</div>';
    const grid=(arr,key,allowEmpty)=>{
      const cur=d[key]||'';
      return arr.map(em=>{
        const sel=em===cur;
        const isEmpty=em==='';
        return '<div onclick="Personality._pickAvatar(\''+key+'\',\''+em+'\')" style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1.8rem;background:'+(sel?'rgba(255,215,0,.25)':'rgba(255,255,255,.05)')+';border:'+(sel?'2.5px solid #FFD700':'1.5px solid rgba(255,255,255,.1)')+';border-radius:10px;cursor:pointer;transition:transform .1s" onmouseover="this.style.transform=\'scale(1.1)\'" onmouseout="this.style.transform=\'scale(1)\'">'+(isEmpty?'<span style="color:rgba(255,255,255,.3);font-size:.85rem">∅</span>':em)+'</div>';
      }).join('');
    };
    return '<div style="max-width:600px;margin:0 auto">'+
      // Live preview
      '<div style="background:linear-gradient(135deg,rgba(155,89,182,.2),rgba(52,152,219,.2));border:2px solid rgba(255,255,255,.15);border-radius:14px;padding:24px;margin-bottom:18px;text-align:center">'+
        '<div style="color:rgba(255,255,255,.55);font-size:.75rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Dein Avatar</div>'+
        '<div style="min-height:140px;display:flex;align-items:center;justify-content:center;flex-direction:column">'+previewHTML+'</div>'+
      '</div>'+
      // Faces
      '<div style="color:rgba(255,255,255,.85);font-size:.95rem;font-weight:900;margin:10px 4px 8px">😀 Gesicht / Tier</div>'+
      '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:5px">'+grid(this.FACES,'face',false)+'</div>'+
      // Hats
      '<div style="color:rgba(255,255,255,.85);font-size:.95rem;font-weight:900;margin:18px 4px 8px">🎩 Hut / Kopf</div>'+
      '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:5px">'+grid(this.HATS,'hat',true)+'</div>'+
      // Glasses
      '<div style="color:rgba(255,255,255,.85);font-size:.95rem;font-weight:900;margin:18px 4px 8px">👓 Brille</div>'+
      '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:5px">'+grid(this.GLASSES,'glasses',true)+'</div>'+
      // Earrings
      '<div style="color:rgba(255,255,255,.85);font-size:.95rem;font-weight:900;margin:18px 4px 8px">💎 Ohrring</div>'+
      '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:5px">'+grid(this.EARRINGS,'earring',true)+'</div>'+
      '<button onclick="Personality._resetAvatar()" style="display:block;margin:20px auto 0;background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:none;padding:9px 18px;border-radius:10px;font-size:.85rem;cursor:pointer">↺ Avatar zurücksetzen</button>'+
    '</div>';
  },
  _pickAvatar(key,em){
    const d=this._data(); d[key]=em;
    this._save();
    this._renderTab('avatar');
  },
  _resetAvatar(){
    const d=this._data(); d.face=''; d.hat=''; d.glasses=''; d.earring='';
    this._save();
    this._renderTab('avatar');
  },

  // ── INIT ──
  init(){
    // Load from localStorage as fallback if no cloud yet
    const p=State.currentPlayer;
    if(p && !p.personality){
      try{
        const saved=localStorage.getItem('mischa_personality_'+(p.name||'').toLowerCase());
        if(saved) p.personality=JSON.parse(saved);
      }catch(e){}
    }
    this.applyColor();
  },
};
window.Personality = Personality;
