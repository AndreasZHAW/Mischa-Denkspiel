/**
 * shop.js — Mischa Denkspiel Shop
 * Robux-ähnlicher Kaufvorgang, Geschenke verschicken
 * Alle Preise in ⭐ Sternen
 */

const SHOP_ITEMS = [
  {
    id: 'joker_x2',
    name: '2× Joker pro Welt',
    desc: 'Du bekommst in jeder Welt 2 Joker statt 1!',
    icon: '🃏🃏',
    price: 1000,
    type: 'permanent',
    category: 'joker',
  },
  {
    id: 'joker_x3',
    name: '3× Joker pro Welt',
    desc: 'Maximaler Schutz — 3 Joker pro Welt!',
    icon: '🃏🃏🃏',
    price: 200000,
    type: 'permanent',
    category: 'joker',
    requires: 'joker_x2',
  },
  {
    id: 'star_boost_2x_15',
    name: '2× Sterne (15 Min)',
    desc: 'Alle Punkte werden 15 Minuten lang verdoppelt!',
    icon: '⭐⭐',
    price: 50,
    type: 'timed',
    duration: 15 * 60 * 1000,
    category: 'boost',
  },
  {
    id: 'star_boost_4x_15',
    name: '4× Sterne (15 Min)',
    desc: 'Vierfache Punkte für 15 Minuten!',
    icon: '⭐⭐⭐⭐',
    price: 300,
    type: 'timed',
    duration: 15 * 60 * 1000,
    category: 'boost',
    requires: 'star_boost_2x_15',
  },
  {
    id: 'star_boost_10x_15',
    name: '10× Sterne (15 Min)',
    desc: 'Zehnfache Punkte — 15 Minuten Wahnsinn!',
    icon: '🌟×10',
    price: 1000,
    type: 'timed',
    duration: 15 * 60 * 1000,
    category: 'boost',
  },
  {
    id: 'star_boost_10x_30',
    name: '10× Sterne (30 Min)',
    desc: 'Zehnfache Punkte für ganze 30 Minuten!',
    icon: '🌟×10 ⏱30',
    price: 2000,
    type: 'timed',
    duration: 30 * 60 * 1000,
    category: 'boost',
  },
  {
    id: 'star_boost_10x_60',
    name: '10× Sterne (1 Stunde)',
    desc: 'Eine volle Stunde zehnfache Punkte!',
    icon: '🌟×10 ⏱60',
    price: 5000,
    type: 'timed',
    duration: 60 * 60 * 1000,
    category: 'boost',
  },
  {
    id: 'admin_week',
    name: '🔐 Admin-Zugang (1 Woche)',
    desc: 'Nur einmal verfügbar! Zugang zum Admin-Panel für 7 Tage. Nach Ablauf ist dieses Angebot für immer weg.',
    icon: '🔐',
    price: 1000000,
    type: 'timed',
    duration: 7 * 24 * 60 * 60 * 1000,
    category: 'special',
    oneTime: true,
  },
];

