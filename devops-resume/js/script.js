// =========================================
// INTERACTIVE DEVOPS RESUME
// =========================================


// Get the two buttons from the HTML page

const expandAllButton = document.getElementById("expandAllButton");

const collapseAllButton = document.getElementById("collapseAllButton");


// Get every <details> element on the page

const allDetails = document.querySelectorAll("details");


// =========================================
// EXPAND ALL
// =========================================

expandAllButton.addEventListener("click", function () {

    allDetails.forEach(function (detail) {

        detail.open = true;

    });

});


// =========================================
// COLLAPSE ALL
// =========================================

collapseAllButton.addEventListener("click", function () {

    allDetails.forEach(function (detail) {

        detail.open = false;

    });

});


// =========================================
// CONSOLE MESSAGE
// =========================================

console.log("Interactive DevOps Resume loaded successfully.");