window.onload = function () {
  // Find the "Copy from Country of Origin" button
  const copyButton = document.querySelector('[aria-label="Copy from Country of Origin"]')

  // Add a click event listener to the button
  copyButton.addEventListener('click', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault()

    const countryOfOrigin = document.getElementById('countryOfOrigin').value
    const countryOfOriginPermitNumber = document.getElementById('countryOfOriginPermitNumber').value
    const countryOfOriginPermitIssueDateDay = document.getElementById('countryOfOriginPermitIssueDate-day').value
    const countryOfOriginPermitIssueDateMonth = document.getElementById('countryOfOriginPermitIssueDate-month').value
    const countryOfOriginPermitIssueDateYear = document.getElementById('countryOfOriginPermitIssueDate-year').value

    document.getElementById('exportOrReexportCountry').value = countryOfOrigin
    document.getElementById('exportOrReexportPermitNumber').value = countryOfOriginPermitNumber
    document.getElementById('exportOrReexportPermitIssueDate-day').value = countryOfOriginPermitIssueDateDay
    document.getElementById('exportOrReexportPermitIssueDate-month').value = countryOfOriginPermitIssueDateMonth
    document.getElementById('exportOrReexportPermitIssueDate-year').value = countryOfOriginPermitIssueDateYear
  })
}