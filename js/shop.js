/**
 * shop.js v2 — Mischa Denkspiel Shop
 * Fixes: kein Hängen, Timer-Anzeige, neue Skins, Starterpaket
 * Limitierte Angebote mit Countdown
 */

// ============================================================
// ALL CHARACTERS (for wardrobe)
// ============================================================
const ALL_CHARACTERS = [
  // Free
  { id:'spongebob',  emoji:'🧽', name:'SpongeBob',      free:true },
  { id:'patrick',    emoji:'⭐', name:'Patrick',         free:true },
  { id:'mario',      emoji:'🍄', name:'Mario',           free:true },
  { id:'luigi',      emoji:'💚', name:'Luigi',           free:true },
  { id:'stickman',   emoji:'🎨', name:'Strichmännchen',  free:true, hasColors:true },
  { id:'woman',      emoji:'👩', name:'Wanderin',        free:true },
  { id:'man',        emoji:'👨', name:'Wanderer',        free:true },
  { id:'girl',       emoji:'👧', name:'Mädchen',         free:true },
  { id:'boy',        emoji:'👦', name:'Junge',           free:true },
  { id:'ninja',      emoji:'🥷', name:'Ninja',           free:true },
  { id:'astronaut',  emoji:'🧑‍🚀', name:'Astronaut',  free:true },
  { id:'detective',  emoji:'🕵️', name:'Detektiv',       free:true },
  { id:'princess',   emoji:'👸', name:'Prinzessin',      free:true },
  { id:'knight',     emoji:'⚔️', name:'Ritter',          free:true },
  { id:'scientist',  emoji:'🧪', name:'Wissenschaftler', free:true },
  { id:'explorer',   emoji:'🧭', name:'Entdecker',       free:true },
  // Shop skins
  { id:'swimmer',    emoji:'🏊', name:'Der Schwimmer',   free:false, price:1000,      shopItem:'skin_swimmer' },
  { id:'kniffler',   emoji:'🎲', name:'Der Kniffler',    free:false, price:100,       shopItem:'skin_kniffler', starterPack:true },
  { id:'og_mann',    emoji:'👴', name:'OG-Mann',         free:false, price:100000,    shopItem:'skin_og', limited:true, limitDays:7 },
  { id:'developer',  emoji:'💻', name:'Der Entwickler',  free:false, price:1000000000,shopItem:'skin_dev', limited:true, limitDays:7, ultraRare:true },
];

