//const POSTCODE_REGEX = /^\s*[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}\s*$/i
const POSTCODE_REGEX = /^(GIR[ ]{0,}0AA)|((([ABCDEFGHIJKLMNOPRSTUWYZ][0-9][0-9]?)|(([ABCDEFGHIJKLMNOPRSTUWYZ][ABCDEFGHKLMNOPQRSTUVWXY][0-9][0-9]?)|(([ABCDEFGHIJKLMNOPRSTUWYZ][0-9][ABCDEFGHJKSTUW])|([ABCDEFGHIJKLMNOPRSTUWYZ][ABCDEFGHKLMNOPQRSTUVWXY][0-9][ABEHMNPRVWXY]))))[ ]{0,}[0-9][ABDEFGHJLNPQRSTUWXYZ]{2})+$/i 
const DELETE_POSTCODE_CHARS_REGEX = /[)(.\s-]*/g
const PHONE_REGEX = /^[0-9\{\[\(\)\}\]— +]+$/
const NAME_REGEX = /^[a-zA-Z' ,’-]+$/
const BUSINESSNAME_REGEX = /^[a-zA-Z0-9' ,’-]+$/
const NUMBER_REGEX = /^\d+$/
const TOWN_COUNTY_REGEX = /^[a-zA-Z',.&’ -]+$/
const ADDRESS_REGEX = /^[a-zA-Z0-9',.&’ -]+$/
const ALFA_REGEX = /^[a-zA-Z]+$/
const COMMENTS_REGEX = /^[a-zA-Z0-9' ,.’£$%&*=+#@\{\[\(\)\}\]\/\\\-\—]+$/


module.exports = {
  POSTCODE_REGEX,
  DELETE_POSTCODE_CHARS_REGEX,
  PHONE_REGEX,
  NAME_REGEX,
  BUSINESSNAME_REGEX,
  NUMBER_REGEX,
  TOWN_COUNTY_REGEX,
  ADDRESS_REGEX,
  ALFA_REGEX,
  COMMENTS_REGEX
}