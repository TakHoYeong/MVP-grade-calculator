import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 상대 경로로 빌드한다.
  // GitHub Pages 의 하위 경로(/저장소이름/), 커스텀 도메인의 루트(/),
  // 로컬에서 dist/index.html 을 직접 여는 경우까지 모두 그대로 동작한다.
  base: './',

  build: {
    outDir: 'dist',
    // 소스맵을 남겨 두면 배포된 페이지에서도 원본 코드로 디버깅할 수 있다.
    sourcemap: true,
  },
});