// ============================================================
// SHOP ITEMS
// ============================================================
function getShopItems(player) {
  const now = Date.now();
  const purchases = player?.purchases || {};

  // Check if limited items are still available (based on account creation or first seen)
  const accountAge = now - (player?.createdAt || now);
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  return [
    // ---- STARTER PACK ----
    {
      id: 'starter_pack',
      name: '🎁 Starterpaket',
      desc: '2× Sterne für 15 Min + Charakter "Der Kniffler"<br><b>Nur einmal kaufbar!</b>',
      icon: '🎁',
      price: 100,
      category: 'special',
      oneTime: true,
      owned: !!purchases['starter_pack'],
    },

    // ---- JOKER ----
    {
      id: 'joker_x2',
      name: '2× Joker pro Welt',
      desc: 'In jeder Welt stehen dir 2 Joker zur Verfügung!',
      icon: '🃏🃏',
      price: 1000,
      category: 'joker',
      permanent: true,
      owned: (player?.maxJokersPerWorld || 1) >= 2,
    },
    {
      id: 'joker_x3',
      name: '3× Joker pro Welt',
      desc: 'Maximaler Schutz — 3 Joker pro Welt!',
      icon: '🃏🃏🃏',
      price: 200000,
      category: 'joker',
      permanent: true,
      owned: (player?.maxJokersPerWorld || 1) >= 3,
    },

    // ---- STERNE-BOOSTS ----
    {
      id: 'boost_2x_15',
      name: '2× Sterne (15 Min)',
      desc: 'Alle Punkte werden 15 Minuten lang verdoppelt!',
      icon: '⭐×2',
      price: 50,
      category: 'boost',
      duration: 15 * 60 * 1000,
      multiplier: 2,
      activeUntil: purchases['boost_2x_15']?.expiresAt > now ? purchases['boost_2x_15'].expiresAt : null,
    },
    {
      id: 'boost_4x_15',
      name: '4× Sterne (15 Min)',
      desc: 'Vierfache Punkte für 15 Minuten!',
      icon: '⭐×4',
      price: 300,
      category: 'boost',
      duration: 15 * 60 * 1000,
      multiplier: 4,
      activeUntil: purchases['boost_4x_15']?.expiresAt > now ? purchases['boost_4x_15'].expiresAt : null,
    },
    {
      id: 'boost_10x_15',
      name: '10× Sterne (15 Min)',
      desc: 'Zehnfache Punkte — 15 Minuten Wahnsinn!',
      icon: '🌟×10',
      price: 1000,
      category: 'boost',
      duration: 15 * 60 * 1000,
      multiplier: 10,
      activeUntil: purchases['boost_10x_15']?.expiresAt > now ? purchases['boost_10x_15'].expiresAt : null,
    },
    {
      id: 'boost_10x_30',
      name: '10× Sterne (30 Min)',
      desc: 'Zehnfache Punkte für 30 Minuten!',
      icon: '🌟×10 ⏱30',
      price: 2000,
      category: 'boost',
      duration: 30 * 60 * 1000,
      multiplier: 10,
      activeUntil: purchases['boost_10x_30']?.expiresAt > now ? purchases['boost_10x_30'].expiresAt : null,
    },
    {
      id: 'boost_10x_60',
      name: '10× Sterne (1 Stunde)',
      desc: 'Eine volle Stunde zehnfache Punkte!',
      icon: '🌟×10 ⏱60',
      price: 5000,
      category: 'boost',
      duration: 60 * 60 * 1000,
      multiplier: 10,
      activeUntil: purchases['boost_10x_60']?.expiresAt > now ? purchases['boost_10x_60'].expiresAt : null,
    },

    // ---- SKINS ----
    {
      id: 'skin_swimmer',
      name: 'Skin: Der Schwimmer 🏊',
      desc: 'Schalte den Schwimmer-Charakter frei!',
      icon: '🏊',
      price: 1000,
      category: 'skin',
      owned: !!purchases['skin_swimmer'],
    },
    {
      id: 'skin_og',
      name: 'Skin: OG-Mann 👴',
      desc: 'Der legendäre OG-Mann! Limitiert — nur 1 Woche verfügbar!',
      icon: '👴',
      price: 100000,
      category: 'skin',
      limited: true,
      limitExpires: (player?.createdAt || now) + weekMs,
      owned: !!purchases['skin_og'],
    },
    {
      id: 'skin_dev',
      name: '💻 DER ENTWICKLER',
      desc: 'Ultra-Rare! Nur diese Woche. Einer von wenigen!',
      icon: '💻',
      price: 1000000000,
      category: 'skin',
      limited: true,
      limitExpires: (player?.createdAt || now) + weekMs,
      owned: !!purchases['skin_dev'],
      ultraRare: true,
    },

    // ---- SPECIAL ----
    {
      id: 'admin_week',
      name: '🔐 Admin-Zugang (1 Woche)',
      desc: 'Einmaliges Angebot! Admin-Panel-Zugang für 7 Tage.',
      icon: '🔐',
      price: 1000000,
      category: 'special',
      limited: true,
      limitExpires: (player?.createdAt || now) + weekMs,
      oneTime: true,
      owned: !!(purchases['admin_week'] && purchases['admin_week'].expiresAt > now),
      activeUntil: purchases['admin_week']?.expiresAt > now ? purchases['admin_week'].expiresAt : null,
    },

    // ---- EXTRA ----
    {
      id: 'extra_world_unlock',
      name: '🔓 Welt sofort freischalten',
      desc: 'Schalte die nächste gesperrte Welt sofort frei!',
      icon: '🔓',
      price: 500,
      category: 'extra',
    },
    {
      id: 'extra_score_shield',
      name: '🛡️ Punkte-Schutzschild',
      desc: 'Die nächsten 3 Fehler kosten keine Punkte. 24 Stunden aktiv.',
      icon: '🛡️',
      price: 800,
      category: 'extra',
      duration: 24 * 60 * 60 * 1000,
      activeUntil: purchases['extra_score_shield']?.expiresAt > now ? purchases['extra_score_shield'].expiresAt : null,
    },
    {
      id: 'extra_hint',
      name: '💡 Hinweis-Paket (5×)',
      desc: '5 Hinweise die du bei schwierigen Aufgaben einsetzen kannst.',
      icon: '💡',
      price: 300,
      category: 'extra',
    },
  ].filter(item => {
    // Hide expired limited items
    if (item.limited && item.limitExpires && Date.now() > item.limitExpires && !item.owned) return false;
    return true;
  });
}

