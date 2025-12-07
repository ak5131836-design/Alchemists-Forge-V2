// =================================================================
// engine.js - CORE GAME LOGIC (FINAL STABILITY FIX: FULL INTEGRATION)
// =================================================================

// --- NEW: Deterministic Pseudo-Random Number Generator (PRNG) ---
// Simple but effective string hash function (cyrb128)
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ ((h1 + k) * 2315273531);
        h2 = h3 ^ ((h2 + k) * 1634863923);
        h3 = h4 ^ ((h4 + k) * 580287103);
        h4 = h1 ^ ((h4 + k) * 1251391191);
    }
    return [(h1>>>0), (h2>>>0), (h3>>>0), (h4>>>0)];
}

// PRNG: Seedable generator (sfc32)
function sfc32(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      let t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}
// --- END PRNG ---

// --- NEW: Gaussian Probability Function (For Synthesis Success) ---
// Formula: P(x) = exp(- (x - μ)^2 / (2 * σ^2)), scaled from 0 to 1
function gaussianProbability(value, target, sigma) {
    // Sigma (σ) controls the spread: smaller sigma = higher required precision.
    const exponent = -Math.pow(value - target, 2) / (2 * Math.pow(sigma, 2));
    return Math.exp(exponent);
}
// --- END GAUSSIAN ---


// --- HELPER FUNCTIONS ---

// Determine initial unlocked recipes based on data.js flags
function getInitialUnlockedRecipes() {
    const unlocked = {};
    if (typeof recipeBook !== 'undefined') {
        for (const id in recipeBook) {
            // If requiresUnlock is false (or undefined), it's unlocked by default
            if (!recipeBook[id].requiresUnlock) {
                unlocked[id] = true;
            } else {
                unlocked[id] = false;
            }
        }
    }
    return unlocked;
}

// --- CONFIGURATION CONSTANTS ---
const GAME_CONFIG = {
    MAX_WORKER_SLOTS_CAP: 6,     // Absolute hard cap
    INITIAL_WORKER_SLOTS: 1,     // Starting slots
    WORKER_FATIGUE_RATE: 0.1,    // Fatigue gained per production tick
    WORKER_REST_RATE: 0.5,       // Fatigue recovered per tick while resting
    MAX_FATIGUE_POINTS: 100,     // Max fatigue before forced stop
    HEAT_FAILURE_THRESHOLD: 50,  // Heat % where failure chance begins
    BASE_MANA_COST: 10,          // Base mana per synthesis unit
    LEVEL_EXP_MULTIPLIER: 100,   // EXP required = Level * 100
    // NEW: Time conversion constants (30 real seconds = 1 in-game day)
    REAL_SECONDS_PER_GAME_DAY: 30, 
    DAYS_PER_MONTH: 30,
};

// --- NEW: IAP Configuration (Unchanged) ---
const SERVER_ENDPOINT = "https://aethernexus-backend.com/api/iap/verify"; // Placeholder endpoint for validation

const IAP_CATALOG = {
    // D COIN BUNDLES
    'IAP_DCOIN_BUNDLE': { id: 'IAP_DCOIN_BUNDLE', name: "Bundle of Chronos Shards", description: "A starter pack of D Coin.", type: 'DCOIN', value: 500, price: 0.99, icon: 'assets/sprites/bag_brown.png', productId: 'com.forge.dcoin.bundle' },
    'IAP_DCOIN_BAG': { id: 'IAP_DCOIN_BAG', name: "Bag of Chronos Shards", description: "A good-sized amount of D Coin.", type: 'DCOIN', value: 2000, price: 4.99, icon: 'assets/sprites/bag_gold.png', productId: 'com.forge.dcoin.bag' },
    'IAP_DCOIN_CHEST': { id: 'IAP_DCOIN_CHEST', name: "Chest of Chronos Shards", description: "A king's ransom of D Coin.", type: 'DCOIN', value: 5000, price: 9.99, icon: 'assets/sprites/chest_red.png', productId: 'com.forge.dcoin.chest' },
    
    // RP BUNDLES
    'IAP_RP_BUNDLE': { id: 'IAP_RP_BUNDLE', name: "Bundle of Research Points", description: "A quick boost for your research.", type: 'RP', value: 100, price: 1.99, icon: 'assets/sprites/flask_blue.png', productId: 'com.forge.rp.bundle' },
    'IAP_RP_BAG': { id: 'IAP_RP_BAG', name: "Vault of Research Points", description: "A massive stash of RP.", type: 'RP', value: 500, price: 9.99, icon: 'assets/sprites/flask_red.png', productId: 'com.forge.rp.vault' },

    // UTILITY: REMOVE ADS
    'IAP_REMOVE_ADS': { id: 'IAP_REMOVE_ADS', name: "Remove All Ads", description: "Permanently disables all ad opportunities.", type: 'UTILITY', value: 0, price: 9.99, icon: 'assets/sprites/util_star.png', productId: 'com.forge.utility.removeads' }
};

// --- GAME STATE INITIALIZATION ---
var gameTimeSeconds = 0;

const gameState = {
    // 1. CURRENCIES & PROGRESSION
    dCoin: 100, 
    rp: 50,
    level: 1, 
    exp: 0,

    // NEW: Date State
    year: 1,
    month: 1,
    day: 1,
    
    // NEW: Unique identifier for deterministic seeding
    initialGameSeed: 0, // Set to Date.now() on first run
    
    // 2. FORGE STATUS
    mana: 100, 
    heat: 0,   
    
    // 3. STATS (Upgradeable)
    maxMana: 100,
    manaRegenRate: 1, 
    manaEfficiency: 1.0, // Multiplier (Lower is better, e.g. 0.9 = 10% reduction)
    furnaceSpeed: 1.0,   // Multiplier (Higher is faster)
    
    // 4. SYNTHESIS STATE
    synthesisTimer: 0, 
    synthesisDuration: 0,
    synthesisResultID: null,
    outputQuantity: 0, 

    // 5. WORKER STATE
    activeWorkers: [], // Array of worker objects
    // CRITICAL FIX: Setting initial slots to 1 to enforce lock visual unless purchased.
    maxWorkerSlots: GAME_CONFIG.INITIAL_WORKER_SLOTS, 
    
    // Tracks which "Advanced" worker types have been researched
    unlockedWorkerTypes: { 
        'W_IRON_MINER_BASIC': true,
        'W_WATER_COLLECTOR_BASIC': true,
        'W_STONE_MINER_BASIC': true,
    },
    
    purchasedUpgrades: {}, // Tracks one-time purchases
    
    // NEW: GPG State
    gpgPlayerID: null, 
    lastAdTime: 0, // Used for Ad Cooldown tracking

    // 6. INVENTORY
    // Initialized with some materials for testing
    inventory: {
        'R_IRON': 25, 
        'R_WATER': 25,
        'R_STONE': 25,
        'E_ELIXIR': 0,
        'R_AQUA': 0,
    },
    
    unlockedRecipes: getInitialUnlockedRecipes(), 

    // 7. SLOTS (Stores Resource ID AND Quantity)
    synthesisSlots: {
        'input-slot-1': { resourceID: null, quantity: 1 },
        'input-slot-2': { resourceID: null, quantity: 1 }
    },
    
    output: null,
    
    // NEW: Market History
    marketHistory: {}, // Stores historical volatility multipliers and base prices

    // NEW: Coupon Tracking
    redeemedCoupons: {}, // Stores {'CODE': true} for unique codes

    // 8. TEMP STATE FOR LINEAI
    lastFailureCause: null,
};


// =================================================================
// THE GAME ENGINE OBJECT (GLOBAL ACCESS)
// =================================================================

