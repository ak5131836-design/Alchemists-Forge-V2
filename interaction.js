// =================================================================
// interaction.js - UI CONTROLLER AND EVENT BINDING (FINAL STABILITY)
// =================================================================

// --- 1. GLOBAL STATE (Used by Drag & Drop) ---
let draggedResourceID = null; 
let draggedSlotOrigin = null; 
let activeWorkerInstanceId = null; 
let touchStartTimer = null; 
let isCustomDragging = false; 
let initialTouchX = 0; 
let initialTouchY = 0; 
let bgmStarted = false; // Flag for controlling BGM start

// --- AUDIO CONTROLLER ---
const AudioController = (function() {
    const audioElements = {};
    let isInitialized = false;

    function init() {
        if (isInitialized) return;
        audioElements.bgm = document.getElementById('bgm_forge_loop');
        audioElements.click = document.getElementById('sfx_ui_click');
        audioElements.success = document.getElementById('sfx_synth_success');
        audioElements.fail = document.getElementById('sfx_synth_fail');
        audioElements.start = document.getElementById('sfx_forge_start');
        audioElements.levelup = document.getElementById('sfx_level_up');
        audioElements.unlock = document.getElementById('sfx_research_unlock');

        // FIX: BGM volume setting removed from init()
        if (audioElements.click) audioElements.click.volume = 0.3;
        isInitialized = true;
    }

    function playSound(type) {
        const audio = audioElements[type];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn(`Audio playback blocked: ${e.message}`));
        }
    }
    
    // The main function called by the inventory toggle
    function startBGM() {
        if (audioElements.bgm) {
            // FIX: Restore volume setting here, immediately before play()
            audioElements.bgm.volume = 0.3; 
            
            audioElements.bgm.play().catch(e => {
                 console.error("Critical BGM playback error:", e);
            });
        }
    }

    return {
        init,
        playClick: () => playSound('click'),
        playSuccess: () => playSound('success'),
        playFail: () => playSound('fail'),
        playStart: () => playSound('start'),
        playLevelUp: () => playSound('levelup'),
        playUnlock: () => playSound('unlock'),
        startBGM,
    };
})();
// --- END AUDIO CONTROLLER ---