const Shop = {

  // ---- OPEN SHOP ----
  open(forPlayer = null, onClose = null) {
    // forPlayer = name of person to gift to (null = buy for self)
    const player = State.currentPlayer;
    if (!player) return;
    Shop._forPlayer = forPlayer;
    Shop._onClose = onClose;
    Shop._renderShop();
  },

  // ---- RENDER MAIN SHOP ----
  _renderShop() {
    const player = State.currentPlayer;
    const forPlayer = Shop._forPlayer;
    const isGift = !!forPlayer;
    const purchases = player.purchases || {};

    // Check if admin_week is still available
    const adminItem = SHOP_ITEMS.find(i => i.id === 'admin_week');
    const adminPurchased = purchases['admin_week'];
    const adminExpired = adminPurchased && Date.now() > adminPurchased.expiresAt;

    // Active boosts
    const activeBoosters = Object.entries(purchases)
      .filter(([id, p]) => p.active && p.expiresAt && Date.now() < p.expiresAt)
      .map(([id, p]) => {
        const item = SHOP_ITEMS.find(i => i.id === id);
        const remaining = Math.ceil((p.expiresAt - Date.now()) / 60000);
        return { id, item, remaining, p };
      });

    const overlay = document.createElement('div');
    overlay.id = 'shop-overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.7);
      display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)`;
    overlay.innerHTML = `
      <div id="shop-panel" style="background:#0f1a2e;width:100%;max-width:480px;border-radius:24px 24px 0 0;
        padding:24px 20px 32px;max-height:85vh;overflow-y:auto;
        box-shadow:0 -8px 32px rgba(0,0,0,0.5);animation:slideUp 0.3s ease">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
          <div>
            <div style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:#FFD700">
              ${isGift ? `🎁 Geschenk für ${forPlayer}` : '🛒 Shop'}
            </div>
            ${isGift ? '' : `<div style="font-size:0.85rem;color:rgba(255,255,255,0.5)">Deine Sterne: <b style="color:#FFD700">⭐ ${(player.totalScore||0).toLocaleString()}</b></div>`}
          </div>
          <button onclick="Shop.close()" style="background:rgba(255,255,255,0.1);border:none;color:white;
            width:36px;height:36px;border-radius:50%;font-size:1.2rem;cursor:pointer">✕</button>
        </div>

        <!-- Active boosts -->
        ${activeBoosters.length > 0 ? `
          <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:12px;
            padding:10px 14px;margin-bottom:16px">
            <div style="font-size:0.78rem;color:#FFD700;font-weight:700;margin-bottom:6px">⚡ AKTIVE BOOSTS</div>
            ${activeBoosters.map(b => `
              <div style="font-size:0.82rem;color:rgba(255,255,255,0.8);display:flex;justify-content:space-between">
                <span>${b.item?.icon||'⭐'} ${b.item?.name||b.id}</span>
                <span style="color:#27AE60">⏱ noch ${b.remaining} Min</span>
              </div>`).join('')}
          </div>` : ''}

        <!-- Gift button (only when buying for self) -->
        ${!isGift ? `
          <button onclick="Shop.openGiftSelector()" style="width:100%;padding:12px;border-radius:12px;
            background:rgba(255,105,180,0.15);border:2px solid rgba(255,105,180,0.4);
            color:#FF69B4;font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer;margin-bottom:16px">
            🎁 Jemandem ein Geschenk schicken
          </button>` : ''}

        <!-- Categories -->
        ${['joker','boost','special'].map(cat => {
          const items = SHOP_ITEMS.filter(i => i.category === cat &&
            !(i.id === 'admin_week' && (adminPurchased && !adminExpired && !isGift))
          );
          if (!items.length) return '';
          const catNames = {joker:'🃏 Joker', boost:'⭐ Sterne-Boosts', special:'🌟 Special'};
          return `
            <div style="margin-bottom:20px">
              <div style="font-family:'Fredoka One',cursive;font-size:1rem;color:rgba(255,255,255,0.7);
                margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px">
                ${catNames[cat]||cat}
              </div>
              ${items.map(item => Shop._itemHTML(item, player, isGift, purchases)).join('')}
            </div>`;
        }).join('')}
      </div>
    </div>
    <style>
      @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    </style>`;

    document.body.appendChild(overlay);
  },

  _itemHTML(item, player, isGift, purchases) {
    const owned = purchases[item.id];
    const active = owned && owned.active && owned.expiresAt && Date.now() < owned.expiresAt;
    const canAfford = (player.totalScore || 0) >= item.price;
    const isSpecial = item.id === 'admin_week';
    const alreadyOwned = item.type === 'permanent' && owned;

    return `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
        border-radius:14px;padding:14px;margin-bottom:8px;
        ${isSpecial ? 'background:linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,165,0,0.05));border-color:rgba(255,215,0,0.4)' : ''}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:1.8rem;min-width:44px;text-align:center">${item.icon}</div>
          <div style="flex:1">
            <div style="font-family:'Fredoka One',cursive;font-size:0.95rem;color:white">${item.name}</div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:2px">${item.desc}</div>
            ${active ? `<div style="font-size:0.75rem;color:#27AE60;margin-top:3px">✅ Aktiv</div>` : ''}
            ${alreadyOwned ? `<div style="font-size:0.75rem;color:#27AE60;margin-top:3px">✅ Besitzt du bereits</div>` : ''}
          </div>
          <div style="text-align:center;min-width:80px">
            <div style="font-family:'Fredoka One',cursive;color:#FFD700;font-size:1rem">⭐${item.price.toLocaleString()}</div>
            ${alreadyOwned && !isGift ? `
              <div style="font-size:0.7rem;color:rgba(255,255,255,0.3);margin-top:4px">Besitzt</div>
            ` : `
              <button onclick="Shop._confirmPurchase('${item.id}', ${isGift})"
                style="margin-top:6px;padding:6px 14px;border-radius:50px;border:none;cursor:pointer;
                  font-family:'Fredoka One',cursive;font-size:0.82rem;
                  background:${canAfford ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'rgba(255,255,255,0.1)'};
                  color:${canAfford ? '#2C3E50' : 'rgba(255,255,255,0.3)'};
                  ${!canAfford ? 'cursor:not-allowed' : ''}">
                ${canAfford ? 'Kaufen' : '⭐ Zu wenig'}
              </button>
            `}
          </div>
        </div>
      </div>`;
  },

  // ---- GIFT SELECTOR ----
  async openGiftSelector() {
    const panel = document.getElementById('shop-panel');
    if (!panel) return;
    panel.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.5);padding:30px">⏳ Lade Spieler...</div>`;
    const all = await State.getAll();
    const me = State.currentPlayer?.name?.toLowerCase();
    const others = Object.values(all).filter(p => p.name.toLowerCase() !== me);

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#FF69B4">🎁 Wen beschenken?</div>
        <button onclick="Shop.close();Shop.open();" style="background:rgba(255,255,255,0.1);border:none;color:white;
          padding:6px 12px;border-radius:8px;cursor:pointer;font-size:0.85rem">◀ Zurück</button>
      </div>
      ${others.length === 0
        ? '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:30px">Noch keine anderen Spieler 😊</div>'
        : others.sort((a,b)=>(b.totalScore||0)-(a.totalScore||0)).map((p,i) => {
            const ch = {spongebob:'🧽',patrick:'⭐',mario:'🍄',luigi:'💚',stickman:'🎨',woman:'👩',man:'👨',
              girl:'👧',boy:'👦',ninja:'🥷',astronaut:'🧑‍🚀',detective:'🕵️',princess:'👸',
              knight:'⚔️',scientist:'🧪',explorer:'🧭'}[p.character] || '🧭';
            return `
              <div onclick="Shop.close();Shop.open('${p.name}');"
                style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;
                  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
                  margin-bottom:6px;cursor:pointer;transition:border-color 0.15s"
                onmouseover="this.style.borderColor='rgba(255,105,180,0.5)'"
                onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
                <span style="font-size:1.5rem">${ch}</span>
                <div style="flex:1">
                  <div style="color:white;font-weight:700">${p.name}</div>
                  <div style="font-size:0.75rem;color:rgba(255,255,255,0.4)">⭐ ${p.totalScore||0} Punkte · Welt ${p.currentWorld||1}/10</div>
                </div>
                <span style="color:#FF69B4;font-size:1.2rem">🎁</span>
              </div>`;
          }).join('')
      }`;
  },

  // ---- CONFIRM PURCHASE (Robux-style loading) ----
  _confirmPurchase(itemId, isGift) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    const player = State.currentPlayer;
    const forPlayer = Shop._forPlayer;
    const recipientName = isGift ? forPlayer : player.name;

    const modal = document.createElement('div');
    modal.id = 'shop-confirm-modal';
    modal.style.cssText = `position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,0.85);
      display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)`;
    modal.innerHTML = `
      <div style="background:#0f1a2e;border:2px solid rgba(255,215,0,0.3);border-radius:20px;
        padding:28px 24px;max-width:320px;width:90%;text-align:center;animation:popIn 0.3s ease">

        <!-- Item info -->
        <div style="font-size:3rem;margin-bottom:8px">${item.icon}</div>
        <div style="font-family:'Fredoka One',cursive;color:white;font-size:1.2rem;margin-bottom:6px">${item.name}</div>
        ${isGift ? `<div style="font-size:0.82rem;color:#FF69B4;margin-bottom:6px">🎁 Geschenk für ${forPlayer}</div>` : ''}
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:20px">${item.desc}</div>

        <!-- Price button with loading animation -->
        <div id="shop-price-btn" onclick="Shop._startPurchaseAnimation('${itemId}', ${isGift})"
          style="background:linear-gradient(135deg,#FFD700,#FFA500);border-radius:50px;padding:14px 24px;
            cursor:pointer;position:relative;overflow:hidden;margin-bottom:12px;
            font-family:'Fredoka One',cursive;font-size:1.2rem;color:#2C3E50;
            box-shadow:0 6px 20px rgba(255,165,0,0.4);transition:transform 0.15s">
          ⭐ ${item.price.toLocaleString()} Sterne
          <!-- Fill overlay (hidden initially) -->
          <div id="shop-fill" style="position:absolute;top:0;left:0;height:100%;width:0%;
            background:rgba(255,255,255,0.35);transition:width 2s ease;border-radius:50px;pointer-events:none"></div>
        </div>

        <div style="font-size:0.75rem;color:rgba(255,255,255,0.3);margin-bottom:14px">
          Klicke auf den Betrag um zu kaufen
        </div>

        <button onclick="document.getElementById('shop-confirm-modal').remove()"
          style="background:rgba(255,255,255,0.1);border:none;color:rgba(255,255,255,0.6);
            padding:8px 24px;border-radius:50px;cursor:pointer;font-size:0.9rem">Abbrechen</button>
      </div>`;
    document.body.appendChild(modal);
  },

  _startPurchaseAnimation(itemId, isGift) {
    const btn = document.getElementById('shop-price-btn');
    const fill = document.getElementById('shop-fill');
    if (!btn || !fill) return;

    // Disable button during animation
    btn.onclick = null;
    btn.style.cursor = 'default';

    // Start fill animation
    fill.style.width = '100%';

    // After animation completes, execute purchase
    setTimeout(() => {
      Shop._executePurchase(itemId, isGift);
    }, 2100);
  },

  async _executePurchase(itemId, isGift) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const player = State.currentPlayer;
    const forPlayer = Shop._forPlayer;
    const targetName = isGift ? forPlayer : player.name;

    // Check stars
    if ((player.totalScore || 0) < item.price) {
      document.getElementById('shop-confirm-modal')?.remove();
      Shop._showMessage('❌ Nicht genug Sterne!', `Du brauchst ⭐${item.price.toLocaleString()} Sterne.`, false);
      return;
    }

    // Deduct stars from buyer
    await State.addPoints(player.name, -item.price);

    // Apply item to target player
    const targetPlayer = await State.getPlayer(targetName);
    if (!targetPlayer) {
      Shop._showMessage('❌ Fehler', 'Spieler nicht gefunden!', false);
      return;
    }

    if (!targetPlayer.purchases) targetPlayer.purchases = {};

    if (item.type === 'permanent') {
      targetPlayer.purchases[item.id] = { active: true, purchasedAt: Date.now() };
      // Apply joker boost
      if (item.id === 'joker_x2') targetPlayer.maxJokersPerWorld = 2;
      if (item.id === 'joker_x3') targetPlayer.maxJokersPerWorld = 3;
    } else if (item.type === 'timed') {
      const expiresAt = Date.now() + item.duration;
      targetPlayer.purchases[item.id] = { active: true, purchasedAt: Date.now(), expiresAt };

      // Apply star multiplier
      if (item.id.startsWith('star_boost')) {
        const mult = item.id.includes('2x') ? 2 : item.id.includes('4x') ? 4 : 10;
        targetPlayer.activeStarMultiplier = mult;
        targetPlayer.starMultiplierExpires = expiresAt;
      }

      // Admin special
      if (item.id === 'admin_week') {
        targetPlayer.adminAccessExpires = expiresAt;
      }
    }

    await State.savePlayer(targetPlayer);
    // Refresh current player
    State.currentPlayer = await State.getPlayer(player.name);

    document.getElementById('shop-confirm-modal')?.remove();

    // Special message for admin
    if (item.id === 'admin_week') {
      Shop._showMessage('🔐 Admin-Zugang aktiviert!',
        `Du hast für 7 Tage Zugang zum Admin-Panel.<br><br>` +
        `<b style="color:#FFD700;font-size:1.1rem">Das Passwort ist: mischa2026</b><br><br>` +
        `<span style="font-size:0.8rem;color:rgba(255,255,255,0.5)">Der Zugang läuft in 7 Tagen ab.</span>`,
        true, true);
      return;
    }

    const giftMsg = isGift ? `✅ ${forPlayer} hat ${item.icon} <b>${item.name}</b> erhalten!` : '';
    Shop._showMessage(
      isGift ? '🎁 Geschenk gesendet!' : '✅ Kauf erfolgreich!',
      isGift ? giftMsg : `Du hast <b>${item.name}</b> erhalten!<br><span style="font-size:0.8rem;color:rgba(255,255,255,0.5)">⭐ ${item.price.toLocaleString()} Sterne abgezogen</span>`,
      true
    );
  },

  _showMessage(title, body, success, wide = false) {
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,0.85);
      display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)`;
    msg.innerHTML = `
      <div style="background:#0f1a2e;border:2px solid ${success ? 'rgba(39,174,96,0.5)' : 'rgba(231,76,60,0.5)'};
        border-radius:20px;padding:28px 24px;max-width:${wide?360:300}px;width:90%;text-align:center;animation:popIn 0.3s ease">
        <div style="font-size:2.5rem;margin-bottom:10px">${success ? '🎉' : '❌'}</div>
        <div style="font-family:'Fredoka One',cursive;color:white;font-size:1.2rem;margin-bottom:10px">${title}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:0.9rem;margin-bottom:20px;line-height:1.5">${body}</div>
        <button onclick="this.closest('div[style]').remove();Shop.close();${success?'App&&App.showWorldMap&&App.showWorldMap()':''}"
          style="background:linear-gradient(135deg,#FFD700,#FFA500);border:none;color:#2C3E50;
            padding:12px 28px;border-radius:50px;font-family:'Fredoka One',cursive;font-size:1rem;cursor:pointer">
          ${success ? 'Super! 🏆' : 'OK'}
        </button>
      </div>`;
    document.body.appendChild(msg);
  },

  close() {
    document.getElementById('shop-overlay')?.remove();
    document.getElementById('shop-confirm-modal')?.remove();
    if (Shop._onClose) Shop._onClose();
  },

  _forPlayer: null,
  _onClose: null,
};

window.Shop = Shop;
window.SHOP_ITEMS = SHOP_ITEMS;
