/**
 * shop.js v3 — Vollständiger Shop
 * - Familien-Skins (Oma, Opa, Steffi, Tom, Benni, Jonas, Hanes, Nina, Michi, Trixi, Raffi, Andi, Janosch, Mischa)
 * - Test-Charakter (20 Min limitiert)
 * - Hinweis-Paket mit echtem Nutzen
 * - Sterne-Multiplikator progressiv (2x→4x→10x, verschwindet nach Kauf)
 * - Starter-Pack einmalig, verschwindet nach Kauf
 * - Rabatt für alle Spieler sichtbar
 * - Admin-Broadcast-Nachricht
 */

// ============================================================
// ALLE CHARAKTERE
// ============================================================
const ALL_CHARACTERS = [
  // Gratis
  { id:'spongebob',  emoji:'🧽', name:'SpongeBob',       free:true },
  { id:'patrick',    emoji:'⭐', name:'Patrick',          free:true },
  { id:'mario',      emoji:'🍄', name:'Mario',            free:true },
  { id:'luigi',      emoji:'💚', name:'Luigi',            free:true },
  { id:'stickman',   emoji:'🎨', name:'Strichmännchen',   free:true, hasColors:true },
  { id:'woman',      emoji:'👩', name:'Wanderin',         free:true },
  { id:'man',        emoji:'👨', name:'Wanderer',         free:true },
  { id:'girl',       emoji:'👧', name:'Mädchen',          free:true },
  { id:'boy',        emoji:'👦', name:'Junge',            free:true },
  { id:'ninja',      emoji:'🥷', name:'Ninja',            free:true },
  { id:'astronaut',  emoji:'🧑‍🚀', name:'Astronaut',    free:true },
  { id:'detective',  emoji:'🕵️', name:'Detektiv',        free:true },
  { id:'princess',   emoji:'👸', name:'Prinzessin',       free:true },
  { id:'knight',     emoji:'⚔️',  name:'Ritter',          free:true },
  { id:'scientist',  emoji:'🧪', name:'Wissenschaftler',  free:true },
  { id:'explorer',   emoji:'🧭', name:'Entdecker',        free:true },
  // Familie (Shop)
  { id:'oma',    emoji:'👵', name:'Oma',    free:false, price:200,    shopItem:'skin_oma' },
  { id:'opa',    emoji:'👴', name:'Opa',    free:false, price:200,    shopItem:'skin_opa' },
  { id:'steffi', emoji:'💁', name:'Steffi', free:false, price:300,    shopItem:'skin_steffi' },
  { id:'tom',    emoji:'🧑', name:'Tom',    free:false, price:300,    shopItem:'skin_tom' },
  { id:'benni',  emoji:'😎', name:'Benni',  free:false, price:300,    shopItem:'skin_benni' },
  { id:'jonas',  emoji:'🙃', name:'Jonas',  free:false, price:300,    shopItem:'skin_jonas' },
  { id:'hanes',  emoji:'🤙', name:'Hanes',  free:false, price:300,    shopItem:'skin_hanes' },
  { id:'nina',   emoji:'💃', name:'Nina',   free:false, price:300,    shopItem:'skin_nina' },
  { id:'michi',  emoji:'🏃', name:'Michi',  free:false, price:300,    shopItem:'skin_michi' },
  { id:'trixi',  emoji:'🌸', name:'Trixi',  free:false, price:300,    shopItem:'skin_trixi' },
  { id:'raffi',  emoji:'🦊', name:'Raffi',  free:false, price:300,    shopItem:'skin_raffi' },
  { id:'andi',   emoji:'🤓', name:'Andi',   free:false, price:300,    shopItem:'skin_andi' },
  { id:'janosch',emoji:'🎭', name:'Janosch',free:false, price:300,    shopItem:'skin_janosch' },
  { id:'mischa', emoji:'🦁', name:'Mischa', free:false, price:500,    shopItem:'skin_mischa' },
  // Special
  { id:'swimmer',    emoji:'🏊', name:'Schwimmer',    free:false, price:1000,       shopItem:'skin_swimmer' },
  { id:'kniffler',   emoji:'🎲', name:'Kniffler',     free:false, price:100,        shopItem:'skin_kniffler', starterPack:true },
  { id:'og_mann',    emoji:'🧓', name:'OG-Mann',      free:false, price:100000,     shopItem:'skin_og', limitedDays:7 },
  { id:'developer',  emoji:'💻', name:'Entwickler',   free:false, price:1000000000, shopItem:'skin_dev', limitedDays:7, ultraRare:true },
  { id:'test_char',  emoji:'🧪', name:'TEST',         free:false, price:1,          shopItem:'skin_test', limitedMinutes:20, testOnly:true },
];

