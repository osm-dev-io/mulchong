'use strict';

function revealImageWhenVisible(frame) {
  const image = frame?.querySelector('img');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!image?.animate || !image.decode || reducedMotion.matches || !('IntersectionObserver' in window)) return;

  image.decode().then(() => {
    const headerHeight = document.querySelector('.header-inner')?.offsetHeight ?? 0;
    const visibleThreshold = 0.6;
    let animation = null;

    function cancelReveal() {
      animation?.cancel();
      animation = null;
    }

    function refreshVisibility() {
      cancelReveal();
      observer.disconnect();
      observer.takeRecords();
      if (!document.hidden) observer.observe(frame);
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (document.hidden || entry.intersectionRatio < visibleThreshold) {
        cancelReveal();
        return;
      }
      if (animation || reducedMotion.matches) return;

      animation = image.animate(
        [
          { opacity: 0.15, translate: '0 30px', scale: 0.91, easing: 'ease-out' },
          { opacity: 1, translate: '0 -3px', scale: 1.025, offset: 0.72, easing: 'ease-in-out' },
          { opacity: 1, translate: '0 0', scale: 1 },
        ],
        { duration: 780 },
      );
      animation.onfinish = () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', refreshVisibility);
      };
    }, { rootMargin: `-${headerHeight}px 0px 0px`, threshold: visibleThreshold });

    document.addEventListener('visibilitychange', refreshVisibility);
    refreshVisibility();
  }, () => {
    // Keep the image unanimated if it could not be decoded.
  });
}

const trademarkFrame = document.querySelector('.trademark-document-frame');
revealImageWhenVisible(trademarkFrame);
revealImageWhenVisible(document.querySelector('.review-award'));

if (trademarkFrame) {
  const mouseMotion = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

  trademarkFrame.addEventListener('pointermove', (event) => {
    if (!mouseMotion.matches || event.pointerType !== 'mouse') return;
    const { left, top, width, height } = trademarkFrame.getBoundingClientRect();
    const x = (event.clientX - left) / width - 0.5;
    const y = (event.clientY - top) / height - 0.5;
    trademarkFrame.style.setProperty('--trademark-tilt-x', `${-y * 12}deg`);
    trademarkFrame.style.setProperty('--trademark-tilt-y', `${x * 12}deg`);
  });
  trademarkFrame.addEventListener('pointerleave', () => {
    trademarkFrame.style.removeProperty('--trademark-tilt-x');
    trademarkFrame.style.removeProperty('--trademark-tilt-y');
  });
}

const pendingReviews = new Set(document.querySelectorAll('.review-card-frame'));
const reducedReviewMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (pendingReviews.size && !reducedReviewMotion.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
  const visibleReviews = new Set();
  const threshold = 0.25;
  const headerHeight = document.querySelector('.header-inner')?.offsetHeight ?? 0;
  let activeReview = null;

  function cancelReview() {
    activeReview?.animation.cancel();
    activeReview = null;
  }

  function revealNextReview() {
    if (activeReview || document.hidden || reducedReviewMotion.matches) return;
    const frame = [...pendingReviews].find((card) => visibleReviews.has(card));
    if (!frame) return;

    const animation = frame.firstElementChild.animate(
      [
        { opacity: 0, translate: '0 56px', scale: 0.92, easing: 'ease-out' },
        { opacity: 1, translate: '0 -7px', scale: 1.035, offset: 0.7, easing: 'ease-in-out' },
        { opacity: 1, translate: '0 0', scale: 1 },
      ],
      { duration: 700, fill: 'both' },
    );
    activeReview = { frame, animation };
    animation.onfinish = () => {
      if (activeReview?.animation !== animation) return;
      frame.classList.remove('is-awaiting-reveal');
      pendingReviews.delete(frame);
      visibleReviews.delete(frame);
      observer.unobserve(frame);
      cancelReview();
      if (!pendingReviews.size) document.removeEventListener('visibilitychange', refreshReviews);
      revealNextReview();
    };
  }

  const observer = new IntersectionObserver((entries) => {
    for (const { target, intersectionRatio } of entries) {
      if (intersectionRatio >= threshold && pendingReviews.has(target)) {
        visibleReviews.add(target);
      } else {
        visibleReviews.delete(target);
        if (activeReview?.frame === target) cancelReview();
      }
    }
    revealNextReview();
  }, { rootMargin: `-${headerHeight}px 0px 0px`, threshold });

  function refreshReviews() {
    observer.disconnect();
    observer.takeRecords();
    cancelReview();
    visibleReviews.clear();
    if (!document.hidden) pendingReviews.forEach((card) => observer.observe(card));
  }

  pendingReviews.forEach((card) => card.classList.add('is-awaiting-reveal'));
  document.addEventListener('visibilitychange', refreshReviews);
  refreshReviews();
}

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
