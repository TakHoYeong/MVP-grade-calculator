import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// CSP(콘텐츠 보안 정책): 브라우저가 어떤 출처의 리소스만 허용할지 못 박는다.
// 혹시 페이지에 악성 스크립트가 주입돼도, 외부 서버로 데이터를 빼돌리거나
// 외부 스크립트를 불러오는 걸 브라우저가 막아 준다.
//
// 이 앱이 실제로 쓰는 출처만 허용한다:
//   - 자기 자신('self'): 번들된 JS/CSS, favicon
//   - Google Fonts: 스타일시트(fonts.googleapis.com), 폰트 파일(fonts.gstatic.com)
//   - 인라인 style="" 속성(컴포넌트의 style={{}}): style-src 에 'unsafe-inline' 필요
//     스크립트는 인라인을 허용하지 않으므로(script-src 'self') XSS 방어는 유지된다.
//
// 참고: frame-ancestors(클릭재킹 방지)·X-Frame-Options 등 '응답 헤더'로만 되는 항목은
// GitHub Pages 가 커스텀 헤더를 못 넣어 여기서는 적용 불가하다.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

// CSP 는 프로덕션 빌드 결과물(dist/index.html)에만 넣는다.
// 개발 서버는 HMR·인라인 스크립트를 쓰므로 CSP 를 넣으면 화면이 깨진다.
function cspPlugin(): Plugin {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: contentSecurityPolicy,
            },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin()],

  // 상대 경로로 빌드한다.
  // GitHub Pages 의 하위 경로(/저장소이름/), 커스텀 도메인의 루트(/),
  // 로컬에서 dist/index.html 을 직접 여는 경우까지 모두 그대로 동작한다.
  base: './',

  server: {
    // 개발 서버 포트를 14911 로 고정한다. (5173 은 다른 용도로 비워 둔다)
    // strictPort: 14911 이 이미 쓰이면 다른 포트로 슬그머니 옮기지 않고 에러를 낸다.
    // PORT 환경변수가 있으면 그 값을 우선한다(CI 등). 프로덕션 빌드(vite build)에는 영향이 없다.
    port: Number(process.env.PORT) || 14911,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    // 소스맵을 남겨 두면 배포된 페이지에서도 원본 코드로 디버깅할 수 있다.
    sourcemap: true,
  },
});
