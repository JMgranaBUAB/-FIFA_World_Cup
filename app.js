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
        let url;
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.hostname.startsWith('192.168.');
        const headers = {};

        if (isLocal) {
            url = new URL(`${CONFIG.API_BASE}${endpoint}`);
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
            headers['X-Auth-Token'] = CONFIG.API_TOKEN;
        } else {
            // Usar proxy serverless en producción para evitar CORS y ocultar el token
            url = new URL(`${window.location.origin}/api/proxy`);
            url.searchParams.set('endpoint', endpoint);
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        }

        const cacheKey = url.toString();
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            return cached.data;
        }

        const response = await window.fetch(url.toString(), { headers, cache: 'no-store' });

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

    getScorers(params = {}) {
        return this.fetch(`/competitions/${CONFIG.COMPETITION_CODE}/scorers`, params);
    }

    getMatchHeadToHead(matchId) {
        return this.fetch(`/matches/${matchId}/head2head`);
    }
}

// ========== CONSTANTS ==========
const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'HALF_TIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'LIVE'];

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
        'PAUSED': '⏸ Descanso',
        'HALF_TIME': '⏸ Descanso',
        'EXTRA_TIME': '🔴 Prórroga',
        'PENALTY_SHOOTOUT': '🔴 Penaltis',
        'LIVE': '🔴 En Vivo',
        'FINISHED': 'Finalizado',
        'POSTPONED': 'Aplazado',
        'SUSPENDED': 'Suspendido',
        'CANCELLED': 'Cancelado',
        'AWARDED': 'Adjudicado',
    };
    return labels[status] || status;
}

