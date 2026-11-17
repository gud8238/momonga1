# 모몽가의 작은 들판 | Momonga Meadow

**Three.js Low-Poly 아이소메트릭 디오라마 / 팬메이드 개인 학습용 데모**

## 무엇이 들어 있나요?
- **실제 3D 메시**: 모몽가(몸·얼굴·귀·꼬리·표정), 나무, 수풀, 바위, 그루터기, 들꽃, 나비, 언덕과 구름을 모두 Three.js의 3D 메시로 제작했습니다. **GLB 파일은 사용하지 않았습니다.**
- **GPT 이미지 시안**: `assets/diorama-concept.jpg`, `model-board.jpg`, `asset-board.jpg`. 이미지는 디자인 레퍼런스로 제공되며 실제 3D 모델로 자동 변환된 것이 아닙니다.
- **이미지 텍스처**: `assets/textures/grass-tile.png`, `flower-daisy.png`는 3D 씬의 잔디 재질과 꽃 스프라이트에서 실제 사용됩니다.
- **2가지 시점**: 아이소메트릭 디오라마 회전·확대와 1인칭 시점의 걸어 다니기.
- **인터랙션**: 모몽가 점프, 나비 비행, 노을/낮 전환, PNG 스크린샷, 원위치.

## Windows에서 실행

### 방법 A: 빠른 실행
1. ZIP 파일을 압축 해제합니다.
2. `start-windows.bat`를 더블클릭합니다. (Python 또는 `py` 명령어가 필요합니다.)
3. 브라우저에서 `http://localhost:5173`을 엽니다.

### 방법 B: VS Code / 터미널
프로젝트 폴더에서 다음을 실행합니다.

```powershell
python -m http.server 5173
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

**중요:** Three.js 코어와 Addon은 jsDelivr CDN에서 불러옵니다. 최초 실행 시 **인터넷 연결이 필요**합니다. `index.html`을 파일로 직접 여는 대신 로컬 HTTP 서버 사용을 권장합니다. 별도 npm 설치는 필요하지 않습니다.

## 조작
| 모드 | PC | Android/터치 |
| --- | --- | --- |
| 디오라마 | 드래그 회전, 휠 확대·축소 | 한 손가락 회전, 두 손가락 확대·축소 |
| 1인칭 | 산책하기 버튼 → 마우스 시점 회전 + WASD 이동, ESC 잠금 해제 | 화면 드래그로 시점 회전, 화면 왼쪽 방향 버튼으로 이동 |
| 캐릭터 | 모몽가 클릭 또는 통통! 버튼 / J / Space | 모몽가 터치 또는 통통! 버튼 |
| 보기 초기화 | R | 초기화 버튼 |
| 낮/노을 | T | 노을 전환 버튼 |
| 사진 저장 | P | 사진 저장 버튼 |
| 모드 변경 | F | 디오라마 / 산책하기 버튼 |

## 프로젝트 구조
```
momonga-meadow/
├─ index.html            # UI + Three.js importmap
├─ src/
│  ├─ main.js            # Three.js 3D 메쉬, 카메라, 조명, 애니메이션, 이벤트
│  └─ style.css          # 반응형 디자인
├─ assets/
│  ├─ diorama-concept.jpg # GPT 생성 콘셉트 이미지
│  ├─ model-board.jpg     # GPT 생성 캐릭터/자연물 에셋 보드
│  ├─ asset-board.jpg     # GPT 생성 구현 스타일 가이드
│  └─ textures/
│     ├─ grass-tile.png   # 실제 장면에서 사용
│     └─ flower-daisy.png # 실제 장면에서 사용
└─ start-windows.bat
```

## 커스터마이즈
- 캐릭터 얼굴 및 몸: `src/main.js`에서 `const momonga = new THREE.Group();` 이후.
- 꽃 배치: `flowerPositions` 배열.
- 배경 오브젝트: `tree`, `bush`, `stone`, `stump`, `addHill` 함수.
- 시점: `orthoCamera.position`, `orbit.target` 및 `fpCamera`.
- 스타일: `colors` 재질 팔레트 및 `src/style.css`.

> 원작 캐릭터 ‘모몽가’는 『치이카와』에 등장합니다. 이 프로젝트는 공식 상품이나 공식 3D 모델이 아닌 **팬메이드 재현/학습용 결과물**입니다. 배포·상업적 이용 시 원작자의 권리를 확인하세요.