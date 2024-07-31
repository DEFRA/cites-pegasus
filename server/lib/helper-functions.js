const textContent = require("../content/text-content.json")

function isChecked(data, option) {
  return !!data && data.includes(option)
}

function setLabelData(data, labelData) {
  return labelData.map((label) => {
    if (typeof label === "string" && label !== "divider") {
      return {
        value: label,
        text: label,
        checked: isChecked(data, label),
        selected: data === label
      }
    }
    if (label === "divider") {
      return { divider: "or" }
    }

    const { text, value, hint } = label
    return {
      value,
      text,
      checked: isChecked(data, value),
      selected: data === value,
      hint
    }
  })
}

function findErrorList({ details }, inputFields, errorMessages) {
  const errorCodes = inputFields.map((input) => {
    const foundErrorList = details.filter(
      ({ context: { label: valLabel, customLabel } }) => customLabel ? customLabel === input : valLabel === input
    )

    if (foundErrorList.length === 0) {
      return null
    }

    const {
      type,
      context: { label: valLabel1, customLabel: customLabel1 }
    } = foundErrorList[0]
    const label = customLabel1 ?? valLabel1
    return `error.${label}.${type}`
  })

  return errorCodes.map((err) =>
    err === null ? null : errorMessages[err] ?? err
  )
}

function getErrorList(errors, errorMessages, fields) {
  if (!errors) {
    return null
  }

  const errorList = []
  
  fields.forEach((field) => {
    const fieldError = findErrorList(errors, [field], errorMessages)[0]
    if (fieldError) {
      errorList.push({
        text: fieldError,
        href: `#${field}`
      })
    }
  })

  return errorList
}

const getDomain = (request) => {
  const protocol = request.server.info.protocol
  const host = request.server.info.host
  const port = request.server.info.port
  console.log(process)
  // Construct the full URL
  return `${protocol}://${host}:${port}`
}

const getFieldError = (errorList, href) => {
  const err = getErrorMessage(errorList, href)
  return err ? { text: err } : null
}

const getErrorMessage = (errorList, href) => {
  return errorList?.some((err) => err?.href === href)
    ? errorList.find((err) => err.href === href).text
    : null
}

const getAddressSummary = (address) => {
  const addressComponents = [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.addressLine4,
    address.postcode,
    address.countryDesc
  ].filter(Boolean)

  return addressComponents.join(', ')
}

function toPascalCase(inputString) {
  if (inputString) {
    //return inputString.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase())
    return inputString.toLowerCase().replace(/\b\w/g, match => match.toUpperCase())
  }
  return ""
}

function deleteIfExists(object, property) {
  if(Object.hasOwn(object, property)) {
       delete object[property]
  }
}

function stringToBool(string, defaultValue) {

  if(!string) {
    return defaultValue
  }

  const stringLower = string.toLowerCase()

  if(stringLower === 'true'){
    return true
  } else if (stringLower === 'false'){
    return false
  } else {
    return defaultValue
  }
}

function getCountries(countryList, selectedCountryCode) {
  const countries = [{
      text: textContent.common.countrySelectDefault,
      value: '',
      selected: false
  }]

  countries.push(...countryList.map(country => {
      return {
          text: country.name,
          value: country.code,
          selected: country.code === (selectedCountryCode || '')
      }
  }))
  
  return countries
}


module.exports = {
  isChecked,
  setLabelData,
  //   formInputObject,
  //   getPostCodeHtml,
  //   errorExtractor,
  //   getErrorMessage,
  //   getGrantValues,
  //   formatUKCurrency,
  //   itemInObject,
  //   fetchObjectItem,
  //   fetchListObjectItems,
  findErrorList,
  //   formatApplicationCode,
  //   getSbiHtml,
  getErrorList,
  getDomain,
  getFieldError,
  getErrorMessage,
  getAddressSummary,
  toPascalCase,
  deleteIfExists,
  stringToBool,
  getCountries
}
