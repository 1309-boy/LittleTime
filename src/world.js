// 밸런스와 장소, 행동, 대사는 이 파일에서 편집합니다.
export const CONFIG = Object.freeze({
  gameId: 'LittleTime', saveVersion: 1, walkMinutes: 5,
  busMinutes: 5, busFare: 1500, weeklyRent: 80000,
  startDate: '2026-04-06', startMinute: 7 * 60 + 30,
});

export const STAT_NAMES = {
  strength: '힘', stamina: '체력', appearance: '외모',
  deception: '속임수', dance: '춤', housekeeping: '가사', study: '학업',
};
export const NEED_NAMES = { stress: '스트레스', fatigue: '피로도', hunger: '배고픔' };

export const STREETS = {
  home: { name: '주택가', caption: '하루가 시작되는 곳', x: 16, y: 23, art: 'home',
    links: ['school', 'square', 'market'], places: ['room', 'landlord'],
    description: ['낮은 주택 사이로 아침 햇살이 스며든다.', '내 방은 오래된 건물 2층에 있다. 오늘도 하루를 잘 살아내야 한다.'],
    night: ['대부분의 창문이 어둡다. 아직 불이 켜진 방이 몇 개 보인다.', '익숙한 계단을 오르면 작은 방이 나를 기다린다.'] },
  school: { name: '학교 앞 거리', caption: '종소리와 익숙한 얼굴', x: 50, y: 14, art: 'school',
    links: ['home', 'square', 'library'], places: ['classroom'],
    description: ['교문 옆 게시판에는 축제 준비 안내가 붙어 있다.', '교복을 입은 학생들이 하나둘 학교로 들어간다.'],
    night: ['교문이 닫혀 있다. 텅 빈 운동장 너머로 교실 창문이 보인다.'] },
  library: { name: '도서관 거리', caption: '조용한 책장 사이', x: 84, y: 23, art: 'library',
    links: ['school', 'river'], places: ['reading'],
    description: ['길 건너 도서관의 문이 열려 있다.', '책장을 넘기는 소리와 오래된 종이 냄새가 마음을 가라앉힌다.'],
    night: ['도서관 앞 가로등이 조용히 빛난다. 늦은 독자들이 집으로 돌아간다.'] },
  square: { name: '중앙 거리', caption: '엇갈리는 하루들', x: 50, y: 48, art: 'square',
    links: ['home', 'school', 'market', 'river'], places: ['studio'],
    description: ['신호등 앞에서 사람들이 잠시 멈춰 선다.', '여기서 마을의 여러 거리로 갈 수 있다. 골목 안에는 작은 연습실이 있다.'],
    night: ['가게 간판 사이로 버스의 불빛이 지나간다.', '어딘가에서 낮게 음악 소리가 들린다.'] },
  market: { name: '상점가', caption: '일과 한 끼의 온기', x: 16, y: 72, art: 'market',
    links: ['home', 'square', 'old'], places: ['store', 'cafe'],
    description: ['빵 냄새가 나는 카페와 작은 편의점이 나란히 서 있다.', '가게 창문에 아르바이트 모집 종이가 붙어 있다.'],
    night: ['밝은 편의점이 어두운 거리를 비추고 있다.', '마지막 손님들이 카페를 나선다.'] },
  river: { name: '강변 거리', caption: '숨을 고르는 자리', x: 84, y: 72, art: 'river',
    links: ['library', 'square', 'old'], places: ['park'],
    description: ['강을 따라 느린 바람이 분다.', '산책하는 사람들과 빈 벤치 몇 개가 보인다.'],
    night: ['강물 위에 불빛이 길게 흔들린다.', '멀리서 자전거 한 대가 지나간다.'] },
  old: { name: '옛 역 거리', caption: '기억에 없는 정류장', x: 50, y: 86, art: 'old',
    links: ['market', 'river'], places: ['station'],
    description: ['쓰이지 않는 역 건물 앞에 오래된 정류장이 남아 있다.', '시간표는 빛이 바랬다. 사람의 흔적은 거의 보이지 않는다.'],
    night: ['분명 전기가 끊긴 정류장인데, 시간표 아래 작은 등이 켜져 있다.', '노선도에는 처음 보는 거리 이름이 적혀 있다.'] },
};

