const dieselMultiplier = {
  "0": 1,
  "30": 1.2,
  "100": 1.4,
  "200": 1.7,
  "350": 2,
    "400": 1.7,
  "600": 2.3,
    "700": 2,
  "1000": 2.6,
  "1600": 2.9,
    "2000": 2.6,
  "2300": 3.3,
    "2600": 2.9,
  "3150": 3.7,
    "3200": 2.9,
  "4000": 4.1,
  "4850": 4.5,
  "5700": 5,
  "6550": 5.5,
  "7400": 6,
  "8250": 6.5,
  "9100": 7.1,
  "10000": 7.7,
  "11000": 8.3,
  "13000": 8.9,
  "15000": 9.6,
  "17000": 10.3,
  "19000": 11,
}

const init = async () => {
  warList = await storage.getItem('GlobalData', 'LGWarList', 'LGToolData') || JSON.parse(window.localStorage.getItem("LGWarList")) || []
  if(!warList.includes(warID)) {
      warList.push(warID) 
      window.localStorage.setItem("LGWarList", JSON.stringify(warList));
      storage.setItem('GlobalData', 'LGWarList', warList, 'LGToolData');
  }

  // document.querySelector('.current-war').innerHTML = warID;
  getCurrentProfileWarlist()

  await renderHistorySelector()
  await renderAllianceSelector()
  renderProfileSelector()
  displayLastReport()
}

const getCurrentProfileWarlist = () => {
  const warListSelector = document.querySelector('#previous_war_list')
  const filteredWarList = warList.filter(w => w.startsWith(lastUsedProfile)).sort()
  
  warListSelector.querySelectorAll('option').forEach(o => warListSelector.removeChild(o))

  for( war of filteredWarList ) {
    const warOption = document.createElement("option")
    warOption.appendChild(document.createTextNode(war))
    warOption.value = war
    warListSelector.appendChild(warOption);
  }

  warListSelector.querySelector(`option[value=${warID}]`).selected = true;
}

const getLastMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    const daysSinceMonday = (dayOfWeek + 6) % 7; // Calcul du décalage par rapport au lundi
    
    // Soustraction pour revenir au lundi précédent
    today.setDate(today.getDate() - daysSinceMonday);
    
    // Format JJ-MM-AA
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Mois commence à 0
    const yy = String(today.getFullYear()).slice(-2);
    
    return `${dd}-${mm}-${yy}`;
}

const getAllianceList = async () => {
    const allianceList = []
    const DBhistory = await storage.getAll(storage.storeName) || []
    DBhistory
      .filter(h => (!(h instanceof Array)))
      .forEach((h,i) => {
        if(!allianceList.includes(h.result.guild?.name)) {
          allianceList.push(h.result.guild.name)
        }
    })
    return allianceList
}

const saveHistory = (data) => {
    storage.setItem(storage.storeName, `${data.result.guild.name}_${data.result.guild.totalPowerUsed}_${data.result.guild.summary_power}`, data)
}

const renderProfileSelector = async () => {
  const profileList = await storage.getItem('GlobalData', 'profileList', 'LGToolData') || JSON.parse(window.localStorage.getItem("profileList")) || []
  const profileSelector = document.querySelector('#profile')

  profileSelector.querySelectorAll('option').forEach(o => profileSelector.removeChild(o))

  const defaultOption = document.createElement("option")
  defaultOption.appendChild(document.createTextNode(`default`))
  defaultOption.value = "WAR"
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

const renderHistorySelector = async (alliance = "") => {

    const allianceColors = await storage.getItem(storage.storeName, 'Alliances_colors') || []
    const DBhistory = await storage.getAll(storage.storeName) || []
    const historySelector = document.querySelector("#history")
    const localHistory = [...DBhistory]
      .filter(h => (!(h instanceof Array)))
      .filter(h => (alliance === "" || alliance === h.result.guild.name))
      .sort((a,b) => (a.result.analysisDate < b.result.analysisDate)? -1 : 1)

    historySelector.querySelectorAll('option:not(:first-child)').forEach(o => historySelector.removeChild(o))

    localHistory.forEach(h => {
      const option = document.createElement("option")
      const date =  new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(h.result.analysisDate))
      const text = document.createTextNode(`${date} - ${h.result.guild.name} - ${h.result.guild.totalPowerUsed} troops used`)
      option.style.background = allianceColors.find(ally=>ally.name === h.result.guild.name)?.color
      option.appendChild(text);
      option.value=`${h.result.guild.name}_${h.result.guild.totalPowerUsed}_${h.result.guild.summary_power}`;
      historySelector.appendChild(option);
    })

    historySelector.querySelector(':last-child').selected = true
}

const renderAllianceSelector = async () => {
    const allianceList = await getAllianceList()
    const allianceColors = await storage.getItem(storage.storeName, 'Alliances_colors') || []
    const allianceSelector = document.querySelector("#alliance")

    allianceSelector.querySelectorAll('option:not(:first-child)').forEach(o => allianceSelector.removeChild(o))

    allianceList.forEach((a,i) => {
      const option = document.createElement("option")
      const text = document.createTextNode(`${a}`)
      option.style.background = allianceColors.find(ally=>ally.name === a)?.color
      option.appendChild(text);
      option.value=a;
      allianceSelector.appendChild(option);
    })
}

