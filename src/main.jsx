import { StrictMode } from 'react'; // React 애플리케이션에서 잠재적인 문제를 감지하기 위한 도구입니다. 개발 모드에서 추가적인 검사를 활성화합니다.
import { createRoot } from 'react-dom/client'; // React 18에서 애플리케이션의 루트를 생성하는 데 사용되는 클라이언트 렌더링 API입니다.
import { BrowserRouter } from 'react-router-dom'; // HTML5 History API를 사용하여 UI를 URL과 동기화하는 라우터입니다. 클라이언트 측 라우팅을 가능하게 합니다.
import App from './App.jsx'; // 메인 애플리케이션 컴포넌트입니다.
import './index.css'; // 전역 스타일을 정의하는 CSS 파일입니다.

// PWA(Progressive Web App)를 위한 서비스 워커 등록
import { registerSW } from 'virtual:pwa-register'; // Vite PWA 플러그인에서 제공하는 서비스 워커 등록 함수입니다.
registerSW({ immediate: true }); // 서비스 워커를 즉시 등록하고 활성화하려고 시도합니다.

// 'root' ID를 가진 DOM 요소에 React 애플리케이션을 렌더링합니다.
createRoot(document.getElementById('root')).render(
  // StrictMode: 개발 중 컴포넌트의 잠재적인 문제를 강조하기 위한 래퍼 컴포넌트입니다.
  <StrictMode>
    {/* BrowserRouter: 애플리케이션의 라우팅을 설정합니다. 애플리케이션의 URL을 기반으로 컴포넌트를 렌더링합니다. */}
    <BrowserRouter>
      <App /> {/* 메인 애플리케이션 컴포넌트를 렌더링합니다. */}
    </BrowserRouter>
  </StrictMode>
);