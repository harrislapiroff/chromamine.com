export default class FlickrDataJSON {
    data() {
        return {
            permalink: '/data/flickr.json',
        }
    }

    render({ flickr }) {
        return JSON.stringify(flickr.photos)
    }
}