export const PLACES = {
  room: { street: 'home', name: '자취방', description: ['책상 하나, 작은 침대 하나. 넓지는 않지만 내 하루가 돌아오는 곳이다.'],
    actions: ['cook', 'eat_rice', 'sleep', 'nap', 'clean', 'groom', 'study_home', 'rent'] },
  landlord: { street: 'home', name: '집주인 사무실', description: ['문 옆 달력에 이번 주 납부일이 표시되어 있다.'], actions: ['talk_landlord', 'rent'] },
  classroom: { street: 'school', name: '학교', hours: [8 * 60, 17 * 60], weekdays: true,
    description: ['책상 위에 시간표와 교과서가 놓여 있다.', '복도에서 익숙한 친구의 목소리가 들린다.'], actions: ['class', 'school_meal', 'talk_harin'] },
  reading: { street: 'library', name: '마을 도서관', hours: [9 * 60, 21 * 60],
    description: ['창가 자리가 비어 있다. 책상마다 작은 조명이 켜져 있다.'], actions: ['study_library', 'read', 'talk_seoyun'] },
  studio: { street: 'square', name: '춤 연습실', hours: [10 * 60, 22 * 60],
    description: ['거울 앞 바닥에 희미한 발자국이 남아 있다.', '한 시간 동안 연습실을 빌릴 수 있다.'], actions: ['dance'] },
  store: { street: 'market', name: '편의점', description: ['진열대에는 도시락과 간식이 놓여 있다. 계산대 뒤에서 직원이 손을 흔든다.'],
    actions: ['buy_meal', 'buy_snack', 'buy_rice', 'store_shift'] },
  cafe: { street: 'market', name: '카페 느린 오후', hours: [9 * 60, 22 * 60],
    description: ['스팀이 올라오는 커피 머신 옆에서 민재가 주문을 받고 있다.', '카운터 한편에 아르바이트 시간표가 놓여 있다.'], actions: ['cafe_shift', 'talk_minjae', 'help_minjae', 'coffee'] },
  park: { street: 'river', name: '강변 공원', description: ['벤치와 작은 운동 기구가 있다. 급하게 서두르는 사람은 없어 보인다.'], actions: ['workout', 'rest_park'] },
  station: { street: 'old', name: '오래된 정류장', description: ['노선도 아래 구겨진 종이 한 장이 바람에 흔들린다.'], actions: ['inspect_station'] },
};

export const ITEMS = {
  rice: { name: '식재료', description: '밥 한 끼를 만들 수 있는 재료.', consumable: false },
  meal: { name: '도시락', description: '언제든 먹을 수 있는 든든한 한 끼.', consumable: true, duration: 15, effects: { needs: { hunger: -45, stress: -3 } } },
  snack: { name: '간식', description: '출출할 때 잠깐 힘이 된다.', consumable: true, duration: 5, effects: { needs: { hunger: -15, stress: -2 } } },
  notebook: { name: '공책', description: '수업과 일상의 메모를 담은 공책.', consumable: false },
  odd_ticket: { name: '날짜 없는 승차권', description: '노선도에도 없는 목적지가 적혀 있다. 뒷면은 이상할 만큼 깨끗하다.', consumable: false },
};

export const NPCS = {
  harin: { name: '하린', role: '같은 반 친구', street: 'school', place: 'classroom', initialTrust: 0, note: '학교에서 마주치는 익숙한 얼굴.' },
  minjae: { name: '민재', role: '카페 아르바이트 동료', street: 'market', place: 'cafe', initialTrust: 0, note: '바쁜 시간에도 주변을 잘 챙긴다.' },
  seoyun: { name: '서윤', role: '도서관 자원봉사자', street: 'library', place: 'reading', initialTrust: 0, note: '오래된 마을 이야기를 좋아한다.' },
  landlord: { name: '박정숙', role: '집주인', street: 'home', place: 'landlord', initialTrust: 15, note: '매주 일요일 밤 9시에 월세를 확인한다.' },
};

