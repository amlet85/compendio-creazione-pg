let allData = [];

// Registrazione Service Worker per il funzionamento offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Caricamento del file JSON per la creazione del personaggio
async function loadData() {
  try {
    const response = await fetch('character_data.json');
    allData = await response.json();
    renderCards(allData);
  } catch (error) {
    console.error('Errore nel caricamento del file JSON:', error);
  }
}

// Estrazione flessibile della descrizione
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

// Generazione visiva delle schede
function renderCards(items) {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding: 20px;">Nessun elemento trovato.</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'spell-card'; // Mantiene le stesse classi CSS per coerenza grafica

    const categoryText = (item.type || item.category || 'INFO').toUpperCase();

    // Estrazione metadati dinamici (Tratti, Requisiti, Competenze)
    let metaHTML = '';
    
    if (item.source || item.source_it) {
      metaHTML += `<p><strong>Manuale:</strong> ${item.source_it || item.source}</p>`;
    }
    if (item.traits || item.traits_it) {
      const traits = item.traits_it || item.traits;
      metaHTML += `<p><strong>Tratti:</strong> ${Array.isArray(traits) ? traits.join(', ') : traits}</p>`;
    }
    if (item.proficiencies || item.proficiencies_it) {
      const profs = item.proficiencies_it || item.proficiencies;
      metaHTML += `<p><strong>Competenze:</strong> ${Array.isArray(profs) ? profs.join(', ') : profs}</p>`;
    }
    if (item.prerequisite || item.prerequisites || item.requirements) {
      const reqs = item.prerequisite || item.prerequisites || item.requirements;
      metaHTML += `<p><strong>Requisiti:</strong> ${Array.isArray(reqs) ? reqs.join(', ') : reqs}</p>`;
    }

    const descriptionText = getItemDescription(item);

    card.innerHTML = `
      <h2>${item.name_it || item.name} <span class="spell-level">${categoryText}</span></h2>
      ${metaHTML ? `<div class="spell-meta">${metaHTML}</div>` : ''}
      <div class="spell-description">
        ${descriptionText}
      </div>
    `;

    container.appendChild(card);
  });
}

// Logica di filtraggio per Nome e Categoria
function filterData() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedCategory = document.getElementById('categoryFilter').value.toLowerCase().trim();

  const filtered = allData.filter(item => {
    // 1. Filtro Ricerca Testuale (Nome italiano o inglese)
    const nameIt = (item.name_it || '').toLowerCase();
    const nameEn = (item.name || '').toLowerCase();
    const matchesName = query === '' || nameIt.includes(query) || nameEn.includes(query);

    // 2. Filtro Categoria (Razza, Classe, Background, Talento, ecc.)
    let itemCategory = (item.type || item.category || item.type_it || '').toLowerCase();
    const matchesCategory = selectedCategory === '' || itemCategory.includes(selectedCategory);

    return matchesName && matchesCategory;
  });

  renderCards(filtered);
}

// Event Listeners per i filtri
document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('categoryFilter').addEventListener('change', filterData);

// Avvio
loadData();