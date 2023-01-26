function isValidDate(day, month, year) {
    const date = new Date(year, month - 1, day)

    return Boolean(+date)
        && date.getDate() == day
        && date.getMonth() + 1 == month
        && year >= 100;
}

function isPastDate(date, allowToday = false) {
    var today = new Date().setHours(0, 0, 0, 0)
    if(allowToday){
        return date <= today
    } else {
        return date < today
    }
}

module.exports = {
    isValidDate,
    isPastDate
}