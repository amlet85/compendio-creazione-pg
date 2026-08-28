let allData = [];

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err));
}

// Mappatura per tradurre qualsiasi termine di classe (inglese o varianti) in italiano standard
const classTranslationMap = {
  'artificer': 'Artefice',
  'artefice': 'Artefice',
  'barbarian': 'Barbaro',
  'barbaro': 'Barbaro',
  'bard': 'Bardo',
  'bardo': 'Bardo',
  'cleric': 'Chierico',
  'chierico': 'Chierico',
  'druid': 'Druido',
  'druido': 'Druido',
  'fighter': 'Guerriero',
  'guerriero': 'Guerriero',
  'monk': 'Monaco',
  'monaco': 'Monaco',
  'paladin': 'Paladino',
  'paladino': 'Paladino',
  'ranger': 'Ranger',
  'cacciatore (ranger)': 'Ranger',
  'cacciatore': 'Ranger',
  'rogue': 'Ladro',
  'ladro': 'Ladro',
  'sorcerer': 'Stregone',
  'stregone': 'Stregone',
  'warlock': 'Warlock',
  'wizard': 'Mago',
  'mago': 'Mago'
};

async function loadData() {
  try {
    const response = await fetch('character_data.json');
    allData = await response.json();
    populateClassFilter(allData); // Popola automaticamente il menu a tendina delle classi
    renderCards(allData);
  } catch (error) {
    console.error('Errore nel caricamento del file JSON:', error);
  }
}

// Popola il select delle classi mostrando solo i nomi in italiano ed eliminando i duplicati inglesi
function populateClassFilter(data) {
  const classFilter = document.getElementById('classFilter');
  if (!classFilter) return;

  const currentSelection = classFilter.value;
  const classesSet = new Set();

  data.forEach(item => {
    const parent = item.parent_class || item.class_it || item.class_id || item.class || item.classes;
    if (parent) {
      const parentArray = Array.isArray(parent) ? parent : [parent];
      parentArray.forEach(c => {
        if (typeof c === 'string' && c.trim() !== '') {
          const key = c.trim().toLowerCase();
          // Traduce in italiano se presente nel dizionario, altrimenti formatta la stringa
          const translatedName = classTranslationMap[key] || (c.trim().charAt(0).toUpperCase() + c.trim().slice(1));
          classesSet.add(translatedName);
        }
      });
    }
  });

  // Ordina alfabeticamente in italiano
  const sortedClasses = Array.from(classesSet).sort((a, b) => a.localeCompare(b, 'it'));

  classFilter.innerHTML = '<option value="">Tutte le Classi</option>';
  sortedClasses.forEach(className => {
    const option = document.createElement('option');
    option.value = className.toLowerCase();
    option.textContent = className;
    if (className.toLowerCase() === currentSelection.toLowerCase()) {
      option.selected = true;
    }
    classFilter.appendChild(option);
  });
}

function getItemDescription(item) {
  if (item.description_it) return item.description_it;
  if (item.descriptions_it) {
    if (typeof item.descriptions_it === 'string') return item.descriptions_it;
    if (typeof item.descriptions_it === 'object') {
      return Object.values(item.descriptions_it).join('<br><br>');
    }
  }
  if (item.description) return item.description;
  return '<em>Descrizione non disponibile.</em>';
}

