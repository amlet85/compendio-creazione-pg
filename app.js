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

// Funzione per generare l'HTML della Tabella di Progressione (Vanilla JS)
function renderProgressionTable(progression) {
  if (!progression || progression.length === 0) return '';

  const rows = progression.map(row => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${row.level}</td>
      <td style="text-align: center;">${row.prof_bonus}</td>
      <td>${Array.isArray(row.features) ? row.features.join(', ') : row.features}</td>
      <td style="text-align: center;">${row.details || '-'}</td>
    </tr>
  `).join('');

  return `
    <div class="progression-table-container" style="overflow-x: auto; margin-top: 20px;">
      <h3>Tabella di Progressione</h3>
      <table class="progression-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #2c3e50; color: #fff;">
            <th style="padding: 8px; border: 1px solid #ddd;">Livello</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Bonus Comp.</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Privilegi</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Dettagli</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// Funzione per generare l'HTML dei Privilegi di Classe (Vanilla JS)
function renderClassFeatures(classFeatures) {
  if (!classFeatures || classFeatures.length === 0) return '';

  const featuresHTML = classFeatures.map(feature => `
    <div class="feature-card" style="background: #f8f9fa; border-left: 4px solid #e67e22; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px;">
      <h3 style="margin-top: 0; margin-bottom: 8px; color: #2c3e50; font-size: 1.1em;">
        ${feature.name} <span style="font-size: 0.85em; font-weight: normal; color: #7f8c8d;">(Livello ${feature.level})</span>
      </h3>
      <div class="feature-description" style="line-height: 1.5;">
        ${feature.description}
      </div>
    </div>
  `).join('');

  return `
    <div class="class-features" style="margin-top: 25px;">
      <h2 style="border-bottom: 2px solid #e67e22; padding-bottom: 5px;">Privilegi di Classe</h2>
      ${featuresHTML}
    </div>
  `;
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
    const classA = (a.class_it || a.parent_class || a.class || '').toLowerCase();
    const classB = (b.class_it || b.parent_class || b.class || '').toLowerCase();
    
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
    
    const parentClass = item.class_it || item.parent_class || item.class;
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

    // Generazione dinamica della tabella e dei privilegi di classe se presenti nell'oggetto JSON
    const progressionHTML = item.progression ? renderProgressionTable(item.progression) : '';
    const classFeaturesHTML = item.class_features ? renderClassFeatures(item.class_features) : '';

    // Gestione Link Approfondimento per Classi e Sottoclassi
    let linkHTML = '';
    const rawType = (item.type || '').toLowerCase();
    const rawCat = (item.category || '').toLowerCase();
    const isClassOrSubclass = rawType.includes('classe') || rawCat.includes('classe') || item.url;

    // Se l'elemento è una classe ed è mostrato nella lista principale, aggiungiamo il pulsante per accedere al dettaglio
    if (isClassOrSubclass && !item.progression) {
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
      ${progressionHTML}
      ${classFeaturesHTML}
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

    // 3. Classe di appartenenza
    let parentClassString = '';
    const parentClass = item.class_it || item.parent_class || item.class || item.classes;
    if (Array.isArray(parentClass)) {
      parentClassString = parentClass.join(' ').toLowerCase();
    } else if (typeof parentClass === 'string') {
      parentClassString = parentClass.toLowerCase();
    }

    const matchesClass = selectedClass === '' || parentClassString.includes(selectedClass);

    return matchesName && matchesCategory && matchesClass;
  });

  renderCards(filtered);
}

document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('categoryFilter').addEventListener('change', filterData);
document.getElementById('classFilter').addEventListener('change', filterData);

loadData();