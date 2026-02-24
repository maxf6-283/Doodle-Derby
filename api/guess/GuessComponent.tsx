import { createSignal, onMount, onCleanup, Show, createEffect, For } from "solid-js";
import { RPC, getState, setState, myPlayer, PlayerState } from "playroomkit";
import { IconButton } from "../../src/components/IconButton";

export const ChatGuesser = (props: {
  promptList: string[];
  artists: PlayerState[];
  notArtist: boolean;
}) => {
  let chatAreaRef: HTMLDivElement | undefined;
  let [text, setText] = createSignal("");
  let [isDisabled, setIsDisabled] = createSignal(false);
  let [prompts, setPrompts] = createSignal<string[]>(props.promptList);
  let [globalMessages, setGlobalMessages] = createSignal<string[]>([]);
  let [correctGuesses, setCorrectGuesses] = createSignal(0);

  const MAX_MESSAGES = 50;

  onMount(() => {
    // Set initial chat messages
    setGlobalMessages(getState("chats") ?? []);

    const newChatClean = RPC.register("newChat", async (newMessage) => {
        setGlobalMessages(prevMessages => {
            let updatedMessages = [...prevMessages, newMessage.message];
            if (updatedMessages.length > MAX_MESSAGES) {
                updatedMessages = updatedMessages.slice(updatedMessages.length - MAX_MESSAGES);
            }
            // Also update the global state
            setState("chats", updatedMessages, true);
            return updatedMessages;
        });
    });

    setPrompts(props.promptList);

    onCleanup(() => {
        newChatClean();
    });
  });

  createEffect(() => {
  // Access the dependency to track it
  const messages = globalMessages(); 
  
  if (chatAreaRef) {
    // A zero-delay timeout pushes the scroll to the end of the event loop
    // ensuring the new <p> tags are already rendered.
    setTimeout(() => {
      chatAreaRef.scrollTop = chatAreaRef.scrollHeight;
    }, 0);
  }
});


  const incrementGuess = () => {
    setCorrectGuesses((previousGuess) => previousGuess + 1);
  };

  const removePrompt = (word: string) => {
    let newPrompts = prompts().filter((value) => value !== word);
    setPrompts(newPrompts);
  };

  const guessChecker = () => {
    if (prompts().find((word) => word === text().toLowerCase())) {
      removePrompt(text().toLowerCase());
      incrementGuess();

      let artist = props.artists.find((player) => {
        return player.getState("prompt") === text().toLowerCase();
      });

      if (!artist) {
        console.error("Couldn't find artist to assign words to!");
        return;
      }

      // Update artist right guesses to decide how many points guesser recieves
      const rGuess: number = artist.getState("rightGuesses");
      let guess = rGuess;
      artist.setState("rightGuesses", rGuess + 1);

      const addArtistScore = (score_increment: number) => {
        const currentScore = artist.getState("score");
        console.log(
          artist.getState("name"),
          "gets",
          score_increment,
          "points!",
        );
        artist.setState("score", currentScore + score_increment);
      };

      //add score for first guess
      let addition = 0;
      if (guess == 0) {
        addArtistScore(2);
        addition = 5;
      } else if (guess == 1) {
        addition = 3;
        addArtistScore(1);
      } else {
        addition = 1;
        addArtistScore(1);
      }

      const currentScore = myPlayer().getState("score");
      myPlayer().setState("score", currentScore + addition);
      console.log("Right guesses after: " + artist.getState("rightGuesses"));
      console.log("Player score: " + myPlayer().getState("score"));
      console.log("Artist score: " + artist.getState("score"));

      if (correctGuesses() == 2) {
        submitMessage("guessed both words!");
        setIsDisabled(true);
        RPC.call("playerGuessed", {}, RPC.Mode.HOST);
        return;
      }
      submitMessage("guessed a word!");
    } else {
      submitMessage(text());
    }

    if (correctGuesses() >= 2) {
      setIsDisabled(true);
    }
  };

  function displayChat() {
  return (
    <div class="chat-messages-area" ref={chatAreaRef}>
      <For each={globalMessages()}>
        {(message) => (
          <p class="chat-message-container">{message}</p>
        )}
      </For>
    </div>
  );
}

  function submitMessage(currentMessage: string) {
    setText("");
    if (currentMessage.trim().length == 0) return;
    const finalMessage = `${myPlayer().getState("name")}: ${currentMessage}`;
    RPC.call("newChat", { message: finalMessage }, RPC.Mode.ALL);
  }

  return (
    <>
      <div class="chat-container">
        {displayChat()}
        <Show when={props.notArtist}>
          <div class="chat-input-row">
            <input
              class="chat-input-textbox"
              disabled={isDisabled()}
              value={text()}
              type="text"
              onInput={(e) => setText(e.currentTarget.value)}
            />
            <IconButton defaultImg="/buttons/submit_icon.png" hoverImg="/buttons/submit_hovered_icon.png" onClick={() => guessChecker()}></IconButton>
          </div>
        </Show>
      </div>
    </>
  );
};
