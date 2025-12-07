// =================================================================
// lineai.js - The Alchemist's Forge AI Helper and Dynamic Messaging
// DEPENDENCIES: gameEngine, AudioController, triggerLevelUpAnimation, ai_tips_data.js
// STATUS: FINAL CONTENT BUILD (Clean Functional Controller)
// =================================================================

const LineAI = (function() {

    // --- AI Configuration and State ---
    const IDLE_TIP_INTERVAL_MS = 40000; // 40 seconds
    let lastTipTime = 0;
    let idleTimer = null;
    let forgeMessageTimeout = null;
    // CRITICAL STATE: Tracks if a random tip is currently displayed
    let aiMessageActive = false; 

    // NOTE: This module assumes TIPS_KNOWLEDGE_BASE and DEBUG_CONTEXT are globally available 
    // from the loaded file ai_tips_data.js.
    
    // Adaptive color classes defined in style.css
    const COLOR_CLASSES = {
        ready: 'ready',
        success: 'success',
        warning: 'warning',
        error: 'error'
    };
    
    // --- Sensitivity Keywords ---
    const KEYWORDS = {
        error: ["failure", "failed", "danger", "critical", "exhausted", "destroyed", "lost", "fatal", "fired"],
        warning: ["need", "not enough", "busy", "wait", "warning", "high", "cannot", "afford", "locked", "returned", "status", "hint", "guidance"],
        success: ["success", "complete", "unlocked", "purchased", "level up", "hired", "resuming", "rested", "collected", "sold", "operational", "ready"]
    };

    // -------------------------------------------------------------
    // --- CORE AI HELPER FUNCTIONS (DEFINED BEFORE USE) ---
    // -------------------------------------------------------------

    /**
     * Sets the main system message in the UI, applying adaptive coloring based on content.
     * @param {string} message - The text content to display.
     * @param {string | null} forcedType - Forces color ('success', 'warning', 'error', 'ready').
     * @param {boolean} isTip - True if this is a random tip (should be easily overwritten).
     */
    function setLine(message, forcedType = null, isTip = false) {
        const el = document.getElementById('system-ready');
        if (!el) return;
        
        el.textContent = message;
        aiMessageActive = isTip; // Set state based on if it's a tip
        
        // --- ADAPTIVE SENSITIVITY LOGIC ---
        let type = forcedType;
        const lowerMsg = message.toLowerCase();
        
        if (!type) {
            if (KEYWORDS.error.some(keyword => lowerMsg.includes(keyword))) {
                type = 'error';
            } else if (KEYWORDS.warning.some(keyword => lowerMsg.includes(keyword))) {
                type = 'warning';
            } else if (KEYWORDS.success.some(keyword => lowerMsg.includes(keyword))) {
                type = 'success';
            } else {
                type = 'ready'; 
            }
        }
        
        el.className = 'system-message ' + (COLOR_CLASSES[type] || COLOR_CLASSES.ready);
    }

    // 1. Random Tip Logic
    function showRandomTip() {
        if (typeof TIPS_KNOWLEDGE_BASE === 'undefined' || TIPS_KNOWLEDGE_BASE.length === 0) return;
        
        const index = Math.floor(Math.random() * TIPS_KNOWLEDGE_BASE.length);
        setLine(`[AI Helper]: ${TIPS_KNOWLEDGE_BASE[index]}`, 'ready', true); 
        lastTipTime = Date.now();
        
        // Reschedule the timer
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (gameEngine.getGameState().synthesisTimer === 0) {
                 showRandomTip();
            }
        }, IDLE_TIP_INTERVAL_MS);
    }

    // 2. Idle Timer Management (Resets the timer used by showRandomTip)
    function resetIdleTimer() {
        if (idleTimer) {
            clearTimeout(idleTimer);
        }
        idleTimer = setTimeout(() => {
            if (gameEngine.getGameState().synthesisTimer === 0) {
                showRandomTip();
            }
        }, IDLE_TIP_INTERVAL_MS);
    }

    // 3. Forge Status Messaging
    function showSynthesisStart(recipe, qty, heat) {
        const baseChance = (recipe.baseChance * 100).toFixed(0);
        let message;
        let type = 'ready';

        if (heat >= 75) {
            message = `DANGER! Heat is extreme (${heat.toFixed(0)}%). Critical failure risk active. Base chance: ${baseChance}%.`;
            type = 'error';
        } else if (heat >= 50) {
            message = `WARNING: Heat is high (${heat.toFixed(0)}%). Failure chance penalty applied. Base chance: ${baseChance}%.`;
            type = 'warning';
        } else {
            message = `Synthesis of ${gameEngine.getResourceName(recipe.outputId)} (x${qty}) started. Base Chance: ${baseChance}%.`;
        }
        setLine(`[FORGE]: ${message}`, type, false); 
        resetIdleTimer();
    }

    function showSynthesisResult(success, outputID, outputQty, failureCause) {
        let message;
        let type;
        const heat = gameEngine.getGameState().heat.toFixed(0);

        if (success) {
            message = `SUCCESS! ${outputQty}x ${gameEngine.getResourceName(outputID)} ready for collection!`;
            type = 'success';
            if (typeof AudioController !== 'undefined') AudioController.playSuccess();
        } else {
            if (failureCause === 'HEAT') {
                message = `FAILURE! High heat (${heat}%) caused the components to destroy themselves. ${outputQty} items lost.`;
            } else { 
                 message = `FAILURE! Low stability (${heat}%) and complexity caused the components to destroy themselves. ${outputQty} items lost.`;
            }
            type = 'error';
            if (typeof AudioController !== 'undefined') AudioController.playFail();
        }
        setLine(`[FORGE]: ${message}`, type, false); 
        resetIdleTimer();
    }

    // 4. Game Event Messaging
    function showLevelUp(newLevel) {
        setLine(`LEVEL UP! You are now Level ${newLevel}! New Research options unlocked!`, 'success', false); 
        if (typeof AudioController !== 'undefined') AudioController.playLevelUp();
        
        if (typeof triggerLevelUpAnimation !== 'undefined') {
            triggerLevelUpAnimation(newLevel);
        }
        
        resetIdleTimer();
    }

    function showAcquisitionMessage(resourceID, qty) {
        setLine(`[MARKET]: Collected ${qty}x ${gameEngine.getResourceName(resourceID)}. Transaction successful.`, 'success', false); 
        if (typeof AudioController !== 'undefined') AudioController.playClick();
        resetIdleTimer();
    }

    // 5. User Error/Guidance Messaging 
    function showGeneralError(message, type = null) {
        setLine(message, type, false); 
        resetIdleTimer();
    }
    
    // --- Public Interface ---
    return {
        init: function() {
            setLine("Forge operational and main loop started. [AI Helper] is online.", 'ready', false);
            resetIdleTimer();
        },
        showRandomTip: showRandomTip,
        showGeneralError: showGeneralError,
        showSynthesisStart: showSynthesisStart,
        showSynthesisResult: showSynthesisResult, 
        showLevelUp: showLevelUp,
        showAcquisitionMessage: showAcquisitionMessage,
        resetIdleTimer: resetIdleTimer,
        // Public getter for the state
        isTipActive: () => aiMessageActive 
    };
})();