function renderCards(items) {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding: 20px;">Nessun elemento trovato.</p>';
    return;
  }

  // Ordinamento: raggruppa prima per classe/categoria e poi per nome
  const sortedItems = [...items].sort((a, b) => {
    const classA = (a.class_it || a.parent_class || a.class_id || a.class || '').toLowerCase();
    const classB = (b.class_it || b.parent_class || b.class_id || b.class || '').toLowerCase();
    
    if (classA !== classB) {
      return classA.localeCompare(classB);
    }
    
    const nameA = (a.name_it || a.name || '').toLowerCase();
    const nameB = (b.name_it || b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  sortedItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'spell-card';

    const badgeText = (item.category || item.type || 'INFO').toUpperCase();

    // Metadati dinamici
    let metaHTML = '';
    
    const parentClass = item.class_it || item.parent_class || item.class_id || item.class;
    if (parentClass) {
      const formattedClass = Array.isArray(parentClass) ? parentClass.join(', ') : parentClass;
      metaHTML += `<p><strong>Classe d'appartenenza:</strong> ${formattedClass}</p>`;
    }

    if (item.source_it || item.source) {
      metaHTML += `<p><strong>Manuale:</strong> ${item.source_it || item.source}</p>`;
    }
    if (item.category && item.category.toLowerCase() !== badgeText.toLowerCase()) {
      metaHTML += `<p><strong>Categoria:</strong> ${item.category}</p>`;
    }
    if (item.prerequisite || item.prerequisites || item.requirements) {
      const reqs = item.prerequisite || item.prerequisites || item.requirements;
      metaHTML += `<p><strong>Requisiti:</strong> ${Array.isArray(reqs) ? reqs.join(', ') : reqs}</p>`;
    }
    if (item.traits_it || item.traits) {
      const traits = item.traits_it || item.traits;
      metaHTML += `<p><strong>Tratti:</strong> ${Array.isArray(traits) ? traits.join(', ') : traits}</p>`;
    }
    if (item.proficiencies_it || item.proficiencies) {
      const profs = item.proficiencies_it || item.proficiencies;
      metaHTML += `<p><strong>Competenze:</strong> ${Array.isArray(profs) ? profs.join(', ') : profs}</p>`;
    }

    const descriptionText = getItemDescription(item);

    // Render dinamico delle Features / Privilegi (per Sottoclassi e Classi)
    let featuresHTML = '';
    const featuresList = item.features || item.class_features;
    if (featuresList && Array.isArray(featuresList) && featuresList.length > 0) {
      featuresHTML = '<div class="features-container" style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">';
      featuresHTML += '<h3 style="margin-bottom: 10px; font-size: 1.1em; color: #e67e22;">Privilegi:</h3>';
      
      featuresList.forEach(feat => {
        const featName = feat.name_it || feat.name || 'Privilegio';
        const featDesc = feat.description_it || feat.description || feat.desc_it || '<em>Nessuna descrizione.</em>';

        featuresHTML += `
          <div class="feature-item" style="margin-bottom: 12px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
            <strong style="color: #e67e22;">${featName}</strong> ${feat.level ? `<small style="color: #aaa;">(Livello ${feat.level})</small>` : ''}
            <div style="margin-top: 6px; font-size: 0.95em; line-height: 1.4;">${featDesc}</div>
          </div>
        `;
      });
      
      featuresHTML += '</div>';
    }

    // Gestione Link Approfondimento per Classi e Sottoclassi
    let linkHTML = '';
    const rawType = (item.type || '').toLowerCase();
    const rawCat = (item.category || '').toLowerCase();
    const isClassOrSubclass = rawType.includes('classe') || rawCat.includes('classe') || item.url || item.progression;

    if (isClassOrSubclass) {
      const targetUrl = item.url ? item.url : `dettaglio.html?id=${encodeURIComponent(item.id)}`;
      linkHTML = `
        <div class="card-action" style="margin-top: 15px; text-align: right;">
          <a href="${targetUrl}" class="detail-btn" style="display: inline-block; padding: 8px 14px; background-color: #e67e22; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 0.9em;">
            📖 Progressioni Livelli & Dettagli →
          </a>
        </div>
      `;
    }

    card.innerHTML = `
      <h2>${item.name_it || item.name} <span class="spell-level">${badgeText}</span></h2>
      ${metaHTML ? `<div class="spell-meta">${metaHTML}</div>` : ''}
      <div class="spell-description">
        ${descriptionText}
      </div>
      ${featuresHTML}
      ${linkHTML}
    `;

    container.appendChild(card);
  });
}

