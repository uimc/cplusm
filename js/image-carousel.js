// Image Carousel - Desktop auto-scroll + desktop click+drag + mobile arrows
function initImageCarousel() {
    const carouselTrack = document.getElementById('image-carousel-track');
    if (!carouselTrack) return;

    // Prevent double-initialization (this can cause Safari/iOS rendering glitches).
    if (carouselTrack.dataset.initialized === 'true') return;
    carouselTrack.dataset.initialized = 'true';

    const carouselContainer = carouselTrack.closest('.image-carousel-container');
    if (!carouselContainer) return;

    const pointerFine = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(pointer: fine)').matches
        : false;
    const pointerCoarse = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
    const hoverHover = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(hover: hover)').matches
        : false;

    // List of images from the images folder
    const images = [
        'b1.jpg',
        'd1.jpg',
        'f1.jpg',
        'mt2.gif',
        'l1.jpg',
        'mt1.jpg',
        'a1.jpg',
        'p1.jpg',
        'dc1.jpg',
        'xm1.jpg',
        'j1.gif',
        'z1.jpg',
        'w1.jpg',
        'j2.jpg',
        'b2.jpg',
        'j3.jpg',
        'p2.gif',
        'g1.jpg',
        'dc2.jpg',
        'c1.jpg'
    ];

    // Auto-scroll should run on "desktop-like" devices.
    // Some touch-enabled laptops can report pointer: fine=false; hover is a better signal.
    const shouldAutoScroll = pointerFine || hoverHover;

    // Render duplicates only when auto-scroll is enabled so it can loop seamlessly.
    const renderImages = shouldAutoScroll ? images.concat(images) : images;

    carouselTrack.innerHTML = '';
    const frag = document.createDocumentFragment();

    renderImages.forEach((image) => {
        const img = document.createElement('img');
        img.src = `../images/${image}`;
        img.alt = image.replace(/\.[^/.]+$/, ''); // Remove file extension for alt text
        img.className = 'carousel-image';
        // Eager keeps iOS from showing a blank/half-rendered track during horizontal scroll.
        img.loading = 'eager';
        img.decoding = 'async';
        img.draggable = false;
        frag.appendChild(img);
    });

    carouselTrack.appendChild(frag);

    // Desktop click+drag to scroll (touch devices should use native swipe).
    if (carouselContainer.dataset.dragInitialized === 'true') return;
    carouselContainer.dataset.dragInitialized = 'true';

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onPointerDown = (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        isDragging = true;
        startX = e.clientX;
        startScrollLeft = carouselContainer.scrollLeft;

        carouselContainer.classList.add('dragging');
        try {
            carouselContainer.setPointerCapture(e.pointerId);
        } catch {
            // Ignore capture errors (older browsers)
        }
        e.preventDefault();
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        carouselContainer.scrollLeft = startScrollLeft - dx;
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        carouselContainer.classList.remove('dragging');
    };

    carouselContainer.addEventListener('pointerdown', onPointerDown);
    carouselContainer.addEventListener('pointermove', onPointerMove);
    carouselContainer.addEventListener('pointerup', endDrag);
    carouselContainer.addEventListener('pointercancel', endDrag);
    carouselContainer.addEventListener('pointerleave', endDrag);

    // Mobile arrow UI (visible hint that horizontal scrolling exists).
    const leftBtn = carouselContainer.querySelector('.image-carousel-arrow-left');
    const rightBtn = carouselContainer.querySelector('.image-carousel-arrow-right');

    const hideArrows = () => carouselContainer.classList.remove('showing-arrows');
    const showArrows = () => carouselContainer.classList.add('showing-arrows');

    if (!shouldAutoScroll && pointerCoarse && leftBtn && rightBtn) {
        showArrows();

        // Hide once the user scrolls/taps the carousel for the first time.
        const onFirstInteraction = () => {
            hideArrows();
            carouselContainer.removeEventListener('scroll', onFirstInteraction);
            carouselContainer.removeEventListener('pointerdown', onFirstInteraction);
        };

        carouselContainer.addEventListener('scroll', onFirstInteraction, { passive: true });
        carouselContainer.addEventListener('pointerdown', onFirstInteraction, { passive: true });

        const scrollByAmount = Math.max(200, carouselContainer.clientWidth * 0.85);

        leftBtn.addEventListener('click', () => {
            try {
                carouselContainer.scrollBy({ left: -scrollByAmount, behavior: 'smooth' });
            } catch {
                carouselContainer.scrollLeft -= scrollByAmount;
            }
            hideArrows();
        });

        rightBtn.addEventListener('click', () => {
            try {
                carouselContainer.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
            } catch {
                carouselContainer.scrollLeft += scrollByAmount;
            }
            hideArrows();
        });
    } else {
        // Desktop: arrows stay hidden.
        hideArrows();
    }

    // Desktop auto-scroll: uses scrollLeft (no transforms) to avoid iOS rendering issues.
    if (!shouldAutoScroll) return;
    if (carouselContainer.dataset.autoInitialized === 'true') return;
    carouselContainer.dataset.autoInitialized = 'true';

    let baseWidth = 0;
    let halfWidth = 0;

    // Start after layout so scrollWidth reflects actual image sizes.
    const startAuto = () => {
        const totalWidth = carouselTrack.scrollWidth;
        halfWidth = totalWidth / 2;
        baseWidth = halfWidth;

        // Only loop if it actually makes sense.
        const canLoop = baseWidth > carouselContainer.clientWidth + 10;
        const speedPxPerSec = 80; // tune: make motion obvious
        const speedPxPerMs = speedPxPerSec / 1000;

        let lastTs = performance.now();
        const tick = (ts) => {
            const dt = ts - lastTs;
            lastTs = ts;

            if (!isDragging) {
                carouselContainer.scrollLeft += speedPxPerMs * dt;
                if (canLoop && carouselContainer.scrollLeft >= baseWidth) {
                    carouselContainer.scrollLeft -= baseWidth;
                }
            }

            rafId = window.requestAnimationFrame(tick);
        };

        rafId = window.requestAnimationFrame(tick);
    };

    let rafId = 0;
    // Wait for at least one frame so images have a chance to influence layout.
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => startAuto());
    });
}

// Initialize when components are loaded (after fetch-based HTML injection).
document.addEventListener('componentsLoaded', initImageCarousel);

// Fallback: if the carousel component was already injected.
setTimeout(initImageCarousel, 100);