// ============================================================
// HELPER: format time remaining
// ============================================================
function formatTimeLeft(ms) {
  if (ms <= 0) return 'abgelaufen';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d > 0) return `${d}T ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ============================================================
// DISCOUNT HELPER
// ============================================================
function getDiscount(itemId) {
  try {
    const discounts = JSON.parse(localStorage.getItem('mischa_discounts') || '{}');
    const d = discounts[itemId];
    if (d && d.expiresAt > Date.now()) return d.pct;
  } catch(e) {}
  return 0;
}

function getDiscountedPrice(item) {
  const pct = getDiscount(item.id);
  if (!pct) return item.price;
  return Math.max(1, Math.round(item.price * (1 - pct / 100)));
}

// ============================================================
// SHOP CONTROLLER
// ============================================================
const Shop = {
  _forPlayer: null,
  _onClose: null,
  _tickInterval: null,

  open(forPlayer = null, onClose = null) {
    const player = State.currentPlayer;
    if (!player) return;
    Shop._forPlayer = forPlayer;
    Shop._onClose = onClose;
    Shop._renderShop();
    // Live-update timers every second
    clearInterval(Shop._tickInterval);
    Shop._tickInterval = setInterval(() => Shop._updateTimers(), 1000);
  },

  close() {
    clearInterval(Shop._tickInterval);
    document.getElementById('shop-overlay')?.remove();
    document.getElementById('shop-confirm-modal')?.remove();
    if (Shop._onClose) Shop._onClose();
  },

  _renderShop() {
    const player = State.currentPlayer;
    const isGift = !!Shop._forPlayer;
    const items = getShopItems(player);
    const now = Date.now();

    // Active boosts
    const purchases = player.purchases || {};
    const activeBoosts = Object.entries(purchases)
      .filter(([id, p]) => p?.expiresAt && p.expiresAt > now && id.startsWith('boost'))
      .map(([id, p]) => ({
        id,
        item: items.find(i => i.id === id),
        remaining: p.expiresAt - now,
      }));

    const existing = document.getElementById('shop-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'shop-overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.75);
      display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(5px)`;

    const catLabels = { special:'🌟 Special', joker:'🃏 Joker', boost:'⭐ Sterne-Boosts', skin:'👗 Skins', extra:'🎯 Extras' };
    const cats = ['special','skin','joker','boost','extra'];

    overlay.innerHTML = `
      <div id="shop-panel" style="background:linear-gradient(180deg,#0d1b2e,#0f2040);
        width:100%;max-width:480px;border-radius:24px 24px 0 0;
        padding:0 0 32px;max-height:88vh;overflow-y:auto;
        box-shadow:0 -8px 40px rgba(0,0,0,0.6);animation:slideUp 0.3s ease">

        <!-- Sticky header -->
        <div style="position:sticky;top:0;z-index:10;background:linear-gradient(180deg,#0d1b2e,#0d1b2eee);
          padding:18px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:#FFD700">
                ${isGift ? `🎁 Geschenk für ${Shop._forPlayer}` : '🛒 Shop'}
              </div>
              <div style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin-top:2px">
                Deine Sterne: <b style="color:#FFD700">⭐ ${(player.totalScore||0).toLocaleString()}</b>
              </div>
            </div>
            <button onclick="Shop.close()" style="background:rgba(255,255,255,0.1);border:none;color:white;
              width:36px;height:36px;border-radius:50%;font-size:1.2rem;cursor:pointer;flex-shrink:0">✕</button>
          </div>

          <!-- Active boosts ticker -->
          ${activeBoosts.length > 0 ? `
            <div style="background:rgba(255,215,0,0.12);border:1px solid rgba(255,215,0,0.3);border-radius:10px;
              padding:8px 12px;margin-top:10px">
              <div style="font-size:0.72rem;color:#FFD700;font-weight:700;margin-bottom:4px">⚡ AKTIVE BOOSTS</div>
              ${activeBoosts.map(b => `
                <div style="font-size:0.8rem;color:rgba(255,255,255,0.8);display:flex;justify-content:space-between">
                  <span>${b.item?.icon||'⭐'} ${b.item?.name||b.id}</span>
                  <span id="timer-${b.id}" style="color:#27AE60">⏱ ${formatTimeLeft(b.remaining)}</span>
                </div>`).join('')}
            </div>` : ''}
        </div>

        <div style="padding:16px 20px">
          <!-- Gift button -->
          ${!isGift ? `
            <button onclick="Shop._openGiftSelector()" style="width:100%;padding:11px;border-radius:12px;
              background:rgba(255,105,180,0.15);border:2px solid rgba(255,105,180,0.4);
              color:#FF69B4;font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer;margin-bottom:16px">
              🎁 Jemandem ein Geschenk schicken
            </button>` : ''}

          <!-- Items by category -->
          ${cats.map(cat => {
            const catItems = items.filter(i => i.category === cat);
            if (!catItems.length) return '';
            return `
              <div style="margin-bottom:20px">
                <div style="font-family:'Fredoka One',cursive;font-size:0.95rem;
                  color:rgba(255,255,255,0.6);margin-bottom:10px;
                  border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:5px">
                  ${catLabels[cat]||cat}
                </div>
                ${catItems.map(item => Shop._itemCard(item, player, isGift)).join('')}
              </div>`;
          }).join('')}
        </div>
      </div>
      <style>
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fillLoad{from{width:0%}to{width:100%}}
      </style>`;

    document.body.appendChild(overlay);
  },

  _itemCard(item, player, isGift) {
    const now = Date.now();
    const discountedPrice = getDiscountedPrice(item);
    const canAfford = (player.totalScore || 0) >= discountedPrice;
    const isActive = item.activeUntil && item.activeUntil > now;
    const timeLeft = item.limitExpires ? item.limitExpires - now : null;
    const activeTimeLeft = item.activeUntil ? item.activeUntil - now : null;

    let statusBadge = '';
    if (item.owned && item.permanent) {
      statusBadge = `<span style="color:#27AE60;font-size:0.75rem">✅ Besitzt du</span>`;
    } else if (isActive) {
      statusBadge = `<span id="active-${item.id}" style="color:#27AE60;font-size:0.75rem">✅ Aktiv: ${formatTimeLeft(activeTimeLeft)}</span>`;
    } else if (item.limited && timeLeft) {
      statusBadge = `<span id="limit-${item.id}" style="color:#E67E22;font-size:0.75rem">⏰ Noch: ${formatTimeLeft(timeLeft)}</span>`;
    }

    const canBuy = !item.owned || (!item.permanent && !isActive);
    const borderColor = item.ultraRare ? 'rgba(255,215,0,0.6)' : item.limited ? 'rgba(231,76,60,0.4)' : 'rgba(255,255,255,0.1)';
    const bgColor = item.ultraRare ? 'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,165,0,0.06))' :
                    item.limited ? 'rgba(231,76,60,0.08)' : 'rgba(255,255,255,0.04)';

    return `
      <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:14px;
        padding:13px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:1.8rem;min-width:42px;text-align:center">${item.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:'Fredoka One',cursive;font-size:0.9rem;color:white;
              ${item.ultraRare ? 'background:linear-gradient(90deg,#FFD700,#FFA500);-webkit-background-clip:text;-webkit-text-fill-color:transparent' : ''}">
              ${item.name}
            </div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.45);margin-top:2px;line-height:1.3">${item.desc}</div>
            ${statusBadge ? `<div style="margin-top:3px">${statusBadge}</div>` : ''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            ${(()=>{const disc=getDiscount(item.id);const dp=getDiscountedPrice(item);return disc?
              `<div style="font-size:0.7rem;color:#E74C3C;text-decoration:line-through">⭐${Shop._formatPrice(item.price)}</div>
               <div style="font-family:'Fredoka One',cursive;color:#27AE60;font-size:0.88rem">⭐${Shop._formatPrice(dp)} <span style="background:#E74C3C;color:white;border-radius:4px;padding:1px 4px;font-size:0.65rem">-${disc}%</span></div>`
              :`<div style="font-family:'Fredoka One',cursive;color:#FFD700;font-size:0.88rem">⭐${Shop._formatPrice(item.price)}</div>`;})()}
            ${canBuy ? `
              <button onclick="Shop._confirmPurchase('${item.id}', ${isGift})"
                style="margin-top:5px;padding:5px 12px;border-radius:50px;border:none;cursor:pointer;
                  font-family:'Fredoka One',cursive;font-size:0.78rem;
                  background:${canAfford ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'rgba(255,255,255,0.08)'};
                  color:${canAfford ? '#2C3E50' : 'rgba(255,255,255,0.25)'};
                  ${!canAfford ? 'cursor:not-allowed' : ''}">
                ${canAfford ? 'Kaufen' : 'Zu wenig ⭐'}
              </button>` : ''}
          </div>
        </div>
      </div>`;
  },

  _formatPrice(p) {
    if (p >= 1000000000) return (p/1000000000).toFixed(0)+'Mrd';
    if (p >= 1000000) return (p/1000000).toFixed(0)+'M';
    if (p >= 1000) return (p/1000).toFixed(0)+'K';
    return p.toString();
  },

  // Live-update timers in shop
  _updateTimers() {
    const player = State.currentPlayer;
    if (!player) return;
    const purchases = player.purchases || {};
    const now = Date.now();
    const items = getShopItems(player);

    items.forEach(item => {
      // Active boost timer
      const activeEl = document.getElementById(`active-${item.id}`);
      if (activeEl && item.activeUntil && item.activeUntil > now) {
        activeEl.textContent = `✅ Aktiv: ${formatTimeLeft(item.activeUntil - now)}`;
      }
      // Limit countdown
      const limitEl = document.getElementById(`limit-${item.id}`);
      if (limitEl && item.limitExpires && item.limitExpires > now) {
        limitEl.textContent = `⏰ Noch: ${formatTimeLeft(item.limitExpires - now)}`;
      }
      // Active boosts in header
      const headerTimer = document.getElementById(`timer-${item.id}`);
      if (headerTimer) {
        const p = purchases[item.id];
        if (p?.expiresAt > now) {
          headerTimer.textContent = `⏱ ${formatTimeLeft(p.expiresAt - now)}`;
        }
      }
    });
  },

  // ---- GIFT SELECTOR ----
  async _openGiftSelector() {
    const panel = document.getElementById('shop-panel');
    if (!panel) return;
    const inner = panel.querySelector('div[style*="padding:16px"]') || panel;
    inner.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.4);padding:40px">⏳ Lade Spieler...</div>`;

    const all = await State.getAll();
    const me = State.currentPlayer?.name?.toLowerCase();
    const others = Object.values(all).filter(p => p.name.toLowerCase() !== me);
    const EMOJIS = {spongebob:'🧽',patrick:'⭐',mario:'🍄',luigi:'💚',stickman:'🎨',woman:'👩',man:'👨',
      girl:'👧',boy:'👦',ninja:'🥷',astronaut:'🧑‍🚀',detective:'🕵️',princess:'👸',
      knight:'⚔️',scientist:'🧪',explorer:'🧭',swimmer:'🏊',kniffler:'🎲',og_mann:'👴',developer:'💻'};

    inner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:#FF69B4">🎁 Wen beschenken?</div>
        <button onclick="Shop.close();Shop.open(null,Shop._onClose);" style="background:rgba(255,255,255,0.1);
          border:none;color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:0.82rem">◀ Zurück</button>
      </div>
      ${others.length === 0
        ? '<div style="color:rgba(255,255,255,0.35);text-align:center;padding:30px">Noch keine anderen Spieler</div>'
        : others.sort((a,b)=>(b.totalScore||0)-(a.totalScore||0)).map(p => `
          <div onclick="Shop.close();Shop.open('${p.name}',Shop._onClose);"
            style="display:flex;align-items:center;gap:12px;padding:11px;border-radius:12px;
              background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
              margin-bottom:6px;cursor:pointer" 
            onmouseover="this.style.borderColor='rgba(255,105,180,0.5)'"
            onmouseout="this.style.borderColor='rgba(255,255,255,0.07)'">
            <span style="font-size:1.4rem">${EMOJIS[p.character]||'🧭'}</span>
            <div style="flex:1">
              <div style="color:white;font-weight:700;font-size:0.9rem">${p.name}</div>
              <div style="font-size:0.72rem;color:rgba(255,255,255,0.4)">⭐ ${p.totalScore||0} · Welt ${p.currentWorld||1}/10</div>
            </div>
            <span style="color:#FF69B4">🎁</span>
          </div>`).join('')
      }`;
  },

  // ---- CONFIRM (Robux-style) ----
  _confirmPurchase(itemId, isGift) {
    const player = State.currentPlayer;
    const items = getShopItems(player);
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Remove old modal if any
    document.getElementById('shop-confirm-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'shop-confirm-modal';
    modal.style.cssText = `position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,0.85);
      display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)`;

    modal.innerHTML = `
      <div style="background:#0d1b2e;border:2px solid rgba(255,215,0,0.35);border-radius:20px;
        padding:26px 22px;max-width:300px;width:90%;text-align:center;animation:popIn 0.3s ease">
        <div style="font-size:2.8rem;margin-bottom:8px">${item.icon}</div>
        <div style="font-family:'Fredoka One',cursive;color:white;font-size:1.1rem;margin-bottom:4px">${item.name}</div>
        ${isGift ? `<div style="font-size:0.8rem;color:#FF69B4;margin-bottom:6px">🎁 Für ${Shop._forPlayer}</div>` : ''}
        <div style="font-size:0.78rem;color:rgba(255,255,255,0.45);margin-bottom:18px">${item.desc.replace(/<br>/g,' ')}</div>

        <!-- Price button with fill animation -->
        <div id="conf-btn" onclick="Shop._startLoad('${itemId}', ${isGift})"
          style="background:linear-gradient(135deg,#FFD700,#FFA500);border-radius:50px;
            padding:13px 20px;cursor:pointer;position:relative;overflow:hidden;margin-bottom:12px;
            font-family:'Fredoka One',cursive;font-size:1.1rem;color:#2C3E50;
            box-shadow:0 6px 20px rgba(255,165,0,0.35)">
          ${(()=>{const dp=getDiscountedPrice(item);return dp<item.price?`<span style='text-decoration:line-through;opacity:0.5'>⭐${item.price.toLocaleString()}</span> ⭐${dp.toLocaleString()}`:` ⭐${item.price.toLocaleString()}`})()}
          <div id="conf-fill" style="position:absolute;top:0;left:-100%;width:100%;height:100%;
            background:rgba(255,255,255,0.4);border-radius:50px;pointer-events:none"></div>
        </div>

        <div style="font-size:0.72rem;color:rgba(255,255,255,0.3);margin-bottom:12px">
          Klicke auf den Betrag zum Kaufen
        </div>
        <button onclick="document.getElementById('shop-confirm-modal').remove()"
          style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
            color:rgba(255,255,255,0.55);padding:7px 22px;border-radius:50px;cursor:pointer;font-size:0.88rem">
          Abbrechen
        </button>
      </div>`;
    document.body.appendChild(modal);
  },

  _loadingActive: false,

  _startLoad(itemId, isGift) {
    if (Shop._loadingActive) return;
    Shop._loadingActive = true;
    const btn = document.getElementById('conf-btn');
    const fill = document.getElementById('conf-fill');
    if (!btn || !fill) return;
    btn.onclick = null;
    btn.style.cursor = 'default';
    // CSS animation
    fill.style.transition = 'left 2s linear';
    fill.style.left = '0%';
    setTimeout(() => {
      Shop._loadingActive = false;
      Shop._executePurchase(itemId, isGift);
    }, 2100);
  },

  async _executePurchase(itemId, isGift) {
    const buyer = State.currentPlayer;
    const items = getShopItems(buyer);
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('shop-confirm-modal')?.remove();

    // Check funds — use discounted price
    const actualPrice = getDiscountedPrice(item);
    if ((buyer.totalScore || 0) < actualPrice) {
      Shop._msg('❌ Nicht genug Sterne!', `Du brauchst ⭐${item.price.toLocaleString()}`, false);
      return;
    }

    // Deduct from buyer
    await State.addPoints(buyer.name, -actualPrice);

    const targetName = isGift ? Shop._forPlayer : buyer.name;
    const target = await State.getPlayer(targetName);
    if (!target) { Shop._msg('❌ Spieler nicht gefunden!', '', false); return; }

    if (!target.purchases) target.purchases = {};

    const now = Date.now();

    // Apply item effects
    if (itemId === 'joker_x2')   { target.maxJokersPerWorld = 2; target.purchases[itemId] = { active:true, purchasedAt:now }; }
    if (itemId === 'joker_x3')   { target.maxJokersPerWorld = 3; target.purchases[itemId] = { active:true, purchasedAt:now }; }

    if (itemId.startsWith('boost_')) {
      const exp = now + item.duration;
      target.purchases[itemId] = { active:true, purchasedAt:now, expiresAt:exp };
      // Stack multiplier — use highest active
      const allActive = Object.entries(target.purchases)
        .filter(([id,p]) => id.startsWith('boost_') && p.expiresAt > now)
        .map(([id,p]) => { const it = items.find(i=>i.id===id); return it?.multiplier||1; });
      target.activeStarMultiplier = Math.max(...allActive, 1);
      target.starMultiplierExpires = Math.max(...Object.entries(target.purchases)
        .filter(([id,p]) => id.startsWith('boost_') && p.expiresAt > now)
        .map(([,p]) => p.expiresAt));
    }

    if (itemId.startsWith('skin_')) {
      target.purchases[itemId] = { active:true, purchasedAt:now };
      if (!target.unlockedSkins) target.unlockedSkins = [];
      const charId = { skin_swimmer:'swimmer', skin_og:'og_mann', skin_dev:'developer', skin_kniffler:'kniffler' }[itemId];
      if (charId && !target.unlockedSkins.includes(charId)) target.unlockedSkins.push(charId);
    }

    if (itemId === 'starter_pack') {
      target.purchases[itemId] = { active:true, purchasedAt:now };
      // Give 2x boost for 15 min
      const exp = now + 15*60*1000;
      target.purchases['boost_2x_15'] = { active:true, purchasedAt:now, expiresAt:exp };
      target.activeStarMultiplier = 2;
      target.starMultiplierExpires = exp;
      // Unlock kniffler
      if (!target.unlockedSkins) target.unlockedSkins = [];
      if (!target.unlockedSkins.includes('kniffler')) target.unlockedSkins.push('kniffler');
    }

    if (itemId === 'admin_week') {
      const exp = now + 7*24*60*60*1000;
      target.purchases[itemId] = { active:true, purchasedAt:now, expiresAt:exp };
      target.adminAccessExpires = exp;
    }

    if (itemId === 'extra_world_unlock') {
      const cur = target.currentWorld || 1;
      if (cur < 10) target.currentWorld = cur + 1;
    }

    if (itemId === 'extra_score_shield') {
      const exp = now + 24*60*60*1000;
      target.purchases[itemId] = { active:true, purchasedAt:now, expiresAt:exp };
      target.scoreShieldExpires = exp;
      target.scoreShieldCharges = 3;
    }

    if (itemId === 'extra_hint') {
      target.hints = (target.hints || 0) + 5;
    }

    await State.savePlayer(target);
    State.currentPlayer = await State.getPlayer(buyer.name);

    // Special messages
    if (itemId === 'admin_week') {
      Shop._msg('🔐 Admin-Zugang aktiviert!',
        `Du hast 7 Tage Zugang zum Admin-Panel!<br><br>` +
        `<span style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#FFD700">Passwort: mischa2026</span><br><br>` +
        `<span style="font-size:0.75rem;color:rgba(255,255,255,0.4)">Läuft in 7 Tagen ab.</span>`,
        true, true);
      return;
    }

    const who = isGift ? `✅ <b>${targetName}</b> hat erhalten:` : '✅ Du hast erhalten:';
    Shop._msg(
      isGift ? '🎁 Geschenk gesendet!' : '✅ Kauf erfolgreich!',
      `${who}<br><b>${item.icon} ${item.name}</b><br><span style="font-size:0.78rem;color:rgba(255,255,255,0.4)">⭐ ${item.price.toLocaleString()} Sterne abgezogen</span>`,
      true
    );
  },

  _msg(title, body, ok, wide=false) {
    document.getElementById('shop-msg')?.remove();
    const d = document.createElement('div');
    d.id = 'shop-msg';
    d.style.cssText = `position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,0.88);
      display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)`;
    d.innerHTML = `
      <div style="background:#0d1b2e;border:2px solid ${ok?'rgba(39,174,96,0.5)':'rgba(231,76,60,0.5)'};
        border-radius:20px;padding:26px 22px;max-width:${wide?360:290}px;width:90%;text-align:center;animation:popIn 0.3s ease">
        <div style="font-size:2.2rem;margin-bottom:8px">${ok?'🎉':'❌'}</div>
        <div style="font-family:'Fredoka One',cursive;color:white;font-size:1.1rem;margin-bottom:8px">${title}</div>
        <div style="color:rgba(255,255,255,0.65);font-size:0.88rem;margin-bottom:18px;line-height:1.5">${body}</div>
        <button onclick="this.closest('#shop-msg').remove();Shop.close();App&&App.showWorldMap&&App.showWorldMap()"
          style="background:linear-gradient(135deg,#FFD700,#FFA500);border:none;color:#2C3E50;
            padding:11px 26px;border-radius:50px;font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer">
          ${ok?'Super! 🏆':'OK'}
        </button>
      </div>`;
    document.body.appendChild(d);
  },
};

