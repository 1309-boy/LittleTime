import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { SaveSlots } from '../src/save-slots.js';
function fixture() {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value) };
  return { data, storage, slots: new SaveSlots(() => storage) };
}
test('10개 슬롯이 독립적으로 저장되고 새 게임과 덮어쓰기가 다른 슬롯을 바꾸지 않는다', () => {
  const {slots}=fixture(); const game=new Game(); game.choose(0);
  assert.equal(slots.list().length,10);
  for(let slot=1;slot<=10;slot++) { game.wait(5); slots.save(slot,game); }
  assert.equal(slots.load(1).clock,460); assert.equal(slots.load(10).clock,505);
  slots.save(1,new Game()); assert.equal(slots.load(1).clock,450); assert.equal(slots.load(10).clock,505);
});
test('저장 이후 진행이 슬롯의 시간과 상태를 바꾸지 않는다', () => {
  const {slots}=fixture(); const game=new Game(); game.choose(0); game.bus('market'); game.enter('store'); game.wait(30); game.action('store_shift');
  const saved=game.capture(); slots.save(3,game); game.wait(60);
  assert.deepEqual(slots.load(3),saved); assert.equal(slots.inspect(3).status,'saved');
});
test('용량 부족으로 저장에 실패하면 기존 슬롯을 유지한다', () => {
  const {slots,storage}=fixture(); const game=new Game(); slots.save(1,game);
  const original=slots.load(1); game.choose(0); storage.setItem=()=>{throw new Error('QuotaExceededError');};
  assert.throws(()=>slots.save(1,game),/저장할 수 없어/); assert.deepEqual(slots.load(1),original);
});
test('빈 슬롯, 손상된 데이터, 저장소 차단과 잘못된 번호를 처리한다', () => {
  const {slots,data}=fixture(); assert.equal(slots.inspect(1).status,'empty'); assert.throws(()=>slots.load(1),/비어/);
  data.set(slots.key(2),'broken'); assert.equal(slots.inspect(2).status,'invalid'); assert.throws(()=>slots.load(2),/읽을 수 없어/);
  const blocked=new SaveSlots(()=>{throw new Error('SecurityError');}); assert.equal(blocked.inspect(1).status,'unavailable');
  assert.throws(()=>blocked.save(1,new Game()),/저장할 수 없어/);
  for(const id of [0,11,1.5,'1']) assert.throws(()=>slots.inspect(id),/1~10/);
});
