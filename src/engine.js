import { CONFIG, STREETS, PLACES, ITEMS, ACTIONS, SCENES, NPCS, STAT_NAMES, NEED_NAMES } from './world.js';

const DAY = 1440;
const WEEK = DAY * 7;
const clamp = (n, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const copy = value => structuredClone(value);
const emptyObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (o, k) => Object.hasOwn(o, k);
export const moneyText = n => `${Math.round(n).toLocaleString('ko-KR')}원`;
export const timeText = clock => `${String(Math.floor((clock % DAY) / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`;
export const dayNumber = clock => Math.floor(clock / DAY);
export const minuteOfDay = clock => clock % DAY;
export const isSchoolDay = clock => dayNumber(clock) % 7 < 5;
export function dateText(clock) {
  const date = new Date(`${CONFIG.startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayNumber(clock));
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 ${['월', '화', '수', '목', '금', '토', '일'][dayNumber(clock) % 7]}요일`;
}
export function nextRentDate(clock) {
  let due = Math.floor(clock / WEEK) * WEEK + 6 * DAY + 21 * 60;
  if (due <= clock) due += WEEK;
  return due;
}

export function initialState() {
  return {
    clock: CONFIG.startMinute, street: 'home', place: null, money: 62000,
    needs: { stress: 12, fatigue: 8, hunger: 20 },
    stats: Object.fromEntries(Object.keys(STAT_NAMES).map(key => [key, 5])),
    inventory: { rice: 2, meal: 0, snack: 1, notebook: 1, odd_ticket: 0 },
    relations: Object.fromEntries(Object.entries(NPCS).map(([id, npc]) => [id, { affection: 0, trust: npc.initialTrust }])),
    rent: { debt: 0, lateFee: 0, weeksMissed: 0, nextDue: nextRentDate(CONFIG.startMinute), evictionAt: null, housing: 'room' },
    flags: {}, daily: {}, weekly: {}, visited: ['home'],
    scene: { id: 'intro', selected: null }, report: null,
    journal: [{ clock: CONFIG.startMinute, kind: 'story', text: '이 작은 마을에서 혼자 사는 첫 번째 월요일.' }],
  };
}

export class Game {
  constructor(state = initialState()) { this.state = copy(state); }
  note(text, kind = 'action') {
    this.state.journal.push({ clock: this.state.clock, kind, text });
    this.state.journal = this.state.journal.slice(-100);
  }
  applyEffects(effects = {}) {
    const s = this.state;
    s.money = Math.max(0, s.money + (effects.money || 0));
    for (const [key, delta] of Object.entries(effects.needs || {})) s.needs[key] = clamp(s.needs[key] + delta);
    for (const [key, delta] of Object.entries(effects.stats || {})) s.stats[key] = clamp(s.stats[key] + delta);
    for (const [key, delta] of Object.entries(effects.inventory || {})) s.inventory[key] = clamp(s.inventory[key] + delta, 0, 999);
    for (const [id, delta] of Object.entries(effects.relations || {})) {
      for (const [key, value] of Object.entries(delta)) s.relations[id][key] = clamp(s.relations[id][key] + value);
    }
    Object.assign(s.flags, effects.flags || {});
  }
  checkConditions(conditions = {}) {
    const s = this.state;
    for (const [id, min] of Object.entries(conditions.minTrust || {})) if (s.relations[id].trust < min) return `${NPCS[id].name}의 신뢰 ${min} 필요`;
    for (const [key, min] of Object.entries(conditions.minStat || {})) if (s.stats[key] < min) return `${STAT_NAMES[key]} ${min} 필요`;
    for (const [id, min] of Object.entries(conditions.hasItem || {})) if (s.inventory[id] < min) return `${ITEMS[id].name} 필요`;
    for (const [key, value] of Object.entries(conditions.flags || {})) if (s.flags[key] !== value) return '아직 필요한 이야기가 진행되지 않았어';
    if (conditions.hasDebt && !s.rent.debt) return '밀린 월세가 없어';
    return null;
  }
  placeAvailability(id) {
    const place = PLACES[id];
    if (!place) return '없는 장소야';
    if (place.street !== this.state.street) return '먼저 그 거리에 도착해야 해';
    if (place.weekdays && !isSchoolDay(this.state.clock)) return '주말에는 문이 닫혀 있어';
    const m = minuteOfDay(this.state.clock);
    if (place.hours && (m < place.hours[0] || m >= place.hours[1])) return `${timeText(place.hours[0])}–${timeText(place.hours[1])}에 열려 있어`;
    return null;
  }
  actionAvailability(id) {
    const a = ACTIONS[id];
    const s = this.state;
    if (!a || !s.place || !PLACES[s.place].actions.includes(id)) return '여기서는 할 수 없어';
    if (s.scene) return '먼저 선택을 마쳐야 해';
    const closed = this.placeAvailability(s.place);
    if (closed) return closed;
    if (a.special === 'rent') {
      if (!s.rent.debt) return '지금은 밀린 월세가 없어';
      if (s.money < this.rentTotal()) return `${moneyText(this.rentTotal())} 필요`;
    }
    if (a.price && s.money < a.price) return `${moneyText(a.price)} 필요`;
    if (a.housingRequired && a.housingRequired !== s.rent.housing) return '자취방을 되찾은 뒤 할 수 있어';
    if (a.maxFatigue && s.needs.fatigue >= a.maxFatigue) return '피로가 너무 높아. 먼저 쉬자';
    if (a.weekdays && !isSchoolDay(s.clock)) return '평일에 할 수 있어';
    if (a.daily && s.daily[id] === dayNumber(s.clock)) return '오늘은 이미 했어';
    if (a.weekly && s.weekly[id] === Math.floor(s.clock / WEEK)) return '이번 주는 이미 했어';
    const duration = typeof a.duration === 'number' ? a.duration : 0;
    const hours = a.hours || PLACES[s.place].hours;
    const m = minuteOfDay(s.clock);
    if (hours && (m < hours[0] || m >= hours[1] || m + duration > hours[1])) return `${timeText(hours[0])}–${timeText(hours[1])} 안에 마쳐야 해`;
    for (const [item, count] of Object.entries(a.itemsRequired || {})) if (s.inventory[item] < count) return `${ITEMS[item].name} ${count}개 필요`;
    return this.checkConditions(a.conditions);
  }
  rentTotal() { return this.state.rent.debt + this.state.rent.lateFee; }
  // 시간 관련 사건을 지나친 순서대로 처리하므로 긴 수면 중에도 납부일을 놓치지 않습니다.
  advanceMinutes(minutes, { sleeping = false } = {}) {
    if (!Number.isSafeInteger(minutes) || minutes <= 0 || minutes > WEEK * 10) throw new Error('잘못된 행동 시간');
    const s = this.state;
    const end = s.clock + minutes;
    while (s.clock < end) {
      const midnight = (dayNumber(s.clock) + 1) * DAY;
      const todaySchoolEnd = dayNumber(s.clock) * DAY + 15 * 60;
      const schoolEnd = todaySchoolEnd > s.clock ? todaySchoolEnd : (dayNumber(s.clock) + 1) * DAY + 15 * 60;
      const boundary = Math.min(end, midnight, schoolEnd, s.rent.nextDue ?? Infinity, s.rent.evictionAt ?? Infinity);
      const elapsed = boundary - s.clock;
      if (elapsed <= 0) throw new Error('시간 상태가 올바르지 않아');
      s.needs.hunger = clamp(s.needs.hunger + elapsed * .035);
      if (!sleeping) s.needs.fatigue = clamp(s.needs.fatigue + elapsed * .022 * (1 - s.stats.stamina / 200));
      s.clock = boundary;
      if (boundary === schoolEnd && isSchoolDay(s.clock) && s.daily.class !== dayNumber(s.clock)) {
        s.needs.stress = clamp(s.needs.stress + 6);
        this.note('오늘 수업에 참여하지 못했다. 내일은 학교에 들러 보자.', 'school');
      }
      if (boundary === s.rent.nextDue) this.processRent();
      if (boundary === s.rent.evictionAt) this.evict();
    }
  }
  processRent() {
    const s = this.state;
    const r = s.rent;
    r.debt += CONFIG.weeklyRent;
    if (s.money >= this.rentTotal()) {
      const amount = this.rentTotal();
      s.money -= amount;
      r.debt = 0; r.lateFee = 0; r.weeksMissed = 0; r.evictionAt = null;
      this.note(`이번 주 월세 ${moneyText(amount)}을 납부했다.`, 'rent');
    } else {
      r.weeksMissed++;
      if (r.weeksMissed >= 2) r.lateFee = Math.min(CONFIG.weeklyRent * .3, r.lateFee + CONFIG.weeklyRent * .1);
      s.needs.stress = clamp(s.needs.stress + 8);
      s.relations.landlord.trust = clamp(s.relations.landlord.trust - 5);
      this.note(`월세를 내지 못했다. ${r.weeksMissed}주 연체, 납부할 금액 ${moneyText(this.rentTotal())}.`, 'rent');
      if (r.weeksMissed === 3) {
        r.evictionAt = s.clock + WEEK;
        this.note('퇴거 예고를 받았다. 일주일 안에 밀린 월세를 해결해야 한다.', 'rent');
      }
    }
    r.nextDue = s.clock + WEEK;
  }
  evict() {
    const r = this.state.rent;
    if (!r.debt) { r.evictionAt = null; return; }
    r.housing = 'shelter'; r.evictionAt = null; r.nextDue = null;
    this.state.needs.stress = clamp(this.state.needs.stress + 15);
    this.note('방을 비웠다. 주택가의 임시 숙소에 머물게 되었다. 밀린 월세를 갚으면 다시 돌아올 수 있다.', 'rent');
  }
  maybeEvent() {
    const s = this.state;
    if (!s.scene && s.street === 'old' && minuteOfDay(s.clock) >= 20 * 60 && !s.flags.station_seen) {
      s.scene = { id: 'night_ticket', selected: null };
      this.note('옛 역 정류장에서 알 수 없는 안내 방송이 들렸다.', 'story');
    }
  }
  capture() { return copy(this.state); }
  makeReport(before, text, title) {
    const s = this.state;
    const changes = [];
    const deltaMoney = s.money - before.money;
    if (deltaMoney) changes.push(`${deltaMoney > 0 ? '+' : '−'}${moneyText(Math.abs(deltaMoney))}`);
    for (const [key, name] of Object.entries(STAT_NAMES)) {
      const delta = s.stats[key] - before.stats[key];
      if (delta) changes.push(`${name} ${delta > 0 ? '+' : ''}${delta}`);
    }
    for (const [key, name] of Object.entries(NEED_NAMES)) {
      const delta = Math.round(s.needs[key]) - Math.round(before.needs[key]);
      if (delta) changes.push(`${name} ${delta > 0 ? '+' : ''}${delta}`);
    }
    for (const [id, npc] of Object.entries(NPCS)) {
      for (const key of ['affection', 'trust']) {
        const delta = s.relations[id][key] - before.relations[id][key];
        if (delta) changes.push(`${npc.name} ${key === 'trust' ? '신뢰' : '호감'} ${delta > 0 ? '+' : ''}${delta}`);
      }
    }
    for (const [id, item] of Object.entries(ITEMS)) {
      const delta = s.inventory[id] - before.inventory[id];
      if (delta) changes.push(`${item.name} ${delta > 0 ? '+' : ''}${delta}`);
    }
    s.report = { text, title, clock: s.clock, elapsed: s.clock - before.clock, changes };
    this.note(text);
    return s.report;
  }
  walk(id) {
    const s = this.state;
    if (s.scene) throw new Error('먼저 현재 선택을 마쳐 줘');
    if (!STREETS[s.street].links.includes(id)) throw new Error('연결된 거리로만 걸어갈 수 있어');
    const before = this.capture();
    this.advanceMinutes(CONFIG.walkMinutes);
    s.street = id; s.place = null;
    if (!s.visited.includes(id)) s.visited.push(id);
    this.makeReport(before, `${STREETS[id].name}에 도착했다.`, '도보 이동');
    this.maybeEvent();
  }
  bus(id) {
    const s = this.state;
    if (s.scene) throw new Error('먼저 현재 선택을 마쳐 줘');
    if (!own(STREETS, id) || id === s.street) throw new Error('다른 목적지를 골라 줘');
    if (s.money < CONFIG.busFare) throw new Error('버스 요금이 부족해');
    const before = this.capture();
    s.money -= CONFIG.busFare;
    this.advanceMinutes(CONFIG.busMinutes);
    s.street = id; s.place = null;
    if (!s.visited.includes(id)) s.visited.push(id);
    this.makeReport(before, `버스를 타고 ${STREETS[id].name}에 도착했다.`, '버스 이동');
    this.maybeEvent();
  }
  enter(id) {
    if (this.state.scene) throw new Error('먼저 현재 선택을 마쳐 줘');
    const reason = this.placeAvailability(id);
    if (reason) throw new Error(reason);
    this.state.place = id;
    this.state.report = null;
  }
  leave() {
    if (this.state.scene) throw new Error('먼저 현재 선택을 마쳐 줘');
    this.state.place = null; this.state.report = null;
  }
  action(id) {
    const reason = this.actionAvailability(id);
    if (reason) throw new Error(reason);
    const s = this.state;
    const a = ACTIONS[id];
    const before = this.capture();
    if (a.daily) s.daily[id] = dayNumber(s.clock);
    if (a.weekly) s.weekly[id] = Math.floor(s.clock / WEEK);
    if (a.scene) {
      s.scene = { id: a.npc && !s.flags[`met_${a.npc}`] ? a.firstScene : a.scene, selected: null };
      s.report = null;
      return;
    }
    if (a.special === 'rent') {
      s.money -= this.rentTotal();
      Object.assign(s.rent, { debt: 0, lateFee: 0, weeksMissed: 0, evictionAt: null, housing: 'room' });
      s.rent.nextDue ??= nextRentDate(s.clock);
      s.relations.landlord.trust = clamp(s.relations.landlord.trust + 3);
      this.advanceMinutes(a.duration);
      this.makeReport(before, '밀린 월세를 모두 납부했다. 다시 내 방에서 지낼 수 있다.', '월세 납부');
      return;
    }
    s.money -= a.price || 0;
    let minutes = a.duration;
    if (minutes === 'sleep') {
      minutes = 7 * 60 - minuteOfDay(s.clock);
      if (minutes <= 0) minutes += DAY;
    }
    // 출석은 행동 시작 시 기록되므로 수업 종료 시각을 지나도 결석 처리되지 않습니다.
    this.advanceMinutes(minutes, { sleeping: a.sleeping || a.duration === 'sleep' });
    const effects = copy(a.effects || {});
    if (a.duration === 'sleep' && s.rent.housing === 'shelter') effects.needs = { fatigue: -45, stress: -10 };
    this.applyEffects(effects);
    this.makeReport(before, a.result, a.label);
    this.maybeEvent();
  }
  choiceAvailability(index) {
    const s = this.state;
    const choice = SCENES[s.scene?.id]?.choices[index];
    if (!choice) return '없는 선택이야';
    const reason = this.checkConditions(choice.conditions);
    if (reason) return reason;
    if (s.scene.id === 'cafe_shift') {
      const m = minuteOfDay(s.clock);
      if (m < 9 * 60 || m + choice.duration > 22 * 60) return '마감 시간 전까지 일할 수 없어';
      if (s.needs.fatigue >= 85) return '먼저 쉬어야 해';
    }
    return null;
  }
  selectChoice(index) {
    if (this.choiceAvailability(index)) throw new Error(this.choiceAvailability(index));
    this.state.scene.selected = index;
  }
  choose(index) {
    const reason = this.choiceAvailability(index);
    if (reason) throw new Error(reason);
    const before = this.capture();
    const c = SCENES[this.state.scene.id].choices[index];
    this.state.scene = c.next ? { id: c.next, selected: null } : null;
    this.advanceMinutes(c.duration || 1);
    this.applyEffects(c.effects);
    this.makeReport(before, c.result || '이야기가 이어진다.', '선택의 결과');
    this.maybeEvent();
  }
  wait(minutes = 30) {
    if (this.state.scene) throw new Error('먼저 현재 선택을 마쳐 줘');
    if (![5, 15, 30, 60].includes(minutes)) throw new Error('기다릴 시간을 다시 골라 줘');
    const before = this.capture();
    this.advanceMinutes(minutes);
    this.makeReport(before, `${minutes}분이 지나갔다.`, '잠깐 기다림');
    this.maybeEvent();
  }
  useItem(id) {
    const s = this.state;
    if (s.scene) throw new Error('현재 선택을 마친 뒤 사용할 수 있어');
    if (!ITEMS[id]?.consumable || !s.inventory[id]) throw new Error('사용할 수 없는 아이템이야');
    const before = this.capture();
    s.inventory[id]--;
    this.advanceMinutes(ITEMS[id].duration);
    this.applyEffects(ITEMS[id].effects);
    this.makeReport(before, `${ITEMS[id].name}을 먹었다.`, '아이템 사용');
    this.maybeEvent();
  }
  exportSave() {
    return JSON.stringify({ game: CONFIG.gameId, version: CONFIG.saveVersion, savedAt: new Date().toISOString(), state: this.state }, null, 2);
  }
}

// 저장파일은 브라우저 화면을 수정하는 HTML이나 실행 코드를 담지 않습니다.
export function parseSave(text) {
  if (typeof text !== 'string' || text.length > 1000000) throw new Error('저장파일은 1MB 이하의 JSON 파일이어야 해');
  let file;
  try { file = JSON.parse(text); } catch { throw new Error('JSON 형식의 저장파일을 읽을 수 없어'); }
  if (file?.game !== CONFIG.gameId) throw new Error('LittleTime 저장파일이 아니야');
  if (file.version !== CONFIG.saveVersion) throw new Error('지원하지 않는 저장파일 버전이야');
  const s = file.state;
  const fail = () => { throw new Error('저장파일의 내용이 올바르지 않아. 현재 진행은 유지돼'); };
  const integer = (value, min = 0, max = 1000000000) => Number.isSafeInteger(value) && value >= min && value <= max;
  const numeric = (value, min = 0, max = 100) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
  const textValue = (value, max = 1000) => typeof value === 'string' && value.length <= max;
  if (!emptyObject(s) || !integer(s.clock, CONFIG.startMinute, 52560000) || !integer(s.money) || !own(STREETS, s.street)) fail();
  if (s.place !== null && (!own(PLACES, s.place) || PLACES[s.place].street !== s.street)) fail();
  for (const [field, definitions, check] of [['needs', NEED_NAMES, numeric], ['stats', STAT_NAMES, integer], ['inventory', ITEMS, integer]]) {
    if (!emptyObject(s[field]) || Object.keys(s[field]).length !== Object.keys(definitions).length) fail();
    for (const key of Object.keys(definitions)) if (!check(s[field][key], 0, field === 'inventory' ? 999 : 100)) fail();
  }
  if (!emptyObject(s.relations) || Object.keys(s.relations).length !== Object.keys(NPCS).length) fail();
  for (const id of Object.keys(NPCS)) if (!emptyObject(s.relations[id]) || !integer(s.relations[id].trust, 0, 100) || !integer(s.relations[id].affection, 0, 100)) fail();
  for (const key of ['flags', 'daily', 'weekly']) {
    if (!emptyObject(s[key]) || Object.keys(s[key]).length > 500) fail();
    for (const [id, value] of Object.entries(s[key])) {
      if (!/^[a-zA-Z0-9_]+$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id)) fail();
      if (key === 'flags' ? typeof value !== 'boolean' : !integer(value, 0, dayNumber(s.clock))) fail();
    }
  }
  if (!Array.isArray(s.visited) || s.visited.length > Object.keys(STREETS).length || !s.visited.every(id => own(STREETS, id)) || !s.visited.includes(s.street)) fail();
  const r = s.rent;
  if (!emptyObject(r) || !integer(r.debt) || !integer(r.lateFee, 0, CONFIG.weeklyRent * .3) || !integer(r.weeksMissed, 0, 1000) || !['room', 'shelter'].includes(r.housing)) fail();
  if (r.housing === 'room' ? !integer(r.nextDue, s.clock + 1, s.clock + WEEK) : r.nextDue !== null) fail();
  if (r.evictionAt !== null && (!integer(r.evictionAt, s.clock + 1, s.clock + WEEK) || r.housing !== 'room')) fail();
  if (s.scene !== null) {
    if (!emptyObject(s.scene) || !own(SCENES, s.scene.id) || (s.scene.selected !== null && !integer(s.scene.selected, 0, SCENES[s.scene.id].choices.length - 1))) fail();
  }
  if (!Array.isArray(s.journal) || s.journal.length > 100 || !s.journal.every(entry => emptyObject(entry) && integer(entry.clock, 0, s.clock) && textValue(entry.kind, 20) && textValue(entry.text))) fail();
  if (s.report !== null && (!emptyObject(s.report) || !textValue(s.report.title) || !textValue(s.report.text) || !integer(s.report.clock, 0, s.clock) || !integer(s.report.elapsed) || !Array.isArray(s.report.changes) || s.report.changes.length > 30 || !s.report.changes.every(value => textValue(value, 100)))) fail();
  const base = initialState();
  // 최상위의 불필요한 필드는 게임 상태에 가져오지 않습니다.
  return Object.fromEntries(Object.keys(base).map(key => [key, copy(s[key])]));
}
