// Import the World class
import { World } from "./World/World.js";
import { countries } from "./countries.js";

// Select 20 random countries without duplicates
const sessionCountries = [...countries]
    .sort(() => 0.5 - Math.random())
    .slice(0, 20);

// Initialize the current country index, chances, and score
let currentCountryIndex = 0;
let chancesUsed = 0;
const maxChances = 3;
let score = 0;

// Function to load and display a specific country
function loadAndDisplayCountry(world, index) {
    const country = sessionCountries[index];
    world.showCountry(country.cca2, country.style);

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
        showResultText(`Game over`, true);
        playSound("#complete-sound");
    }
}

// Main function to start the world and handle the game logic
function main() {
    const container = document.querySelector("#scene-container");
    const world = new World(container);
    world.start();

    // Load the first country
    loadAndDisplayCountry(world, currentCountryIndex);

    // Answer checking and switching logic
    const answerInput = document.querySelector("#answer-input");
    const submitButton = document.querySelector("#submit-button");

    // Shared function to check the answer
    function checkAnswer() {
        const answer = answerInput.value.trim().toLowerCase();
        const currentCountry = sessionCountries[currentCountryIndex];

        if (answer === currentCountry.name.toLowerCase()) {
            console.log("Correct!");
            showResultText("Correct!", true);
            playSound("#correct-sound");
            score++;
            setTimeout(() => {
                nextCountry(world);
                answerInput.value = "";
            }, 1500);
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



