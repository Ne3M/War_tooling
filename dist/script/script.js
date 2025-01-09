let data;
let lastUsedProfile = window.localStorage.getItem("lastUsedProfile") || 'WAR'
let warID = `${lastUsedProfile}_${getLastMonday()}`
storage.storeName = warID;

let warList = JSON.parse(window.localStorage.getItem("LGWarList")) || []
if(!warList.includes(warID)) {
    warList.push(warID) 
    window.localStorage.setItem("LGWarList", JSON.stringify(warList)) 
}

document.addEventListener('DOMContentLoaded', async () => {
    
    init();

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
        await renderHistorySelector(e.target.value);
        displayLastReport()
    })

    // You add a profile
    document.querySelector('#profile').addEventListener('change', async (e) => {
        if(e.target.value === "addProfile") {
            const currentProfleList = JSON.parse(window.localStorage.getItem("profileList")) || []
            newProfile = window.prompt('Name your profile\nLike your current alliance name', '');
            window.localStorage.setItem("profileList", JSON.stringify([...currentProfleList, newProfile]))
            renderProfileSelector();
            document.querySelector(`#profile option[value=${newProfile}]`).selected = true
        }

        lastUsedProfile = e.target.value
        warID = `${lastUsedProfile}_${getLastMonday()}`
        storage.storeName = warID;
        window.localStorage.setItem("lastUsedProfile", lastUsedProfile)

        // Reinit All
        init()

    })

    document.querySelector('#open_modal').addEventListener('click', async (e) => {
        document.querySelector('#instruction').showModal()
    })
    document.querySelector('#close_modal').addEventListener('click', async (e) => {
        document.querySelector('#instruction').close()
    })

    // document.querySelector('#clearData').addEventListener('click', () => {
    //   window.localStorage.removeItem('LGAnalysisHistory');
    //   history = []
    //   renderHistorySelector();
    // })
    
    
    
})