/* ============================================
   FIFA World Cup 2026 Dashboard — App Logic
   ============================================ */

// CONFIG is now loaded externally from config.js (generated via dotenv)

// ========== API SERVICE ==========
class FootballAPI {
    constructor() {
        this.cache = new Map();
    }

    async fetch(endpoint, params = {}) {
        const url = new URL(`${CONFIG.API_BASE}${endpoint}`);
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

        const cacheKey = url.toString();
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            return cached.data;
        }

        const response = await window.fetch(url.toString(), {
            headers: { 'X-Auth-Token': CONFIG.API_TOKEN }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    }

    clearCache() {
        this.cache.clear();
    }

    getMatches(params = {}) {
        return this.fetch(`/competitions/${CONFIG.COMPETITION_CODE}/matches`, params);
    }

    getStandings() {
        return this.fetch(`/competitions/${CONFIG.COMPETITION_CODE}/standings`);
    }

    getCompetition() {
        return this.fetch(`/competitions/${CONFIG.COMPETITION_CODE}`);
    }
}

// ========== UTILITY FUNCTIONS ==========
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr) {
    return `${formatDate(dateStr)} · ${formatTime(dateStr)}`;
}

function getStatusLabel(status) {
    const labels = {
        'SCHEDULED': 'Programado',
        'TIMED': 'Programado',
        'IN_PLAY': '🔴 En Vivo',
        'PAUSED': '⏸ Pausa',
        'FINISHED': 'Finalizado',
        'POSTPONED': 'Aplazado',
        'SUSPENDED': 'Suspendido',
        'CANCELLED': 'Cancelado',
        'AWARDED': 'Adjudicado',
    };
    return labels[status] || status;
}

function getStatusClass(status) {
    if (['IN_PLAY', 'PAUSED'].includes(status)) return 'live';
    if (status === 'FINISHED') return 'finished';
    return 'scheduled';
}

function getStageName(stage) {
    const names = {
        'GROUP_STAGE': 'Fase de Grupos',
        'LAST_32': 'Dieciseisavos de Final',
        'ROUND_OF_32': 'Dieciseisavos de Final',
        'LAST_16': 'Octavos de Final',
        'ROUND_OF_16': 'Octavos de Final',
        'QUARTER_FINALS': 'Cuartos de Final',
        'SEMI_FINALS': 'Semifinales',
        'THIRD_PLACE': 'Tercer Puesto',
        'FINAL': 'Final',
    };
    return names[stage] || stage;
}

function getStageOrder(stage) {
    const order = {
        'ROUND_OF_32': 0,
        'LAST_32': 0,
        'ROUND_OF_16': 1,
        'LAST_16': 1,
        'QUARTER_FINALS': 2,
        'SEMI_FINALS': 3,
        'THIRD_PLACE': 4,
        'FINAL': 5,
    };
    return order[stage] ?? 99;
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.35s ease-in forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
}

