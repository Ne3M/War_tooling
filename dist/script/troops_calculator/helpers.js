const rarityMultiplier = {
    common: 1,
    rare: 1.5,
    epic: 2,
    lego: 2.5,
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
    

    for(let unit of units){
        unit.classList.remove('most_effective');
        currentWarPower += parseInt(unit.querySelector('.current_power').innerHTML || 0)
        futureWarPower += parseInt(unit.querySelector('.new_power').innerHTML || 0)
        if(unit.dataset.type === "tank") tankCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML || 0)
        if(unit.dataset.type === "mech") mechCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML || 0)
        if(unit.dataset.type === "air") airCoreCost += parseInt(unit.querySelector('.total_core_cost').innerHTML || 0)
        cubeCost += parseInt(unit.querySelector('.total_cube_cost').innerHTML || 0);

        document.querySelector('.warpower .current_power').innerHTML = currentWarPower;
        document.querySelector('.warpower .new_power').innerHTML = futureWarPower;
        document.querySelector('.warpower .new_power_diff').innerHTML = (futureWarPower - currentWarPower > 0) ? `(+${futureWarPower - currentWarPower})` : '';;
        document.querySelector('.warpower .upgrade_costs .total_tankcore_cost').innerHTML = tankCoreCost;
        document.querySelector('.warpower .upgrade_costs .total_mechcore_cost').innerHTML = mechCoreCost;
        document.querySelector('.warpower .upgrade_costs .total_aircore_cost').innerHTML = airCoreCost;
        document.querySelector('.warpower .upgrade_costs .total_cube_cost').innerHTML = cubeCost;
    }

    getMostEffectiveUnit()
    
}

const getMostEffectiveUnit = () => {

    const units = document.querySelectorAll('.troops_selector .unit:not(.premium), .troops_selector .unit:has(input:checked)');
    let mostEffectiveUnits = [];
    let mostEffectiveCost = 9999;

    for(let unit of units){
        unit.classList.remove('most_effective');
        if(unit.classList.contains('spent')) continue 

        const resourcesPerPower = getResourcesPerPower(unit)
        if(resourcesPerPower < 9999) {
            if( resourcesPerPower === mostEffectiveCost ) {
                mostEffectiveUnits.push(unit)
                mostEffectiveCost = resourcesPerPower;
            } else if ( resourcesPerPower < mostEffectiveCost ) {
                mostEffectiveUnits = [unit];
                mostEffectiveCost = resourcesPerPower;
            }
        }
    }
    // console.log({mostEffectiveUnits, mostEffectiveCost})
    for( let mostEffectiveUnit of mostEffectiveUnits) {
        mostEffectiveUnit.classList.add('most_effective')
    }

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

    const plus10LvlPower = Math.floor(troopsData[nextTen].powerBase * rarityMultiplier[rarity]) - Math.floor(troopsData[currentTen].powerBase * rarityMultiplier[rarity])
    let plus10LvlCost = troopsData[nextTen].totalCubeCost - troopsData[currentTen].totalCubeCost
    
    if(useCorePriority) {
        plus10LvlCost = troopsData[nextTen].totalCoreCost - troopsData[currentTen].totalCoreCost
    }

    const resourcesPerPower = plus10LvlCost/plus10LvlPower

    console.log(`${rarity.toUpperCase()} ${unit.dataset.type} lvl ${desiredLevel} \n${plus10LvlPower} power for ${plus10LvlCost} \nCost = ${Math.round(resourcesPerPower)} ${useCorePriority? 'Core':'Cube'} per power`)

    return resourcesPerPower;
}

const getDataFromHTML = () => {
    return {
        resources: {
            tankcore: parseInt(document.querySelector('#tankCores').value),
            mechCore: parseInt(document.querySelector('#mechCores').value),
            airCore: parseInt(document.querySelector('#airCores').value),
            neoCube: parseInt(document.querySelector('#neocubes').value),
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
    console.log(`LOAD ${lastUsedProfile} data :`, data)

    if (!data) return

    document.querySelector('#tankCores').value = data.resources.tankcore
    document.querySelector('#mechCores').value = data.resources.mechCore
    document.querySelector('#airCores').value = data.resources.airCore
    document.querySelector('#neocubes').value = data.resources.neoCube

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

const resetUpgrades = () => {
    document.querySelectorAll('.unit').forEach( u => {
        u.querySelector('[id$=flvl]').value = u.querySelector('[id$=lvl]').value;
        updateUnitCostLine(u)
    })
    updateTotalWarpower()
}

const autoUpgrade = () => {
    let stillHasResources = true;

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
        let u = document.querySelector('.most_effective')

        if(!u) {
            clearInterval(upgrader)
            return
        }

        let uType = u.dataset.type
        let ulvl = document.querySelector('.most_effective [id$=flvl]')
        let v = parseInt(ulvl.value)
        ulvl.value = Math.floor((v+10)/10)*10
        updateUnitCostLine(u, true)

        if( uType === 'tank' && parseInt(tankCoreTotal.innerHTML) >= parseInt(tankCores.value) ) {
            ulvl.value = v
            for( tank of document.querySelectorAll('[data-type="tank"')) {
                tank.classList.add('spent')
            }
        }
        if( uType === 'mech' && parseInt(mechCoreTotal.innerHTML) >= parseInt(mechCores.value) ) {
            ulvl.value = v
            for( mech of document.querySelectorAll('[data-type="mech"')) {
                mech.classList.add('spent')
            }
        }
        if( uType === 'air' && parseInt(airCoreTotal.innerHTML) >= parseInt(airCores.value) ) {
            ulvl.value = v
            for( air of document.querySelectorAll('[data-type="air"')) {
                air.classList.add('spent')
            }
        }

        updateUnitCostLine(u, true)

        if(
            (
                ( parseInt(tankCoreTotal.innerHTML) >= parseInt(tankCores.value) ) 
                && 
                ( parseInt(mechCoreTotal.innerHTML) >= parseInt(mechCores.value) )  
                &&
                ( parseInt(airCoreTotal.innerHTML) >= parseInt(airCores.value) )
            )
            ||
            ( parseInt(cubeTotal.innerHTML) >= parseInt(cubes.value) ) 
        ) {
            stillHasResources = false
        }

        if( !stillHasResources ) {
            clearInterval(upgrader)
            ulvl.value = v;
            updateUnitCostLine(u, true)
        }
    }, 5);


}