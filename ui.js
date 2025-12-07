// =================================================================
// ui.js - UI RENDERING & DISPLAY FUNCTIONS (Final Stable Baseline)
// STATUS: All prior fixes retained. Slider interaction decoupled from error reporting.
// =================================================================

// --- GLOBAL STABILITY FLAG (Only needed for complex init guards, keeping for safety) ---
let initialStatusDisplayed = false;

// --- 0. UTIL HELPERS (New) ---
(function(){
    // Safe number formatter to avoid toFixed throwing on undefined/null
    window.safeToFixed = function(val, decimals = 2) {
        if (typeof val === 'number' && isFinite(val)) return val.toFixed(decimals);
        return (0).toFixed(decimals);
    };

    window.safeToFixedInt = function(val) {
        if (typeof val === 'number' && isFinite(val)) return Math.round(val).toString();
        return '0';
    };

    // Safe text setter
    window.setTxt = function(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    // Convert month number (1-12) to single-letter or fallback
    window.formatMonthAbbrev = function(monthNumber) {
        const MONTH_NAMES_SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
        if (typeof monthNumber !== 'number') return '?';
        return MONTH_NAMES_SHORT[monthNumber - 1] || '?';
    };

    // Format totalSeconds into 00-29 cycle display
    window.formatTimeDisplay = function(totalSeconds) {
        if (typeof totalSeconds !== 'number' || !isFinite(totalSeconds)) totalSeconds = 0;
        const secondsInCycle = totalSeconds % 30;
        return secondsInCycle.toString().padStart(2, '0');
    };
    
    // --- TASK 2 DEPENDENCY: Gaussian Probability Helper (Copied from engine.js) ---
    /**
     * Calculates the scaled Gaussian probability based on value proximity to target.
     * @param {number} value - Player input value.
     * @param {number} target - Recipe target value (mean μ).
     * @param {number} sigma - Standard deviation (σ).
     * @returns {number} Probability (0 to 1).
     */
    window.gaussianProbability = function(value, target, sigma) {
        const exponent = -Math.pow(value - target, 2) / (2 * Math.pow(sigma, 2));
        return Math.exp(exponent);
    }
})();

// --- 1. UTILITY FUNCTION (For triggering button/row animations) ---
window.flashSuccess = function(element) {
    if (!element) return;
    const target = element.closest('button') || element.closest('.shop-item-row') || element.closest('.recipe-item') || element.closest('.iap-item-row') || element;
    target.classList.add('success-flash-button');
    setTimeout(() => {
        target.classList.remove('success-flash-button');
    }, 450);
};

// --- NEW CRITICAL FUNCTION: Level Up Animation Trigger ---
window.triggerLevelUpAnimation = function(newLevel) {
    const overlay = document.getElementById('level-up-animation');
    const numberEl = document.getElementById('level-up-number');
    const rewardEl = document.getElementById('level-up-reward');

    if (!overlay || !numberEl || !rewardEl) return;

    // 1. Set text content
    numberEl.textContent = newLevel;
    // Note: The reward message is simple here, LineAI provides the main text status
    rewardEl.textContent = "New Research Unlocked!"; 

    // 2. Start animation by applying classes
    overlay.classList.add('visible');
    overlay.classList.add('active');

    // 3. Clean up classes after animation duration (1.5s as defined in animations.css)
    setTimeout(() => {
        overlay.classList.remove('active');
        // Delay removal of 'visible' to ensure smooth opacity transition out
        setTimeout(() => {
             overlay.classList.remove('visible');
        }, 300); 
    }, 1500); 

    // Optional: Play level up sound if AudioController is defined globally
    if (typeof AudioController !== 'undefined' && typeof AudioController.playLevelUp === 'function') {
        AudioController.playLevelUp();
    }
};

// --- 2. CORE RENDERING FUNCTIONS ---

window.updateStatusUI = function() {
    if (typeof gameEngine === 'undefined') return;
    const state = gameEngine.getGameState();

    // use setTxt helper
    setTxt('dcoin-value', typeof state.dCoin === 'number' ? safeToFixed(state.dCoin, 2) : '0.00');
    setTxt('rp-value', typeof state.rp !== 'undefined' ? String(state.rp) : '0');

    setTxt('mana-value', `${safeToFixedInt(state.mana || 0)}/${safeToFixedInt(state.maxMana || 0)}`);

    const heatEl = document.getElementById('heat-value');
    if (heatEl) {
        const heatVal = (typeof state.heat === 'number' && isFinite(state.heat)) ? state.heat : 0;
        heatEl.style.color = heatVal >= 50 ? '#e74c3c' : '#383025';
        setTxt('heat-value', (heatVal).toFixed(1));
    }

    // TIME DISPLAY FIX
    setTxt('game-time', formatTimeDisplay(typeof gameEngine.getGameTime === 'function' ? gameEngine.getGameTime() : 0));

    // LEVEL / EXP / DATE
    setTxt('level-display', `Level: ${state.level || 0}`);
    const nextLevelExp = (state.level && typeof state.level === 'number') ? state.level * 100 : 100;
    setTxt('exp-display', `EXP: ${state.exp || 0} / ${nextLevelExp}`);

    if (typeof gameEngine.getFormattedDate === 'function') {
        const fd = gameEngine.getFormattedDate();
        setTxt('game-date', fd || '');
    }

    const synthBtn = document.getElementById('synthesize-btn');
    const collBtn = document.getElementById('collect-btn');

    if (synthBtn) {
        if (state.synthesisTimer > 0) {
            synthBtn.textContent = `BUSY (${state.synthesisTimer}s)`;
            synthBtn.disabled = true;
            if (collBtn) collBtn.disabled = true;

            // Synthesis running message takes priority over everything else
            if (typeof LineAI !== 'undefined' && state.synthesisTimer % 5 === 0) {
                LineAI.showGeneralError(`STATUS: Synthesis running. ${state.synthesisTimer}s remaining.`, 'warning');
            }

        } else {
            synthBtn.textContent = "SYNTHESIZE";
            synthBtn.disabled = false;
            if (collBtn) collBtn.disabled = state.output === null;
            
            // If the forge is NOT busy, update the real-time feedback immediately
            updateSynthesisFeedbackUI(); 
        }
    }
    
    // UI rendering calls (always run)
    updateWorkerSlotsUI();
    updateSynthesisSlotsUI(false); // Do not run feedback here, done above in synth check
    
    // Set flag after the initial screen render/update logic has run once.
    if (!initialStatusDisplayed) {
         initialStatusDisplayed = true;
    }
};

window.updateOutputUI = function() {
    if (typeof gameEngine === 'undefined') return;
    const state = gameEngine.getGameState();
    const outputSlot = document.getElementById('output-slot');
    if (!outputSlot) return;

    outputSlot.innerHTML = '';

    if (state.output) {
        const details = gameEngine.getResourceDetails(state.output) || {};
        const qtyHtml = state.outputQuantity > 1 ? `<span class="quantity-text">${state.outputQuantity}</span>` : '';
        const icon = details.icon || '';
        const name = details.name || '';
        outputSlot.innerHTML = `<img src="${icon}" alt="${name}" onerror="handleImgError(this)">${qtyHtml}`;
    } else if (state.synthesisTimer > 0) {
        outputSlot.innerHTML = `<span style="font-size:9px;">...</span>`;
    }
};

window.updateInventoryUI = function() {
    if (typeof gameEngine === 'undefined') return;
    const inv = gameEngine.getGameState().inventory || {};
    const grid = document.querySelector('.inventory-items-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (const [id, count] of Object.entries(inv)) {
        if (count > 0) {
            const details = gameEngine.getResourceDetails(id) || {};
            const div = document.createElement('div');
            div.className = 'inventory-item';

            // DO NOT set draggable here as per critical fix
            div.dataset.resourceId = id;
            const icon = details.icon || '';
            const name = details.name || id;
            div.innerHTML = `<img src="${icon}" alt="${name}" onerror="handleImgError(this)"><span>${name} (${count})</span>`;

            grid.appendChild(div);
        }
    }
};

// Robust helper to access synthesis slot data regardless of engine shape
function _getSynthesisSlotData(slots, id) {
    if (!slots) return null;
    // direct keyed access
    if (slots[id]) return slots[id];
    // numeric fallback: input-slot-1 -> 1
    const m = id.match(/(\d+)$/);
    if (m) {
        const idx = parseInt(m[1], 10);
        if (Array.isArray(slots)) {
            return slots[idx - 1] || slots[idx] || null;
        } else {
            // maybe keys are 0/1 or 'slot1'
            return slots[idx - 1] || slots[idx] || slots['slot' + idx] || null;
        }
    }
    // last fallback: try to return first non-empty slot
    if (Array.isArray(slots) && slots.length > 0) return slots[0];
    return null;
}

window.updateSynthesisSlotsUI = function(updateFeedback = true) {
    if (typeof gameEngine === 'undefined') return;
    const rawSlots = gameEngine.getGameState().synthesisSlots;
    const slots = rawSlots || {};
    ['input-slot-1', 'input-slot-2'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const data = _getSynthesisSlotData(slots, id);
        const num = id.slice(-1);
        const qtyCtrl = document.getElementById(`quantity-controls-${num}`);

        el.innerHTML = '';

        if (data && data.resourceID) {
            const details = gameEngine.getResourceDetails(data.resourceID) || {};
            const qtyHtml = data.quantity > 1 ? `<span class="quantity-text">${data.quantity}</span>` : '';
            el.innerHTML = `<img src="${details.icon || ''}" alt="${details.name || ''}" onerror="handleImgError(this)">${qtyHtml}`;

            // Slot items are natively draggable
            el.setAttribute('draggable', 'true');
            el.dataset.slotId = id;
            el.dataset.resourceId = data.resourceID;

            if (qtyCtrl) {
                const currentQtyInInventory = (gameEngine.getGameState().inventory || {})[data.resourceID] || 0;
                const max = currentQtyInInventory + (data.quantity || 0);

                if ((data.quantity > 1) || currentQtyInInventory > 0) {
                    qtyCtrl.style.display = 'flex';
                    const minusBtn = qtyCtrl.querySelector('.qty-minus');
                    const plusBtn = qtyCtrl.querySelector('.qty-plus');
                    if (minusBtn) minusBtn.disabled = data.quantity <= 1;
                    if (plusBtn) plusBtn.disabled = data.quantity >= max;
                } else {
                    qtyCtrl.style.display = 'none';
                }
            }
        } else {
            el.removeAttribute('draggable');
            // safer than delete
            el.dataset.slotId = '';
            el.dataset.resourceId = '';
            if (qtyCtrl) qtyCtrl.style.display = 'none';
        }
    });
    
    if (updateFeedback) {
        // Trigger feedback for drag/drop interaction
        updateSynthesisFeedbackUI();
    }
};

