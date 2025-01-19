const rarityMultiplier = {
    common: 0.4,
    rare: 0.6,
    epic: 0.8,
    lego: 1,
}

const updateUnitCostLine = (currentUnit, recalculate = false) => {
    const rarity = currentUnit.dataset.rarity
    const currentLevel = currentUnit.querySelector('.unit_level input').value
    const desiredLevel = currentUnit.querySelector('.unit_level input:last-of-type').value
    const coreCostResult = currentUnit.querySelector('.total_core_cost')
    const cubeCostResult = currentUnit.querySelector('.total_cube_cost')
    const currentPowerResult = currentUnit.querySelector('.current_power')
    const newPowerResult = currentUnit.querySelector('.new_power')
    const newPowerDiff = currentUnit.querySelector('.new_power_diff')
    const mercBonus = (currentUnit.querySelector('.merc_level_selector').value / 100) + 1

    const coreCost = troopsData[desiredLevel-1].totalCoreCost - troopsData[currentLevel-1].totalCoreCost
    const cubeCost = troopsData[desiredLevel-1].totalCubeCost - troopsData[currentLevel-1].totalCubeCost
    const currentPower = Math.floor(troopsData[currentLevel-1].powerBase * rarityMultiplier[rarity] * mercBonus)
    const nextPower = Math.floor(troopsData[desiredLevel-1].powerBase * rarityMultiplier[rarity] * mercBonus)
    
    coreCostResult.innerHTML = (coreCost > 0) ? coreCost : "0";
    cubeCostResult.innerHTML = (cubeCost > 0) ? cubeCost : "0";
    currentPowerResult.innerHTML = currentPower
    newPowerResult.innerHTML = nextPower
    newPowerDiff.innerHTML = (nextPower - currentPower > 0) ? `(+${nextPower - currentPower})` : '';
    

    if (recalculate) updateTotalWarpower()
}
const updateTotalWarpower = () => {
    const units = document.querySelectorAll('.troops_selector .unit:not(.premium)');
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
        if( cubePerPower === mostCubeEffectiveCost ) {
            mostCubeEffectiveUnits.push(unit)
            mostCubeEffectiveCost = cubePerPower;
        } else if ( cubePerPower < mostCubeEffectiveCost ) {
            mostCubeEffectiveUnits = [unit];
            mostCubeEffectiveCost = cubePerPower;
        }
    }
    // console.log({mostCubeEffectiveUnit, mostCubeEffectiveCost})
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
    const currentLevel = parseInt(unit.querySelector('.unit_level input').value)
    const desiredLevel = parseInt(unit.querySelector('.unit_level input:last-of-type').value)

    if(currentLevel >= desiredLevel) return 9999

    const plus10LvlCost = troopsData[desiredLevel+9].totalCubeCost - troopsData[desiredLevel-1].totalCubeCost
    const plus10LvlPower = Math.floor(troopsData[desiredLevel+9].powerBase * rarityMultiplier[rarity]) - Math.floor(troopsData[desiredLevel-1].powerBase * rarityMultiplier[rarity])
    const cubePerPower = plus10LvlCost/plus10LvlPower

    // console.log(`${rarity} ${unit.dataset.type} lvl ${desiredLevel} : ${plus10LvlPower} power for ${plus10LvlCost} cubes = ${cubePerPower} Cube-per-power`)

    return cubePerPower;
}