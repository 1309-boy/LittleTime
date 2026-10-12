import { Game, parseSave, dateText, timeText, dayNumber, minuteOfDay, moneyText } from './engine.js';
import { CONFIG, STREETS, PLACES, SCENES, ACTIONS, NPCS, ITEMS, STAT_NAMES, NEED_NAMES } from './world.js';
import { streetArt, hourglass, stationArt } from './art.js';
import { SaveSlots } from './save-slots.js';

const AUTO_KEY = 'LittleTime.autosave.v1';
const SETTINGS_KEY = 'LittleTime.settings';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = document.querySelector('#app');
const panel = document.querySelector('#panel');
const toast = document.querySelector('#toast');
let game = new Game();
let activePanel = null;
let mapMode = 'walk';
let toastTimer;
let settings = { fontSize: 17, motion: true };
let storageAvailable = true;
let startupMessage = '';
const slots = new SaveSlots(() => window.localStorage);
let pendingSlot = null;
try {
  const raw = localStorage.getItem(AUTO_KEY);
  if (raw) { game = new Game(parseSave(raw)); startupMessage = '마지막으로 머물던 곳에서 이어서 시작해.'; }
  const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if ([15, 17, 19, 21].includes(stored.fontSize)) settings.fontSize = stored.fontSize;
  if (typeof stored.motion === 'boolean') settings.motion = stored.motion;
} catch {
  startupMessage = '자동 저장을 읽지 못했어. 파일 불러오기나 새 시작을 선택할 수 있어.';
}

function notify(message) {
  const panelNotice = panel.querySelector('.panel-notice');
  if (panel.open && panelNotice) panelNotice.textContent = message;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}
