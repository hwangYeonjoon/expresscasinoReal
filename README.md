# Express Casino (바카라 데모)

간단한 바카라 테이블 UI와 운영자용 조작 화면을 제공하는 Express 기반 데모입니다.  
카드 딜, 결과 표시, 그리고 베팅 현황을 확인할 수 있습니다. 베팅 데이터는 텍스트 파일로 누적 저장됩니다.

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

## API URL
- `GET /api/baccarat/state` : 현재 라운드/카드/결과/베팅 상태
- `POST /api/baccarat/deal` : 라운드 딜
- `POST /api/baccarat/edit` : 카드 수정 (`{ "slot": "P1", "code": "AS" }`)
- `POST /api/baccarat/clear` : 현재 라운드 종료
- `POST /api/baccarat/reset` : 전체 초기화 (베팅 파일은 유지)
- `GET /api/baccarat/bets` : 베팅 상태만 조회
- `POST /api/baccarat/bets` : 베팅 추가 (`{ "name": "kim", "side": "player", "amount": 50000 }`)

## 카드 이미지 URL
- `GET /cards/:code.svg` : 카드 SVG (예: `/cards/AS.svg`, `/cards/10H.svg`, `/cards/back.svg`, `/cards/empty.svg`)

## 베팅 데이터 저장
- 경로: `data/bets.txt`
- 형식: 한 줄에 JSON 1개 (예: `{"name":"kim","side":"player","amount":50000,"time":"2024-12-24T05:12:34.567Z"}`)
- 서버 재시작 시 자동 로드됩니다.

## 기타
- `/users` : 기본 Express 예제 라우트
