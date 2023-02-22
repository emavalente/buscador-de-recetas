document.addEventListener("DOMContentLoaded", startApp);

function startApp() {
  const selectCategories = document.querySelector("#categorias");

  if (selectCategories) {
    selectCategories.addEventListener("change", selectCategorie);

    // Comienza la app trayendo las categorías.
    getCategories();
  }

  const favoritesDiv = document.querySelector(".favoritos");
  const result = document.querySelector("#resultado");

  if (favoritesDiv) {
    // Revisar favoritos
    getFavorites();
  }

  const modal = new bootstrap.Modal("#modal", {});

  // Elegir una categoría.

  function getCategories() {
    const url = "https://www.themealdb.com/api/json/v1/1/categories.php";

    fetch(url)
      .then((response) => response.json())
      .then((response) => {
        // Recibe un objeto - cuya propiedad categories contiene el array de categorias.
        loadCategories(response.categories);
      });
  }

  function loadCategories(categories = []) {
    categories.forEach((item) => {
      const option = document.createElement("OPTION");
      option.value = item.strCategory;
      option.innerText = item.strCategory;
      selectCategories.appendChild(option);
    });
  }

  function selectCategorie(e) {
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${e.target.value}`;

    fetch(url)
      .then((response) => response.json())
      .then((response) => showResult(response.meals));
  }

  function showResult(meals = []) {
    cleanHTML(result);
    const heading = document.createElement("H2");
    heading.classList.add("text-center", "text-black", "my-5");
    heading.textContent = meals.length ? "Resultados" : "No hay Resultados";
    result.appendChild(heading);

    meals.forEach((meal) => {
      const { idMeal, strMeal, strMealThumb } = meal;

      // Configurar la Card del platillo
      const mealsDiv = document.createElement("DIV");
      mealsDiv.classList.add("col-md-4", "justify-content-center", "align-items-center");

      const mealCard = document.createElement("DIV");
      mealCard.classList.add("card", "mb-4");

      const mealPicture = document.createElement("IMG");
      mealPicture.classList.add("card-img-top");
      mealPicture.alt = `Picture of the meal ${strMeal ?? meal.title}`;
      mealPicture.src = strMealThumb ?? meal.img;

      const mealCardBody = document.createElement("DIV");
      mealCardBody.classList.add("card-body");

      const mealHeading = document.createElement("H3");
      mealHeading.classList.add("card-title", "mb-3");
      mealHeading.textContent = strMeal ?? meal.title;

      const mealButton = document.createElement("BUTTON");
      mealButton.classList.add("btn", "btn-danger", "w-100");
      mealButton.textContent = "Ver Receta";
      mealButton.dataset.bsTarget = "#modal";
      mealButton.dataset.bsToogle = "modal";
      mealButton.addEventListener("click", () => selectRecipe(idMeal ?? meal.id));

      // Inyectar el HTML
      mealsDiv.appendChild(mealCard);
      mealCard.appendChild(mealPicture);
      mealCard.appendChild(mealCardBody);
      mealCardBody.appendChild(mealHeading);
      mealCardBody.appendChild(mealButton);

      result.appendChild(mealsDiv);
    });
  }

  function cleanHTML(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }

  function selectRecipe(id) {
    const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    fetch(url)
      .then((response) => response.json())
      .then((response) => showRecipe(response.meals[0]));
  }

  function showRecipe(recipe) {
    const { idMeal, strInstructions, strMeal, strMealThumb } = recipe;

    const modalTitle = document.querySelector(".modal-title");
    const modalBody = document.querySelector(".modal-body");

    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
      <img src="${strMealThumb}" class="img-fluid" alt="${strMeal}"></img>
      <h3 class="my-4">Instrucciones:</h3>
      <p>${strInstructions}</p>
      <h3 class="my-4">Ingredientes y Cantidades:</h3>
    `;

    // Mostrar Ingredientes y Cantidades.
    const ingredientGroup = document.createElement("UL");
    ingredientGroup.classList.add("list-group");

    for (let i = 1; i <= 20; i++) {
      if (recipe[`strIngredient${i}`]) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];

        const ingredientLi = document.createElement("LI");
        ingredientLi.classList.add("list-group-item");
        ingredientLi.textContent = `${ingredient} - ${measure}`;

        ingredientGroup.appendChild(ingredientLi);
      }
    }

    modalBody.appendChild(ingredientGroup);

    // Botones Favoritos y Cerrar
    const modalFooter = document.querySelector(".modal-footer");

    cleanHTML(modalFooter);

    const btnFavorite = document.createElement("BUTTON");
    btnFavorite.classList.add("btn", "btn-danger", "col");
    btnFavorite.textContent = storageExist(idMeal) ? "Eliminar Favorito" : "Guardar Favorito";
    btnFavorite.addEventListener("click", () => {
      if (storageExist(idMeal)) {
        deleteFavorite(idMeal);
        btnFavorite.textContent = "Guardar Favorito";
        showToast("Eliminado de favoritos");
        return;
      }

      addFavorite({
        id: idMeal,
        title: strMeal,
        img: strMealThumb,
      });

      btnFavorite.textContent = "Eliminar Favorito";

      showToast("Receta agregagada a favoritos");
    });

    const btnClose = document.createElement("BUTTON");
    btnClose.classList.add("btn", "btn-secondary", "col");
    btnClose.textContent = "Close";
    btnClose.addEventListener("click", () => {
      modal.hide();
    });

    modalFooter.appendChild(btnFavorite);
    modalFooter.appendChild(btnClose);

    modal.show();
  }

  function addFavorite(recipe) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) ?? [];
    localStorage.setItem("favorites", JSON.stringify([...favorites, recipe]));
  }

  function storageExist(id) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) ?? [];
    return favorites.some((el) => el.id === id);
  }

  function deleteFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) ?? [];
    const newFavorites = favorites.filter((el) => el.id !== id);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  }

  function showToast(message) {
    const toastDiv = document.querySelector("#toast");
    const toastBody = document.querySelector(".toast-body");
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = message;
    toast.show();
  }

  function getFavorites() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) ?? [];

    if (favorites.length) {
      console.log("Si hay Favoritos");
      showResult(favorites);
    } else {
      const noFavorites = document.createElement("P");
      noFavorites.classList.add("fs-2", "text-center", "fw-bold", "my-5");
      noFavorites.textContent = "No hay favoritos";
      result.appendChild(noFavorites);
    }
  }
}
