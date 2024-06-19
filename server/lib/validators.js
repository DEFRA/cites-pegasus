
const errorAnyEmpty = 'any.empty'
const errorAnyNotEmpty = 'any.notEmpty'

function isValidDate(day, month, year) {
    const date = new Date(year, month - 1, day)

    return Boolean(+date)
        && date.getDate() == day
        && date.getMonth() + 1 == month
        && year >= 100;
}

function isAfterMinDate(day, month, year) {
    const minDate = new Date(1753, 0, 1)
    const date = new Date(year, month - 1, day)

    return date >= minDate
}

function isPastDate(date, allowToday = false) {
    const today = new Date().setHours(0, 0, 0, 0)
    if (allowToday) {
        return date <= today
    } else {
        return date < today
    }
}

function dateValidator(day, month, year, allowFuture, fieldName, helpers) {

    if (day === 0 && month === 0 && year === 0) {
        return helpers.error("any.invalid", { customLabel: fieldName })
    }

    const result = checkIfEmptyDateField(day, month, year, fieldName, helpers)
    if (result){
        return result
    }

    if (!isValidDate(day, month, year)) {
        return helpers.error("any.invalid", { customLabel: fieldName })
    }

    if (!isAfterMinDate(day, month, year)) {
        return helpers.error('any.beforeMinDate', { customLabel: fieldName });
    }

    if (!allowFuture) {
        const date = new Date(year, month - 1, day)
        if (!isPastDate(date, true)) {
            return helpers.error("any.future", { customLabel: fieldName })
        }
    }

    return null
}

function checkIfEmptyDateField(day, month, year, fieldName, helpers) {
    if (!day && !month && !year) {
        return helpers.error(errorAnyEmpty, { customLabel: fieldName })
    }
    if (!day && !month) {
        return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-day-month` })
    }
    if (!day && !year) {
        return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-day-year` })
    }
    if (!month && !year) {
        return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-month-year` })
    }
    if (!day) {
        return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-day` })
    }
    if (!month) {
        return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-month` })
    }
    if (!year) {
        return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-year` })
    }
}

function dateValidatorMaxDate(day, month, year, allowFuture, maxDate, fieldName, helpers) {
    const result = dateValidator(day, month, year, allowFuture, fieldName, helpers)

    if (result) {
        return result
    }

    const date = new Date(year, month - 1, day)
    if (date > maxDate) {
        return helpers.error("any.max", { customLabel: fieldName })
    }

    return null
}

function emptyDateValidator(day, month, year, fieldName, helpers) {

    if (day && month && year) {
        return helpers.error(errorAnyNotEmpty, { customLabel: fieldName })
    }
    if (day && month) {
        return helpers.error(errorAnyNotEmpty, { customLabel: `${fieldName}-day-month` })
    }
    if (day && year) {
        return helpers.error(errorAnyNotEmpty, { customLabel: `${fieldName}-day-year` })
    }
    if (month && year) {
        return helpers.error(errorAnyNotEmpty, { customLabel: `${fieldName}-month-year` })
    }
    if (day) {
        return helpers.error(errorAnyNotEmpty, { customLabel: `${fieldName}-day` })
    }
    if (month) {
        return helpers.error(errorAnyNotEmpty, { customLabel: `${fieldName}-month` })
    }
    if (year) {
        return helpers.error(errorAnyNotEmpty, { customLabel: `${fieldName}-year` })
    }

    return null
}

module.exports = {
    isValidDate,
    isPastDate,
    isAfterMinDate,
    dateValidator,
    dateValidatorMaxDate,
    emptyDateValidator
}