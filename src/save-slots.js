import { parseSave } from './engine.js';

export const SLOT_COUNT = 10;
const PREFIX = 'LittleTime.slot.v1.';

// 자동 저장과 슬롯은 서로 다른 키를 사용합니다. 새 게임도 슬롯을 지우지 않습니다.
export class SaveSlots {
  constructor(getStorage) { this.getStorage = getStorage; }
  key(slot) {
    if (!Number.isInteger(slot) || slot < 1 || slot > SLOT_COUNT) throw new Error('슬롯은 1~10 중에서 골라 줘.');
    return `${PREFIX}${slot}`;
  }
  inspect(slot) {
    const key = this.key(slot);
    let raw;
    try { raw = this.getStorage().getItem(key); }
    catch { return { slot, status: 'unavailable' }; }
    if (raw === null) return { slot, status: 'empty' };
    try {
      const state = parseSave(raw);
      const savedAt = JSON.parse(raw).savedAt;
      return { slot, status: 'saved', state, savedAt: typeof savedAt === 'string' && Number.isFinite(Date.parse(savedAt)) ? savedAt : null };
    } catch { return { slot, status: 'invalid' }; }
  }
  list() { return Array.from({ length: SLOT_COUNT }, (_, i) => this.inspect(i + 1)); }
  save(slot, game) {
    const key = this.key(slot);
    const raw = game.exportSave();
    parseSave(raw);
    try { this.getStorage().setItem(key, raw); }
    catch { throw new Error('브라우저에 저장할 수 없어. 저장 파일 내려받기를 이용해 줘.'); }
  }
  load(slot) {
    const entry = this.inspect(slot);
    if (entry.status === 'unavailable') throw new Error('브라우저 저장소에 접근할 수 없어.');
    if (entry.status === 'invalid') throw new Error('이 슬롯의 저장 데이터를 읽을 수 없어. 현재 진행은 유지돼.');
    if (entry.status === 'empty') throw new Error('아직 비어 있는 슬롯이야.');
    return entry.state;
  }
}
