'use strict';

const heroCarousel = document.querySelector('[data-hero-carousel]');
if (heroCarousel) {
  (() => {
  const heroTrack = heroCarousel.querySelector('[data-hero-track]');
  const heroSlides = [...heroCarousel.querySelectorAll('[data-hero-slide]')];
  function setHeroAspectRatio(index) {
    const image = heroSlides[index]?.querySelector('img');
    const width = Number(image?.getAttribute('width')) || image?.naturalWidth;
    const height = Number(image?.getAttribute('height')) || image?.naturalHeight;
    if (width && height) heroCarousel.style.setProperty('--hero-aspect-ratio', `${width} / ${height}`);
  }
  setHeroAspectRatio(0);
  if (heroSlides.length < 2) return;
  const firstClone = heroSlides[0].cloneNode(true);
  const lastClone = heroSlides[heroSlides.length - 1].cloneNode(true);
  [firstClone, lastClone].forEach((slide) => {
    slide.removeAttribute('data-hero-slide');
    slide.setAttribute('aria-hidden', 'true');
    slide.setAttribute('inert', '');
  });
  heroTrack.prepend(lastClone);
  heroTrack.append(firstClone);
  heroTrack.style.transition = 'none';
  heroTrack.style.transform = 'translateX(-100%)';
  void heroTrack.offsetWidth;
  heroTrack.style.removeProperty('transition');

  let activeHeroSlide = 0;
  let isAnimating = false;
  let pendingReset = null;

  function showHeroSlide(index) {
    if (isAnimating) return;

    let trackIndex;
    if (index < 0) {
      activeHeroSlide = heroSlides.length - 1;
      trackIndex = 0;
      pendingReset = heroSlides.length;
    } else if (index >= heroSlides.length) {
      activeHeroSlide = 0;
      trackIndex = heroSlides.length + 1;
      pendingReset = 1;
    } else {
      activeHeroSlide = index;
      trackIndex = activeHeroSlide + 1;
      pendingReset = null;
    }

    setHeroAspectRatio(activeHeroSlide);
    isAnimating = true;
    heroTrack.style.transform = `translateX(-${trackIndex * 100}%)`;
    heroSlides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeHeroSlide;
      slide.setAttribute('aria-hidden', String(!active));
      slide.toggleAttribute('inert', !active);
    });
  }

  heroTrack.addEventListener('transitionend', (event) => {
    if (event.target !== heroTrack || event.propertyName !== 'transform') return;
    if (pendingReset !== null) {
      heroTrack.style.transition = 'none';
      heroTrack.style.transform = `translateX(-${pendingReset * 100}%)`;
      void heroTrack.offsetWidth;
      heroTrack.style.removeProperty('transition');
      pendingReset = null;
    }
    isAnimating = false;
  });

  heroCarousel.querySelector('[data-hero-prev]').addEventListener('click', () => showHeroSlide(activeHeroSlide - 1));
  heroCarousel.querySelector('[data-hero-next]').addEventListener('click', () => showHeroSlide(activeHeroSlide + 1));
  heroCarousel.addEventListener('keydown', (event) => {
    if (event.target.closest('a, input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); showHeroSlide(activeHeroSlide - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showHeroSlide(activeHeroSlide + 1); }
  });

  let swipeStart = null;
  heroCarousel.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.target.closest('a, button')) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  heroCarousel.addEventListener('pointerup', (event) => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) showHeroSlide(activeHeroSlide + (dx < 0 ? 1 : -1));
    swipeStart = null;
  });
  heroCarousel.addEventListener('pointercancel', () => { swipeStart = null; });
  })();
}

const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeNav() {
  if (!toggle || !mobileNav) return;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '메뉴 열기');
  mobileNav.hidden = true;
}
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileNav.hidden = !open;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    closeNav();
    toggle.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeNav();
});
window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
  if (event.matches) closeNav();
});

const filterBar = document.querySelector('.filter-bar');
if (filterBar) {
  const isMedia = document.body.dataset.page === 'media';
  const cards = [...document.querySelectorAll(isMedia ? '.media-card' : '.catalog-card')];
  const liveResult = document.querySelector('.filter-result');
  function applyFilter(button) {
    const category = button.dataset.filter;
    filterBar.querySelectorAll('.filter-button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    cards.forEach((card) => {
      const visible = category === 'all' || card.dataset.category === category;
      card.hidden = !visible;
      if (visible) count++;
    });
    if (liveResult) liveResult.textContent = `${button.textContent.trim()} ${count}개`;
    if (isMedia) {
      document.querySelector('.media-empty').hidden = count > 0;
      document.querySelector('.media-grid').hidden = count === 0;
    }
  }
  filterBar.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-button');
    if (button) applyFilter(button);
  });
  document.querySelector('[data-show-channels]')?.addEventListener('click', () => {
    const button = filterBar.querySelector('[data-filter="channel"]');
    applyFilter(button);
    button.focus();
  });
}
