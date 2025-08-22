const rarityMultiplier = {
    common: 2,
    rare: 3,
    epic: 4,
    lego: 5,
}
const rarityModifier = {
    common: 0,
    rare: -100,
    epic: -100,
    lego: -100,
}

const init = async () => {
    await loadTroops()
    document.querySelectorAll('.unit').forEach( u => {
        updateUnitCostLine(u)
    })
    updateTotalWarpower()
    getMostEffectiveUnit()
    renderProfileSelector()
}

const getPower = (lvl, rarity) => {
    
    const modifier = lvl > 1000 ? rarityModifier[rarity] : 0;
    // console.log({lvl:lvl, rarity, result: troopsData[lvl-1]})

    // console.log({lvl:lvl, modifier, rarity, result: (troopsData[lvl-1].powerBase * rarityMultiplier[rarity]) + modifier})

    return (troopsData[lvl-1].powerBase * rarityMultiplier[rarity]) + modifier
}

const getTwinPower = lvl => twinsData[lvl-1].powerBase

const updateUnitCostLine = (currentUnit, recalculate = false) => {
    const rarity = currentUnit.dataset.rarity
    const currentLevel = parseInt(currentUnit.querySelector('.unit_level input').value)
    const desiredLevel = parseInt(currentUnit.querySelector('.unit_level input:last-of-type').value)
    const coreCostResult = currentUnit.querySelector('.total_core_cost')
    const cubeCostResult = currentUnit.querySelector('.total_cube_cost')
    const currentPowerResult = currentUnit.querySelector('.current_power')
    const newPowerResult = currentUnit.querySelector('.new_power')
    const newPowerDiff = currentUnit.querySelector('.new_power_diff')
    const mercBonus = (currentUnit.querySelector('.merc_level_selector').value / 100) + 1

    if (currentLevel === 0) return

    let coreCost
    let cubeCost
    let currentPower
    let nextPower

    if(rarity === "season") {
        coreCost = (desiredLevel == 0)? 0 : twinsData[desiredLevel-1].totalCoreCost - twinsData[currentLevel-1].totalCoreCost
        cubeCost = (desiredLevel == 0)? 0 : twinsData[desiredLevel-1].totalCubeCost - twinsData[currentLevel-1].totalCubeCost
        currentPower = (currentLevel == 0)? 0 : Math.round(getTwinPower(currentLevel) * mercBonus)
        nextPower = (desiredLevel == 0)? 0 : Math.round(getTwinPower(desiredLevel) * mercBonus)
    } else {
        coreCost = (desiredLevel == 0)? 0 : troopsData[desiredLevel-1].totalCoreCost - troopsData[currentLevel-1].totalCoreCost
        cubeCost = (desiredLevel == 0)? 0 : troopsData[desiredLevel-1].totalCubeCost - troopsData[currentLevel-1].totalCubeCost
        currentPower = (currentLevel == 0)? 0 : Math.round(getPower(currentLevel, rarity) * mercBonus)
        nextPower = (desiredLevel == 0)? 0 : Math.round(getPower(desiredLevel, rarity) * mercBonus)
    }
    
    coreCostResult.innerHTML = (coreCost > 0) ? coreCost : "0";
    cubeCostResult.innerHTML = (cubeCost > 0) ? cubeCost : "0";
    currentPowerResult.innerHTML = currentPower
    newPowerResult.innerHTML = nextPower
    newPowerDiff.innerHTML = (nextPower - currentPower > 0) ? `(+${nextPower - currentPower})` : '';
    
    if (recalculate) updateTotalWarpower()
}

