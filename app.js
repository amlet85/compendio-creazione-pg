let allData = [];

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
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

    card.innerHTML = `
      <h2>${item.name_it || item.name} <span class="spell-level">${badgeText}</span></h2>
      ${metaHTML ? `<div class="spell-meta">${metaHTML}</div>` : ''}
      <div class="spell-description">
        ${descriptionText}
      </div>
    `;

    container.appendChild(card);
  });
}

function filterData() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedCategory = document.getElementById('categoryFilter').value.toLowerCase().trim();
  const selectedClass = document.getElementById('classFilter').value.toLowerCase().trim();

  const filtered = allData.filter(item => {
    // 1. Ricerca Testuale
    const nameIt = (item.name_it || '').toLowerCase();
    const nameEn = (item.name || '').toLowerCase();
    const matchesName = query === '' || nameIt.includes(query) || nameEn.includes(query);

    // 2. Lettura dei tipi e categorie
    const itemType = (item.type || '').toLowerCase();
    const itemCat = (item.category || '').toLowerCase();
    let matchesCategory = false;

    if (selectedCategory === '') {
      matchesCategory = true;
    } else if (selectedCategory === "talento d'origine") {
      matchesCategory = itemType.includes("talento") && itemCat.includes("origine");
    } else if (selectedCategory === "talento generale") {
      matchesCategory = itemType.includes("talento") && (itemCat.includes("generale") || !itemCat.includes("origine"));
    } else if (selectedCategory === "arma") {
      // Riconosce le armi da type, category o id
      matchesCategory = itemType.includes("arma") || itemCat.includes("arma") || itemType.includes("weapon") || itemCat.includes("weapon");
    } else if (selectedCategory === "armatura") {
      // Riconosce le armature da type, category o id
      matchesCategory = itemType.includes("armatura") || itemCat.includes("armatura") || itemType.includes("armor") || itemCat.includes("armor") || itemCat.includes("scudo") || itemCat.includes("shield");
    } else if (selectedCategory === "equipaggiamento") {
      // Equipaggiamento generico (esclude armi ed armature se già categorizzate)
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