function persist() {
  try { localStorage.setItem(AUTO_KEY, game.exportSave()); }
  catch { if (storageAvailable) notify('브라우저에 저장할 수 없어. 저장 파일을 내려받아 줘.'); storageAvailable = false; }
}
function act(operation, { close = false, preserveFocus = false } = {}) {
  try {
    const focusId = preserveFocus ? document.activeElement?.id : null;
    operation(); persist();
    if (close) closePanel();
    render();
    if (activePanel) renderPanel();
    if (focusId) document.getElementById(focusId)?.focus();
  } catch (error) { notify(error.message || '진행할 수 없어.'); }
}
function btn(label, attrs, disabled = false, className = '') {
  return `<button type="button" ${attrs} ${disabled ? 'disabled' : ''} class="${className}">${label}</button>`;
}
function needBar(id) {
  const value = Math.round(game.state.needs[id]);
  return `<div class="need"><div class="need-label"><span>${NEED_NAMES[id]}</span><span>${value}<small>/100</small></span></div><div class="meter ${value >= 80 ? 'high' : ''}" role="meter" aria-label="${NEED_NAMES[id]}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><i style="width:${value}%"></i></div></div>`;
}
function rentSummary() {
  const r = game.state.rent;
  if (r.housing === 'shelter') return `<span class="rent-status">임시 숙소 생활 중</span><strong>${moneyText(game.rentTotal())}</strong><small>밀린 월세를 갚으면 방으로 돌아갈 수 있어</small>`;
  if (r.debt) return `<span class="rent-status">${r.weeksMissed}주 연체${r.evictionAt ? ' · 퇴거 예고' : ''}</span><strong>${moneyText(game.rentTotal())}</strong><small>${r.evictionAt ? `${dateText(r.evictionAt)} ${timeText(r.evictionAt)}까지` : '집주인 사무실에서 납부할 수 있어'}</small>`;
  const remaining = Math.ceil((r.nextDue - game.state.clock) / 1440);
  return `<span>이번 주 월세 <em>D−${remaining}</em></span><strong>${moneyText(CONFIG.weeklyRent)}</strong><small>매주 일요일 21:00 · 자동 납부</small>`;
}
function render() {
  const s = game.state;
  const street = STREETS[s.street];
  const place = s.place ? PLACES[s.place] : null;
  const scene = s.scene ? SCENES[s.scene.id] : null;
  const name = s.rent.housing === 'shelter' && s.place === 'room' ? '임시 숙소' : place?.name || street.name;
  document.documentElement.style.setProperty('--text-size', `${settings.fontSize}px`);
  document.documentElement.classList.toggle('no-motion', !settings.motion);
  app.innerHTML = `<div class="game-shell">
    <aside class="sidebar" aria-label="플레이어 정보와 메뉴">
      <a class="brand" href="./" aria-label="LittleTime">${hourglass}<span>Little<span class="brand-time">Time</span><small>작은 시간들</small></span></a>
      <div class="sidebar-rule"></div>
      <div class="date-block"><p class="eyebrow">DAY ${String(dayNumber(s.clock) + 1).padStart(2, '0')}</p><div class="clock">${timeText(s.clock)}<span>${minuteOfDay(s.clock) < 6 * 60 || minuteOfDay(s.clock) >= 20 * 60 ? '밤' : minuteOfDay(s.clock) >= 17 * 60 ? '저녁' : minuteOfDay(s.clock) >= 12 * 60 ? '오후' : '아침'}</span></div><p>${dateText(s.clock)}</p></div>
      <div class="wallet"><span>소지금</span><strong>${moneyText(s.money)}</strong></div>
      <div class="needs">${Object.keys(NEED_NAMES).map(needBar).join('')}<p class="needs-note">지칠 때는 쉬고, 출출할 때는 한 끼.</p></div>
      <nav class="side-nav" aria-label="게임 메뉴">
        ${[['map','◇','마을 지도','M'],['status','▤','상태창',''],['inventory','□','인벤토리','I'],['relations','♧','인물 관계',''],['journal','≡','하루 기록',''],['save','↓','세이브 / 로드','S'],['settings','⚙','설정','']].map(([id,icon,label,key]) => btn(`<span class="menu-icon" aria-hidden="true">${icon}</span><span>${label}</span>${key ? `<kbd>${key}</kbd>` : ''}`, `data-panel="${id}"`, false, id === 'map' ? 'nav-map' : '')).join('')}
      </nav>
      <div class="rent-card">${rentSummary()}</div>
      <div class="side-footer"><span>LittleTime</span><span>v0.1 · 첫 번째 하루</span></div>
    </aside>
    <main id="game-main" class="main" tabindex="-1">
      <header class="location-header"><div class="breadcrumb">마을 <span>/</span> ${street.name}${place ? `<span>/</span> ${name}` : ''}</div><div class="location-dot">${s.rent.housing === 'shelter' ? '임시 숙소' : '자취 생활'}</div></header>
      <div class="main-content">
        <section class="scene-heading"><p class="eyebrow">${scene ? escape(scene.kicker || '이야기') : '지금 머무는 곳'}</p><div class="heading-line"><h1>${scene ? escape(scene.title) : name}</h1>${!scene ? streetArt(street.art, 'heading-art') : ''}</div><p class="scene-subtitle">${scene ? '오늘의 선택이 내일의 이야기가 된다.' : street.caption}</p></section>
        <section class="narrative" aria-label="현재 장면">
          ${(scene?.text || (s.rent.housing === 'shelter' && s.place === 'room' ? ['잠시 머물 수 있는 작은 숙소다. 잠을 편하게 자기는 어렵지만, 다시 시작할 수 있다.'] : place?.description || (minuteOfDay(s.clock) >= 20 * 60 ? street.night : street.description))).map(p => `<p>${escape(p)}</p>`).join('')}
          ${scene?.illustration === 'station' ? stationArt() : ''}
          ${scene?.image ? `<figure class="sprite"><img src="${escape(scene.image.src)}" alt="${escape(scene.image.alt || '')}"></figure>` : ''}
        </section>
        ${s.report && !scene ? `<section class="result" aria-label="최근 행동의 결과"><div class="result-meta"><span>방금의 기록</span><time>${timeText(s.report.clock)}</time></div><p>${escape(s.report.text)}</p><div class="change-list">${s.report.changes.map(change => `<span>${escape(change)}</span>`).join('')}<span>${s.report.elapsed}분 경과</span></div></section>` : ''}
        ${renderWarnings()}
        <section class="choices-area"><div class="section-label"><span>${scene ? (scene.mode === 'radio' ? '오늘의 역할을 선택해 줘' : '어떻게 할까?') : place ? '여기서 할 수 있는 일' : '어디로 갈까?'}</span><span>${scene?.mode === 'radio' ? '선택 후 다음' : '숫자키로 선택'}</span></div>${scene ? sceneChoices(scene) : place ? placeChoices(place) : streetChoices(street)}</section>
        ${!scene ? quickMap() : `<div class="first-day-note"><span aria-hidden="true">✧</span><p>혼자만의 하루는 아니야.<br>이 마을에서 여러 사람의 이야기를 만나게 될 거야.</p></div>`}
        <footer class="main-footer"><span>작은 시간들이 모여, 하루가 된다.</span><span>${storageAvailable ? '진행 자동 저장' : '파일 저장 권장'}</span></footer>
      </div>
    </main>
  </div>`;
}
function renderWarnings() {
  const s = game.state;
  const messages = [];
  if (s.needs.fatigue >= 85) messages.push('많이 지쳤어. 집에서 자거나 잠깐 쉬는 게 좋겠다.');
  if (s.needs.hunger >= 80) messages.push('배가 많이 고파. 인벤토리의 음식이나 식사를 챙겨 보자.');
  if (s.needs.stress >= 80) messages.push('스트레스가 높아. 휴식이나 대화로 숨을 돌리자.');
  if (s.rent.evictionAt) messages.push('퇴거 예고를 받았어. 하루 기록에서 납부 기한을 확인해 줘.');
  return messages.length ? `<div class="warning">${messages.map(m => `<p>${m}</p>`).join('')}</div>` : '';
}
function numbered(label, detail, attrs, disabled, reason, index) {
  return btn(`<span class="choice-number">(${index})</span><span class="choice-copy"><span>${escape(label)}</span>${reason ? `<small>${escape(reason)}</small>` : detail ? `<small>${escape(detail)}</small>` : ''}</span><span class="choice-arrow" aria-hidden="true">↗</span>`, attrs, disabled, 'choice');
}
function sceneChoices(scene) {
  if (scene.mode === 'radio') {
    return `<fieldset class="radio-choices"><legend class="sr-only">${escape(scene.title)}</legend>${scene.choices.map((c,i) => {
      const reason = game.choiceAvailability(i);
      return `<label class="radio-choice ${game.state.scene.selected === i ? 'selected' : ''} ${reason ? 'unavailable' : ''}"><input id="choice-${i}" type="radio" name="scene-choice" value="${i}" ${game.state.scene.selected === i ? 'checked' : ''} ${reason ? 'disabled' : ''}><span>${escape(c.label)}<small>${escape(reason || `${c.duration}분 · +${moneyText(c.effects?.money || 0)}`)}</small></span></label>`;
    }).join('')}</fieldset>${numbered('다음', '선택한 역할로 일을 시작한다', 'data-confirm-choice', game.state.scene.selected === null, null, 1)}`;
  }
  return `<div class="choice-list">${scene.choices.map((c, i) => {
    const reason = game.choiceAvailability(i);
    return numbered(c.label, `${c.duration || 1}분`, `data-choice="${i}" data-number="${i + 1}"`, Boolean(reason), reason, i + 1);
  }).join('')}</div>`;
}
function actionDetail(a, id) {
  if (a.special === 'rent') return `${moneyText(game.rentTotal())} · 5분`;
  if (a.scene) return a.scene === 'cafe_shift' ? '역할 선택 · 2시간 · +25,000원' : '대화 · 하루 한 번';
  let result = a.duration === 'sleep' ? '다음 날 07:00까지' : `${a.duration}분`;
  if (a.price) result += ` · −${moneyText(a.price)}`;
  if (a.effects?.money) result += ` · +${moneyText(a.effects.money)}`;
  if (a.itemsRequired) result += ` · ${Object.entries(a.itemsRequired).map(([key,count]) => `${ITEMS[key].name} ${count}개`).join(', ')}`;
  return result;
}
function placeChoices(place) {
  let index = 1;
  return `<div class="choice-list">${place.actions.map(id => {
    const a = ACTIONS[id]; const reason = game.actionAvailability(id);
    // 사용하지 않는 월세 납부 버튼은 숨깁니다.
    if (id === 'rent' && !game.state.rent.debt) return '';
    return numbered(a.label, actionDetail(a,id), `data-action="${id}" data-number="${index}"`, Boolean(reason), reason, index++);
  }).join('')}${numbered('거리로 나간다', '시간 소모 없음', `data-leave data-number="${index}"`, false, null, index)}</div>${waitControls()}`;
}
function streetChoices(street) {
  let index = 1;
  return `<div class="choice-list">${street.places.map(id => {
    const reason = game.placeAvailability(id);
    const name = id === 'room' && game.state.rent.housing === 'shelter' ? '임시 숙소' : PLACES[id].name;
    return numbered(`${name}에 들어간다`, '시간 소모 없음', `data-place="${id}" data-number="${index}"`, Boolean(reason), reason, index++);
  }).join('')}${street.links.map(id => numbered(`${STREETS[id].name}로 걸어간다`, '도보 · 5분', `data-walk="${id}" data-number="${index}"`, false, null, index++)).join('')}</div>
  <div class="utility-actions">${btn('◇ 지도에서 이동', 'data-panel="map"', false, 'text-button')}${btn('버스 타기 <span>1,500원 · 5분</span>', 'data-bus-menu', game.state.money < CONFIG.busFare, 'text-button')}</div>${waitControls()}`;
}
function waitControls() { return `<div class="wait-controls"><span>잠깐 기다리기</span>${[5,15,30,60].map(m => btn(`${m}분`, `data-wait="${m}"`)).join('')}</div>`; }
function quickMap() {
  const s = game.state;
  return `<section class="nearby"><div class="section-label"><span>가까운 거리</span>${btn('전체 지도 ↗', 'data-panel="map"', false, 'text-button')}</div><div class="nearby-grid">${STREETS[s.street].links.map(id => btn(`${streetArt(STREETS[id].art)}<span>${STREETS[id].name}</span><small>도보 5분</small>`, `data-walk="${id}"`, false, 'nearby-card')).join('')}</div></section>`;
}
function openPanel(id) {
  activePanel = id;
  if (id !== 'slotConfirm') pendingSlot = null;
  if (id === 'map') mapMode = 'walk';
  renderPanel();
  if (!panel.open) panel.showModal();
}
function closePanel() { panel.close(); activePanel = null; pendingSlot = null; }
panel.addEventListener('close', () => { activePanel = null; });
function renderPanel() {
  if (!activePanel) return;
  const titles = { map:'마을 지도',status:'상태창',inventory:'인벤토리',relations:'인물 관계',journal:'하루 기록',save:'세이브 / 로드',settings:'설정',new:'새로운 하루',slotConfirm:pendingSlot?.kind === 'save' ? '슬롯에 덮어쓰기' : '저장한 하루 불러오기' };
  panel.classList.toggle('map-panel', activePanel === 'map');
  panel.innerHTML = `<header class="panel-header"><div><p class="eyebrow">LITTLE TIME</p><h2 id="panel-title">${titles[activePanel]}</h2></div>${btn('×', 'data-close aria-label="닫기"', false, 'close-button')}</header><div class="panel-body">${({map:renderMap,status:renderStatus,inventory:renderInventory,relations:renderRelations,journal:renderJournal,save:renderSave,settings:renderSettings,new:renderNew,slotConfirm:renderSlotConfirm})[activePanel]()}</div><p class="panel-notice" role="status" aria-live="polite"></p>`;
}
function renderMap() {
  const s = game.state;
  const links = STREETS[s.street].links;
  const edges = [];
  for (const [id,street] of Object.entries(STREETS)) for (const link of street.links) if (id < link) edges.push(`<line x1="${street.x}" y1="${street.y}" x2="${STREETS[link].x}" y2="${STREETS[link].y}" ${id === s.street || link === s.street ? 'class="connected"' : ''}/>`);
  return `<div class="map-controls"><div class="segmented">${btn('도보 이동', 'data-map-mode="walk"', false, mapMode === 'walk' ? 'active' : '')}${btn('버스 이동', 'data-map-mode="bus"', false, mapMode === 'bus' ? 'active' : '')}</div><span>${mapMode === 'walk' ? '연결된 거리 · 5분' : '어느 거리든 · 1,500원 · 5분'}</span></div>
    <div class="town-map" aria-label="거리 연결 지도"><svg class="map-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>${Object.entries(STREETS).map(([id,street]) => {
      const current = id === s.street;
      const allowed = !s.scene && !current && (mapMode === 'bus' ? s.money >= CONFIG.busFare : links.includes(id));
      return btn(`${streetArt(street.art)}<span>${street.name}</span><small>${current ? '현재 위치' : allowed ? mapMode === 'bus' ? '버스 5분' : '도보 5분' : '이동 불가'}</small>`, `style="left:${street.x}%;top:${street.y}%" ${mapMode === 'walk' ? 'data-map-walk' : 'data-map-bus'}="${id}" aria-label="${street.name}, ${current ? '현재 위치' : allowed ? '이동 가능' : '이동 불가'}"`, !allowed, `map-node ${current ? 'current' : ''} ${allowed ? 'reachable' : ''}`);
    }).join('')}</div><div class="map-legend"><span><i class="legend-current"></i>현재 위치</span><span><i class="legend-reachable"></i>이동 가능</span><span><i></i>다른 거리</span></div><p class="panel-note">${s.scene ? '현재 이야기의 선택을 마친 뒤 이동할 수 있어.' : mapMode === 'bus' && s.money < CONFIG.busFare ? '버스 요금이 부족해. 도보로 연결된 거리를 이동해 줘.' : '거리 그림을 누르면 이동해. 시간과 생활 상태도 함께 변해.'}</p>`;
}
function renderStatus() {
  const s = game.state;
  return `<div class="profile-summary"><div class="avatar" aria-hidden="true">${hourglass}</div><div><p class="eyebrow">나의 생활</p><h3>마을의 학생</h3><p>${s.rent.housing === 'room' ? '혼자 사는 작은 방' : '잠시 머무는 임시 숙소'} · ${moneyText(s.money)}</p></div></div>
    <p class="panel-note">생활 상태는 낮을수록 좋아. 능력치는 행동과 경험으로 올라가.</p><div class="status-needs">${Object.keys(NEED_NAMES).map(needBar).join('')}</div>
    <div class="stat-grid">${Object.entries(STAT_NAMES).map(([id,name]) => `<div class="stat"><span>${name}</span><strong>${s.stats[id]}<small>/100</small></strong></div>`).join('')}</div><div class="panel-callout"><strong>이번 주의 생활비</strong><p>${rentSummary()}</p><small>행동에 소요되는 시간은 선택지 아래에 표시돼.</small></div>`;
}
function renderInventory() {
  const s = game.state;
  const entries = Object.entries(ITEMS).filter(([id]) => s.inventory[id]);
  return `<p class="panel-note">음식은 어디서든 꺼내 먹을 수 있어. 먹는 데에도 시간이 흘러.</p><div class="item-list">${entries.length ? entries.map(([id,item]) => `<article class="item"><div class="item-icon" aria-hidden="true">${id === 'notebook' ? '▤' : id === 'odd_ticket' ? '⌑' : '□'}</div><div><h3>${item.name}<span>×${s.inventory[id]}</span></h3><p>${item.description}</p></div>${item.consumable ? btn('먹기', `data-use="${id}"`, Boolean(s.scene), 'small-button') : '<span class="item-type">소지품</span>'}</article>`).join('') : '<p>가방이 비어 있다.</p>'}</div>`;
}
function renderRelations() {
  const s = game.state;
  return `<p class="panel-note">대화는 하루 한 번 관계를 쌓을 기회야. 호감과 신뢰가 새로운 선택을 열어 줘.</p><div class="relation-list">${Object.entries(NPCS).map(([id,npc],i) => {
    const r = s.relations[id]; const met = id === 'landlord' || s.flags[`met_${id}`];
    return `<article class="relation"><div class="relation-heading"><span class="portrait" aria-hidden="true">${['H','M','S','P'][i]}</span><div><h3>${npc.name}</h3><p>${npc.role} · ${STREETS[npc.street].name}</p></div><span class="relation-badge">${!met ? '아직 인사 전' : r.trust >= 30 ? '믿는 사이' : r.trust >= 12 ? '가까워지는 사이' : '알고 지내는 사이'}</span></div><p class="relation-note">${npc.note}</p><div class="relationship-stats"><span>호감 <b>${r.affection}</b></span><span>신뢰 <b>${r.trust}</b></span></div>${id === 'minjae' ? `<small class="unlock-note">${r.trust >= 12 ? '✓' : '◇'} 신뢰 12 · 월세가 밀리면 추가 일자리 소개</small>` : ''}${id === 'seoyun' && s.flags.ticket_shared ? '<small class="unlock-note">✓ 날짜 없는 승차권의 이야기를 나눴다</small>' : ''}</article>`;
  }).join('')}</div>`;
}
function renderJournal() {
  return `<p class="panel-note">최근 100개의 기록. 중요한 납부일과 만남도 이곳에 남아.</p><ol class="journal">${[...game.state.journal].reverse().map(entry => `<li><div><span>${dateText(entry.clock)}</span><time>${timeText(entry.clock)}</time></div><p>${escape(entry.text)}</p>${entry.kind === 'rent' ? '<small>주거 기록</small>' : entry.kind === 'story' ? '<small>이야기</small>' : ''}</li>`).join('')}</ol>`;
}
function renderSave() {
  const entries = slots.list();
  return `<p class="panel-note">슬롯 1~10에 원하는 순간을 저장해 둬. 이 기기의 같은 브라우저에서 다시 불러올 수 있어.</p><div class="save-summary"><span>현재 진행 · ${dateText(game.state.clock)} ${timeText(game.state.clock)}</span><strong>${STREETS[game.state.street].name}</strong><small>${moneyText(game.state.money)} · DAY ${dayNumber(game.state.clock) + 1} · 별도 자동 저장</small></div>
    <div class="section-label"><span>브라우저 저장 슬롯</span><span>${entries.filter(e => e.status === 'saved').length} / 10 사용 중</span></div>
    <div class="save-slots">${entries.map(entry => renderSlot(entry)).join('')}</div>
    <p class="panel-note slot-note">슬롯에는 시간, 소지품, 관계, 월세, 대화 위치가 모두 저장돼. 새 게임을 시작해도 슬롯은 남아 있어. 브라우저의 사이트 데이터를 지우면 저장도 사라져.</p>
    <div class="section-label"><span>파일로 보관하기</span><span>다른 기기로 옮길 때</span></div><div class="save-actions">${btn('↓ 저장 파일 내려받기', 'data-export', false, 'secondary-button')}${btn('↑ 저장 파일 불러오기', 'data-import', false, 'secondary-button')}</div><div class="new-game-area">${btn('새 게임 시작', 'data-panel="new"', false, 'text-button')}<small>현재 진행을 슬롯이나 파일로 보관할 수 있어.</small></div>`;
}
function renderSlot(entry) {
  const {slot, status, state, savedAt} = entry;
  const title = status === 'saved' ? `${dateText(state.clock)} ${timeText(state.clock)}` : status === 'empty' ? '비어 있는 슬롯' : status === 'invalid' ? '저장 데이터를 읽을 수 없어' : '브라우저 저장을 사용할 수 없어';
  const savedTime = savedAt ? new Date(savedAt).toLocaleString('ko-KR', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
  const detail = state ? `${STREETS[state.street].name} · ${moneyText(state.money)} · DAY ${dayNumber(state.clock) + 1}` : status === 'empty' ? '현재 진행을 이곳에 저장할 수 있어.' : status === 'invalid' ? '파일 백업을 이용하거나 새 기록으로 덮어쓸 수 있어.' : '파일 저장을 이용해 줘.';
  return `<article class="save-slot ${status === 'saved' ? 'filled' : ''}" aria-label="세이브 슬롯 ${slot}"><span class="slot-number">${String(slot).padStart(2,'0')}</span><div class="slot-copy"><h3>${escape(title)}</h3><p>${escape(detail)}</p>${savedTime ? `<small>저장 ${escape(savedTime)}</small>` : ''}</div><div class="slot-actions">${btn('저장', `data-slot-save="${slot}" aria-label="슬롯 ${slot}에 저장"`, status === 'unavailable', 'small-button')}${btn('불러오기', `data-slot-load="${slot}" aria-label="슬롯 ${slot} 불러오기"`, status !== 'saved', 'small-button')}</div></article>`;
}
function renderSlotConfirm() {
  if (!pendingSlot) return '';
  return `<p class="panel-note">${pendingSlot.kind === 'save' ? `슬롯 ${pendingSlot.slot}의 기존 기록을 현재 진행으로 바꿀까?` : `현재 진행 대신 슬롯 ${pendingSlot.slot}에 저장한 순간으로 돌아갈까? 현재 진행은 먼저 다른 슬롯이나 파일로 저장해 둘 수 있어.`}</p><div class="save-actions slot-confirm-actions">${btn(pendingSlot.kind === 'save' ? '이 슬롯에 덮어쓰기' : '저장한 하루 불러오기', 'data-slot-confirm', false, 'primary-button')}${btn('돌아가기', 'data-panel="save"', false, 'secondary-button')}</div>`;
}
function requestSlot(kind, slot) {
  const entry = slots.inspect(slot);
  if (kind === 'save' && entry.status === 'empty') return writeSlot(slot);
  if (kind === 'load' && entry.status !== 'saved') { notify('불러올 수 없는 슬롯이야.'); return; }
  if (entry.status === 'unavailable') { notify('브라우저 저장을 사용할 수 없어. 파일 저장을 이용해 줘.'); return; }
  pendingSlot = {kind, slot}; openPanel('slotConfirm');
}
function writeSlot(slot) {
  try { slots.save(slot, game); openPanel('save'); notify(`슬롯 ${slot}에 저장했어.`); }
  catch (error) { notify(error.message); }
}
function confirmSlot() {
  if (!pendingSlot) return;
  const {kind, slot} = pendingSlot;
  if (kind === 'save') return writeSlot(slot);
  try { const restored = slots.load(slot); game = new Game(restored); persist(); closePanel(); render(); notify(`슬롯 ${slot}의 하루를 불러왔어.`); }
  catch (error) { notify(error.message); }
}
function renderSettings() {
  return `<div class="setting-row"><div><h3>글자 크기</h3><p>읽기 편한 크기를 골라 줘.</p></div><div class="size-buttons">${[15,17,19,21].map(size => btn(`${size}`, `data-font="${size}" aria-label="글자 크기 ${size}"`, false, settings.fontSize === size ? 'active' : '')).join('')}</div></div><div class="setting-row"><div><h3>화면 효과</h3><p>짧은 등장 효과를 켜거나 끌 수 있어.</p></div>${btn(settings.motion ? '켜짐' : '꺼짐', 'data-motion', false, 'small-button')}</div><div class="panel-callout"><strong>키보드</strong><p>1–9 선택 · M 지도 · I 인벤토리 · S 세이브<br>Esc 창 닫기</p><small>지도나 상태창을 여는 동안 게임 시간은 흐르지 않아.</small></div>`;
}
function renderNew() {
  return `<p class="panel-note">지금까지의 자동 저장을 새 게임으로 바꾸게 돼. 슬롯 1~10과 파일로 보관한 기록은 그대로 남아 있어.</p><div class="save-actions">${btn('슬롯에 저장하러 가기', 'data-panel="save"', false, 'secondary-button')}${btn('현재 진행을 파일로 저장', 'data-export', false, 'secondary-button')}${btn('새로운 하루 시작', 'data-new-game', false, 'primary-button')}${btn('계속 플레이', 'data-close', false, 'text-button')}</div>`;
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* 현재 세션의 설정은 계속 적용 */ }
  render(); renderPanel();
}
document.addEventListener('click', event => {
  const b = event.target.closest('button');
  if (!b || b.disabled) return;
  const d = b.dataset;
  if (ownData(d,'close')) return closePanel();
  if (d.panel) return openPanel(d.panel);
  if (d.walk) return act(() => game.walk(d.walk));
  if (d.mapWalk) return act(() => game.walk(d.mapWalk), { close:true });
  if (d.mapBus) return act(() => game.bus(d.mapBus), { close:true });
  if (ownData(d,'busMenu')) { openPanel('map'); mapMode = 'bus'; return renderPanel(); }
  if (d.mapMode) { mapMode = d.mapMode; return renderPanel(); }
  if (d.place) return act(() => game.enter(d.place));
  if (ownData(d,'leave')) return act(() => game.leave());
  if (d.action) return act(() => game.action(d.action));
  if (ownData(d,'choice')) return act(() => game.choose(Number(d.choice)));
  if (ownData(d,'confirmChoice')) return act(() => game.choose(game.state.scene.selected));
  if (d.wait) return act(() => game.wait(Number(d.wait)));
  if (d.use) return act(() => game.useItem(d.use));
  if (d.slotSave) return requestSlot('save', Number(d.slotSave));
  if (d.slotLoad) return requestSlot('load', Number(d.slotLoad));
  if (ownData(d,'slotConfirm')) return confirmSlot();
  if (ownData(d,'export')) return downloadSave();
  if (ownData(d,'import')) { document.querySelector('#load-file').click(); return; }
  if (ownData(d,'newGame')) return act(() => { game = new Game(); }, { close:true });
  if (d.font) { settings.fontSize = Number(d.font); return saveSettings(); }
  if (ownData(d,'motion')) { settings.motion = !settings.motion; return saveSettings(); }
});
function ownData(data,key) { return Object.hasOwn(data,key); }
document.addEventListener('change', event => {
  if (event.target.matches('input[name="scene-choice"]')) act(() => game.selectChoice(Number(event.target.value)), { preserveFocus:true });
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.altKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
  if (panel.open) return;
  const key = event.key.toLowerCase();
  if (['m','i','s'].includes(key)) { event.preventDefault(); openPanel({m:'map',i:'inventory',s:'save'}[key]); return; }
  if (/^[1-9]$/.test(key)) {
    event.preventDefault();
    if (game.state.scene && SCENES[game.state.scene.id].mode === 'radio') {
      if (key === '1' && game.state.scene.selected !== null) act(() => game.choose(game.state.scene.selected));
      return;
    }
    app.querySelector(`[data-number="${key}"]:not([disabled])`)?.click();
  }
});
function downloadSave() {
  const blob = new Blob([game.exportSave()], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `LittleTime-Day${dayNumber(game.state.clock) + 1}-${timeText(game.state.clock).replace(':','')}.json`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('저장 파일을 내려받았어.');
}
document.querySelector('#load-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 1000000) throw new Error('1MB 이하의 저장파일을 선택해 줘.');
    const state = parseSave(await file.text());
    game = new Game(state); persist(); closePanel(); render(); notify('저장한 하루를 불러왔어.');
  } catch (error) { notify(error.message); }
  finally { event.target.value = ''; }
});
render();
if (startupMessage) notify(startupMessage);
