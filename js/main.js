import { AudioSystem } from "./systems/AudioSystem.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { Session } from "./systems/Session.js";
import { I18n } from "./i18n/I18n.js";
import { mountLobbyStage } from "./web/LobbyStage.js";
import { GAME } from "./config/gameConfig.js";
import { applyContrast } from "./systems/GameSettings.js";
import { BootScene } from "./scenes/BootScene.js";
import { AuthScene } from "./scenes/AuthScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { HubScene } from "./scenes/HubScene.js?v=local179";
import { StarterScene } from "./scenes/StarterScene.js";
import { SelectScene } from "./scenes/SelectScene.js";
import { ShopScene } from "./scenes/ShopScene.js?v=local172";
import { TopupScene } from "./scenes/TopupScene.js";
import { PassScene } from "./scenes/PassScene.js?v=local172";
import { PlayScene } from "./scenes/PlayScene.js";
import { LuckScene } from "./scenes/LuckScene.js";
import { WikiScene } from "./scenes/WikiScene.js";
import { ExploreScene } from "./scenes/ExploreScene.js";
import { ResultScene } from "./scenes/ResultScene.js?v=local175";
import { SettingsScene } from "./scenes/SettingsScene.js";
import { CareerScene } from "./scenes/CareerScene.js";
import { QueueScene } from "./scenes/QueueScene.js";
import { RankScene } from "./scenes/RankScene.js";
import { SeasonScene } from "./scenes/SeasonScene.js";
import { ModeScene } from "./scenes/ModeScene.js";
import { DressScene } from "./scenes/DressScene.js";
import { GrowthScene } from "./scenes/GrowthScene.js";
import { BagScene } from "./scenes/BagScene.js";
import { NewsScene } from "./scenes/NewsScene.js";
import { FriendsScene } from "./scenes/FriendsScene.js";
import { ChatSystem } from "./systems/ChatSystem.js";
import { TouchControls } from "./ui/TouchControls.js";
import { AuthSystem } from "./systems/AuthSystem.js";
import { NetPlay, mountExhibitInvite } from "./systems/NetPlay.js";
import { mountLeaderboard } from "./systems/Leaderboard.js";
import { BootSplash } from "./web/BootSplash.js";

BootSplash.bind();
AudioSystem.mountDock();
AudioSystem.playMenu();

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME.width,
  height: GAME.height,
  parent: "game",
  backgroundColor: "#0c0814",
  fps: { target: 60 },
  autoPause: false,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
    parent: "game",
    width: GAME.width,
    height: GAME.height
  },
  scene: [BootScene, AuthScene, MenuScene, HubScene, StarterScene, SelectScene, LuckScene, ShopScene, TopupScene, PassScene, PlayScene, ResultScene, WikiScene, ExploreScene, SettingsScene, CareerScene, QueueScene, RankScene, SeasonScene, ModeScene, FriendsScene, DressScene, GrowthScene, BagScene, NewsScene]
});

SaveSystem.load();
I18n.load();
applyContrast();
I18n.mountToggle();
mountLobbyStage();
TouchControls.mount();
ChatSystem.mount();
mountExhibitInvite();
mountLeaderboard();
NetPlay.on((msg) => {
  const g = window.game;
  if (!g || !g.scene) return;
  const live = g.scene.getScenes(true)[0];
  if (!live) return;
  const key = live.scene.key;
  if (msg.t === "luck" && key !== "luck" && key !== "queue") {
    Session.net = true;
    Session.netHost = msg.host === true;
    if (msg.mode === "exhibit" || msg.mode === "pvp") Session.mode = msg.mode;
    else if (Session.mode !== "pvp") Session.mode = "exhibit";
    live.scene.start("luck", msg);
  }
  if ((msg.t === "go" || msg.t === "rejoin") && key !== "play") {
    const luck = NetPlay.lastLuck;
    if (msg.t === "go" && luck && luck.roomId === msg.roomId && key !== "luck") {
      Session.net = true;
      live.scene.start("luck", luck);
      return;
    }
    live.scene.start("play");
  }
  if (msg.t === "end" && key !== "play" && key !== "result") {
    const me = AuthSystem.session && AuthSystem.session();
    const youLost = me && msg.loserId && msg.loserId === me.id;
    live.scene.start("result", {
      winner: youLost ? 2 : 1,
      score: msg.score || { p1: 0, p2: 0 },
      courtId: msg.courtId || Session.courtId || "summer",
      youId: Session.playerId,
      botId: Session.botId,
      stats: {}
    });
  }
});
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
  ChatSystem.layout();
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
document.addEventListener("fullscreenchange", layoutShell);
document.addEventListener("webkitfullscreenchange", layoutShell);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", layoutShell);
  window.visualViewport.addEventListener("scroll", layoutShell);
}
layoutShell();
