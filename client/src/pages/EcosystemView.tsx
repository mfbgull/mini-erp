import { useEffect, useRef } from 'react';

export default function EcosystemView() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create the ecosystem in an iframe to isolate it
    const iframe = document.createElement('iframe');
    iframe.src = '/ecosystem.html';
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.zIndex = '9999';

    // Add a back button overlay
    const backBtn = document.createElement('div');
    backBtn.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 10000;
      background: rgba(0,20,40,0.9);
      border: 1px solid rgba(0,245,212,0.4);
      color: #00f5d4;
      padding: 10px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      backdrop-filter: blur(10px);
      transition: all 0.3s;
    `;
    backBtn.innerHTML = '← Back to Mini ERP';
    backBtn.onmouseover = () => {
      backBtn.style.background = 'rgba(0,245,212,0.2)';
      backBtn.style.boxShadow = '0 0 20px rgba(0,245,212,0.3)';
    };
    backBtn.onmouseout = () => {
      backBtn.style.background = 'rgba(0,20,40,0.9)';
      backBtn.style.boxShadow = 'none';
    };
    backBtn.onclick = () => {
      window.history.back();
    };

    document.body.appendChild(iframe);
    document.body.appendChild(backBtn);

    // Cleanup
    return () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      if (backBtn.parentNode) {
        backBtn.parentNode.removeChild(backBtn);
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
