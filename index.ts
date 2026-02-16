import { LobbyPage } from "./lobby"
import { PickWordsPage } from "./pick-words"
import { GameplayPage } from "./gameplay_page";
import { LandingPage } from "./landing_page";

import { routerNavigate, addPage } from "./tiny_router";

addPage("/", LandingPage);
addPage("/lobby", LobbyPage);
addPage("/pick-words", PickWordsPage);
addPage("/game", GameplayPage);

routerNavigate("/");
