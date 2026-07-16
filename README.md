# 📇 프리미엄 모바일 디지털 명함 (Digital Business Card)

카카오톡 공유 최적화(Open Graph 적용), 연락처 바로 저장(vCard), 3D 카드 효과, QR 코드 등이 포함된 모바일 퍼스트 디지털 명함 템플릿입니다.

---

## 📂 파일 구조

- `index.html`: 명함의 마크업 구조 및 카카오톡 공유를 위한 메타 태그 설정 파일
- `style.css`: 글래스모피즘 테마 및 세련된 애니메이션이 포함된 스타일시트
- `script.js`: 연락처 다운로드 생성, 카카오 링크 SDK, QR 코드 생성 등 인터랙티브 로직 파일
- `avatar.jpg`: 프로필에 표시되는 아바타/인물 사진 (현재 업로드하신 사진 적용됨)

---

## ⚙️ 커스터마이징 방법

### 1. 개인 정보 수정
명함에 표시될 이름, 직책, 소속 및 연락처 정보를 변경하려면 다음 두 파일을 수정하세요.

- **`index.html`**에서 아래 부분을 찾아 본인의 정보로 변경합니다:
  - `<title>최동준 | 디지털 명함</title>`
  - `<meta property="og:title" content="최동준 | 디지털 명함">`
  - `<meta property="og:description" content="...">`
  - `<h1 class="name">최동준</h1>`
  - `<p class="title">Software Architect</p>`
  - `<p class="company">디지털 명함 솔루션</p>`
  - 연락처/이메일/소셜 링크의 `href` 및 화면 표시 텍스트 수정

- **`script.js`**에서 **연락처 저장(vCard)용 변수**도 동일하게 수정합니다:
  ```javascript
  // script.js 91라인 부근
  const name = '최동준';
  const phone = '010-1234-5678';
  const email = 'djchoi19810402@gmail.com';
  const company = '디지털 명함 솔루션';
  const title = 'Software Architect';
  ```

---

## 💬 카카오톡 공유 SDK 설정 가이드

카카오톡 네이티브 메시지 템플릿 공유 기능을 사용하려면 **카카오 앱 키** 등록이 필요합니다. (키가 없거나 설정하지 않으면 모바일 시스템 공유 창이 활성화되거나 클립보드 링크 복사로 자동 전환되어 정상 작동합니다.)

1. **[카카오 개발자 센터](https://developers.kakao.com/)**에 로그인합니다.
2. **[내 애플리케이션] > [애플리케이션 추가하기]**를 클릭하여 앱을 생성합니다.
3. 생성된 앱의 **[요약 정보]** 페이지에서 **JavaScript 키**를 복사합니다.
4. **`script.js`**의 첫 번째 라인에 키를 입력합니다:
   ```javascript
   const KAKAO_APP_KEY = '복사한_JAVASCRIPT_키_입력';
   ```
5. **[플랫폼] > [Web]**을 선택하고, 명함이 배포된 **공개 도메인 URL**(예: `https://username.github.io`)을 사이트 도메인에 등록해야 카카오 공유 기능이 정상 작동합니다.

---

## 🌐 무료 웹 배포 방법

카카오톡 공유 및 QR 코드가 정상 동작하려면 명함 페이지가 인터넷 상의 공개 URL(HTTPS)로 배포되어야 합니다. 아래의 무료 배포 서비스들을 추천합니다.

### 방법 A: GitHub Pages (가장 권장)
1. GitHub 레포지토리를 만들고 이 프로젝트 파일들(`index.html`, `style.css`, `script.js`, `avatar.jpg`, `README.md`)을 업로드합니다.
2. 레포지토리의 **Settings > Pages** 메뉴로 이동합니다.
3. Build and deployment의 Source를 `Deploy from a branch`로 설정하고 `main` 브라우저 및 `/ (root)` 폴더를 선택 후 **Save**합니다.
4. 몇 분 뒤 제공되는 `https://<username>.github.io/<repository-name>/` 주소가 당신의 디지털 명함 링크가 됩니다.

### 방법 B: Netlify 또는 Vercel (드래그 앤 드롭 배포)
1. [Netlify](https://www.netlify.com/)에 로그인합니다.
2. 컴퓨터에 있는 '디지털명함' 폴더 전체를 Netlify 업로드 창에 드래그 앤 드롭합니다.
3. 즉시 무료 배포 URL이 생성됩니다.

---

## 🛠️ 로컬 개발 환경에서 테스트하는 법
로컬 브라우저에서 바로 HTML 파일을 실행할 수도 있지만, 보안 정책(CORS 등)으로 인해 일부 기능이 제한될 수 있습니다. 다음 방법으로 간이 로컬 서버를 열어 테스트하시는 것을 권장합니다.

- **Python 사용 시** (터미널에서 아래 명령 실행 후 `http://localhost:8000` 접속):
  ```bash
  python3 -m http.server 8000
  ```
