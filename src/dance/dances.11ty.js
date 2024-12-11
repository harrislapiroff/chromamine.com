export default class DanceDataPage {
    data() {
        return {
            permalink: '/dance/data.json',
        }
    }

    render(data) {
        console.log(data.collections.danceEvents)
        const outputData = data.collections.danceEvents.map((event) => ({
            name: event.data.name,
            date: event.data.date,
            date_end: event.data.date_end,
            tzid: event.data.tzid,
            band: event.data.band,
            city: event.data.city,
            program: event.data.program,
        }))
        return JSON.stringify(outputData)
    }
}
