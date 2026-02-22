import { createSignal, onMount, onCleanup } from "solid-js";

import { RPC, getState, setState, myPlayer, getParticipants } from "playroomkit";

export const ChatGuesser = (props: { promptList: string[] }) => {
  let [text, setText] = createSignal("");
  let [isDisabled, setIsDisabled] = createSignal(false);
  let [guessedWords, setGuessedWords] = createSignal(new Array<string>());

  let [globalMessages, setGlobalMessages] = createSignal(new Array<string>());
  setState('chats', guessedWords());

  // let guessCounter = 0;
  let correctGuesses = 0;

  onMount(() => {
    let intervalId = setInterval(() => {setGlobalMessages(getState('chats'));}, 300);

    onCleanup(() => {
      clearInterval(intervalId);
    });
  });

  const guessChecker = () => {
    if (props.promptList.find(word => word === text().toLowerCase())) {
      correctGuesses++;
      //find artist
      let firstArtistIndex = -1;
      let secondArtistIndex = -1;
      let participants = Object.values(getParticipants());
      participants.forEach((player, index) => {
        if (player.getState("isArtist") && firstArtistIndex < 0) {
          firstArtistIndex = index;
        } else if (player.getState("isArtist") && secondArtistIndex < 0) {
          secondArtistIndex = index;
        }
      });

      //Update artist right guesses to decide how many points guesser recieves
      const promptOneTrue = text() === props.promptList[0] ? firstArtistIndex : secondArtistIndex;
      // if (promptOneTrue) {
      //   const rGuess = participants[firstArtistIndex].getState('rightGuesses');
      //   guess = rGuess;
      //   participants[firstArtistIndex].setState('rightGuesses', rGuess + 1);
      // }
      // else {
      //   const rGuess = participants[secondArtistIndex].getState('rightGuesses');
      //   guess = rGuess;
      //   participants[secondArtistIndex].setState('rightGuesses', rGuess + 1);
      // }
      const rGuess = participants[promptOneTrue].getState('rightGuesses');
      let guess = rGuess;
      console.log("Right guesses: " + guess);
      participants[promptOneTrue].setState('rightGuesses', rGuess + 1);

      //add score for first guess
      let addition = 0;
      if(guess == 0) {
        const currentScore = participants[promptOneTrue].getState('score');
        participants[promptOneTrue].setState('score', currentScore +2);
        addition = 5;
      }
      else if (guess == 1) {
        addition = 3;
        const currentScore = participants[promptOneTrue].getState('score');
        participants[promptOneTrue].setState('score', currentScore +1);
      }
      else {
        addition = 1;
        const currentScore = participants[promptOneTrue].getState('score');
        participants[promptOneTrue].setState('score', currentScore +1);
      }
      const currentScore = myPlayer().getState('score');
      myPlayer().setState('score', currentScore + addition);
      console.log("Right guesses after: " + participants[promptOneTrue].getState('rightGuesses'));
      console.log("Player score: "+ myPlayer().getState('score'));
      console.log("Artist score: "+ participants[promptOneTrue].getState('score'));
      if (correctGuesses == 2) {
        submitMessage("guessed both words!");
        setIsDisabled(true);
        RPC.call('playerGuessed', {}, RPC.Mode.HOST);
        return;
      }
      submitMessage("guessed a word!");
    } else { submitMessage(text()); }
    setGuessedWords((wordList: string[]) => {
      wordList.push(text().toLowerCase())
      return wordList;
    });

    
    if (correctGuesses >= 2) {
    setIsDisabled(true);
    }
  }

  function displayChat() {
    if (globalMessages == null) return;
    return globalMessages().map((message) => {
      return (<p>{message}</p>);
    }
    );
  }

  function appendMessage(newMessage: string) {
    function newMessages() {
      if (newMessage.trim().length == 0) return globalMessages;
      return [...globalMessages(), newMessage];
    }

    setGlobalMessages(newMessages());
    setState('chats', globalMessages());
  }

  function submitMessage(currentMessage: string) {
    setText("");
    if (currentMessage.trim().length == 0) return;
    console.log(currentMessage);
    appendMessage(`${myPlayer().getState('name')}: ${currentMessage}`); /* { message: `${currentName}: ${currentMessage}`, owner: currentName } */
  }

  return (
    <>
      <div style = {{
        height: "20vh",
        "overflow": "auto",
      }}>
        {displayChat()}
      </div>
      <input
        disabled={isDisabled()}
        value={text()}
        type="text"
        onChange={(c) => setText(prevText => prevText = c.currentTarget.value)}
        onkeydown={(ev) => ev.key === "Enter" && guessChecker()}/>
      <button onClick={guessChecker}>Submit</button>
    </>
  );
}