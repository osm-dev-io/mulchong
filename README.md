# 물총칼국수 웹사이트

물총칼국수 외주 제작용 정적 브랜드 웹사이트입니다. 관리자 페이지, API, 데이터베이스와 문의 접수 서버는 포함하지 않습니다.

프로젝트는 `site/`에 있습니다. 빌드 결과는 `site/dist/`에 생성됩니다. HTML/CSS/JavaScript만 사용하므로 일반 정적 호스팅에서 제공할 수 있습니다. 빌드 결과와 루트의 납품 ZIP은 생성물이라 Git에는 포함하지 않습니다.

## 실행

```sh
cd site
npm run build
npm run dev
```

미리보기: http://127.0.0.1:4173

`npm install`은 필요하지 않습니다. Node.js와 Python 3의 표준 라이브러리만 사용합니다. 로컬 미리보기 서버는 개발용이며 납품 사이트에 포함되는 백엔드가 아닙니다.

## 페이지

| 파일 | 내용 |
| --- | --- |
| `index.html` | 브랜드 소개 |
| `menu.html` | 메뉴 소개 및 분류 |
| `stores.html` | 매장 검색 및 방문 정보 |
| `media.html` | 언론·방송 소개 및 공식 채널 |
| `franchise.html` | 가맹 안내 |

## 콘텐츠 수정

- `site/content/site.json`: 메뉴, 매장, 연락처, 공식 채널·미디어 정보
- `site/templates/base.html`: 공통 헤더·푸터와 페이지 메타데이터
- `site/templates/*.html`: 각 페이지의 본문
- `site/assets/styles.css`: 반응형 스타일
- `site/assets/app.js`: 모바일 메뉴, 콘텐츠 필터, 매장 검색
- `site/scripts/build.py`: 공통 템플릿과 데이터를 정적 HTML로 출력

내용을 수정한 후 `npm run build`를 실행합니다. `dist/`를 직접 수정하면 다음 빌드에서 덮어씁니다.

가맹 상담 전화 1551-6956은 `site/content/site.json`의 `franchise.phone`에 저장되어 있으며, 전화 버튼과 상담 안내가 빌드 때 자동으로 표시됩니다. 문의 접수·저장 기능은 없습니다.

언론·방송 자료를 전달받으면 `media` 배열에 `category` (`press`, `broadcast`), `label`, `platform`, `title`, `description`, `url`을 추가합니다. 현재는 확인된 공식 채널만 포함되어 있습니다.

## 확인

```sh
cd site
npm run check
node --check assets/app.js
```

## 의뢰인 확인이 필요한 자료

공식 로고·브랜드 지침, 사진의 최종 사용 승인, 전체 가맹점 목록, 보도·방송 원문, 확정된 가맹 조건을 전달받아 반영해야 합니다. 실제 본점 메뉴·연락처·영업 정보와 공개된 사업자 사진을 사용했으며, 출처와 확인 범위는 `site/SOURCES.md`에 기록했습니다.

사이트의 공유 범위와 정식 배포 주소는 의뢰인 검수 후 결정할 수 있습니다.
