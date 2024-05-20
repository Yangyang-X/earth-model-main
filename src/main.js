import { World } from "./world/world.js";
import { countries } from "./countries.js";

window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const sceneContainer = document.getElementById('scene-container');
    const startButton = document.getElementById('start-button');

    preloader.style.display = 'none';
    sceneContainer.style.display = 'block';
    startButton.style.display = 'block';
});

let sessionCountries = [];
let currentCountryIndex = 0;
let chancesUsed = 0;
const maxChances = 3;
let score = 0;
const sessionCountryCount = 20;

function loadAndDisplayCountry(world, index) {
    const country = sessionCountries[index];
    world.showCountry(country.cca2, country.style, country.meshMethod, index === 0);
    updateProgressBar(index + 1, sessionCountries.length);
    chancesUsed = 0;
    updateChancesFlags(maxChances);
    document.querySelector("#score-text").textContent = `${score}`;
}

function updateProgressBar(current, total) {
    const progressBar = document.querySelector("#progress-bar");
    const progressText = document.querySelector("#question-number");
    const progress = (current / total) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${current}/${total}`;
}

function updateChancesFlags(remainingChances) {
    const chancesFlags = document.querySelectorAll(".chance-flag");
    chancesFlags.forEach((flag, index) => {
        flag.style.opacity = index < remainingChances ? 1 : 0.2;
    });
}

function showResultText(text, isCorrect) {
    const resultText = document.querySelector("#result-text");
    resultText.textContent = text;
    resultText.style.color = isCorrect ? "#00ff00" : "#ff0000";
    resultText.style.opacity = 1;

    setTimeout(() => {
        resultText.style.opacity = 0;
    }, 2000);
}

function playSound(soundId) {
    const sound = document.querySelector(soundId);
    sound.play();
}

function shakeInput(input) {
    input.classList.add("shake");
    setTimeout(() => {
        input.classList.remove("shake");
    }, 300);
}

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

function nextCountry(world) {
    currentCountryIndex++;
    if (currentCountryIndex < sessionCountries.length) {
        loadAndDisplayCountry(world, currentCountryIndex);
    } else {
        document.querySelector("#score-text").textContent = `${score}`;
        showResultText(`Game over`, true);
        showGameOverDialog();
        cancelKeyboardFocus();
        hideInputContainer();
        playSound("#complete-sound");
    }
}

function showGameOverDialog() {
    const dialog = document.querySelector("#game-over-dialog");
    const finalScore = document.querySelector("#final-score");
    finalScore.textContent = `Score: ${score}/${sessionCountries.length}`;
    dialog.style.display = "block";
}

function hideGameOverDialog() {
    const dialog = document.querySelector("#game-over-dialog");
    dialog.style.display = "none";
}

function cancelKeyboardFocus() {
    document.querySelector("#answer-input").blur();
}

function hideInputContainer() {
    document.querySelector("#input-container").style.display = "none";
}

function showInputContainer() {
    document.querySelector("#input-container").style.display = "flex";
}

function startSession(world) {
    world.resetPosition();
    sessionCountries = [...countries].sort(() => 0.5 - Math.random()).slice(0, sessionCountryCount);

    currentCountryIndex = 0;
    chancesUsed = 0;
    score = 0;

    document.querySelector("#start-button").style.display = "none";
    hideGameOverDialog();
    showInputContainer();

    loadAndDisplayCountry(world, currentCountryIndex);
}

function adjustInputPosition() {
    const inputContainer = document.querySelector("#input-container");
    const originalBottom = 80;

    function adjust() {
        const viewportHeight = window.innerHeight;
        const fullHeight = screen.height;
        const keyboardHeight = fullHeight - viewportHeight;

        inputContainer.style.bottom = keyboardHeight > 100 ? `${keyboardHeight + originalBottom}px` : `${originalBottom}px`;
    }

    window.addEventListener("resize", adjust);
}

adjustInputPosition();

function main() {
    const container = document.querySelector("#scene-container");
    const world = new World(container);
    world.start();

    document.querySelector("#start-button").addEventListener("click", () => startSession(world));
    document.querySelector("#new-game-button").addEventListener("click", () => startSession(world));

    const answerInput = document.querySelector("#answer-input");
    const submitButton = document.querySelector("#submit-button");

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

    submitButton.addEventListener("click", checkAnswer);
    answerInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            checkAnswer();
        }
    });
}

main();
