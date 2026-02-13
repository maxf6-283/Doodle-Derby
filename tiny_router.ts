
import { Page } from "./page"

let currentPage: Page | null = null

let pages: Map<string, Page> = new Map();

export function addPage(relativePath: string, page: Page) {
  pages.set(relativePath, page);
}

export function getPage(relativepath: string): Page | null {
  return pages.get(relativepath) || null;
}

export function routerNavigate(relativePath: string) {
  if (!pages.has(relativePath)) {
    console.error(`${relativePath} could not be found, therefore can't switch!`);
    return;
  }

  const app = document.getElementById("app") as HTMLDivElement;
  if (currentPage?.onEnd) {
    currentPage.onEnd();
  }

  app.innerHTML = "";

  currentPage = pages.get(relativePath) as Page;
  currentPage.render(app);

  // Think about history later!
  // history.pushState({}, "", relativePath);
}