const updateTotalWarpower = () => {
    const units = document.querySelectorAll('.troops_selector--regular .unit:not(.premium), .troops_selector--regular .unit:has(input:checked)');
    const twins = document.querySelectorAll('.troops_selector--seasonnal .unit:not(.premium), .troops_selector--seasonnal .unit:has(input:checked)');
    let currentWarPower = 0;
    let futureWarPower = 0;
    let redCoreCost = 0;
    let tankCoreCost = 0;
    let mechCoreCost = 0;
    let airCoreCost = 0;
    let cubeCost = 0;
    let redCubeCost = 0;
    
    for(let twin of twins) {
        currentWarPower += parseInt(twin.querySelector('.current_power').innerHTML || 0)
        futureWarPower += parseInt(twin.querySelector('.new_power').innerHTML || 0)
        redCoreCost += parseInt(twin.querySelector('.total_core_cost').innerHTML || 0)
        redCubeCost += parseInt(twin.querySelector('.total_cube_cost').innerHTML || 0);
    }

    for(let unit of units){
        unit.classList.remove('most_effective');
        currentWarPower += parseInt(unit.querySelector('.current_power').innerHTML || 0)
        futureWarPower += parseInt(unit.querySelector('.new_power').innerHTML || 0)
        if(unit.dataset.type === "tank") tankCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML || 0)
        if(unit.dataset.type === "mech") mechCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML || 0)
        if(unit.dataset.type === "air") airCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML || 0)
        cubeCost += parseInt(unit.querySelector('.total_cube_cost').innerHTML || 0);
    }

    document.querySelector('.warpower .current_power').innerHTML = currentWarPower;
    document.querySelector('.warpower .new_power').innerHTML = futureWarPower;
    document.querySelector('.warpower .new_power_diff').innerHTML = (futureWarPower - currentWarPower > 0) ? `(+${futureWarPower - currentWarPower})` : '';
    document.querySelector('.warpower .upgrade_costs .total_tankcore_cost').innerHTML = tankCoreCost;
    document.querySelector('.warpower .upgrade_costs .total_mechcore_cost').innerHTML = mechCoreCost;
    document.querySelector('.warpower .upgrade_costs .total_aircore_cost').innerHTML = airCoreCost;
    document.querySelector('.warpower .upgrade_costs .total_cube_cost').innerHTML = cubeCost;

    document.querySelector('.warpower .upgrade_costs .total_redcore_cost').innerHTML = redCoreCost;
    document.querySelector('.warpower .upgrade_costs .total_redcube_cost').innerHTML = redCubeCost;

    getMostEffectiveUnit()
    
}

const getMostEffectiveUnit = () => {

    const units = document.querySelectorAll('.troops_selector--regular .unit:not(.premium), .troops_selector--regular .unit:has(input:checked)');
    const twins = document.querySelectorAll('.troops_selector--seasonnal .unit:not(.premium), .troops_selector--seasonnal .unit:has(input:checked)');

    let mostEffectiveUnits = [];
    let mostEffectiveCost = 999999;

    for(let unit of units){
        unit.classList.remove('most_effective');
        if(unit.classList.contains('spent')) continue 

        const resourcesPerPower = getResourcesPerPower(unit)
        if(resourcesPerPower < 999999) {
            if( resourcesPerPower === mostEffectiveCost ) {
                mostEffectiveUnits.push(unit)
                mostEffectiveCost = resourcesPerPower;
            } else if ( resourcesPerPower < mostEffectiveCost ) {
                mostEffectiveUnits = [unit];
                mostEffectiveCost = resourcesPerPower;
            }
        }
    }

    let mostEffectiveTwins;
    let mostEffectiveTwinslvl = 1000;

    for(let twin of twins) {
       twin.classList.remove('most_effective');
       if(twin.classList.contains('spent')) continue 
       const desiredLevel = parseInt(twin.querySelector('.unit_level input:last-of-type').value)
       if( desiredLevel < mostEffectiveTwinslvl ) {
            mostEffectiveTwins = twin;
            mostEffectiveTwinslvl = desiredLevel
       }
    }

    // console.log({mostEffectiveUnits, mostEffectiveCost, mostEffectiveTwins, mostEffectiveTwinslvl})
    for( let mostEffectiveUnit of mostEffectiveUnits) {
        mostEffectiveUnit?.classList.add('most_effective');
    }
    mostEffectiveTwins?.classList.add('most_effective');

}

