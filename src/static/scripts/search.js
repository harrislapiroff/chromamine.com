import { PagefindUI } from '@pagefind/default-ui'

window.addEventListener('DOMContentLoaded', (event) => {
    new PagefindUI({ element: "#search", showSubResults: true })
})
