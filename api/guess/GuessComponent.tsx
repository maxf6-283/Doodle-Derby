import { createSignal, onMount, onCleanup, Show, Index} from "solid-js";

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


export function GuessElement(props: { prompt: string }) {
    let [text, setText] = createSignal("");
    let containerRef: HTMLDivElement | undefined;


    const handleClick = () => {
        const inputs = containerRef?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        let hasInput = Array.from(inputs).find(input => input.value);
        if (inputs) {
            if (!hasInput) inputs[0].focus();
        }
    };

    const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
        const input = e.currentTarget;
        if (input.value.length >= 1) {
            const next = input.parentElement?.nextElementSibling?.querySelector('input');
            if (next) (next as HTMLInputElement).focus();
        }
    };

    const readingInput = () => {
        const inputs = containerRef?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

        let currentInput = "";
        inputs.forEach((input) => {
            currentInput += input.value;
        });
        setText(currentInput);
        console.log(currentInput);
    };
    return (
        <>
            <div class="guessContainer" ref={containerRef} onClick={handleClick}>
                <Index each={props.prompt.split("")}>
                    {(char, i) => (
                        <div class="input-unit">
                            {char() === " " ? (
                                <div class="space" style={{ width: "20px" }}></div>
                            ) : (
                                <>
                                    <input
                                        class="letter-input"
                                        type="text"
                                        maxlength="1"
                                        onInput={(e) => handleInput(e)}
                                        onChange={readingInput}
                                        autocomplete="off"
                                    />
                                    <div class="bold-dash"></div>
                                </>
                            )}
                        </div>
                    )}
                </Index>
            </div>
            <style>
                {
                    `.guessContainer {
                position: relative;
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 2rem;
            }

            .input-unit {
                position: relative;
                top:100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .letter-input {
                width: 40px;
                background: transparent;
                border: none;
                text-align: center;
                font-size: 2.5rem;
                font-weight: 500;
                color: #2c3e50;
                text-transform: uppercase;
                outline: none;
            }

            .bold-dash {
                width: 100%;
                height: 6px;
                background-color: #2c3e50;
                border-radius: 10px;
            }`
                }
            </style>
        </>
    );
}
