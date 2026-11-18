# 모몽가의 작은세계

Three.js 탐험 게임. 제작자: 서찬아.

## 실행
Node 24.22 이상. `npm ci`, `npm run dev` 후 안내된 로컬 주소를 엽니다. `npm run build`는 Cloudflare 배포물을 생성하고 `npm run preview`는 실제 Workers 런타임으로 로컬 배포본을 실행합니다.
인트로에서 게임 시작 → 이름(2~12글자) 입력 → 함께 모험하기.

## 조작
- WASD 이동, Q를 누르는 동안 상승/활강, Q를 놓으면 서서히 하강, E 빠른 하강, R 공격.
- 드래그로 카메라, 휠로 거리. NPC·음식·토벌 보상은 클릭합니다.
- 인사/응원으로 다른 플레이어에게 반응할 수 있습니다. 나가기는 세션을 끝내고 첫 화면으로 돌아갑니다.

## 멀티플레이와 기록
Cloudflare Workers Static Assets + SQLite 기반 Durable Object의 WebSocket Hibernation을 사용합니다. 하나의 공개 방에 최대 20명이며 네 맵을 함께 탐험합니다. 같은 맵에서 이름과 이동·비행·공격·인사를 공유합니다. NPC, 토벌, HP, 음식과 인벤토리·의뢰는 각자 진행합니다. 협동 보스 HP나 플레이어 간 아이템 거래는 공유하지 않습니다.
이름·게임 데이터는 DB에 쓰지 않으며 브라우저 저장소에도 저장하지 않습니다. 연결 중인 위치와 이름만 WebSocket attachment에 보관하고 연결 종료 시 제거됩니다. 새로고침/재접속은 새 게임입니다. 이전 버전의 `momonga-save-v1` 저장값은 지웁니다. 애플리케이션 로그/트레이스 수집도 비활성화했습니다. Cloudflare 자체의 보안·접속 메타데이터 보관 정책은 별개입니다.

## 무료 사용량
2026-11-18 공식 문서 기준, DO 요청 100,000/일, 실행시간 13,000 GB-s/일. 수신 WebSocket 메시지 20개를 요청 1개로 계산하며 송신 메시지는 요청 과금에 포함하지 않습니다. 접속 수 자체의 무료 고정 상한은 아니며 계정 전체 사용량과 접속시간에 좌우됩니다.
이 앱은 최대 20명으로 제한했습니다. 움직임을 초당 최대 5회 전송하므로 20명이 계속 움직이면 시간당 약 18,000 요청(연결·하트비트 별도), 무료 요청량으로 약 5.5시간입니다. 24시간 내내 같은 속도로 움직이는 경우 계산상 약 4명 수준입니다. 유휴 시 이동 전송은 생략하고 20초 자동응답 하트비트만 사용하므로 실제 소모량은 행동에 따라 달라집니다. 이 수치는 추정이며 계정의 다른 Workers 사용량도 고려해야 합니다. 한 객체가 하루 종일 활성 상태라면 128MiB × 86400초 = 10800 GB-s입니다. 무료 한도 초과 시 해당 요청은 실패하며 자동 유료 전환은 설정하지 않았습니다.
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/

## 배포
GitHub: https://github.com/gud8238/momonga1
`cloudflare.config.ts`, `vite.config.ts`가 Workers와 GameRoom 클래스를 정의합니다. Cloudflare CLI 로그인 후 `npm run deploy`를 실행합니다. `cf`와 Vite plugin 2.0 RC 버전을 고정합니다. CI용 키는 GitHub Secrets에만 두며 소스에 넣지 않습니다.
`scripts/stage-assets.mjs`는 허용한 모델·인트로 이미지·게임 manifest 음원만 `.public`에 복사합니다. API 키, 원본 녹음, 로그, Blender 파일 및 생성 도구는 배포되지 않습니다. Gemini 키는 로컬 제작용이며 배포/게임 실행에는 필요하지 않습니다.

## 에셋과 기능
첨부 인트로 이미지를 그대로 사용하며 제목은 Jua 글꼴과 CSS로 구성했습니다. GPT 생성 참고 이미지를 바탕으로 만든 Blender 원본은 Momonga-rigged.blend, NPC-characters.blend, Anoko-rigged.blend, Siren-rigged.blend입니다.
동굴 아노코/열대우림 세이렌 출현 후 토벌을 수락하면 전투합니다. 보스가 쓰러지면 0.5초 간격으로 2초 점멸 후 필드에 보상이 떨어집니다. 클릭으로 수집하고 안내는 2초 후 사라집니다. 숲의 음식·마을 의뢰·아이템 판매도 사용할 수 있습니다.
확정한 음성 2와 맵별 낮/밤 BGM을 사용합니다. 열대우림 밤은 10% 느린 버전입니다. 소리 켜기 버튼으로 재생하며 공격·피격·물보라 효과음도 포함됩니다.

## 검증
`npm test`는 로컬 배포본(http://127.0.0.1:8787)을 대상으로 두 브라우저 동기화, 20명 입장/21번째 거절, 이름 검증, 종료 정리, 새 게임 초기화, 비밀 파일 차단을 검사합니다. `TEST_URL` 환경 변수로 별도 검증 서버를 지정할 수 있습니다. 게임 동작 테스트는 `check-combat.cjs`, `check-hold.cjs`, `check-quest.cjs`에 있습니다.