// ========== APP ==========
class WorldCupApp {
    constructor() {
        this.api = new FootballAPI();
        this.currentTab = 'matches';
        this.currentFilter = 'SCHEDULED';
        this.matchesData = null;
        this.standingsData = null;

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadAllData();
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Match filters
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.setFilter(chip.dataset.filter);
            });
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });
    }

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.toggle('active', section.id === `tab-${tab}`);
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
        });

        this.renderMatches();
    }

    async refreshData() {
        const btn = document.getElementById('refresh-btn');
        btn.classList.add('loading');
        btn.disabled = true;

        this.api.clearCache();

        try {
            await this.loadAllData();
            showToast('Datos actualizados correctamente', 'success');
        } catch (e) {
            showToast('Error al actualizar datos', 'error');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    async loadAllData() {
        const results = await Promise.allSettled([
            this.loadMatches(),
            this.loadStandings(),
        ]);

        const hasError = results.some(r => r.status === 'rejected');
        if (hasError) {
            console.warn('Some data failed to load:', results);
        }

        // Update timestamp
        document.getElementById('last-update').textContent = 
            new Date().toLocaleString('es-ES');
    }

    // ===== MATCHES =====
    async loadMatches() {
        try {
            const data = await this.api.getMatches();
            this.matchesData = data.matches || [];
            this.renderMatches();
        } catch (error) {
            console.error('Error loading matches:', error);
            document.getElementById('matches-container').innerHTML = this.renderError(
                'No se pudieron cargar los partidos',
                error.message
            );
        }
    }

    renderMatches() {
        const container = document.getElementById('matches-container');
        if (!this.matchesData) return;

        let filtered = [...this.matchesData];

        switch (this.currentFilter) {
            case 'SCHEDULED':
                filtered = filtered.filter(m =>
                    ['SCHEDULED', 'TIMED'].includes(m.status)
                );
                // Sort by date ascending
                filtered.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
                break;
            case 'LIVE':
                filtered = filtered.filter(m =>
                    ['IN_PLAY', 'PAUSED'].includes(m.status)
                );
                break;
            case 'FINISHED':
                filtered = filtered.filter(m => m.status === 'FINISHED');
                // Sort by date descending (most recent first)
                filtered.sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
                break;
            case 'ALL':
                filtered.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
                break;
        }

        if (filtered.length === 0) {
            container.innerHTML = this.renderEmpty(
                '⚽',
                'No hay partidos disponibles',
                this.currentFilter === 'LIVE'
                    ? 'No hay partidos en vivo en este momento'
                    : 'Prueba con otro filtro'
            );
            return;
        }

        container.innerHTML = filtered.map((match, i) => this.renderMatchCard(match, i)).join('');
    }

    renderMatchCard(match, index) {
        const isFinished = match.status === 'FINISHED';
        const isLive = ['IN_PLAY', 'PAUSED'].includes(match.status);
        const homeScore = match.score?.fullTime?.home;
        const awayScore = match.score?.fullTime?.away;
        const hasScore = homeScore !== null && homeScore !== undefined;

        const homeCrest = match.homeTeam?.crest
            ? `<img class="team-crest" src="${match.homeTeam.crest}" alt="${match.homeTeam.shortName || match.homeTeam.name}" loading="lazy" onerror="this.outerHTML='<div class=\\'team-crest-placeholder\\'>🏳️</div>'">`
            : `<div class="team-crest-placeholder">🏳️</div>`;

        const awayCrest = match.awayTeam?.crest
            ? `<img class="team-crest" src="${match.awayTeam.crest}" alt="${match.awayTeam.shortName || match.awayTeam.name}" loading="lazy" onerror="this.outerHTML='<div class=\\'team-crest-placeholder\\'>🏳️</div>'">`
            : `<div class="team-crest-placeholder">🏳️</div>`;

        const scoreSection = hasScore
            ? `<div class="match-score">
                 <span class="score-number">${homeScore}</span>
                 <span class="score-separator">—</span>
                 <span class="score-number">${awayScore}</span>
               </div>`
            : `<span class="match-vs">VS</span>`;

        const stageName = match.stage === 'GROUP_STAGE' && match.group
            ? `Grupo ${match.group.replace('GROUP_', '')}`
            : getStageName(match.stage);

        const venue = match.venue ? `<div class="match-venue">📍 ${match.venue}</div>` : '';

        return `
            <div class="match-card ${isLive ? 'live' : ''}" style="animation-delay: ${index * 60}ms">
                <div class="match-meta">
                    <span class="match-stage">${stageName}</span>
                    <span class="match-status ${getStatusClass(match.status)}">${getStatusLabel(match.status)}</span>
                </div>
                <div class="match-date">${formatDateTime(match.utcDate)}</div>
                <div class="match-teams">
                    <div class="match-team">
                        ${homeCrest}
                        <span class="team-name">${match.homeTeam?.shortName || match.homeTeam?.name || 'TBD'}</span>
                    </div>
                    ${scoreSection}
                    <div class="match-team">
                        ${awayCrest}
                        <span class="team-name">${match.awayTeam?.shortName || match.awayTeam?.name || 'TBD'}</span>
                    </div>
                </div>
                ${venue}
            </div>
        `;
    }

    // ===== STANDINGS =====
    async loadStandings() {
        try {
            const data = await this.api.getStandings();
            this.standingsData = data.standings || [];
            this.renderStandings();
            this.renderKnockout();
        } catch (error) {
            console.error('Error loading standings:', error);
            document.getElementById('standings-container').innerHTML = this.renderError(
                'No se pudo cargar la clasificación',
                error.message
            );
        }
    }

    renderStandings() {
        const container = document.getElementById('standings-container');
        if (!this.standingsData) return;

        // Filter only TOTAL standings for group stage
        const groupStandings = this.standingsData.filter(s => s.type === 'TOTAL' && s.stage === 'GROUP_STAGE');

        if (groupStandings.length === 0) {
            container.innerHTML = this.renderEmpty(
                '📊',
                'Clasificación no disponible aún',
                'Los datos aparecerán cuando inicie la fase de grupos'
            );
            return;
        }

        container.innerHTML = groupStandings.map((group, i) => this.renderGroupCard(group, i)).join('');
    }

    renderGroupCard(group, index) {
        const groupName = group.group ? group.group.replace('GROUP_', '') : '?';

        const rows = (group.table || []).map((team, pos) => {
            const gd = team.goalDifference;
            const gdClass = gd > 0 ? 'gd-positive' : gd < 0 ? 'gd-negative' : '';
            const gdDisplay = gd > 0 ? `+${gd}` : gd;
            const qualifyClass = pos < 2 ? 'qualifying' : pos === 2 ? 'third-place' : '';

            const crest = team.team?.crest
                ? `<img class="team-crest-sm" src="${team.team.crest}" alt="" loading="lazy" onerror="this.style.display='none'">`
                : '';

            return `
                <tr class="${qualifyClass}">
                    <td><span class="position-badge pos-${pos + 1}">${team.position}</span></td>
                    <td>
                        <div class="team-cell">
                            ${crest}
                            <span class="team-name-cell">${team.team?.shortName || team.team?.name || '—'}</span>
                        </div>
                    </td>
                    <td>${team.playedGames}</td>
                    <td>${team.won}</td>
                    <td>${team.draw}</td>
                    <td>${team.lost}</td>
                    <td>${team.goalsFor}</td>
                    <td>${team.goalsAgainst}</td>
                    <td class="${gdClass}">${gdDisplay}</td>
                    <td class="points-cell">${team.points}</td>
                </tr>
            `;
        }).join('');

        return `
            <div class="group-card" style="animation-delay: ${index * 80}ms">
                <div class="group-header">
                    <span class="group-letter">${groupName}</span>
                    <span class="group-label">Grupo</span>
                </div>
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Equipo</th>
                            <th>PJ</th>
                            <th>G</th>
                            <th>E</th>
                            <th>P</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DG</th>
                            <th>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ===== KNOCKOUT PHASE =====
    renderKnockout() {
        const container = document.getElementById('knockout-container');
        if (!this.matchesData) {
            container.innerHTML = this.renderEmpty(
                '🏅',
                'Fases finales no disponibles',
                'Los datos aparecerán cuando se definan los cruces'
            );
            return;
        }

        // Filter knockout matches
        const knockoutMatches = this.matchesData.filter(m =>
            m.stage !== 'GROUP_STAGE'
        );

        if (knockoutMatches.length === 0) {
            container.innerHTML = this.renderEmpty(
                '🏅',
                'Fases finales aún no definidas',
                'Los cruces se generarán al completarse la fase de grupos'
            );
            return;
        }

        // Group by stage
        const stageMap = new Map();
        knockoutMatches.forEach(match => {
            const stage = match.stage;
            if (!stageMap.has(stage)) {
                stageMap.set(stage, []);
            }
            stageMap.get(stage).push(match);
        });

        // Sort stages
        const sortedStages = [...stageMap.entries()].sort(
            (a, b) => getStageOrder(a[0]) - getStageOrder(b[0])
        );

        let html = '<div class="knockout-vertical">';

        sortedStages.forEach(([stage, matches]) => {
            // Sort matches within stage by date
            matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

            html += `
                <div class="knockout-stage-section">
                    <div class="knockout-stage-title">${getStageName(stage)}</div>
                    <div class="knockout-stage-matches">
                        ${matches.map((match, i) => this.renderKnockoutMatch(match, i)).join('')}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderKnockoutMatch(match, index) {
        const homeScore = match.score?.fullTime?.home;
        const awayScore = match.score?.fullTime?.away;
        const hasScore = homeScore !== null && homeScore !== undefined;
        const isFinished = match.status === 'FINISHED';

        const homeWinner = isFinished && hasScore && homeScore > awayScore;
        const awayWinner = isFinished && hasScore && awayScore > homeScore;

        // Handle penalties if applicable
        const penHome = match.score?.penalties?.home;
        const penAway = match.score?.penalties?.away;
        const hasPenalties = penHome !== null && penHome !== undefined;

        const homePenWinner = hasPenalties && penHome > penAway;
        const awayPenWinner = hasPenalties && penAway > penHome;

        const finalHomeWinner = homeWinner || homePenWinner;
        const finalAwayWinner = awayWinner || awayPenWinner;

        const homeCrest = match.homeTeam?.crest
            ? `<img class="team-crest-sm" src="${match.homeTeam.crest}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : '';
        const awayCrest = match.awayTeam?.crest
            ? `<img class="team-crest-sm" src="${match.awayTeam.crest}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : '';

        const homeScoreDisplay = hasScore ? homeScore : '—';
        const awayScoreDisplay = hasScore ? awayScore : '—';

        const penaltyInfo = hasPenalties
            ? `<div class="knockout-match-date" style="color: var(--accent-rose);">Penales: ${penHome} - ${penAway}</div>`
            : '';

        return `
            <div class="knockout-match" style="animation-delay: ${index * 60}ms">
                <div class="knockout-match-date">${formatDateTime(match.utcDate)} · ${getStatusLabel(match.status)}</div>
                <div class="knockout-team ${finalHomeWinner ? 'winner' : ''}">
                    <div class="knockout-team-info">
                        ${homeCrest}
                        <span class="knockout-team-name">${match.homeTeam?.shortName || match.homeTeam?.name || 'Por definir'}</span>
                    </div>
                    <span class="knockout-team-score">${homeScoreDisplay}</span>
                </div>
                <div class="knockout-team ${finalAwayWinner ? 'winner' : ''}">
                    <div class="knockout-team-info">
                        ${awayCrest}
                        <span class="knockout-team-name">${match.awayTeam?.shortName || match.awayTeam?.name || 'Por definir'}</span>
                    </div>
                    <span class="knockout-team-score">${awayScoreDisplay}</span>
                </div>
                ${penaltyInfo}
            </div>
        `;
    }

    // ===== HELPERS =====
    renderEmpty(icon, text, sub) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-text">${text}</div>
                <div class="empty-state-sub">${sub}</div>
            </div>
        `;
    }

    renderError(text, detail) {
        return `
            <div class="error-state">
                <div class="error-state-icon">⚠️</div>
                <div class="error-state-text">${text}</div>
                <div class="error-state-detail">${detail}</div>
            </div>
        `;
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    new WorldCupApp();
});
