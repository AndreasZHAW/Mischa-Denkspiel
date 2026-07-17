/**
 * games/truefalse.js — Wahr oder Falsch?
 * 10 Aussagen, schnell entscheiden ob Wahr ✅ oder Falsch ❌
 * Weltspezifische Fragen, altersangepasst
 */

const TrueFalseGame = {
  current: null,
  _lastConfig: null,

  _questions: {
    1: [ // Anreise
      { q:{de:'Frankreich liegt in Europa.',en:'France is in Europe.',fr:'La France est en Europe.'}, a:true },
      { q:{de:'Die Autobahn hat ein Tempolimit von 50 km/h.',en:'The motorway has a speed limit of 50 km/h.',fr:'L\'autoroute a une limite de vitesse de 50 km/h.'}, a:false },
      { q:{de:'Paris ist die Hauptstadt von Frankreich.',en:'Paris is the capital of France.',fr:'Paris est la capitale de la France.'}, a:true },
      { q:{de:'Der Eiffelturm steht in Lyon.',en:'The Eiffel Tower is in Lyon.',fr:'La Tour Eiffel se trouve à Lyon.'}, a:false },
      { q:{de:'Man braucht einen Reisepass für Frankreich wenn man aus der Schweiz kommt.',en:'You need a passport for France when coming from Switzerland.',fr:'Il faut un passeport pour la France quand on vient de Suisse.'}, a:false },
      { q:{de:'Frankreich grenzt an die Schweiz.',en:'France borders Switzerland.',fr:'La France est frontalière de la Suisse.'}, a:true },
      { q:{de:'1 Stunde = 60 Minuten.',en:'1 hour = 60 minutes.',fr:'1 heure = 60 minutes.'}, a:true },
      { q:{de:'100 km/h ist schneller als 80 km/h.',en:'100 km/h is faster than 80 km/h.',fr:'100 km/h est plus rapide que 80 km/h.'}, a:true },
      { q:{de:'Die Schweiz ist ein Teil von Frankreich.',en:'Switzerland is part of France.',fr:'La Suisse fait partie de la France.'}, a:false },
      { q:{de:'Ein Auto hat 4 Räder.',en:'A car has 4 wheels.',fr:'Une voiture a 4 roues.'}, a:true },
    ],
    2: [ // Schloss
      { q:{de:'Ein Ritter trägt eine Rüstung.',en:'A knight wears armor.',fr:'Un chevalier porte une armure.'}, a:true },
      { q:{de:'Schlösser wurden im Weltraum gebaut.',en:'Castles were built in space.',fr:'Les châteaux ont été construits dans l\'espace.'}, a:false },
      { q:{de:'Ein Burggraben ist mit Wasser gefüllt.',en:'A moat is filled with water.',fr:'Des douves sont remplies d\'eau.'}, a:true },
      { q:{de:'Könige wohnen in Schlössern.',en:'Kings live in castles.',fr:'Les rois vivent dans des châteaux.'}, a:true },
      { q:{de:'Ein Schwert ist ein Musikinstrument.',en:'A sword is a musical instrument.',fr:'Une épée est un instrument de musique.'}, a:false },
      { q:{de:'Das Mittelalter war vor 500 Jahren.',en:'The Middle Ages were 500 years ago.',fr:'Le Moyen Âge, c\'était il y a 500 ans.'}, a:true },
      { q:{de:'Drachen können fliegen.',en:'Dragons can fly.',fr:'Les dragons peuvent voler.'}, a:false },
      { q:{de:'Ein Schloss hat meistens viele Zimmer.',en:'A castle usually has many rooms.',fr:'Un château a généralement beaucoup de pièces.'}, a:true },
      { q:{de:'Ritter hatten meistens Pferde.',en:'Knights usually had horses.',fr:'Les chevaliers avaient généralement des chevaux.'}, a:true },
      { q:{de:'Eine Zugbrücke kann hochgezogen werden.',en:'A drawbridge can be raised.',fr:'Un pont-levis peut être relevé.'}, a:true },
    ],
    3: [ // Pool
      { q:{de:'Wasser ist nass.',en:'Water is wet.',fr:'L\'eau est mouillée.'}, a:true },
      { q:{de:'Man sollte nach dem Essen sofort schwimmen.',en:'You should swim right after eating.',fr:'Il faut nager tout de suite après avoir mangé.'}, a:false },
      { q:{de:'Ein Schwimmbecken ist mit Wasser gefüllt.',en:'A swimming pool is filled with water.',fr:'Une piscine est remplie d\'eau.'}, a:true },
      { q:{de:'Die Sonne ist heiß.',en:'The sun is hot.',fr:'Le soleil est chaud.'}, a:true },
      { q:{de:'Man kann im Pool Ski fahren.',en:'You can ski in the pool.',fr:'On peut skier dans la piscine.'}, a:false },
      { q:{de:'Sonnencreme schützt vor Sonnenbrand.',en:'Sunscreen protects against sunburn.',fr:'La crème solaire protège des coups de soleil.'}, a:true },
      { q:{de:'Fische können schwimmen.',en:'Fish can swim.',fr:'Les poissons savent nager.'}, a:true },
      { q:{de:'Ein Hai ist ein Hausschwein.',en:'A shark is a domestic pig.',fr:'Un requin est un cochon domestique.'}, a:false },
      { q:{de:'Im Sommer ist es wärmer als im Winter.',en:'It\'s warmer in summer than in winter.',fr:'Il fait plus chaud en été qu\'en hiver.'}, a:true },
      { q:{de:'33°C ist kälter als 20°C.',en:'33°C is colder than 20°C.',fr:'33°C est plus froid que 20°C.'}, a:false },
    ],
    4: [ // Tennis
      { q:{de:'Ein Tennisball ist rund.',en:'A tennis ball is round.',fr:'Une balle de tennis est ronde.'}, a:true },
      { q:{de:'Tennis wird mit einem Fussball gespielt.',en:'Tennis is played with a soccer ball.',fr:'Le tennis se joue avec un ballon de football.'}, a:false },
      { q:{de:'Das Netz trennt die beiden Seiten.',en:'The net separates the two sides.',fr:'Le filet sépare les deux côtés.'}, a:true },
      { q:{de:'Wimbledon ist ein bekanntes Tennis-Turnier.',en:'Wimbledon is a famous tennis tournament.',fr:'Wimbledon est un tournoi de tennis célèbre.'}, a:true },
      { q:{de:'Man kann Tennis alleine spielen.',en:'You can play tennis alone.',fr:'On peut jouer au tennis tout seul.'}, a:false },
      { q:{de:'Ein Tennis-Match kann mehrere Stunden dauern.',en:'A tennis match can last several hours.',fr:'Un match de tennis peut durer plusieurs heures.'}, a:true },
      { q:{de:'Der erste Punkt heisst "15".',en:'The first point is called "15".',fr:'Le premier point s\'appelle « 15 ».'}, a:true },
      { q:{de:'Ein Ass ist ein Fehler beim Aufschlag.',en:'An ace is a mistake on the serve.',fr:'Un ace est une faute au service.'}, a:false },
      { q:{de:'Roger Federer ist ein bekannter Tennisspieler.',en:'Roger Federer is a famous tennis player.',fr:'Roger Federer est un joueur de tennis célèbre.'}, a:true },
      { q:{de:'Beim Tennis darf man den Ball mit dem Fuss schlagen.',en:'In tennis you\'re allowed to hit the ball with your foot.',fr:'Au tennis, on a le droit de frapper la balle avec le pied.'}, a:false },
    ],
    5: [ // Kniffel
      { q:{de:'Ein normaler Würfel hat 6 Seiten.',en:'A normal die has 6 sides.',fr:'Un dé normal a 6 faces.'}, a:true },
      { q:{de:'Die Augen eines Würfels gehen von 1 bis 7.',en:'The pips on a die go from 1 to 7.',fr:'Les points d\'un dé vont de 1 à 7.'}, a:false },
      { q:{de:'Drei gleiche Zahlen nennt man "Drilling".',en:'Three of a kind is called a "triple".',fr:'Trois chiffres identiques s\'appellent un « brelan ».'}, a:true },
      { q:{de:'Beim Kniffel darf man 3 mal würfeln.',en:'In Yahtzee you may roll 3 times.',fr:'Au Yahtzee, on a le droit de lancer les dés 3 fois.'}, a:true },
      { q:{de:'Fünf gleiche Zahlen ist ein Kniffel.',en:'Five of the same number is a Yahtzee.',fr:'Cinq chiffres identiques, c\'est un Yahtzee.'}, a:true },
      { q:{de:'Man kann mit einem Würfel 8 bekommen.',en:'You can roll an 8 with one die.',fr:'On peut obtenir un 8 avec un seul dé.'}, a:false },
      { q:{de:'1+2+3+4+5+6 = 21.',en:'1+2+3+4+5+6 = 21.',fr:'1+2+3+4+5+6 = 21.'}, a:true },
      { q:{de:'Würfel sind immer dreieckig.',en:'Dice are always triangular.',fr:'Les dés sont toujours triangulaires.'}, a:false },
      { q:{de:'Beim Kniffel gibt es einen Highscore.',en:'In Yahtzee there\'s a high score.',fr:'Au Yahtzee, il y a un meilleur score.'}, a:true },
      { q:{de:'Man braucht 5 Würfel für Kniffel.',en:'You need 5 dice for Yahtzee.',fr:'Il faut 5 dés pour jouer au Yahtzee.'}, a:true },
    ],
    6: [ // Fahrrad
      { q:{de:'Ein Fahrrad hat 2 Räder.',en:'A bicycle has 2 wheels.',fr:'Un vélo a 2 roues.'}, a:true },
      { q:{de:'Radfahren ist gut für die Gesundheit.',en:'Cycling is good for your health.',fr:'Faire du vélo est bon pour la santé.'}, a:true },
      { q:{de:'Man braucht keinen Helm beim Radfahren.',en:'You don\'t need a helmet when cycling.',fr:'On n\'a pas besoin de casque pour faire du vélo.'}, a:false },
      { q:{de:'Fahrräder haben einen Motor.',en:'Bicycles have an engine.',fr:'Les vélos ont un moteur.'}, a:false },
      { q:{de:'Bergauf radeln ist anstrengender als bergab.',en:'Cycling uphill is harder than downhill.',fr:'Pédaler en montée est plus fatigant qu\'en descente.'}, a:true },
      { q:{de:'Ein Fahrrad kann fliegen.',en:'A bicycle can fly.',fr:'Un vélo peut voler.'}, a:false },
      { q:{de:'Die Kette treibt das Hinterrad an.',en:'The chain drives the rear wheel.',fr:'La chaîne entraîne la roue arrière.'}, a:true },
      { q:{de:'Ein Mountainbike ist für Gebirge gemacht.',en:'A mountain bike is made for mountains.',fr:'Un VTT est fait pour la montagne.'}, a:true },
      { q:{de:'Fahrräder fahren mit Benzin.',en:'Bicycles run on gasoline.',fr:'Les vélos roulent à l\'essence.'}, a:false },
      { q:{de:'Tour de France ist ein bekanntes Radrennen.',en:'The Tour de France is a famous cycling race.',fr:'Le Tour de France est une célèbre course cycliste.'}, a:true },
    ],
    7: [ // Essen
      { q:{de:'Croissants kommen ursprünglich aus Frankreich.',en:'Croissants originally come from France.',fr:'Les croissants viennent à l\'origine de France.'}, a:true },
      { q:{de:'Käse wird aus Milch gemacht.',en:'Cheese is made from milk.',fr:'Le fromage est fait à partir de lait.'}, a:true },
      { q:{de:'Baguette ist ein französisches Brot.',en:'Baguette is a French bread.',fr:'La baguette est un pain français.'}, a:true },
      { q:{de:'Man trinkt Suppe mit einer Gabel.',en:'You drink soup with a fork.',fr:'On boit la soupe avec une fourchette.'}, a:false },
      { q:{de:'Ein Koch arbeitet in der Küche.',en:'A cook works in the kitchen.',fr:'Un cuisinier travaille en cuisine.'}, a:true },
      { q:{de:'"Bon appétit" bedeutet guten Hunger.',en:'"Bon appétit" means enjoy your meal.',fr:'« Bon appétit » signifie qu\'on te souhaite un bon repas.'}, a:true },
      { q:{de:'Wein wird aus Trauben gemacht.',en:'Wine is made from grapes.',fr:'Le vin est fait à partir de raisins.'}, a:true },
      { q:{de:'Ein Salat ist ein warmes Gericht.',en:'A salad is a hot dish.',fr:'Une salade est un plat chaud.'}, a:false },
      { q:{de:'Frankreich ist bekannt für seine Küche.',en:'France is known for its cuisine.',fr:'La France est connue pour sa cuisine.'}, a:true },
      { q:{de:'Pommes frites kommen ursprünglich aus der Schweiz.',en:'French fries originally come from Switzerland.',fr:'Les frites viennent à l\'origine de Suisse.'}, a:false },
    ],
    8: [ // Fussball
      { q:{de:'Ein Fussball ist rund.',en:'A soccer ball is round.',fr:'Un ballon de football est rond.'}, a:true },
      { q:{de:'Eine Mannschaft hat 11 Spieler.',en:'A team has 11 players.',fr:'Une équipe compte 11 joueurs.'}, a:true },
      { q:{de:'Der Torwart darf den Ball mit den Händen berühren.',en:'The goalkeeper is allowed to touch the ball with their hands.',fr:'Le gardien de but a le droit de toucher le ballon avec les mains.'}, a:true },
      { q:{de:'Ein Tor zählt 2 Punkte.',en:'A goal counts for 2 points.',fr:'Un but compte pour 2 points.'}, a:false },
      { q:{de:'VfB Stuttgart spielt in der Bundesliga.',en:'VfB Stuttgart plays in the Bundesliga.',fr:'Le VfB Stuttgart joue en Bundesliga.'}, a:true },
      { q:{de:'Ein Elfmeter wird aus 11 Metern geschossen.',en:'A penalty is taken from 11 meters.',fr:'Un penalty est tiré à 11 mètres.'}, a:true },
      { q:{de:'Ein Fussballspiel dauert 90 Minuten.',en:'A soccer match lasts 90 minutes.',fr:'Un match de football dure 90 minutes.'}, a:true },
      { q:{de:'Das Netz ist hinter dem Tor.',en:'The net is behind the goal.',fr:'Le filet est derrière le but.'}, a:true },
      { q:{de:'Man darf mit den Händen kicken.',en:'You\'re allowed to kick with your hands.',fr:'On a le droit de shooter avec les mains.'}, a:false },
      { q:{de:'Die Rote Karte bedeutet Ausschluss.',en:'A red card means being sent off.',fr:'Le carton rouge signifie l\'exclusion.'}, a:true },
    ],
    9: [ // Packen
      { q:{de:'Ein Koffer hat Rollen.',en:'A suitcase has wheels.',fr:'Une valise a des roulettes.'}, a:true },
      { q:{de:'Man darf flüssige Sachen unbegrenzt ins Flugzeug mitnehmen.',en:'You may bring unlimited liquids onto the plane.',fr:'On peut emporter des liquides en quantité illimitée dans l\'avion.'}, a:false },
      { q:{de:'Ein Reisepass ist ein offizielles Dokument.',en:'A passport is an official document.',fr:'Un passeport est un document officiel.'}, a:true },
      { q:{de:'Man packt warme Sachen für den Strand.',en:'You pack warm clothes for the beach.',fr:'On emporte des vêtements chauds pour la plage.'}, a:false },
      { q:{de:'Sonnencreme gehört in den Sommerurlaub.',en:'Sunscreen belongs in your summer vacation packing.',fr:'La crème solaire fait partie des affaires de vacances d\'été.'}, a:true },
      { q:{de:'Ein Koffer kann zu schwer sein für das Flugzeug.',en:'A suitcase can be too heavy for the plane.',fr:'Une valise peut être trop lourde pour l\'avion.'}, a:true },
      { q:{de:'Man braucht Geld für Reisen.',en:'You need money for traveling.',fr:'Il faut de l\'argent pour voyager.'}, a:true },
      { q:{de:'Ein Handgepäck ist sehr gross.',en:'Carry-on luggage is very large.',fr:'Un bagage à main est très grand.'}, a:false },
      { q:{de:'Ferien enden irgendwann.',en:'Vacations end at some point.',fr:'Les vacances finissent toujours par se terminer.'}, a:true },
      { q:{de:'Man packt gerne am letzten Tag.',en:'People like packing on the last day.',fr:'On aime bien faire ses valises le dernier jour.'}, a:false },
    ],
    10: [ // Abreise
      { q:{de:'Die Heimreise ist die Rückfahrt.',en:'The return trip is the journey home.',fr:'Le retour, c\'est le trajet du retour.'}, a:true },
      { q:{de:'Ferien sind immer schlecht.',en:'Vacations are always bad.',fr:'Les vacances sont toujours mauvaises.'}, a:false },
      { q:{de:'Gute Erinnerungen bleiben für immer.',en:'Good memories last forever.',fr:'Les bons souvenirs restent pour toujours.'}, a:true },
      { q:{de:'Fotos helfen sich zu erinnern.',en:'Photos help you remember.',fr:'Les photos aident à se souvenir.'}, a:true },
      { q:{de:'Nach Ferien kommt wieder der Alltag.',en:'Everyday life returns after vacation.',fr:'Après les vacances, le quotidien reprend.'}, a:true },
      { q:{de:'Man kann Ferien-Souvenirs kaufen.',en:'You can buy vacation souvenirs.',fr:'On peut acheter des souvenirs de vacances.'}, a:true },
      { q:{de:'Eine Abreise ist immer traurig.',en:'A departure is always sad.',fr:'Un départ est toujours triste.'}, a:false },
      { q:{de:'Ferien machen glücklich.',en:'Vacations make you happy.',fr:'Les vacances rendent heureux.'}, a:true },
      { q:{de:'Zuhause ist man nie wieder glücklich.',en:'You\'re never happy at home again.',fr:'On n\'est plus jamais heureux à la maison.'}, a:false },
      { q:{de:'Nächstes Jahr gibt es wieder Ferien!',en:'Next year there will be vacation again!',fr:'L\'année prochaine, il y aura encore des vacances !'}, a:true },
    ],
  },

  _hardQuestions: {
    1: [ // Anreise — schwerer
      { q:{de:'Die Autobahn A1 in der Schweiz verbindet Genf mit Zürich.',en:'The A1 motorway in Switzerland connects Geneva with Zurich.',fr:'L\'autoroute A1 en Suisse relie Genève à Zurich.'}, a:true },
      { q:{de:'Frankreich hat mehr als 60 Millionen Einwohner.',en:'France has more than 60 million inhabitants.',fr:'La France compte plus de 60 millions d\'habitants.'}, a:true },
      { q:{de:'Der Mont Blanc liegt in den Pyrenäen.',en:'Mont Blanc is located in the Pyrenees.',fr:'Le Mont Blanc se trouve dans les Pyrénées.'}, a:false },
      { q:{de:'Die Schweiz ist Mitglied der Europäischen Union.',en:'Switzerland is a member of the European Union.',fr:'La Suisse est membre de l\'Union européenne.'}, a:false },
      { q:{de:'Das Tempolimit auf Schweizer Autobahnen beträgt 120 km/h.',en:'The speed limit on Swiss motorways is 120 km/h.',fr:'La limite de vitesse sur les autoroutes suisses est de 120 km/h.'}, a:true },
      { q:{de:'Frankreich hat mehr als 10 Departements.',en:'France has more than 10 departments.',fr:'La France compte plus de 10 départements.'}, a:true },
      { q:{de:'Lyon ist die Hauptstadt von Frankreich.',en:'Lyon is the capital of France.',fr:'Lyon est la capitale de la France.'}, a:false },
      { q:{de:'Die Rhone fliesst durch Genf.',en:'The Rhône flows through Geneva.',fr:'Le Rhône traverse Genève.'}, a:true },
      { q:{de:'Der Ärmelkanal trennt Frankreich von Grossbritannien.',en:'The English Channel separates France from Great Britain.',fr:'La Manche sépare la France de la Grande-Bretagne.'}, a:true },
      { q:{de:'In Frankreich gilt Linksverkehr.',en:'In France, driving is on the left.',fr:'En France, on roule à gauche.'}, a:false },
    ],
    2: [
      { q:{de:'Das Heilige Römische Reich endete im Jahr 1806.',en:'The Holy Roman Empire ended in the year 1806.',fr:'Le Saint Empire romain germanique a pris fin en 1806.'}, a:true },
      { q:{de:'Die Kreuzritter kämpften im 15. Jahrhundert.',en:'The Crusaders fought in the 15th century.',fr:'Les croisés se sont battus au 15e siècle.'}, a:false },
      { q:{de:'Ein Donjon ist der Hauptturm einer Burg.',en:'A keep (donjon) is the main tower of a castle.',fr:'Un donjon est la tour principale d\'un château.'}, a:true },
      { q:{de:'Feudalismus bedeutet, dass der König kein Land besitzt.',en:'Feudalism means the king owns no land.',fr:'Le féodalisme signifie que le roi ne possède aucune terre.'}, a:false },
      { q:{de:'Die Pest tötete im 14. Jahrhundert einen Drittel der europäischen Bevölkerung.',en:'The plague killed a third of the European population in the 14th century.',fr:'La peste a tué un tiers de la population européenne au 14e siècle.'}, a:true },
      { q:{de:'Ritter mussten ihrem Lehnsherrn Treue schwören.',en:'Knights had to swear loyalty to their liege lord.',fr:'Les chevaliers devaient jurer fidélité à leur seigneur.'}, a:true },
      { q:{de:'Das Mittelalter begann vor etwa 2000 Jahren.',en:'The Middle Ages began about 2000 years ago.',fr:'Le Moyen Âge a commencé il y a environ 2000 ans.'}, a:false },
      { q:{de:'In der Gotik waren Spitzbögen typisch.',en:'Pointed arches were typical of the Gothic style.',fr:'Les arcs brisés étaient typiques du style gothique.'}, a:true },
      { q:{de:'Kathedrale von Notre-Dame steht in Köln.',en:'Notre-Dame Cathedral is in Cologne.',fr:'La cathédrale Notre-Dame se trouve à Cologne.'}, a:false },
      { q:{de:'Der Hundred Years War war zwischen Frankreich und England.',en:'The Hundred Years\' War was between France and England.',fr:'La guerre de Cent Ans opposait la France et l\'Angleterre.'}, a:true },
    ],
    3: [
      { q:{de:'Chlor tötet Bakterien im Schwimmbad ab.',en:'Chlorine kills bacteria in the pool.',fr:'Le chlore tue les bactéries dans la piscine.'}, a:true },
      { q:{de:'Schwimmen nach dem Essen erhöht das Herzinfarkt-Risiko — ein Mythos.',en:'Swimming after eating increases heart attack risk — a myth.',fr:'Nager juste après manger augmente le risque de crise cardiaque — un mythe.'}, a:true },
      { q:{de:'Ein Olympisches Schwimmbecken ist 50m lang.',en:'An Olympic swimming pool is 50m long.',fr:'Une piscine olympique mesure 50 m de long.'}, a:true },
      { q:{de:'Der menschliche Körper besteht zu etwa 60% aus Wasser.',en:'The human body is made up of about 60% water.',fr:'Le corps humain est composé d\'environ 60% d\'eau.'}, a:true },
      { q:{de:'Im Schwarzen Meer kann man besser schwimmen als im Süsswasser.',en:'You can swim better in the Black Sea than in fresh water.',fr:'On nage mieux dans la mer Noire que dans l\'eau douce.'}, a:true },
      { q:{de:'Delfine sind Fische.',en:'Dolphins are fish.',fr:'Les dauphins sont des poissons.'}, a:false },
      { q:{de:'Beim Brustschwimmen bewegen sich die Arme gleichzeitig.',en:'In breaststroke, the arms move at the same time.',fr:'En brasse, les bras bougent en même temps.'}, a:true },
      { q:{de:'UV-Strahlen können durch Wasser nicht hindurch.',en:'UV rays cannot pass through water.',fr:'Les rayons UV ne peuvent pas traverser l\'eau.'}, a:false },
    ],
  },

  start(config) {
    const { worldId = 1, ageGroup = 'einfach', onComplete } = config;
    TrueFalseGame._lastConfig = config;
    const pool = this._questions[worldId] || this._questions[1];
    // Age-based difficulty: strictly separate question pools.
    // NOTE: each pool only has ~10 questions, so filtering down to a
    // percentage (30%/40%/60%) can leave FEWER than 10 candidates. Padding
    // via reshuffled repeats guarantees a full 10-question round even when
    // the age-appropriate subset is small — better than silently serving
    // fewer questions than promised.
    const padTo10 = (arr) => {
      if (!arr.length) return [];
      let result = [];
      while (result.length < 10) {
        result = result.concat([...arr].sort(()=>Math.random()-0.5));
      }
      return result.slice(0,10);
    };
    let questions;
    const hard = this._hardQuestions?.[worldId] || [];
    if(ageGroup === 'schwer') {
      // Adults 18+: use ONLY hard questions (if enough), else fill with pool
      if(hard.length >= 10) {
        questions = padTo10(hard);
      } else {
        // Not enough hard → filter pool to medium+ difficulty + add hard
        const medPool = pool.filter((_,i)=>i>=pool.length*0.6); // last 40% = harder ones
        questions = padTo10([...medPool,...hard]);
      }
    } else if(ageGroup === 'mittel') {
      // Teens 14-18: mix medium from pool + some hard
      const medPool = pool.filter((_,i)=>i>=pool.length*0.4);
      questions = padTo10([...medPool,...hard.slice(0,5)]);
    } else if(ageGroup === 'einfach') {
      // Kids 10-14: first 60% of pool
      questions = padTo10(pool.slice(0,Math.ceil(pool.length*0.6)));
    } else {
      // sehr_einfach: first 30% of pool
      questions = padTo10(pool.slice(0,Math.ceil(pool.length*0.3)));
    }
    console.log('[TF] worldId='+worldId+' ageGroup='+ageGroup+' pool='+questions.length);
    this.current = {
      questions, index:0,
      results:[], errors:0,
      startTime: Date.now(),
      answered: false,
      onComplete,
    };
    this._render();
  },

  _render() {
    const c = this.current;
    if (c.index >= c.questions.length) { this._showResult(); return; }
    const q = c.questions[c.index];
    const qText = (typeof LANG!=='undefined' && LANG._cur && q.q[LANG._cur]) ? q.q[LANG._cur] : q.q.de;
    const elapsed = Math.round((Date.now()-c.startTime)/1000);

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <!-- Progress -->
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:10px">
          <span>${typeof t!=='undefined'?t('tf.question_n'):'Frage'} <b>${c.index+1}/10</b></span>
          <span>⏱ ${elapsed}s</span>
          <span>❌ ${c.errors}</span>
        </div>
        <div style="background:#E8F5E9;border-radius:50px;height:10px;margin-bottom:18px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#27AE60,#1E8449);border-radius:50px;width:${c.index*10}%;transition:width 0.3s"></div>
        </div>

        <!-- Question card -->
        <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border:2px solid #85C1E9;
          border-radius:18px;padding:24px 20px;margin-bottom:20px;min-height:100px;
          display:flex;align-items:center;justify-content:center">
          <div style="font-family:'Fredoka One',cursive;font-size:1.25rem;color:var(--mountain-dark);line-height:1.4">
            "${qText}"
          </div>
        </div>

        <!-- True / False buttons -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <button onclick="TrueFalseGame._answer(true)"
            style="padding:22px 10px;border-radius:18px;border:none;cursor:pointer;
              background:linear-gradient(135deg,#27AE60,#1E8449);color:white;
              font-family:'Fredoka One',cursive;font-size:1.6rem;
              box-shadow:0 6px 16px rgba(39,174,96,0.4);transition:transform 0.15s"
            onmousedown="this.style.transform='scale(0.95)'"
            onmouseup="this.style.transform=''">
            ${typeof t!=='undefined'?t('tf.true'):'✅ Wahr'}
          </button>
          <button onclick="TrueFalseGame._answer(false)"
            style="padding:22px 10px;border-radius:18px;border:none;cursor:pointer;
              background:linear-gradient(135deg,#E74C3C,#C0392B);color:white;
              font-family:'Fredoka One',cursive;font-size:1.6rem;
              box-shadow:0 6px 16px rgba(231,76,60,0.4);transition:transform 0.15s"
            onmousedown="this.style.transform='scale(0.95)'"
            onmouseup="this.style.transform=''">
            ${typeof t!=='undefined'?t('tf.false'):'❌ Falsch'}
          </button>
        </div>

        <!-- Dots -->
        <div style="display:flex;gap:5px;justify-content:center;margin-top:16px">
          ${Array.from({length:10},(_,i)=>{
            const r=c.results[i];
            return `<div style="width:10px;height:10px;border-radius:50%;background:${
              r===true?'#27AE60':r===false?'#E74C3C':'#E0E6EE'}"></div>`;
          }).join('')}
        </div>
      </div>`;
  },

  _answer(chosen) {
    const c = this.current;
    if (c.answered) return;
    c.answered = true;
    const q = c.questions[c.index];
    const correct = chosen === q.a;
    if (!correct) c.errors++;
    c.results[c.index] = correct;

    // Brief feedback overlay on buttons
    const btns = document.querySelectorAll('#game-area button');
    btns.forEach(b=>b.disabled=true);

    // Show correct answer
    const feedback = document.createElement('div');
    feedback.style.cssText = `text-align:center;margin-top:12px;font-family:'Fredoka One',cursive;font-size:1.1rem;color:${correct?'#27AE60':'#E74C3C'}`;
    feedback.textContent = correct ? (typeof t!=='undefined'?t('tf.correct'):'✅ Richtig!') : `${typeof t!=='undefined'?t('tf.wrong_answer_was'):'❌ Falsch! Die Antwort war:'} ${q.a ? (typeof t!=='undefined'?t('tf.answer_true'):'Wahr') : (typeof t!=='undefined'?t('tf.answer_false'):'Falsch')}`;
    document.getElementById('game-area')?.appendChild(feedback);

    setTimeout(() => {
      c.index++;
      c.answered = false;
      this._render();
    }, 1000);
  },

  _showResult() {
    const c = this.current;
    const correct = c.results.filter(Boolean).length;
    const timeMs = Date.now()-c.startTime;
    const totalQ = c.results?.length || 10;
    const rawScore = Math.round((correct/Math.max(totalQ,1))*100); // true raw score 0-100

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${correct>=9?'🧠🏆':correct>=7?'🧠😊':correct>=5?'🧠😐':'🧠😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          ${correct}/10 ${typeof t!=='undefined'?t('math.correct_n'):'richtig!'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b>
            <br><span style="color:var(--text-mid)">${typeof t!=='undefined'?t('math.time'):'Zeit'}</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b>
            <br><span style="color:var(--text-mid)">${typeof t!=='undefined'?t('math.errors'):'Fehler'}</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${rawScore}</b>
            <br><span style="color:var(--text-mid)">${typeof t!=='undefined'?t('math.points'):'Punkte'}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${correct<6?`<button class="btn btn-secondary btn-full" onclick="TrueFalseGame.start(TrueFalseGame._lastConfig)">${typeof t!=='undefined'?t('math.try_again'):'🔄 Nochmal'}</button>`:''}
          <button class="btn btn-primary btn-full" onclick="TrueFalseGame._finish(${rawScore},${timeMs},${c.errors})">${typeof t!=='undefined'?t('game.continue'):'Weiter ➜'}</button>
        </div>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({rawScore:score,timeMs,errors,passed:score>=40});
  },
};

window.TrueFalseGame = TrueFalseGame;
