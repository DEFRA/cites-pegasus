window.onload = function () {
  const input = document.getElementById('fileUpload');

  const clientJSConfig = JSON.parse(document.getElementById('clientJSConfig').value);
  input.addEventListener('change', function () {
    if (input.files.length > 0) {
      for (let i = 0; i <= input.files.length - 1; i++) {
        const fileSize = input
          .files
          .item(i)
          .size;

        removeErrors();
        
        if (fileSize >= clientJSConfig.maxFileSizeBytes) {
          showErrors(clientJSConfig);
        }
      }
    }

    function showErrors(config) {
      
      const errorMessage = config.fileSizeErrorText
      input.value = "";
      //Inline error message
      const error = document.createElement('p');
      error.id = "fileUpload-error";
      error.className = "govuk-error-message";
      error.innerHTML = `<span class="govuk-visually-hidden">Error:</span>${errorMessage}`

      input.classList.add('govuk-file-upload--error')
      input.parentNode.classList.add('govuk-form-group--error')
      input.parentNode.insertBefore(error, input);

      //Error summary
      const errorSummary = document.createElement('div');
      errorSummary.className = "govuk-grid-row";
      errorSummary.innerHTML = `<div class="govuk-grid-column-two-thirds">
                                  <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">
                                    <h2 class="govuk-error-summary__title" id="error-summary-title">${config.errorSummaryTitle}</h2>
                                    <div class="govuk-error-summary__body">
                                      <ul class="govuk-list govuk-error-summary__list">
                                        <li><a href="#fileUpload">${errorMessage}</a></li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>`

      const errorSummaryContainer = document.getElementById('divErrorSummaryContainer');
      if (errorSummaryContainer) {
        errorSummaryContainer.appendChild(errorSummary);
      }
    }

    function removeErrors() {
      //Remove inline error message
      input.classList.remove('govuk-file-upload--error')
      input.parentNode.classList.remove('govuk-form-group--error')
      const errorMessage = input.parentNode.querySelector('#fileUpload-error');
      if (errorMessage) {
        errorMessage.parentNode.removeChild(errorMessage);
      }

      //Remove error summary
      input.parentNode.className = 'govuk-form-group'
      const errorSummaryContainer = document.getElementById('divErrorSummaryContainer');
      if (errorSummaryContainer) {
        errorSummaryContainer.innerHTML = '';
      }
    }
  });
}

