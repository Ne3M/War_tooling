let data;
let warID = `WAR_${getLastMonday()}`
storage.storeName = warID;

// let currentAlliance = 'FuMiCoN'

let warList = JSON.parse(window.localStorage.getItem("LGWarList")) || []
if(!warList.includes(warID)) {
    warList.push(warID) 
    window.localStorage.setItem("LGWarList", JSON.stringify(warList)) 
}

document.addEventListener('DOMContentLoaded', async () => {
    
    document.querySelector('.current-war').innerHTML = warID;
    
    await renderHistorySelector()
    await renderAllianceSelector()
    
    // You paste the data
    document.addEventListener('paste', async (e) => {
        setTimeout(() => {
            data = document.querySelector('#data').value
            generateTable(JSON.parse(data), true)
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

    // document.querySelector('#clearData').addEventListener('click', () => {
    //   window.localStorage.removeItem('LGAnalysisHistory');
    //   history = []
    //   renderHistorySelector();
    // })
    
    displayLastReport()
    
})