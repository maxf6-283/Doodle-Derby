import { LobbyPage } from "./pages/lobby_page"
import { PickWordsPage } from "./pages/pick_words_page"
import { GameplayPage } from "./pages/gameplay_page";
import { LandingPage } from "./pages/landing_page";
import { PodiumPage } from "./pages/podium_page";

import { routerNavigate, addPage } from "../api/tiny_router";

addPage("/", LandingPage);
addPage("/lobby", LobbyPage);
addPage("/pick-words", PickWordsPage);
addPage("/game", GameplayPage);
addPage("/podium-page", PodiumPage)

routerNavigate("/");
