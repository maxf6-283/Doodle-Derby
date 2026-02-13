
export interface Page {
  render(root: HTMLElement): void;
  onEnd?(): void;
}