function filterData() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedCategoryRaw = document.getElementById('categoryFilter').value.toLowerCase().trim();
  const selectedCategory = selectedCategoryRaw.replace(/['_ \-]/g, '');
  const selectedClass = document.getElementById('classFilter').value.toLowerCase().trim();

  const filtered = allData.filter(item => {
    // 1. Ricerca Testuale
    const nameIt = (item.name_it || '').toLowerCase();
    const nameEn = (item.name || '').toLowerCase();
    const matchesName = query === '' || nameIt.includes(query) || nameEn.includes(query);

    // 2. Lettura dei tipi e categorie normalizzati
    const rawType = (item.type || '').toLowerCase().replace(/['_ \-]/g, '');
    const rawCat = (item.category || '').toLowerCase().replace(/['_ \-]/g, '');

    let matchesCategory = false;

    if (selectedCategory === '') {
      matchesCategory = true;
    } else if (selectedCategory === "talentoorigine") {
      matchesCategory = (rawType.includes("talento") || rawCat.includes("talento")) && rawCat.includes("origine");
    } else if (selectedCategory === "stiledicombattimento") {
      matchesCategory = rawType.includes("stile") || 
                        rawCat.includes("stile") || 
                        rawCat.includes("combattimento") || 
                        rawType.includes("fighting") || 
                        rawCat.includes("fighting");
    } else if (selectedCategory === "talentogenerale") {
      const isOrigin = rawCat.includes("origine");
      const isFightingStyle = rawCat.includes("stile") || rawCat.includes("combattimento") || rawType.includes("stile");
      matchesCategory = rawType.includes("talento") && !isOrigin && !isFightingStyle;
    } else if (selectedCategory === "arma") {
      matchesCategory = rawType.includes("arma") || rawCat.includes("arma") || rawType.includes("weapon") || rawCat.includes("weapon");
    } else if (selectedCategory === "armatura") {
      matchesCategory = rawType.includes("armatura") || rawCat.includes("armatura") || rawType.includes("armor") || rawCat.includes("armor") || rawCat.includes("scudo") || rawCat.includes("shield");
    } else if (selectedCategory === "equipaggiamento") {
      const isWeaponOrArmor = rawType.includes("arma") || rawCat.includes("arma") || rawType.includes("armatura") || rawCat.includes("armatura");
      matchesCategory = (rawType.includes("equip") || rawCat.includes("equip")) && !isWeaponOrArmor;
    } else {
      matchesCategory = rawType.includes(selectedCategory) || rawCat.includes(selectedCategory);
    }

    if (!matchesCategory) return false;
    if (selectedClass === '') return matchesName;

    // 3. Classe di appartenenza (Supporta class_id, parent_class, class_it, class, classes)
    let parentClassString = '';
    const parentClass = item.class_id || item.parent_class || item.class_it || item.class || item.classes;
    
    if (Array.isArray(parentClass)) {
      parentClassString = parentClass.join(' ').toLowerCase();
    } else if (typeof parentClass === 'string') {
      parentClassString = parentClass.toLowerCase();
    }

    // Mappatura nomi delle Classi Italiano/Inglese per garantire il match
    const isArtificer = selectedClass.includes('artificer') || selectedClass.includes('artefice');
    const matchesArtificer = isArtificer && (parentClassString.includes('artificer') || parentClassString.includes('artefice'));

    const isBarbarian = selectedClass.includes('barbarian') || selectedClass.includes('barbaro');
    const matchesBarbarian = isBarbarian && (parentClassString.includes('barbarian') || parentClassString.includes('barbaro'));

    const isBard = selectedClass.includes('bard') || selectedClass.includes('bardo');
    const matchesBard = isBard && (parentClassString.includes('bard') || parentClassString.includes('bardo'));

    const isCleric = selectedClass.includes('cleric') || selectedClass.includes('chierico');
    const matchesCleric = isCleric && (parentClassString.includes('cleric') || parentClassString.includes('chierico'));

    const isDruid = selectedClass.includes('druid') || selectedClass.includes('druido');
    const matchesDruid = isDruid && (parentClassString.includes('druid') || parentClassString.includes('druido'));

    const isFighter = selectedClass.includes('fighter') || selectedClass.includes('guerriero');
    const matchesFighter = isFighter && (parentClassString.includes('fighter') || parentClassString.includes('guerriero'));

    const isMonk = selectedClass.includes('monk') || selectedClass.includes('monaco');
    const matchesMonk = isMonk && (parentClassString.includes('monk') || parentClassString.includes('monaco'));

    const isWizard = selectedClass.includes('wizard') || selectedClass.includes('mago');
    const matchesWizard = isWizard && (parentClassString.includes('wizard') || parentClassString.includes('mago'));

    const isPaladin = selectedClass.includes('paladin') || selectedClass.includes('paladino');
    const matchesPaladin = isPaladin && (parentClassString.includes('paladin') || parentClassString.includes('paladino'));

    const isRanger = selectedClass.includes('ranger') || selectedClass.includes('cacciatore');
    const matchesRanger = isRanger && (parentClassString.includes('ranger') || parentClassString.includes('cacciatore'));

    const isRogue = selectedClass.includes('rogue') || selectedClass.includes('ladro');
    const matchesRogue = isRogue && (parentClassString.includes('rogue') || parentClassString.includes('ladro'));

    const isSorcerer = selectedClass.includes('sorcerer') || selectedClass.includes('stregone');
    const matchesSorcerer = isSorcerer && (parentClassString.includes('sorcerer') || parentClassString.includes('stregone'));

    const isWarlock = selectedClass.includes('warlock');
    const matchesWarlock = isWarlock && parentClassString.includes('warlock');

    const matchesClass = parentClassString.includes(selectedClass) || 
                         matchesArtificer || matchesBarbarian || matchesBard || 
                         matchesCleric || matchesDruid || matchesFighter || 
                         matchesMonk || matchesWizard || matchesPaladin || 
                         matchesRanger || matchesRogue || matchesSorcerer || matchesWarlock;

    return matchesName && matchesClass;
  });

  renderCards(filtered);
}

document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('categoryFilter').addEventListener('change', filterData);
document.getElementById('classFilter').addEventListener('change', filterData);

loadData();