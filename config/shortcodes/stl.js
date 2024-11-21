export default function (file_path, alt) {
    return `
        <div
            class="js-stl-viewer"
            data-src="${file_path}"
            data-alt="${alt}"
        >
            [Javascript required to view 3D model]
        </div>
    `
}
