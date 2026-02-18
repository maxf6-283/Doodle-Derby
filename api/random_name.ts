
// it's important that the names
// of players are set immediately when they join, 
// so that they can be used in the lobby and in the game
export async function getRandomName(maxNameLength: number): Promise<string> {
  const randomNumber = Math.floor(Math.random() * 100);

  // fetch random name from https://namey.muffinlabs.com/
  return fetch("https://namey.muffinlabs.com/name.json?count=1&with_surname=false")
    .then((response) => response.json())
    .then(data => {
      let name = data[0].substring(0, maxNameLength);
      return name + randomNumber.toString();
    }).catch(() => {
      // this is guaranteed to be < maxNameLength, so it will always fit
      return "Player" + randomNumber.toString();
    });
}
