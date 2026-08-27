let allData = [];

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err));
}

async function loadData() {
  try {
    const response = await fetch('character_data.json');
    allData = await response.json();
    renderCards(allData);
  } catch (error) {
    console.error('Errore nel caricamento del file JSON:', error);
  }
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
    
    // Supporto esteso a class_id
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

    // Render dei Privilegi / Features (Se presenti nel JSON)
    let featuresHTML = '';
    if (item.features && Array.isArray(item.features)) {
      featuresHTML = '<div class="features-container" style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">';
      featuresHTML += '<h3>Privilegi di Sottoclasse:</h3>';
      item.features.forEach(feat => {
        featuresHTML += `
          <div class="feature-item" style="margin-bottom: 12px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px;">
            <strong style="color: #e67e22;">${feat.name}</strong> ${feat.level ? `<small>(Livello ${feat.level})</small>` : ''}
            <div style="margin-top: 4px;">${feat.description}</div>
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
  const selectedCategory = selectedCategoryRaw.replace(/['_ ]/g, '');
  const selectedClass = document.getElementById('classFilter').value.toLowerCase().trim();

  const filtered = allData.filter(item => {
    // 1. Ricerca Testuale
    const nameIt = (item.name_it || '').toLowerCase();
    const nameEn = (item.name || '').toLowerCase();
    const matchesName = query === '' || nameIt.includes(query) || nameEn.includes(query);

    // 2. Lettura dei tipi e categorie normalizzati
    const rawType = (item.type || '').toLowerCase();
    const rawCat = (item.category || '').toLowerCase();
    
    const itemType = rawType.replace(/['_ ]/g, '');
    const itemCat = rawCat.replace(/['_ ]/g, '');

    let matchesCategory = false;

    if (selectedCategory === '') {
      matchesCategory = true;
    } else if (selectedCategory === "talentoorigine") {
      matchesCategory = (itemType.includes("talento") || itemCat.includes("talento")) && itemCat.includes("origine");
    } else if (selectedCategory === "stiledicombattimento") {
      matchesCategory = itemType.includes("stile") || 
                        itemCat.includes("stile") || 
                        itemCat.includes("combattimento") || 
                        rawType.includes("fighting") || 
                        rawCat.includes("fighting");
    } else if (selectedCategory === "talentogenerale") {
      const isOrigin = itemCat.includes("origine");
      const isFightingStyle = itemCat.includes("stile") || itemCat.includes("combattimento") || itemType.includes("stile");
      matchesCategory = itemType.includes("talento") && !isOrigin && !isFightingStyle;
    } else if (selectedCategory === "arma") {
      matchesCategory = itemType.includes("arma") || itemCat.includes("arma") || itemType.includes("weapon") || itemCat.includes("weapon");
    } else if (selectedCategory === "armatura") {
      matchesCategory = itemType.includes("armatura") || itemCat.includes("armatura") || itemType.includes("armor") || itemCat.includes("armor") || itemCat.includes("scudo") || itemCat.includes("shield");
    } else if (selectedCategory === "equipaggiamento") {
      const isWeaponOrArmor = itemType.includes("arma") || itemCat.includes("arma") || itemType.includes("armatura") || itemCat.includes("armatura");
      matchesCategory = (itemType.includes("equip") || itemCat.includes("equip")) && !isWeaponOrArmor;
    } else {
      matchesCategory = itemType.includes(selectedCategory) || itemCat.includes(selectedCategory);
    }

    // 3. Classe di appartenenza (AGGIUNTO class_id PER MATCHARE LE SOTTOCLASSI)
    let parentClassString = '';
    const parentClass = item.class_it || item.parent_class || item.class_id || item.class || item.classes;
    if (Array.isArray(parentClass)) {
      parentClassString = parentClass.join(' ').toLowerCase();
    } else if (typeof parentClass === 'string') {
      parentClassString = parentClass.toLowerCase();
    }

    // Risoluzione per match tra "barbarian" (del menu select) e "Barbaro" o "barbarian"
    const matchesClass = selectedClass === '' || parentClassString.includes(selectedClass) || (selectedClass === 'barbarian' && parentClassString.includes('barbaro'));

    return matchesName && matchesCategory && matchesClass;
  });

  renderCards(filtered);
}

document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('categoryFilter').addEventListener('change', filterData);
document.getElementById('classFilter').addEventListener('change', filterData);

loadData();