// ============================================================
// HILFSFUNKTIONEN
// ============================================================
function formatTimeLeft(ms) {
  if (ms <= 0) return 'abgelaufen';
  const d=Math.floor(ms/86400000), h=Math.floor((ms%86400000)/3600000),
        m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000);
  if(d>0) return `${d}T ${h}h ${m}m`;
  if(h>0) return `${h}h ${m}m`;
  if(m>0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getDiscount(itemId) {
  try {
    const d = JSON.parse(localStorage.getItem('mischa_discounts')||'{}')[itemId];
    if(d && d.expiresAt > Date.now()) return d.pct;
  } catch(e){}
  return 0;
}

function getDiscountedPrice(price, itemId) {
  const pct = getDiscount(itemId);
  return pct ? Math.max(1, Math.round(price*(1-pct/100))) : price;
}

// ============================================================
// SHOP ITEMS GENERATOR
// ============================================================
function getShopItems(player) {
  const now = Date.now();
  const purchases = player?.purchases || {};
  const unlockedSkins = player?.unlockedSkins || [];
  const weekMs = 7*24*60*60*1000;
  const base = player?.createdAt || now;

  // Progressive boost logic: show next tier only
  const has2x   = !!(purchases['boost_2x_15']?.expiresAt > now);
  const has4x   = !!(purchases['boost_4x_15']?.expiresAt > now);
  const has10x15 = !!(purchases['boost_10x_15']?.expiresAt > now);
  const has10x30 = !!(purchases['boost_10x_30']?.expiresAt > now);
  const has10x60 = !!(purchases['boost_10x_60']?.expiresAt > now);

  // Which boost to show
  const boostItems = [];
  if (!has2x && !has4x && !has10x15 && !has10x30 && !has10x60) {
    // Show 2x first
    boostItems.push({id:'boost_2x_15', name:'2× Sterne (15 Min)', icon:'⭐×2', price:50, desc:'Doppelte Punkte für 15 Minuten!', duration:15*60*1000, mult:2});
  } else if (has2x && !has4x) {
    boostItems.push({id:'boost_4x_15', name:'4× Sterne (15 Min)', icon:'⭐×4', price:300, desc:'Vierfache Punkte für 15 Minuten!', duration:15*60*1000, mult:4});
  } else if (has4x && !has10x15) {
    boostItems.push({id:'boost_10x_15', name:'10× Sterne (15 Min)', icon:'🌟×10', price:1000, desc:'Zehnfache Punkte für 15 Minuten!', duration:15*60*1000, mult:10});
  } else if (has10x15 && !has10x30) {
    boostItems.push({id:'boost_10x_30', name:'10× Sterne (30 Min)', icon:'🌟×10 ⏱30', price:2000, desc:'Zehnfache Punkte für 30 Minuten!', duration:30*60*1000, mult:10});
  } else if (has10x30 && !has10x60) {
    boostItems.push({id:'boost_10x_60', name:'🌟 MAX GLÜCK — 10× Sterne (1h)', icon:'👑🌟', price:5000, desc:'Eine Stunde zehnfache Punkte — MAX GLÜCK!', duration:60*60*1000, mult:10, maxLuck:true});
  } else if (has10x60) {
    boostItems.push({id:'boost_max', name:'✅ MAX GLÜCK aktiv!', icon:'👑', price:0, desc:'Du hast bereits den höchsten Boost!', owned:true});
  }

  // Show active timer if boost running
  const runningBoost = ['boost_2x_15','boost_4x_15','boost_10x_15','boost_10x_30','boost_10x_60']
    .find(id => purchases[id]?.expiresAt > now);

  const items = [];

  // ---- STARTER PACK (einmalig, verschwindet nach Kauf) ----
  if (!purchases['starter_pack']) {
    items.push({
      id:'starter_pack', category:'special',
      name:'🎁 Starterpaket', icon:'🎁', price:100,
      desc:'Einmalig! 2× Sterne (15 Min) + Charakter Kniffler',
      oneTime:true,
    });
  }

  // ---- JOKER ----
  const maxJokers = player?.maxJokersPerWorld || 1;
  if (maxJokers < 2) items.push({id:'joker_x2', category:'joker', name:'2× Joker pro Welt', icon:'🃏🃏', price:1000, desc:'2 Joker statt 1 in jeder Welt!', permanent:true});
  if (maxJokers === 2) items.push({id:'joker_x3', category:'joker', name:'3× Joker pro Welt', icon:'🃏🃏🃏', price:200000, desc:'3 Joker pro Welt — maximaler Schutz!', permanent:true});

  // ---- BOOSTS ----
  boostItems.forEach(b => items.push({...b, category:'boost'}));
  if (runningBoost) {
    items.push({
      id:'boost_running', category:'boost',
      name:`⏱ Boost läuft: ${formatTimeLeft(purchases[runningBoost].expiresAt - now)}`,
      icon:'⚡', price:0, desc:'Dein aktiver Sterne-Boost läuft noch.', owned:true,
    });
  }

  // ---- FAMILIE SKINS ----
  const familySkins = ['oma','opa','steffi','tom','benni','jonas','hanes','nina','michi','trixi','raffi','andi','janosch','mischa'];
  familySkins.forEach(id => {
    const ch = ALL_CHARACTERS.find(c=>c.id===id);
    if (!ch) return;
    const owned = unlockedSkins.includes(id);
    items.push({ id:`skin_${id}`, category:'family', name:`${ch.emoji} ${ch.name}`, icon:ch.emoji, price:ch.price||300, desc:`Spiele als ${ch.name}!`, owned, skinId:id });
  });

  // ---- SPECIAL SKINS ----
  items.push({id:'skin_swimmer', category:'skin', name:'🏊 Schwimmer', icon:'🏊', price:1000, desc:'Schwimmer-Skin! <span style="color:#FFD700">+1.1× Punkte-Bonus</span>', owned:unlockedSkins.includes('swimmer'), skinId:'swimmer'});
  items.push({id:'skin_kniffler', category:'skin', name:'🎲 Kniffler', icon:'🎲', price:100, desc:'Kniffler-Skin! <span style="color:#FFD700">+1.1× Punkte-Bonus</span>', owned:unlockedSkins.includes('kniffler'), skinId:'kniffler'});

  // OG-Mann — nur 1 Woche ab Account-Erstellung
  const ogExpires = base + 7*24*60*60*1000;
  if (now < ogExpires || unlockedSkins.includes('og_mann')) {
    items.push({id:'skin_og', category:'skin', name:'🧓 OG-Mann', icon:'🧓', price:100000, desc:'Legendärer OG-Mann! Limitiert.', limited:true, limitExpires:ogExpires, owned:unlockedSkins.includes('og_mann'), skinId:'og_mann'});
  }

  // Developer — ultra rare 1 Woche
  const devExpires = base + 7*24*60*60*1000;
  if (now < devExpires || unlockedSkins.includes('developer')) {
    items.push({id:'skin_dev', category:'skin', name:'💻 Entwickler', icon:'💻', price:1000000000, desc:'Ultra-Rare! Einer von wenigen!', limited:true, limitExpires:devExpires, owned:unlockedSkins.includes('developer'), skinId:'developer', ultraRare:true});
  }

  // TEST char — nur 20 Minuten
  const testExpiry = parseInt(localStorage.getItem('mischa_test_char_until') || '0');
  if (!testExpiry) localStorage.setItem('mischa_test_char_until', String(now + 20*60*1000));
  const testUntil = parseInt(localStorage.getItem('mischa_test_char_until'));
  if (now < testUntil || unlockedSkins.includes('test_char')) {
    items.push({id:'skin_test', category:'skin', name:'🧪 TEST (nur 20 Min!)', icon:'🧪', price:1, desc:'Testzwecke! Nur für 20 Minuten im Shop!', limited:true, limitExpires:testUntil, owned:unlockedSkins.includes('test_char'), skinId:'test_char', testOnly:true});
  }

  // ---- EXTRAS ----
  items.push({id:'extra_world_unlock', category:'extra', name:'🔓 Welt freischalten', icon:'🔓', price:500, desc:'Schalte die nächste gesperrte Welt sofort frei!'});
  items.push({id:'extra_score_shield', category:'extra', name:'🛡️ Punkte-Schutz (24h)', icon:'🛡️', price:800, desc:'Die nächsten 3 Fehler kosten keine Punkte!',
    owned: !!(purchases['extra_score_shield']?.expiresAt > now),
    activeUntil: purchases['extra_score_shield']?.expiresAt > now ? purchases['extra_score_shield'].expiresAt : null });
  // Hinweis-Paket: jetzt mit echtem Nutzen!
  const hints = player?.hints || 0;
  items.push({id:'extra_hint', category:'extra', name:`💡 Hinweis-Paket (5×) ${hints>0?`| Du hast: ${hints}💡`:''}`, icon:'💡', price:300, desc:'5 Hinweise! In Mathe/Quiz-Spielen erscheint ein Hinweis-Knopf der dir die richtige Antwort einkreist — aber kostet 10s Zeitstrafe.'});
  items.push({id:'extra_xp_boost', category:'extra', name:'📈 XP-Multiplikator (1h)', icon:'📈', price:1500, desc:'1 Stunde lang zählst du doppelt im Gesamt-Ranking!',
    activeUntil: purchases['extra_xp_boost']?.expiresAt > now ? purchases['extra_xp_boost'].expiresAt : null });

  // ---- SPECIAL ----
  const adminOwned = !!(purchases['admin_week']?.expiresAt > now);
  const adminExpires = purchases['admin_week']?.expiresAt;
  if (!adminOwned || now < adminExpires) {
    items.push({id:'admin_week', category:'special', name:'🔐 Admin-Zugang (1 Woche)', icon:'🔐', price:1000000, desc:'Einmalig! 7 Tage Zugang zum Admin-Panel.', limited:true, limitExpires:base+weekMs, oneTime:true, owned:adminOwned, activeUntil:adminExpires>now?adminExpires:null});
  }

  return items;
}

// ============================================================
// SHOP CONTROLLER
// ============================================================
const Shop = {
  _forPlayer: null,
  _onClose: null,
  _tick: null,

  open(forPlayer=null, onClose=null) {
    Shop._forPlayer = forPlayer;
    Shop._onClose = onClose;
    // Check for broadcast message
    Shop._checkBroadcast();
    Shop._draw();
    clearInterval(Shop._tick);
    Shop._tick = setInterval(() => Shop._tickTimers(), 1000);
  },

  close() {
    clearInterval(Shop._tick);
    document.getElementById('shop-overlay')?.remove();
    document.getElementById('shop-confirm-modal')?.remove();
    if (Shop._onClose) Shop._onClose();
  },

  _checkBroadcast() {
    try {
      const msg = localStorage.getItem('mischa_broadcast');
      if (!msg) return;
      const data = JSON.parse(msg);
      if (data.expiresAt < Date.now()) return;
      const seen = sessionStorage.getItem('mischa_broadcast_seen');
      if (seen === data.id) return;
      sessionStorage.setItem('mischa_broadcast_seen', data.id);
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2000;
        background:linear-gradient(135deg,#E30613,#8B0000);color:white;padding:14px 24px;
        border-radius:14px;font-family:'Fredoka One',cursive;font-size:1rem;max-width:340px;
        box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:popIn 0.4s ease;text-align:center`;
      el.innerHTML = `📢 <b>Nachricht vom Admin:</b><br><span style="font-size:0.88rem;font-weight:normal">${data.text}</span>
        <br><button onclick="this.parentElement.remove()" style="margin-top:8px;background:rgba(255,255,255,0.2);
          border:none;color:white;padding:4px 14px;border-radius:50px;cursor:pointer;font-size:0.82rem">OK</button>`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 10000);
    } catch(e) {}
  },

  _draw() {
    const player = State.currentPlayer;
    if (!player) return;
    const isGift = !!Shop._forPlayer;
    const items = getShopItems(player);
    const cats = [
      {key:'special', label:'🌟 Special'},
      {key:'family',  label:'👨‍👩‍👧‍👦 Familie'},
      {key:'skin',    label:'👗 Skins'},
      {key:'joker',   label:'🃏 Joker'},
      {key:'boost',   label:'⭐ Sterne-Boosts'},
      {key:'extra',   label:'🎯 Extras'},
    ];

    document.getElementById('shop-overlay')?.remove();
    const ov = document.createElement('div');
    ov.id = 'shop-overlay';
    ov.style.cssText = `position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.78);
      display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(5px)`;

    ov.innerHTML = `
      <div id="shop-panel" style="background:linear-gradient(180deg,#0d1b2e,#0f2040);
        width:100%;max-width:480px;border-radius:24px 24px 0 0;max-height:88vh;overflow-y:auto;
        box-shadow:0 -8px 40px rgba(0,0,0,0.6);animation:slideUp 0.3s ease">

        <!-- Sticky header -->
        <div style="position:sticky;top:0;z-index:10;background:#0d1b2e;padding:16px 18px 12px;
          border-bottom:1px solid rgba(255,255,255,0.08)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-family:'Fredoka One',cursive;font-size:1.4rem;color:#FFD700">
                ${isGift?`🎁 Für ${Shop._forPlayer}`:'🛒 Shop'}</div>
              <div style="font-size:0.8rem;color:rgba(255,255,255,0.45)">⭐ <b style="color:#FFD700">${(player.totalScore||0).toLocaleString()}</b> Sterne</div>
              ${(()=>{const m=State.getCharacterMultiplier(player);return m>1?`<div style="font-size:0.75rem;margin-top:2px;background:linear-gradient(90deg,#FF6B6B,#FFD700,#27AE60,#4A90D9,#9B59B6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700">✨ ${m.toFixed(1)}× Charakter-Bonus aktiv!</div>`:''})()}
            </div>
            <button onclick="Shop.close()" style="background:rgba(255,255,255,0.1);border:none;color:white;
              width:34px;height:34px;border-radius:50%;font-size:1.1rem;cursor:pointer">✕</button>
          </div>
        </div>

        <div style="padding:14px 16px">
          ${!isGift?`<button onclick="Shop._giftList()" style="width:100%;padding:10px;border-radius:10px;
            background:rgba(255,105,180,0.12);border:2px solid rgba(255,105,180,0.35);
            color:#FF69B4;font-family:'Fredoka One',cursive;font-size:0.95rem;cursor:pointer;margin-bottom:14px">
            🎁 Jemandem etwas schenken
          </button>`:''}

          ${cats.map(cat=>{
            const ci = items.filter(i=>i.category===cat.key);
            if(!ci.length) return '';
            return `<div style="margin-bottom:18px">
              <div style="font-family:'Fredoka One',cursive;font-size:0.88rem;color:rgba(255,255,255,0.5);
                margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:4px">${cat.label}</div>
              ${ci.map(item=>Shop._card(item,player,isGift)).join('')}
            </div>`;
          }).join('')}
        </div>
      </div>
      <style>
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
      </style>`;

    document.body.appendChild(ov);
  },

  _card(item, player, isGift) {
    const now = Date.now();
    const canAfford = (player.totalScore||0) >= getDiscountedPrice(item.price, item.id);
    const disc = getDiscount(item.id);
    const dp = getDiscountedPrice(item.price, item.id);
    const timeLeft = item.limitExpires ? item.limitExpires - now : null;
    const activeLeft = item.activeUntil ? item.activeUntil - now : null;

    const isOwned = item.owned || (item.permanent && (player.purchases||{})[item.id]);
    const cantBuy = isOwned && (item.permanent || item.owned);

    const border = item.ultraRare?'rgba(255,215,0,0.6)':item.testOnly?'rgba(0,255,0,0.5)':item.limited?'rgba(231,76,60,0.35)':'rgba(255,255,255,0.09)';
    const bg = item.ultraRare?'linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,165,0,0.05))':item.testOnly?'rgba(0,255,0,0.05)':'rgba(255,255,255,0.04)';

    return `<div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:11px;margin-bottom:7px">
      <div style="display:flex;align-items:center;gap:9px">
        <div style="font-size:1.7rem;min-width:38px;text-align:center">${item.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Fredoka One',cursive;font-size:0.88rem;${item.maxLuck?'background:linear-gradient(90deg,#FF6B6B,#FFD700,#27AE60,#4A90D9,#9B59B6);-webkit-background-clip:text;-webkit-text-fill-color:transparent':''}color:${!item.maxLuck&&item.ultraRare?'#FFD700':'white'}">${item.maxLuck?'👑 '+item.name:item.name}</div>
          <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:1px;line-height:1.3">${item.desc}</div>
          ${isOwned&&item.permanent?'<div style="font-size:0.7rem;color:#27AE60;margin-top:2px">✅ Besitzt du</div>':''}
          ${activeLeft&&activeLeft>0?`<div id="at-${item.id}" style="font-size:0.7rem;color:#27AE60;margin-top:2px">✅ Aktiv: ${formatTimeLeft(activeLeft)}</div>`:''}
          ${timeLeft&&timeLeft>0&&!isOwned?`<div id="lt-${item.id}" style="font-size:0.7rem;color:#E67E22;margin-top:2px">⏰ ${formatTimeLeft(timeLeft)}</div>`:''}
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:72px">
          ${item.price>0?`
            ${disc?`<div style="font-size:0.65rem;color:rgba(255,255,255,0.3);text-decoration:line-through">⭐${dp<item.price?item.price.toLocaleString():''}</div>`:''}
            <div style="font-family:'Fredoka One',cursive;color:${disc?'#27AE60':'#FFD700'};font-size:0.85rem">
              ⭐${dp.toLocaleString()}${disc?` <span style="background:#E74C3C;color:white;border-radius:3px;padding:1px 3px;font-size:0.6rem">-${disc}%</span>`:''}
            </div>`:''}
          ${!cantBuy&&item.price>0?`
            <button onclick="Shop._confirm('${item.id}',${isGift})"
              style="margin-top:4px;padding:4px 11px;border-radius:50px;border:none;cursor:pointer;
                font-family:'Fredoka One',cursive;font-size:0.75rem;
                background:${canAfford?'linear-gradient(135deg,#FFD700,#FFA500)':'rgba(255,255,255,0.08)'};
                color:${canAfford?'#2C3E50':'rgba(255,255,255,0.25)'};
                ${!canAfford?'cursor:not-allowed':''}">
              ${canAfford?'Kaufen':'Zu wenig'}
            </button>`:cantBuy&&!item.activeUntil?'<div style="font-size:0.68rem;color:#27AE60;margin-top:4px">✅</div>':''}
        </div>
      </div>
    </div>`;
  },

  _tickTimers() {
    const now = Date.now();
    const player = State.currentPlayer;
    if (!player) return;
    const items = getShopItems(player);
    items.forEach(i => {
      const atEl = document.getElementById(`at-${i.id}`);
      if (atEl && i.activeUntil && i.activeUntil > now) atEl.textContent = `✅ Aktiv: ${formatTimeLeft(i.activeUntil-now)}`;
      const ltEl = document.getElementById(`lt-${i.id}`);
      if (ltEl && i.limitExpires && i.limitExpires > now) ltEl.textContent = `⏰ ${formatTimeLeft(i.limitExpires-now)}`;
    });
  },

  // ---- GIFT LIST ----
  async _giftList() {
    const panel = document.getElementById('shop-panel');
    if (!panel) return;
    const inner = panel.lastElementChild;
    inner.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.4);padding:30px">⏳</div>`;
    const all = await State.getAll();
    const me = State.currentPlayer?.name?.toLowerCase();
    const others = Object.values(all).filter(p=>p.name.toLowerCase()!==me);
    const E = {spongebob:'🧽',patrick:'⭐',mario:'🍄',luigi:'💚',stickman:'🎨',woman:'👩',man:'👨',
      girl:'👧',boy:'👦',ninja:'🥷',astronaut:'🧑‍🚀',detective:'🕵️',princess:'👸',knight:'⚔️',
      scientist:'🧪',explorer:'🧭',swimmer:'🏊',kniffler:'🎲',og_mann:'🧓',developer:'💻',
      oma:'👵',opa:'👴',steffi:'💁',tom:'🧑',benni:'😎',jonas:'🙃',hanes:'🤙',nina:'💃',
      michi:'🏃',trixi:'🌸',raffi:'🦊',andi:'🤓',janosch:'🎭',mischa:'🦁',test_char:'🧪'};
    inner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:'Fredoka One',cursive;color:#FF69B4;font-size:1.2rem">🎁 Wen beschenken?</div>
        <button onclick="Shop.close();Shop.open(null,Shop._onClose)" style="background:rgba(255,255,255,0.1);
          border:none;color:white;padding:5px 11px;border-radius:8px;cursor:pointer;font-size:0.82rem">◀</button>
      </div>
      ${others.length===0?'<div style="color:rgba(255,255,255,0.3);text-align:center;padding:24px">Keine anderen Spieler</div>'
        :others.sort((a,b)=>(b.totalScore||0)-(a.totalScore||0)).map(p=>`
          <div onclick="Shop.close();Shop.open('${p.name}',Shop._onClose)"
            style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;
              background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);margin-bottom:5px;cursor:pointer"
            onmouseover="this.style.borderColor='rgba(255,105,180,0.4)'"
            onmouseout="this.style.borderColor='rgba(255,255,255,0.07)'">
            <span style="font-size:1.3rem">${E[p.character]||'🧭'}</span>
            <div style="flex:1">
              <div style="color:white;font-size:0.88rem;font-weight:700">${p.name}</div>
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.35)">⭐${p.totalScore||0} · Welt ${p.currentWorld||1}/10</div>
            </div>
            <span style="color:#FF69B4">🎁</span>
          </div>`).join('')}`;
  },

  // ---- CONFIRM (Robux loading) ----
  _confirm(itemId, isGift) {
    const player = State.currentPlayer;
    const item = getShopItems(player).find(i=>i.id===itemId);
    if (!item) return;
    const dp = getDiscountedPrice(item.price, itemId);
    document.getElementById('shop-confirm-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'shop-confirm-modal';
    m.style.cssText = `position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,0.88);
      display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)`;
    m.innerHTML = `
      <div style="background:#0d1b2e;border:2px solid rgba(255,215,0,0.3);border-radius:18px;
        padding:24px 20px;max-width:290px;width:90%;text-align:center;animation:popIn 0.3s ease">
        <div style="font-size:2.5rem;margin-bottom:6px">${item.icon}</div>
        <div style="font-family:'Fredoka One',cursive;color:white;font-size:1.05rem;margin-bottom:4px">${item.name}</div>
        ${isGift?`<div style="font-size:0.78rem;color:#FF69B4;margin-bottom:4px">🎁 Für ${Shop._forPlayer}</div>`:''}
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:16px">${item.desc.replace(/<[^>]+>/g,' ')}</div>
        <!-- Robux-style button -->
        <div id="cBtn" onclick="Shop._load('${itemId}',${isGift})"
          style="border-radius:50px;padding:12px 18px;cursor:pointer;position:relative;overflow:hidden;
            background:linear-gradient(135deg,#FFD700,#FFA500);color:#2C3E50;margin-bottom:10px;
            font-family:'Fredoka One',cursive;font-size:1.05rem;box-shadow:0 5px 18px rgba(255,165,0,0.35)">
          ⭐ ${dp.toLocaleString()} Sterne
          <div id="cFill" style="position:absolute;top:0;left:-100%;width:100%;height:100%;
            background:rgba(255,255,255,0.38);border-radius:50px;pointer-events:none;
            transition:none"></div>
        </div>
        <div style="font-size:0.68rem;color:rgba(255,255,255,0.3);margin-bottom:10px">Klicke zum Kaufen</div>
        <button onclick="document.getElementById('shop-confirm-modal').remove()"
          style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);
            color:rgba(255,255,255,0.5);padding:6px 20px;border-radius:50px;cursor:pointer;font-size:0.85rem">
          Abbrechen
        </button>
      </div>`;
    document.body.appendChild(m);
  },

  _loading: false,
  _load(itemId, isGift) {
    if (Shop._loading) return;
    Shop._loading = true;
    const btn = document.getElementById('cBtn');
    const fill = document.getElementById('cFill');
    if (!btn||!fill) return;
    btn.onclick = null; btn.style.cursor='default';
    fill.style.transition = 'left 2s linear';
    fill.style.left = '0%';
    setTimeout(() => { Shop._loading=false; Shop._buy(itemId, isGift); }, 2150);
  },

  async _buy(itemId, isGift) {
    document.getElementById('shop-confirm-modal')?.remove();
    const buyer = State.currentPlayer;
    const item = getShopItems(buyer).find(i=>i.id===itemId);
    if (!item) return;
    const dp = getDiscountedPrice(item.price, itemId);
    if ((buyer.totalScore||0) < dp) { Shop._toast('❌ Nicht genug Sterne!', false); return; }

    await State.addPoints(buyer.name, -dp);
    const targetName = isGift ? Shop._forPlayer : buyer.name;
    const target = await State.getPlayer(targetName);
    if (!target) { Shop._toast('❌ Spieler nicht gefunden!', false); return; }
    if (!target.purchases) target.purchases = {};
    if (!target.unlockedSkins) target.unlockedSkins = [];
    const now = Date.now();

    // Apply
    if (itemId==='joker_x2') { target.maxJokersPerWorld=2; target.purchases[itemId]={active:true,at:now}; }
    if (itemId==='joker_x3') { target.maxJokersPerWorld=3; target.purchases[itemId]={active:true,at:now}; }
    if (itemId.startsWith('boost_') && item.duration) {
      const exp=now+item.duration;
      target.purchases[itemId]={active:true,at:now,expiresAt:exp};
      target.activeStarMultiplier=item.mult||2;
      target.starMultiplierExpires=exp;
    }
    if (itemId.startsWith('skin_') || itemId==='starter_pack') {
      target.purchases[itemId]={active:true,at:now};
    }
    if (item.skinId && !target.unlockedSkins.includes(item.skinId)) {
      target.unlockedSkins.push(item.skinId);
    }
    if (itemId==='starter_pack') {
      const exp=now+15*60*1000;
      target.purchases['boost_2x_15']={active:true,at:now,expiresAt:exp};
      target.activeStarMultiplier=2; target.starMultiplierExpires=exp;
      if(!target.unlockedSkins.includes('kniffler')) target.unlockedSkins.push('kniffler');
    }
    if (itemId==='admin_week') {
      const exp=now+7*24*60*60*1000;
      target.purchases[itemId]={active:true,at:now,expiresAt:exp};
      target.adminAccessExpires=exp;
    }
    if (itemId==='extra_world_unlock') { if((target.currentWorld||1)<10) target.currentWorld=(target.currentWorld||1)+1; }
    if (itemId==='extra_score_shield') { const exp=now+24*60*60*1000; target.purchases[itemId]={active:true,at:now,expiresAt:exp}; target.scoreShieldExpires=exp; target.scoreShieldCharges=3; }
    if (itemId==='extra_hint') { target.hints=(target.hints||0)+5; }
    if (itemId==='extra_xp_boost') { const exp=now+60*60*1000; target.purchases[itemId]={active:true,at:now,expiresAt:exp}; }

    await State.savePlayer(target);
    State.currentPlayer = await State.getPlayer(buyer.name);

    if (itemId==='admin_week') {
      Shop.close();
      Shop._bigMsg('🔐 Admin-Zugang!',
        `7 Tage Admin-Panel Zugang!<br><br><span style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#FFD700">Passwort: mischa2026</span><br><br><span style="font-size:0.72rem;color:rgba(255,255,255,0.35)">Läuft in 7 Tagen ab</span>`);
      return;
    }

    Shop._toast(isGift ? `🎁 ${targetName} hat ${item.name} erhalten!` : `✅ ${item.name} erhalten!`, true);
    setTimeout(()=>{ Shop.close(); if(App?.showWorldMap) App.showWorldMap(); }, 1500);
  },

  _toast(msg, ok) {
    const t=document.createElement('div');
    t.style.cssText=`position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:2000;
      background:${ok?'#27AE60':'#E74C3C'};color:white;padding:12px 22px;border-radius:50px;
      font-family:'Fredoka One',cursive;font-size:1rem;box-shadow:0 4px 16px rgba(0,0,0,0.3);
      animation:popIn 0.3s ease;white-space:nowrap`;
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 2500);
  },

  _bigMsg(title, body) {
    const d=document.createElement('div');
    d.style.cssText=`position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.9);
      display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)`;
    d.innerHTML=`<div style="background:#0d1b2e;border:2px solid #FFD700;border-radius:20px;
      padding:28px 22px;max-width:310px;width:90%;text-align:center;animation:popIn 0.3s ease">
      <div style="font-family:'Fredoka One',cursive;color:#FFD700;font-size:1.3rem;margin-bottom:10px">${title}</div>
      <div style="color:rgba(255,255,255,0.75);font-size:0.9rem;margin-bottom:18px;line-height:1.5">${body}</div>
      <button onclick="this.closest('div[style]').remove();App&&App.showWorldMap&&App.showWorldMap()"
        style="background:linear-gradient(135deg,#FFD700,#FFA500);border:none;color:#2C3E50;
          padding:11px 26px;border-radius:50px;font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer">
        Super! 🏆
      </button>
    </div>`;
    document.body.appendChild(d);
  },

  _fmt(p) {
    if(p>=1000000000) return (p/1000000000).toFixed(0)+'Mrd';
    if(p>=1000000) return (p/1000000).toFixed(0)+'M';
    if(p>=1000) return (p/1000).toFixed(0)+'K';
    return p.toString();
  },
};

