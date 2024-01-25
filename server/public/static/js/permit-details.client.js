window.onload = function () {

  const checkboxIsCountryOfOriginNotKnown = document.getElementById('isCountryOfOriginNotKnown')

  checkboxIsCountryOfOriginNotKnown.addEventListener('change', function () {
    if (checkboxIsCountryOfOriginNotKnown.checked) {
      document.getElementById('countryOfOrigin').value = ''
      document.getElementById('countryOfOriginPermitNumber').value = ''
      document.getElementById('countryOfOriginPermitIssueDate-day').value = ''
      document.getElementById('countryOfOriginPermitIssueDate-month').value = ''
      document.getElementById('countryOfOriginPermitIssueDate-year').value = ''
    }
  })

  const checkboxIsExportOrReexportSameAsCountryOfOrigin = document.getElementById('isExportOrReexportSameAsCountryOfOrigin')

  checkboxIsExportOrReexportSameAsCountryOfOrigin.addEventListener('change', function () {
    if (checkboxIsExportOrReexportSameAsCountryOfOrigin.checked) {
      document.getElementById('exportOrReexportCountry').value = document.getElementById('countryOfOrigin').value
      document.getElementById('exportOrReexportPermitNumber').value = document.getElementById('countryOfOriginPermitNumber').value
      document.getElementById('exportOrReexportPermitIssueDate-day').value = document.getElementById('countryOfOriginPermitIssueDate-day').value 
      document.getElementById('exportOrReexportPermitIssueDate-month').value = document.getElementById('countryOfOriginPermitIssueDate-month').value
      document.getElementById('exportOrReexportPermitIssueDate-year').value = document.getElementById('countryOfOriginPermitIssueDate-year').value
    }
  })
}

