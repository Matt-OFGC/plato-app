// src/lib/paneHeight.ts
export function setPaneVars() {
  // Find the floating navigation bar (bottom nav)
  const bottomNav = document.querySelector<HTMLElement>('.floating-nav');
  const bottomNavH = bottomNav?.offsetHeight ?? 80;
  
  // For the header, we'll use a default since the recipe page doesn't have a traditional header
  // The recipe page has its own header within the component
  const headerH = 0; // No fixed header in recipe pages
  
  // Set CSS custom properties for pane heights
  document.documentElement.style.setProperty('--header-h', `${headerH}px`);
  document.documentElement.style.setProperty('--bottomnav-h', `${bottomNavH}px`);
  document.documentElement.style.setProperty('--pane-max-h', `calc(100vh - ${headerH}px - ${bottomNavH}px - 12px)`);
}

export function initPaneVars() {
  setPaneVars();
  window.addEventListener('resize', setPaneVars);
  window.addEventListener('orientationchange', setPaneVars);
}