// ============================================================
// WARDROBE (Kleiderschrank)
// ============================================================
const Wardrobe = {
  open(onClose) {
    const player = State.currentPlayer;
    if (!player) return;
    const unlockedSkins = player.unlockedSkins || [];
    const current = player.character;

    const overlay = document.createElement('div');
    overlay.id = 'wardrobe-overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.75);
      display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(5px)`;

    const available = ALL_CHARACTERS.filter(c =>
      c.free || unlockedSkins.includes(c.id)
    );
    const locked = ALL_CHARACTERS.filter(c =>
      !c.free && !unlockedSkins.includes(c.id)
    );

    overlay.innerHTML = `
      <div style="background:linear-gradient(180deg,#0d1b2e,#0f2040);width:100%;max-width:480px;
        border-radius:24px 24px 0 0;padding:20px 18px 32px;max-height:82vh;overflow-y:auto;
        box-shadow:0 -8px 40px rgba(0,0,0,0.6);animation:slideUp 0.3s ease">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-family:'Fredoka One',cursive;font-size:1.4rem;color:#FFD700">👗 Kleiderschrank</div>
          <button onclick="Wardrobe.close()" style="background:rgba(255,255,255,0.1);border:none;
            color:white;width:34px;height:34px;border-radius:50%;font-size:1.1rem;cursor:pointer">✕</button>
        </div>

        <div style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin-bottom:14px">
          Dein aktueller Charakter: <b style="color:white">${ALL_CHARACTERS.find(c=>c.id===current)?.emoji||'🧭'} ${ALL_CHARACTERS.find(c=>c.id===current)?.name||''}</b>
        </div>

        <!-- Available -->
        <div style="font-family:'Fredoka One',cursive;font-size:0.9rem;color:rgba(255,255,255,0.6);margin-bottom:10px">
          ✅ Verfügbar (${available.length})
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px">
          ${available.map(c => `
            <div onclick="Wardrobe._select('${c.id}')"
              style="background:${current===c.id?'linear-gradient(135deg,rgba(255,215,0,0.25),rgba(255,165,0,0.15))':'rgba(255,255,255,0.05)'};
                border:2px solid ${current===c.id?'#FFD700':'rgba(255,255,255,0.1)'};
                border-radius:14px;padding:10px 6px;text-align:center;cursor:pointer;transition:all 0.15s"
              onmouseover="this.style.borderColor='rgba(255,215,0,0.5)'"
              onmouseout="this.style.borderColor='${current===c.id?'#FFD700':'rgba(255,255,255,0.1)'}'">
              <div style="font-size:2rem">${c.emoji}</div>
              <div style="font-size:0.62rem;color:${current===c.id?'#FFD700':'rgba(255,255,255,0.55)'};margin-top:3px;font-weight:700">${c.name}</div>
              ${current===c.id?'<div style="font-size:0.55rem;color:#27AE60;margin-top:2px">✅ Aktiv</div>':''}
            </div>`).join('')}
        </div>

        <!-- Locked -->
        ${locked.length > 0 ? `
          <div style="font-family:'Fredoka One',cursive;font-size:0.9rem;color:rgba(255,255,255,0.4);margin-bottom:10px">
            🔒 Im Shop kaufen
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
            ${locked.map(c => `
              <div onclick="Wardrobe.close();Shop.open(null,()=>App&&App.showWorldMap&&App.showWorldMap())"
                style="background:rgba(255,255,255,0.03);border:2px solid rgba(255,255,255,0.06);
                  border-radius:14px;padding:10px 6px;text-align:center;cursor:pointer;opacity:0.6">
                <div style="font-size:2rem;filter:grayscale(1)">${c.emoji}</div>
                <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);margin-top:3px">🔒 ${c.name}</div>
                <div style="font-size:0.55rem;color:#FFD700;margin-top:2px">⭐${Shop._formatPrice(c.price||0)}</div>
              </div>`).join('')}
          </div>` : ''}

        <button onclick="Wardrobe.close();Shop.open(null,()=>App&&App.showWorldMap&&App.showWorldMap())"
          style="width:100%;padding:11px;border-radius:12px;background:rgba(255,215,0,0.15);
            border:2px solid rgba(255,215,0,0.4);color:#FFD700;font-family:'Fredoka One',cursive;
            font-size:0.95rem;cursor:pointer">
          🛒 Zum Shop — Neue Skins kaufen
        </button>
      </div>`;

    document.body.appendChild(overlay);
  },

  async _select(charId) {
    const player = State.currentPlayer;
    if (!player) return;
    player.character = charId;
    await State.savePlayer(player);
    State.currentPlayer = player;
    // Update display
    Wardrobe.close();
    Wardrobe.open();
  },

  close() {
    document.getElementById('wardrobe-overlay')?.remove();
    App?.showWorldMap?.();
  },
};

window.Shop = Shop;
window.Wardrobe = Wardrobe;
window.ALL_CHARACTERS = ALL_CHARACTERS;
window.getShopItems = getShopItems;
window.formatTimeLeft = formatTimeLeft;