export const ACTIONS = {
  cook: { label: '간단한 밥을 만들어 먹는다', duration: 30, itemsRequired: { rice: 1 },
    effects: { inventory: { rice: -1 }, needs: { hunger: -55, stress: -5 }, stats: { housekeeping: 1 } }, result: '따뜻한 한 끼를 만들었다. 방 안에 밥 냄새가 남는다.' },
  eat_rice: { label: '도시락을 먹는다', duration: 15, itemsRequired: { meal: 1 }, effects: { inventory: { meal: -1 }, needs: { hunger: -45, stress: -3 } }, result: '천천히 도시락을 비웠다.' },
  sleep: { label: '다음 아침 07:00까지 잔다', duration: 'sleep', effects: { needs: { fatigue: -85, stress: -22 } }, result: '창문 사이로 빛이 들어온다. 다시 하루를 시작할 시간이다.' },
  nap: { label: '한 시간 눈을 붙인다', duration: 60, sleeping: true, effects: { needs: { fatigue: -25, stress: -6 } }, result: '짧은 잠을 자고 나니 머리가 조금 맑아졌다.' },
  clean: { label: '방을 청소한다', duration: 30, housingRequired: 'room', effects: { needs: { fatigue: 5, stress: -7 }, stats: { housekeeping: 1 } }, result: '널려 있던 물건을 정리했다. 좁은 방이 조금 넓어 보인다.' },
  groom: { label: '씻고 옷차림을 정돈한다', duration: 20, daily: true, effects: { stats: { appearance: 1 }, needs: { stress: -4 } }, result: '거울 앞에서 옷매무새를 정돈했다.' },
  study_home: { label: '책상에서 공부한다', duration: 60, effects: { stats: { study: 1 }, needs: { fatigue: 7, stress: 3 } }, result: '모르는 문제를 공책에 정리했다.' },
  rent: { label: '밀린 월세를 납부한다', duration: 5, special: 'rent' },
  talk_landlord: { label: '집주인과 이야기한다', scene: 'landlord_talk', daily: true },
  class: { label: '수업에 참여한다', duration: 120, hours: [8 * 60 + 30, 15 * 60], weekdays: true, daily: true, maxFatigue: 95,
    effects: { stats: { study: 2 }, needs: { fatigue: 9, stress: 4 } }, result: '종소리가 울린다. 오늘 수업에서 배운 내용을 공책에 적었다.' },
  school_meal: { label: '학교에서 점심을 먹는다', duration: 30, hours: [11 * 60 + 30, 14 * 60], price: 3500, daily: true,
    effects: { needs: { hunger: -55, stress: -3 } }, result: '따뜻한 급식을 먹었다. 식판을 비우고 교실로 돌아왔다.' },
  talk_harin: { label: '하린과 이야기한다', npc: 'harin', firstScene: 'harin_meet', scene: 'harin_chat', daily: true },
  study_library: { label: '조용히 공부한다', duration: 60, effects: { stats: { study: 2 }, needs: { fatigue: 6, stress: 2 } }, result: '한 페이지씩 풀다 보니 어느새 시간이 흘렀다.' },
  read: { label: '책을 읽으며 쉰다', duration: 30, effects: { needs: { stress: -12, fatigue: -3 } }, result: '책 속의 이야기를 따라가며 잠시 걱정을 내려놓았다.' },
  talk_seoyun: { label: '서윤과 이야기한다', npc: 'seoyun', firstScene: 'seoyun_meet', scene: 'seoyun_chat', daily: true },
  dance: { label: '춤을 연습한다', duration: 60, price: 3000, maxFatigue: 85,
    effects: { stats: { dance: 2, stamina: 1 }, needs: { fatigue: 14, stress: -10 } }, result: '음악에 맞춰 몇 번이고 같은 동작을 연습했다.' },
  buy_meal: { label: '도시락을 산다', duration: 5, price: 4500, effects: { inventory: { meal: 1 } }, result: '가방에 도시락 하나를 넣었다.' },
  buy_snack: { label: '간식을 산다', duration: 5, price: 1500, effects: { inventory: { snack: 1 } }, result: '간식 하나를 샀다.' },
  buy_rice: { label: '식재료를 산다', duration: 5, price: 2500, effects: { inventory: { rice: 1 } }, result: '집에서 요리할 식재료를 샀다.' },
  store_shift: { label: '편의점에서 진열 아르바이트를 한다', duration: 120, hours: [8 * 60, 22 * 60], maxFatigue: 85,
    effects: { money: 24000, stats: { strength: 1 }, needs: { fatigue: 17, stress: 8 } }, result: '상자를 옮기고 진열대를 채웠다. 오늘 일한 급여를 받았다.' },
  cafe_shift: { label: '카페 아르바이트를 한다', scene: 'cafe_shift', hours: [9 * 60, 20 * 60], maxFatigue: 85 },
  talk_minjae: { label: '민재와 이야기한다', npc: 'minjae', firstScene: 'minjae_meet', scene: 'minjae_chat', daily: true },
  help_minjae: { label: '민재에게 추가 일자리를 부탁한다', duration: 120, hours: [9 * 60, 22 * 60], maxFatigue: 85, weekly: true,
    conditions: { minTrust: { minjae: 12 }, hasDebt: true }, effects: { money: 35000, needs: { fatigue: 20, stress: 7 }, relations: { minjae: { trust: 2 } } }, result: '민재가 소개해 준 마감 일을 도왔다. 덕분에 급한 돈을 마련했다.' },
  coffee: { label: '음료를 마시며 잠시 쉰다', duration: 20, price: 3000, effects: { needs: { stress: -8, fatigue: -5 } }, result: '창가에서 음료를 마셨다. 거리의 사람들이 천천히 지나간다.' },
  workout: { label: '운동한다', duration: 40, maxFatigue: 85, effects: { stats: { strength: 1, stamina: 1 }, needs: { fatigue: 12, stress: -6 } }, result: '몸을 움직이니 잡생각이 조금 줄어들었다.' },
  rest_park: { label: '벤치에서 쉰다', duration: 30, effects: { needs: { fatigue: -9, stress: -10 } }, result: '강바람을 맞으며 잠깐 숨을 골랐다.' },
  inspect_station: { label: '정류장의 시간표를 살펴본다', duration: 10, effects: { needs: { stress: -2 } }, result: '지워진 노선도에는 읽을 수 없는 거리 이름이 남아 있다.' },
};

