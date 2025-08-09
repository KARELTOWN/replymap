import moment from "moment"

export const formatTimestampToDate = (data) => {
    if (data) {
        return moment(data).format('DD-MM-YYYY HH:mm:ss')
    }
    return ''
}