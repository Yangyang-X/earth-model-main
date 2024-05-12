// Import the World class
import { World } from "./World/World.js";
import { countries } from "./countries.js";

let sessionCountries = [];
let currentCountryIndex = 0;
let chancesUsed = 0;
const maxChances = 3;
let score = 0;
const sessionCountryCount = 20; //TODO update me:20

// Function to load and display a specific country
function loadAndDisplayCountry(world, index) {
  const country = sessionCountries[index];
  console.log(country)
  world.showCountry(country.cca2, country.style, country.meshMethod, index == 0);

  // Update the progress bar
  updateProgressBar(index + 1, sessionCountries.length);

  // Reset the chances flags
  chancesUsed = 0;
  updateChancesFlags(maxChances);

  // Update the score text
  const scoreText = document.querySelector("#score-text");
  scoreText.innerHTML = `${score}`;
}

// Function to update the progress bar
function updateProgressBar(current, total) {
  const progressBar = document.querySelector("#progress-bar");
  const progressText = document.querySelector("#question-number");
  const progress = (current / total) * 100;
  progressBar.style.width = `${progress}%`;
  progressText.innerHTML = `${current}/${total}`;
}

// Function to update the chances flags
function updateChancesFlags(remainingChances) {
  const chancesFlags = document.querySelectorAll(".chance-flag");
  chancesFlags.forEach((flag, index) => {
    if (index < remainingChances) {
      flag.style.opacity = 1;
    } else {
      flag.style.opacity = 0.2;
    }
  });
}

// Function to show the result text
function showResultText(text, isCorrect) {
  const resultText = document.querySelector("#result-text");
  resultText.textContent = text;
  resultText.style.color = isCorrect ? "#00ff00" : "#ff0000";
  resultText.style.opacity = 1;

  setTimeout(() => {
    resultText.style.opacity = 0;
  }, 2000);
}

// Function to play the correct or wrong sound
function playSound(soundId) {
  const sound = document.querySelector(soundId);
  sound.play();
}

// Function to shake the input field
function shakeInput(input) {
  input.classList.add("shake");
  setTimeout(() => {
    input.classList.remove("shake");
  }, 300);
}

// Function to handle incorrect answers
function handleWrongAnswer(world, answerInput, currentCountry) {
  chancesUsed++;
  updateChancesFlags(maxChances - chancesUsed);

  if (chancesUsed < maxChances) {
    showResultText(`Incorrect! Try again.`, false);
    playSound("#wrong-sound");
    shakeInput(answerInput);
    setTimeout(() => {
      answerInput.value = "";
    }, 2000);
  } else {
    showResultText(`It is\n${currentCountry.name}`, false);
    playSound("#wrong-sound");
    setTimeout(() => {
      answerInput.value = "";
      nextCountry(world);
    }, 3000);
  }
}

// Function to handle switching to the next country
function nextCountry(world) {
  currentCountryIndex++;
  if (currentCountryIndex < sessionCountries.length) {
    loadAndDisplayCountry(world, currentCountryIndex);
  } else {
    const scoreText = document.querySelector("#score-text");
    scoreText.innerHTML = `${score}`;

    showResultText(`Game over`, true);
    showGameOverDialog();

    cancelKeyboardFocus();
    hideInputContainer();

    playSound("#complete-sound");
  }
}

// Function to show the game over dialog
function showGameOverDialog() {
  const dialog = document.querySelector("#game-over-dialog");
  const finalScore = document.querySelector("#final-score");
  finalScore.textContent = `Score: ${score}/${sessionCountries.length}`;
  dialog.style.display = "block";
}

// Function to hide the game over dialog
function hideGameOverDialog() {
  const dialog = document.querySelector("#game-over-dialog");
  dialog.style.display = "none";
}

function cancelKeyboardFocus() {
  const answerInput = document.querySelector("#answer-input");
  answerInput.blur(); // Remove focus
}

function hideInputContainer() {
  const inputContainer = document.querySelector("#input-container");
  inputContainer.style.display = "none";
}

// Function to show the input container
function showInputContainer() {
  const inputContainer = document.querySelector("#input-container");
  inputContainer.style.display = "flex";
}

