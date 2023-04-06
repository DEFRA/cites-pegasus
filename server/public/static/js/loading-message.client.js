window.onpageshow = function (event) {
    //Clears the loading message when the page is accessed via the back button
    hideLoadingMessage()
}

window.onload = function () {
    const triggers = document.querySelectorAll(".loading-message-trigger")
    triggers.forEach(element => {
        element.addEventListener("click", showLoadingMessage)
    })
}

function hideLoadingMessage() {
    const elementToHide = document.querySelectorAll(".hide-when-loading")
    elementToHide.forEach(element => {
        element.style.visibility = "visible"
    })
    const element = document.getElementById("loading-overlay-container")
    if (element) {
        element.remove()
    }
}

const loadingOverlay = `    
        <div class="loading-overlay">
            <div class="loader-wrapper">                
                <div class="loader-indicator">
                    <span class="loader first_sm"></span>
                    <span class="loader second_sm"></span>
                    <span class="loader third_sm"></span>
                </div>            
                <p class="indicator-text">Loading...</p>
            </div>            
        </div>`

function showLoadingMessage() {
    const element = document.querySelectorAll(".hide-when-loading")[0]
    element.style.visibility = "hidden"

    const overlayContainer = document.createElement("div")
    overlayContainer.classList.add("loading-overlay-container")
    overlayContainer.id = "loading-overlay-container"
    overlayContainer.innerHTML = loadingOverlay

    element.parentNode.insertBefore(overlayContainer, element)
    window.scrollTo(0, 0)
}