window.updateWorkerSlotsUI = function() {
    if (typeof gameEngine === 'undefined') return;
    const state = gameEngine.getGameState();
    const container = document.getElementById('worker-slots-container');
    if (!container) return;

    container.innerHTML = '';
    
    // Max display remains correct based on state
    const maxDisplay = document.getElementById('max-worker-slots-display');
    if (maxDisplay) maxDisplay.textContent = state.maxWorkerSlots || 0;

    const activeWorkers = state.activeWorkers || [];
    const maxSlotsPurchased = state.maxWorkerSlots || 1;
    const HARD_CAP = 6; // Use the hard cap definition for the overall roster length

    // 1. Render ACTIVE Workers
    activeWorkers.forEach(w => {
        const div = document.createElement('div');
        div.className = 'worker-slot active';

        div.innerHTML = `
            <img src="${w.icon || ''}" alt="${w.name || ''}" onerror="handleImgError(this)">
            <span class="worker-name-overlay">${w.name || ''}</span>
        `;
        div.onclick = () => window.openWorkerDetailModal(w);
        container.appendChild(div);
    });

    // 2. Render EMPTY (Purchased) Slots
    // i starts after the number of active workers, and stops at the purchased maximum
    for (let i = activeWorkers.length; i < maxSlotsPurchased; i++) {
        const div = document.createElement('div');
        div.className = 'worker-slot empty';
        div.innerHTML = '<div class="add-worker-icon">+</div>';
        div.onclick = () => window.openUpgradesUI();
        container.appendChild(div);
    }

    // 3. Render LOCKED (Unpurchased) Slots
    // i starts at the purchased maximum, and stops at the hard cap (6)
    for (let i = maxSlotsPurchased; i < HARD_CAP; i++) {
        const div = document.createElement('div');
        div.className = 'worker-slot locked';
        div.innerHTML = '<div class="add-worker-icon"></div>';
        // Locked slots should direct to upgrades, too, if clicked.
        div.onclick = () => window.openUpgradesUI(); 
        container.appendChild(div);
    }
};

// --- CRITICAL FUNCTION: Synthesis Feedback (Tasks 1 & 2) ---

