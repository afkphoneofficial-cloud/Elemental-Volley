import { AudioSystem } from "./systems/AudioSystem.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { Session } from "./systems/Session.js";
import { I18n } from "./i18n/I18n.js?v=local277";
import { mountLobbyStage } from "./web/LobbyStage.js?v=local256";
import { mountOrientDock, placeOrientBtn } from "./web/OrientDock.js?v=local277";
import { GAME } from "./config/gameConfig.js";
import { applyContrast, applyShell } from "./systems/GameSettings.js?v=local260";
import { BootScene } from "./scenes/BootScene.js?v=local254";
import { AuthScene } from "./scenes/AuthScene.js?v=local272";
import { MenuScene } from "./scenes/MenuScene.js?v=local267";
import { HubScene } from "./scenes/HubScene.js?v=local275";
import { WelcomePop } from "./systems/WelcomePop.js?v=local253";
import { StarterScene } from "./scenes/StarterScene.js";
import { SelectScene } from "./scenes/SelectScene.js?v=local275";
import { ShopScene } from "./scenes/ShopScene.js?v=local205";
import { TopupScene } from "./scenes/TopupScene.js?v=local238";
import { PassScene } from "./scenes/PassScene.js?v=local238";
import { PlayScene } from "./scenes/PlayScene.js?v=local277";
import { LuckScene } from "./scenes/LuckScene.js?v=local272";
import { WikiScene } from "./scenes/WikiScene.js?v=local180";
import { ExploreScene } from "./scenes/ExploreScene.js?v=local206";
import { ResultScene } from "./scenes/ResultScene.js?v=local277";
import { SettingsScene } from "./scenes/SettingsScene.js?v=local277";
import { CareerScene } from "./scenes/CareerScene.js?v=local267";
import { QueueScene } from "./scenes/QueueScene.js?v=local275";
import { RankScene } from "./scenes/RankScene.js?v=local275";
import { SeasonScene } from "./scenes/SeasonScene.js?v=local210";
import { ModeScene } from "./scenes/ModeScene.js?v=local258";
import { DressScene } from "./scenes/DressScene.js?v=local271";
import { ChampLooksScene } from "./scenes/ChampLooksScene.js?v=local232";
import { GrowthScene } from "./scenes/GrowthScene.js?v=local228";
import { BagScene } from "./scenes/BagScene.js?v=local202";
import { NewsScene } from "./scenes/NewsScene.js?v=local216";
import { FriendsScene } from "./scenes/FriendsScene.js?v=local272";
import { ChatSystem } from "./systems/ChatSystem.js?v=local272";
import { TouchControls } from "./ui/TouchControls.js?v=local277";
import { mountRename } from "./ui/renameOverlay.js";
import { AuthSystem } from "./systems/AuthSystem.js";
import { NetPlay, mountExhibitInvite } from "./systems/NetPlay.js?v=local272";
import { mountLeaderboard } from "./systems/Leaderboard.js?v=local275";
import { BootSplash } from "./web/BootSplash.js?v=local248";
import { MaintGate } from "./web/MaintGate.js?v=local272";
import { TicketPop } from "./systems/TicketPop.js?v=local229";
import { SocialPop } from "./systems/SocialPop.js?v=local236";
import { InstallPop } from "./systems/InstallPop.js?v=local277";

BootSplash.bind();
AudioSystem.mountDock();
window.addEventListener("ev-boot-ready", () => {
  AudioSystem.playMenu();
  mountLobbyStage();
  InstallPop.tryShow();
}, { once: true });

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME.width,
  height: GAME.height,
  parent: "game",
  backgroundColor: "#0c0814",
  fps: { target: 60 },
  autoPause: false,
  render: { antialias: false, roundPixels: true },
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
  scene: [BootScene, AuthScene, MenuScene, HubScene, StarterScene, SelectScene, LuckScene, ShopScene, TopupScene, PassScene, PlayScene, ResultScene, WikiScene, ExploreScene, SettingsScene, CareerScene, QueueScene, RankScene, SeasonScene, ModeScene, FriendsScene, DressScene, ChampLooksScene, GrowthScene, BagScene, NewsScene]
});

SaveSystem.load();
I18n.load();
applyContrast();
applyShell();
I18n.mountToggle();
TouchControls.mount();
ChatSystem.mount();
WelcomePop.mount();
InstallPop.mount();
TicketPop.mount();
SocialPop.mount();
mountRename();
MaintGate.mount();
mountExhibitInvite();
mountLeaderboard();
NetPlay.on((msg) => {
  const g = window.game;
  if (!g || !g.scene) return;
  const live = g.scene.getScenes(true)[0];
  if (!live) return;
  const key = live.scene.key;
  if (msg.t === "luck" && key !== "luck" && key !== "queue") {
    if (NetPlay.settled || key === "result" || key === "auth" || key === "hub" || key === "select") return;
    Session.net = true;
    Session.netHost = msg.host === true;
    if (msg.mode === "exhibit" || msg.mode === "pvp") Session.mode = msg.mode;
    else if (Session.mode !== "pvp") Session.mode = "exhibit";
    live.scene.start("luck", msg);
  }
  if ((msg.t === "go" || msg.t === "rejoin") && key !== "play") {
    if (NetPlay.settled || key === "result" || key === "auth" || key === "hub" || key === "select" || key === "queue") return;
    const luck = NetPlay.lastLuck;
    if (msg.t === "go" && luck && luck.roomId === msg.roomId && key !== "luck") {
      Session.net = true;
      live.scene.start("luck", luck);
      return;
    }
    live.scene.start("play");
  }
  if (msg.t === "end" && (key === "luck")) {
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
  const spin = document.documentElement.classList.contains("ev-spin-land");
  let vw = vv ? vv.width : window.innerWidth;
  let vh = vv ? vv.height : window.innerHeight;
  if (spin) {
    const long = Math.max(vw, vh);
    const short = Math.min(vw, vh);
    vw = long;
    vh = short;
  }
  if (wrap && !spin) {
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
  placeOrientBtn();
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
mountOrientDock(() => layoutShell());
