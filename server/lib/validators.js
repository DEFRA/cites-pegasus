const { COMMENTS_REGEX } = require("../lib//regex-validation")


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
    var today = new Date().setHours(0, 0, 0, 0)
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
    
    if (!day && !month && !year) {
        return helpers.error("any.empty", { customLabel: fieldName })
    }
    if (!day && !month) {
        return helpers.error("any.empty", { customLabel: `${fieldName}-day-month` })
    }
    if (!day && !year) {
        return helpers.error("any.empty", { customLabel: `${fieldName}-day-year` })
    }
    if (!month && !year) {
        return helpers.error("any.empty", { customLabel: `${fieldName}-month-year` })
    }
    if (!day) {
        return helpers.error("any.empty", { customLabel: `${fieldName}-day` })
    }
    if (!month) {
        return helpers.error("any.empty", { customLabel: `${fieldName}-month` })
    }
    if (!year) {
        return helpers.error("any.empty", { customLabel: `${fieldName}-year` })
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


function textAreaMinMaxValidator(value, minLength, maxLength, fieldName, helpers) {
    const modifiedValue = value.replace(/\r/g, '');
  
    if (modifiedValue.length < minLength ) {
      return helpers.error('string.min', { customLabel: fieldName});
    }

    if (modifiedValue.length > maxLength) {
        return helpers.error('string.max', { customLabel: fieldName});
      }
  
    return modifiedValue;
  }

module.exports = {
    isValidDate,
    isPastDate,
    isAfterMinDate,
    dateValidator,
    textAreaMinMaxValidator
}