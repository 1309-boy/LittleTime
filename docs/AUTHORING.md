# 콘텐츠 작성

첫 버전의 모든 콘텐츠는 `src/world.js`에 있습니다. UI나 시간 엔진을 수정하지 않고 거리, 장소, 행동, 대화를 추가할 수 있습니다.

## 거리와 장소

`STREETS`에 고유 ID를 추가하고 `links`에 연결할 거리 ID를 넣습니다. 연결 상대편의 `links`에도 새 ID를 넣어 양방향으로 연결합니다. `x`, `y`는 지도상의 0~100 위치입니다.

장소는 `PLACES`에 등록하고 거리의 `places` 목록에 ID를 넣습니다. `hours: [540, 1260]`은 09:00~21:00을 뜻하고, `weekdays: true`는 평일만 열리는 장소입니다. 문 앞을 들어가고 나가는 데는 시간이 들지 않습니다.

## 행동

아래처럼 `ACTIONS`에 넣고 장소의 `actions`에 ID를 추가합니다.

```js
practice: {
  label: '춤을 연습한다',
  duration: 60,
  price: 3000,
  maxFatigue: 85,
  effects: {
    stats: { dance: 2 },
    needs: { fatigue: 14, stress: -10 },
  },
  result: '같은 동작을 몇 번이고 연습했다.',
},
```

`duration`은 분입니다. `price`는 시작할 때 차감하고, `effects.money`는 행동을 마친 뒤 지급합니다. 소모품의 요구 조건은 `itemsRequired: { rice: 1 }`, 소모 효과는 `effects.inventory: { rice: -1 }`로 각각 작성합니다.

`daily: true`와 `weekly: true`는 하루/주당 한 번의 제한입니다. 열린 시간 안에 행동 전체를 마칠 수 있어야 합니다.

## 대화

```js
new_scene: {
  title: '방과 후의 약속',
  kicker: '하린',
  text: ['“오늘 시간 있어?”', '하린이 교문 앞에서 손을 흔든다.'],
  choices: [
    {
      label: '같이 걷는다',
      duration: 15,
      effects: { relations: { harin: { affection: 3, trust: 2 } } },
      result: '집으로 가는 길에 이런저런 이야기를 나눴다.',
      // next: 'another_scene', // 생략하면 대화를 끝냅니다.
    },
  ],
},
```

행동에 `scene: 'new_scene'`을 넣어 대화를 시작합니다. `npc`, `firstScene`, `scene`을 함께 지정하면 최초 만남과 이후의 대화를 나눌 수 있습니다. 첫 만남 선택의 `effects.flags`에 `met_이름: true`를 넣습니다.

`mode: 'radio'`를 넣으면 선택지를 라디오 버튼으로 표시하고 `(1) 다음`으로 확정합니다. 선택하고 확정하기 전에는 시간이 흐르지 않습니다.

## 조건

행동이나 선택지의 `conditions`에서 다음을 사용할 수 있습니다.

```js
conditions: {
  minTrust: { minjae: 12 },
  minStat: { dance: 10 },
  hasItem: { odd_ticket: 1 },
  flags: { ticket_shared: true },
  hasDebt: true,
},
```

조건을 충족하지 못한 선택지는 이유와 함께 비활성화됩니다. 꼭 필요한 조건만 지정합니다.

## 그림

장면에 다음을 넣으면 대사 아래에 이미지를 표시합니다. PNG, WebP, SVG 등을 `assets/`에 넣고 상대 경로를 지정합니다.

```js
image: { src: './assets/character.png', alt: '교문 앞에서 손을 흔드는 친구' },
```

오컬트 샘플은 `illustration: 'station'`으로 정류장 선화를, `image`로 작은 승차권 그림을 표시합니다. 선화는 `src/art.js`에서 수정할 수 있습니다.

## 세이브 변경

아이템이나 능력치의 데이터 구조를 바꾸면 `initialState()`와 저장 검증도 함께 바꿉니다. 이후 저장 규격을 바꿀 때는 `CONFIG.saveVersion`을 올리고 이전 버전 변환 코드를 추가합니다. 첫 버전은 버전 1만 지원합니다.