function startSession(world) {
  world.resetPosition();
  sessionCountries = [...countries]
    .sort(() => 0.5 - Math.random())
    .slice(0, sessionCountryCount);
  /*
    sessionCountries = [
      { cca2: "ca", name: "Canada", style: "mesh",  elevation: "1.02" },//todo fixme
  
  
      { cca2: "nz", name: "New zealand", style: "mesh", meshMethod: "turf", elevation: "1.02" },
      { cca2: "cu", name: "Cuba", style: "mesh",meshMethod: "turf", elevation: "1.0" },
      { cca2: "cn", name: "China", style: "mesh", elevation: "1.02" },
      { cca2: "us", name: "United States", style: "mesh", elevation: "1.02" },
  
  
      { cca2: "ru", name: "Russia", style: "mesh", elevation: "1.02" },
      { cca2: "au", name: "Australia", style: "mesh", elevation: "1.0" },
  
  
      { cca2: "ar", name: "Argentina", style: "mesh", elevation: "1.0" },
  
      { cca2: "jp", name: "Japan", style: "mesh", elevation: "1.02" },
  
      { cca2: "kz", name: "Kazakhstan", style: "mesh", elevation: "1.04" },
      { cca2: "br", name: "Brazil", style: "mesh", elevation: "1.04" },
      { cca2: "ca", name: "Canada", style: "mesh", elevation: "1.04" },
      { cca2: "in", name: "India", style: "mesh", elevation: "1.04" },
  
  
  
  
      { cca2: "jo", name: "Jordan", style: "mesh", elevation: "1.0" },
      { cca2: "ke", name: "Kenya", style: "mesh", elevation: "1.03" },
      { cca2: "kw", name: "Kuwait", style: "mesh", elevation: "1.0" },
      { cca2: "kg", name: "Kyrgyzstan", style: "mesh", elevation: "1.0" },
      { cca2: "la", name: "Laos", style: "mesh", elevation: "1.01" },
      { cca2: "lv", name: "Latvia", style: "mesh", elevation: "1.0" },
      { cca2: "lb", name: "Lebanon", style: "mesh", elevation: "1.0" },
    ]; */

  currentCountryIndex = 0;
  chancesUsed = 0;
  score = 0;

  // Hide start button and game over dialog
  document.querySelector("#start-button").style.display = "none";
  hideGameOverDialog();
  showInputContainer();

  loadAndDisplayCountry(world, currentCountryIndex);
}

// Adjust the input field position when the keyboard appears
function adjustInputPosition() {
  const inputContainer = document.querySelector("#input-container");
  const originalBottom = 80; // original bottom value

  function adjust() {
    const viewportHeight = window.innerHeight;
    const fullHeight = screen.height;
    const keyboardHeight = fullHeight - viewportHeight;

    if (keyboardHeight > 100) {
      inputContainer.style.bottom = `${keyboardHeight + originalBottom}px`;
    } else {
      inputContainer.style.bottom = `${originalBottom}px`;
    }
  }

  window.addEventListener("resize", adjust);
}

adjustInputPosition();

// Main function to start the world and handle the game logic
function main() {
  const container = document.querySelector("#scene-container");
  const world = new World(container);
  world.start();

  const startButton = document.querySelector("#start-button");
  startButton.addEventListener("click", () => startSession(world));

  // Add event listener for the new game button
  const newGameButton = document.querySelector("#new-game-button");
  newGameButton.addEventListener("click", () => startSession(world));

  // Answer checking and switching logic
  const answerInput = document.querySelector("#answer-input");
  const submitButton = document.querySelector("#submit-button");

  // Shared function to check the answer
  function checkAnswer() {
    const answer = answerInput.value.trim().toLowerCase();
    const currentCountry = sessionCountries[currentCountryIndex];

    if (answer === currentCountry.name.toLowerCase()) {
      showResultText("Correct!", true);
      playSound("#correct-sound");
      score++;
      setTimeout(() => {
        nextCountry(world);
        answerInput.value = "";
      }, 1200);
    } else {
      handleWrongAnswer(world, answerInput, currentCountry);
    }
  }

  // Add event listener for the submit button
  submitButton.addEventListener("click", checkAnswer);

  // Add event listener for the Enter key
  answerInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });
}

main();
