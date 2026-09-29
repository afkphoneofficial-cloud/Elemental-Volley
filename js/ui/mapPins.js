/** Full-circle tap target. Geom at (0,0) misses because Circle origin is center. */
export function pinHit(scene, x, y, r, depth, onClick) {
  const d = Math.max(24, r * 2);
  const hit = scene.add.zone(x, y, d, d).setOrigin(0.5).setDepth(depth);
  hit.setInteractive({
    hitArea: new Phaser.Geom.Circle(d / 2, d / 2, r),
    hitAreaCallback: Phaser.Geom.Circle.Contains,
    useHandCursor: true
  });
  hit.on("pointerdown", onClick);
  return hit;
}
