async function loadDetail() {
  const contentDiv = document.getElementById('detailContent');
  
  // 1. Estrae l'ID dai parametri dell'URL (es. dettaglio.html?id=subclass_barbarian_wild_heart)
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
  
  // Metadati (Classe Madre, Manuale, Competenze)
  let metaHTML = '';
  
  // Se è una sottoclasse, mostra la classe d'appartenenza
  const parentClass = item.class_it || item.parent_class || item.class_id || item.class;
  if (parentClass) {
    const formattedClass = Array.isArray(parentClass) ? parentClass.join(', ') : parentClass;
    metaHTML += `<p><strong>Classe d'appartenenza:</strong> ${formattedClass.toUpperCase()}</p>`;
  }

  if (item.source_it || item.source) {
    metaHTML += `<p><strong>Manuale:</strong> ${item.source_it || item.source}</p>`;
  }
  if (item.proficiencies_it || item.proficiencies) {
    const profs = item.proficiencies_it || item.proficiencies;
    metaHTML += `<p><strong>Competenze:</strong> ${Array.isArray(profs) ? profs.join(', ') : profs}</p>`;
  }

  // Descrizione principale
  const descriptionText = item.description_it || item.description || '<em>Nessuna descrizione.</em>';

  // 1. Tabella Progressione (Solo se presente, es. per le Classi Base)
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
      <div class="progression-table-container" style="margin-top: 20px;">
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

  // 2. Sezione Privilegi (Supporta sia 'class_features' che 'features' della Sottoclasse)
  let featuresHTML = '';
  const featuresList = item.class_features || item.features;

  if (featuresList && featuresList.length > 0) {
    const titleText = item.type === 'sottoclasse' ? 'Privilegi di Sottoclasse' : 'Privilegi di Classe';

    const featureCards = featuresList.map(feature => {
      const featName = feature.name_it || feature.name;
      const featDesc = feature.description_it || feature.description || feature.desc_it || '<em>Nessuna descrizione.</em>';
      
      return `
        <div class="feature-card" style="margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-left: 4px solid #e67e22; border-radius: 4px;">
          <h3 style="margin-bottom: 5px;">${featName} ${feature.level ? `<span style="font-size: 0.85em; font-weight: normal; color: #7f8c8d;">(Livello ${feature.level})</span>` : ''}</h3>
          <div style="line-height: 1.5;">${featDesc}</div>
        </div>
      `;
    }).join('');

    featuresHTML = `
      <div class="class-features" style="margin-top: 25px;">
        <h2 style="border-bottom: 2px solid #e67e22; padding-bottom: 5px; margin-bottom: 15px;">${titleText}</h2>
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