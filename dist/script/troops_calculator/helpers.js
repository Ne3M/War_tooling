const rarityMultiplier = {
    common: 0.4,
    rare: 0.6,
    epic: 0.8,
    lego: 1,
}

const init = async () => {
    await loadTroops()
    document.querySelectorAll('.unit').forEach( u => {
        updateUnitCostLine(u)
    })
    updateTotalWarpower()
    renderProfileSelector()
}

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

    const coreCost = (desiredLevel == 0)? 0 : troopsData[desiredLevel-1].totalCoreCost - troopsData[currentLevel-1].totalCoreCost
    const cubeCost = (desiredLevel == 0)? 0 : troopsData[desiredLevel-1].totalCubeCost - troopsData[currentLevel-1].totalCubeCost
    const currentPower = (currentLevel == 0)? 0 : Math.floor(troopsData[currentLevel-1].powerBase * rarityMultiplier[rarity] * mercBonus)
    const nextPower = (desiredLevel == 0)? 0 : Math.floor(troopsData[desiredLevel-1].powerBase * rarityMultiplier[rarity] * mercBonus)
    
    coreCostResult.innerHTML = (coreCost > 0) ? coreCost : "0";
    cubeCostResult.innerHTML = (cubeCost > 0) ? cubeCost : "0";
    currentPowerResult.innerHTML = currentPower
    newPowerResult.innerHTML = nextPower
    newPowerDiff.innerHTML = (nextPower - currentPower > 0) ? `(+${nextPower - currentPower})` : '';
    
    if (recalculate) updateTotalWarpower()
}

const updateTotalWarpower = () => {
    const units = document.querySelectorAll('.troops_selector .unit:not(.premium), .troops_selector .unit:has(input:checked)');
    let currentWarPower = 0;
    let futureWarPower = 0;
    let tankCoreCost = 0;
    let mechCoreCost = 0;
    let airCoreCost = 0;
    let cubeCost = 0;
    let mostCubeEffectiveUnits = [];
    let mostCubeEffectiveCost = 9999;

    for(let unit of units){
        unit.classList.remove('most_effective')
        currentWarPower += parseInt(unit.querySelector('.current_power').innerHTML)
        futureWarPower += parseInt(unit.querySelector('.new_power').innerHTML)
        if(unit.dataset.type === "tank") tankCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML)
        if(unit.dataset.type === "mech") mechCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML)
        if(unit.dataset.type === "air") airCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML)
        cubeCost += parseInt(unit.querySelector('.total_cube_cost').innerHTML);
        
        const cubePerPower = getCubePerPower(unit)
        if(cubePerPower < 9999) {
            if( cubePerPower === mostCubeEffectiveCost ) {
                mostCubeEffectiveUnits.push(unit)
                mostCubeEffectiveCost = cubePerPower;
            } else if ( cubePerPower < mostCubeEffectiveCost ) {
                mostCubeEffectiveUnits = [unit];
                mostCubeEffectiveCost = cubePerPower;
            }
        }
    }
    // console.log({mostCubeEffectiveUnits, mostCubeEffectiveCost})
    for( let mostCubeEffectiveUnit of mostCubeEffectiveUnits) {
        mostCubeEffectiveUnit.classList.add('most_effective')
    }
    
    document.querySelector('.warpower .current_power').innerHTML = currentWarPower;
    document.querySelector('.warpower .new_power').innerHTML = futureWarPower;
    document.querySelector('.warpower .new_power_diff').innerHTML = (futureWarPower - currentWarPower > 0) ? `(+${futureWarPower - currentWarPower})` : '';;
    document.querySelector('.warpower .upgrade_costs .total_tankcore_cost').innerHTML = tankCoreCost;
    document.querySelector('.warpower .upgrade_costs .total_mechcore_cost').innerHTML = mechCoreCost;
    document.querySelector('.warpower .upgrade_costs .total_aircore_cost').innerHTML = airCoreCost;
    document.querySelector('.warpower .upgrade_costs .total_cube_cost').innerHTML = cubeCost;
}

const getCubePerPower = (unit) => {
    
    const rarity = unit.dataset.rarity
    // const currentLevel = parseInt(unit.querySelector('.unit_level input').value)
    const desiredLevel = parseInt(unit.querySelector('.unit_level input:last-of-type').value)

    if(desiredLevel <= 0) return 9999
    if(desiredLevel >= troopsData.length - 9) return 9999

    const plus10LvlCost = troopsData[desiredLevel+9].totalCubeCost - troopsData[desiredLevel-1].totalCubeCost
    const plus10LvlPower = Math.floor(troopsData[desiredLevel+9].powerBase * rarityMultiplier[rarity]) - Math.floor(troopsData[desiredLevel-1].powerBase * rarityMultiplier[rarity])
    const cubePerPower = plus10LvlCost/plus10LvlPower

    //console.log(`${rarity} ${unit.dataset.type} lvl ${desiredLevel} : ${plus10LvlPower} power for ${plus10LvlCost} cubes = ${cubePerPower} Cube-per-power`)

    return cubePerPower;
}

const getDataFromHTML = () => {
    return {
        resources: {
            tankcore: parseInt(document.querySelector('#tankCores').value),
            mechCore: parseInt(document.querySelector('#mechCore').value),
            airCore: parseInt(document.querySelector('#airCores').value),
            neoCube: parseInt(document.querySelector('#neocube').value),
        },
        units: {
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
    console.log(data)
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
    console.log(data)

    if (!data) return

    document.querySelector('#tankCores').value = data.resources.tankcore
    document.querySelector('#mechCore').value = data.resources.mechCore
    document.querySelector('#airCores').value = data.resources.airCore
    document.querySelector('#neocube').value = data.resources.neoCube

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