window.updateSynthesisFeedbackUI = function() {
    if (typeof gameEngine === 'undefined' || typeof LineAI === 'undefined') return; 

    // CRITICAL FIX: Use the safe access method
    const slots = gameEngine.getGameState().synthesisSlots || {};
    const slot1 = (_getSynthesisSlotData(slots, 'input-slot-1') || {}).resourceID || null;
    const slot2 = (_getSynthesisSlotData(slots, 'input-slot-2') || {}).resourceID || null;
    
    const msgEl = document.getElementById('system-ready'); 
    
    const freqSlider = document.getElementById('temporal-frequency-slider');
    const pressureSlider = document.getElementById('thermal-pressure-slider');
    const targetFreqEl = document.getElementById('freq-target');
    const targetPressureEl = document.getElementById('pressure-target');

    const DEFAULT_FREQ = 50;
    const DEFAULT_PRESSURE = 500;
    let targetFreq = DEFAULT_FREQ;
    let targetPressure = DEFAULT_PRESSURE;
    let slotsAreOccupied = slot1 && slot2;
    
    // --- 1. Handle Empty Slots (Stabilized) ---
    if (!slotsAreOccupied) {
         // Reset targets to default display
         if (targetFreqEl) targetFreqEl.textContent = DEFAULT_FREQ.toFixed(0);
         if (targetPressureEl) targetPressureEl.textContent = DEFAULT_PRESSURE.toFixed(0);
         
         const isCurrentlyShowingTip = LineAI.isTipActive();
         const isCurrentlyShowingError = msgEl && msgEl.textContent.includes("Need two resources");
         const isBusy = gameEngine.getGameState().synthesisTimer > 0;
         
         if (!isBusy) {
             // CRITICAL FIX: This code path will ONLY be taken when updateStatusUI runs.
             // If a tip is active, we do nothing and let the tip persist.
             // If the error is already showing, we do nothing (the loop runs silently).
             // This completely removes the persistent overwrite.
             if (!isCurrentlyShowingTip && !isCurrentlyShowingError) {
                  // Only update the targets to defaults, DO NOT show the error here. 
                  // The error is now exclusively handled by the SYNTHESIZE button logic in engine.js.
                  // By returning here, we allow the LineAI tip to run its course.
             }
         }
         
         return; // Exit if slots are empty
    }

    // --- 2. Handle Occupied Slots (Active Feedback) ---
    let message = "";
    let type = 'ready'; 
    let sigmaFreq = 15;
    let sigmaPressure = 200;

    const sortedIDs = [slot1, slot2].sort().join('|');
    const recipe = gameEngine.getRecipeBook()[sortedIDs];

    if (recipe) {
        const rpCost = recipe.rpCost || 0;
        
        // --- Determine Targets and Sigmas (Heuristic from engine.js) ---
        targetFreq = recipe.TargetFrequency !== undefined ? recipe.TargetFrequency : 50; 
        targetPressure = recipe.TargetPressure !== undefined ? recipe.TargetPressure : (rpCost * 4 > 1000 ? 1000 : rpCost * 4 + 300); 

        if (rpCost > 500) {
            sigmaFreq = 8;
            sigmaPressure = 100;
        } else if (rpCost > 100) {
            sigmaFreq = 12;
            sigmaPressure = 150;
        }
        
        // --- Calculate Accuracy (Real-time Feedback) ---
        const playerFreq = parseFloat(freqSlider.value);
        const playerPressure = parseFloat(pressureSlider.value);
        
        const probFreq = window.gaussianProbability(playerFreq, targetFreq, sigmaFreq);
        const probPressure = window.gaussianProbability(playerPressure, targetPressure, sigmaPressure);
        
        let accuracy = (probFreq * probPressure * 100.0);
        
        if (accuracy >= 95) {
            message = `[FEEDBACK]: Accuracy: ${accuracy.toFixed(2)}%! Excellent synchronization.`;
            type = 'success';
        } else if (accuracy >= 50) {
            message = `[FEEDBACK]: Accuracy: ${accuracy.toFixed(2)}%. Requires finer adjustment.`;
            type = 'warning';
        } else {
            message = `[FEEDBACK]: Accuracy: ${accuracy.toFixed(2)}%. Poor synchronization. Check targets.`;
            type = 'error';
        }

    } else {
        // No recipe found (Unstable combination)
        message = "[FEEDBACK]: Unstable combination. Immediate failure likely.";
        type = 'error';
        
        // Set targets to default
        targetFreq = DEFAULT_FREQ;
        targetPressure = DEFAULT_PRESSURE;
    }

    // --- 3. Update UI and Message ---
    
    // Set targets display
    if (targetFreqEl) targetFreqEl.textContent = targetFreq.toFixed(0);
    if (targetPressureEl) targetPressureEl.textContent = targetPressure.toFixed(0);
    
    // Show the active feedback message only if the forge is not busy
    if (gameEngine.getGameState().synthesisTimer === 0) {
         LineAI.showGeneralError(message, type);
    }
};

// --- BINDING SYNTHESIS FEEDBACK TO SLIDERS (Decoupled Stability) ---
document.addEventListener('DOMContentLoaded', () => {
    const freqSlider = document.getElementById('temporal-frequency-slider');
    const pressureSlider = document.getElementById('thermal-pressure-slider');
    const freqDisplay = document.getElementById('freq-display');
    const pressureDisplay = document.getElementById('pressure-display');

    // Helper to check if slots are occupied (CRITICAL FIX: Use safe access)
    const slotsOccupied = () => {
        const slots = gameEngine.getGameState().synthesisSlots || {};
        const s1 = _getSynthesisSlotData(slots, 'input-slot-1');
        const s2 = _getSynthesisSlotData(slots, 'input-slot-2');
        
        return !!(s1 && s1.resourceID && s2 && s2.resourceID);
    };


    const updateSliderDisplay = (slider, displayEl) => {
        if (displayEl) displayEl.textContent = parseFloat(slider.value).toFixed(0);
        
        // CRITICAL FIX: Only run the full feedback loop if slots are occupied (active work mode).
        if (slotsOccupied()) {
             updateSynthesisFeedbackUI();
        } 
        // Else: If slots are empty, we do nothing, letting the 1s updateStatusUI loop 
        // handle the passive error/tip cycle (which is now guaranteed stable).
    };
    
    // We only need the binding for updating the numerical display on the slider.
    if (freqSlider) {
        freqSlider.addEventListener('input', () => updateSliderDisplay(freqSlider, freqDisplay));
    }
    if (pressureSlider) {
        pressureSlider.addEventListener('input', () => updateSliderDisplay(pressureSlider, pressureDisplay));
    }
    
    // Initial call to set up the default display (will be handled by the next updateStatusUI loop)
    // We explicitly avoid calling updateSynthesisFeedbackUI() here to prevent conflicts.
    // However, for initial UI consistency, we run it once:
    updateSynthesisFeedbackUI();
});


// --- 4. MODAL OPENERS ---

