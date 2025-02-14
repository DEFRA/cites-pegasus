const errorAnyEmpty = 'any.empty'

function isValidDate (day, month, year) {
  const date = new Date(year, month - 1, day)

  return Boolean(+date) &&
        date.getDate() === Number(day) &&
        date.getMonth() + 1 === Number(month) &&
        year >= 100
}

function isAfterMinDate (day, month, year) {
  const minDateYear = 1753
  const minDate = new Date(minDateYear, 0, 1)
  const date = new Date(year, month - 1, day)

  return date >= minDate
}

function isPastDate (date, allowToday = false) {
  const today = new Date().setHours(0, 0, 0, 0)
  if (allowToday) {
    return date <= today
  } else {
    return date < today
  }
}

function dateValidator (day, month, year, allowFuture, fieldName, helpers) {
  if (day === 0 && month === 0 && year === 0) {
    return helpers.error('any.invalid', { customLabel: fieldName })
  }

  const result = checkIfEmptyDateField(day, month, year, fieldName, helpers)
  if (result) {
    return result
  }

  if (!isValidDate(day, month, year)) {
    return helpers.error('any.invalid', { customLabel: fieldName })
  }

  if (!isAfterMinDate(day, month, year)) {
    return helpers.error('any.beforeMinDate', { customLabel: fieldName })
  }

  if (!allowFuture) {
    const date = new Date(year, month - 1, day)
    if (!isPastDate(date, true)) {
      return helpers.error('any.future', { customLabel: fieldName })
    }
  }

  return null
}

function checkIfEmptyDateField (day, month, year, fieldName, helpers) {
  if (areAllEmpty(day, month, year)) {
    return helpers.error(errorAnyEmpty, { customLabel: fieldName })
  }
  if (areAllEmpty(day, month)) {
    return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-day-month` })
  }
  if (areAllEmpty(day, year)) {
    return helpers.error(errorAnyEmpty, { customLabel: `${fieldName}-day-year` })
  }
  if (areAllEmpty(month, year)) {
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
  return null
}

function areAllEmpty (...args) {
  return args.every(item => {
    return !item
  })
}

function dateValidatorMaxDate (day, month, year, allowFuture, maxDate, fieldName, helpers) {
  const result = dateValidator(day, month, year, allowFuture, fieldName, helpers)

  if (result) {
    return result
  }

  const date = new Date(year, month - 1, day)
  if (date > maxDate) {
    return helpers.error('any.max', { customLabel: fieldName })
  }

  return null
}

module.exports = {
  isValidDate,
  isPastDate,
  isAfterMinDate,
  dateValidator,
  dateValidatorMaxDate
}