const getResourcesPerPower = (unit) => {

    const useCorePriority = document.querySelector('#resourcePriority').checked 
    
    const rarity = unit.dataset.rarity
    // const currentLevel = parseInt(unit.querySelector('.unit_level input').value)
    const desiredLevel = parseInt(unit.querySelector('.unit_level input:last-of-type').value)
    const currentTen = Math.floor(desiredLevel/10)*10
    const nextTen = (Math.floor(desiredLevel/10)+1)*10

    if(desiredLevel <= 0) return 9999
    if(desiredLevel >= troopsData.length - 9) return 9999

    const plus10LvlPower = Math.floor(getPower(nextTen+1, rarity)) - Math.floor(getPower(currentTen+1, rarity))
    let plus10LvlCost = troopsData[nextTen].totalCubeCost - troopsData[currentTen].totalCubeCost
    
    if(useCorePriority) {
        plus10LvlCost = troopsData[nextTen].totalCoreCost - troopsData[currentTen].totalCoreCost
    }

    const resourcesPerPower = plus10LvlCost/plus10LvlPower

    // console.log(`${rarity.toUpperCase()} ${unit.dataset.type} lvl ${desiredLevel} \n${plus10LvlPower} power for ${plus10LvlCost} \nCost = ${Math.round(resourcesPerPower)} ${useCorePriority? 'Core':'Cube'} per power`)

    return resourcesPerPower;
}

