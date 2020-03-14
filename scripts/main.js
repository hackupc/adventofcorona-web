function updateRealVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

updateRealVH();
window.addEventListener('resize', updateRealVH);