// --- 3. DRAG & DROP LOGIC (Full Customization for Inventory Drag) ---
function initDropZones() { 
    
    const inventorySidebar = document.getElementById('inventory-sidebar');
    const dragGhost = document.getElementById('drag-ghost');
    
    const showInventoryIfOpen = () => {
        if (inventorySidebar && inventorySidebar.classList.contains('open')) {
             setTimeout(() => {
                inventorySidebar.classList.remove('dragging');
             }, 50);
        }
    };
    
    // --- Manual Drag Cleanup ---
    const endCustomDrag = (targetItem = null) => {
        
        // CRITICAL ARTIFACT FIX: STEP 1 - Reset ghost state instantly
        dragGhost.style.display = 'none';
        dragGhost.innerHTML = ''; 
        
        // CRITICAL ARTIFACT FIX: STEP 2 - Force DOM Reflow/Repaint of Ghost Destruction
        void dragGhost.offsetHeight;
        
        // CRITICAL ARTIFACT FIX: STEP 3 - Introduce micro-delay (setTimeout 0) for original item visibility
        if (targetItem) {
            setTimeout(() => {
                targetItem.style.opacity = '1.0';
            }, 0); 
        }

        draggedResourceID = null; 
        draggedSlotOrigin = null; 
        isCustomDragging = false;
        
        // CRITICAL GLITCH FIX: STEP 4 - Ensure the synthesis slots are updated visually
        if (typeof updateSynthesisSlotsUI !== 'undefined') updateSynthesisSlotsUI();
        
        showInventoryIfOpen();
    };

    // -----------------------------------------------------------
    // 1. SLOT DROP LOGIC (Modified to accept touch drop)
    // -----------------------------------------------------------
    ['input-slot-1', 'input-slot-2'].forEach(id => { 
        const el = document.getElementById(id); 
        if (!el) return; 
        
        // Native Slot-to-Slot Drag (Only for desktop/mouse users)
        el.ondragstart = (e) => { 
            if (!el.dataset.resourceId) { e.preventDefault(); return; } 
            draggedResourceID = el.dataset.resourceId; 
            draggedSlotOrigin = id; 
            e.dataTransfer.effectAllowed = 'move'; 
            if(inventorySidebar.classList.contains('open')) {
                 setTimeout(() => {
                    inventorySidebar.classList.add('dragging');
                 }, 50);
            }
        }; 
        
        // Highlight on Drag Over (Native or Touch)
        const highlightSlot = (e) => {
            e.preventDefault(); 
            el.style.borderColor = '#2ecc71'; 
        };
        const unhighlightSlot = () => {
            el.style.borderColor = '#4a3e30'; 
        };

        el.ondragover = highlightSlot;
        el.ondragleave = unhighlightSlot; 

        // Native Drop Logic
        el.ondrop = (e) => { 
            e.preventDefault(); 
            unhighlightSlot();
            
            if (!draggedResourceID) return; 
            
            // Only handles native slot-to-slot drag 
            if (draggedSlotOrigin && draggedSlotOrigin !== id) { 
                gameEngine.moveItemBetweenSlots(draggedSlotOrigin, id); 
            } 
            
            draggedResourceID = null; 
            draggedSlotOrigin = null; 
            showInventoryIfOpen();
        }; 
        
        // Touch/Click to remove item
        el.onclick = (e) => { 
            if (e.target.closest('.slot-quantity-controls')) return;
            if (e.target === el || e.target.tagName === 'IMG' || e.target.classList.contains('quantity-text')) { 
                gameEngine.removeItemFromSlot(id); 
            } 
        }; 
    }); 
    
    // -----------------------------------------------------------
    // 2. INVENTORY DRAG VISIBILITY CONTROL & CUSTOM TOUCH START
    // -----------------------------------------------------------
    
    let currentDraggedItem = null;
    const inventoryGrid = document.querySelector('.inventory-items-grid');
    
    // BUG FIX: Check if the inventory grid exists before attempting to attach the listener
    if (inventoryGrid) {
        
        // --- CUSTOM TOUCH-HOLD DRAG START (FOR INVENTORY ITEMS) ---
        inventoryGrid.addEventListener('touchstart', (e) => {
            const item = e.target.closest('.inventory-item');
            if (!item || isCustomDragging) return;
            
            currentDraggedItem = item;
            e.preventDefault(); 
            
            // Capture initial touch coordinates immediately
            initialTouchX = e.touches[0].clientX;
            initialTouchY = e.touches[0].clientY;
            
            // Set up the custom drag initiation timer (500ms)
            touchStartTimer = setTimeout(() => {
                
                // 1. Set Global Drag State
                isCustomDragging = true;
                draggedResourceID = item.dataset.resourceId;
                draggedSlotOrigin = 'inventory';

                // 2. Hide Source Item - Use OPACITY
                item.style.opacity = '0'; 
                
                // 3. Setup and Show Manual Drag Ghost
                const itemImage = item.querySelector('img');
                dragGhost.innerHTML = itemImage ? `<img src="${itemImage.src}" style="width:100%; height:100%; object-fit:contain; image-rendering:pixelated;">` : '';
                dragGhost.style.display = 'block';
                
                // 4. FIX: INSTANTLY POSITION THE GHOST
                dragGhost.style.left = `${initialTouchX - 25}px`; 
                dragGhost.style.top = `${initialTouchY - 25}px`;
                
                // 5. Hide Sidebar (Visual fix)
                if(inventorySidebar) {
                   inventorySidebar.classList.add('dragging');
                }

            }, 500); // 500ms delay for touch-hold drag

        }, { passive: false });
    }
    
    // --- TOUCH MOVE (Position the Manual Drag Ghost) ---
    document.addEventListener('touchmove', (e) => {
        if (!isCustomDragging) return;

        const touch = e.touches[0];
        // Center the drag ghost under the touch point
        dragGhost.style.left = `${touch.clientX - 25}px`; 
        dragGhost.style.top = `${touch.clientY - 25}px`; 
        
        // Simulate dragover highlighting using elementFromPoint
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Check if the target is an input slot
        ['input-slot-1', 'input-slot-2'].forEach(id => {
            const slot = document.getElementById(id);
            if (slot.contains(targetElement)) {
                slot.style.borderColor = '#2ecc71';
            } else {
                slot.style.borderColor = '#4a3e30';
            }
        });

    }, { passive: false });

    // --- TOUCH END (Handle Drop and Cleanup) ---
    document.addEventListener('touchend', (e) => {
        clearTimeout(touchStartTimer);
        
        if (!isCustomDragging) {
            // If the timer didn't complete, it was a click/tap. Restore opacity.
            if (currentDraggedItem) currentDraggedItem.style.opacity = '1.0';
            return; 
        }

        // Determine where the drop occurred
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        
        let dropSuccess = false;

        // 1. Check if dropped onto a valid input slot
        ['input-slot-1', 'input-slot-2'].forEach(id => {
            const slot = document.getElementById(id);
            if (slot.contains(dropTarget) && draggedResourceID) {
                // Successful drop
                gameEngine.placeItemInSlot(id, draggedResourceID, 1);
                dropSuccess = true;
            }
            // Reset slot highlight
            slot.style.borderColor = '#4a3e30';
        });

        // 2. Final cleanup
        endCustomDrag(currentDraggedItem);
        currentDraggedItem = null;
        if (!dropSuccess) {
            // If it was a drag that didn't land on a slot, run a click/tap noise
            AudioController.playClick();
        } 
    });
    
    // --- TOUCH CANCEL (Handles Interruptions/Swipes) ---
    document.addEventListener('touchcancel', (e) => {
        if (isCustomDragging) {
            clearTimeout(touchStartTimer);
            endCustomDrag(currentDraggedItem);
            currentDraggedItem = null;
            AudioController.playClick();
        } else if (currentDraggedItem) {
            // If touch started but timer didn't finish, just restore opacity
            currentDraggedItem.style.opacity = '1.0';
            currentDraggedItem = null;
        }
    });

    // --- NATIVE DRAG/DROP FALLBACK (For mouse and slot-to-slot drag) ---
    
    document.addEventListener('dragstart', (e) => {
        // Prevent inventory items from triggering native drag if touch is active
        if (e.target.closest('.inventory-item')) {
            e.preventDefault(); 
            return;
        }
    });

    document.addEventListener('dragend', (e) => {
        // Cleanup for native slot-to-slot drag (which we still allow)
        if (!isCustomDragging) {
             showInventoryIfOpen();
        }
    });
}

