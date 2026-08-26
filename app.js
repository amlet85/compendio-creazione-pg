document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Data State
    let compendiumData = {
        species: [],
        backgrounds: [],
        classes: [],
        originFeats: [],
        generalFeats: []
    };

    // DOM Elements
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.compendium-section');
    const globalSearch = document.getElementById('global-search');
    const sectionFilters = document.querySelectorAll('.section-filter');
    const btnCustomBg = document.getElementById('btn-custom-bg');
    const customBgModal = document.getElementById('custom-bg-modal');
    const customBgForm = document.getElementById('custom-bg-form');
    const statCheckboxes = document.querySelectorAll('input[name="stat"]');
    const bgOriginFeatSelect = document.getElementById('bg-origin-feat');
    const hitDieSelect = document.getElementById('filter-hit-die');
    const featPrereqSelect = document.getElementById('filter-feat-prereq');

    // App Initialization
    init();

    async function init() {
        await loadCompendiumData();
        setupNavigation();
        setupSearch();
        setupAdvancedFilters();
        setupCustomBackgroundForm();
    }

    // 1. CARICAMENTO DATI JSON
    async function loadCompendiumData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error("Impossibile caricare data.json");
            const data = await response.json();

            compendiumData = data;

            populateOriginFeatsDropdown();
            renderAllGrids();
        } catch (error) {
            console.error("Errore nel caricamento dei dati:", error);
        }
    }

    // 2. NAVIGAZIONE A SCHEDE (TABS)
    function setupNavigation() {
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetSection = btn.dataset.section;

                navButtons.forEach(b => b.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(targetSection).classList.add('active');
            });
        });
    }

    // 3. RENDERING DINAMICO DELLE CARD
    function renderSpecies(items) {
        const container = document.getElementById('species-grid');
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `<p class="empty-msg">Nessuna specie trovata.</p>`;
            return;
        }

        container.innerHTML = items.map(s => `
            <div class="card" data-name="${s.name.toLowerCase()}">
                <h3>${s.name}</h3>
                <p><strong>Taglia:</strong> ${s.size} | <strong>Velocità:</strong> ${s.speed}</p>
                <div class="traits-list">
                    ${s.traits.map(t => `<p class="trait-item">${t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`).join('')}
                </div>
            </div>
        `).join('');
    }

    function renderBackgrounds(items) {
        const container = document.getElementById('backgrounds-grid');
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `<p class="empty-msg">Nessun background trovato.</p>`;
            return;
        }

        container.innerHTML = items.map(b => `
            <div class="card" data-name="${b.name.toLowerCase()}">
                <h3>${b.name}</h3>
                <p><strong>Bonus Stat:</strong> ${Array.isArray(b.stats) ? b.stats.join(', ') : b.stats}</p>
                <p><strong>Talento Origine:</strong> ${b.originFeat}</p>
                <p><strong>Abilità:</strong> ${Array.isArray(b.skills) ? b.skills.join(', ') : b.skills}</p>
                <p><strong>Strumento:</strong> ${b.tool}</p>
            </div>
        `).join('');
    }

    function renderClasses(items) {
        const container = document.getElementById('classes-grid');
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `<p class="empty-msg">Nessuna classe trovata.</p>`;
            return;
        }

        container.innerHTML = items.map(c => `
            <div class="card" data-name="${c.name.toLowerCase()}" data-hitdie="${c.hitDie}">
                <h3>${c.name}</h3>
                <p><strong>Dado Vita:</strong> ${c.hitDie}</p>
                <p><strong>Stat Primaria:</strong> ${c.primaryStat}</p>
                <p><strong>Sottoclassi (${c.subclassLevel}):</strong> ${c.subclasses.join(', ')}</p>
                <p><strong>Privilegi Chiave:</strong> ${c.features.join(', ')}</p>
            </div>
        `).join('');
    }

    function renderOriginFeats(items) {
        const container = document.getElementById('origin-feats-grid');
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `<p class="empty-msg">Nessun talento trovato.</p>`;
            return;
        }

        container.innerHTML = items.map(f => `
            <div class="card" data-name="${f.name.toLowerCase()}">
                <h3>${f.name}</h3>
                <p><strong>Prerequisito:</strong> ${f.prerequisite}</p>
                <p>${f.description}</p>
            </div>
        `).join('');
    }

    function renderGeneralFeats(items) {
        const container = document.getElementById('general-feats-grid');
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `<p class="empty-msg">Nessun talento trovato.</p>`;
            return;
        }

        container.innerHTML = items.map(f => `
            <div class="card" data-name="${f.name.toLowerCase()}" data-prereq="${f.prerequisite.toLowerCase()}">
                <h3>${f.name}</h3>
                <p><strong>Prerequisito:</strong> ${f.prerequisite}</p>
                <p>${f.description}</p>
            </div>
        `).join('');
    }

    function renderAllGrids() {
        renderSpecies(compendiumData.species);
        renderBackgrounds(compendiumData.backgrounds);
        renderClasses(compendiumData.classes);
        renderOriginFeats(compendiumData.originFeats);
        renderGeneralFeats(compendiumData.generalFeats);
    }

    // 4. RICERCA E FILTRI LOCALI / GLOBALI
    function setupSearch() {
        // Ricerca Globale
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const allCards = document.querySelectorAll('.card');

                allCards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(query) ? 'flex' : 'none';
                });
            });
        }

        // Filtro di testo interno alla sezione
        sectionFilters.forEach(input => {
            input.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const currentSection = input.closest('.compendium-section');
                const cards = currentSection.querySelectorAll('.card');

                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(query) ? 'flex' : 'none';
                });
            });
        });
    }

    // 5. FILTRI AVANZATI (SELETTORI DADO VITA E PREREQUISITI)
    function setupAdvancedFilters() {
        // Filtro Dado Vita per le Classi
        if (hitDieSelect) {
            hitDieSelect.addEventListener('change', (e) => {
                const selectedVal = e.target.value;
                const filtered = compendiumData.classes.filter(c => {
                    return selectedVal === 'all' || c.hitDie === selectedVal;
                });
                renderClasses(filtered);
            });
        }

        // Filtro Prerequisiti per i Talenti Generali
        if (featPrereqSelect) {
            featPrereqSelect.addEventListener('change', (e) => {
                const selectedVal = e.target.value;
                const filtered = compendiumData.generalFeats.filter(f => {
                    const prereq = f.prerequisite.toLowerCase();
                    if (selectedVal === 'all') return true;
                    if (selectedVal === 'des') return prereq.includes('destrezza') || prereq.includes('des');
                    if (selectedVal === 'for') return prereq.includes('forza') || prereq.includes('for');
                    if (selectedVal === 'spell') return prereq.includes('incantesim') || prereq.includes('lanciare');
                    return true;
                });
                renderGeneralFeats(filtered);
            });
        }
    }

    // 6. GESTIONE BACKGROUND PERSONALIZZATO (REGOLE D&D 5.5)
    function populateOriginFeatsDropdown() {
        if (!bgOriginFeatSelect) return;
        bgOriginFeatSelect.innerHTML = '<option value="">-- Seleziona Talento --</option>';

        compendiumData.originFeats.forEach(feat => {
            const option = document.createElement('option');
            option.value = feat.name;
            option.textContent = feat.name;
            bgOriginFeatSelect.appendChild(option);
        });
    }

    function setupCustomBackgroundForm() {
        // Mostra / Nascondi il Form
        if (btnCustomBg) {
            btnCustomBg.addEventListener('click', () => {
                customBgModal.classList.toggle('hidden');
            });
        }

        // Regola D&D 5.5: Limite a 3 Caratteristiche selezionabili
        statCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const checkedCount = document.querySelectorAll('input[name="stat"]:checked').length;
                if (checkedCount >= 3) {
                    statCheckboxes.forEach(box => {
                        if (!box.checked) box.disabled = true;
                    });
                } else {
                    statCheckboxes.forEach(box => box.disabled = false);
                }
            });
        });

        // Invio del Form e Inserimento nel Compendio
        if (customBgForm) {
            customBgForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const selectedStats = Array.from(document.querySelectorAll('input[name="stat"]:checked')).map(cb => cb.value);

                if (selectedStats.length !== 3) {
                    alert('Regola D&D 5.5: Devi selezionare esattamente 3 caratteristiche per distribuire i bonus (+2/+1 o +1/+1/+1).');
                    return;
                }

                const newBg = {
                    id: "custom-" + Date.now(),
                    name: document.getElementById('bg-name').value.trim() + " (Personalizzato)",
                    stats: selectedStats,
                    originFeat: bgOriginFeatSelect.value,
                    skills: document.getElementById('bg-skills').value.trim(),
                    tool: document.getElementById('bg-tools').value.trim()
                };

                // Aggiungi in cima alla lista e aggiorna la griglia
                compendiumData.backgrounds.unshift(newBg);
                renderBackgrounds(compendiumData.backgrounds);

                // Reset del form e chiusura
                customBgForm.reset();
                statCheckboxes.forEach(box => box.disabled = false);
                customBgModal.classList.add('hidden');
            });
        }
    }
});