export const SCENES = {
  intro: { title: '작은 시간들', kicker: '첫 번째 월요일',
    text: ['알람이 울린다. 창밖에서는 누군가 학교로 뛰어가는 소리가 들린다.', '책상 위에는 학교 시간표와 집주인의 쪽지가 놓여 있다.', '「월세는 매주 일요일 밤 9시, 80,000원. 잊지 말아요.」', '공부도, 일도, 밥도 챙겨야 한다. 이 작은 마을에서 내 하루가 시작된다.'],
    choices: [{ label: '하루를 시작한다', duration: 5, effects: { flags: { started: true } }, result: '가방을 챙겼다. 학교에 가기 전에 밥을 먹어도 좋겠다.' }] },
  harin_meet: { title: '옆자리의 친구', kicker: '하린', text: ['“너 이 근처에서 혼자 산다고 했지?”', '하린이 내 책상 옆에 서서 말을 건다. 손에는 축제 안내장이 들려 있다.'],
    choices: [
      { label: '응. 아직 익숙하지는 않아.', duration: 10, effects: { relations: { harin: { affection: 5, trust: 7 } }, flags: { met_harin: true } }, result: '“모르는 거 있으면 물어봐.” 하린이 웃으며 자기 자리로 돌아갔다.' },
      { label: '이제 혼자 살아도 아무 문제 없어.', duration: 10, effects: { stats: { deception: 1 }, relations: { harin: { affection: 2, trust: 3 } }, flags: { met_harin: true } }, result: '나는 자신 있는 척했다. 하린은 알겠다는 듯 고개를 끄덕였다.' },
    ] },
  harin_chat: { title: '잠깐의 수다', kicker: '하린', text: ['“이번 축제에 우리 반도 뭔가 해야 한대.”', '하린이 어떤 걸 해 보면 좋겠냐며 내 의견을 묻는다.'],
    choices: [
      { label: '같이 준비하자고 한다', duration: 15, effects: { relations: { harin: { affection: 4, trust: 4 } }, needs: { stress: -6 } }, result: '조금씩 의견을 나누다 보니 하린과 가까워진 것 같다.' },
      { label: '자신은 준비에 익숙하다고 둘러댄다', duration: 15, effects: { stats: { deception: 1 }, relations: { harin: { affection: 2, trust: -2 } } }, result: '말은 쉽게 나왔지만, 이제 진짜 준비를 해야 할지도 모른다.' },
    ] },
  minjae_meet: { title: '느린 오후의 동료', kicker: '민재', text: ['“아르바이트 하러 왔어? 처음이면 내가 알려 줄게.”', '민재는 카운터를 정리하다가 나를 향해 손을 흔든다.'],
    choices: [
      { label: '잘 부탁한다고 인사한다', duration: 10, effects: { relations: { minjae: { affection: 4, trust: 6 } }, flags: { met_minjae: true } }, result: '민재에게 간단한 일의 순서를 배웠다.' },
      { label: '마을에 관해 물어본다', duration: 10, effects: { relations: { minjae: { affection: 3, trust: 4 } }, flags: { met_minjae: true } }, result: '“옛 역 쪽은 밤에 별로 갈 일이 없을 거야.” 민재가 잠깐 말을 멈췄다.' },
    ] },
  minjae_chat: { title: '마감 전의 이야기', kicker: '민재', text: ['“오늘은 어땠어? 학교랑 일을 같이 하려면 힘들겠다.”', '민재가 따뜻한 물 한 잔을 건네준다.'],
    choices: [
      { label: '요즘의 고민을 털어놓는다', duration: 15, effects: { relations: { minjae: { affection: 3, trust: 6 } }, needs: { stress: -8 } }, result: '혼자 걱정하던 이야기를 꺼냈다. 민재가 끝까지 들어 주었다.' },
      { label: '다음에 일을 같이 하자고 한다', duration: 15, effects: { relations: { minjae: { affection: 4, trust: 4 } } }, result: '서로의 일정을 확인했다. 믿을 만한 동료가 생긴 기분이다.' },
    ] },
  cafe_shift: { title: '오늘 맡을 일', kicker: '카페 아르바이트 · 2시간', mode: 'radio',
    text: ['앞치마를 매고 시간표를 확인한다.', '어떤 일을 맡을지 고른 뒤 다음을 누르자. 급여는 25,000원이다.'],
    choices: [
      { label: '홀 정리와 서빙', duration: 120, effects: { money: 25000, stats: { stamina: 1 }, needs: { fatigue: 16, stress: 6 }, relations: { minjae: { trust: 1 } } }, result: '테이블을 정리하고 주문을 옮겼다. 두 시간이 금방 지나갔다.' },
      { label: '주방 보조', duration: 120, effects: { money: 25000, stats: { housekeeping: 1 }, needs: { fatigue: 18, stress: 5 }, relations: { minjae: { trust: 1 } } }, result: '재료를 준비하고 설거지를 도왔다. 손에 익는 일이 조금 늘었다.' },
      { label: '카운터와 손님 응대', duration: 120, effects: { money: 25000, stats: { appearance: 1 }, needs: { fatigue: 12, stress: 10 }, relations: { minjae: { trust: 1 } } }, result: '주문을 받으며 여러 손님과 대화를 나눴다.' },
    ] },
  seoyun_meet: { title: '이름 없는 노선', kicker: '서윤', text: ['“혹시 마을에 오래 살았어?”', '서윤이 오래된 마을 지도를 펼친다. 한 구석에 지금은 없는 역이 표시되어 있다.'],
    choices: [
      { label: '지도에 대해 물어본다', duration: 10, effects: { relations: { seoyun: { affection: 3, trust: 5 } }, flags: { met_seoyun: true } }, result: '“예전에는 밤에만 다니는 버스가 있었대.” 서윤은 소문일 뿐이라며 웃었다.' },
      { label: '다음에 같이 찾아보자고 한다', duration: 10, effects: { relations: { seoyun: { affection: 5, trust: 4 } }, flags: { met_seoyun: true } }, result: '서윤이 책갈피에 내 이름을 적었다.' },
    ] },
  seoyun_chat: { title: '책장 사이의 소문', kicker: '서윤', text: ['서윤이 오래된 신문 묶음을 내민다.', '“역이 문을 닫던 날, 마지막 버스에 누가 탔는지 기록이 없대.”'],
    choices: [
      { label: '함께 기록을 읽는다', duration: 20, effects: { stats: { study: 1 }, relations: { seoyun: { trust: 5, affection: 3 } }, needs: { stress: -4 } }, result: '오래된 날짜들을 공책에 적었다. 언젠가 도움이 될지도 모른다.' },
      { label: '승차권을 보여 준다', duration: 15, conditions: { hasItem: { odd_ticket: 1 } }, effects: { relations: { seoyun: { trust: 8 } }, flags: { ticket_shared: true } }, result: '서윤의 표정이 잠깐 굳었다. “이걸 어디서 구했어?” 다음 이야기는 아직 남아 있다.' },
    ] },
  landlord_talk: { title: '달력의 빨간 동그라미', kicker: '박정숙', text: ['“학교는 잘 다니고 있니? 밥도 챙겨 먹고.”', '집주인이 달력을 넘긴다. 일요일에 동그라미가 그려져 있다.'],
    choices: [
      { label: '잊지 않겠다고 이야기한다', duration: 10, effects: { relations: { landlord: { trust: 2 } } }, result: '박정숙이 고개를 끄덕였다. 일요일 밤 9시, 돈이 충분하면 월세가 자동 납부된다.' },
      { label: '이번 주는 잘될 거라고 자신 있게 말한다', duration: 10, effects: { stats: { deception: 1 }, relations: { landlord: { trust: -1 } } }, result: '통장 잔액이 떠올랐다. 말에 맞게 하루를 보내야 할 것 같다.' },
    ] },
  night_ticket: { title: '다음 정류장은', kicker: '옛 역 거리 · 밤',
    illustration: 'station', image: { src: './assets/ticket.svg', alt: '날짜가 없는 작은 승차권' },
    text: ['정류장의 스피커에서 잡음이 새어 나온다.', '「다음 정류장은……」', '그 뒤의 말은 들리지 않는다. 발밑에는 방금 떨어진 듯한 승차권이 놓여 있다.'],
    choices: [
      { label: '승차권을 줍는다', duration: 5, effects: { inventory: { odd_ticket: 1 }, flags: { station_seen: true }, needs: { stress: 8 } }, result: '종이는 차갑다. 날짜가 적혀 있어야 할 자리가 비어 있다.' },
      { label: '조용히 돌아선다', duration: 5, effects: { flags: { station_seen: true }, needs: { stress: 3 } }, result: '걸음을 옮기자 잡음이 멈췄다. 뒤돌아보니 작은 등도 꺼져 있다.' },
    ] },
};