const getDataFromHTML = () => {
    return {
        resources: {
            tankcore: parseInt(document.querySelector('#tankCores').value),
            mechCore: parseInt(document.querySelector('#mechCores').value),
            airCore: parseInt(document.querySelector('#airCores').value),
            neoCube: parseInt(document.querySelector('#neocubes').value),
            redCore: parseInt(document.querySelector('#redCores').value),
            redCube: parseInt(document.querySelector('#redCubes').value),
        },
        units: {
            season: {
                twins1: {currentLevel: parseInt(document.querySelector('#season_twins_1_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_1_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_1_merc_bonus').value)},
                twins2: {currentLevel: parseInt(document.querySelector('#season_twins_2_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_2_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_2_merc_bonus').value)},
                twins3: {currentLevel: parseInt(document.querySelector('#season_twins_3_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_3_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_3_merc_bonus').value)},
                twins4: {currentLevel: parseInt(document.querySelector('#season_twins_4_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_4_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_4_merc_bonus').value)},
                twins5: {currentLevel: parseInt(document.querySelector('#season_twins_5_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_5_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_5_merc_bonus').value)},
                twins6: {currentLevel: parseInt(document.querySelector('#season_twins_6_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_6_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_6_merc_bonus').value)},
                twins7: {currentLevel: parseInt(document.querySelector('#season_twins_7_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_7_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_7_merc_bonus').value), owned: document.querySelector('#season_twins_7_owned').checked},
                twins8: {currentLevel: parseInt(document.querySelector('#season_twins_8_lvl').value), targetLevel: parseInt(document.querySelector('#season_twins_8_flvl').value), mercBonus: parseInt(document.querySelector('#season_twins_8_merc_bonus').value), owned: document.querySelector('#season_twins_5_owned').checked},
            },
            common: {
                tank1: {currentLevel: parseInt(document.querySelector('#common_tank_1_lvl').value), targetLevel: parseInt(document.querySelector('#common_tank_1_flvl').value), mercBonus: parseInt(document.querySelector('#common_tank_1_merc_bonus').value)},
                tank2: {currentLevel: parseInt(document.querySelector('#common_tank_2_lvl').value), targetLevel: parseInt(document.querySelector('#common_tank_2_flvl').value), mercBonus: parseInt(document.querySelector('#common_tank_2_merc_bonus').value)},
                mech1: {currentLevel: parseInt(document.querySelector('#common_mech_1_lvl').value), targetLevel: parseInt(document.querySelector('#common_mech_1_flvl').value), mercBonus: parseInt(document.querySelector('#common_mech_1_merc_bonus').value)},
                mech2: {currentLevel: parseInt(document.querySelector('#common_mech_2_lvl').value), targetLevel: parseInt(document.querySelector('#common_mech_2_flvl').value), mercBonus: parseInt(document.querySelector('#common_mech_2_merc_bonus').value)},
                air1: {currentLevel: parseInt(document.querySelector('#common_air_1_lvl').value), targetLevel: parseInt(document.querySelector('#common_air_1_flvl').value), mercBonus: parseInt(document.querySelector('#common_air_1_merc_bonus').value)},
                air2: {currentLevel: parseInt(document.querySelector('#common_air_2_lvl').value), targetLevel: parseInt(document.querySelector('#common_air_2_flvl').value), mercBonus: parseInt(document.querySelector('#common_air_2_merc_bonus').value)},
            },
            rare: {
                tank1: {currentLevel: parseInt(document.querySelector('#rare_tank_1_lvl').value), targetLevel: parseInt(document.querySelector('#rare_tank_1_flvl').value), mercBonus: parseInt(document.querySelector('#rare_tank_1_merc_bonus').value), owned: document.querySelector('#rare_tank_1_owned').checked},
                tank2: {currentLevel: parseInt(document.querySelector('#rare_tank_2_lvl').value), targetLevel: parseInt(document.querySelector('#rare_tank_2_flvl').value), mercBonus: parseInt(document.querySelector('#rare_tank_2_merc_bonus').value), owned: document.querySelector('#rare_tank_2_owned').checked},
                mech1: {currentLevel: parseInt(document.querySelector('#rare_mech_lvl').value), targetLevel: parseInt(document.querySelector('#rare_mech_flvl').value), mercBonus: parseInt(document.querySelector('#rare_mech_merc_bonus').value), owned: document.querySelector('#rare_mech_owned').checked},
                air1: {currentLevel: parseInt(document.querySelector('#rare_air_lvl').value), targetLevel: parseInt(document.querySelector('#rare_air_flvl').value), mercBonus: parseInt(document.querySelector('#rare_air_merc_bonus').value), owned: document.querySelector('#rare_air_owned').checked},
            },
            epic: {
                tank1: {currentLevel: parseInt(document.querySelector('#epic_tank_lvl').value), targetLevel: parseInt(document.querySelector('#epic_tank_flvl').value), mercBonus: parseInt(document.querySelector('#epic_tank_merc_bonus').value), owned: document.querySelector('#epic_tank_owned').checked},
                mech1: {currentLevel: parseInt(document.querySelector('#epic_mech_1_lvl').value), targetLevel: parseInt(document.querySelector('#epic_mech_1_flvl').value), mercBonus: parseInt(document.querySelector('#epic_mech_1_merc_bonus').value), owned: document.querySelector('#epic_mech_1_owned').checked},
                mech2: {currentLevel: parseInt(document.querySelector('#epic_mech_2_lvl').value), targetLevel: parseInt(document.querySelector('#epic_mech_2_flvl').value), mercBonus: parseInt(document.querySelector('#epic_mech_2_merc_bonus').value), owned: document.querySelector('#epic_mech_2_owned').checked},
                air1: {currentLevel: parseInt(document.querySelector('#epic_air_lvl').value), targetLevel: parseInt(document.querySelector('#epic_air_flvl').value), mercBonus: parseInt(document.querySelector('#epic_air_merc_bonus').value), owned: document.querySelector('#epic_air_owned').checked},
            },
            lego: {
                tank1: {currentLevel: parseInt(document.querySelector('#lego_tank_lvl').value), targetLevel: parseInt(document.querySelector('#lego_tank_flvl').value), mercBonus: parseInt(document.querySelector('#lego_tank_merc_bonus').value), owned: document.querySelector('#lego_tank_owned').checked},
                mech1: {currentLevel: parseInt(document.querySelector('#lego_mech_lvl').value), targetLevel: parseInt(document.querySelector('#lego_mech_flvl').value), mercBonus: parseInt(document.querySelector('#lego_mech_merc_bonus').value), owned: document.querySelector('#lego_mech_owned').checked},
                air1: {currentLevel: parseInt(document.querySelector('#lego_air_1_lvl').value), targetLevel: parseInt(document.querySelector('#lego_air_1_flvl').value), mercBonus: parseInt(document.querySelector('#lego_air_1_merc_bonus').value), owned: document.querySelector('#lego_air_1_owned').checked},
                air2: {currentLevel: parseInt(document.querySelector('#lego_air_2_lvl').value), targetLevel: parseInt(document.querySelector('#lego_air_2_flvl').value), mercBonus: parseInt(document.querySelector('#lego_air_2_merc_bonus').value), owned: document.querySelector('#lego_air_2_owned').checked},
            }
        }
    }
}

