import moment from "moment"

export const formatTimestampToDate = (data:any) => {
    if (data) {
        return moment(data).format('DD-MM-YYYY HH:mm:ss')
    }
    return ''
}