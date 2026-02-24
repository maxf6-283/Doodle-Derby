import { createSignal, onMount, onCleanup, Show } from "solid-js";

import { RPC, getState, setState, myPlayer, PlayerState } from "playroomkit";

export const ChatGuesser = (props: { promptList: string[], artists: PlayerState[], notArtist: boolean }) => {
  let [text, setText] = createSignal("");
  let [isDisabled, setIsDisabled] = createSignal(false);
  let [prompts, setPrompts] = createSignal<string[]>(props.promptList);
  let [globalMessages, setGlobalMessages] = createSignal<string[]>([]);
  let [correctGuesses, setCorrectGuesses] = createSignal(0);

  const incrementGuess = () => {
    setCorrectGuesses(previousGuess => previousGuess + 1);
  }

  const removePrompt = (word: string) => {
    let newPrompts = prompts().filter(value => value !== word);
    setPrompts(newPrompts);
  }

  onMount(() => {
    let intervalId = setInterval(() => { setGlobalMessages(getState('chats') ?? []); }, 300);

    setPrompts(props.promptList);

    onCleanup(() => {
      clearInterval(intervalId);
    });
  });

  const guessChecker = () => {
    if (prompts().find(word => word === text().toLowerCase())) {
      removePrompt(text().toLowerCase());
      incrementGuess();

      let artist = props.artists.find(player => {
        return player.getState("prompt") === text().toLowerCase();
      });

      if (!artist) {
        console.error("Couldn't find artist to assign words to!");
        return;
      }

      // Update artist right guesses to decide how many points guesser recieves
      const rGuess: number = artist.getState('rightGuesses');
      let guess = rGuess;
      artist.setState('rightGuesses', rGuess + 1);

      const addArtistScore = (score_increment: number) => {
        const currentScore = artist.getState('score');
        console.log(artist.getState('name'), "gets", score_increment, "points!");
        artist.setState('score', currentScore + score_increment);
      };

      //add score for first guess
      let addition = 0;
      if (guess == 0) {
        addArtistScore(2);
        addition = 5;
      }
      else if (guess == 1) {
        addition = 3;
        addArtistScore(1);
      }
      else {
        addition = 1;
        addArtistScore(1);
      }

      const currentScore = myPlayer().getState('score');
      myPlayer().setState('score', currentScore + addition);
      console.log("Right guesses after: " + artist.getState('rightGuesses'));
      console.log("Player score: " + myPlayer().getState('score'));
      console.log("Artist score: " + artist.getState('score'));

      if (correctGuesses() == 2) {
        submitMessage("guessed both words!");
        setIsDisabled(true);
        RPC.call('playerGuessed', {}, RPC.Mode.HOST);
        return;
      }
      submitMessage("guessed a word!");
    } else {
      submitMessage(text());
    }

    if (correctGuesses() >= 2) {
      setIsDisabled(true);
    }
  }

  function displayChat() {
    let globalMessageList = globalMessages();
    if (!globalMessageList) return;
    return globalMessageList.map((message) => {
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
    console.log("Submitting message:", currentMessage);
    appendMessage(`${myPlayer().getState('name')}: ${currentMessage}`); /* { message: `${currentName}: ${currentMessage}`, owner: currentName } */
  }

  return (
    <>
      <div style={{
        height: "20vh",
        "overflow": "auto",
        border: "solid 4px blue"
      }}>
        {displayChat()}
      </div>
      <Show when={props.notArtist}>
        <input
          disabled={isDisabled()}
          value={text()}
          type="text"
          onChange={(c) => setText(prevText => prevText = c.currentTarget.value)}/>
        <button onClick={guessChecker}>Submit</button>
      </Show>
    </>
  );
}
