//const POSTCODE_REGEX = /^\s*[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}\s*$/i
const POSTCODE_REGEX = /^(GIR[ ]{0,}0AA)|((([ABCDEFGHIJKLMNOPRSTUWYZ][0-9][0-9]?)|(([ABCDEFGHIJKLMNOPRSTUWYZ][ABCDEFGHKLMNOPQRSTUVWXY][0-9][0-9]?)|(([ABCDEFGHIJKLMNOPRSTUWYZ][0-9][ABCDEFGHJKSTUW])|([ABCDEFGHIJKLMNOPRSTUWYZ][ABCDEFGHKLMNOPQRSTUVWXY][0-9][ABEHMNPRVWXY]))))[ ]{0,}[0-9][ABDEFGHJLNPQRSTUWXYZ]{2})+$/i 
const DELETE_POSTCODE_CHARS_REGEX = /[)(.\s-]*/g
const PHONE_REGEX = /^[0-9\{\[\(\)\}\]— +]+$/
const NAME_REGEX = /^[a-zA-Z' ,’-]+$/
const BUSINESSNAME_REGEX = /^[a-zA-Z' ,.&’-]+$/
const NUMBER_REGEX = /^\d+$/
const TOWN_COUNTY_REGEX = /^[a-zA-Z',.&’ -]+$/
const ADDRESS_REGEX = /^[a-zA-Z0-9',.&’ -]+$/
const ALPHA_REGEX = /^[a-zA-Z]+$/
const COMMENTS_REGEX = /^[a-zA-Z0-9' ,.’£$%&*=+#@\{\[\(\)\}\]\/\\\-\—\r\n]+$/

// const DATE_REGEX = /^(((0[1-9]|1[0-9]|2[0-8])[\/](0[1-9]|1[012]))|((29|30|31)[\/](0[13578]|1[02]))|((29|30)[\/](0[4,6,9]|11)))[\/](19|[2-9][0-9])\d\d$)|(^29[\/]02[\/](19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)+$/


module.exports = {
  POSTCODE_REGEX,
  DELETE_POSTCODE_CHARS_REGEX,
  PHONE_REGEX,
  NAME_REGEX,
  BUSINESSNAME_REGEX,
  NUMBER_REGEX,
  TOWN_COUNTY_REGEX,
  ADDRESS_REGEX,
  ALPHA_REGEX,
  COMMENTS_REGEX,
}