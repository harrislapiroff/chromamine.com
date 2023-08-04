loaded = () => {
    document.querySelectorAll('[data-mute-target]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault()
            const target = document.getElementById(el.dataset.muteTarget)
            target.muted = !target.muted
            el.innerHTML = target.muted ? 'Unmute' : 'Mute'
        })
    })
}

document.addEventListener('DOMContentLoaded', loaded)