function getStatusClass(status) {
    if (LIVE_STATUSES.includes(status)) return 'live';
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

// ========== SIMULATOR DATA AND GENERATORS ==========
const PRESET_TEAMS = {
    "mexico": {
        formation: "4-3-3",
        coach: "Javier Aguirre",
        players: [
            { name: "Guillermo Ochoa", surname: "Ochoa", number: 13, pos: "GK" },
            { name: "César Montes", surname: "Montes", number: 3, pos: "DF" },
            { name: "Johan Vásquez", surname: "Vásquez", number: 5, pos: "DF" },
            { name: "Jorge Sánchez", surname: "Sánchez", number: 19, pos: "DF" },
            { name: "Jesús Gallardo", surname: "Gallardo", number: 23, pos: "DF" },
            { name: "Edson Álvarez", surname: "Álvarez", number: 4, pos: "MF" },
            { name: "Luis Chávez", surname: "Chávez", number: 24, pos: "MF" },
            { name: "Luis Romo", surname: "Romo", number: 7, pos: "MF" },
            { name: "Hirving Lozano", surname: "Lozano", number: 22, pos: "FW" },
            { name: "Santiago Giménez", surname: "Giménez", number: 11, pos: "FW" },
            { name: "Alexis Vega", surname: "Vega", number: 10, pos: "FW" }
        ],
        subs: [
            { name: "Luis Malagón", number: 1, pos: "GK" },
            { name: "Néstor Araujo", number: 2, pos: "DF" },
            { name: "Orbelín Pineda", number: 17, pos: "MF" },
            { name: "Uriel Antuna", number: 15, pos: "FW" },
            { name: "Henry Martín", number: 9, pos: "FW" }
        ]
    },
    "south africa": {
        formation: "4-3-3",
        coach: "Hugo Broos",
        players: [
            { name: "Ronwen Williams", surname: "Williams", number: 1, pos: "GK" },
            { name: "Khuliso Mudau", surname: "Mudau", number: 2, pos: "DF" },
            { name: "Grant Kekana", surname: "Kekana", number: 18, pos: "DF" },
            { name: "Mothobi Mvala", surname: "Mvala", number: 20, pos: "DF" },
            { name: "Aubrey Modiba", surname: "Modiba", number: 6, pos: "DF" },
            { name: "Teboho Mokoena", surname: "Mokoena", number: 4, pos: "MF" },
            { name: "Sphephelo Sithole", surname: "Sithole", number: 13, pos: "MF" },
            { name: "Themba Zwane", surname: "Zwane", number: 11, pos: "MF" },
            { name: "Thapelo Morena", surname: "Morena", number: 23, pos: "FW" },
            { name: "Percy Tau", surname: "Tau", number: 10, pos: "FW" },
            { name: "Thapelo Maseko", surname: "Maseko", number: 7, pos: "FW" }
        ],
        subs: [
            { name: "Ricardo Goss", number: 16, pos: "GK" },
            { name: "Nkosinathi Sibisi", number: 5, pos: "DF" },
            { name: "Thabang Monare", number: 15, pos: "MF" },
            { name: "Terrence Mashego", number: 12, pos: "DF" },
            { name: "Zakhele Lepasa", number: 9, pos: "FW" }
        ]
    },
    "united states": {
        formation: "4-3-3",
        coach: "Mauricio Pochettino",
        players: [
            { name: "Matt Turner", surname: "Turner", number: 1, pos: "GK" },
            { name: "Sergiño Dest", surname: "Dest", number: 2, pos: "DF" },
            { name: "Chris Richards", surname: "Richards", number: 3, pos: "DF" },
            { name: "Tim Ream", surname: "Ream", number: 13, pos: "DF" },
            { name: "Antonee Robinson", surname: "Robinson", number: 5, pos: "DF" },
            { name: "Weston McKennie", surname: "McKennie", number: 8, pos: "MF" },
            { name: "Tyler Adams", surname: "Adams", number: 4, pos: "MF" },
            { name: "Yunus Musah", surname: "Musah", number: 6, pos: "MF" },
            { name: "Timothy Weah", surname: "Weah", number: 21, pos: "FW" },
            { name: "Folarin Balogun", surname: "Balogun", number: 20, pos: "FW" },
            { name: "Christian Pulisic", surname: "Pulisic", number: 10, pos: "FW" }
        ],
        subs: [
            { name: "Ethan Horvath", number: 18, pos: "GK" },
            { name: "Cameron Carter-Vickers", number: 4, pos: "DF" },
            { name: "Gio Reyna", number: 7, pos: "MF" },
            { name: "Johnny Cardoso", number: 15, pos: "MF" },
            { name: "Ricardo Pepi", number: 9, pos: "FW" }
        ]
    },
    "argentina": {
        formation: "4-3-3",
        coach: "Lionel Scaloni",
        players: [
            { name: "Emiliano Martínez", surname: "Martínez", number: 23, pos: "GK" },
            { name: "Nahuel Molina", surname: "Molina", number: 26, pos: "DF" },
            { name: "Cristian Romero", surname: "Romero", number: 13, pos: "DF" },
            { name: "Nicolás Otamendi", surname: "Otamendi", number: 19, pos: "DF" },
            { name: "Nicolás Tagliafico", surname: "Tagliafico", number: 3, pos: "DF" },
            { name: "Rodrigo De Paul", surname: "De Paul", number: 7, pos: "MF" },
            { name: "Enzo Fernández", surname: "Fernández", number: 24, pos: "MF" },
            { name: "Alexis Mac Allister", surname: "Mac Allister", number: 20, pos: "MF" },
            { name: "Lionel Messi", surname: "Messi", number: 10, pos: "FW" },
            { name: "Lautaro Martínez", surname: "Martínez", number: 22, pos: "FW" },
            { name: "Ángel Di María", surname: "Di María", number: 11, pos: "FW" }
        ],
        subs: [
            { name: "Franco Armani", number: 1, pos: "GK" },
            { name: "Lisandro Martínez", number: 25, pos: "DF" },
            { name: "Leandro Paredes", number: 5, pos: "MF" },
            { name: "Giovani Lo Celso", number: 16, pos: "MF" },
            { name: "Julián Álvarez", number: 9, pos: "FW" }
        ]
    },
    "spain": {
        formation: "4-3-3",
        coach: "Luis de la Fuente",
        players: [
            { name: "David Raya", surname: "Raya", number: 1, pos: "GK" },
            { name: "Dani Carvajal", surname: "Carvajal", number: 2, pos: "DF" },
            { name: "Robin Le Normand", surname: "Le Normand", number: 3, pos: "DF" },
            { name: "Aymeric Laporte", surname: "Laporte", number: 14, pos: "DF" },
            { name: "Marc Cucurella", surname: "Cucurella", number: 24, pos: "DF" },
            { name: "Rodri", surname: "Rodri", number: 16, pos: "MF" },
            { name: "Fabián Ruiz", surname: "Ruiz", number: 8, pos: "MF" },
            { name: "Pedri", surname: "Pedri", number: 20, pos: "MF" },
            { name: "Lamine Yamal", surname: "Yamal", number: 19, pos: "FW" },
            { name: "Álvaro Morata", surname: "Morata", number: 7, pos: "FW" },
            { name: "Nico Williams", surname: "Williams", number: 17, pos: "FW" }
        ],
        subs: [
            { name: "Álex Remiro", number: 13, pos: "GK" },
            { name: "Dani Vivian", number: 5, pos: "DF" },
            { name: "Alejandro Grimaldo", number: 12, pos: "DF" },
            { name: "Martín Zubimendi", number: 18, pos: "MF" },
            { name: "Dani Olmo", number: 10, pos: "MF" }
        ]
    },
    "france": {
        formation: "4-3-3",
        coach: "Didier Deschamps",
        players: [
            { name: "Mike Maignan", surname: "Maignan", number: 16, pos: "GK" },
            { name: "Jules Koundé", surname: "Koundé", number: 5, pos: "DF" },
            { name: "Dayot Upamecano", surname: "Upamecano", number: 4, pos: "DF" },
            { name: "William Saliba", surname: "Saliba", number: 17, pos: "DF" },
            { name: "Théo Hernández", surname: "Hernández", number: 22, pos: "DF" },
            { name: "N'Golo Kanté", surname: "Kanté", number: 13, pos: "MF" },
            { name: "Aurélien Tchouaméni", surname: "Tchouaméni", number: 8, pos: "MF" },
            { name: "Adrien Rabiot", surname: "Rabiot", number: 14, pos: "MF" },
            { name: "Ousmane Dembélé", surname: "Dembélé", number: 11, pos: "FW" },
            { name: "Kylian Mbappé", surname: "Mbappé", number: 10, pos: "FW" },
            { name: "Antoine Griezmann", surname: "Griezmann", number: 7, pos: "FW" }
        ],
        subs: [
            { name: "Alphonse Areola", number: 23, pos: "GK" },
            { name: "Benjamin Pavard", number: 2, pos: "DF" },
            { name: "Youssouf Fofana", number: 19, pos: "MF" },
            { name: "Eduardo Camavinga", number: 6, pos: "MF" },
            { name: "Olivier Giroud", number: 9, pos: "FW" }
        ]
    },
    "germany": {
        formation: "4-3-3",
        coach: "Julian Nagelsmann",
        players: [
            { name: "Manuel Neuer", surname: "Neuer", number: 1, pos: "GK" },
            { name: "Joshua Kimmich", surname: "Kimmich", number: 6, pos: "DF" },
            { name: "Antonio Rüdiger", surname: "Rüdiger", number: 2, pos: "DF" },
            { name: "Jonathan Tah", surname: "Tah", number: 4, pos: "DF" },
            { name: "Maximilian Mittelstädt", surname: "Mittelstädt", number: 22, pos: "DF" },
            { name: "Robert Andrich", surname: "Andrich", number: 23, pos: "MF" },
            { name: "Toni Kroos", surname: "Kroos", number: 8, pos: "MF" },
            { name: "İlkay Gündoğan", surname: "Gündoğan", number: 21, pos: "MF" },
            { name: "Jamal Musiala", surname: "Musiala", number: 10, pos: "FW" },
            { name: "Kai Havertz", surname: "Havertz", number: 7, pos: "FW" },
            { name: "Florian Wirtz", surname: "Wirtz", number: 17, pos: "FW" }
        ],
        subs: [
            { name: "Marc-André ter Stegen", number: 12, pos: "GK" },
            { name: "Nico Schlotterbeck", number: 15, pos: "DF" },
            { name: "Pascal Groß", number: 5, pos: "MF" },
            { name: "Leroy Sané", number: 19, pos: "FW" },
            { name: "Niclas Füllkrug", number: 9, pos: "FW" }
        ]
    },
    "brazil": {
        formation: "4-3-3",
        coach: "Dorival Júnior",
        players: [
            { name: "Alisson Becker", surname: "Alisson", number: 1, pos: "GK" },
            { name: "Danilo Luiz", surname: "Danilo", number: 2, pos: "DF" },
            { name: "Marquinhos Aoás", surname: "Marquinhos", number: 3, pos: "DF" },
            { name: "Gabriel Magalhães", surname: "Gabriel", number: 4, pos: "DF" },
            { name: "Guilherme Arana", surname: "Arana", number: 6, pos: "DF" },
            { name: "Bruno Guimarães", surname: "Guimarães", number: 5, pos: "MF" },
            { name: "João Gomes", surname: "Gomes", number: 15, pos: "MF" },
            { name: "Lucas Paquetá", surname: "Paquetá", number: 8, pos: "MF" },
            { name: "Raphinha Dias", surname: "Raphinha", number: 11, pos: "FW" },
            { name: "Rodrygo Goes", surname: "Rodrygo", number: 10, pos: "FW" },
            { name: "Vinícius Júnior", surname: "Vinícius", number: 7, pos: "FW" }
        ],
        subs: [
            { name: "Bento Matheus", number: 12, pos: "GK" },
            { name: "Éder Militão", number: 14, pos: "DF" },
            { name: "Douglas Luiz", number: 18, pos: "MF" },
            { name: "Andreas Pereira", number: 19, pos: "MF" },
            { name: "Endrick Felipe", number: 9, pos: "FW" }
        ]
    }
};

const PITCH_POSITIONS = {
    home: [
        { role: 'GK', x: 50, y: 8 },
        { role: 'DF', x: 15, y: 20 },
        { role: 'DF', x: 38, y: 18 },
        { role: 'DF', x: 62, y: 18 },
        { role: 'DF', x: 85, y: 20 },
        { role: 'MF', x: 25, y: 32 },
        { role: 'MF', x: 50, y: 30 },
        { role: 'MF', x: 75, y: 32 },
        { role: 'FW', x: 20, y: 44 },
        { role: 'FW', x: 50, y: 46 },
        { role: 'FW', x: 80, y: 44 }
    ],
    away: [
        { role: 'GK', x: 50, y: 92 },
        { role: 'DF', x: 15, y: 80 },
        { role: 'DF', x: 38, y: 82 },
        { role: 'DF', x: 62, y: 82 },
        { role: 'DF', x: 85, y: 80 },
        { role: 'MF', x: 25, y: 68 },
        { role: 'MF', x: 50, y: 70 },
        { role: 'MF', x: 75, y: 68 },
        { role: 'FW', x: 20, y: 56 },
        { role: 'FW', x: 50, y: 54 },
        { role: 'FW', x: 80, y: 56 }
    ]
};

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateRoster(teamName, isHome, matchId) {
    const key = teamName.toLowerCase().trim();
    const preset = PRESET_TEAMS[key];
    if (preset) {
        return JSON.parse(JSON.stringify(preset));
    }

    let seed = 0;
    for (let char of key) seed += char.charCodeAt(0);
    seed += matchId;

    const positions = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'];
    const regionNames = {
        first: ["James", "Lucas", "Mateo", "Thomas", "Daniel", "David", "Gabriel", "Luka", "Alexander", "Marc", "Oliver", "Antoine", "Luis", "Nicolas", "Jan", "Erik", "Ivan", "Kenji", "Sadio"],
        last: ["Silva", "García", "Fernández", "Smith", "Jones", "Williams", "Müller", "Schneider", "Dubois", "Martin", "Rossi", "Bianchi", "Kovac", "Subasic", "Hansen", "Nielsen", "Takahashi", "Sissoko"]
    };

    const players = [];
    for (let i = 0; i < 11; i++) {
        const r1 = Math.floor(seededRandom(seed + i) * regionNames.first.length);
        const r2 = Math.floor(seededRandom(seed + i + 25) * regionNames.last.length);
        const number = i === 0 ? 1 : Math.floor(seededRandom(seed + i + 50) * 22) + 2;
        
        players.push({
            name: `${regionNames.first[r1]} ${regionNames.last[r2]}`,
            surname: regionNames.last[r2],
            number: number,
            pos: positions[i]
        });
    }

    const subs = [];
    for (let i = 0; i < 5; i++) {
        const r1 = Math.floor(seededRandom(seed + i + 100) * regionNames.first.length);
        const r2 = Math.floor(seededRandom(seed + i + 130) * regionNames.last.length);
        subs.push({
            name: `${regionNames.first[r1]} ${regionNames.last[r2]}`,
            number: Math.floor(seededRandom(seed + i + 160) * 70) + 24,
            pos: positions[(i + 1) % positions.length]
        });
    }

    const coachIndex = Math.floor(seededRandom(seed + 200) * regionNames.first.length);
    const coachLastIndex = Math.floor(seededRandom(seed + 230) * regionNames.last.length);
    const coach = `${regionNames.first[coachIndex]} ${regionNames.last[coachLastIndex]}`;

    return {
        formation: "4-3-3",
        coach,
        players,
        subs
    };
}

function generateGoals(match, homeRoster, awayRoster) {
    const isFinished = match.status === 'FINISHED';
    const isLive = LIVE_STATUSES.includes(match.status);
    
    if (!isFinished && !isLive) return { homeGoals: [], awayGoals: [] };
    
    const homeScore = match.score?.fullTime?.home ?? 0;
    const awayScore = match.score?.fullTime?.away ?? 0;
    
    let seed = match.id;
    const homeGoals = [];
    const awayGoals = [];
    
    const allMinutes = [];
    const totalGoals = homeScore + awayScore;
    
    while (allMinutes.length < totalGoals) {
        const min = Math.floor(seededRandom(seed++) * 90) + 1;
        if (!allMinutes.includes(min)) {
            allMinutes.push(min);
        }
    }
    allMinutes.sort((a, b) => a - b);
    
    let minIdx = 0;
    
    for (let i = 0; i < homeScore; i++) {
        const candidates = homeRoster.players.filter(p => p.pos !== 'GK');
        const scorerIdx = Math.floor(seededRandom(seed++) * candidates.length);
        const scorer = candidates[scorerIdx] || { name: 'Jugador', surname: 'Local' };
        
        homeGoals.push({
            scorer: scorer.name,
            surname: scorer.surname,
            minute: allMinutes[minIdx++] || 45
        });
    }
    
    for (let i = 0; i < awayScore; i++) {
        const candidates = awayRoster.players.filter(p => p.pos !== 'GK');
        const scorerIdx = Math.floor(seededRandom(seed++) * candidates.length);
        const scorer = candidates[scorerIdx] || { name: 'Jugador', surname: 'Visitante' };
        
        awayGoals.push({
            scorer: scorer.name,
            surname: scorer.surname,
            minute: allMinutes[minIdx++] || 45
        });
    }
    
    homeGoals.sort((a, b) => a.minute - b.minute);
    awayGoals.sort((a, b) => a.minute - b.minute);
    
    return { homeGoals, awayGoals };
}

function generateCommentary(match, homeRoster, awayRoster, homeGoals, awayGoals) {
    const isFinished = match.status === 'FINISHED';
    const isLive = LIVE_STATUSES.includes(match.status);
    const homeTeamName = match.homeTeam?.shortName || match.homeTeam?.name || 'Local';
    const awayTeamName = match.awayTeam?.shortName || match.awayTeam?.name || 'Visitante';
    
    if (!isFinished && !isLive) {
        return [
            { time: 'Pre-Match', type: 'info', text: 'Los equipos están listos para el partido inaugural en el estadio. El ambiente es espectacular.' },
            { time: 'Pre-Match', type: 'info', text: `Se espera un planteamiento táctico cerrado. El D.T. de ${homeTeamName} saldrá a buscar el control del balón.` },
            { time: 'Pre-Match', type: 'info', text: `Último análisis: El historial cara a cara muestra una gran paridad y emoción en sus partidos pasados.` },
            { time: 'Pre-Match', type: 'info', text: 'Los jugadores saltan al terreno de juego para realizar los calentamientos de rigor.' }
        ];
    }
    
    const timeline = [];
    let seed = match.id + 500;
    
    timeline.push({
        time: "1'",
        type: 'info',
        text: `¡Comienza el partido! Rueda el balón en el campo entre ${homeTeamName} y ${awayTeamName}.`
    });
    
    homeGoals.forEach(g => {
        timeline.push({
            time: `${g.minute}'`,
            type: 'goal',
            text: `⚽ ¡GOOOOOOL de ${homeTeamName}! ${g.scorer} define de manera impecable ante la salida del arquero.`
        });
    });
    
    awayGoals.forEach(g => {
        timeline.push({
            time: `${g.minute}'`,
            type: 'goal',
            text: `⚽ ¡GOOOOOOL de ${awayTeamName}! ${g.scorer} saca un derechazo potente que estremece las redes.`
        });
    });
    
    const totalYellows = Math.floor(seededRandom(seed++) * 4) + 1;
    for (let i = 0; i < totalYellows; i++) {
        const isHome = seededRandom(seed++) > 0.5;
        const roster = isHome ? homeRoster : awayRoster;
        const teamName = isHome ? homeTeamName : awayTeamName;
        const candidates = roster.players.filter(p => p.pos !== 'GK');
        const pIdx = Math.floor(seededRandom(seed++) * candidates.length);
        const player = candidates[pIdx] || { name: 'Jugador' };
        const min = Math.floor(seededRandom(seed++) * 88) + 2;
        
        timeline.push({
            time: `${min}'`,
            type: 'card-yellow',
            text: `🟨 Tarjeta Amarilla para ${player.name} de ${teamName} por una falta temeraria.`
        });
    }
    
    timeline.push({
        time: "45'",
        type: 'info',
        text: '⏸ Final del primer tiempo. Los equipos se retiran a los vestuarios.'
    });
    timeline.push({
        time: "46'",
        type: 'info',
        text: '⚽ Arranca la segunda mitad. Veremos si hay modificaciones tácticas.'
    });
    
    const totalSubs = Math.floor(seededRandom(seed++) * 3) + 1;
    for (let i = 0; i < totalSubs; i++) {
        const isHome = seededRandom(seed++) > 0.5;
        const roster = isHome ? homeRoster : awayRoster;
        const teamName = isHome ? homeTeamName : awayTeamName;
        
        const startingPlayers = roster.players.filter(p => p.pos !== 'GK');
        const pOutIdx = Math.floor(seededRandom(seed++) * startingPlayers.length);
        const pOut = startingPlayers[pOutIdx] || { name: 'Jugador' };
        
        const pInIdx = Math.floor(seededRandom(seed++) * roster.subs.length);
        const pIn = roster.subs[pInIdx] || { name: 'Jugador Suplente', number: 20 };
        
        const min = Math.floor(seededRandom(seed++) * 35) + 50;
        
        timeline.push({
            time: `${min}'`,
            type: 'info',
            text: `🔄 Cambio en ${teamName}: Entra ${pIn.name} (#${pIn.number}) sustituyendo a ${pOut.name}.`
        });
    }
    
    const missedMin = Math.floor(seededRandom(seed++) * 40) + 48;
    const missedTeam = seededRandom(seed++) > 0.5 ? homeTeamName : awayTeamName;
    timeline.push({
        time: `${missedMin}'`,
        type: 'info',
        text: `⚠️ ¡La tuvo! Remate peligroso de ${missedTeam} que pasa zumbando el poste izquierdo.`
    });
    
    timeline.sort((a, b) => {
        const getMin = (t) => {
            if (t.startsWith('Pre')) return -1;
            if (t === '45\'') return 45.1;
            if (t === '46\'') return 45.2;
            return parseInt(t.replace("'", ""));
        };
        return getMin(a.time) - getMin(b.time);
    });
    
    timeline.push({
        time: "90'",
        type: 'info',
        text: `🏁 ¡Final del partido! El árbitro decreta el final del encuentro. Marcador definitivo: ${homeTeamName} ${match.score?.fullTime?.home ?? 0} - ${match.score?.fullTime?.away ?? 0} ${awayTeamName}.`
    });
    
    return timeline;
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
        this.scorersData = null;

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

        // Intercept clicks on matches to show detail modal
        document.getElementById('matches-container').addEventListener('click', (e) => {
            const card = e.target.closest('.match-card');
            if (card && card.dataset.matchId) {
                this.openMatchDetail(parseInt(card.dataset.matchId));
            }
        });

        document.getElementById('knockout-container').addEventListener('click', (e) => {
            const card = e.target.closest('.knockout-match');
            if (card && card.dataset.matchId) {
                this.openMatchDetail(parseInt(card.dataset.matchId));
            }
        });

        document.getElementById('knockout-tree-container').addEventListener('click', (e) => {
            const card = e.target.closest('.bracket-match-card');
            if (card && card.dataset.matchId) {
                this.openMatchDetail(parseInt(card.dataset.matchId));
            }
        });

        // Modal close buttons
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            this.closeMatchDetail();
        });
        document.getElementById('match-modal').addEventListener('click', (e) => {
            if (e.target.id === 'match-modal') {
                this.closeMatchDetail();
            }
        });

        // Modal tab buttons
        document.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchModalTab(btn.dataset.modalTab);
            });
        });

        // ESC key to close modal
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMatchDetail();
            }
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
            this.loadScorers(),
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
                    ['SCHEDULED', 'TIMED', ...LIVE_STATUSES].includes(m.status)
                );
                // Sort by date ascending
                filtered.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
                break;
            case 'LIVE':
                filtered = filtered.filter(m =>
                    LIVE_STATUSES.includes(m.status)
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
        const isLive = LIVE_STATUSES.includes(match.status);
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
            <div class="match-card ${isLive ? 'live' : ''}" data-match-id="${match.id}" style="animation-delay: ${index * 60}ms">
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
            this.renderKnockoutTree();
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
        const groupStandings = this.standingsData.filter(s => s.type === 'TOTAL' && (s.stage === 'GROUP_STAGE' || s.stage === 'ALL' || s.group));

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
        const groupName = group.group ? group.group.replace('GROUP_', '').replace('Group ', '') : '?';

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
            <div class="knockout-match" data-match-id="${match.id}" style="animation-delay: ${index * 60}ms">
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

    renderKnockoutTree() {
        const container = document.getElementById('knockout-tree-container');
        if (!this.matchesData) {
            container.innerHTML = this.renderEmpty(
                '🌳',
                'Árbol no disponible',
                'Los datos aparecerán cuando se definan los cruces'
            );
            return;
        }

        const knockoutMatches = this.matchesData.filter(m => m.stage !== 'GROUP_STAGE');

        if (knockoutMatches.length === 0) {
            container.innerHTML = this.renderEmpty(
                '🌳',
                'Árbol aún no definido',
                'Los cruces se generarán al completarse la fase de grupos'
            );
            return;
        }

        const stageMap = new Map();
        knockoutMatches.forEach(match => {
            const stage = match.stage;
            if (!stageMap.has(stage)) {
                stageMap.set(stage, []);
            }
            stageMap.get(stage).push(match);
        });

        const order = ['ROUND_OF_32', 'LAST_32', 'ROUND_OF_16', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
        
        const sortedStages = [...stageMap.entries()]
            .filter(([stage]) => order.includes(stage))
            .sort((a, b) => getStageOrder(a[0]) - getStageOrder(b[0]));

        if (sortedStages.length === 0) {
            container.innerHTML = this.renderEmpty(
                '🌳',
                'Árbol aún no definido',
                'Los cruces se generarán al completarse la fase de grupos'
            );
            return;
        }

        let html = '<div class="bracket-wrapper">';

        sortedStages.forEach(([stage, matches]) => {
            matches.sort((a, b) => a.id - b.id);

            html += `
                <div class="bracket-column" data-stage="${stage}">
                    <h3 class="bracket-stage-title">${getStageName(stage)}</h3>
                    <div class="bracket-matches">
                        ${matches.map(match => this.renderBracketMatch(match)).join('')}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderBracketMatch(match) {
        const homeScore = match.score?.fullTime?.home;
        const awayScore = match.score?.fullTime?.away;
        const hasScore = homeScore !== null && homeScore !== undefined;
        const isFinished = match.status === 'FINISHED';

        const homeWinner = isFinished && hasScore && homeScore > awayScore;
        const awayWinner = isFinished && hasScore && awayScore > homeScore;

        const penHome = match.score?.penalties?.home;
        const penAway = match.score?.penalties?.away;
        const hasPenalties = penHome !== null && penHome !== undefined;

        const homePenWinner = hasPenalties && penHome > penAway;
        const awayPenWinner = hasPenalties && penAway > penHome;

        const finalHomeWinner = homeWinner || homePenWinner;
        const finalAwayWinner = awayWinner || awayPenWinner;

        const homeCrest = match.homeTeam?.crest
            ? `<img class="tree-crest" src="${match.homeTeam.crest}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : '';
        const awayCrest = match.awayTeam?.crest
            ? `<img class="tree-crest" src="${match.awayTeam.crest}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : '';

        const homeScoreDisplay = hasScore ? homeScore : '';
        const awayScoreDisplay = hasScore ? awayScore : '';

        const penaltyInfo = hasPenalties
            ? `<div class="tree-penalties">Pen: ${penHome} - ${penAway}</div>`
            : '';

        return `
            <div class="bracket-match-wrapper">
                <div class="bracket-match-card" data-match-id="${match.id}">
                    <div class="tree-team ${finalHomeWinner ? 'winner' : ''}">
                        <div class="tree-team-info">
                            ${homeCrest}
                            <span class="tree-team-name">${match.homeTeam?.shortName || match.homeTeam?.tla || match.homeTeam?.name || 'TBD'}</span>
                        </div>
                        <span class="tree-team-score">${homeScoreDisplay}</span>
                    </div>
                    <div class="tree-team ${finalAwayWinner ? 'winner' : ''}">
                        <div class="tree-team-info">
                            ${awayCrest}
                            <span class="tree-team-name">${match.awayTeam?.shortName || match.awayTeam?.tla || match.awayTeam?.name || 'TBD'}</span>
                        </div>
                        <span class="tree-team-score">${awayScoreDisplay}</span>
                    </div>
                    ${penaltyInfo}
                </div>
            </div>
        `;
    }

    // ===== SCORERS =====
    async loadScorers() {
        try {
            const data = await this.api.getScorers({ limit: 150 });
            this.scorersData = data.scorers || [];
            this.renderScorers();
        } catch (error) {
            console.error('Error loading scorers:', error);
            document.getElementById('scorers-container').innerHTML = this.renderError(
                'No se pudieron cargar los goleadores',
                error.message
            );
        }
    }

    renderScorers() {
        const container = document.getElementById('scorers-container');
        if (!this.scorersData || this.scorersData.length === 0) {
            container.innerHTML = this.renderEmpty(
                '👟',
                'Datos no disponibles',
                'Aún no hay goles registrados en el torneo'
            );
            return;
        }

        container.innerHTML = this.scorersData.map((scorer, i) => this.renderScorerCard(scorer, i)).join('');
    }

    renderScorerCard(scorerInfo, index) {
        const player = scorerInfo.player;
        const team = scorerInfo.team;
        const goals = scorerInfo.goals;
        const assists = scorerInfo.assists || 0;

        const crest = team?.crest
            ? `<img class="scorer-team-crest" src="${team.crest}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : '';

        return `
            <div class="scorer-card" style="animation-delay: ${index * 60}ms">
                <div class="scorer-rank">${index + 1}</div>
                <div class="scorer-info">
                    <div class="scorer-name">${player?.name || 'Desconocido'}</div>
                    <div class="scorer-team">
                        ${crest}
                        <span>${team?.shortName || team?.name || '—'}</span>
                    </div>
                </div>
                <div class="scorer-stats">
                    <div class="scorer-goals">
                        <span class="stat-value">${goals}</span>
                        <span class="stat-label">Goles</span>
                    </div>
                    <div class="scorer-assists">
                        <span class="stat-value" style="color: var(--text-muted);">${assists}</span>
                        <span class="stat-label">Asistencias</span>
                    </div>
                </div>
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

    async openMatchDetail(matchId) {
        const modal = document.getElementById('match-modal');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        this.switchModalTab('info');

        document.getElementById('h2h-loader').classList.remove('hidden');
        document.getElementById('h2h-content').style.opacity = '0.3';

        const match = this.matchesData ? this.matchesData.find(m => m.id === matchId) : null;
        if (!match) {
            console.error('Partido no encontrado localmente');
            return;
        }

        this.renderMatchHeader(match);

        let h2hData = null;
        try {
            h2hData = await this.api.getMatchHeadToHead(matchId);
        } catch (error) {
            console.error('Error cargando estadísticas H2H:', error);
        }

        this.renderMatchDetail(match, h2hData);
    }

    closeMatchDetail() {
        const modal = document.getElementById('match-modal');
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    switchModalTab(tab) {
        document.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.modalTab === tab);
        });
        document.querySelectorAll('.modal-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `modal-panel-${tab}`);
        });
    }

    renderMatchHeader(match) {
        const homeScore = match.score?.fullTime?.home;
        const awayScore = match.score?.fullTime?.away;
        const hasScore = homeScore !== null && homeScore !== undefined;

        document.getElementById('modal-match-stage').textContent = 
            match.stage === 'GROUP_STAGE' && match.group
                ? `Grupo ${match.group.replace('GROUP_', '')}`
                : getStageName(match.stage);

        document.getElementById('modal-match-group').textContent = 
            match.stage === 'GROUP_STAGE' ? 'Fase de Grupos' : 'Fase de Eliminatoria';

        const homeCrest = match.homeTeam?.crest
            ? `<img class="team-crest" src="${match.homeTeam.crest}" alt="" onerror="this.outerHTML='<div class=\\'team-crest-placeholder\\'>🏳️</div>'">`
            : `<div class="team-crest-placeholder">🏳️</div>`;
        const awayCrest = match.awayTeam?.crest
            ? `<img class="team-crest" src="${match.awayTeam.crest}" alt="" onerror="this.outerHTML='<div class=\\'team-crest-placeholder\\'>🏳️</div>'">`
            : `<div class="team-crest-placeholder">🏳️</div>`;

        document.getElementById('modal-home-crest-container').innerHTML = homeCrest;
        document.getElementById('modal-away-crest-container').innerHTML = awayCrest;

        document.getElementById('modal-home-name').textContent = match.homeTeam?.shortName || match.homeTeam?.name || 'TBD';
        document.getElementById('modal-away-name').textContent = match.awayTeam?.shortName || match.awayTeam?.name || 'TBD';

        document.getElementById('modal-home-score').textContent = hasScore ? homeScore : '—';
        document.getElementById('modal-away-score').textContent = hasScore ? awayScore : '—';

        const statusBadge = document.getElementById('modal-match-status');
        statusBadge.textContent = getStatusLabel(match.status);
        statusBadge.className = `modal-status-badge ${getStatusClass(match.status)}`;

        document.getElementById('modal-match-date').textContent = `📅 ${formatDateTime(match.utcDate)}`;
        document.getElementById('modal-match-venue').textContent = match.venue ? `📍 ${match.venue}` : '📍 Por definir';
    }

    renderMatchDetail(match, h2h) {
        const referee = match.referees && match.referees.length > 0
            ? match.referees.map(r => `${r.name} (${r.nationality || '—'})`).join(', ')
            : 'Por designar';

        document.getElementById('modal-referee').textContent = referee;
        document.getElementById('modal-competition').textContent = match.competition?.name || 'FIFA World Cup';
        document.getElementById('modal-season').textContent = match.season 
            ? `${new Date(match.season.startDate).getFullYear()} (EE.UU. / México / Canadá)` 
            : '2026';

        const loader = document.getElementById('h2h-loader');
        const content = document.getElementById('h2h-content');
        
        loader.classList.add('hidden');
        content.style.opacity = '1';

        if (h2h && h2h.aggregates) {
            const aggr = h2h.aggregates;
            document.getElementById('h2h-total-matches').textContent = aggr.numberOfMatches || '0';
            document.getElementById('h2h-total-goals').textContent = aggr.totalGoals || '0';

            const homeWins = aggr.homeTeam?.wins || 0;
            const awayWins = aggr.awayTeam?.wins || 0;
            const totalMatches = aggr.numberOfMatches || 1;
            const draws = Math.max(0, totalMatches - homeWins - awayWins);

            document.getElementById('h2h-home-wins-val').textContent = `${homeWins} Victorias`;
            document.getElementById('h2h-draws-val').textContent = `${draws} Empates`;
            document.getElementById('h2h-away-wins-val').textContent = `${awayWins} Victorias`;

            document.getElementById('h2h-home-team-lbl').textContent = match.homeTeam?.shortName || 'Local';
            document.getElementById('h2h-away-team-lbl').textContent = match.awayTeam?.shortName || 'Visitante';

            const homePct = (homeWins / totalMatches) * 100;
            const drawPct = (draws / totalMatches) * 100;
            const awayPct = (awayWins / totalMatches) * 100;

            document.getElementById('h2h-home-win-bar').style.width = `${homePct}%`;
            document.getElementById('h2h-draw-bar').style.width = `${drawPct}%`;
            document.getElementById('h2h-away-win-bar').style.width = `${awayPct}%`;
        } else {
            document.getElementById('h2h-total-matches').textContent = '—';
            document.getElementById('h2h-total-goals').textContent = '—';
            document.getElementById('h2h-home-wins-val').textContent = '—';
            document.getElementById('h2h-draws-val').textContent = '—';
            document.getElementById('h2h-away-wins-val').textContent = '—';

            document.getElementById('h2h-home-win-bar').style.width = `33%`;
            document.getElementById('h2h-draw-bar').style.width = `34%`;
            document.getElementById('h2h-away-win-bar').style.width = `33%`;
        }

        const homeRoster = generateRoster(match.homeTeam?.name || 'Local', true, match.id);
        const awayRoster = generateRoster(match.awayTeam?.name || 'Visitante', false, match.id);

        this.renderDetailLineups(match, homeRoster, awayRoster);

        const { homeGoals, awayGoals } = generateGoals(match, homeRoster, awayRoster);
        this.renderDetailTimeline(match, homeRoster, awayRoster, homeGoals, awayGoals);
    }

    renderDetailLineups(match, homeRoster, awayRoster) {
        document.getElementById('lineup-home-title').textContent = match.homeTeam?.shortName || match.homeTeam?.name || 'Local';
        document.getElementById('lineup-away-title').textContent = match.awayTeam?.shortName || match.awayTeam?.name || 'Visitante';

        document.getElementById('lineup-home-formation').textContent = homeRoster.formation || '4-3-3';
        document.getElementById('lineup-away-formation').textContent = awayRoster.formation || '4-3-3';

        document.getElementById('lineup-home-coach').textContent = homeRoster.coach || '—';
        document.getElementById('lineup-away-coach').textContent = awayRoster.coach || '—';

        const formatPlayerLi = (p) => `
            <li>
                <div>
                    <span class="player-number">${p.number}</span>
                    <span class="player-fullname">${p.name}</span>
                </div>
                <span class="player-position">${p.pos}</span>
            </li>
        `;

        document.getElementById('lineup-home-players').innerHTML = 
            homeRoster.players.map(formatPlayerLi).join('');
        document.getElementById('lineup-away-players').innerHTML = 
            awayRoster.players.map(formatPlayerLi).join('');

        const pitchHome = document.getElementById('pitch-players-home');
        const pitchAway = document.getElementById('pitch-players-away');
        pitchHome.innerHTML = '';
        pitchAway.innerHTML = '';

        homeRoster.players.forEach((p, index) => {
            const coord = PITCH_POSITIONS.home[index] || { x: 50, y: 50 };
            const node = document.createElement('div');
            node.className = 'pitch-player';
            node.style.left = `${coord.x}%`;
            node.style.top = `${coord.y}%`;
            node.innerHTML = `
                <div class="player-jersey">${p.number}</div>
                <div class="player-surname">${p.surname || p.name.split(' ').pop()}</div>
            `;
            pitchHome.appendChild(node);
        });

        awayRoster.players.forEach((p, index) => {
            const coord = PITCH_POSITIONS.away[index] || { x: 50, y: 50 };
            const node = document.createElement('div');
            node.className = 'pitch-player';
            node.style.left = `${coord.x}%`;
            node.style.top = `${coord.y}%`;
            node.innerHTML = `
                <div class="player-jersey away-jersey">${p.number}</div>
                <div class="player-surname">${p.surname || p.name.split(' ').pop()}</div>
            `;
            pitchAway.appendChild(node);
        });
    }

    renderDetailTimeline(match, homeRoster, awayRoster, homeGoals, awayGoals) {
        const homeList = document.getElementById('modal-home-goals-list');
        const awayList = document.getElementById('modal-away-goals-list');

        homeList.innerHTML = homeGoals.map(g => `
            <div class="goal-event-item">⚽ <span>${g.surname} (${g.minute}')</span></div>
        `).join('');

        awayList.innerHTML = awayGoals.map(g => `
            <div class="goal-event-item">⚽ <span>${g.surname} (${g.minute}')</span></div>
        `).join('');

        const timelineContainer = document.getElementById('match-commentary-timeline');
        const comments = generateCommentary(match, homeRoster, awayRoster, homeGoals, awayGoals);

        timelineContainer.innerHTML = comments.map(c => {
            let badgeClass = 'info';
            if (c.type === 'goal') badgeClass = 'goal';
            else if (c.type === 'card-yellow') badgeClass = 'card-yellow';
            else if (c.type === 'card-red') badgeClass = 'card-red';

            const timeStr = c.time !== 'Pre-Match' ? `<span class="timeline-time">${c.time}</span>` : '';

            return `
                <div class="timeline-item">
                    <div class="timeline-badge ${badgeClass}"></div>
                    <div class="timeline-text">
                        ${timeStr}
                        <span>${c.text}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    new WorldCupApp();
});
