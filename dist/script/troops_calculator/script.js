let lastUsedProfile

document.addEventListener('DOMContentLoaded', async () => {
    
    lastUsedProfile = await storage.getItem('TroopsData', 'lastUsedProfile', 'LGTroopsCalculator') || 'main';
    
    await init()

    document.querySelector('.troops_selector').addEventListener('input', async (e) => {
        updateUnitCostLine(e.target.closest('.unit'), true)
        await saveTroops()
    })
    document.querySelector('.ressources').addEventListener('input', async (e) => {
        await saveTroops()
    })
    
    // You add/select a profile
    document.querySelector('#profile').addEventListener('change', async (e) => {
        lastUsedProfile = e.target.value
        
        if(e.target.value === "addProfile") {
            const currentProfleList = await storage.getItem('TroopsData', 'profileList', 'LGTroopsCalculator') || [];
            
            newProfile = window.prompt('Name your account', '');
            if(newProfile === null) return
            
            storage.setItem('TroopsData', 'profileList', [...currentProfleList, newProfile], 'LGTroopsCalculator')
            await renderProfileSelector();
            document.querySelector(`#profile option[value=${newProfile}]`).selected = true
            await setNewProfile()
        }

        lastUsedProfile = e.target.value
        storage.setItem('TroopsData', `lastUsedProfile`, lastUsedProfile, 'LGTroopsCalculator')

        // Reinit All
        await loadTroops()
        document.querySelectorAll('.unit').forEach( u => {
            updateUnitCostLine(u)
        })
        updateTotalWarpower()

    })

    //reset 
    document.querySelector('#reset').addEventListener('click', () => resetUpgrades())
    document.querySelector('#auto').addEventListener('click', () => autoUpgrade())

})