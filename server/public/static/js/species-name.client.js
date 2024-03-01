document.addEventListener('DOMContentLoaded', function () {

    let jsEnabledText = document.querySelector('.js-enabled-only.typeaheadDisabled')

    const enableSpeciesNameTypeahead = document.getElementById('inputEnableSpeciesNameTypeahead')
    
    if (enableSpeciesNameTypeahead.value === "true") {
        
        jsEnabledText = document.querySelector('.js-enabled-only.typeaheadEnabled')
        
        const speciesNameOriginalValue = document.getElementById('inputSpeciesNameOriginalValue')
        
        accessibleAutocomplete({
            element: document.querySelector('#speciesName-container'),
            name: 'speciesName',
            id: 'speciesName',
            source: speciesSearch,
            defaultValue: speciesNameOriginalValue.value,
            minLength: 3,
            required: true
        })
        
        function speciesSearch(query, populateResults) {
            
            const apiEndpoint = `/species-name/search/${encodeURIComponent(query)}`
            
            fetch(apiEndpoint)
            .then(response => {
                if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`)
                    }
                    return response.json()
                })
                .then(data => populateResults(data))
                .catch(error => console.error('Error:', error));
            }
            
            const speciesNameInput = document.getElementById('speciesName')
            const speciesNameError = document.getElementById('inputSpeciesNameError')
            const speciesNameDiv = document.getElementById('divSpeciesName')
            
            if (speciesNameError.value) {
                
                const inputErrorMessage = `<p id="speciesName-error" class="govuk-error-message"><span class="govuk-visually-hidden">Error:</span> ${speciesNameError.value}</p>`
                speciesNameInput.classList.add('govuk-input--error')
                speciesNameDiv.classList.add('govuk-form-group--error')
                speciesNameInput.insertAdjacentHTML('beforebegin', inputErrorMessage)
        }
    }

    if (jsEnabledText) {
        jsEnabledText.style.display = 'block'; // Show the JavaScript enabled text
    }

})