var gameEngine = {
    
    // --- 1. DATA ACCESSORS (Safe access to data.js globals) ---
    getGameState: function() { return gameState; },
    getGameTime: function() { return gameTimeSeconds; },
    
    // NEW: Date formatting function YYYY/DD/MON
    getFormattedDate: function() {
        const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        // gameState.month is 1-indexed (1=January)
        const monthIndex = gameState.month - 1; 
        const monthAbbrev = MONTH_NAMES[monthIndex];
        
        // Format: YYYY/DD/MON
        return `${gameState.year}/${String(gameState.day).padStart(2, '0')}/${monthAbbrev}`;
    },
    
    getResourceName: function(id) { 
        return (typeof resourceCatalog !== 'undefined' && resourceCatalog[id]) ? resourceCatalog[id].name : 'Unknown'; 
    },
    getResourceDetails: function(id) { 
        return (typeof resourceCatalog !== 'undefined' && resourceCatalog[id]) ? resourceCatalog[id] : null; 
    },
    getWorkerCatalog: function() { return typeof workerCatalog !== 'undefined' ? workerCatalog : {}; },
    getUpgradeCatalog: function() { return typeof upgradeCatalog !== 'undefined' ? upgradeCatalog : {}; },
    getRecipeBook: function() { return typeof recipeBook !== 'undefined' ? recipeBook : {}; },
    getIAPCatalog: function() { return IAP_CATALOG; },
    
    getAvailableUpgrade: function(id) {
        if (gameState.purchasedUpgrades[id]) return null;
        return (typeof upgradeCatalog !== 'undefined' && upgradeCatalog[id]) ? upgradeCatalog[id] : null;
    },
    getWorkerInstance: function(instanceId) {
        return gameState.activeWorkers.find(w => w.id === instanceId);
    },
    
    // --- 2. UI COMMUNICATION ---
    updateSystemMessage: function(message, type = 'warning') {
        if (typeof LineAI !== 'undefined') {
            LineAI.showGeneralError(message, type);
        } else {
            // Fallback for debugging if LineAI fails to load
            console.log(`[System]: ${message}`);
        }
    },


    // --- 3. PROGRESSION SYSTEM ---
    checkLevelUp: function() {
        // Dynamically calculate nextLevelExp inside the while loop to handle multi-level ups
        while (gameState.exp >= (gameState.level * GAME_CONFIG.LEVEL_EXP_MULTIPLIER)) {
            const nextLevelExp = gameState.level * GAME_CONFIG.LEVEL_EXP_MULTIPLIER;
            
            gameState.exp -= nextLevelExp;
            gameState.level++;
            
            // INTEGRATION: Use LineAI for Level Up notification
            if (typeof LineAI !== 'undefined') {
                LineAI.showLevelUp(gameState.level); // This triggers the animation via lineai.js
            }
        }
    },

    // --- GPG INTEGRATION ---
    signInGPG: function() {
        if (gameState.gpgPlayerID) {
            this.updateSystemMessage("Already signed in to Google Play Games.", 'ready');
            return true;
        }

        // CRITICAL: Call the Native GPG Plugin via Cordova/APCB E
        // The Cordova plugin MUST expose the 'plugins.gpg' object for this to work.
        if (typeof plugins !== 'undefined' && plugins.gpg && plugins.gpg.signIn) {
            this.updateSystemMessage("Initiating Google Play Games sign-in...", 'warning');
            plugins.gpg.signIn();
            return true;
        } else {
            this.updateSystemMessage("GPG Plugin not ready or 'plugins.gpg.signIn' not found.", 'error');
            return false;
        }
    },

    // --- 4. RESEARCH & UPGRADE LOGIC ---
    
    isRecipeUnlocked: function(sortedIDs) { return !!gameState.unlockedRecipes[sortedIDs]; },

    // Generates a list of recipes with current unlock status for the UI
    getRecipesWithStatus: function() {
        const recipes = [];
        const book = this.getRecipeBook();
        for (const sortedIDs in book) {
            const recipe = book[sortedIDs];
            const [id1, id2] = sortedIDs.split('|');
            recipes.push({
                id: sortedIDs,
                input1: this.getResourceName(id1),
                input2: this.getResourceName(id2),
                output: this.getResourceName(recipe.outputId),
                cost: recipe.rpCost,
                isUnlocked: this.isRecipeUnlocked(sortedIDs),
                requiresUnlock: !!recipe.requiresUnlock,
                levelUnlock: recipe.levelUnlock || 0,
            });
        }
        return recipes;
    },

    unlockRecipe: function(sortedIDs) {
        gameState.unlockedRecipes[sortedIDs] = true;
        const book = this.getRecipeBook();
        
        // INTEGRATION: Use LineAI for recipe unlock notification
        if (typeof LineAI !== 'undefined') {
            LineAI.showGeneralError(`Recipe for ${this.getResourceName(book[sortedIDs].outputId)} unlocked!`, 'success');
        }
        
        // Refresh UI if open
        if (typeof renderRecipeBookList !== 'undefined') renderRecipeBookList();
    },

    researchRecipe: function(sortedIDs) {
        const book = this.getRecipeBook();
        const recipe = book[sortedIDs];
        
        if (!recipe || !recipe.requiresUnlock || this.isRecipeUnlocked(sortedIDs)) {
            this.updateSystemMessage("Invalid research target.");
            return false;
        }
        
        if (gameState.level < recipe.levelUnlock) {
            this.updateSystemMessage(`Need Level ${recipe.levelUnlock} to research this recipe!`);
            return false;
        }

        if (gameState.rp < recipe.rpCost) {
            this.updateSystemMessage(`Research failed! Requires ${recipe.rpCost} RP.`);
            return false;
        }

        gameState.rp -= recipe.rpCost;
        this.unlockRecipe(sortedIDs);
        
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        return true;
    },
    
    researchWorkerType: function(workerTypeID) {
        const wCatalog = this.getWorkerCatalog();
        const worker = wCatalog[workerTypeID];
        
        if (!worker || gameState.unlockedWorkerTypes[workerTypeID]) {
            this.updateSystemMessage("Invalid worker type or already unlocked.");
            return false;
        }
        if (gameState.rp < worker.rpUnlockCost) {
            this.updateSystemMessage(`Need ${worker.rpUnlockCost} RP to unlock blueprint.`);
            return false;
        }
        if (gameState.level < worker.levelUnlock) {
            this.updateSystemMessage(`Need Level ${worker.levelUnlock} to unlock blueprint.`);
            return false;
        }

        gameState.rp -= worker.rpUnlockCost;
        gameState.unlockedWorkerTypes[workerTypeID] = true;
        
        // INTEGRATION: Use LineAI for worker unlock notification
        if (typeof LineAI !== 'undefined') {
            LineAI.showGeneralError(`Blueprint ${worker.name} unlocked! Now available for acquisition.`, 'success');
        }
        
        if (typeof renderWorkerList !== 'undefined') renderWorkerList();
        if (typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        return true;
    },

    buyUpgrade: function(upgradeID) {
        const upgrade = this.getAvailableUpgrade(upgradeID);
        if (!upgrade) return false;

        const isSlotUpgrade = upgrade.type === 'worker_slot';
        const upgradeCost = isSlotUpgrade ? upgrade.dCoinCost : upgrade.cost;
        const currencyName = isSlotUpgrade ? 'D Coin' : 'RP';
        let currencyToDeduct = isSlotUpgrade ? gameState.dCoin : gameState.rp;

        // Level Check
        if (upgrade.levelUnlock && gameState.level < upgrade.levelUnlock) {
            this.updateSystemMessage(`Need Level ${upgrade.levelUnlock} to buy ${upgrade.name}!`);
            return false;
        }

        // Cost Check
        if (currencyToDeduct < upgradeCost) {
            this.updateSystemMessage(`Cannot afford ${upgrade.name}. Requires ${upgradeCost} ${currencyName}.`);
            return false;
        }
        
        // Deduct Currency
        if (isSlotUpgrade) {
            gameState.dCoin = parseFloat((gameState.dCoin - upgradeCost).toFixed(4));
        } else {
            gameState.rp -= upgradeCost;
        }

        // Apply Effect
        if (upgrade.effect) {
            if (upgrade.effect.stat === 'maxWorkerSlots') {
                gameState.maxWorkerSlots = Math.min(GAME_CONFIG.MAX_WORKER_SLOTS_CAP, gameState.maxWorkerSlots + upgrade.effect.value);
            } else if (upgrade.effect.stat === 'manaEfficiency') {
                // Efficiency is reduced (better) by subtracting the value
                // FIX: Ensure the mana efficiency stat is calculated correctly (lower = better)
                gameState.manaEfficiency = Math.max(0.1, gameState.manaEfficiency - upgrade.effect.value); 
            } else if (upgrade.effect.stat === 'furnaceSpeed') {
                // Furnace speed should INCREASE, so use addition.
                gameState.furnaceSpeed += upgrade.effect.value; 
            } else {
                gameState[upgrade.effect.stat] += upgrade.effect.value;
            }
        }
        
        gameState.purchasedUpgrades[upgradeID] = true;
        
        // INTEGRATION: Use LineAI for upgrade purchase notification
        if (typeof LineAI !== 'undefined') {
            LineAI.showGeneralError(`Upgrade purchased! ${upgrade.name} applied.`, 'success');
        }
        
        // Immediate Effect Handling
        if (upgrade.effect && upgrade.effect.stat === 'maxMana') {
            gameState.mana = gameState.maxMana; // Restore mana on max upgrade
        }

        // UI Refresh
        if (typeof renderUpgradeList !== 'undefined') renderUpgradeList();
        if (typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        
        // FIX: Ensure WorkerList is also refreshed after buying any upgrade, 
        // especially slots, as it affects max slots visible on worker list items.
        if (typeof renderWorkerList !== 'undefined') renderWorkerList(); 
        
        return true;
    },

    // --- 5. WORKER MANAGEMENT (Consolidated Acquisition) ---

    // CONSOLIDATED FUNCTION: Handles acquisition for all 6 worker types (T1-T7)
    acquireBlueprint: function(workerTypeID) {
        if (gameState.activeWorkers.length >= gameState.maxWorkerSlots) {
            this.updateSystemMessage("All worker slots are full! Buy more slots.");
            return false;
        }

        const wCatalog = this.getWorkerCatalog();
        const blueprint = wCatalog[workerTypeID];
        if (!blueprint) return false;

        if (!gameState.unlockedWorkerTypes[workerTypeID]) {
            this.updateSystemMessage(`Blueprint type locked. Research first!`);
            return false;
        }
        
        // --- CRITICAL UNIQUE WORKER FIX ---
        const workerType = blueprint.type;
        const isUnique = workerType.startsWith('Machine') || workerType.startsWith('Contract') || workerType.startsWith('Mine') || workerType.startsWith('Facility') || workerType.startsWith('Syndicate');
        
        if (isUnique) {
            const alreadyActive = gameState.activeWorkers.some(w => w.typeID === workerTypeID);
            if (alreadyActive) {
                this.updateSystemMessage(`The ${blueprint.name} is already active. Only one is allowed.`, 'error');
                return false;
            }
        }
        // --- END CRITICAL UNIQUE WORKER FIX ---


        const type = blueprint.type;
        let currencyCost = blueprint.cost;
        let currencyName;
        let isHirable = false; // Flag to check if we should apply inflation

        // Determine Cost based on Type
        if (type.startsWith('Worker') || type.startsWith('Machine') || type.startsWith('Contract')) {
            // T1-T4 types: Cost is RP (hiring cost)
            currencyName = 'RP';
            isHirable = true;
        } else if (type.startsWith('Mine') || type.startsWith('Facility') || type.startsWith('Syndicate')) {
            // T5-T7 types: Cost is D Coin (infrastructure purchase)
            currencyName = 'D Coin';
            isHirable = false;
        } else {
            this.updateSystemMessage("Unknown blueprint type.");
            return false;
        }
        
        // 1. Check Level and Cost
        if (gameState.level < blueprint.levelUnlock) {
            this.updateSystemMessage(`Need Level ${blueprint.levelUnlock} to acquire this blueprint.`);
            return false;
        }

        let canAfford = (currencyName === 'RP') ? (gameState.rp >= currencyCost) : (gameState.dCoin >= currencyCost);

        if (!canAfford) {
            this.updateSystemMessage(`Cannot afford ${blueprint.name}. Requires ${currencyCost} ${currencyName}.`);
            return false;
        }

        // 2. Deduct Currency
        if (currencyName === 'RP') {
            gameState.rp -= currencyCost;
        } else {
            gameState.dCoin = parseFloat((gameState.dCoin - currencyCost).toFixed(4));
        }

        // 3. Instantiate and Acquire
        const newWorker = {
            id: 'worker_' + Date.now() + Math.random().toString(16).slice(2),
            typeID: workerTypeID,
            name: blueprint.name,
            resourceID: blueprint.resourceID,
            productionRate: blueprint.productionRate,
            icon: blueprint.icon,
            fatigue: 0,
            maxFatigue: GAME_CONFIG.MAX_FATIGUE_POINTS,
            isWorking: true,
        };
        gameState.activeWorkers.push(newWorker);
        
        // INTEGRATION: Use LineAI for acquisition notification
        if (typeof LineAI !== 'undefined') {
            LineAI.showGeneralError(`${blueprint.name} acquired! Occupies one slot.`, 'success');
        }
        
        if (typeof renderWorkerList !== 'undefined') renderWorkerList();
        if (typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        return true;
    },

    toggleWorkerRest: function(workerInstanceId) {
        const worker = this.getWorkerInstance(workerInstanceId);
        if (worker) {
            worker.isWorking = !worker.isWorking;
            const status = worker.isWorking ? 'working' : 'resting';
            
            // INTEGRATION: Use LineAI for worker status change
            if (typeof LineAI !== 'undefined') {
                 LineAI.showGeneralError(`${worker.name} is now ${status}.`, 'ready');
            }
            
            if (typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();
            
            // Re-render detail modal if it's currently open for this worker
            if (typeof openWorkerDetailModal !== 'undefined' && 
                document.getElementById('worker-detail-modal').classList.contains('visible')) {
                openWorkerDetailModal(worker); 
            }
            return true;
        }
        return false;
    },

    fireWorker: function(workerInstanceId) {
        const worker = this.getWorkerInstance(workerInstanceId);
        const name = worker ? worker.name : "A worker";
        const initialLength = gameState.activeWorkers.length;
        
        gameState.activeWorkers = gameState.activeWorkers.filter(w => w.id !== workerInstanceId);
        
        if (gameState.activeWorkers.length < initialLength) {
            // INTEGRATION: Use LineAI for worker fired notification
            if (typeof LineAI !== 'undefined') {
                LineAI.showGeneralError(`${name} fired. Slot freed.`, 'error');
            }

            if (typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();
            if (typeof closeWorkerDetailModal !== 'undefined') closeWorkerDetailModal();
            return true;
        }
        return false;
    },

    // --- 6. INVENTORY & SLOT MANIPULATION (Unchanged) ---

    // Place item logic (With Overwrite capability)
    placeItemInSlot: function(slotID, resourceID, quantity = 1) {
        // INTEGRATION: Use LineAI for busy check
        if (gameState.synthesisTimer > 0) return this.updateSystemMessage("Forge busy!");

        if (!this.getResourceDetails(resourceID)) return this.updateSystemMessage(`Invalid resource.`);
        if (gameState.inventory[resourceID] < quantity) return this.updateSystemMessage(`Not enough items.`);
        
        // 1. Overwrite: Check if slot has item, return to inventory
        const currentSlotItem = gameState.synthesisSlots[slotID].resourceID;
        const currentSlotQty = gameState.synthesisSlots[slotID].quantity;
        if (currentSlotItem) {
            gameState.inventory[currentSlotItem] = parseFloat(((gameState.inventory[currentSlotItem] || 0) + currentSlotQty).toFixed(4));
            
            // INTEGRATION: Use LineAI for returned item notification
            if (typeof LineAI !== 'undefined') {
                LineAI.showGeneralError(`Returned ${this.getResourceName(currentSlotItem)}.`, 'warning');
            }
        }

        // 2. Place new item
        gameState.synthesisSlots[slotID].resourceID = resourceID;
        gameState.synthesisSlots[slotID].quantity = quantity; 
        gameState.inventory[resourceID] = parseFloat((gameState.inventory[resourceID] - quantity).toFixed(4));
        
        // INTEGRATION: Reset idle timer on user interaction
        if (typeof LineAI !== 'undefined') LineAI.resetIdleTimer();
        
        if (typeof updateInventoryUI !== 'undefined') updateInventoryUI();
        if (typeof updateSynthesisSlotsUI !== 'undefined') updateSynthesisSlotsUI();
        return true;
    },

    // Move item between slots (Slot Dragging)
    moveItemBetweenSlots: function(sourceSlotId, targetSlotId) {
        if (gameState.synthesisTimer > 0) return this.updateSystemMessage("Forge busy!");
        const sourceData = gameState.synthesisSlots[sourceSlotId];
        
        if (!sourceData.resourceID) return false;

        // If target has an item, return target item to inventory first
        const targetData = gameState.synthesisSlots[targetSlotId];
        if (targetData.resourceID) {
             gameState.inventory[targetData.resourceID] = parseFloat(((gameState.inventory[targetData.resourceID] || 0) + targetData.quantity).toFixed(4));
             
             // INTEGRATION: Use LineAI for returned item notification
            if (typeof LineAI !== 'undefined') {
                LineAI.showGeneralError(`Returned ${this.getResourceName(targetData.resourceID)}.`, 'warning');
            }
        }

        // Move data to target
        gameState.synthesisSlots[targetSlotId] = { ...sourceData };
        // Clear source
        gameState.synthesisSlots[sourceSlotId] = { resourceID: null, quantity: 1 };

        // INTEGRATION: Reset idle timer on user interaction
        if (typeof LineAI !== 'undefined') LineAI.resetIdleTimer();

        if (typeof updateInventoryUI !== 'undefined') updateInventoryUI();
        if (typeof updateSynthesisSlotsUI !== 'undefined') updateSynthesisSlotsUI();
        return true;
    },

    removeItemFromSlot: function(slotID) {
        if (gameState.synthesisTimer > 0) return this.updateSystemMessage("Forge busy!");
        const slot = gameState.synthesisSlots[slotID];
        if (slot.resourceID) {
            gameState.inventory[slot.resourceID] = parseFloat(((gameState.inventory[slot.resourceID] || 0) + slot.quantity).toFixed(4));
            
            // INTEGRATION: Use LineAI for returned item notification
            if (typeof LineAI !== 'undefined') {
                LineAI.showGeneralError(`Returned ${this.getResourceName(slot.resourceID)}.`, 'warning');
            }
            
            // Reset Slot
            slot.resourceID = null;
            // IMPORTANT: Leave slot.quantity alone for UX consistency
            
            // INTEGRATION: Reset idle timer on user interaction
            if (typeof LineAI !== 'undefined') LineAI.resetIdleTimer();

            if (typeof updateInventoryUI !== 'undefined') updateInventoryUI();
            if (typeof updateSynthesisSlotsUI !== 'undefined') updateSynthesisSlotsUI();
            return true;
        }
        return false;
    },

    updateSlotQuantity: function(slotID, change) {
        if (gameState.synthesisTimer > 0) return this.updateSystemMessage("Forge busy!"); // Added busy check
        
        const slot = gameState.synthesisSlots[slotID];
        if (!slot.resourceID) return false;
        
        // INTEGRATION: Reset idle timer on user interaction
        if (typeof LineAI !== 'undefined') LineAI.resetIdleTimer();
        
        const currentQtyInSlot = slot.quantity;
        const resourceID = slot.resourceID;
        const currentQtyInInventory = gameState.inventory[resourceID];
        
        let newQty = currentQtyInSlot + change;

        if (newQty < 1) newQty = 1; // Minimum 1

        if (newQty > currentQtyInSlot) { // Increasing (+), take from inventory
            const needed = newQty - currentQtyInSlot;
            if (currentQtyInInventory < needed) {
                // Not enough, take all remaining
                newQty = currentQtyInSlot + currentQtyInInventory;
                gameState.inventory[resourceID] = 0;
            } else {
                gameState.inventory[resourceID] = parseFloat((gameState.inventory[resourceID] - needed).toFixed(4));
            }
        } else if (newQty < currentQtyInSlot) { // Decreasing (-), return to inventory
            const returned = currentQtyInSlot - newQty;
            gameState.inventory[resourceID] = parseFloat(((gameState.inventory[resourceID] || 0) + returned).toFixed(4));
        }

        slot.quantity = newQty;
        if (typeof updateInventoryUI !== 'undefined') updateInventoryUI();
        if (typeof updateSynthesisSlotsUI !== 'undefined') updateSynthesisSlotsUI();
        return true;
    },

    clearSlots: function() {
        // Only reset the resourceID, leave the quantity intact for better UX
        gameState.synthesisSlots['input-slot-1'].resourceID = null;
        gameState.synthesisSlots['input-slot-2'].resourceID = null;
    },

    // --- 7. SYNTHESIS LOGIC (UPDATED FOR GAUSSIAN FORMULA) ---

    processSynthesis: function() { 
        if (gameState.synthesisTimer > 0) return this.updateSystemMessage("Forge is currently busy!");
        
        const slot1 = gameState.synthesisSlots['input-slot-1'];
        const slot2 = gameState.synthesisSlots['input-slot-2'];
        const item1 = slot1.resourceID;
        const item2 = slot2.resourceID;
        
        // CRITICAL FIX: Ensure synthesis message is shown when slots are empty
        if (!item1 || !item2) {
             // Calling LineAI directly to show the error message.
             if (typeof LineAI !== 'undefined') {
                 LineAI.showGeneralError("[FORGE]: Need two resources to begin synthesis.", 'error');
             }
             return false;
        }

        const qty = Math.min(slot1.quantity, slot2.quantity); // Limited by smallest stack
        const sortedIDs = [item1, item2].sort().join('|');
        const book = this.getRecipeBook();
        const recipe = book[sortedIDs];

        this.clearSlots(); // Items are theoretically consumed here visually
        
        // --- NO RECIPE FOUND CASE ---
        if (!recipe) {
             // If no recipe is found, assume immediate failure resulting in R_MESS
             gameState.synthesisDuration = 1; // Quick feedback
             gameState.synthesisTimer = 1;
             gameState.synthesisResultID = 'R_MESS';
             gameState.outputQuantity = 1; 
             gameState.lastFailureCause = 'CHANCE';

             if (typeof LineAI !== 'undefined') {
                LineAI.showGeneralError(`Combination failed! No recipe found. Resulting in ${this.getResourceName('R_MESS')}.`);
             }
             if (typeof updateStatusUI !== 'undefined') updateStatusUI();
             return true;
        }
        // --- END NO RECIPE FOUND CASE ---
        
        if (recipe.requiresUnlock && !this.isRecipeUnlocked(sortedIDs)) return this.updateSystemMessage("Recipe locked!");
        
        // Costs
        const actualManaCost = GAME_CONFIG.BASE_MANA_COST * gameState.manaEfficiency * qty;
        
        if (gameState.mana < actualManaCost) return this.updateSystemMessage("Not enough Mana!");
        
        gameState.mana -= actualManaCost;
        
        // Heat Generation
        const baseHeatGen = 5 + (recipe.rpCost / 10);
        const actualHeatGen = baseHeatGen * qty * (1 + (gameState.heat / 100));
        gameState.heat = Math.min(100, gameState.heat + actualHeatGen);

        // ====================================================================
        // --- NEW: GAUSSIAN PROBABILITY CALCULATION ---
        // ====================================================================
        
        // Get player inputs from the UI elements
        const playerFreq = parseFloat(document.getElementById('temporal-frequency-slider').value);
        const playerPressure = parseFloat(document.getElementById('thermal-pressure-slider').value);

        // Get recipe targets (Using assumptions since data.js is not finalized with these fields)
        const targetFreq = recipe.TargetFrequency !== undefined ? recipe.TargetFrequency : 50; 
        const targetPressure = recipe.TargetPressure !== undefined ? recipe.TargetPressure : (recipe.rpCost * 4 > 1000 ? 1000 : recipe.rpCost * 4 + 300); 

        // Sigma (Standard Deviation): Controls precision requirement (lower = harder)
        // Adjust sigma based on recipe cost/tier to set difficulty
        let sigmaFreq = 15; 
        let sigmaPressure = 200; 
        
        if (recipe.rpCost > 500) {
            sigmaFreq = 8; // High-tier requires higher precision
            sigmaPressure = 100;
        } else if (recipe.rpCost > 100) {
            sigmaFreq = 12;
            sigmaPressure = 150;
        }

        // 1. Calculate probability of matching Temporal Frequency (max 1.0)
        const probFreq = gaussianProbability(playerFreq, targetFreq, sigmaFreq);
        
        // 2. Calculate probability of matching Thermal Pressure (max 1.0)
        const probPressure = gaussianProbability(playerPressure, targetPressure, sigmaPressure);
        
        // 3. Total Raw Chance = Base Chance * Slider Match Multiplier
        // The closer the sliders are to target, the closer probFreq * probPressure is to 1.0
        let rawChance = recipe.baseChance * (probFreq * probPressure); 
        
        // 4. Penalties and Bonuses
        let failurePenalty = (gameState.heat >= GAME_CONFIG.HEAT_FAILURE_THRESHOLD) ? 0.3 : 0; 
        
        // Final Chance includes base, sliders, heat penalty, and a small Mana bonus
        let finalChance = rawChance - (gameState.heat / 200) + (gameState.mana / (gameState.maxMana * 4)) - failurePenalty; 

        // Clamp between min 0.01 (1%) and max 1.0 (100%)
        finalChance = Math.max(0.01, Math.min(1.0, finalChance));

        // ====================================================================
        // --- END NEW: GAUSSIAN PROBABILITY CALCULATION ---
        // ====================================================================

        let synthesisSuccess = Math.random() < finalChance;
        let resultOutputID;
        let finalOutputQty = qty;
        let failureCause = 'CHANCE'; // Default failure cause

        if (synthesisSuccess) {
            resultOutputID = recipe.outputId;
        } else {
            // FAILURE: If failure occurs, produce Alchemical Residue (R_MESS)
            resultOutputID = 'R_MESS';
            // Output half the input quantity as mess, plus one, minimum 1.
            finalOutputQty = Math.max(1, Math.floor(qty * 0.5) + 1); 
            synthesisSuccess = false; // Mark as structural failure
            
            // BUG FIX: Determine if heat caused the failure (for LineAI messaging)
            if (gameState.heat >= GAME_CONFIG.HEAT_FAILURE_THRESHOLD) {
                failureCause = 'HEAT';
            } else {
                failureCause = 'CHANCE';
            }
        }
        
        // Timing Calculation
        const quantityScaler = Math.pow(qty, 0.7); 
        const baseDuration = recipe.baseDuration || 5; 
        const actualDuration = (baseDuration * quantityScaler) / gameState.furnaceSpeed;
        
        gameState.synthesisDuration = Math.ceil(actualDuration);
        gameState.synthesisTimer = gameState.synthesisDuration;
        gameState.synthesisResultID = resultOutputID;
        gameState.outputQuantity = finalOutputQty; 

        // INTEGRATION: Use LineAI for synthesis start notification
        if (typeof LineAI !== 'undefined') {
            LineAI.showSynthesisStart(recipe, qty, gameState.heat);
        }
        
        // INTEGRATION: Store the cause temporarily for the timerTick to use
        gameState.lastFailureCause = failureCause; 

        // INTEGRATION: Reset idle timer on synthesis start
        if (typeof LineAI !== 'undefined') LineAI.resetIdleTimer();
        
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        
        return true;
    },
    
    timerTick: function() {
        // INTEGRATION: Ensure idle timer doesn't fire during synthesis
        if (typeof LineAI !== 'undefined') LineAI.resetIdleTimer();

        if (gameState.synthesisTimer > 0) {
            gameState.synthesisTimer--;
            
            if (gameState.synthesisTimer === 0) {
                
                // Synthesis complete, notify the AI
                const outputID = gameState.synthesisResultID;
                const success = outputID !== 'R_MESS'; // Success is defined as producing the desired output, not mess.
                
                // INTEGRATION: Use LineAI for synthesis result, passing the stored failure cause
                if (typeof LineAI !== 'undefined') {
                    LineAI.showSynthesisResult(success, outputID, gameState.outputQuantity, gameState.lastFailureCause || 'CHANCE');
                    gameState.lastFailureCause = null; // Clear after use
                }

                if (outputID) {
                    gameState.output = outputID;
                    gameState.outputQuantity = gameState.outputQuantity;
                    
                    // Award RP (Approximate logic since we cleared slots)
                    if (success) {
                        gameState.rp += 5 * gameState.outputQuantity;
                    } else {
                         // Award tiny RP for mess, encouraging experimentation
                         gameState.rp += 1 * gameState.outputQuantity; 
                    }
                }
                
                gameState.synthesisResultID = null;
                gameState.synthesisDuration = 0;
                
                if (typeof updateOutputUI !== 'undefined') updateOutputUI();
            }
        }
    },

    collectOutput: function() {
        if (gameState.synthesisTimer > 0) return this.updateSystemMessage("Wait for finish!");
        
        // CRITICAL FIX: Ensure synthesis message is shown when output slot is empty
        if (gameState.output === null) {
            if (typeof LineAI !== 'undefined') {
                 LineAI.showGeneralError("[FORGE]: Nothing to collect from output slot.", 'error');
             }
             return false;
        }

        const collectedID = gameState.output;
        const collectedQty = gameState.outputQuantity;
        const details = this.getResourceDetails(collectedID);
        // basePrice is the intended sell value.
        
        // Get the current LIVE PRICE for products, falling back to basePrice
        const coinValue = details ? (details.livePrice || details.basePrice) * collectedQty : 0; 

        gameState.inventory[collectedID] = parseFloat(((gameState.inventory[collectedID] || 0) + collectedQty).toFixed(4));
        
        // Only give D Coin if the output is a standard Product (not Raw or Mess)
        if (details && details.type === 'Product') {
             gameState.dCoin = parseFloat((gameState.dCoin + coinValue).toFixed(4));
             // INTEGRATION: Use LineAI for collection message
             if (typeof LineAI !== 'undefined') {
                LineAI.showAcquisitionMessage(collectedID, collectedQty);
             }
        } else {
            // Notify when collecting Raw or Mess resources
             if (typeof LineAI !== 'undefined') {
                LineAI.showGeneralError(`Collected ${collectedQty}x ${details.name}. Inventory updated.`, 'ready');
             }
        }
        
        gameState.output = null;
        gameState.outputQuantity = 0;
        
        gameState.exp += 10 * collectedQty; 
        this.checkLevelUp();
        
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        if (typeof updateOutputUI !== 'undefined') updateOutputUI();
        if (typeof updateInventoryUI !== 'undefined') updateInventoryUI();
        
        return true;
    },
    
    // --- 8. MARKET LOGIC (Unchanged) ---
    
    sellResource: function(resourceID, amount) {
        const resource = this.getResourceDetails(resourceID);
        if (!resource || resource.type !== 'Product' || gameState.inventory[resourceID] < amount) return this.updateSystemMessage("Sale failed.");
        
        // Get the current LIVE PRICE for products, falling back to basePrice
        const price = resource.livePrice || resource.basePrice; 
        const value = price * amount;
        
        gameState.inventory[resourceID] = parseFloat((gameState.inventory[resourceID] - amount).toFixed(4));
        gameState.dCoin = parseFloat((gameState.dCoin + value).toFixed(4));
        
        // INTEGRATION: Use LineAI for single sale notification
        if (typeof LineAI !== 'undefined') {
            LineAI.showGeneralError(`Sold ${amount} ${resource.name}. +${value.toFixed(2)} D Coin.`, 'success');
        }
        
        if (typeof updateStatusUI !== 'undefined') updateStatusUI(); 
        if (typeof updateInventoryUI !== 'undefined') updateInventoryUI(); 
        
        // FIX: Market List must refresh after selling single item
        if (typeof renderMarketList !== 'undefined') renderMarketList();
        
        return true;
    },

    sellAllProducts: function() {
        let totalProfit = 0;
        let soldCount = 0;
        let saleOccurred = false; // Internal flag to track if anything was sold

        for (const id of Object.keys(gameState.inventory)) {
            const count = gameState.inventory[id];
            const resource = this.getResourceDetails(id);
            if (count > 0 && resource && resource.type === 'Product') {
                // Get the current LIVE PRICE for products, falling back to basePrice
                const price = resource.livePrice || resource.basePrice;
                
                totalProfit += price * count;
                soldCount += count;
                gameState.inventory[id] = 0;
                saleOccurred = true;
            }
        }
        
        if (saleOccurred) {
            gameState.dCoin = parseFloat((gameState.dCoin + totalProfit).toFixed(4));
            // INTEGRATION: Use LineAI for bulk sale notification
            if (typeof LineAI !== 'undefined') {
                 LineAI.showGeneralError(`Bulk sale complete! ${soldCount} items sold for +${totalProfit.toFixed(2)} D Coin.`, 'success');
            }
            if (typeof updateStatusUI !== 'undefined') updateStatusUI(); 
            if (typeof updateInventoryUI !== 'undefined') updateInventoryUI();
            
            // FIX: Market List must refresh after selling all items
            if (typeof renderMarketList !== 'undefined') renderMarketList();
            
            return true;
        } else {
            this.updateSystemMessage("No products available.");
            // FIX: Return false on failure
            return false;
        }
    },

    // --- 8b. IAP & ADS LOGIC (Unchanged) ---
    
    // Handles the "Watch Ad" Button (Client-side, since it's a non-money transaction)
    processAdReward: function() {
        const AD_COOLDOWN_MS = 3600000; // 1 hour
        
        if (gameState.lastAdTime && (Date.now() - gameState.lastAdTime) < AD_COOLDOWN_MS) { 
            this.updateSystemMessage("Ad is on cooldown. Try again later.", 'warning');
            return false;
        }
        if (gameState.purchasedUpgrades['IAP_REMOVE_ADS']) {
             this.updateSystemMessage("Ads removed! No free reward available.", 'ready');
            return false;
        }

        // Simulate successful ad completion and fulfillment
        const dCoinReward = 100;
        const rpReward = 10;
        
        // Fulfill using dedicated functions
        this.fulfillPurchase(dCoinReward, 'DCOIN');
        this.fulfillPurchase(rpReward, 'RP');
        
        gameState.lastAdTime = Date.now();
        
        this.updateSystemMessage(`Ad watched! Received ${dCoinReward} D Coin and ${rpReward} RP.`, 'success');
        
        if (typeof renderIAPList !== 'undefined') renderIAPList(); // Refresh button state
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        return true;
    },
    
    // Core function to initiate the purchase (calls native Cordova)
    processIAP: function(iapId) {
        const item = IAP_CATALOG[iapId];
        
        if (!item) {
            this.updateSystemMessage(`IAP Error: Unknown ID ${iapId}.`, 'error');
            return false;
        }
        if (!gameState.gpgPlayerID) {
             this.updateSystemMessage("Connect Google Play Games before purchasing.", 'error');
             return false;
        }
        
        this.updateSystemMessage(`Connecting to Play Store for ${item.name}...`, 'warning');

        // CRITICAL STEP 1: Call the native method to initiate the purchase flow using Cordova.
        // The Cordova IAP plugin MUST expose 'window.inappbilling' (common standard).
        if (typeof window.inappbilling !== 'undefined' && window.inappbilling.buy) {
            
            // Native plugin handles the purchase. It MUST call window.onPurchaseSuccess on payment completion.
            window.inappbilling.buy(
                // Success Callback: The native layer passes the receipt/token here
                (receipt) => window.onPurchaseSuccess(receipt, iapId), 
                // Failure Callback: Purchase cancelled or failed
                (error) => gameEngine.updateSystemMessage(`Purchase cancelled or failed: ${error}`, 'error'), 
                item.productId, 
                // Consumable/Non-Consumable
                item.type === 'UTILITY' ? 'non-consumable' : 'consumable' 
            );
            return true;
        } else {
             this.updateSystemMessage("CRITICAL: IAP Plugin not ready. Cannot start purchase.", 'error');
             return false;
        }
    },

    // Server success handler: Fulfills currency purchase reward securely
    fulfillPurchase: function(amount, type) {
        if (typeof amount !== 'number' || amount <= 0) return this.updateSystemMessage("Fulfillment Error: Invalid amount received.", 'error');
        
        if (type === 'DCOIN') {
             // Apply D Coin, respecting the 4 decimal precision constraint
            gameState.dCoin = parseFloat((gameState.dCoin + amount).toFixed(4));
            this.updateSystemMessage(`Purchase successful! +${amount.toFixed(2)} D Coin credited.`, 'success');
        } else if (type === 'RP') {
            gameState.rp += amount;
            this.updateSystemMessage(`Purchase successful! +${amount} RP credited.`, 'success');
        } else {
            return;
        }
        
        if (typeof renderIAPList !== 'undefined') renderIAPList();
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
    },
    
    // Server success handler: Fulfills utility purchases (e.g., Remove Ads)
    fulfillUtility: function(item) {
        if (item.id === 'IAP_REMOVE_ADS') {
            gameState.purchasedUpgrades[item.id] = true; // Use upgrade map for persistent utility
            this.updateSystemMessage("Ads permanently removed! Thank thank you.", 'success');
        }
        if (typeof renderIAPList !== 'undefined') renderIAPList();
    },
    
    // --- NEW: COUPON LOGIC (Local Validation) ---

    redeemCoupon: function(code) {
        // Assumes COUPON_CATALOG is loaded globally from coupons.js
        const catalog = window.COUPON_CATALOG || {};
        const coupon = catalog[code];
        
        // 1. Check if coupon exists
        if (!coupon) {
            this.updateSystemMessage("Error: Coupon invalid or expired.", 'error');
            return false;
        }

        // 2. Check if coupon is unique and already redeemed
        // The redeemedCoupons object is added to gameState upon game initialization/load.
        if (coupon.isUnique && gameState.redeemedCoupons[code]) {
            this.updateSystemMessage(`Error: Coupon '${code}' already redeemed by this player.`, 'warning');
            return false;
        }

        // 3. FULFILLMENT (Immediate Reward)
        
        let rewardedDcoin = 0;
        let rewardedRp = 0;

        // Apply Rewards
        if (coupon.rp > 0) {
            gameState.rp += coupon.rp;
            rewardedRp = coupon.rp;
        }
        if (coupon.dCoin > 0) {
            // Apply 4-decimal precision fix
            gameState.dCoin = parseFloat((gameState.dCoin + coupon.dCoin).toFixed(4));
            rewardedDcoin = coupon.dCoin;
        }

        // Mark as redeemed if unique
        if (coupon.isUnique) {
            gameState.redeemedCoupons[code] = true;
        }
        
        // ** CRITICAL FIX: Save game state immediately to prevent refresh exploit **
        this.saveGame(); 

        // UI Update & Confirmation
        this.updateSystemMessage(`SUCCESS! Credited ${rewardedRp} RP and ${rewardedDcoin.toFixed(2)} D Coin.`, 'success');
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        
        // Optional: Trigger success animation
        if (typeof AudioController !== 'undefined') AudioController.playSuccess();

        return true;
    },

    // --- 9. PERSISTENCE LOGIC (Unchanged) ---
    saveGame: function() {
        try {
            const saveData = {
                state: gameState,
                time: gameTimeSeconds
            };
            const serializedData = JSON.stringify(saveData);
            localStorage.setItem('alchemistsForgeSave', serializedData);
            this.updateSystemMessage("Game saved successfully to local storage.", 'success');
        } catch (e) {
            console.error("Error saving game:", e);
            this.updateSystemMessage("CRITICAL SAVE ERROR: Failed to write to local storage.", 'error');
        }
    },

    loadGame: function() {
        try {
            const serializedData = localStorage.getItem('alchemistsForgeSave');
            if (!serializedData) {
                // CRITICAL FIX: Do NOT use updateSystemMessage here as it interferes with LineAI.init()
                console.warn("[System]: No saved game found. Starting new session.");
                return false;
            }

            const saveData = JSON.parse(serializedData);
            
            // Overwrite current state and time
            Object.assign(gameState, saveData.state);
            gameTimeSeconds = saveData.time;

            // Ensure Mana/Heat are clamped to max/min limits on load
            gameState.mana = Math.min(gameState.mana, gameState.maxMana);
            gameState.heat = Math.max(0, gameState.heat);
            
            // CRITICAL FIX: Enforce Worker Slot Constraint on Load to fix the visual bug.
            const initialSlotUpgradeBought = gameState.purchasedUpgrades['U_WORKER_SLOT_2'];
            if (!initialSlotUpgradeBought && gameState.maxWorkerSlots > GAME_CONFIG.INITIAL_WORKER_SLOTS) {
                 // Force Max Slots back to 1 if the first upgrade hasn't been purchased yet
                 gameState.maxWorkerSlots = GAME_CONFIG.INITIAL_WORKER_SLOTS;
            }


            // Clear temporary state variable which should not be loaded from save
            gameState.lastFailureCause = null;
            // Ensure IAP/GPG status doesn't persist if native environment is reset
            if (typeof plugins === 'undefined') {
                gameState.gpgPlayerID = null;
            }


            // CRITICAL FIX: Do NOT use updateSystemMessage here as it interferes with LineAI.init()
            console.log("[System]: Game loaded successfully from local storage.");
            return true;

        } catch (e) {
            console.error("Error loading game:", e);
            console.error("[System]: CRITICAL LOAD ERROR: Corrupted save data. Starting new session.");
            // Clear corrupted save
            localStorage.removeItem('alchemistsForgeSave');
            return false;
        }
    },


    // --- 10. MAIN LOOP & INIT ---
    
    // NEW: MARKET VOLATILITY LOGIC (Deterministic) ---

    // Seeds the PRNG using the base game seed and the product ID string
    getSeededRNG: function(productID) {
        // Use the stored game seed and the specific product ID for a unique sequence
        const seedStr = gameState.initialGameSeed.toString() + productID;
        const seed = cyrb128(seedStr);
        return sfc32(seed[0], seed[1], seed[2], seed[3]);
    },
    
    // Calculates the base price multiplier for a product for a given month/year
    generateMonthlyVolatility: function(productID, year, month) {
        const PRNG = this.getSeededRNG(productID);
        
        // Advance the PRNG stream until the target month/year is reached
        const targetCycle = (year - 1) * 12 + month;
        for (let i = 0; i < targetCycle; i++) {
            // Each call advances the state uniquely for this product stream
            PRNG(); 
        }
        
        // Generate a volatility swing between -10% and +15% (Range 0.90 to 1.15)
        // Use the next PRNG output for the multiplier
        const swing = PRNG() * 0.25; // 0.0 to 0.25
        const volatilityMultiplier = 0.90 + swing; // 0.90 to 1.15 (Base price multiplier)

        return parseFloat(volatilityMultiplier.toFixed(4));
    },

    // CRITICAL: Runs at the start of a new month
    updateMonthlyMarketTrends: function() {
        // CRITICAL FIX: Ensure resourceCatalog is defined before accessing it.
        if (typeof resourceCatalog === 'undefined') {
             console.warn("resourceCatalog not yet defined. Skipping initial market update.");
             return;
        }
        
        const products = Object.values(resourceCatalog).filter(r => r.type === 'Product');
        
        products.forEach(product => {
            const id = product.id;
            
            // 1. Generate the volatility multiplier for the CURRENT month
            const multiplier = this.generateMonthlyVolatility(id, gameState.year, gameState.month);
            
            // 2. Initialize or update history structure
            if (!gameState.marketHistory[id]) {
                gameState.marketHistory[id] = [];
            }
            
            // 3. Store the new monthly data point
            gameState.marketHistory[id].push({
                year: gameState.year,
                month: gameState.month,
                multiplier: multiplier,
                finalPrice: parseFloat((product.basePrice * multiplier).toFixed(4)),
                // Store relative change from BASE for display
                relativeChange: parseFloat(((multiplier - 1.0) * 100).toFixed(2))
            });

            // 4. Update the LIVE price in the resourceCatalog for the current month
            // Ensure data.js resourceCatalog structure is ready for livePrice field
            resourceCatalog[id].livePrice = product.basePrice * multiplier; 
        });
        
        // CRITICAL FIX: Do NOT use updateSystemMessage here as it interferes with LineAI.init()
        if (typeof LineAI !== 'undefined') {
             LineAI.showGeneralError(`Market Volatility updated for ${this.getFormattedDate()}`, 'ready');
        }
    },

    // Function to process maintenance costs (called once per game day)
    processMaintenanceCosts: function() {
        let totalCost = 0;
        const workersToStop = [];
        const wCatalog = this.getWorkerCatalog();

        gameState.activeWorkers.forEach(worker => {
            const blueprint = wCatalog[worker.typeID];
            // Check if the blueprint has a maintenance cost defined
            const cost = blueprint.dCoinMaintenance; 

            if (cost && worker.isWorking) {
                totalCost = parseFloat((totalCost + cost).toFixed(2));
                // If funds will be insufficient after total deduction, mark worker for stoppage
                if (gameState.dCoin < totalCost) { 
                    workersToStop.push(worker);
                }
            }
        });

        if (totalCost > 0) {
            if (gameState.dCoin >= totalCost) {
                // Funds are sufficient: process deduction
                gameState.dCoin = parseFloat((gameState.dCoin - totalCost).toFixed(2));
                this.updateSystemMessage(`Daily maintenance cost of ${totalCost.toFixed(2)} D Coin deducted.`, 'warning');
            } else {
                // Funds insufficient: Stop workers and deduct remaining D Coin
                workersToStop.forEach(worker => {
                    // Only stop workers that were contributing to the total cost
                    if (worker.isWorking) {
                        worker.isWorking = false;
                        this.updateSystemMessage(`${worker.name} stopped due to insufficient D Coin for maintenance!`, 'error');
                    }
                });
                // Deduct whatever remaining D Coin is left (should reach zero or very near zero)
                gameState.dCoin = 0;
            }
        }
        if (typeof updateStatusUI !== 'undefined') updateStatusUI(); 
        if (typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();
    },


    // Function to handle date increment logic
    updateDate: function() {
        // Only update the date when a cycle of REAL_SECONDS_PER_GAME_DAY (30 seconds) passes
        if (gameTimeSeconds > 0 && gameTimeSeconds % GAME_CONFIG.REAL_SECONDS_PER_GAME_DAY === 0) {
            
            // CRITICAL STEP: Run maintenance cost deduction at the start of the new day
            gameEngine.processMaintenanceCosts(); 

            gameState.day++;

            if (gameState.day > GAME_CONFIG.DAYS_PER_MONTH) {
                gameState.day = 1;
                gameState.month++;
                
                // --- MARKET TRENDS TRIGGER ---
                if (gameState.month > 12) {
                    gameState.month = 1;
                    gameState.year++;
                }
                
                // Runs at the start of every new month
                gameEngine.updateMonthlyMarketTrends(); 
                // --- END MARKET TRENDS TRIGGER ---
            }
        }
    },
    
    processWorkerProduction: function() {
        const wCatalog = this.getWorkerCatalog();
        gameState.activeWorkers.forEach(worker => {
            if (worker.isWorking) {
                const amount = worker.productionRate; 
                
                // --- PRECISION FIX IMPLEMENTED ---
                const currentCount = gameState.inventory[worker.resourceID] || 0;
                
                // Add the production rate, then round the result to 4 decimal places 
                const newCount = parseFloat((currentCount + amount).toFixed(4));
                
                gameState.inventory[worker.resourceID] = newCount;
                // --- END PRECISION FIX ---

                worker.fatigue += GAME_CONFIG.WORKER_FATIGUE_RATE * 10; 
                
                if (worker.fatigue >= worker.maxFatigue) {
                    worker.isWorking = false;
                    worker.fatigue = worker.maxFatigue;
                    
                    // INTEGRATION: Use LineAI for worker exhaustion notification
                    if (typeof LineAI !== 'undefined') {
                        LineAI.showGeneralError(`${worker.name} exhausted! Sent to rest.`, 'warning');
                    }
                }
            } else {
                worker.fatigue = Math.max(0, worker.fatigue - GAME_CONFIG.WORKER_REST_RATE * 10);
                if (worker.fatigue === 0) {
                    worker.isWorking = true;
                    // INTEGRATION: Use LineAI for worker rested notification
                    if (typeof LineAI !== 'undefined') {
                        LineAI.showGeneralError(`${worker.name} rested. Resuming work.`, 'ready');
                    }
                }
            }
        });
        
        // General UI updates after production cycle
        if (typeof updateInventoryUI !== 'undefined') updateInventoryUI();
        if (typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();
        
        // FIX: Check if the detailed worker modal is currently visible and update it
        if (typeof openWorkerDetailModal !== 'undefined' && typeof activeWorkerInstanceId !== 'undefined' && activeWorkerInstanceId !== null) {
            const worker = this.getWorkerInstance(activeWorkerInstanceId);
            if (worker) {
                openWorkerDetailModal(worker); // Re-render the specific modal instance
            }
        }
    },

    mainGameLoop: function() {
        gameTimeSeconds++;

        // NEW: Update date system
        gameEngine.updateDate();

        
        gameState.mana = Math.min(gameState.maxMana, gameState.mana + gameState.manaRegenRate); 
        gameState.heat = Math.max(0, gameState.heat - 0.5); 
        
        if (gameState.synthesisTimer > 0) {
            gameEngine.timerTick();
        }
        
        if (gameTimeSeconds % 10 === 0) {
            gameEngine.processWorkerProduction();
        }
        
        // CRITICAL FIX: The loop now calls updateStatusUI, which will then trigger 
        // updateSynthesisFeedbackUI (if slots are empty) or the active feedback.
        if (typeof updateStatusUI !== 'undefined') {
            updateStatusUI();
        }
    },

    init: function() {
        // Load game state immediately on initialization
        this.loadGame();
        
        // CRITICAL FIX: Ensure game seed is set only on FIRST run (if not loaded)
        if (gameState.initialGameSeed === 0) {
             gameState.initialGameSeed = Date.now();
             // Run initial trends generation for Month 1 (Y:1/JAN)
             gameEngine.updateMonthlyMarketTrends(); 
        }
        
        // If loaded, and we missed a month update (e.g., loaded on Day 15 but started January), run trend update
        if (gameTimeSeconds > 0 && gameState.day === 1) {
             gameEngine.updateMonthlyMarketTrends();
        }

        // --- CRITICAL FIX: Delaying UI/AI initialization to stabilize message queue ---
        // This ensures the initial "Forge operational" message from LineAI.init() 
        // runs BEFORE the loop tries to overwrite it with the error message.
        setTimeout(() => {
            // INTEGRATION: Initialize the LineAI helper
            if (typeof LineAI !== 'undefined') LineAI.init();
            
            // Initial UI Render calls. We do NOT call updateStatusUI() here, as the setInterval handles the first call 
            // after 1 second, giving LineAI 1s to set its message and schedule the tip.
            if(typeof updateInventoryUI !== 'undefined') updateInventoryUI();
            if(typeof updateSynthesisSlotsUI !== 'undefined') updateSynthesisSlotsUI();
            if(typeof updateWorkerSlotsUI !== 'undefined') updateWorkerSlotsUI();

            if(typeof renderUpgradeList !== 'undefined') renderUpgradeList();
            if(typeof renderWorkerList !== 'undefined') renderWorkerList();
            if(typeof renderRecipeBookList !== 'undefined') renderRecipeBookList();
            if(typeof renderIAPList !== 'undefined') renderIAPList();
        }, 50); // Small 50ms delay to let the initial load finish processing

        // The main game loop handles the continuous updateStatusUI calls every second.
        setInterval(this.mainGameLoop.bind(this), 1000);
        // Auto-save every minute
        setInterval(this.saveGame.bind(this), 60000); 
    },
    
    // --- NEW: COUPON LOGIC (Local Validation) ---

    redeemCoupon: function(code) {
        // Assumes COUPON_CATALOG is loaded globally from coupons.js
        const catalog = window.COUPON_CATALOG || {};
        const coupon = catalog[code];
        
        // 1. Check if coupon exists
        if (!coupon) {
            this.updateSystemMessage("Error: Coupon invalid or expired.", 'error');
            return false;
        }

        // 2. Check if coupon is unique and already redeemed
        // The redeemedCoupons object is added to gameState upon game initialization/load.
        if (coupon.isUnique && gameState.redeemedCoupons[code]) {
            this.updateSystemMessage(`Error: Coupon '${code}' already redeemed by this player.`, 'warning');
            return false;
        }

        // 3. FULFILLMENT (Immediate Reward)
        
        let rewardedDcoin = 0;
        let rewardedRp = 0;

        // Apply Rewards
        if (coupon.rp > 0) {
            gameState.rp += coupon.rp;
            rewardedRp = coupon.rp;
        }
        if (coupon.dCoin > 0) {
            // Apply 4-decimal precision fix
            gameState.dCoin = parseFloat((gameState.dCoin + coupon.dCoin).toFixed(4));
            rewardedDcoin = coupon.dCoin;
        }

        // Mark as redeemed if unique
        if (coupon.isUnique) {
            gameState.redeemedCoupons[code] = true;
        }
        
        // ** CRITICAL FIX: Save game state immediately to prevent refresh exploit **
        this.saveGame(); 

        // UI Update & Confirmation
        this.updateSystemMessage(`SUCCESS! Credited ${rewardedRp} RP and ${rewardedDcoin.toFixed(2)} D Coin.`, 'success');
        if (typeof updateStatusUI !== 'undefined') updateStatusUI();
        
        // Optional: Trigger success animation
        if (typeof AudioController !== 'undefined') AudioController.playSuccess();

        return true;
    },

}; 
// =================================================================
// GLOBAL CALLBACKS (Called by Native Android/Cordova Plugins)
// =================================================================

// 1. GPG Sign-In Success Callback (Called by the native GPG plugin)
window.onGpgSignedIn = function(playerID) {
    if (playerID && playerID !== 'SIGNED_OUT') {
        gameEngine.getGameState().gpgPlayerID = playerID;
        gameEngine.updateSystemMessage("Signed in to GPG! Cloud Save and Leaderboards active.", 'success');
    } else {
        gameEngine.getGameState().gpgPlayerID = null;
        gameEngine.updateSystemMessage("Failed to sign in to GPG. Local game only.", 'error');
    }
    // Ensure the profile UI refreshes
    if (typeof window.openProfileModal === 'function') {
        window.openProfileModal();
    }
    if (typeof updateStatusUI !== 'undefined') updateStatusUI();
};

// 2. IAP Purchase Success Callback (Called by the native IAP Billing plugin)
window.onPurchaseSuccess = function(receipt, iapId) {
    const item = gameEngine.getIAPCatalog()[iapId];
    // Handle different plugin formats for getting the token
    const purchaseToken = typeof receipt === 'object' ? receipt.purchaseToken : receipt; 

    if (!gameEngine.getGameState().gpgPlayerID) {
         gameEngine.updateSystemMessage("Purchase successful, but GPG ID missing. Cannot validate.", 'error');
         return;
    }
    
    gameEngine.updateSystemMessage(`Validating purchase of ${item.name} with server...`, 'warning');

    // CRITICAL STEP 2: Initiate SECURE SERVER-SIDE VALIDATION
    const validationPayload = {
        playerID: gameEngine.getGameState().gpgPlayerID,
        iapId: iapId,
        purchaseToken: purchaseToken,
        productId: item.productId, 
    };

    // This block MUST be replaced with a real fetch() request to your Serverless Backend
    
    // --- TEMPORARY SERVER SIMULATION FOR BASELINE ---
    setTimeout(() => {
        // Assuming server verification succeeded after 1.5 seconds
        const rewardAmount = item.value;
        const rewardType = item.type;
        
        // Final Fulfillment (only happens after server validation)
        if (rewardType === 'UTILITY') {
            gameEngine.fulfillUtility(item);
        } else {
            gameEngine.fulfillPurchase(rewardAmount, rewardType);
        }
    }, 1500); 
    // --- END TEMPORARY SERVER SIMULATION ---
};


// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Cordova/APCB E 'deviceready' event if running native, otherwise run immediately
    if (typeof cordova === 'undefined' && typeof plugins === 'undefined') {
        gameEngine.init();
    } else {
        document.addEventListener('deviceready', () => {
             gameEngine.init();
        }, false);
    }
});
