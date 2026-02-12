import { getParticipants, getRoomCode, myPlayer } from "playroomkit";

const MAX_WORDS = 10;

export default function mount(switchScreen: (page: string) => void) {
  const code_span = document.getElementById("code-span") as HTMLSpanElement;
  const settingsBtn = document.getElementById(
    "settings-btn",
  ) as HTMLButtonElement;
  const players_list = document.getElementById("players-list") as HTMLDivElement;
  const word_input = document.getElementById("word-input") as HTMLInputElement;
  const word_list = document.getElementById("word-list") as HTMLDivElement;

  let my_words: string[] = [];

  function updateUI() {
    code_span.innerText = getRoomCode() ?? "Error";

    const players = Object.values(getParticipants());

    players_list.innerHTML = ""

    for (let player of players) {
      const words_complete = player.getState("words_complete") ?? 0;
      const name = player.getState("name") ?? "Unnammed Player";
      const character = player.getState("character")

      const playerDiv = document.createElement("div")

      const image = document.createElement("img")
      image.src = character
      image.width = 100
      image.height = 100
      playerDiv.append(image)

      playerDiv.append(name + ` ${words_complete}/${MAX_WORDS}`)

      players_list.append(playerDiv)
    }
  }

  function updateWords() {
    myPlayer().setState("words", my_words)
    myPlayer().setState("words_complete", my_words.length)
  }

  word_input.addEventListener("keydown", (ev) => {
    if (ev.key == "Enter") {
      if (my_words.length < 10) {
        const idx = my_words.length
        const new_word = word_input.value
        my_words.push(new_word)
        word_input.value = ""
        updateWords()

        const wordDiv = document.createElement("div");

        const changeWord = document.createElement("input")
        changeWord.type = "text"
        changeWord.value = new_word
        changeWord.addEventListener("change", ev => {
          my_words[idx] = changeWord.value
          updateWords()
        })
        wordDiv.append(changeWord)

        word_list.append(wordDiv)
      }
    }
  }
  )

  setInterval(updateUI, 250)

  console.log("HELP", word_input)
}