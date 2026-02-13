import { Page } from "./page";
import { render } from "solid-js/web"

export const GameplayPage: Page = {
  render(root: HTMLElement) {
    root.innerHTML = "";
    render(() => (<h1>Hello World!</h1>), root);
  }
}