// --- GLOBAL TOGGLE FUNCTION (Define this outside DOMContentLoaded, near other window functions) ---
window.toggleMarketView = function(viewName) {
    const salesView = document.getElementById('market-sales-view');
    const trendsView = document.getElementById('market-trends-view');
    const salesBtn = document.getElementById('sales-tab-btn');
    const trendsBtn = document.getElementById('trends-tab-btn');

    if (viewName === 'sales') {
        salesView?.classList.remove('hidden');
        trendsView?.classList.add('hidden');
        salesBtn?.classList.add('active');
        trendsBtn?.classList.remove('active');
        document.getElementById('market-modal-title').textContent = 'RESOURCE MARKET 📈';
    } else if (viewName === 'trends') {
        // When switching to Trends, ensure the graph and selector are rendered/updated
        if (typeof window.renderMarketTrendSelector === 'function') {
            window.renderMarketTrendSelector(); 
        }
        if (typeof window.renderMarketTrendGraph === 'function') {
            window.renderMarketTrendGraph(); 
        }

        salesView?.classList.add('hidden');
        trendsView?.classList.remove('hidden');
        salesBtn?.classList.remove('active');
        trendsBtn?.classList.add('active');
        document.getElementById('market-modal-title').textContent = 'MARKET VOLATILITY 📉';
    }
};


