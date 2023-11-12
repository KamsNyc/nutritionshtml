document.getElementById("analyzeBtn").addEventListener("click", getNutrition);

function getNutrition() {
  var labelInput = document.getElementById("labelInput");
  var label = labelInput.value;

  var ingredientsInput = document.getElementById("ingredients");
  var ingredients = ingredientsInput.value.trim().split("\n");

  if (ingredients.length === 0) {
    alert("Please enter at least one ingredient.");
    return;
  }

  var request = new XMLHttpRequest();
  var url = "https://api.edamam.com/api/nutrition-data";
  var params = {
    app_id: "aab302df",
    app_key: "fe7d4c8892f31fff05cd1b4033f05fca",
    ingr: ingredients
  };
  url += "?" + Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");

  request.open("GET", url, true);
  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.status === 200) {
        var response = JSON.parse(request.responseText);
        displayNutrition(response, label, ingredients);
        saveRecipe(label, ingredients);
      } else {
        alert("An error occurred while fetching nutrition data. Please try again later.");
      }
    }
  };
  request.send();
}

function displayNutrition(response, label, ingredients) {
  var nutritionFacts = document.getElementById("nutritionFacts");
  nutritionFacts.innerHTML = "";

  var table = document.createElement("table");
  var tableBody = document.createElement("tbody");

  var labelRow = createTableRow("Label", label);
  tableBody.appendChild(labelRow);

  var caloriesRow = createTableRow("Calories", response.calories.toFixed(2) + " kcal");
  tableBody.appendChild(caloriesRow);

  var nutrientsRow = document.createElement("tr");
  var nutrientsCell = document.createElement("td");
  nutrientsCell.setAttribute("colspan", "2");
  nutrientsCell.innerHTML = "<h4>Nutrients:</h4>";
  nutrientsRow.appendChild(nutrientsCell);
  tableBody.appendChild(nutrientsRow);

  for (var key in response.totalNutrients) {
    if (response.totalNutrients.hasOwnProperty(key)) {
      var nutrient = response.totalNutrients[key];
      var nutrientRow = createTableRow(nutrient.label, nutrient.quantity.toFixed(2) + " " + nutrient.unit);
      tableBody.appendChild(nutrientRow);
    }
  }

  table.appendChild(tableBody);
  nutritionFacts.appendChild(table);
}

function createTableRow(label, value) {
  var row = document.createElement("tr");

  var labelCell = document.createElement("td");
  labelCell.textContent = label;
  row.appendChild(labelCell);

  var valueCell = document.createElement("td");
  valueCell.textContent = value;
  row.appendChild(valueCell);

  return row;
}

function saveRecipe(label, ingredients) {
  var previousRecipes = JSON.parse(localStorage.getItem("previousRecipes")) || [];

  // Check if the recipe already exists
  var exists = previousRecipes.some(function (recipe) {
    return recipe.label === label && JSON.stringify(recipe.ingredients) === JSON.stringify(ingredients);
  });

  if (exists) {
    return;
  }

  var recipe = {
    label: label,
    ingredients: ingredients
  };

  previousRecipes.push(recipe);
  localStorage.setItem("previousRecipes", JSON.stringify(previousRecipes));

  displayPreviousRecipes();
}

function displayPreviousRecipes() {
  var previousRecipesContainer = document.getElementById("previousRecipes");
  previousRecipesContainer.innerHTML = "";

  var previousRecipes = JSON.parse(localStorage.getItem("previousRecipes")) || [];
  var recipeLimit = 8;
  var totalPages = Math.ceil(previousRecipes.length / recipeLimit);
  var currentPage = 1;
  var startIndex = (currentPage - 1) * recipeLimit;
  var endIndex = startIndex + recipeLimit;
  var recipesToShow = previousRecipes.slice(startIndex, endIndex);

  recipesToShow.forEach(function (recipe) {
    var recipeCard = document.createElement("div");
    recipeCard.className = "recipe-card";

    var recipeTitle = document.createElement("div");
    recipeTitle.textContent = recipe.label;
    recipeTitle.className = "recipe-title";
    recipeCard.appendChild(recipeTitle);

    var recipeDate = document.createElement("div");
    recipeDate.textContent = "Date Created: " + getCurrentDate();
    recipeDate.className = "recipe-date";
    recipeCard.appendChild(recipeDate);

    var recipeViewButton = document.createElement("button");
    recipeViewButton.textContent = "View";
    recipeViewButton.className = "recipe-view-button";
    recipeViewButton.addEventListener("click", function () {
      scrollToTop();
      displayNutritionForPreviousRecipe(recipe.label, recipe.ingredients);
    });
    recipeCard.appendChild(recipeViewButton);

    var recipeDeleteButton = document.createElement("button");
    recipeDeleteButton.textContent = "Delete";
    recipeDeleteButton.className = "recipe-delete-button";
    recipeDeleteButton.addEventListener("click", function () {
      showConfirmationDialog(recipe);
    });
    recipeCard.appendChild(recipeDeleteButton);

    previousRecipesContainer.appendChild(recipeCard);
  });

  // Add pagination
  if (totalPages > 1) {
    var paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";

    var previousPageButton = document.createElement("button");
    previousPageButton.textContent = "Previous";
    previousPageButton.className = "pagination-button";
    previousPageButton.disabled = currentPage === 1;
    previousPageButton.addEventListener("click", function () {
      currentPage--;
      displayPreviousRecipes();
    });
    paginationContainer.appendChild(previousPageButton);

    var pageIndicator = document.createElement("span");
    pageIndicator.textContent = "Page " + currentPage + " of " + totalPages;
    paginationContainer.appendChild(pageIndicator);

    var nextPageButton = document.createElement("button");
    nextPageButton.textContent = "Next";
    nextPageButton.className = "pagination-button";
    nextPageButton.disabled = currentPage === totalPages;
    nextPageButton.addEventListener("click", function () {
      currentPage++;
      displayPreviousRecipes();
    });
    paginationContainer.appendChild(nextPageButton);

    previousRecipesContainer.appendChild(paginationContainer);
  }
}

function displayNutritionForPreviousRecipe(label, ingredients) {
  var labelInput = document.getElementById("labelInput");
  var ingredientsInput = document.getElementById("ingredients");

  labelInput.value = label;
  ingredientsInput.value = ingredients.join("\n");

  getNutrition();
}

function deleteRecipe(recipe) {
  var previousRecipes = JSON.parse(localStorage.getItem("previousRecipes")) || [];

  previousRecipes = previousRecipes.filter(function (item) {
    return item.label !== recipe.label || JSON.stringify(item.ingredients) !== JSON.stringify(recipe.ingredients);
  });

  localStorage.setItem("previousRecipes", JSON.stringify(previousRecipes));

  displayPreviousRecipes();
}

function showConfirmationDialog(recipe) {
  var confirmation = confirm("Are you sure you want to delete this recipe?");
  if (confirmation) {
    deleteRecipe(recipe);
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getCurrentDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();

  return mm + "/" + dd + "/" + yyyy;
}

// Display previous recipes on page load
displayPreviousRecipes();