const renderProfileSelector = async () => {
    const profileList = await storage.getItem('TroopsData', 'profileList', 'LGTroopsCalculator') || [];
    const profileSelector = document.querySelector('#profile')
  
    profileSelector.querySelectorAll('option').forEach(o => profileSelector.removeChild(o))
  
    const defaultOption = document.createElement("option")
    defaultOption.appendChild(document.createTextNode(`Main (default)`))
    defaultOption.value = "main"
    profileSelector.appendChild(defaultOption);
   
    for(profile of profileList) {
      const profileOption = document.createElement("option")
      profileOption.appendChild(document.createTextNode(profile))
      profileOption.value = profile
      profileSelector.appendChild(profileOption);
    }
  
    const addProfileOption = document.createElement("option")
    addProfileOption.appendChild(document.createTextNode(`Add a new profile`));
    addProfileOption.value = 'addProfile'
    profileSelector.appendChild(addProfileOption);
  
    profileSelector.querySelector(`option[value=${lastUsedProfile}]`).selected = true;
  }

const saveTroops = async () => {
    const data = getDataFromHTML();
    //console.log(data)
    storage.setItem('TroopsData', lastUsedProfile, data, 'LGTroopsCalculator')
}

const setNewProfile = async () => {
  
    for(field of document.querySelectorAll('.ressources input')) {
        field.value = 0
    }

    for(field of document.querySelectorAll('.unit [id$=lvl]')) {
        field.value = 0
    }

    for(field of document.querySelectorAll('.unit [id$=_merc_bonus]')) {
        field.value = 0
    }

    for(field of document.querySelectorAll('.unit [id$=_owned]')) {
        field.checked = false
    }

    await saveTroops()
}

