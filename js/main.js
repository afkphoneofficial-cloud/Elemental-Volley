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
import { SettingsScene } from "./scenes/SettingsScene.js";
import { CareerScene } from "./scenes/CareerScene.js";
import { QueueScene } from "./scenes/QueueScene.js";
import { RankScene } from "./scenes/RankScene.js";
import { ModeScene } from "./scenes/ModeScene.js";
import { FriendsScene } from "./scenes/FriendsScene.js";
import { TouchControls } from "./ui/TouchControls.js";

AudioSystem.mountDock();
AudioSystem.playMenu();

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
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game",
    width: GAME.width,
    height: GAME.height
  },
  scene: [BootScene, AuthScene, MenuScene, HubScene, StarterScene, SelectScene, LuckScene, ShopScene, PlayScene, ResultScene, WikiScene, SettingsScene, CareerScene, QueueScene, RankScene, ModeScene, FriendsScene]
});

SaveSystem.load();
I18n.load();
I18n.mountToggle();
mountLobbyStage();
TouchControls.mount();
const layoutShell = () => {
  const wrap = document.getElementById("wrap");
  const box = document.getElementById("game");
  const vv = window.visualViewport;
  const vw = vv ? vv.width : window.innerWidth;
  const vh = vv ? vv.height : window.innerHeight;
  if (wrap) {
    wrap.style.top = (vv ? vv.offsetTop : 0) + "px";
    wrap.style.left = (vv ? vv.offsetLeft : 0) + "px";
    wrap.style.width = vw + "px";
    wrap.style.height = vh + "px";
  }
  TouchControls.sync();
  if (box) {
    const cap = document.documentElement.dataset.control === "pc" ? 1280 : Number.POSITIVE_INFINITY;
    const width = Math.min(vw, vh * (16 / 9), cap);
    const height = width * (9 / 16);
    box.style.width = Math.round(width) + "px";
    box.style.height = Math.round(height) + "px";
  }
  if (window.game && window.game.scale) window.game.scale.refresh();
};
window.addEventListener("resize", layoutShell);
window.addEventListener("orientationchange", () => setTimeout(layoutShell, 200));
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", layoutShell);
  window.visualViewport.addEventListener("scroll", layoutShell);
}
layoutShell();