const generateTable = async (data, shouldSave=false) => {
    const allianceColors = await storage.getItem(storage.storeName, 'Alliances_colors') || []

    let html = `<strong style="background: ${allianceColors.find(ally=>ally.name === data.result.guild.name)?.color}">${data.result.guild.name}</strong>
    <table>
      <tr>
        <th class=''>Player</th>
        <th class='diesel'> Diesel used</th>
        <th class='deployed'> Deployed power</th>
        <th class='power'> Raw power</th>
       </tr>
     `
    let totalDeployed = 0;
    let totalDieselDeployed = 0;
    let totalUndeployed = 0;
    let totalLocked = 0;
    let totalInactive = 0;
    data.result.members
      .sort((a, b) => {
        if (a.summary_power !== b.summary_power) {
          return a.summary_power - b.summary_power; 
        } 
        return a.remaining_power - b.remaining_power; 
      })
      .reverse()
      .forEach(m => {

        data.result.analysisDate = data.result.analysisDate || new Date().getTime();

        const inactivityInHour = Math.floor((new Date(data.result.analysisDate)-new Date(m.last_visit)+(new Date().getTimezoneOffset()*(60*1000)))/1000/60/60)
        const isActive = inactivityInHour < 24;
        const isLocked = new Date(m.locked_gw_till).getTime() > new Date(data.result.analysisDate).getTime()
        
        let effectiveDiesel = m.spent_elixir
        if( !(m.spent_elixir in dieselMultiplier) && m.spent_elixir != 0) {
          for(dieselCost in dieselMultiplier)  {
            if( m.spent_elixir > parseInt(dieselCost) ) effectiveDiesel = dieselCost
          }
        }
        const partialDeploy = (1.03 * m.summary_power / dieselMultiplier[`${effectiveDiesel}`]) < m.remaining_power && m.summary_power > 0

        totalUndeployed += (m.remaining_power > m.summary_power)? m.remaining_power - m.summary_power : 0;
        totalDeployed += m.summary_power;
        totalInactive += (isActive) ? 0 : m.remaining_power;
        totalDieselDeployed += m.spent_elixir;
        totalLocked += isLocked ? m.remaining_power : 0;

        data.result.guild.totalPowerUsed = totalDeployed;
      
        html += `<tr>
          <td class='player ${isActive?'':'inactive'}'>
            ${m.NameBit.Name}${isActive?'':' (i)'}
            ${isLocked ? '<span title="'+m.locked_gw_till+'">🔒</span>':''}
          </td> 
          <td class='diesel'> ${m.spent_elixir.toLocaleString('es-ES')}</td>
          <td class='deployed'> ${m.summary_power.toLocaleString('es-ES')}</td>
          <td class='power ${(partialDeploy)?'⚠️':''}'>${m.remaining_power.toLocaleString('es-ES')}</td>
        </tr>`
    })
    html += `<tr>
    <td class='player'>TOTAL</td>
    <td>${totalDieselDeployed.toLocaleString('es-ES')}</td>
    <td>${totalDeployed.toLocaleString('es-ES')}</td>
    <td>${data.result.guild.summary_power.toLocaleString('es-ES')}</td>
    </tr>
    <tr>
      <td class='player'>UNDEPLOYED TROOPS</td>
      <td colspan="3">${(totalUndeployed - totalLocked).toLocaleString('es-ES')}</td>
    </tr>
    <tr>
      <td class='player'>LOCKED TROOPS</td>
      <td colspan="3">${totalLocked.toLocaleString('es-ES')}</td>
    </tr>
    <tr>
      <td class='player'>
      INACTIVE TROOPS
      <span title="This troops are not deducted from undeployed troops">
          <svg viewBox="0 0 24 24" width="20px" height="20px" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.75C12.4142 17.75 12.75 17.4142 12.75 17V11C12.75 10.5858 12.4142 10.25 12 10.25C11.5858 10.25 11.25 10.5858 11.25 11V17C11.25 17.4142 11.5858 17.75 12 17.75Z" fill="#1C274C"></path> <path d="M12 7C12.5523 7 13 7.44772 13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75Z" fill="#1C274C"></path>
          </svg>
        </span>
      </td>
      <td colspan="3">
        ${totalInactive.toLocaleString('es-ES')} 
        </td>
    </tr>`
    html += "</table>"
    html += "</table>"
    
    document.querySelector('.result').innerHTML = html;
    
    if(!shouldSave) return;
    saveHistory(data)
    if(currentAllianceFilter === data.result.guild.name) {
      renderHistorySelector(currentAllianceFilter)
    } else {
      document.querySelector('#alliance :first-child').selected = true
      renderHistorySelector()
    }
}

const displayLastReport = () => {
    storage.getItem(storage.storeName, document.querySelector('#history option:last-child').value).then(r => {
        if(r) {generateTable(r)} else {  document.querySelector('.result').innerHTML=""}
    })
}


const colors = ["#66fefe", "#44b2e0", "#403dfd", "#ed40f1", "#d31616", "#fcbc82", "#ecfe01", "#986633", "#9833fe", "#2b802b"]
const setAllianceColors = (data) => {
  const allianceColors = []
  data.result.guilds.forEach((a,i) => {
    allianceColors.push({
      name: a.guild_name, 
      color: colors[i]
    })
  })
  storage.setItem(storage.storeName, `Alliances_colors`, allianceColors)
}

const detectDataType = (data) => {
  if (data.result.guilds) setAllianceColors(data)
  if (data.result.members) generateTable(data, true)
}