const loadTroops = async () => {
    const data = await storage.getItem('TroopsData', lastUsedProfile, 'LGTroopsCalculator') || null
    // console.log(`LOAD ${lastUsedProfile} data :`, data)

    if (!data) return

    document.querySelector('#tankCores').value = data.resources.tankcore
    document.querySelector('#mechCores').value = data.resources.mechCore
    document.querySelector('#airCores').value = data.resources.airCore
    document.querySelector('#neocubes').value = data.resources.neoCube

    document.querySelector('#redCores').value = data.resources.redCore
    document.querySelector('#redCubes').value = data.resources.redCube

    document.querySelector('#season_twins_1_lvl').value = data.units.season?.twins1.currentLevel ?? 1
    document.querySelector('#season_twins_2_lvl').value = data.units.season?.twins2.currentLevel ?? 1
    document.querySelector('#season_twins_3_lvl').value = data.units.season?.twins3.currentLevel ?? 1
    document.querySelector('#season_twins_4_lvl').value = data.units.season?.twins4.currentLevel ?? 1
    document.querySelector('#season_twins_5_lvl').value = data.units.season?.twins5.currentLevel ?? 1
    document.querySelector('#season_twins_6_lvl').value = data.units.season?.twins6.currentLevel ?? 1
    document.querySelector('#season_twins_7_lvl').value = data.units.season?.twins7.currentLevel ?? 1
    document.querySelector('#season_twins_8_lvl').value = data.units.season?.twins8.currentLevel ?? 1
    document.querySelector('#common_tank_1_lvl').value = data.units.common.tank1.currentLevel
    document.querySelector('#common_tank_2_lvl').value = data.units.common.tank2.currentLevel
    document.querySelector('#common_mech_1_lvl').value = data.units.common.mech1.currentLevel
    document.querySelector('#common_mech_2_lvl').value = data.units.common.mech2.currentLevel
    document.querySelector('#common_air_1_lvl').value = data.units.common.air1.currentLevel
    document.querySelector('#common_air_2_lvl').value = data.units.common.air2.currentLevel
    document.querySelector('#rare_tank_1_lvl').value = data.units.rare.tank1.currentLevel
    document.querySelector('#rare_tank_2_lvl').value = data.units.rare.tank2.currentLevel
    document.querySelector('#rare_mech_lvl').value = data.units.rare.mech1.currentLevel
    document.querySelector('#rare_air_lvl').value = data.units.rare.air1.currentLevel
    document.querySelector('#epic_tank_lvl').value = data.units.epic.tank1.currentLevel
    document.querySelector('#epic_mech_1_lvl').value = data.units.epic.mech1.currentLevel
    document.querySelector('#epic_mech_2_lvl').value = data.units.epic.mech2.currentLevel
    document.querySelector('#epic_air_lvl').value = data.units.epic.air1.currentLevel
    document.querySelector('#lego_tank_lvl').value = data.units.lego.tank1.currentLevel
    document.querySelector('#lego_mech_lvl').value = data.units.lego.mech1.currentLevel
    document.querySelector('#lego_air_1_lvl').value = data.units.lego.air1.currentLevel
    document.querySelector('#lego_air_2_lvl').value = data.units.lego.air2.currentLevel

    document.querySelector('#season_twins_1_flvl').value = data.units.season?.twins1.targetLevel ?? 2
    document.querySelector('#season_twins_2_flvl').value = data.units.season?.twins2.targetLevel ?? 2
    document.querySelector('#season_twins_3_flvl').value = data.units.season?.twins3.targetLevel ?? 2
    document.querySelector('#season_twins_4_flvl').value = data.units.season?.twins4.targetLevel ?? 2
    document.querySelector('#season_twins_5_flvl').value = data.units.season?.twins5.targetLevel ?? 2
    document.querySelector('#season_twins_6_flvl').value = data.units.season?.twins6.targetLevel ?? 2
    document.querySelector('#season_twins_7_flvl').value = data.units.season?.twins7.targetLevel ?? 2
    document.querySelector('#season_twins_8_flvl').value = data.units.season?.twins8.targetLevel ?? 2
    document.querySelector('#common_tank_1_flvl').value = data.units.common.tank1.targetLevel
    document.querySelector('#common_tank_2_flvl').value = data.units.common.tank2.targetLevel
    document.querySelector('#common_mech_1_flvl').value = data.units.common.mech1.targetLevel
    document.querySelector('#common_mech_2_flvl').value = data.units.common.mech2.targetLevel
    document.querySelector('#common_air_1_flvl').value = data.units.common.air1.targetLevel
    document.querySelector('#common_air_2_flvl').value = data.units.common.air2.targetLevel
    document.querySelector('#rare_tank_1_flvl').value = data.units.rare.tank1.targetLevel
    document.querySelector('#rare_tank_2_flvl').value = data.units.rare.tank2.targetLevel
    document.querySelector('#rare_mech_flvl').value = data.units.rare.mech1.targetLevel
    document.querySelector('#rare_air_flvl').value = data.units.rare.air1.targetLevel
    document.querySelector('#epic_tank_flvl').value = data.units.epic.tank1.targetLevel
    document.querySelector('#epic_mech_1_flvl').value = data.units.epic.mech1.targetLevel
    document.querySelector('#epic_mech_2_flvl').value = data.units.epic.mech2.targetLevel
    document.querySelector('#epic_air_flvl').value = data.units.epic.air1.targetLevel
    document.querySelector('#lego_tank_flvl').value = data.units.lego.tank1.targetLevel
    document.querySelector('#lego_mech_flvl').value = data.units.lego.mech1.targetLevel
    document.querySelector('#lego_air_1_flvl').value = data.units.lego.air1.targetLevel
    document.querySelector('#lego_air_2_flvl').value = data.units.lego.air2.targetLevel

    document.querySelector('#season_twins_1_merc_bonus').value = data.units.season?.twins1.mercBonus ?? 0
    document.querySelector('#season_twins_2_merc_bonus').value = data.units.season?.twins2.mercBonus ?? 0
    document.querySelector('#season_twins_3_merc_bonus').value = data.units.season?.twins3.mercBonus ?? 0
    document.querySelector('#season_twins_4_merc_bonus').value = data.units.season?.twins4.mercBonus ?? 0
    document.querySelector('#season_twins_5_merc_bonus').value = data.units.season?.twins5.mercBonus ?? 0
    document.querySelector('#season_twins_6_merc_bonus').value = data.units.season?.twins6.mercBonus ?? 0
    document.querySelector('#season_twins_7_merc_bonus').value = data.units.season?.twins7.mercBonus ?? 0
    document.querySelector('#season_twins_8_merc_bonus').value = data.units.season?.twins8.mercBonus ?? 0
    document.querySelector('#common_tank_1_merc_bonus').value = data.units.common.tank1.mercBonus
    document.querySelector('#common_tank_2_merc_bonus').value = data.units.common.tank2.mercBonus
    document.querySelector('#common_mech_1_merc_bonus').value = data.units.common.mech1.mercBonus
    document.querySelector('#common_mech_2_merc_bonus').value = data.units.common.mech2.mercBonus
    document.querySelector('#common_air_1_merc_bonus').value = data.units.common.air1.mercBonus
    document.querySelector('#common_air_2_merc_bonus').value = data.units.common.air2.mercBonus
    document.querySelector('#rare_tank_1_merc_bonus').value = data.units.rare.tank1.mercBonus
    document.querySelector('#rare_tank_2_merc_bonus').value = data.units.rare.tank2.mercBonus
    document.querySelector('#rare_mech_merc_bonus').value = data.units.rare.mech1.mercBonus
    document.querySelector('#rare_air_merc_bonus').value = data.units.rare.air1.mercBonus
    document.querySelector('#epic_tank_merc_bonus').value = data.units.epic.tank1.mercBonus
    document.querySelector('#epic_mech_1_merc_bonus').value = data.units.epic.mech1.mercBonus
    document.querySelector('#epic_mech_2_merc_bonus').value = data.units.epic.mech2.mercBonus
    document.querySelector('#epic_air_merc_bonus').value = data.units.epic.air1.mercBonus
    document.querySelector('#lego_tank_merc_bonus').value = data.units.lego.tank1.mercBonus
    document.querySelector('#lego_mech_merc_bonus').value = data.units.lego.mech1.mercBonus
    document.querySelector('#lego_air_1_merc_bonus').value = data.units.lego.air1.mercBonus
    document.querySelector('#lego_air_2_merc_bonus').value = data.units.lego.air2.mercBonus

    document.querySelector('#season_twins_7_owned').checked = data.units.season?.twins7.owned ?? "false"
    document.querySelector('#season_twins_8_owned').checked = data.units.season?.twins8.owned ?? "false"
    document.querySelector('#rare_tank_1_owned').checked = data.units.rare.tank1.owned
    document.querySelector('#rare_tank_2_owned').checked = data.units.rare.tank2.owned
    document.querySelector('#rare_air_owned').checked = data.units.rare.air1.owned
    document.querySelector('#epic_tank_owned').checked = data.units.epic.tank1.owned
    document.querySelector('#epic_mech_1_owned').checked = data.units.epic.mech1.owned
    document.querySelector('#epic_mech_2_owned').checked = data.units.epic.mech2.owned
    document.querySelector('#epic_air_owned').checked = data.units.epic.air1.owned
    document.querySelector('#lego_tank_owned').checked = data.units.lego.tank1.owned
    document.querySelector('#lego_mech_owned').checked = data.units.lego.mech1.owned
    document.querySelector('#lego_air_1_owned').checked = data.units.lego.air1.owned
    document.querySelector('#lego_air_2_owned').checked = data.units.lego.air2.owned

}

