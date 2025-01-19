
document.addEventListener('DOMContentLoaded', async () => {
    
    document.querySelectorAll('.unit').forEach( u => {
        updateUnitCostLine(u)
    })
    updateTotalWarpower()

    document.querySelector('.troops').addEventListener('input', (e) => {
        updateUnitCostLine(e.target.closest('.unit'), true)
    })

})