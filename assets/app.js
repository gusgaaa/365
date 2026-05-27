const cfg = window.COPA365_CONFIG || {};
const DATA_URLS = {
  jogadores: cfg.jogadoresCsv || 'dados/jogadores.csv',
  partidas: cfg.partidasCsv || 'dados/partidas.csv'
};
const $ = (selector) => document.querySelector(selector);

$('#menuButton')?.addEventListener('click', () => $('#navMenu')?.classList.toggle('open'));
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => $('#navMenu')?.classList.remove('open')));

async function loadCSV(url){
  const response = await fetch(url, { cache: 'no-store' });
  if(!response.ok) throw new Error(`Não foi possível carregar: ${url}`);
  return response.text();
}

function parseCSV(text){
  const rows = [];
  let row = [], cell = '', insideQuotes = false;
  for(let i = 0; i < text.length; i++){
    const char = text[i];
    const next = text[i + 1];
    if(char === '"' && insideQuotes && next === '"'){
      cell += '"'; i++;
    } else if(char === '"'){
      insideQuotes = !insideQuotes;
    } else if(char === ',' && !insideQuotes){
      row.push(cell.trim()); cell = '';
    } else if((char === '\n' || char === '\r') && !insideQuotes){
      if(cell || row.length){ row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
      if(char === '\r' && next === '\n') i++;
    } else {
      cell += char;
    }
  }
  if(cell || row.length){ row.push(cell.trim()); rows.push(row); }
  const headers = rows.shift()?.map(h => h.trim()) || [];
  return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

function toNumber(value){
  const number = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}
function initials(text){
  return String(text || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function normalizeCountry(value){
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
}
const FLAG_CODE_BY_COUNTRY = {
  'brasil':'br',
  'suecia':'se',
  'croacia':'hr',
  'escocia':'gb-sct',
  'pais de gales':'gb-wls',
  'polonia':'pl',
  'argentina':'ar',
  'franca':'fr',
  'portugal':'pt',
  'espanha':'es',
  'alemanha':'de',
  'italia':'it',
  'inglaterra':'gb-eng',
  'holanda':'nl',
  'paises baixos':'nl',
  'belgica':'be',
  'uruguai':'uy',
  'colombia':'co',
  'chile':'cl',
  'mexico':'mx',
  'estados unidos':'us',
  'eua':'us',
  'japao':'jp',
  'coreia do sul':'kr',
  'marrocos':'ma',
  'senegal':'sn',
  'gana':'gh',
  'costa do marfim':'ci',
  'camaroes':'cm',
  'nigeria':'ng',
  'egito':'eg',
  'turquia':'tr',
  'dinamarca':'dk',
  'noruega':'no',
  'suica':'ch',
  'austria':'at',
  'servia':'rs',
  'ucrania':'ua',
  'russia':'ru',
  'canada':'ca',
  'australia':'au',
  'arabia saudita':'sa',
  'qatar':'qa',
  'iran':'ir',
  'equador':'ec',
  'peru':'pe',
  'paraguai':'py',
  'bolivia':'bo',
  'venezuela':'ve',
  'costa rica':'cr'
};
function flagCode(country){
  return FLAG_CODE_BY_COUNTRY[normalizeCountry(country)] || '';
}
function flagCircle(country, extraClass = ''){
  const safe = String(country || 'Sem seleção').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const code = flagCode(country);
  if(!code){
    return `<span class="flag-circle flag-fallback ${extraClass}" title="${safe}" aria-label="${safe}">${initials(country)}</span>`;
  }
  return `<span class="flag-circle ${extraClass}" title="${safe}" aria-label="${safe}"><img src="https://flagcdn.com/w80/${code}.png" alt="${safe}" loading="lazy" referrerpolicy="no-referrer"></span>`;
}

function isFinished(match){
  const status = String(match.Status || '').toLowerCase();
  return status.includes('final') && toNumber(match['Gols 1']) !== null && toNumber(match['Gols 2']) !== null;
}
function playerByName(players, name){ return players.find(p => p.Jogador === name) || {}; }

function calculateStandings(players, matches){
  const table = new Map();
  players.forEach(p => table.set(p.Jogador, { jogador:p.Jogador, selecao:p['Seleção'] || '', grupo:p.Grupo || '', J:0,V:0,E:0,D:0,GP:0,GC:0,SG:0,PTS:0 }));
  matches.filter(isFinished).forEach(m => {
    const a = table.get(m['Jogador 1']);
    const b = table.get(m['Jogador 2']);
    if(!a || !b) return;
    const ga = toNumber(m['Gols 1']);
    const gb = toNumber(m['Gols 2']);
    a.J++; b.J++;
    a.GP += ga; a.GC += gb;
    b.GP += gb; b.GC += ga;
    if(ga > gb){ a.V++; a.PTS += 3; b.D++; }
    else if(gb > ga){ b.V++; b.PTS += 3; a.D++; }
    else { a.E++; b.E++; a.PTS++; b.PTS++; }
  });
  return [...table.values()].map(r => ({...r, SG:r.GP-r.GC})).sort((a,b) =>
    b.PTS - a.PTS || b.V - a.V || b.SG - a.SG || b.GP - a.GP || a.jogador.localeCompare(b.jogador)
  );
}

function renderStandings(rows){
  $('#standingsBody').innerHTML = rows.map((r, i) => `
    <tr>
      <td class="position">${i + 1}</td>
      <td>${r.jogador}</td>
      <td>${flagCircle(r.selecao, 'table-flag')}<span class="selection-name">${r.selecao}</span></td>
      <td>${r.J}</td><td>${r.V}</td><td>${r.E}</td><td>${r.D}</td>
      <td>${r.GP}</td><td>${r.GC}</td><td>${r.SG}</td><td>${r.PTS}</td>
    </tr>
  `).join('');
}

function renderPlayers(players){
  $('#playersGrid').innerHTML = players.map(player => `
    <div class="player">
      ${flagCircle(player['Seleção'])}
      <div><strong>${player.Jogador}</strong><span>${player['Seleção'] || 'Sem seleção'} • Grupo ${player.Grupo || '-'}</span></div>
    </div>
  `).join('');
}

function renderNextMatch(players, matches){
  const next = matches.find(m => !isFinished(m));
  if(!next){
    $('#nextTitle').textContent = 'Sem jogos pendentes';
    $('#nextInfo').textContent = 'Todos os confrontos cadastrados já foram finalizados.';
    $('#nextMatchBox').innerHTML = '<p class="muted">Cadastre novos jogos no CSV ou no Google Sheets.</p>';
    return;
  }
  const p1 = playerByName(players, next['Jogador 1']);
  const p2 = playerByName(players, next['Jogador 2']);
  $('#nextTitle').textContent = `${next.Fase || 'Rodada'} • Jogo ${next.Rodada || '-'}`;
  $('#nextInfo').textContent = `${next.Data || 'Data a definir'}${next.Fase ? ' • ' + next.Fase : ''}`;
  $('#nextMatchBox').innerHTML = `
    <div class="team">${flagCircle(p1['Seleção'], 'team-flag')}<div class="team-name">${next['Jogador 1']}</div><p class="muted">${p1['Seleção'] || ''}</p></div>
    <div class="versus-mark">×</div>
    <div class="team">${flagCircle(p2['Seleção'], 'team-flag')}<div class="team-name">${next['Jogador 2']}</div><p class="muted">${p2['Seleção'] || ''}</p></div>
  `;
}

function renderLatestResult(players, matches){
  const finished = matches.filter(isFinished).at(-1);
  if(!finished){
    $('#latestResultBox').innerHTML = '<p class="muted">Nenhum resultado finalizado ainda.</p>';
    return;
  }
  const p1 = playerByName(players, finished['Jogador 1']);
  const p2 = playerByName(players, finished['Jogador 2']);
  $('#latestResultBox').innerHTML = `
    <div class="score-line">
      ${flagCircle(p1['Seleção'])}
      <strong>${finished['Gols 1']} - ${finished['Gols 2']}</strong>
      ${flagCircle(p2['Seleção'])}
    </div>
    <div class="result-names"><span>${finished['Jogador 1']} • ${p1['Seleção'] || ''}</span><span>${finished['Jogador 2']} • ${p2['Seleção'] || ''}</span></div>
  `;
}

function renderFixtures(players, matches){
  $('#fixturesList').innerHTML = matches.map(m => {
    const p1 = playerByName(players, m['Jogador 1']);
    const p2 = playerByName(players, m['Jogador 2']);
    const middle = isFinished(m) ? `${m['Gols 1']}×${m['Gols 2']}` : '×';
    return `
      <div class="match-row">
        <div class="match-date">${m.Data || 'A definir'}</div>
        <div class="match-team match-team-left">${flagCircle(p1['Seleção'])}<span>${m['Jogador 1']} <small>(${p1['Seleção'] || '-'})</small></span></div>
        <div class="score-mini">${middle}</div>
        <div class="match-team match-team-right">${flagCircle(p2['Seleção'])}<span>${m['Jogador 2']} <small>(${p2['Seleção'] || '-'})</small></span></div>
        <div class="match-status">${m.Status || 'Pendente'} • ${m.Fase || 'Rodada'} ${m.Rodada || ''}</div>
      </div>
    `;
  }).join('');
}

async function init(){
  try{
    const [playersCSV, matchesCSV] = await Promise.all([loadCSV(DATA_URLS.jogadores), loadCSV(DATA_URLS.partidas)]);
    const players = parseCSV(playersCSV);
    const matches = parseCSV(matchesCSV);
    const standings = calculateStandings(players, matches);
    renderStandings(standings);
    renderPlayers(players);
    renderNextMatch(players, matches);
    renderLatestResult(players, matches);
    renderFixtures(players, matches);
    $('#updatedLabel').textContent = cfg.jogadoresCsv || cfg.partidasCsv ? 'Google Sheets' : 'CSV local';
  } catch(error){
    console.error(error);
    document.body.insertAdjacentHTML('afterbegin', `<div style="padding:14px 20px;background:#fff3d7;color:#6b4a00;border-bottom:1px solid #e2c983;font-family:Inter,sans-serif">Não consegui carregar os dados. Confira os links CSV no arquivo <strong>assets/config.js</strong> ou abra o site por um servidor local.</div>`);
  }
}
init();