const resetUpgrades = () => {
    document.querySelectorAll('.unit').forEach( u => {
        u.querySelector('[id$=flvl]').value = u.querySelector('[id$=lvl]').value;
        u.classList.remove('spent')
        updateUnitCostLine(u)
    })
    updateTotalWarpower()
}

const autoUpgrade = () => {

    let tankCores = document.querySelector('#tankCores')
    let mechCores = document.querySelector('#mechCores')
    let airCores = document.querySelector('#airCores')
    let cubes = document.querySelector('#neocubes')

    let tankCoreTotal = document.querySelector('.total_tankcore_cost')
    let mechCoreTotal = document.querySelector('.total_mechcore_cost')
    let airCoreTotal = document.querySelector('.total_aircore_cost')
    let cubeTotal = document.querySelector('.total_cube_cost')
    resetUpgrades();

    const upgrader = setInterval(() => {
        let u = document.querySelector('.most_effective:not([data-type="twins"])')

        if(!u) {
            console.log('NO BEST REGULAR TROOP')
            clearInterval(upgrader)
            return
        }

        let uType = u.dataset.type
        let ulvl = u.querySelector('[id$=flvl]')
        let v = parseInt(ulvl.value)
        ulvl.value = Math.floor((v+10)/10)*10
        updateUnitCostLine(u, true)

        if( uType === 'tank' && parseInt(tankCoreTotal.innerHTML) >= parseInt(tankCores.value) ) {
            ulvl.value = v
            for( tank of document.querySelectorAll('[data-type="tank"]')) {
                tank.classList.add('spent')
            }
        }
        if( uType === 'mech' && parseInt(mechCoreTotal.innerHTML) >= parseInt(mechCores.value) ) {
            ulvl.value = v
            for( mech of document.querySelectorAll('[data-type="mech"]')) {
                mech.classList.add('spent')
            }
        }
        if( uType === 'air' && parseInt(airCoreTotal.innerHTML) >= parseInt(airCores.value) ) {
            ulvl.value = v
            for( air of document.querySelectorAll('[data-type="air"]')) {
                air.classList.add('spent')
            }
        }

        if( parseInt(cubeTotal.innerHTML) >= parseInt(cubes.value) ) {
            clearInterval(upgrader)
            ulvl.value = v;
        }
        updateUnitCostLine(u, true)

    }, 5);

    const shouldUpgradeTwins = document.querySelector('#lvlup_twins').checked
    if( !shouldUpgradeTwins ) return

    let redCores = document.querySelector('#redCores')
    let redCoreTotal = document.querySelector('.total_redcore_cost')
    let redCubes = document.querySelector('#redCubes')
    let redCubeTotal = document.querySelector('.total_redcube_cost')

    const twinsUpgrader = setInterval(() => {
        let u = document.querySelector('.most_effective[data-type="twins"]')

        if(!u) {
            console.log('NO BEST TWIN')
            clearInterval(twinsUpgrader)
            return
        }

        let ulvl = u.querySelector('[id$=flvl]')
        let v = parseInt(ulvl.value)
        ulvl.value = v+1
        updateUnitCostLine(u, true)

        if( parseInt(redCoreTotal.innerHTML) >= parseInt(redCores.value) || parseInt(redCubeTotal.innerHTML) >= parseInt(redCubes.value) ) {
            console.log(u, redCoreTotal.innerHTML, redCores.value, ulvl.value, v)
            ulvl.value = v
            for( twin of document.querySelectorAll('[data-type="twins"')) {
                twin.classList.add('spent')
            }
        }
        updateUnitCostLine(u, true)     
        
        
    }, 1);
    

    }