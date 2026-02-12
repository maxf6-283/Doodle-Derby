import { getParticipants, myPlayer } from "playroomkit";

const guesser = document.getElementById("word-guesser") as HTMLInputElement;
const submit = document.getElementById("submit") as HTMLInputElement;
const guessStatus = document.getElementById("guess-status") as HTMLBodyElement;
const list: string[] = ["ball", "bounce", "stinky", "volcano", "goblin"];

const players = Object.values(getParticipants());
console.log(players);
let player1 = players[Math.trunc(Math.random() * players.length)];
let player1Words = player1.getState("words");
let index = Math.trunc(Math.random() * list.length);
let player1Word = player1Words[Math.trunc(Math.random() * player1Words.length)]; // list[index];
list.splice(index, 1);

let player2 = players[Math.trunc(Math.random() * players.length)];
let player2Words = player2.getState("words")[Math.trunc(Math.random() * players.length)];
let player2Word = player2Words[Math.trunc(Math.random() * player2Words.length)]; // list[Math.trunc(Math.random() * list.length)];

let setDisabled = [false, false];

function checkGuess() {
    if (guesser.value == player1Word) {
        guessStatus.textContent = "" + player1Word + " is correct!";
        setDisabled[0] = true;
    } else if (guesser.value == player2Word) {
        guessStatus.textContent = "" + player2Word + " is correct!"; 
        setDisabled[1] = true;
    } else {
        guessStatus.textContent = "Incorrect";
    }

    if (setDisabled[0] && setDisabled[1]) {
        guesser.disabled = true;
    }
}

submit.addEventListener("click", checkGuess)
window.addEventListener("keydown", ev => {
    if (ev.key == "Enter") {
        checkGuess();
    }
});