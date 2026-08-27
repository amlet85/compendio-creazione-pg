async function loadDetail() {
  const contentDiv = document.getElementById('detailContent');
  
  // 1. Estrae l'ID dai parametri dell'URL (es. dettaglio.html?id=guerriero)
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  if (!itemId) {
    contentDiv.innerHTML = '<p>Nessun elemento specificato.</p>';
    return;
  }

  try {
    // 2. Carica i dati dal JSON
    const response = await fetch('character_data.json');
    const data = await response.json();

    // 3. Trova l'elemento corrispondente all'ID
    const item = data.find(i => String(i.id).toLowerCase() === itemId.toLowerCase());

    if (!item) {
      contentDiv.innerHTML = '<p>Elemento non trovato nel database.</p>';
      return;
    }

    // 4. Renderizza il contenuto completo
    renderDetailView(item, contentDiv);

  } catch (error) {
    console.error('Errore durante il caricamento:', error);
    contentDiv.innerHTML = '<p>Errore nel caricamento del file dei dati.</p>';
  }
}

function renderDetailView(item, container) {
  const badgeText = (item.category || item.type || 'CLASSE').toUpperCase();
  
  // Metadati (Fonte, Requisiti, ecc.)
  let metaHTML = '';
  if (item.source_it || item.source) {
    metaHTML += `<p><strong>Manuale:</strong> ${item.source_it || item.source}</p>`;
  }
  if (item.proficiencies_it || item.proficiencies) {
    const profs = item.proficiencies_it || item.proficiencies;
    metaHTML += `<p><strong>Competenze:</strong> ${Array.isArray(profs) ? profs.join(', ') : profs}</p>`;
  }

  // Descrizione
  const descriptionText = item.description_it || item.description || '<em>Nessuna descrizione.</em>';

  // 1. Tabella Progressione
  let progressionHTML = '';
  if (item.progression && item.progression.length > 0) {
    const rows = item.progression.map(row => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${row.level}</td>
        <td style="text-align: center;">${row.prof_bonus || '-'}</td>
        <td>${Array.isArray(row.features) ? row.features.join(', ') : row.features}</td>
        <td>${row.details || '-'}</td>
      </tr>
    `).join('');

    progressionHTML = `
      <div class="progression-table-container">
        <h2>Tabella Progressione Livelli</h2>
        <table class="progression-table">
          <thead>
            <tr>
              <th>Livello</th>
              <th>Bonus Comp.</th>
              <th>Privilegi</th>
              <th>Dettagli</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // 2. Sezione Privilegi di Classe
  let featuresHTML = '';
  if (item.class_features && item.class_features.length > 0) {
    const featureCards = item.class_features.map(feature => `
      <div class="feature-card">
        <h3>${feature.name} <span style="font-size: 0.85em; font-weight: normal; color: #7f8c8d;">(Livello ${feature.level})</span></h3>
        <div>${feature.description}</div>
      </div>
    `).join('');

    featuresHTML = `
      <div class="class-features">
        <h2 style="border-bottom: 2px solid #e67e22; padding-bottom: 5px;">Privilegi di Classe</h2>
        ${featureCards}
      </div>
    `;
  }

  // Assemblaggio Finale
  container.innerHTML = `
    <h1>${item.name_it || item.name} <span class="spell-level">${badgeText}</span></h1>
    ${metaHTML ? `<div class="spell-meta">${metaHTML}</div>` : ''}
    <div class="spell-description" style="margin-top: 15px; line-height: 1.6;">
      ${descriptionText}
    </div>
    ${progressionHTML}
    ${featuresHTML}
  `;
}

loadDetail();