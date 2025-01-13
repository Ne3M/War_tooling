let data;
let warList;
let warID
let currentAllianceFilter = ""
let lastUsedProfile

const startup = async () => {
    lastUsedProfile = await storage.getItem('GlobalData', 'lastUsedProfile', 'LGToolData') || window.localStorage.getItem("lastUsedProfile") || 'WAR';
    warID = `${lastUsedProfile}_${getLastMonday()}`
    storage.storeName = warID;
}


document.addEventListener('DOMContentLoaded', async () => {
    
    await startup();
    await init();

    // You paste the data
    document.addEventListener('paste', async (e) => {
        setTimeout(() => {
            data = document.querySelector('#data').value
            detectDataType(JSON.parse(data))
            document.querySelector('#data').value = ''
            document.querySelector('#textarea_container').classList.add('pasted')
            setTimeout(() => {
                document.querySelector('#textarea_container').classList.remove('pasted')
            }, 1000)
        },0)
    })

    // You select another report on the list
    document.querySelector('#history').addEventListener('change', async (e) => {
        const key = e.target.value
        const data = await storage.getItem(storage.storeName, key)
        generateTable(data)
    })

    // You filter reports by alliance
    document.querySelector('#alliance').addEventListener('change', async (e) => {
        currentAllianceFilter = e.target.value
        await renderHistorySelector(currentAllianceFilter);
        displayLastReport()
    })

    // You add/select a profile
    document.querySelector('#profile').addEventListener('change', async (e) => {
        if(e.target.value === "addProfile") {
            const currentProfleList = await storage.getItem('GlobalData', 'profileList', 'LGToolData') || JSON.parse(window.localStorage.getItem("profileList")) || [];
            newProfile = window.prompt('Name your profile\nLike your current alliance name', '');
            storage.setItem('GlobalData', 'profileList', [...currentProfleList, newProfile], 'LGToolData')
            await renderProfileSelector();
            document.querySelector(`#profile option[value=${newProfile}]`).selected = true
        }

        lastUsedProfile = e.target.value
        warID = `${lastUsedProfile}_${getLastMonday()}`
        storage.storeName = warID;
        // window.localStorage.setItem("lastUsedProfile", lastUsedProfile)
        storage.setItem('GlobalData', 'lastUsedProfile', lastUsedProfile, 'LGToolData')

        // Reinit All
        init()

    })

    // You select a previous War
    document.querySelector('#previous_war_list').addEventListener('change', async (e) => {
        storage.storeName = e.target.value;
        warID = e.target.value

        // Make textarea readonly for closed War 
        const dataTextarea = document.querySelector('#data')
        if( warID.includes( getLastMonday() ) ) {
            dataTextarea.placeholder = "Paste here the get_member request response"
            dataTextarea.disabled = false
        } else {
            dataTextarea.placeholder = "This war is over, impossible to add new reports"
            dataTextarea.disabled = true
        }

        // Reinit All
        init()
    })

    // Open/Close feature listing
    document.querySelector('#open_modal').addEventListener('click', async (e) => {
        document.querySelector('#instruction').showModal()
    })
    document.querySelector('#close_modal').addEventListener('click', async (e) => {
        document.querySelector('#instruction').close()
    })
  
    
})