// ============================================================
// WARDROBE
// ============================================================
const Wardrobe = {
  open(onClose) {
    const player = State.currentPlayer;
    if (!player) return;
    const unlocked = player.unlockedSkins || [];
    const current = player.character;
    const available = ALL_CHARACTERS.filter(c => c.free || unlocked.includes(c.id));
    const locked    = ALL_CHARACTERS.filter(c => !c.free && !unlocked.includes(c.id) && !c.ultraRare);

    document.getElementById('wardrobe-overlay')?.remove();
    const ov = document.createElement('div');
    ov.id = 'wardrobe-overlay';
    ov.style.cssText = `position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.78);
      display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(5px)`;

    ov.innerHTML = `
      <div style="background:linear-gradient(180deg,#0d1b2e,#0f2040);width:100%;max-width:480px;
        border-radius:24px 24px 0 0;padding:20px 16px 30px;max-height:84vh;overflow-y:auto;
        box-shadow:0 -8px 40px rgba(0,0,0,0.6);animation:slideUp 0.3s ease">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#FFD700">👗 Garderobe</div>
          <button onclick="Wardrobe.close()" style="background:rgba(255,255,255,0.1);border:none;
            color:white;width:32px;height:32px;border-radius:50%;font-size:1.1rem;cursor:pointer">✕</button>
        </div>
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:12px">
          Aktiv: ${ALL_CHARACTERS.find(c=>c.id===current)?.emoji||'🧭'} <b style="color:white">${ALL_CHARACTERS.find(c=>c.id===current)?.name||''}</b>
        </div>
        <!-- Available -->
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:8px">✅ Verfügbar</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-bottom:16px">
          ${available.map(c=>`
            <div onclick="Wardrobe._pick('${c.id}')"
              style="background:${current===c.id?'rgba(255,215,0,0.15)':'rgba(255,255,255,0.05)'};
                border:2px solid ${current===c.id?'#FFD700':'rgba(255,255,255,0.08)'};
                border-radius:12px;padding:8px 4px;text-align:center;cursor:pointer;transition:all 0.15s">
              <div style="font-size:1.8rem">${c.emoji}</div>
              <div style="font-size:0.58rem;color:${current===c.id?'#FFD700':'rgba(255,255,255,0.45)'};margin-top:2px">${c.name}</div>
            </div>`).join('')}
        </div>
        <!-- Locked -->
        ${locked.length?`
          <div style="font-size:0.8rem;color:rgba(255,255,255,0.35);margin-bottom:8px">🔒 Kaufbar im Shop</div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-bottom:14px">
            ${locked.map(c=>`
              <div onclick="Wardrobe.close();Shop.open(null,()=>App&&App.showWorldMap&&App.showWorldMap())"
                style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
                  border-radius:12px;padding:8px 4px;text-align:center;cursor:pointer;opacity:0.55">
                <div style="font-size:1.8rem;filter:grayscale(1)">${c.emoji}</div>
                <div style="font-size:0.55rem;color:rgba(255,255,255,0.35);margin-top:2px">🔒 ⭐${c.price||300}</div>
              </div>`).join('')}
          </div>`:''}
        <button onclick="Wardrobe.close();Shop.open(null,()=>App&&App.showWorldMap&&App.showWorldMap())"
          style="width:100%;padding:10px;border-radius:10px;background:rgba(255,215,0,0.12);
            border:2px solid rgba(255,215,0,0.35);color:#FFD700;font-family:'Fredoka One',cursive;
            font-size:0.9rem;cursor:pointer">
          🛒 Shop — Neue Skins
        </button>
      </div>`;
    document.body.appendChild(ov);
  },

  async _pick(charId) {
    const p = State.currentPlayer;
    if (!p) return;
    p.character = charId;
    await State.savePlayer(p);
    State.currentPlayer = p;
    Wardrobe.close();
    Wardrobe.open();
  },

  close() {
    document.getElementById('wardrobe-overlay')?.remove();
    if (App?.showWorldMap) App.showWorldMap();
  },
};

window.Shop = Shop;
window.Wardrobe = Wardrobe;
window.ALL_CHARACTERS = ALL_CHARACTERS;
window.getShopItems = getShopItems;
window.formatTimeLeft = formatTimeLeft;