// --- 4. GLOBAL EVENT BINDING ---
document.addEventListener('DOMContentLoaded', () => { 
    
    // AUDIO FIX: Ensure initialization happens immediately
    if (typeof AudioController !== 'undefined') AudioController.init(); 
    
    initDropZones(); 
    
    // The Synthesis Feedback logic is now fully contained in the updateStatusUI loop.
    const resetAITimer = () => { if (typeof LineAI !== 'undefined') LineAI.resetIdleTimer(); };
    
    // Helper function to attach global button listeners (for non-transaction buttons)
    const attachBinding = (id, func, playClick = true) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                // Ignore clicks that originated from a custom drag
                if (isCustomDragging) {
                    return; 
                }
                
                if (playClick) {
                    AudioController.playClick();
                }
                func();
                resetAITimer();
            });
        }
    };
    
    // --- BINDING START: Main Action Buttons (Flash on success/click) ---
    
    // Synthesize Button Logic (Updated SFX Logic)
    document.getElementById('synthesize-btn')?.addEventListener('click', (e) => {
        if (isCustomDragging) return;
        
        // This relies on gameEngine.processSynthesis to handle ALL error messaging 
        // (empty slot, low mana, no recipe) and success/start logging via LineAI.
        const success = gameEngine.processSynthesis();
        
        if (success) {
            // SFX: SUCCESSFUL synthesis starts the forge sound
            AudioController.playStart();
            // FLASH THE BUTTON ITSELF
            if (typeof flashSuccess !== 'undefined') flashSuccess(e.currentTarget); 
        } else {
            // SFX: UNSUCCESSFUL synthesis (empty slots, low mana, etc.) gets a generic click sound
            AudioController.playClick();
        }
        
        resetAITimer();
    });
    
    // Collect Button Logic (Simplified to rely on Engine's messaging)
    document.getElementById('collect-btn')?.addEventListener('click', (e) => {
        if (isCustomDragging) return;
        
        // 🔊 SFX FIX: Play click sound immediately upon press.
        AudioController.playClick(); 

        // CRITICAL FIX: The engine function now handles the empty check and error message.
        const success = gameEngine.collectOutput();

        if (success) {
            // FLASH THE BUTTON ITSELF
            if (typeof flashSuccess !== 'undefined') flashSuccess(e.currentTarget); 
        }
        
        resetAITimer();
    });
    
    // NEW BINDING: SELL ALL COLLECTIBLE button
    attachBinding('sell-all-btn', () => {
        const success = gameEngine.sellAllProducts();
        if (success) {
            // Note: gameEngine.sellAllProducts handles the UI updates internally
            if (typeof flashSuccess !== 'undefined') flashSuccess(document.getElementById('sell-all-btn')); 
        }
    });
    
    // --- BINDING START: Openers & Closers (Direct Calls) ---
    
    // NEW BINDING: ROUTES MAP HANDLE
    attachBinding('routes-handle', () => {
        const sidebar = document.getElementById('routes-map-sidebar');
        
        // Ensure the other sidebar (Inventory) is closed when opening Routes
        document.getElementById('inventory-sidebar')?.classList.remove('open');
        
        sidebar.classList.toggle('open');
        sidebar.classList.remove('dragging'); // Ensure dragging is cleared on manual toggle
    }); 
    
    // AUDIO FIX: BGM TRIGGER ON INVENTORY TOGGLE
    attachBinding('inventory-handle', () => {
        const sidebar = document.getElementById('inventory-sidebar');
        
        // Ensure the other sidebar (Routes) is closed when opening Inventory
        document.getElementById('routes-map-sidebar')?.classList.remove('open');
        
        // Check if the sidebar is currently closed AND the BGM hasn't started yet
        if (!sidebar.classList.contains('open') && !bgmStarted) {
            AudioController.startBGM();
            bgmStarted = true; // Set flag to prevent future audio attempts on toggle
        }

        sidebar.classList.toggle('open');
        sidebar.classList.remove('dragging'); // Ensure dragging is cleared on manual toggle
    }); 
    
    // MARKET BUTTON: Opens modal and ensures SALES tab is active
    attachBinding('market-btn', () => { 
        window.renderMarketList(); 
        document.getElementById('market-modal').classList.add('visible'); 
        window.toggleMarketView('sales'); // CRITICAL: Ensure Sales tab is shown first
    });
    
    // MARKET TAB TOGGLES
    document.getElementById('sales-tab-btn')?.addEventListener('click', () => {
        window.toggleMarketView('sales');
        AudioController.playClick();
        resetAITimer();
    });

    document.getElementById('trends-tab-btn')?.addEventListener('click', () => {
        window.toggleMarketView('trends');
        AudioController.playClick();
        resetAITimer();
    });

    // CUSTOM PRODUCT SELECT DISPLAY BUTTON (Toggles the list open/closed)
    document.getElementById('product-select-display')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const list = document.getElementById('product-dropdown-list');
        list?.classList.toggle('hidden-list');
        
        // Ensure selector is rendered/updated when opening
        if (!list?.classList.contains('hidden-list') && typeof window.renderMarketTrendSelector === 'function') {
            window.renderMarketTrendSelector(true); // true means render list items
        }
        
        AudioController.playClick();
        resetAITimer();
    });

    // DROPDOWN LIST ITEM CLICK (Selects item)
    document.getElementById('product-dropdown-list')?.addEventListener('click', (e) => {
        const listItem = e.target.closest('li');
        if (!listItem || !listItem.dataset.resourceId) return;

        const displayBtn = document.getElementById('product-select-display');
        const list = document.getElementById('product-dropdown-list');
        
        // 1. Update the display button's text and data-value
        displayBtn.textContent = listItem.textContent;
        displayBtn.dataset.value = listItem.dataset.resourceId;

        // 2. Hide the list
        list?.classList.add('hidden-list');

        // 3. Trigger the graph update logic
        if (typeof window.renderMarketTrendGraph === 'function') {
            window.renderMarketTrendGraph(listItem.dataset.resourceId);
        }
        
        AudioController.playClick();
        resetAITimer();
    });

    // Add a global click listener to hide the dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const list = document.getElementById('product-dropdown-list');
        const displayBtn = document.getElementById('product-select-display');
        
        // Check if the click was NOT on the button or the list itself
        if (list && displayBtn && !list.contains(e.target) && e.target !== displayBtn) {
            list.classList.add('hidden-list');
        }
    });
    
    // GPG CONNECT BUTTON (In profile modal)
    document.getElementById('connect-gpg-btn')?.addEventListener('click', (e) => {
        // This button initiates the native sign-in process
        if (typeof gameEngine.signInGPG === 'function') {
            gameEngine.signInGPG();
        }
        if (typeof AudioController !== 'undefined') AudioController.playClick();
        resetAITimer();
    });

    attachBinding('upgrade-btn', window.openUpgradesUI); 
    attachBinding('shop-btn', () => { window.renderIAPList(); document.getElementById('iap-shop-modal').classList.add('visible'); }); 
    attachBinding('research-btn', () => { window.renderRecipeBookList(); document.getElementById('recipe-book-modal').classList.add('visible'); }); 
    attachBinding('player-profile-icon', window.openProfileModal); 
    
    // --- MENU MODAL OPENERS ---
    attachBinding('menu-btn', () => { 
        document.getElementById('menu-modal').classList.add('visible'); 
    });
    
    attachBinding('close-menu-btn', () => { 
        document.getElementById('menu-modal').classList.remove('visible'); 
    });
    
    // --- SUB-MENU OPENERS ---
    attachBinding('settings-btn', () => { 
        document.getElementById('settings-modal').classList.add('visible'); 
    });
    attachBinding('coupons-btn', () => { 
        document.getElementById('coupons-modal').classList.add('visible'); 
    });
    attachBinding('t-and-c-btn', () => { 
        document.getElementById('t-and-c-modal').classList.add('visible'); 
    });
    attachBinding('credits-btn', () => { 
        document.getElementById('credits-modal').classList.add('visible'); 
    });
    attachBinding('about-us-btn', () => { 
        document.getElementById('about-us-modal').classList.add('visible'); 
    });

    // --- SUB-MENU CLOSERS ---
    attachBinding('close-settings-btn', () => { 
        document.getElementById('settings-modal').classList.remove('visible'); 
    });
    attachBinding('close-coupons-btn', () => { 
        document.getElementById('coupons-modal').classList.remove('visible'); 
    });
    attachBinding('close-credits-btn', () => { 
        document.getElementById('credits-modal').classList.remove('visible'); 
    });
    attachBinding('close-t-and-c-btn', () => { 
        document.getElementById('t-and-c-modal').classList.remove('visible'); 
    });
    attachBinding('close-about-us-btn', () => { 
        document.getElementById('about-us-modal').classList.remove('visible'); 
    });
    
    // --- SAVE/EXIT BUTTONS ---
    attachBinding('save-game-btn', () => {
        if (typeof gameEngine.saveGame === 'function') {
            gameEngine.saveGame();
        }
        if (typeof flashSuccess !== 'undefined') flashSuccess(document.getElementById('save-game-btn')); 
    });
    
    attachBinding('exit-game-btn', () => {
        if (typeof LineAI !== 'undefined') LineAI.showGeneralError("Exiting game...", 'warning');
        if (typeof gameEngine.saveGame === 'function') {
            gameEngine.saveGame();
        }
        console.log("Game saved and exit sequence initiated.");
    });
    
    // Closers (Redundant definitions for safety)
    attachBinding('close-market-btn',      () => document.getElementById('market-modal').classList.remove('visible')); 
    attachBinding('close-trends-btn',      () => document.getElementById('trends-modal').classList.remove('visible')); 
    attachBinding('close-shop-btn',        () => document.getElementById('upgrades-modal').classList.remove('visible'));
    attachBinding('close-iap-btn',         () => document.getElementById('iap-shop-modal').classList.remove('visible')); 
    attachBinding('close-profile-btn',     () => document.getElementById('player-profile-modal').classList.remove('visible')); 
    attachBinding('close-worker-detail-btn', () => { window.closeWorkerDetailModal(); AudioController.playClick(); resetAITimer(); }, false); 
    attachBinding('close-recipe-btn',      () => document.getElementById('recipe-book-modal').classList.remove('visible')); 

    // --- BINDING START: Dynamic Content Handlers (Event Delegation with Flash) ---
    
    // 1. Buy Upgrade Buttons
    const upgradeList = document.getElementById('upgrade-list');
    if (upgradeList) {
        upgradeList.addEventListener('click', (e) => {
            
            const btn = e.target.closest('.buy-upgrade-btn');
            if (btn) {
                e.stopPropagation(); 
                const success = gameEngine.buyUpgrade(btn.dataset.upgradeId); 
                window.renderUpgradeList(); 
                AudioController.playClick();
                if (success && typeof flashSuccess !== 'undefined') flashSuccess(btn); // FLASH BUTTON
                resetAITimer();
            }
        });
    }

    // 2. Hire/Unlock Worker/Acquire Blueprint Buttons
    const workerList = document.getElementById('worker-list');
    if (workerList) {
        workerList.addEventListener('click', (e) => {
            
            const hireBtn = e.target.closest('.hire-worker-btn');
            const unlockBtn = e.target.closest('.unlock-worker-btn');
            let success = false;
            const targetBtn = hireBtn || unlockBtn;

            if (hireBtn) {
                e.stopPropagation(); 
                success = gameEngine.acquireBlueprint(hireBtn.dataset.workerId); 
                window.renderWorkerList(); 
                AudioController.playClick();
            } else if (unlockBtn) {
                e.stopPropagation(); 
                success = gameEngine.researchWorkerType(unlockBtn.dataset.workerId); 
                window.renderWorkerList(); 
                AudioController.playClick();
            }
            
            if (success && targetBtn && typeof flashSuccess !== 'undefined') flashSuccess(targetBtn); // FLASH BUTTON
            resetAITimer();
        });
    }
    
    // 3. Sell Resource Buttons (Dynamic list items)
    const marketList = document.getElementById('market-list');
    if (marketList) {
        marketList.addEventListener('click', (e) => {
            
            const sellOneBtn = e.target.closest('.sell-one-btn');
            if (sellOneBtn) {
                e.stopPropagation();
                gameEngine.sellResource(sellOneBtn.dataset.resourceId, 1);
                window.renderMarketList();
                AudioController.playClick();
                resetAITimer();
            }
        });
    }

    // 4. Research Recipe Button
    const recipeList = document.getElementById('recipe-list');
    if (recipeList) {
        recipeList.addEventListener('click', (e) => {
            
            const btn = e.target.closest('.research-btn');
            if (btn) {
                e.stopPropagation(); 
                const recipeId = btn.dataset.recipeId; 
                
                if (!btn.disabled) {
                    const researchSuccess = gameEngine.researchRecipe(recipeId); 
                    
                    if (typeof AudioController !== 'undefined') {
                         if (researchSuccess) {
                            AudioController.playUnlock(); 
                            if (typeof flashSuccess !== 'undefined') flashSuccess(btn); // FLASH BUTTON
                         } else {
                            AudioController.playClick(); 
                         }
                    }
                    window.renderRecipeBookList(); 
                    resetAITimer();
                } else {
                    AudioController.playClick();
                }
            }
        });
    }
    
    // 5. IAP List Buy Buttons (DYNAMIC LIST)
    const iapListContainer = document.querySelector('.iap-list-grid');
    if (iapListContainer) {
        iapListContainer.addEventListener('click', (e) => {
            
            const btn = e.target.closest('.buy-iap-btn');
            if (btn) {
                e.stopPropagation(); 
                const iapId = btn.dataset.iapId; 
                
                // CRITICAL: Call the engine function to start the server-side purchase process
                const success = gameEngine.processIAP(iapId); 
                
                if (typeof AudioController !== 'undefined') AudioController.playClick();
                if (success && typeof flashSuccess !== 'undefined') flashSuccess(btn); // FLASH BUTTON
                resetAITimer();
            }
        });
    }

    // 6. Ad Reward Button (STATIC)
    document.getElementById('ad-reward-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const success = gameEngine.processAdReward();
        
        if (typeof AudioController !== 'undefined') AudioController.playClick();
        if (success && typeof flashSuccess !== 'undefined') flashSuccess(e.currentTarget); 
        resetAITimer();
    });

    // 7. Remove Ads Button (STATIC)
    document.getElementById('remove-ads-btn')?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const iapId = e.currentTarget.dataset.iapId; 
        
        // CRITICAL: Call the engine function to start the server-side purchase process
        const success = gameEngine.processIAP(iapId); 
        
        if (typeof AudioController !== 'undefined') AudioController.playClick();
        if (success && typeof flashSuccess !== 'undefined') flashSuccess(e.currentTarget); 
        resetAITimer();
    });
    
    // --- BINDING START: Settings Toggles (Placeholder Logic) ---
    document.querySelectorAll('.setting-toggle-row .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            AudioController.playClick();
            const currentState = btn.textContent;
            
            if (currentState === 'ON') {
                btn.textContent = 'OFF';
                btn.classList.add('off');
                // Future: Add engine logic to disable setting
                if (typeof LineAI !== 'undefined') LineAI.showGeneralError(`${btn.dataset.setting} notifications OFF.`, 'warning');
            } else {
                btn.textContent = 'ON';
                btn.classList.remove('off');
                 // Future: Add engine logic to enable setting
                if (typeof LineAI !== 'undefined') LineAI.showGeneralError(`${btn.dataset.setting} notifications ON.`, 'success');
            }
            resetAITimer();
        });
    });

    // --- BINDING START: Coupon Redemption ---
    attachBinding('redeem-coupon-btn', () => {
        const input = document.getElementById('coupon-code-input');
        const messageEl = document.getElementById('coupon-message');
        const code = input.value.toUpperCase().trim();
        
        if (code.length === 0) {
             messageEl.textContent = 'Please enter a coupon code.';
             messageEl.style.color = 'var(--color-border)';
             return;
        }

        // Call the engine's redemption logic
        const success = gameEngine.redeemCoupon(code);
        
        if (success) {
            // Clear input and show success message
            messageEl.textContent = `CODE ACCEPTED! Rewards credited.`;
            messageEl.style.color = 'var(--highlight-green)';
            input.value = '';
        } else {
             // The engine handles the specific error message (invalid/used) via LineAI.
             messageEl.textContent = 'Code rejected. Check LineAI for details.';
             messageEl.style.color = 'var(--color-synthesis-btn-primary)';
        }
        resetAITimer();
    });


    // Quantity button listeners 
    document.querySelectorAll('.qty-minus').forEach(btn => { 
        if(btn) btn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            gameEngine.updateSlotQuantity(btn.dataset.slotId, -1); 
            resetAITimer();
            AudioController.playClick();
        }); 
    }); 
    
    document.querySelectorAll('.qty-plus').forEach(btn => { 
        if(btn) btn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            gameEngine.updateSlotQuantity(btn.dataset.slotId, 1); 
            resetAITimer();
            AudioController.playClick();
        }); 
    }); 
});
