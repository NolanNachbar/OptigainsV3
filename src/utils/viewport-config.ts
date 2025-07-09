// Viewport Configuration for Mobile Optimization

export function configureViewport() {
  // Check if viewport meta tag exists
  let viewport = document.querySelector('meta[name="viewport"]');
  
  if (!viewport) {
    // Create viewport meta tag if it doesn't exist
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  // Set optimal viewport configuration
  viewport.setAttribute('content', 
    'width=device-width, ' +
    'initial-scale=1.0, ' +
    'maximum-scale=1.0, ' +
    'user-scalable=no, ' +
    'viewport-fit=cover'
  );
  
  // Prevent elastic scrolling on iOS
  document.body.addEventListener('touchmove', function(e) {
    // Only prevent default if scrolling would cause overflow
    if (document.body.scrollHeight <= window.innerHeight) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Handle orientation changes
  window.addEventListener('orientationchange', function() {
    // Force re-render after orientation change
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.style.height = window.innerHeight + 'px';
      setTimeout(() => {
        document.body.style.height = '';
      }, 500);
    }, 100);
  });
  
  // Ensure body doesn't exceed viewport
  document.documentElement.style.maxWidth = '100vw';
  document.documentElement.style.overflowX = 'hidden';
  document.body.style.maxWidth = '100vw';
  document.body.style.overflowX = 'hidden';
  
  // Add CSS to prevent horizontal scroll
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      max-width: 100% !important;
      overflow-x: hidden !important;
    }
    
    * {
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
    }
    
    /* Prevent iOS bounce effect */
    body {
      position: fixed;
      width: 100%;
      height: 100vh;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    #root {
      width: 100%;
      min-height: 100vh;
      overflow-x: hidden;
    }
  `;
  document.head.appendChild(style);
}

// Call this function when the app initializes
export function initializeViewport() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configureViewport);
  } else {
    configureViewport();
  }
}

// Utility function to check if content overflows
export function checkViewportOverflow() {
  const elements = document.querySelectorAll('*');
  const windowWidth = window.innerWidth;
  const overflowingElements: HTMLElement[] = [];
  
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.right > windowWidth || rect.left < 0) {
      overflowingElements.push(element as HTMLElement);
      console.warn('Element overflows viewport:', element, {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        windowWidth
      });
    }
  });
  
  return overflowingElements;
}

// Development helper to highlight overflowing elements
export function highlightOverflow() {
  if (process.env.NODE_ENV === 'development') {
    const overflowing = checkViewportOverflow();
    overflowing.forEach(el => {
      el.style.outline = '2px solid red';
      el.style.outlineOffset = '-2px';
    });
  }
}