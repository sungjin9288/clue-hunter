# noir-mvp

모바일 추리게임 MVP (PWA 우선, Capacitor 2차).

## 1) 로컬 실행

```bash
npm i
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 후 모바일 뷰(세로)로 테스트.

## 2) 빌드

```bash
npm run build
npm run preview
```

## 3) 케이스 파일

- `public/cases/case_000_sandbox.json`: 5분 스모크 테스트
- `public/cases/case_001.json`: 20~30분 MVP 본편

## 4) MVP 포함 기능

- 5탭: 사건개요 / 현장 / 문서 / 심문 / 보드&보고서
- 현장 핫스팟 단서 획득(중복 방지)
- 문서 Markdown 열람 + 단서 획득
- 심문 노드 + evidenceCheck 성공/실패 분기 + grantClueIds
- 타임라인 5슬롯 + 드래그 배치 + 슬롯선택 배치
- 보고서(선택형 + 근거 첨부) 채점
- localStorage caseId별 저장/복원
- CaseLoader preflight(ID 중복/참조 누락) 검증

## 5) PWA 배포

정적 호스팅으로 배포 가능:

- Netlify
- GitHub Pages
- itch.io (HTML5)

배포 전 `npm run build` 확인.

## 6) Capacitor 래핑 절차

```bash
npm i @capacitor/core @capacitor/cli
npx cap init noir-mvp com.example.noirmvp
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

체크리스트:

1. 웹 빌드 후 매번 `npx cap sync` 재실행
2. Android 실기기에서 탭 이동/저장/드래그 테스트
3. iOS 네이티브 빌드는 일반적으로 macOS + Xcode 필요
4. macOS가 없으면 `PWA 링크 테스트 -> Android 우선 -> iOS 추후`로 진행

## 7) 금지 범위(MVP)

- 서버/로그인/계정/결제
- 복잡한 잠금(requirements/flags)
- 아트/사운드 고도화
- 멀티플레이/실시간 동기화