window.openUpgradesUI = function() {
    window.renderUpgradeList();
    window.renderWorkerList();
    const modal = document.getElementById('upgrades-modal');
    if (modal) modal.classList.add('visible');
};

// FIX: Worker Detail Modal to conditionally insert Maintenance Cost row
window.openWorkerDetailModal = function(worker) {
    if (typeof gameEngine === 'undefined') return;
    const modal = document.getElementById('worker-detail-modal');
    if (!modal) return;

    // activeWorkerInstanceId might be global; keep using it
    activeWorkerInstanceId = worker.id;

    const workerImageEl = document.getElementById('worker-detail-image');
    if (workerImageEl) {
        workerImageEl.src = worker.icon || '';
        workerImageEl.alt = worker.name || '';
        workerImageEl.style.display = 'block';
    }

    const blueprint = gameEngine.getWorkerCatalog && gameEngine.getWorkerCatalog()[worker.typeID];
    const maintenanceCost = blueprint ? blueprint.dCoinMaintenance : null; // Retrieve the cost

    document.getElementById('worker-detail-name').textContent = worker.name || 'Unknown';
    document.getElementById('worker-detail-type').textContent = blueprint ? blueprint.type : 'Unknown';
    document.getElementById('worker-detail-resource').textContent = gameEngine.getResourceName ? gameEngine.getResourceName(worker.resourceID) : '';
    document.getElementById('worker-detail-rate').textContent = ((worker.productionRate || 0) * 60).toFixed(0);

    const fatigueEl = document.getElementById('worker-detail-fatigue');
    if (fatigueEl) fatigueEl.innerHTML = `<span>${(worker.fatigue || 0).toFixed(1)}</span><span>%</span>`;

    const statusText = worker.isWorking ? 'WORKING' : (worker.fatigue >= worker.maxFatigue ? 'EXHAUSTED' : 'RESTING');
    document.getElementById('worker-detail-status').textContent = statusText;

    const statsList = document.querySelector('.worker-stats-list');
    if (statsList) {
        // 1. Remove any existing maintenance cost row before re-insertion
        let costRow = document.getElementById('worker-maintenance-cost');
        if (costRow) costRow.remove();

        // 2. Conditionally insert the Maintenance Cost row
        if (maintenanceCost !== null && maintenanceCost !== undefined && typeof maintenanceCost === 'number' && maintenanceCost > 0) {
            costRow = document.createElement('p');
            costRow.id = 'worker-maintenance-cost';
            const costDisplay = maintenanceCost.toFixed(2);
            costRow.innerHTML = `<strong>Maintenance:</strong> <span style="color: #a80000;">${costDisplay}</span><span> D Coin / Day</span>`;
            
            // Find insertion point before Fatigue or Status
            const fatigueRow = statsList.querySelector('#worker-detail-fatigue')?.closest('p');
            const statusRow = document.getElementById('worker-detail-status')?.closest('p');
            
            // Insert before the Fatigue row for clean list flow
            if (fatigueRow) {
                statsList.insertBefore(costRow, fatigueRow);
            } else if (statusRow) {
                statsList.insertBefore(costRow, statusRow);
            } else {
                 statsList.appendChild(costRow);
            }
        }
    }

    const toggleBtn = document.getElementById('toggle-worker-rest-btn');
    const fireBtn = document.getElementById('fire-worker-btn');

    if (toggleBtn) toggleBtn.onclick = () => { gameEngine.toggleWorkerRest && gameEngine.toggleWorkerRest(activeWorkerInstanceId); };
    if (fireBtn) fireBtn.onclick = () => { gameEngine.fireWorker && gameEngine.fireWorker(activeWorkerInstanceId); };

    modal.classList.add('visible');
};

window.closeWorkerDetailModal = function() {
    const modal = document.getElementById('worker-detail-modal');
    if (modal) modal.classList.remove('visible');
    activeWorkerInstanceId = null;
};

window.openProfileModal = function() {
    if (typeof gameEngine === 'undefined') return;
    const modal = document.getElementById('player-profile-modal');
    if (!modal) return;

    const state = gameEngine.getGameState();
    const gpgId = state.gpgPlayerID;

    const statusText = gpgId ? 'Connected' : 'Local (GPG Disconnected)';
    const connectBtn = document.getElementById('connect-gpg-btn');

    document.getElementById('profile-user-id').textContent = statusText;

    if (connectBtn) {
        if (gpgId) {
            connectBtn.textContent = "ID: " + (gpgId.substring ? gpgId.substring(0, 10) + "..." : gpgId);
            connectBtn.disabled = true;
        } else {
            connectBtn.textContent = "Connect Google Play";
            connectBtn.disabled = false;
        }
    }

    const profileDetailsEl = document.getElementById('profile-details');
    if (profileDetailsEl) {
        profileDetailsEl.innerHTML = `
            <p><strong>Level:</strong> <span>${state.level || 0}</span></p>
            <p><strong>Experience:</strong> <span>${state.exp || 0} / ${((state.level || 1) * 100)}</span></p>
            <p><strong>D Coin:</strong> <span>${safeToFixed(state.dCoin || 0, 2)}</span></p>
            <p><strong>RP:</strong> <span>${state.rp || 0}</span></p>
            <p><strong>Mana Cap:</strong> <span>${state.maxMana || 0}</span></p>
            <p><strong>Regen Rate:</strong> <span>${state.manaRegenRate || 0}/s</span></p>
            <p><strong>Current Heat:</strong> <span>${(state.heat || 0).toFixed ? (state.heat || 0).toFixed(1) : state.heat || 0}%</span></p>
            <p><strong>Worker Slots:</strong> <span>${(state.activeWorkers || []).length} / ${state.maxWorkerSlots || 0}</span></p>
        `;
    }

    // legacy updates - guarded
    const safeEl = id => document.getElementById(id);
    if (safeEl('profile-level')) safeEl('profile-level').textContent = state.level || 0;
    if (safeEl('profile-exp')) safeEl('profile-exp').textContent = state.exp || 0;
    if (safeEl('profile-exp-to-next')) safeEl('profile-exp-to-next').textContent = (state.level || 0) * 100;
    if (safeEl('profile-dcoin')) safeEl('profile-dcoin').textContent = safeToFixed(state.dCoin || 0, 2);
    if (safeEl('profile-rp')) safeEl('profile-rp').textContent = state.rp || 0;
    if (safeEl('profile-max-mana')) safeEl('profile-max-mana').textContent = state.maxMana || 0;
    if (safeEl('profile-mana-regen')) safeEl('profile-mana-regen').textContent = state.manaRegenRate || 0;
    if (safeEl('profile-heat')) safeEl('profile-heat').textContent = (state.heat || 0).toFixed ? (state.heat || 0).toFixed(1) : state.heat || 0;
    if (safeEl('profile-worker-slots')) safeEl('profile-worker-slots').textContent = `${(state.activeWorkers || []).length} / ${state.maxWorkerSlots || 0}`;

    modal.classList.add('visible');
};

