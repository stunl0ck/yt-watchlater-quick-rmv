// YouTube Watch Later Quick Remove Extension
(function () {
    'use strict';



    function addQuickRemoveButtons() {
        // Handle both main playlist page and modal panel
        const mainPageItems = document.querySelectorAll('ytd-playlist-video-renderer:not([data-quick-remove-added])');
        const modalItems = document.querySelectorAll('ytd-playlist-panel-video-renderer:not([data-quick-remove-added])');

        const allItems = [...mainPageItems, ...modalItems];

        allItems.forEach(item => {
            item.setAttribute('data-quick-remove-added', 'true');

            const indexContainer = item.querySelector('#index-container');
            if (!indexContainer) return;

            const quickRemoveBtn = document.createElement('button');
            quickRemoveBtn.className = 'yt-quick-remove-btn';
            quickRemoveBtn.title = 'Remove from Watch Later';
            quickRemoveBtn.setAttribute('aria-label', 'Remove from Watch Later');

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('height', '20');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '20');
            svg.setAttribute('fill', 'currentColor');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z');

            svg.appendChild(path);
            quickRemoveBtn.appendChild(svg);

            quickRemoveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                removeVideoFromPlaylist(item);
            });

            indexContainer.parentNode.insertBefore(quickRemoveBtn, indexContainer);
        });
    }

    function removeVideoFromPlaylist(videoItem) {
        const menuButton = videoItem.querySelector('ytd-menu-renderer #button button');
        if (!menuButton) return;

        menuButton.click();

        // Wait for menu to appear and find the remove option
        setTimeout(() => {
            // Look for the remove menu item (works for both "Watch later" and "playlist")
            const removeItem = Array.from(document.querySelectorAll('tp-yt-paper-item')).find(item => {
                const text = item.textContent;
                return text.includes('Remove from') && (text.includes('Watch later') || text.includes('playlist'));
            });

            if (removeItem) {
                removeItem.click();
            } else {
                // Fallback: close the menu if we can't find remove option
                document.addEventListener('click', function closeMenu(e) {
                    document.removeEventListener('click', closeMenu);
                }, { once: true });
                document.body.click();
            }
        }, 100);
    }

    addQuickRemoveButtons();

    // Watch for new content being loaded (YouTube is a SPA) - but throttle it
    let isProcessing = false;
    const observer = new MutationObserver((mutations) => {
        if (isProcessing) return;

        let shouldCheck = false;
        mutations.forEach((mutation) => {
            // Check for both main page and modal playlist elements
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && (
                    node.tagName === 'YTD-PLAYLIST-VIDEO-RENDERER' ||
                    node.tagName === 'YTD-PLAYLIST-PANEL-VIDEO-RENDERER' ||
                    (node.querySelector && (
                        node.querySelector('ytd-playlist-video-renderer') ||
                        node.querySelector('ytd-playlist-panel-video-renderer')
                    ))
                )) {
                    shouldCheck = true;
                }
            });
        });

        if (shouldCheck) {
            isProcessing = true;
            setTimeout(() => {
                addQuickRemoveButtons();
                isProcessing = false;
            }, 500);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also check when URL changes (for YouTube navigation)
    let currentUrl = location.href;
    setInterval(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            if (currentUrl.includes('list=WL')) {
                setTimeout(addQuickRemoveButtons, 1000);
            }
        }
    }, 1000);

})();