# Express Casino (바카라 데모)

간단한 바카라 테이블 UI와 운영자용 조작 화면을 제공하는 Express 기반 데모입니다.  
카드 딜, 결과 표시, 베팅 현황, 로그인/회원가입을 포함하며 데이터는 텍스트 파일로 저장됩니다.

## 실행 방법
1) 의존성 설치
```
npm install
```
2) 서버 실행
```
npm start
```
3) 접속
브라우저에서 `http://localhost:3000`으로 접속하세요.

## 주요 화면 URL
- `/` : 메인 진입 페이지 (화면 선택)
- `/baccarat` : 사용자용 바카라 테이블 (카드 결과 + 베팅 현황)
- `/baccarat/admin` : 운영자용 조작 화면 (딜/카드 수정/초기화)
- `/auth/login` : 로그인
- `/auth/register` : 회원가입

## API URL
- `GET /api/baccarat/state` : 현재 라운드/카드/결과/베팅 상태
- `POST /api/baccarat/deal` : 베팅 시작 (5초 카운트다운 후 자동 딜)
- `POST /api/baccarat/edit` : 카드 수정 (`{ "slot": "P1", "code": "AS" }`)
- `POST /api/baccarat/clear` : 현재 라운드 종료
- `POST /api/baccarat/reset` : 전체 초기화 (베팅 파일은 유지)
- `GET /api/baccarat/bets` : 베팅 상태만 조회
- `POST /api/baccarat/bets` : 베팅 추가 (로그인 필요) (`{ "side": "player", "amount": 50000 }`)
- `GET /api/baccarat/events` : 실시간 상태 스트림(SSE)
- `GET /auth/me` : 로그인 사용자 정보
- `POST /api/baccarat/auto` : 자동 진행 on/off (`{ "enabled": true }`)

## 카드 이미지 URL
- `GET /cards/:code.svg` : 카드 SVG (예: `/cards/AS.svg`, `/cards/10H.svg`, `/cards/back.svg`, `/cards/empty.svg`)

## 베팅 흐름
- 운영자가 베팅 시작을 누르면 5초 카운트다운 동안만 베팅 가능
- 카운트다운 종료 후 자동으로 카드 결과 공개
- 결과 공개 후 5초 뒤 자동으로 라운드 종료
- 자동 진행은 일시정지 가능
- 베팅 시점에 포인트 차감, 라운드 종료 시 결과에 따라 지급
- 배당: PLAYER 1:1, BANKER 1:1(수수료 5%), TIE 8:1

## 사용자/베팅 데이터 저장
- 사용자: `data/users.txt` (JSON 라인)
- 베팅 로그: `data/bets.txt` (베팅 입력 로그)
- 라운드 로그: `data/round-bets.txt` (라운드 종료 시 요약)

## 기타
- `/users` : 기본 Express 예제 라우트

## 추천인 보너스
- 추천인 UID가 `admin`이면 신규 가입자에게 10,000 포인트 지급
- 그 외 UID는 추천인과 신규 가입자 각각 5,000 포인트 지급

## 기본 계정
- 관리자: `admin` / `admin` (UID: `admin`)
- 관리자 콘솔 접근 허용 UID: `admin`, `Umjjo8ft0pdq9ae`
- 운영자: `duswnsghkd@gamil.com` / `1234` (UID: `Umjjo8ft0pdq9ae`)
- 테스트 계정:
  - `test1@example.com` / `test1234` (10,000 points)
  - `test2@example.com` / `test1234` (10,000 points)
