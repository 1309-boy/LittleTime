import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, initialState, parseSave, nextRentDate, dayNumber } from '../src/engine.js';
import { CONFIG, STREETS, PLACES, SCENES, ACTIONS, ITEMS, NPCS, STAT_NAMES, NEED_NAMES } from '../src/world.js';

function started() { const game = new Game(); game.choose(0); return game; }
function atPlace(id, clock = 10 * 60) {
  const s = initialState(); s.scene = null; s.clock = clock;
  s.street = PLACES[id].street; s.place = id; s.visited = [s.street];
  s.rent.nextDue = nextRentDate(clock);
  return new Game(s);
}
test('지도 연결은 서로 일치하고 모든 거리와 장소에 도달할 수 있다', () => {
  const reached = new Set(['home']); const pending = ['home'];
  while (pending.length) {
    const id = pending.shift();
    for (const next of STREETS[id].links) {
      assert.ok(STREETS[next]?.links.includes(id), `${id} ↔ ${next}`);
      if (!reached.has(next)) { reached.add(next); pending.push(next); }
    }
    for (const place of STREETS[id].places) assert.equal(PLACES[place].street,id);
  }
  assert.equal(reached.size,Object.keys(STREETS).length);
});
test('장소와 스크립트가 참조하는 행동과 효과는 모두 유효하다', () => {
  for (const place of Object.values(PLACES)) for (const id of place.actions) assert.ok(ACTIONS[id]);
  for (const a of [...Object.values(ACTIONS),...Object.values(SCENES).flatMap(scene => scene.choices)]) {
    for (const [key, defs] of Object.entries({needs:NEED_NAMES,stats:STAT_NAMES,inventory:ITEMS,relations:NPCS})) {
      for (const id of Object.keys(a.effects?.[key] || {})) assert.ok(Object.hasOwn(defs,id),`${key}.${id}`);
    }
    if (a.scene) assert.ok(SCENES[a.scene]);
    if (a.firstScene) assert.ok(SCENES[a.firstScene]);
    if (a.next) assert.ok(SCENES[a.next]);
  }
});
test('첫 선택 → 식사 → 등교 → 수업에서 시간과 자원이 함께 변한다', () => {
  const g = started();
  assert.equal(g.state.clock,455);
  g.enter('room'); g.action('cook');
  assert.equal(g.state.clock,485); assert.equal(g.state.inventory.rice,1);
  assert.equal(g.state.stats.housekeeping,6); assert.equal(g.state.needs.hunger,0);
  g.leave(); g.walk('school'); g.enter('classroom'); g.wait(30); g.action('class');
  assert.equal(g.state.clock,640); assert.equal(g.state.stats.study,7);
  assert.equal(g.state.daily.class,0);
});
test('연결되지 않은 도보 이동은 시간과 상태를 바꾸지 않는다', () => {
  const g = started(); const snapshot = g.capture();
  assert.throws(() => g.walk('library'),/연결/);
  assert.deepEqual(g.state,snapshot);
});
test('버스는 연결과 관계없이 목적지로 이동하며 요금과 시간을 한 번 소모한다', () => {
  const g = started(); const before = g.capture(); g.bus('library');
  assert.equal(g.state.street,'library'); assert.equal(g.state.money,before.money-CONFIG.busFare);
  assert.equal(g.state.clock,before.clock+CONFIG.busMinutes);
  assert.equal(g.state.place,null);
});
test('잔액이 부족한 버스 이동은 현재 상태를 유지한다', () => {
  const g = started(); g.state.money = 0; const snapshot=g.capture();
  assert.throws(() => g.bus('library'),/요금/); assert.deepEqual(g.state,snapshot);
});
test('주말 학교와 영업시간 밖의 장소에는 들어갈 수 없다', () => {
  const g = atPlace('classroom',5*1440+10*60); g.state.place=null;
  assert.throws(() => g.enter('classroom'),/주말/);
  const late = atPlace('cafe',23*60); late.state.place=null;
  assert.throws(() => late.enter('cafe'),/열려/);
});
test('행동이 가게 마감시간을 넘어가면 실행하지 않는다', () => {
  const g=atPlace('store',21*60);const snapshot=g.capture();
  assert.throws(() => g.action('store_shift'),/마쳐/);assert.deepEqual(g.state,snapshot);
});
test('일한 급여와 능력치가 지급되고 소비는 필요한 잔액이 있어야 한다', () => {
  const g=atPlace('store');g.action('store_shift');
  assert.equal(g.state.money,86000);assert.equal(g.state.stats.strength,6);
  g.state.money=1000;const snapshot=g.capture();
  assert.throws(() => g.action('buy_meal'),/필요/);assert.deepEqual(g.state,snapshot);
});
test('대화는 하루 한 번이고 다음 날에는 다시 관계를 쌓을 수 있다', () => {
  const g=atPlace('cafe');g.action('talk_minjae');g.choose(0);
  assert.equal(g.state.relations.minjae.trust,6);
  assert.throws(() => g.action('talk_minjae'),/이미/);
  g.advanceMinutes(1440);g.action('talk_minjae');g.choose(0);
  assert.equal(g.state.relations.minjae.trust,12);
});
test('NPC 신뢰와 연체 조건에 따라 추가 일자리가 열린다', () => {
  const g=atPlace('cafe');assert.match(g.actionAvailability('help_minjae'),/신뢰/);
  g.state.relations.minjae.trust=12;assert.match(g.actionAvailability('help_minjae'),/밀린/);
  g.state.rent.debt=80000;assert.equal(g.actionAvailability('help_minjae'),null);
  g.action('help_minjae');assert.equal(g.state.money,97000);
  assert.match(g.actionAvailability('help_minjae'),/이번 주/);
});
test('라디오 선택은 확정 전 돈과 시간이 흐르지 않고 파일 복원 후 확정할 수 있다', () => {
  const g=atPlace('cafe');g.action('cafe_shift');const before=g.capture();
  g.selectChoice(1);assert.equal(g.state.clock,before.clock);assert.equal(g.state.money,before.money);
  const restored=new Game(parseSave(g.exportSave()));assert.equal(restored.state.scene.selected,1);
  restored.choose(restored.state.scene.selected);
  assert.equal(restored.state.clock,before.clock+120);assert.equal(restored.state.money,before.money+25000);
  assert.equal(restored.state.stats.housekeeping,6);assert.equal(restored.state.scene,null);
});
test('배고픔과 피로는 시간에 따라 쌓이고 음식과 수면으로 회복한다', () => {
  const g=atPlace('room',20*60);g.state.needs.fatigue=90;g.state.needs.hunger=80;
  g.useItem('snack');assert.ok(g.state.needs.hunger<80);assert.equal(g.state.inventory.snack,0);
  g.action('sleep');assert.equal(g.state.clock,1440+7*60);assert.ok(g.state.needs.fatigue<15);
});
test('밤의 옛 역은 한 번만 발생하며 조건부 대화를 위한 아이템을 준다', () => {
  const g=started();g.advanceMinutes(20*60-g.state.clock);g.bus('old');
  assert.equal(g.state.scene.id,'night_ticket');g.choose(0);assert.equal(g.state.inventory.odd_ticket,1);
  g.walk('river');g.walk('old');assert.equal(g.state.scene,null);
});
test('장시간 수면이 납부 시각을 지나면 정확히 한 번 월세를 납부한다', () => {
  const g=atPlace('room',6*1440+20*60);g.state.money=100000;
  g.action('sleep');assert.equal(g.state.money,20000);assert.equal(g.state.rent.debt,0);
  assert.equal(g.state.journal.filter(e=>e.kind==='rent').length,1);
});
test('연체 1 → 2 → 3주와 퇴거, 연체료 상한 및 임시 숙소에서 복귀한다', () => {
  const g=atPlace('room');g.state.money=0;
  g.advanceMinutes(g.state.rent.nextDue-g.state.clock);
  assert.equal(g.state.rent.weeksMissed,1);assert.equal(g.state.rent.lateFee,0);
  g.advanceMinutes(7*1440);assert.equal(g.state.rent.weeksMissed,2);assert.equal(g.state.rent.lateFee,8000);
  g.advanceMinutes(7*1440);assert.ok(g.state.rent.evictionAt);assert.equal(g.state.rent.housing,'room');
  g.advanceMinutes(7*1440);assert.equal(g.state.rent.housing,'shelter');assert.equal(g.state.rent.lateFee,24000);
  assert.equal(g.state.rent.nextDue,null);
  assert.deepEqual(parseSave(g.exportSave()),g.state);
  g.state.money=g.rentTotal();g.action('rent');assert.equal(g.state.rent.housing,'room');
  assert.equal(g.state.money,0);assert.equal(g.state.rent.debt,0);assert.ok(g.state.rent.nextDue>g.state.clock);
});
test('퇴거 기한 직전에 밀린 월세를 갚으면 퇴거하지 않는다', () => {
  const g=atPlace('room');g.state.money=0;
  g.advanceMinutes(g.state.rent.nextDue-g.state.clock+14*1440);
  assert.ok(g.state.rent.evictionAt);g.state.money=g.rentTotal();g.action('rent');
  assert.equal(g.state.rent.evictionAt,null);assert.equal(g.state.rent.housing,'room');
});
test('모든 진행 데이터는 저장 후 그대로 복원되고 이후 진행도 같다', () => {
  const g=atPlace('cafe');g.action('talk_minjae');g.choose(0);g.action('cafe_shift');g.selectChoice(2);
  const restored=new Game(parseSave(g.exportSave()));assert.deepEqual(restored.state,g.state);
  g.choose(2);restored.choose(2);assert.deepEqual(restored.state,g.state);
});
test('잘못된 버전, 음수 자원, 없는 장소, 과거 납부 시각은 파일 불러오기에서 거절한다', () => {
  const original=started();
  for (const edit of [f=>f.version=99,f=>f.state.money=-1,f=>f.state.street='missing',f=>f.state.rent.nextDue=f.state.clock,f=>f.state.needs.hunger=null,f=>f.state.scene={id:'missing',selected:null}]) {
    const f=JSON.parse(original.exportSave());edit(f);assert.throws(()=>parseSave(JSON.stringify(f)));
  }
  assert.throws(()=>parseSave('bad json'));assert.throws(()=>parseSave('x'.repeat(1000001)));
  assert.equal(original.state.street,'home');
});
test('플레이 30일 후에도 연체, 기록, 하루 제한 정보가 저장 규격에 맞는다', () => {
  const g=started();g.advanceMinutes(30*1440);
  assert.equal(dayNumber(g.state.clock),30);assert.deepEqual(parseSave(g.exportSave()),g.state);
});
