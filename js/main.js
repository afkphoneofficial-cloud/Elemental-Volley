import { AudioSystem } from "./systems/AudioSystem.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { I18n } from "./i18n/I18n.js";
import { mountLobbyStage } from "./web/LobbyStage.js";
import { GAME } from "./config/gameConfig.js";
import { BootScene } from "./scenes/BootScene.js";
import { AuthScene } from "./scenes/AuthScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { HubScene } from "./scenes/HubScene.js";
import { StarterScene } from "./scenes/StarterScene.js";
import { SelectScene } from "./scenes/SelectScene.js";
import { ShopScene } from "./scenes/ShopScene.js";
import { PlayScene } from "./scenes/PlayScene.js";
import { LuckScene } from "./scenes/LuckScene.js";
import { WikiScene } from "./scenes/WikiScene.js";
import { ResultScene } from "./scenes/ResultScene.js";

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME.width,
  height: GAME.height,
  parent: "game",
  backgroundColor: "#0c0814",
  fps: { target: 60 },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, AuthScene, MenuScene, HubScene, StarterScene, SelectScene, LuckScene, ShopScene, PlayScene, ResultScene, WikiScene]
});

AudioSystem.mountDock();
SaveSystem.load();
I18n.load();
I18n.mountToggle();
mountLobbyStage();
