// =================================================================
// data.js - Consolidated Game Data (Resources, Recipes, Workers, Upgrades)
// STATUS: Final Baseline - MAINTENANCE COSTS ADDED TO T2, T3, T4 + LIVE PRICE FIELD ADDED TO PRODUCTS
// =================================================================

// =================================================================
// 1. RESOURCE CATALOG (95 Total Resources)
// =================================================================
const resourceCatalog = {
    
    // === TIER 1: BASE MATERIALS (5) ===
    'R_IRON': { id: 'R_IRON', name: "Iron Ore", type: "Raw", basePrice: 1.5, icon: 'assets/sprites/raw_iron.png' },
    'R_WATER': { id: 'R_WATER', name: "Distilled Water", type: "Raw", basePrice: 0.5, icon: 'assets/sprites/raw_water.png' },
    'R_STONE': { id: 'R_STONE', name: "Rough Stone", type: "Raw", basePrice: 0.8, icon: 'assets/sprites/raw_stone.png' },
    'R_COAL': { id: 'R_COAL', name: "Coal Chunk", type: "Raw", basePrice: 1.2, icon: 'assets/sprites/raw_coal.png' },
    'R_SILVER': { id: 'R_SILVER', name: "Silver Dust", type: "Raw", basePrice: 2.0, icon: 'assets/sprites/raw_silver.png' },

    // === TIER 2: INTERMEDIATE MATERIALS (7) ===
    'R_AQUA': { id: 'R_AQUA', name: "Aqua Vitae", type: "Raw", basePrice: 5.0, icon: 'assets/sprites/int_aqua_vitae.png' },
    'R_REFINED_IRON': { id: 'R_REFINED_IRON', name: "Refined Iron", type: "Raw", basePrice: 10.0, icon: 'assets/sprites/int_refined_iron.png' },
    'R_QUARTZ': { id: 'R_QUARTZ', name: "Quartz Crystal", type: "Raw", basePrice: 12.0, icon: 'assets/sprites/int_quartz.png' },
    'R_MERCURY': { id: 'R_MERCURY', name: "Quicksilver", type: "Raw", basePrice: 15.0, icon: 'assets/sprites/int_mercury.png' },
    'R_SULFUR': { id: 'R_SULFUR', name: "Pure Sulfur", type: "Raw", basePrice: 18.0, icon: 'assets/sprites/int_sulfur.png' },
    'R_COPPER': { id: 'R_COPPER', name: "Copper Ingot", type: "Raw", basePrice: 22.0, icon: 'assets/sprites/int_copper.png' },
    'R_TIN': { id: 'R_TIN', name: "Tin Ingot", type: "Raw", basePrice: 25.0, icon: 'assets/sprites/int_tin.png' },
    
    // === TIER 3: ADVANCED MATERIALS (5) ===
    'R_AETHER': { id: 'R_AETHER', name: "Aether Dust", type: "Raw", basePrice: 50.0, icon: 'assets/sprites/adv_aether.png' },
    'R_GOLD': { id: 'R_GOLD', name: "Purified Gold", type: "Raw", basePrice: 75.0, icon: 'assets/sprites/adv_gold.png' },
    'R_PLATINUM': { id: 'R_PLATINUM', name: "Platinum Shard", type: "Raw", basePrice: 120.0, icon: 'assets/sprites/adv_platinum.png' },
    'R_DIAMOND': { id: 'R_DIAMOND', name: "Perfect Diamond", type: "Raw", basePrice: 150.0, icon: 'assets/sprites/adv_diamond.png' },
    'R_PRISMATIC': { id: 'R_PRISMATIC', name: "Prismatic Sludge", type: "Raw", basePrice: 180.0, icon: 'assets/sprites/adv_prismatic.png' },
    
    // === TIER 4: MASTER MATERIALS (2) ===
    'R_LUNAR': { id: 'R_LUNAR', name: "Lunar Essence", type: "Raw", basePrice: 300.0, icon: 'assets/sprites/master_lunar.png' },
    'R_SOLAR': { id: 'R_SOLAR', name: "Solar Core", type: "Raw", basePrice: 400.0, icon: 'assets/sprites/master_solar.png' },

    // === TIER 5: CELESTIAL MATERIALS (10 NEW) ===
    'R_VOID': { id: 'R_VOID', name: "Void Shard", type: "Raw", basePrice: 600.0, icon: 'assets/sprites/celestial_void.png' },
    'R_STARLIGHT': { id: 'R_STARLIGHT', name: "Starlight Crystal", type: "Raw", basePrice: 750.0, icon: 'assets/sprites/celestial_starlight.png' },
    'R_CHRONOS': { id: 'R_CHRONOS', name: "Chronos Dust", type: "Raw", basePrice: 900.0, icon: 'assets/sprites/celestial_chronos.png' },
    'R_GRAVITY': { id: 'R_GRAVITY', name: "Gravity Well", type: "Raw", basePrice: 1100.0, icon: 'assets/sprites/celestial_gravity.png' },
    'R_ANTIMATTER': { id: 'R_ANTIMATTER', name: "Dark Matter Fluid", type: "Raw", basePrice: 1300.0, icon: 'assets/sprites/celestial_antimatter.png' },
    'R_SPARK': { id: 'R_SPARK', name: "Electrical Spark", type: "Raw", basePrice: 1500.0, icon: 'assets/sprites/celestial_spark.png' },
    'R_TITANIUM': { id: 'R_TITANIUM', name: "Titanium Block", type: "Raw", basePrice: 1700.0, icon: 'assets/sprites/celestial_titanium.png' },
    'R_NEBULA': { id: 'R_NEBULA', name: "Nebula Gas", type: "Raw", basePrice: 1900.0, icon: 'assets/sprites/celestial_nebula.png' },
    'R_INFINITY': { id: 'R_INFINITY', name: "Infinite Fragment", type: "Raw", basePrice: 2200.0, icon: 'assets/sprites/celestial_infinity.png' },
    'R_QUINTESSENCE': { id: 'R_QUINTESSENCE', name: "Quintessence Orb", type: "Raw", basePrice: 2500.0, icon: 'assets/sprites/celestial_quintessence.png' },

    // === TIER 6: EXOTIC MATERIALS (40) ===
    'R_EXOTIC_1': { id: 'R_EXOTIC_1', name: "Quantum Foam", type: "Raw", basePrice: 3000.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_2': { id: 'R_EXOTIC_2', name: "Tachyon Weave", type: "Raw", basePrice: 3050.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_3': { id: 'R_EXOTIC_3', name: "Hyperflux Ingot", type: "Raw", basePrice: 3100.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_4': { id: 'R_EXOTIC_4', name: "Singularity Dust", type: "Raw", basePrice: 3150.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_5': { id: 'R_EXOTIC_5', name: "Wormhole Residue", type: "Raw", basePrice: 3200.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_6': { id: 'R_EXOTIC_6', name: "Astro-Vellum", type: "Raw", basePrice: 3250.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_7': { id: 'R_EXOTIC_7', name: "Spectral Essence", type: "Raw", basePrice: 3300.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_8': { id: 'R_EXOTIC_8', name: "Entangled String", type: "Raw", basePrice: 3350.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_9': { id: 'R_EXOTIC_9', name: "Eternium Crystal", type: "Raw", basePrice: 3400.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_10': { id: 'R_EXOTIC_10', name: "Null Catalyst", type: "Raw", basePrice: 3450.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_11': { id: 'R_EXOTIC_11', name: "X-Ray Filament", type: "Raw", basePrice: 3500.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_12': { id: 'R_EXOTIC_12', name: "Pulsar Fragment", type: "Raw", basePrice: 3550.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_13': { id: 'R_EXOTIC_13', name: "Cosmic Ray Dust", type: "Raw", basePrice: 3600.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_14': { id: 'R_EXOTIC_14', name: "Magnetar Core", type: "Raw", basePrice: 3650.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_15': { id: 'R_EXOTIC_15', name: "Quasar Light", type: "Raw", basePrice: 3700.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_16': { id: 'R_EXOTIC_16', name: "Dark Energy Paste", type: "Raw", basePrice: 3750.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_17': { id: 'R_EXOTIC_17', name: "Vibranium Alloy", type: "Raw", basePrice: 3800.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_18': { id: 'R_EXOTIC_18', name: "Stardust Powder", type: "Raw", basePrice: 3850.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_19': { id: 'R_EXOTIC_19', name: "Nexus Filament", type: "Raw", basePrice: 3900.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_20': { id: 'R_EXOTIC_20', name: "Higgs Condensate", type: "Raw", basePrice: 3950.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_21': { id: 'R_EXOTIC_21', name: "Chronal Warp", type: "Raw", basePrice: 4000.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_22': { id: 'R_EXOTIC_22', name: "Temporal Splinter", type: "Raw", basePrice: 4050.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_23': { id: 'R_EXOTIC_23', name: "Event Horizon Fragment", type: "Raw", basePrice: 4100.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_24': { id: 'R_EXOTIC_24', name: "Dimensional Crystal", type: "Raw", basePrice: 4150.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_25': { id: 'R_EXOTIC_25', name: "Hyperion Dust", type: "Raw", basePrice: 4200.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_26': { id: 'R_EXOTIC_26', name: "Etheric Strand", type: "Raw", basePrice: 4250.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_27': { id: 'R_EXOTIC_27', name: "Cosmic Fabric", type: "Raw", basePrice: 4300.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_28': { id: 'R_EXOTIC_28', name: "Zero Point Fluid", type: "Raw", basePrice: 4350.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_29': { id: 'R_EXOTIC_29', name: "Fusion Plasma", type: "Raw", basePrice: 4400.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_30': { id: 'R_EXOTIC_30', name: "Graviton Particle", type: "Raw", basePrice: 4450.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_31': { id: 'R_EXOTIC_31', name: "Metamaterial Film", type: "Raw", basePrice: 4500.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_32': { id: 'R_EXOTIC_32', name: "Phasing Alloy", type: "Raw", basePrice: 4550.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_33': { id: 'R_EXOTIC_33', name: "Warped Singularity", type: "Raw", basePrice: 4600.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_34': { id: 'R_EXOTIC_34', name: "Celestial Core", type: "Raw", basePrice: 4650.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_35': { id: 'R_EXOTIC_35', name: "Transmutational Dust", type: "Raw", basePrice: 4700.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_36': { id: 'R_EXOTIC_36', name: "Void-Infused Resin", type: "Raw", basePrice: 4750.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_37': { id: 'R_EXOTIC_37', name: "Axiom Fragment", type: "Raw", basePrice: 4800.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_38': { id: 'R_EXOTIC_38', name: "Primal Energy", type: "Raw", basePrice: 4850.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_39': { id: 'R_EXOTIC_39', name: "Universal Key", type: "Raw", basePrice: 4900.0, icon: 'assets/sprites/exotic_matter.png' },
    'R_EXOTIC_40': { id: 'R_EXOTIC_40', name: "Unobtanium", type: "Raw", basePrice: 4950.0, icon: 'assets/sprites/exotic_matter.png' },

    // === UTILITY / FAILURE RESOURCE (1) ===
    'R_MESS': { id: 'R_MESS', name: "Alchemical Residue", type: "Raw", basePrice: 0.1, icon: 'assets/sprites/util_mess.png' },


    // === TIER 1 PRODUCTS (3) ===
    'P_TINCTURE': { id: 'P_TINCTURE', name: "Basic Tincture", type: "Product", basePrice: 25.00, icon: 'assets/sprites/prod_tincture.png', livePrice: 25.00 },
    'P_BATH': { id: 'P_BATH', name: "Rejuvenation Bath", type: "Product", basePrice: 35.00, icon: 'assets/sprites/prod_bath.png', livePrice: 35.00 },
    'E_ELIXIR': { id: 'E_ELIXIR', name: "Healing Elixir", type: "Product", basePrice: 50.00, icon: 'assets/sprites/prod_elixir.png', livePrice: 50.00 },

    // === TIER 2 PRODUCTS (4) ===
    'P_SPEED_POTION': { id: 'P_SPEED_POTION', name: "Speed Potion", type: "Product", basePrice: 150.00, icon: 'assets/sprites/prod_speed_potion.png', livePrice: 150.00 },
    'P_STRENGTH_POTION': { id: 'P_STRENGTH_POTION', name: "Strength Potion", type: "Product", basePrice: 180.00, icon: 'assets/sprites/prod_strength_potion.png', livePrice: 180.00 },
    'P_BRONZE': { id: 'P_BRONZE', name: "Bronze Alloy", type: "Product", basePrice: 80.00, icon: 'assets/sprites/prod_bronze.png', livePrice: 80.00 },
    'P_STEEL': { id: 'P_STEEL', name: "Steel Alloy", type: "Product", basePrice: 250.00, icon: 'assets/sprites/prod_steel.png', livePrice: 250.00 },
    
    // === TIER 3 PRODUCTS (4) ===
    'P_FLIGHT_POTION': { id: 'P_FLIGHT_POTION', name: "Potion of Flight", type: "Product", basePrice: 750.00, icon: 'assets/sprites/prod_flight_potion.png', livePrice: 750.00 },
    'P_PHILO_STONE': { id: 'P_PHILO_STONE', name: "Philosopher's Stone", type: "Product", basePrice: 50000.00, icon: 'assets/sprites/prod_philo_stone.png', livePrice: 50000.00 },
    'P_INVISIBILITY': { id: 'P_INVISIBILITY', name: "Invisibility Cloak", type: "Product", basePrice: 1200.00, icon: 'assets/sprites/prod_invisibility.png', livePrice: 1200.00 },
    'P_REGENERATION': { id: 'P_REGENERATION', name: "Regen Serum", type: "Product", basePrice: 900.00, icon: 'assets/sprites/prod_regeneration.png', livePrice: 900.00 },
    
    // === TIER 4 PRODUCTS (2) ===
    'P_SOLAR_FUEL': { id: 'P_SOLAR_FUEL', name: "Solar Fuel", type: "Product", basePrice: 2000.00, icon: 'assets/sprites/prod_solar_fuel.png', livePrice: 2000.00 },
    'P_LUNAR_ELIXIR': { id: 'P_LUNAR_ELIXIR', name: "Lunar Elixir", type: "Product", basePrice: 30000.00, icon: 'assets/sprites/prod_lunar_elixir.png', livePrice: 30000.00 },

    // === TIER 5 PRODUCTS (3 NEW) ===
    'P_COSMIC_ALLOY': { id: 'P_COSMIC_ALLOY', name: "Cosmic Alloy", type: "Product", basePrice: 5000.00, icon: 'assets/sprites/prod_cosmic_alloy.png', livePrice: 5000.00 },
    'P_TIME_STOPPER': { id: 'P_TIME_STOPPER', name: "Temporal Stabilizer", type: "Product", basePrice: 15000.00, icon: 'assets/sprites/prod_time_stopper.png', livePrice: 15000.00 },
    'P_AURA_SHIELD': { id: 'P_AURA_SHIELD', name: "Aura Shield", type: "Product", basePrice: 8000.00, icon: 'assets/sprites/prod_aura_shield.png', livePrice: 8000.00 },
};


// =================================================================
// 2. RECIPE BOOK (Corrected Early Game Flow)
// =================================================================
const recipeBook = {
    // --- T1 & T2 BASE RECIPES (10) ---
    
    // 1. STARTER PRODUCT (Tincture) - HIGH CHANCE, LOW COST (Uses starting T1 materials)
    'R_WATER|R_STONE': { outputId: 'P_TINCTURE', baseChance: 0.85, rpCost: 5, baseDuration: 2 },
    
    // 2. STARTER PRODUCT (Healing Elixir) - SECONDARY INCOME (Uses starting T1 materials)
    'R_IRON|R_WATER': { outputId: 'E_ELIXIR', baseChance: 0.80, rpCost: 5, baseDuration: 2 },
    
    // 3. KEY INTERMEDIATE (Aqua Vitae) - NECESSARY FOR T2 POTIONS
    'R_WATER|R_WATER': { outputId: 'R_AQUA', baseChance: 0.90, rpCost: 10, baseDuration: 2 },
    
    // 4. KEY INTERMEDIATE (Refined Iron) - NECESSARY FOR STEEL
    'R_IRON|R_IRON': { outputId: 'R_REFINED_IRON', baseChance: 0.75, rpCost: 15, baseDuration: 3 },
    
    // 5. FIRST ALLOY (Bronze) - PROFITABLE PRODUCT, uses T1 + T2 components. Unlocked at Lvl 1.
    'R_COAL|R_STONE': { outputId: 'P_BRONZE', baseChance: 0.70, rpCost: 20, baseDuration: 4, requiresUnlock: true, levelUnlock: 1 },
    
    // 6. T2 RAW MATERIAL (Quartz) - Unlocked by default
    'R_SILVER|R_STONE': { outputId: 'R_QUARTZ', baseChance: 0.75, rpCost: 12, baseDuration: 3 },
    
    // 7. T2 RAW MATERIAL (Sulfur) - Unlocked by default
    'R_COAL|R_COAL': { outputId: 'R_SULFUR', baseChance: 0.65, rpCost: 15, baseDuration: 4 },
    
    // 8. T2 RAW MATERIAL (Mercury) - Unlocked by default
    'R_SILVER|R_SILVER': { outputId: 'R_MERCURY', baseChance: 0.60, rpCost: 18, baseDuration: 5 },
    
    // 9. MESS RECYCLING (Base Material Recovery) - Essential mechanic. Unlocked at Lvl 1.
    'R_IRON|R_MESS': { outputId: 'R_COAL', baseChance: 0.65, rpCost: 5, baseDuration: 2, requiresUnlock: true, levelUnlock: 1 }, 
    
    // 10. PRODUCT CHAIN UPGRADE (Regeneration) - Uses starting products as input. Unlocked at Lvl 2.
    'P_TINCTURE|P_TINCTURE': { outputId: 'P_REGENERATION', baseChance: 0.50, rpCost: 30, baseDuration: 5, requiresUnlock: true, levelUnlock: 2 },


    // --- T3 & T4 ADVANCED RECIPES (Existing recipes follow here) ---
    'R_REFINED_IRON|R_MERCURY': { outputId: 'R_GOLD', baseChance: 0.40, rpCost: 40, baseDuration: 8, requiresUnlock: true, levelUnlock: 2 },
    'R_QUARTZ|R_AQUA': { outputId: 'R_AETHER', baseChance: 0.45, rpCost: 50, baseDuration: 10, requiresUnlock: true, levelUnlock: 3 },
    'R_SULFUR|R_MERCURY': { outputId: 'R_PLATINUM', baseChance: 0.35, rpCost: 75, baseDuration: 12, requiresUnlock: true, levelUnlock: 4 },
    'R_QUARTZ|R_GOLD': { outputId: 'R_DIAMOND', baseChance: 0.30, rpCost: 100, baseDuration: 15, requiresUnlock: true, levelUnlock: 5 },
    'R_AETHER|R_WATER': { outputId: 'R_PRISMATIC', baseChance: 0.25, rpCost: 150, baseDuration: 20, requiresUnlock: true, levelUnlock: 6 },
    
    // T4 progression recipes (Uses Machine/Contract outputs for T4 Masters)
    'R_GOLD|R_PLATINUM': { outputId: 'R_LUNAR', baseChance: 0.20, rpCost: 250, baseDuration: 30, requiresUnlock: true, levelUnlock: 7 }, 
    'R_DIAMOND|R_PRISMATIC': { outputId: 'R_SOLAR', baseChance: 0.18, rpCost: 300, baseDuration: 40, requiresUnlock: true, levelUnlock: 8 }, 
    
    // T4 Product Recipes - CLOSING THE LOOP
    'R_SOLAR|R_GOLD': { outputId: 'P_PHILO_STONE', baseChance: 0.10, rpCost: 500, baseDuration: 60, requiresUnlock: true, levelUnlock: 9 }, 
    'R_LUNAR|R_DIAMOND': { outputId: 'P_LUNAR_ELIXIR', baseChance: 0.12, rpCost: 450, baseDuration: 50, requiresUnlock: true, levelUnlock: 9 }, 

    // NEW T5 Recipes - Beginning Celestial Tier
    'R_LUNAR|R_AETHER': { outputId: 'R_VOID', baseChance: 0.15, rpCost: 600, baseDuration: 70, requiresUnlock: true, levelUnlock: 10 },


    // --- PRODUCT & ALLOY RECIPES (5) ---
    'R_COPPER|R_TIN': { outputId: 'P_BRONZE', baseChance: 0.70, rpCost: 25, baseDuration: 6, requiresUnlock: true, levelUnlock: 2 },
    'R_REFINED_IRON|R_COAL': { outputId: 'P_STEEL', baseChance: 0.65, rpCost: 40, baseDuration: 8, requiresUnlock: true, levelUnlock: 3 },
    'E_ELIXIR|R_AQUA': { outputId: 'P_SPEED_POTION', baseChance: 0.45, rpCost: 50, baseDuration: 8, requiresUnlock: true, levelUnlock: 2 },
    'E_ELIXIR|R_REFINED_IRON': { outputId: 'P_STRENGTH_POTION', baseChance: 0.40, rpCost: 75, baseDuration: 10, requiresUnlock: true, levelUnlock: 3 },
    'P_TINCTURE|P_BATH': { outputId: 'P_REGENERATION', baseChance: 0.50, rpCost: 100, baseDuration: 12, requiresUnlock: true, levelUnlock: 4 },
    
    // --- UTILITY/MESS RECIPES (5 NEW) ---
    // These recipes intentionally have a low output/success chance, ensuring players interact with the R_MESS mechanic.
    'R_MESS|R_MESS': { outputId: 'R_WATER', baseChance: 0.80, rpCost: 1, baseDuration: 1 }, 
    // R_MESS|R_IRON is now in the initial 10 recipes
    'R_MESS|R_AQUA': { outputId: 'R_MERCURY', baseChance: 0.10, rpCost: 50, baseDuration: 15, requiresUnlock: true, levelUnlock: 3 }, 
    'R_MESS|R_DIAMOND': { outputId: 'R_DIAMOND', baseChance: 0.05, rpCost: 500, baseDuration: 90, requiresUnlock: true, levelUnlock: 6 }, 
    'R_MESS|R_SOLAR': { outputId: 'P_TIME_STOPPER', baseChance: 0.01, rpCost: 5000, baseDuration: 120, requiresUnlock: true, levelUnlock: 10 }, 

    // --- GENERIC FAILURE RECIPES (5 NEW) ---
    // These recipes intentionally produce R_MESS to prevent unknown combinations from crashing the synthesis engine.
    'R_COAL|R_STONE': { outputId: 'R_MESS', baseChance: 0.20, rpCost: 1, baseDuration: 1 },
    'R_COAL|R_WATER': { outputId: 'R_MESS', baseChance: 0.20, rpCost: 1, baseDuration: 1 },
    'R_IRON|R_SILVER': { outputId: 'R_MESS', baseChance: 0.20, rpCost: 1, baseDuration: 1 },
    'R_SILVER|R_WATER': { outputId: 'R_MESS', baseChance: 0.20, rpCost: 1, baseDuration: 1 },
    'R_STONE|R_SULFUR': { outputId: 'R_MESS', baseChance: 0.20, rpCost: 1, baseDuration: 1 },


    // --- TIER 3/4 Products from previous list (10) ---
    'P_SPEED_POTION|P_STRENGTH_POTION': { outputId: 'P_FLIGHT_POTION', baseChance: 0.30, rpCost: 150, baseDuration: 18, requiresUnlock: true, levelUnlock: 5 },
    'P_REGENERATION|R_AETHER': { outputId: 'P_INVISIBILITY', baseChance: 0.25, rpCost: 200, baseDuration: 25, requiresUnlock: true, levelUnlock: 6 },
    'P_BATH|P_BATH': { outputId: 'P_REGENERATION', baseChance: 0.60, rpCost: 20, baseDuration: 5, requiresUnlock: true, levelUnlock: 4 },
    'P_SPEED_POTION|P_SPEED_POTION': { outputId: 'P_FLIGHT_POTION', baseChance: 0.40, rpCost: 80, baseDuration: 15, requiresUnlock: true, levelUnlock: 6 },
    'P_BRONZE|P_STEEL': { outputId: 'P_PHILO_STONE', baseChance: 0.15, rpCost: 300, baseDuration: 40, requiresUnlock: true, levelUnlock: 9 }, 
    'P_STEEL|P_STEEL': { outputId: 'P_SOLAR_FUEL', baseChance: 0.35, rpCost: 150, baseDuration: 20, requiresUnlock: true, levelUnlock: 7 },
    'R_COPPER|R_COPPER': { outputId: 'R_REFINED_IRON', baseChance: 0.80, rpCost: 10, baseDuration: 3 },
    'R_TIN|R_TIN': { outputId: 'R_SILVER', baseChance: 0.78, rpCost: 12, baseDuration: 3 },
    'R_COPPER|R_MERCURY': { outputId: 'R_GOLD', baseChance: 0.38, rpCost: 55, baseDuration: 10, requiresUnlock: true, levelUnlock: 4 },

    // --- FILLER RECIPES (25) ---
    'R_SULFUR|R_TIN': { outputId: 'R_PLATINUM', baseChance: 0.32, rpCost: 65, baseDuration: 11, requiresUnlock: true, levelUnlock: 5 },
    'R_AETHER|R_IRON': { outputId: 'R_DIAMOND', baseChance: 0.25, rpCost: 75, baseDuration: 14, requiresUnlock: true, levelUnlock: 6 },
    'R_GOLD|R_WATER': { outputId: 'R_PRISMATIC', baseChance: 0.18, rpCost: 90, baseDuration: 18, requiresUnlock: true, levelUnlock: 7 },
    'R_PLATINUM|R_STONE': { outputId: 'R_LUNAR', baseChance: 0.12, rpCost: 130, baseDuration: 25, requiresUnlock: true, levelUnlock: 8 },
    'R_COAL|R_DIAMOND': { outputId: 'R_SOLAR', baseChance: 0.10, rpCost: 150, baseDuration: 30, requiresUnlock: true, levelUnlock: 9 },
    'R_AQUA|R_SILVER': { outputId: 'P_TINCTURE', baseChance: 0.52, rpCost: 18, baseDuration: 4, requiresUnlock: true, levelUnlock: 2 },
    'R_IRON|R_QUARTZ': { outputId: 'P_BRONZE', baseChance: 0.60, rpCost: 30, baseDuration: 6, requiresUnlock: true, levelUnlock: 3 },
    'R_SULFUR|R_WATER': { outputId: 'P_STEEL', baseChance: 0.55, rpCost: 35, baseDuration: 7, requiresUnlock: true, levelUnlock: 4 },
    'R_MERCURY|R_STONE': { outputId: 'P_SPEED_POTION', baseChance: 0.38, rpCost: 60, baseDuration: 9, requiresUnlock: true, levelUnlock: 3 },
    'R_COAL|R_COPPER': { outputId: 'P_STRENGTH_POTION', baseChance: 0.32, rpCost: 85, baseDuration: 11, requiresUnlock: true, levelUnlock: 4 },
    'R_SILVER|R_TIN': { outputId: 'P_REGENERATION', baseChance: 0.42, rpCost: 120, baseDuration: 14, requiresUnlock: true, levelUnlock: 5 },
    'P_BRONZE|R_IRON': { outputId: 'P_STEEL', baseChance: 0.70, rpCost: 50, baseDuration: 6, requiresUnlock: true, levelUnlock: 4 },
    
    // T3 Refining Combinations (5 more)
    'R_AETHER|R_AETHER': { outputId: 'R_LUNAR', baseChance: 0.25, rpCost: 180, baseDuration: 25, requiresUnlock: true, levelUnlock: 7 },
    'R_GOLD|R_GOLD': { outputId: 'R_SOLAR', baseChance: 0.22, rpCost: 200, baseDuration: 30, requiresUnlock: true, levelUnlock: 8 },
    'R_PLATINUM|R_PLATINUM': { outputId: 'P_INVISIBILITY', baseChance: 0.35, rpCost: 150, baseDuration: 20, requiresUnlock: true, levelUnlock: 7 },
    'R_DIAMOND|R_DIAMOND': { outputId: 'P_FLIGHT_POTION', baseChance: 0.30, rpCost: 180, baseDuration: 22, requiresUnlock: true, levelUnlock: 8 },
    'R_PRISMATIC|R_PRISMATIC': { outputId: 'P_SOLAR_FUEL', baseChance: 0.28, rpCost: 200, baseDuration: 25, requiresUnlock: true, levelUnlock: 8 },

    // NEW Tier 5 Recipes (5)
    'R_STARLIGHT|R_VOID': { outputId: 'R_CHRONOS', baseChance: 0.10, rpCost: 1000, baseDuration: 90, requiresUnlock: true, levelUnlock: 11 },
    'R_CHRONOS|R_GRAVITY': { outputId: 'R_ANTIMATTER', baseChance: 0.08, rpCost: 1500, baseDuration: 100, requiresUnlock: true, levelUnlock: 12 },
    'R_ANTIMATTER|R_SPARK': { outputId: 'P_TIME_STOPPER', baseChance: 0.05, rpCost: 2500, baseDuration: 150, requiresUnlock: true, levelUnlock: 13 },
    'P_STEEL|R_TITANIUM': { outputId: 'P_COSMIC_ALLOY', baseChance: 0.35, rpCost: 1200, baseDuration: 70, requiresUnlock: true, levelUnlock: 10 },
    'P_FLIGHT_POTION|R_LUNAR': { outputId: 'P_AURA_SHIELD', baseChance: 0.20, rpCost: 900, baseDuration: 60, requiresUnlock: true, levelUnlock: 10 },
    
    // Placeholder Recipe Slots (10) for T6/Exotic integration
    'R_INFINITY|R_NEBULA': { outputId: 'R_QUINTESSENCE', baseChance: 0.05, rpCost: 5000, baseDuration: 180, requiresUnlock: true, levelUnlock: 15 },
    'R_QUINTESSENCE|R_SOLAR': { outputId: 'R_EXOTIC_1', baseChance: 0.02, rpCost: 10000, baseDuration: 240, requiresUnlock: true, levelUnlock: 18 },
    'R_EXOTIC_1|R_EXOTIC_2': { outputId: 'R_EXOTIC_3', baseChance: 0.80, rpCost: 100, baseDuration: 5, requiresUnlock: true, levelUnlock: 18 },
    'P_COSMIC_ALLOY|P_TIME_STOPPER': { outputId: 'P_PHILO_STONE', baseChance: 0.01, rpCost: 50000, baseDuration: 300, requiresUnlock: true, levelUnlock: 20 },

    // Total recipes now approx 80.
};


// =================================================================
// 3. WORKER BLUEPRINTS (EXPANDED TO 6 MODES: Worker, Machine, Contract, Mine, Facility, Syndicate)
// =================================================================
const workerCatalog = {
    // --- TIER 1: WORKERS (FREE MAINTENANCE) ---
    'W_IRON_MINER_BASIC': { 
        id: 'W_IRON_MINER_BASIC', 
        name: "Apprentice Miner (Iron)", 
        type: "Worker (T1)",
        resourceID: 'R_IRON', 
        productionRate: 0.1, 
        cost: 5, rpUnlockCost: 0, levelUnlock: 1, 
        icon: 'assets/sprites/worker_iron_basic.png' 
        // dCoinMaintenance NOT defined (FREE)
    },
    'W_WATER_COLLECTOR_BASIC': { 
        id: 'W_WATER_COLLECTOR_BASIC', 
        name: "Apprentice Collector (Water)", 
        type: "Worker (T1)",
        resourceID: 'R_WATER', 
        productionRate: 0.1, 
        cost: 5, rpUnlockCost: 0, levelUnlock: 1, 
        icon: 'assets/sprites/worker_water_basic.png' 
        // dCoinMaintenance NOT defined (FREE)
    },
    'W_STONE_MINER_BASIC': { 
        id: 'W_STONE_MINER_BASIC', 
        name: "Apprentice Miner (Stone)", 
        type: "Worker (T1)",
        resourceID: 'R_STONE', 
        productionRate: 0.1, 
        cost: 5, rpUnlockCost: 0, levelUnlock: 1, 
        icon: 'assets/sprites/worker_stone_basic.png' 
        // dCoinMaintenance NOT defined (FREE)
    },
    
    // --- TIER 2: ADVANCED WORKERS (PAID MAINTENANCE) ---
    'W_T2_COAL': { 
        id: 'W_T2_COAL', 
        name: "Coal Excavator", 
        type: "Worker (T2)",
        resourceID: 'R_COAL', 
        productionRate: 0.25, 
        cost: 75, rpUnlockCost: 50, levelUnlock: 2, 
        dCoinMaintenance: 2.50, // NEW: Daily maintenance cost
        icon: 'assets/sprites/worker_coal_t2.png' 
    },
    'W_T2_SILVER': { 
        id: 'W_T2_SILVER', 
        name: "Silver Scavenger", 
        type: "Worker (T2)",
        resourceID: 'R_SILVER', 
        productionRate: 0.3, 
        cost: 100, rpUnlockCost: 75, levelUnlock: 3, 
        dCoinMaintenance: 2.50, // NEW: Daily maintenance cost
        icon: 'assets/sprites/worker_silver_t2.png' 
    },

    // --- TIER 3: MACHINES (PAID MAINTENANCE) ---
    'M_IRON_FORGE': { 
        id: 'M_IRON_FORGE', 
        name: "Automated Iron Forge", 
        type: "Machine (T3)",
        resourceID: 'R_REFINED_IRON', 
        productionRate: 1.5, 
        cost: 1000, 
        rpUnlockCost: 500, 
        levelUnlock: 5, 
        dCoinMaintenance: 5.00, // NEW: Daily maintenance cost
        icon: 'assets/sprites/machine_iron_forge.png'
    },
    'M_AQUA_FILTER': { 
        id: 'M_AQUA_FILTER', 
        name: "Continuous Aqua Filter", 
        type: "Machine (T3)",
        resourceID: 'R_AQUA', 
        productionRate: 1.2, 
        cost: 800, 
        rpUnlockCost: 400, 
        levelUnlock: 4, 
        dCoinMaintenance: 5.00, // NEW: Daily maintenance cost
        icon: 'assets/sprites/machine_aqua_filter.png' 
    },

    // --- TIER 4: CONTRACTS (PAID MAINTENANCE) ---
    'C_GOLD_TENDER': { 
        id: 'C_GOLD_TENDER', 
        name: "Gold Extraction Contract", 
        type: "Contract (T4)",
        resourceID: 'R_GOLD', 
        productionRate: 2.1, 
        cost: 3000, 
        rpUnlockCost: 1500, 
        levelUnlock: 7, 
        dCoinMaintenance: 10.00, // NEW: Daily maintenance cost
        icon: 'assets/sprites/contract_gold_tender.png' 
    },
    'C_DIAMOND_LEVERAGE': { 
        id: 'C_DIAMOND_LEVERAGE', 
        name: "Diamond Futures Contract", 
        type: "Contract (T4)",
        resourceID: 'R_DIAMOND', 
        productionRate: 3.0, 
        cost: 5000, 
        rpUnlockCost: 2500, 
        levelUnlock: 8, 
        dCoinMaintenance: 10.00, // NEW: Daily maintenance cost
        icon: 'assets/sprites/contract_diamond_leverage.png' 
    },

    // --- T5: MINES (PAID MAINTENANCE) ---
    'MINE_IRON_DEEP': { 
        id: 'MINE_IRON_DEEP', 
        name: "Deep Iron Vein", 
        type: "Mine (T5)",
        resourceID: 'R_IRON', 
        productionRate: 5.0, // Very high fixed rate
        cost: 10000, 
        rpUnlockCost: 5000, 
        levelUnlock: 10, 
        dCoinMaintenance: 15.00, // Existing daily maintenance cost
        icon: 'assets/sprites/mine_iron_deep.png' 
    },
    'MINE_AETHER_SHARD': { 
        id: 'MINE_AETHER_SHARD', 
        name: "Aether Shard Deposit", 
        type: "Mine (T5)",
        resourceID: 'R_AETHER', 
        productionRate: 0.8, // Slower but valuable T3 output
        cost: 15000, 
        rpUnlockCost: 8000, 
        levelUnlock: 12, 
        dCoinMaintenance: 25.00, // Existing daily maintenance cost
        icon: 'assets/sprites/mine_aether_shard.png' 
    },

    // --- T6: FACILITY (PAID MAINTENANCE) ---
    'F_VOID_REFINERY': { 
        id: 'F_VOID_REFINERY', 
        name: "Void Particle Refinery", 
        type: "Facility (T6)",
        resourceID: 'R_VOID', 
        productionRate: 5.0, 
        cost: 30000, 
        rpUnlockCost: 15000, 
        levelUnlock: 14, 
        dCoinMaintenance: 50.00, // Existing daily maintenance cost
        icon: 'assets/sprites/facility_void_refinery.png' 
    },

    // --- T7: SYNDICATE (PAID MAINTENANCE) ---
    'S_EXOTIC_X': { 
        id: 'S_EXOTIC_X', 
        name: "Exotic Matter Syndicate", 
        type: "Syndicate (T7)",
        resourceID: 'R_EXOTIC_1', 
        productionRate: 10.0, // Extreme rate
        cost: 100000, 
        rpUnlockCost: 50000, 
        levelUnlock: 20, 
        dCoinMaintenance: 100.00, // Existing daily maintenance cost
        icon: 'assets/sprites/syndicate_exotic_x.png' 
    },

    // --- T3: ADVANCED WORKERS (PAID MAINTENANCE) ---
    'W_T3_AETHER': { 
        id: 'W_T3_AETHER', 
        name: "Aetherial Extractor", 
        type: "Worker (T3)",
        resourceID: 'R_AETHER', 
        productionRate: 0.4, 
        cost: 400, 
        rpUnlockCost: 300, 
        levelUnlock: 7, 
        dCoinMaintenance: 5.00, // NEW: Daily maintenance cost
        icon: 'assets/sprites/worker_aether_t3.png' 
    },
};
