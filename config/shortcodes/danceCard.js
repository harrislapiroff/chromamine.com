const danceCard = (danceCollection, title) => {
    const dance =  danceCollection.find(d => d.title === title)
    const sections = Object.entries(dance.choreo)
    const output = `<div class="dance-card">
        <header class="dance-header">
            <div class="dance-title">${dance.title}</div>
            <div class="dance-author">${dance.author}</div>
            <div class="dance-formation">${dance.formation}</div>
        </header>
        <div class="dance-choreo">
            ${sections.map(([k, v]) => `
                <div class="dance-section">
                    <div class="dance-section-label">
                        ${k.toUpperCase()}
                    </div>
                    <div class="dance-section-lines">
                        ${v.map(l => `${l}`).join('<br />')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`.replace(/([\n\r]|[\s]{4})/g, '')
    return output
}

module.exports = danceCard