// --- 5. LIST RENDERING IMPLEMENTATIONS ---

window.renderUpgradeList = function() {
    if (typeof gameEngine === 'undefined') return;
    const upgrades = gameEngine.getUpgradeCatalog() || {};
    const listEl = document.getElementById('upgrade-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    const state = gameEngine.getGameState();

    for (const id in upgrades) {
        const upgrade = upgrades[id];
        const purchased = state.purchasedUpgrades && state.purchasedUpgrades[id];
        const costType = upgrade.type === 'worker_slot' ? 'D Coin' : 'RP';
        const costValue = upgrade.type === 'worker_slot' ? safeToFixed(upgrade.dCoinCost || 0, 2) : (upgrade.cost || 0);
        const affordable = upgrade.type === 'worker_slot' ? (state.dCoin >= (upgrade.dCoinCost || 0)) : (state.rp >= (upgrade.cost || 0));
        const levelMet = state.level >= (upgrade.levelUnlock || 1);
        const disabled = purchased || !affordable || !levelMet;

        const titleColor = purchased ? 'style="color: #006400;"' : (levelMet && affordable ? 'style="color: #006400;"' : 'style="color: #7d3c98;"');
        const formattedLevel = ` (Lvl ${upgrade.levelUnlock || 1})`;

        let buttonHTML = "";
        let costDisplay = `${costValue} ${costType}`;

        if (purchased) {
            costDisplay = 'Owned';
            buttonHTML = "";
        } else {
            buttonHTML = `<button class="management-button buy-upgrade-btn" data-upgrade-id="${id}" ${disabled ? 'disabled' : ''}>BUY</button>`;
        }

        const row = document.createElement('div');
        row.className = 'shop-item-row';

        row.innerHTML = `
            <span class="upgrade-description">
                <span class="upgrade-title" ${titleColor}>${upgrade.name}${formattedLevel}</span>
                <span class="upgrade-effect-text">${upgrade.description}</span>
            </span>
            <div class="buy-group">
                <span class="cost">${costValue} ${costType}</span>
                ${buttonHTML}
            </div>
        `;
        listEl.appendChild(row);
    }
};

window.renderWorkerList = function() {
    if (typeof gameEngine === 'undefined') return;
    const wCatalog = gameEngine.getWorkerCatalog() || {};
    const listEl = document.getElementById('worker-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    const state = gameEngine.getGameState();

    const categories = {
        'Worker (T1)': { title: "Apprentice Workers 👷‍♂️", list: [] },
        'Worker (T2)': { title: "Skilled Workers 🧑‍🏭", list: [] },
        'Worker (T3)': { title: "Expert Workers 🧙‍♂️", list: [] },
        'Machine (T3)': { title: "Machines ⚙️", list: [] },
        'Contract (T4)': { title: "Contracts 📜", list: [] },
        'Mine (T5)': { title: "Mines (Passive Acquisition) ⛏️", list: [] },
        'Facility (T6)': { title: "Facilities (Complex Refining) 🧪", list: [] },
        'Syndicate (T7)': { title: "Syndicates (Exotic Automation) 🌟", list: [] },
    };

    for (const id in wCatalog) {
        const worker = wCatalog[id];
        if (worker && categories[worker.type]) {
            categories[worker.type].list.push(worker);
        }
    }

    for (const key in categories) {
        const cat = categories[key];
        if (cat.list.length === 0) continue;
        listEl.innerHTML += `<div class="upgrade-section" style="padding:0; margin-top:15px;"><h4 class="category-header">${cat.title}</h4></div>`;

        cat.list.forEach(worker => {
            const isUnlocked = (gameEngine.getGameState().unlockedWorkerTypes || {})[worker.id];
            let buttonHTML = '', costType = '', costValue = 0, disabled = false, affordable = false, buttonText = '';
            const levelMet = state.level >= (worker.levelUnlock || 1);
            const workerTypeStr = worker.type || '';

            const isAcquisition = workerTypeStr.startsWith('Mine') || workerTypeStr.startsWith('Facility') || workerTypeStr.startsWith('Syndicate');

            if (isAcquisition) {
                costType = 'D Coin';
                costValue = safeToFixed(worker.cost || 0, 2);
                affordable = state.dCoin >= (worker.cost || 0);
                buttonText = 'ACQUIRE';
            } else {
                costType = 'RP';
                costValue = worker.cost || 0;
                affordable = state.rp >= (worker.cost || 0);
                buttonText = 'HIRE';
            }

            if (isUnlocked) {
                disabled = !affordable || (state.activeWorkers && state.activeWorkers.length >= state.maxWorkerSlots);
                buttonHTML = `<button class="management-button hire-worker-btn" data-worker-id="${worker.id}" ${disabled ? 'disabled' : ''}>${buttonText}</button>`;
            } else {
                const rpCost = (worker.rpUnlockCost || 0);
                affordable = state.rp >= rpCost;
                disabled = !affordable || !levelMet;
                buttonHTML = `<button class="research-btn unlock-worker-btn" data-worker-id="${worker.id}" ${disabled ? 'disabled' : ''}>RESEARCH</button>`;
                costValue = rpCost;
                costType = 'RP';
            }

            const titleColor = (isUnlocked && affordable) || (!isUnlocked && affordable && levelMet) ? 'style="color: #006400;"' : 'style="color: #7d3c98;"';
            const formattedLevel = ` (Lvl ${worker.levelUnlock || 1})`;
            
            // Maintenance Cost Display Logic (Bug Fix related)
            let maintenanceDisplay = '';
            if (worker.dCoinMaintenance > 0) {
                 maintenanceDisplay = ` | Maint: ${worker.dCoinMaintenance.toFixed(2)} D/D`;
            }

            const row = document.createElement('div');
            row.className = 'shop-item-row';

            row.innerHTML = `
                <span class="upgrade-description">
                    <span class="upgrade-title" ${titleColor}>${worker.name}${formattedLevel}</span>
                    <span class="upgrade-effect-text">Prod: ${(worker.productionRate || 0) * 60 ? ((worker.productionRate || 0) * 60).toFixed(0) : '0'}/m. Type: ${worker.type || 'N/A'}${maintenanceDisplay}</span>
                </span>
                <div class="buy-group">
                    <span class="cost">${costValue} ${costType}</span>
                    ${buttonHTML}
                </div>
            `;
            listEl.appendChild(row);
        });
    }
};

window.renderMarketList = function() {
    if (typeof gameEngine === 'undefined') return;
    const inventory = gameEngine.getGameState().inventory || {};
    const listEl = document.getElementById('market-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    let foundProducts = false;

    for (const id in inventory) {
        const count = inventory[id];
        const resource = gameEngine.getResourceDetails(id) || {};
        if (count > 0 && resource && resource.type === 'Product') {
            foundProducts = true;
            const row = document.createElement('div');

            const price = (typeof resource.livePrice === 'number') ? resource.livePrice : (resource.basePrice || 0);
            const totalValue = (price * count).toFixed(2);

            row.className = 'market-item-row';

            row.innerHTML = `
                <span>
                    <img src="${resource.icon || ''}" alt="${resource.name || id}" class="coin-icon" style="width:20px; height:20px; vertical-align:middle; margin-right:5px;" onerror="handleImgError(this)">
                    ${resource.name || id} (${count})
                </span>
                <div class="buy-group">
                    <span class="cost">${totalValue} D</span>
                    <button class="management-button sell-one-btn" data-resource-id="${id}">SELL 1</button>
                </div>
            `;
            listEl.appendChild(row);
        }
    }
    if (!foundProducts) { listEl.innerHTML = '<div style="text-align:center; padding: 10px;">No products ready to sell!</div>'; }
};

window.renderRecipeBookList = function() {
    if (typeof gameEngine === 'undefined') return;
    const recipes = gameEngine.getRecipesWithStatus ? gameEngine.getRecipesWithStatus() : [];
    const listEl = document.getElementById('recipe-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    recipes.forEach(recipe => {
        const row = document.createElement('div');
        row.className = 'recipe-item';

        let statusText = 'DEFAULT';
        let statusClass = 'status-locked';
        let buttonHTML = '';
        const affordable = (gameEngine.getGameState().rp || 0) >= (recipe.cost || 0);
        const levelMet = (gameEngine.getGameState().level || 0) >= (recipe.levelUnlock || 0);

        if (recipe.isUnlocked) {
            statusText = 'UNLOCKED';
            statusClass = 'status-unlocked';
            buttonHTML = '';
        } else if (recipe.requiresUnlock) {
            statusText = `Lvl ${recipe.levelUnlock} / ${recipe.cost} RP`;
            if (affordable && levelMet) {
                statusClass = 'status-unlocked';
                buttonHTML = `<button class="research-btn" data-recipe-id="${recipe.id}">RESEARCH</button>`;
            } else {
                statusClass = 'status-locked';
                buttonHTML = `<button class="research-btn" data-recipe-id="${recipe.id}" disabled>RESEARCH</button>`;
            }
        } else {
            statusText = 'AVAILABLE';
            statusClass = 'status-unlocked';
            buttonHTML = '';
        }

        const recipeHtml = `${recipe.input1} + ${recipe.input2} → ${recipe.output}`;

        row.innerHTML = `
            <span class="upgrade-description">${recipeHtml}</span>
            <div class="buy-group">
                <span class="${statusClass} cost">${statusText}</span>
                ${buttonHTML}
            </div>
        `;
        listEl.appendChild(row);
    });
};

// --- NEW: IAP LIST RENDERING ---
window.renderIAPList = function() {
    if (typeof gameEngine === 'undefined' || typeof gameEngine.getIAPCatalog !== 'function') return;
    const catalog = gameEngine.getIAPCatalog() || {};

    const dCoinListEl = document.getElementById('dcoin-iap-list');
    const rpListEl = document.getElementById('rp-iap-list');
    const adRewardBtn = document.getElementById('ad-reward-btn');
    if (!dCoinListEl || !rpListEl) return;

    dCoinListEl.innerHTML = '';
    rpListEl.innerHTML = '';

    for (const id in catalog) {
        const item = catalog[id];
        if (!item || item.type === 'UTILITY') continue;

        const row = document.createElement('div');
        row.className = 'iap-item-row';

        const rewardText = item.type === 'DCOIN' ? `${(item.value || 0).toFixed(0)} D Coin` : `${item.value || 0} RP`;
        const currencyIcon = item.type === 'DCOIN' ? 'assets/sprites/D_coin.png' : 'assets/sprites/RP_icon.png';

        row.innerHTML = `
            <img src="${item.icon || ''}" alt="${item.name || ''}" class="iap-image" onerror="handleImgError(this)">
            <span class="iap-description">
                <span class="iap-title">${rewardText}</span>
                <span class="upgrade-effect-text">${item.description || ''}</span>
            </span>
            <div class="iap-price-group">
                <span class="cost">USD $${(item.price || 0).toFixed(2)}</span>
                <button class="management-button buy-iap-btn" data-iap-id="${id}">BUY</button>
            </div>
        `;

        if (item.type === 'DCOIN') {
            dCoinListEl.appendChild(row);
        } else if (item.type === 'RP') {
            rpListEl.appendChild(row);
        }
    }

    const removeAdsBtn = document.getElementById('remove-ads-btn');
    const isAdsRemoved = gameEngine.getGameState().purchasedUpgrades && gameEngine.getGameState().purchasedUpgrades['IAP_REMOVE_ADS'];

    if (removeAdsBtn) {
        if (isAdsRemoved) {
            removeAdsBtn.textContent = "Ads Permanently Removed";
            removeAdsBtn.disabled = true;
            const closeCost = removeAdsBtn.closest('.ad-removal-section') && removeAdsBtn.closest('.ad-removal-section').querySelector('.cost');
            if (closeCost) closeCost.textContent = 'Owned';
        } else {
            removeAdsBtn.textContent = "REMOVE ALL ADS";
            removeAdsBtn.disabled = false;
        }
    }

    if (adRewardBtn) {
        if (isAdsRemoved) {
            adRewardBtn.textContent = "Ads Removed";
            adRewardBtn.disabled = true;
            const sec = adRewardBtn.closest('.ad-reward-section');
            if (sec) sec.style.border = '2px dashed #7f8c8d';
        } else {
            adRewardBtn.disabled = false;
        }
    }
};

// --- 6. MARKET TRENDS / GRAPH ---

window.renderMarketTrendSelector = function(renderListItems = false) {
    if (typeof gameEngine === 'undefined') return;
    const displayBtn = document.getElementById('product-select-display');
    const listEl = document.getElementById('product-dropdown-list');
    if (!displayBtn || !listEl) return;

    if (typeof resourceCatalog === 'undefined') {
        displayBtn.textContent = "No Products Available";
        displayBtn.dataset.value = '';
        return;
    }

    const allResources = Object.values(resourceCatalog || {});
    const products = allResources.filter(r => r.type === 'Product');

    if (products.length === 0) {
        displayBtn.textContent = "No Products Available";
        displayBtn.dataset.value = '';
        return;
    }

    if (renderListItems) {
        listEl.innerHTML = '';
        products.forEach(product => {
            const listItem = document.createElement('li');
            listItem.textContent = product.name || 'Unnamed';
            listItem.dataset.resourceId = product.id;
            listEl.appendChild(listItem);
        });
    }

    if (!displayBtn.dataset.value || displayBtn.dataset.value === products[0].id) {
        displayBtn.textContent = "Select Product";
        displayBtn.dataset.value = '';
    } else {
        const selectedProduct = gameEngine.getResourceDetails ? gameEngine.getResourceDetails(displayBtn.dataset.value) : null;
        if (selectedProduct) displayBtn.textContent = selectedProduct.name;
        else {
            displayBtn.textContent = "Select Product";
            displayBtn.dataset.value = '';
        }
    }
};

// normalize history entries into consistent objects
function _normalizeMarketHistoryEntry(h, basePrice, fallbackYear, fallbackMonth) {
    if (!h) return null;
    if (typeof h.multiplier !== 'undefined' && typeof h.finalPrice !== 'undefined' && typeof h.relativeChange !== 'undefined') {
        return {
            year: h.year || fallbackYear,
            month: h.month || fallbackMonth,
            multiplier: h.multiplier,
            finalPrice: h.finalPrice,
            relativeChange: h.relativeChange
        };
    }
    if (typeof h.finalPrice !== 'undefined') {
        const multiplier = basePrice ? (h.finalPrice / basePrice) : 1;
        return {
            year: h.year || fallbackYear,
            month: h.month || fallbackMonth,
            multiplier,
            finalPrice: h.finalPrice,
            relativeChange: parseFloat(((multiplier - 1.0) * 100).toFixed(2))
        };
    }
    if (typeof h === 'number') {
        const multiplier = basePrice ? (h / basePrice) : 1;
        return {
            year: fallbackYear,
            month: fallbackMonth,
            multiplier,
            finalPrice: h,
            relativeChange: parseFloat(((multiplier - 1.0) * 100).toFixed(2))
        };
    }
    // unknown shape
    return null;
}

window.renderMarketTrendGraph = function(overrideProductID = null) {
    if (typeof gameEngine === 'undefined') return;

    const displayBtn = document.getElementById('product-select-display');
    let productID = overrideProductID || (displayBtn && displayBtn.dataset ? displayBtn.dataset.value : null);

    const graphContainer = document.getElementById('graph-container');
    const currentTrendStatusEl = document.getElementById('current-trend-status');
    const forecastDisplay = document.getElementById('forecast-value');
    const forecastMonthEl = document.getElementById('forecast-month-display');

    if (!productID || productID.length === 0 || !graphContainer) {
        if (graphContainer) graphContainer.innerHTML = '<p style="text-align: center; padding: 80px 0; font-size: 10px;">Select a product from the dropdown above to view historical trends and forecast.</p>';
        if (currentTrendStatusEl) currentTrendStatusEl.textContent = 'Product not selected.';
        if (forecastDisplay) forecastDisplay.textContent = '-';
        if (forecastMonthEl) forecastMonthEl.textContent = '???';
        return;
    }

    const state = gameEngine.getGameState();
    const rawHistory = (state.marketHistory && state.marketHistory[productID]) ? state.marketHistory[productID] : [];
    const currentProductDetails = gameEngine.getResourceDetails(productID) || {};
    const basePrice = currentProductDetails.basePrice || 0;

    // Normalize history entries
    const fallbackYear = state.year || new Date().getFullYear();
    const fallbackMonth = state.month || (new Date().getMonth() + 1);
    const normalizedHistory = (rawHistory || []).map(h => _normalizeMarketHistoryEntry(h, basePrice, fallbackYear, fallbackMonth)).filter(Boolean);

    // Prepare dataPoints with projections to fill up to NUM_MONTHS_TO_SHOW
    let dataPoints = normalizedHistory.slice(); // historical points
    const NUM_MONTHS_TO_SHOW = 12;

    // If history has fewer than NUM_MONTHS_TO_SHOW, project forward deterministically
    if (dataPoints.length < NUM_MONTHS_TO_SHOW) {
        // determine the last known year/month to base projections on
        let lastYear = fallbackYear;
        let lastMonth = fallbackMonth;
        if (dataPoints.length > 0) {
            const last = dataPoints[dataPoints.length - 1];
            lastYear = last.year;
            lastMonth = last.month;
        } else {
            // no history: start from state.year/state.month or current
            lastYear = state.year || fallbackYear;
            lastMonth = state.month || fallbackMonth;
        }

        // generate until we have NUM_MONTHS_TO_SHOW entries
        let needed = NUM_MONTHS_TO_SHOW - dataPoints.length;
        for (let i = 1; i <= needed; i++) {
            let targetMonthIndex = lastMonth + i;
            let targetYear = lastYear;
            if (targetMonthIndex > 12) {
                targetYear = lastYear + Math.floor((targetMonthIndex - 1) / 12);
                targetMonthIndex = (targetMonthIndex - 1) % 12 + 1;
            }

            const multiplier = typeof gameEngine.generateMonthlyVolatility === 'function'
                ? gameEngine.generateMonthlyVolatility(productID, targetYear, targetMonthIndex)
                : 1.0;

            const finalPrice = parseFloat((basePrice * multiplier).toFixed(4));
            dataPoints.push({
                year: targetYear,
                month: targetMonthIndex,
                multiplier: multiplier,
                finalPrice: finalPrice,
                relativeChange: parseFloat(((multiplier - 1.0) * 100).toFixed(2))
            });
        }
    }

    // ensure we only show last NUM_MONTHS_TO_SHOW points (chronological oldest->newest)
    dataPoints = dataPoints.slice(-NUM_MONTHS_TO_SHOW);

    // Determine currentData: prefer last normalizedHistory element if available, else dataPoints[0]
    const currentData = (normalizedHistory.length > 0) ? normalizedHistory[normalizedHistory.length - 1] : dataPoints[0];
    const priceChange = (currentData && typeof currentData.relativeChange === 'number') ? currentData.relativeChange : 0;
    const statusColor = priceChange >= 0 ? '#006400' : '#a80000';
    if (currentTrendStatusEl) {
        const livePriceText = currentData && typeof currentData.finalPrice === 'number' ? `Live: ${currentData.finalPrice.toFixed(2)} D Coin.` : '';
        currentTrendStatusEl.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% vs Base (${basePrice.toFixed(2)} D Coin). ${livePriceText}`;
        currentTrendStatusEl.style.color = statusColor;
    }

    // determine index of current month in dataPoints
    let curIdx = dataPoints.findIndex(d => d.year === (state.year || fallbackYear) && d.month === (state.month || fallbackMonth));
    if (curIdx === -1) {
        // fallback: if we have normalizedHistory, map last normalizedHistory point to its index in dataPoints
        if (normalizedHistory.length > 0) {
            const nh = normalizedHistory[normalizedHistory.length - 1];
            curIdx = dataPoints.findIndex(d => d.year === nh.year && d.month === nh.month);
            if (curIdx === -1) {
                // last fallback: set to normalizedHistory.length - 1 (bounded)
                curIdx = Math.min(Math.max(normalizedHistory.length - 1, 0), dataPoints.length - 1);
            }
        } else {
            // no history -> treat first point as current
            curIdx = 0;
        }
    }

    const forecastIdx = Math.min(curIdx + 1, dataPoints.length - 1);
    const forecastData = dataPoints[forecastIdx] || null;

    if (forecastMonthEl) {
        if (forecastData) forecastMonthEl.textContent = `Y:${forecastData.year}/${formatMonthAbbrev(forecastData.month)}`;
        else forecastMonthEl.textContent = '???';
    }
    if (forecastDisplay) forecastDisplay.textContent = forecastData ? `${forecastData.relativeChange >= 0 ? '+' : ''}${forecastData.relativeChange.toFixed(2)}%` : '-';
    if (forecastDisplay) forecastDisplay.style.color = (forecastData && forecastData.relativeChange >= 0) ? '#006400' : '#a80000';

    // --- 3. LINE GRAPH RENDERING (consistent coordinate system) ---
    graphContainer.innerHTML = '';

    // graph config - keep big width but allow container overflow horizontally
    const NUM = NUM_MONTHS_TO_SHOW;
    const minM = 0.90;
    const maxM = 1.15;
    const GRAPH_PADDING_Y = 10;
    const INNER_WIDTH = 960; // fixed wide width as per original author intent
    const GRAPH_WIDTH = INNER_WIDTH - 30;
    const GRAPH_HEIGHT = Math.max(120, graphContainer.clientHeight - 50);
    const POINT_GAP = GRAPH_WIDTH / (NUM - 1);

    // Create inner wrapper
    const innerWrapper = document.createElement('div');
    innerWrapper.style.position = 'relative';
    innerWrapper.style.width = `${INNER_WIDTH}px`;
    innerWrapper.style.height = `${graphContainer.clientHeight}px`;
    innerWrapper.style.overflow = 'visible';
    graphContainer.appendChild(innerWrapper);

    // Create actual graph area (where points/lines/labels will live) - align left at 25px
    const graphArea = document.createElement('div');
    graphArea.id = 'graph-visualization-area';
    graphArea.style.position = 'absolute';
    graphArea.style.top = `${GRAPH_PADDING_Y}px`;
    graphArea.style.left = `25px`;
    graphArea.style.width = `${GRAPH_WIDTH}px`;
    graphArea.style.height = `${GRAPH_HEIGHT}px`;
    graphArea.style.overflow = 'visible';
    innerWrapper.appendChild(graphArea);

    // We'll place axis labels also inside graphArea to keep coordinates consistent
    const points = [];

    dataPoints.forEach((data, index) => {
        const multiplier = (data && typeof data.multiplier === 'number') ? data.multiplier : 1.0;
        const isCurrent = (index === curIdx);
        const normalizedValue = (multiplier - minM) / (maxM - minM);
        const yPos = GRAPH_HEIGHT * (1 - normalizedValue);
        const xPos = index * POINT_GAP;

        points.push({ x: xPos, y: yPos, data, isCurrent });

        // point element
        const pointEl = document.createElement('div');
        pointEl.className = 'graph-point';
        pointEl.style.position = 'absolute';
        pointEl.style.width = '8px';
        pointEl.style.height = '8px';
        pointEl.style.borderRadius = '50%';
        pointEl.style.transform = 'translate(-50%, -50%)';
        pointEl.style.backgroundColor = isCurrent ? '#a80000' : (multiplier >= 1.0 ? '#006400' : '#3a74b0');
        pointEl.style.left = `${xPos}px`;
        pointEl.style.top = `${yPos}px`;
        pointEl.title = `${formatMonthAbbrev(data.month)}: ${data.finalPrice.toFixed(2)} D Coin (${data.relativeChange >= 0 ? '+' : ''}${data.relativeChange.toFixed(1)}%)`;
        graphArea.appendChild(pointEl);

        // X-axis label (centered under point)
        const labelEl = document.createElement('div');
        labelEl.className = 'axis-label';
        labelEl.style.position = 'absolute';
        labelEl.style.left = `${xPos}px`;
        labelEl.style.top = `${GRAPH_HEIGHT + 6}px`;
        labelEl.style.transform = 'translateX(-50%)';
        labelEl.style.fontSize = '10px';
        labelEl.textContent = formatMonthAbbrev(data.month);
        graphArea.appendChild(labelEl);

        // line to previous
        if (index > 0) {
            const p1 = points[index - 1];
            const p2 = points[index];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            const lineEl = document.createElement('div');
            lineEl.className = 'graph-line';
            lineEl.style.position = 'absolute';
            lineEl.style.height = '2px';
            lineEl.style.left = `${p1.x}px`;
            lineEl.style.top = `${p1.y}px`;
            lineEl.style.width = `${distance}px`;
            lineEl.style.transformOrigin = '0 50%';
            lineEl.style.transform = `rotate(${angle}rad)`;
            lineEl.style.backgroundColor = index === curIdx ? '#a80000' : '#4a3e30';
            graphArea.appendChild(lineEl);
        }
    });

    // base multiplier (1.0) axis line
    const baseMultiplierY = (1.0 - minM) / (maxM - minM);
    const basePriceYPos = GRAPH_HEIGHT * (1 - baseMultiplierY) + GRAPH_PADDING_Y;

    const baseLine = document.createElement('div');
    baseLine.style.position = 'absolute';
    baseLine.style.top = `${(GRAPH_HEIGHT * (1 - baseMultiplierY))}px`;
    baseLine.style.left = `0px`;
    baseLine.style.width = `${GRAPH_WIDTH}px`;
    baseLine.style.height = '1px';
    baseLine.style.borderTop = '1px dashed #7f8c8d';
    baseLine.style.zIndex = '1';
    graphArea.appendChild(baseLine);

    const baseLabel = document.createElement('div');
    baseLabel.style.position = 'absolute';
    baseLabel.style.top = `${(GRAPH_HEIGHT * (1 - baseMultiplierY) - 12)}px`;
    baseLabel.style.left = '5px';
    baseLabel.style.fontSize = '8px';
    baseLabel.style.color = '#7f8c8d';
    baseLabel.textContent = 'Base';
    graphArea.appendChild(baseLabel);
};
 