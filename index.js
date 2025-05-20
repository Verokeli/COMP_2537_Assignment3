// global variables track the entire game state
let timerInterval, timeLeft, clickCount = 0, matchedPairs = 0, totalPairs;
let firstCard, secondCard;
let lockBoard = false;
let level = "easy";

$(document).ready(() => {
  $("#theme-toggle").on("change", function () {
    const isDark = $(this).is(":checked");
    $("body").toggleClass("dark-theme", isDark);
    $("#theme-label").text(isDark ? "Dark Mode" : "Light Mode");
  });

  $("#start").on("click", startGame);
  $("#reset").on("click", startGame);
  $("#powerup").on("click", () => {
    swal("Power-Up Activated!", "All cards flipped!", "info");
    $(".card").addClass("flip");
    setTimeout(() => {
      $(".card").removeClass("flip");
    }, 2000);
  });

  $("[data-level]").on("click", function () {
    level = $(this).data("level");
    $("[data-level]").removeClass("selected");
    $(this).addClass("selected");
  });
});

function setup() {
  $(".card").on("click", function () {
    if (lockBoard || $(this).hasClass("flip")) return;

    $(this).addClass("flip");

    if (!firstCard) {
      firstCard = $(this).find(".front_face")[0];
    } else {
      secondCard = $(this).find(".front_face")[0];
      clickCount++;
      if (firstCard.src === secondCard.src) {
        matchedPairs++;
        $(`#${firstCard.id}`).parent().off("click");
        $(`#${secondCard.id}`).parent().off("click");
        firstCard = secondCard = undefined;
      } else {
        lockBoard = true;
        setTimeout(() => {
          $(`#${firstCard.id}`).parent().removeClass("flip");
          $(`#${secondCard.id}`).parent().removeClass("flip");
          firstCard = secondCard = undefined;
          lockBoard = false;
        }, 1000);
      }
      changeStatus();
    }

    if (matchedPairs === totalPairs) {
      setTimeout(() => {
        clearInterval(timerInterval);
        swal({
          title: "You Win!", // Sweet Alert
          icon: "success",
          button: "Play Again"
        }).then(() => {
          startGame();
        });
        $(".card").off("click");
      }, 500);
    }
  });
}

// number of total pairs, matched pairs, remaining pairs, total clicks, and time remaining
function changeStatus() {
  $("#total-pairs-text").text(`Total Number of Pairs: ${totalPairs}`);
  $("#matches-text").text(`Number of Matches: ${matchedPairs}`);
  $("#pairs-left-text").text(`Number of Pairs Left: ${totalPairs - matchedPairs}`);
  $("#clicks-text").text(`Number of Clicks: ${clickCount}`);
  $("#timer-text").text(`You got ${initialTime} seconds. Time Left: ${timeLeft}s`);
}

// the Pokémon API used to retrieve the images for the cards
async function fetchPokemonImages(count) {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
  const data = await response.json();
  const selected = [];

  while (selected.length < count) {
    const rand = Math.floor(Math.random() * data.results.length);
    const pokeUrl = data.results[rand].url;
    const id = pokeUrl.split("/").filter(Boolean).pop();

    if (!selected.includes(id)) {
      selected.push(id);
    }
  }

  const imageUrls = await Promise.all(selected.map(async (id) => {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const info = await res.json();
    const sprite = info.sprites.other["official-artwork"].front_default;
    return sprite ? sprite : "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
  }));

  return imageUrls;
}

let initialTime = 0;
function startGame() {
  $("#game-box").fadeIn(300);

  const lv = level;
  const config = {
    easy: { pairs: 3, time: 30 },
    medium: { pairs: 6, time: 60 },
    hard: { pairs: 9, time: 90 },
  }[lv];

  totalPairs = config.pairs;
  timeLeft = config.time;
  initialTime = config.time;
  clickCount = 0;
  matchedPairs = 0;
  firstCard = secondCard = undefined;
  lockBoard = false;
  changeStatus();
  clearInterval(timerInterval);
  setupTimer();

  fetchPokemonImages(totalPairs).then((images) => {
    const allImages = images.concat(images);
    shuffleArray(allImages);
    renderCards(allImages);
    setup();
  });
}

function setupTimer() {
  $("#timer").text(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft--;

    const now = new Date();
    const formatted = now.toLocaleTimeString();
    $("#current-time-text").text(`Current Time: ${formatted}`);

    changeStatus();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      swal({
        title: "Time's Up!",
        icon: "error",
        button: "Retry"
      }).then(() => {
        startGame();
      });
      $(".card").off("click");
    }
  }, 1000);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function renderCards(images) {
  const gameGrid = $("#game_grid");
  gameGrid.empty();
  images.forEach((imgUrl, index) => {
    const cardId = `img${index + 1}`;
    const cardHTML = `
      <div class="card">
        <img id="${cardId}" class="front_face" src="${imgUrl}" alt="pokemon">
        <img class="back_face" src="back.webp" alt="card back">
      </div>
    `;
    gameGrid.append(cardHTML);
  });
}
