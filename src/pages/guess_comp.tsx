import { Page } from '../../api/page';

import { createSignal, onMount, onCleanup } from "solid-js";

import { RPC, getState, setState, myPlayer } from "playroomkit";
import { render } from 'solid-js/web';

export const ChatGuesser = () => {
  let [text, setText] = createSignal("");
  let [isDisabled, setIsDisabled] = createSignal(false);
  let [guessedWords, setGuessedWords] = createSignal(new Array<string>());

  let [globalMessages, setGlobalMessages] = createSignal(new Array<string>());
  setState('chats', guessedWords());

  let intervalId: NodeJS.Timeout;

  let promptSet: string[] = getState("promptList");

  // let guessCounter = 0;
  let correctGuesses = 0;

  onMount(() => {
    intervalId = setInterval(() => {setGlobalMessages(getState('chats'));}, 300);
  });

  const guessChecker = () => {
    if (promptSet.find(word => word === text().toLowerCase())) {
      correctGuesses++;
      if (correctGuesses == 2) {
        submitMessage("guessed both word!");
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

  onCleanup(() => {
    clearInterval(intervalId);
  });

  return (
    <>
      <div style = {{
        height: "20vh",
        "overflow": "auto",
        "display": "flex",
        "flex-direction": "column-reverse"
      }}>
        {displayChat()}
      </div>
      <input disabled={isDisabled()} type="text" onChange={(c) => setText(text => text = c.currentTarget.value)} />
      <button onClick={guessChecker}>Submit</button>
    </>
  );
}

export const SpectatorChat: Page = {
  async render(root: HTMLElement) {
    this.onEnd = render(() => <ChatGuesser />, root);
  },
};