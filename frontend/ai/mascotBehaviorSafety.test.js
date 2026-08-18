/**
 * FASE 21.6B.7A + 21.6B.7B — production dock safety contracts (source-level).
 * Run: node --test frontend/ai/mascotBehaviorSafety.test.js
 */
const { readFileSync, existsSync } = require("node:fs");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const statesPath = path.join(__dirname, "mascotStates.ts");
const controllerPath = path.join(ROOT, "hooks/useMascotController.ts");
const manifestPath = path.join(ROOT, "sprites/spriteManifest.ts");
const spriteSystemPath = path.join(ROOT, "components/mascots/ChicoDumboSpriteSystem.tsx");
const cssPath = path.join(ROOT, "styles/mascot-sprites.css");
const bannerPath = path.join(ROOT, "components/diagnostic/DiagnosticPromoBanner.tsx");

describe("21.6B.7A mascot behavior safety", () => {
  const states = readFileSync(statesPath, "utf8");
  const controller = readFileSync(controllerPath, "utf8");

  it("hover must not assign walking", () => {
    const hoverBlock = states.match(/case "hover":[\s\S]*?case "idle":/);
    assert.ok(hoverBlock, "hover case missing");
    assert.doesNotMatch(hoverBlock[0], /walking/);
    assert.match(hoverBlock[0], /return baseState/);
  });

  it("formSuccess must not assign playing / role-specialized stand|sit", () => {
    const block = states.match(/case "formSuccess":[\s\S]*?case "formError":/);
    assert.ok(block);
    assert.doesNotMatch(block[0], /playing|stand|"sit"/);
  });

  it("formEventSprites only uses looking + idle (neutral V1)", () => {
    const start = states.indexOf("export function formEventSprites");
    assert.ok(start >= 0);
    const block = states.slice(start, start + 700);
    assert.match(block, /looking/);
    assert.doesNotMatch(block, /walking|stand|"sit"|playing|guiding/);
    assert.doesNotMatch(block, /chico: "looking", dumbo: "looking"/);
  });

  it("chatActiveSprites uses stand/sit ready states, not guiding/guarding/walk", () => {
    const start = states.indexOf("export function chatActiveSprites");
    assert.ok(start >= 0);
    const block = states.slice(start, start + 450);
    assert.doesNotMatch(block, /guiding|guarding|walking/);
    assert.match(block, /stand/);
    assert.match(block, /sit/);
  });

  it("dead ambient/meet/play stubs removed after 7D", () => {
    assert.doesNotMatch(states, /export function nextAmbientSprites/);
    assert.doesNotMatch(states, /export function meetSprites/);
    assert.doesNotMatch(states, /export function playSprites/);
    assert.doesNotMatch(states, /chatOpenSprites/);
  });

  it("controller must not start walk/ambient/meet autonomy loops", () => {
    assert.doesNotMatch(controller, /nextChicoWalkFrame|shouldLoopChicoWalk/);
    assert.doesNotMatch(controller, /nextAmbientSprites|meetSprites|playSprites/);
    assert.doesNotMatch(controller, /scheduleMicro|runMajorPatrol|scheduleMeet/);
    assert.doesNotMatch(controller, /gsap/);
  });

  it("controller keeps long-idle session timer", () => {
    assert.match(controller, /USER_ACTIVITY_TIMEOUT_MS/);
    assert.match(controller, /restingChicoSprite/);
  });
});

describe("21.7A.1 event-driven idle timeout", () => {
  const controller = readFileSync(controllerPath, "utf8");
  const idleTimerPath = path.join(__dirname, "mascotIdleTimer.ts");
  const idleTimer = readFileSync(idleTimerPath, "utf8");

  it("dock idle path has no setInterval / 240ms poll", () => {
    assert.doesNotMatch(controller, /setInterval/);
    assert.doesNotMatch(controller, /,\s*240\)/);
    assert.doesNotMatch(idleTimer, /setInterval/);
    assert.doesNotMatch(idleTimer, /,\s*240\s*\)/);
  });

  it("idle timeout is a single one-shot owner", () => {
    assert.match(controller, /createMascotIdleTimer/);
    assert.match(controller, /timer\.bumpActivity\(\)/);
    assert.match(controller, /timer\.dispose\(\)/);
    assert.match(idleTimer, /clearTimeout/);
    assert.match(idleTimer, /setTimeout/);
    assert.match(idleTimer, /MAX_PENDING_IDLE_TIMEOUTS = 1/);
  });

  it("activity listener set is unchanged", () => {
    assert.match(controller, /addEventListener\("scroll"/);
    assert.match(controller, /addEventListener\("click"/);
    assert.match(controller, /addEventListener\("keydown"/);
    assert.match(controller, /addEventListener\("touchstart"/);
    assert.match(controller, /addEventListener\("focusin"/);
    assert.match(controller, /addEventListener\("mousemove"/);
    assert.doesNotMatch(controller, /pointermove|pointerdown|visibilitychange/);
  });

  it("resting sprite selection and V1 contracts stay in controller", () => {
    assert.match(controller, /restingChicoSprite/);
    assert.match(controller, /restingDumboSprite/);
    assert.match(controller, /chatOpen \? chatPersona : "none"/);
    assert.doesNotMatch(controller, /"walking"|walk_0|"walk"/);
  });
});

describe("21.6B.7B one-active + V1 enforcement", () => {
  const states = readFileSync(statesPath, "utf8");
  const controller = readFileSync(controllerPath, "utf8");
  const manifest = readFileSync(manifestPath, "utf8");
  const spriteSystem = readFileSync(spriteSystemPath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  it("ACTIVE_MASCOT owner derives from chat open ? persona : none", () => {
    assert.match(controller, /activeMascot/);
    assert.match(controller, /chatOpen \? chatPersona : "none"/);
    assert.match(controller, /chatActiveSprites/);
  });

  it("chat open maps Chico STAND + Dumbo SIT; inactive idle", () => {
    const start = states.indexOf("export function chatActiveSprites");
    const block = states.slice(start, start + 400);
    assert.match(block, /chico: "stand"/);
    assert.match(block, /dumbo: "sit"/);
    assert.match(block, /chico: "idle"/);
    assert.match(block, /dumbo: "idle"/);
  });

  it("Chico STAND asset is chico_esperando.png", () => {
    assert.match(manifest, /stand:\s*"\/mascots\/chico\/chico_esperando\.png"/);
    assert.ok(
      existsSync(path.join(ROOT, "public/mascots/chico/chico_esperando.png")),
      "chico_esperando.png missing"
    );
  });

  it("Dumbo LOOK uses esperando_atento, not vistacielo", () => {
    const dumboBlock = manifest.slice(manifest.indexOf("export const dumboSprites"));
    const looking = dumboBlock.match(/looking:\s*"([^"]+)"/);
    assert.ok(looking);
    assert.equal(looking[1], "/mascots/dumbo/dumbo_esperando_atento.png");
    assert.doesNotMatch(looking[1], /vistacielo/);
  });

  it("production V1 state lists exclude walk", () => {
    assert.match(states, /CHICO_V1_STATES/);
    assert.match(states, /DUMBO_V1_STATES/);
    assert.doesNotMatch(states.match(/CHICO_V1_STATES[\s\S]*?;/)[0], /walk/);
    assert.doesNotMatch(states.match(/DUMBO_V1_STATES[\s\S]*?;/)[0], /walk/);
  });

  it("WALK never selected on production controller path", () => {
    assert.doesNotMatch(controller, /"walking"|walk_0|"walk"/);
    assert.doesNotMatch(controller, /walkFrames/);
  });

  it("keyboard Enter/Space open assistants (with preventDefault)", () => {
    assert.match(spriteSystem, /activateLauncherKey/);
    assert.match(spriteSystem, /event\.key !== "Enter"/);
    assert.match(spriteSystem, /preventDefault/);
    assert.match(spriteSystem, /onKeyDown=\{\(event\) => activateLauncherKey\(event, openChico\)\}/);
    assert.match(spriteSystem, /onKeyDown=\{\(event\) => activateLauncherKey\(event, openDumbo\)\}/);
  });

  it("pause control min interactive target >= 44px", () => {
    const compact = css.match(/\.mascot__pause--compact\{[\s\S]*?\n\}/);
    assert.ok(compact);
    assert.match(compact[0], /min-height:\s*44px/);
    // mobile override must not regress below 44px
    const mobile = css.match(/@media\(max-width:860px\)\{[\s\S]*?\.mascot__pause--compact\{[\s\S]*?\n\s*\}/);
    assert.ok(mobile, "mobile pause compact block missing");
    assert.match(mobile[0], /min-height:\s*44px/);
    assert.doesNotMatch(mobile[0], /height:\s*28px/);
  });

  it("sprite launchers expose focus-visible outline", () => {
    assert.match(css, /\.mascot__sprite-button:focus-visible/);
  });

  it("mascot bubbles do not capture pointer events", () => {
    assert.match(css, /\.mascot__bubble\{[\s\S]*?pointer-events:\s*none/);
  });

  it("reduced-motion disables dock translate", () => {
    const rm = css.match(/@media \(prefers-reduced-motion: reduce\)\{[\s\S]*?\n\}/);
    assert.ok(rm);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /\.mascot--chico,\s*\n\s*\.mascot--dumbo\{/);
    assert.match(css, /transform:scale\(var\(--mascot-scale/);
    assert.match(controller, /prefersReducedMotion/);
    assert.match(controller, /zeroDockMotion/);
  });

  it("legacy vistacielo remains in manifest but not production LOOK", () => {
    assert.match(manifest, /vistacielo/);
    assert.match(states, /vistacielo/);
    assert.match(states, /productionAssetIsV1/);
  });

  it("DiagnosticPromoBanner file untouched by 7B scope (path exists)", () => {
    assert.ok(existsSync(bannerPath));
  });
});

describe("21.6B.7D legacy dead-code cleanup", () => {
  const states = readFileSync(statesPath, "utf8");
  const controller = readFileSync(controllerPath, "utf8");
  const css = readFileSync(cssPath, "utf8");
  const autonomyPath = path.join(__dirname, "mascotAutonomy.ts");
  const animatorPath = path.join(ROOT, "animations/spriteAnimator.ts");
  const autonomy = readFileSync(autonomyPath, "utf8");

  it("spriteAnimator.ts is globally removed", () => {
    assert.equal(existsSync(animatorPath), false);
  });

  it("mascotAutonomy keeps only USER_ACTIVITY_TIMEOUT_MS", () => {
    assert.match(autonomy, /USER_ACTIVITY_TIMEOUT_MS/);
    assert.doesNotMatch(autonomy, /AUTONOMY_MICRO|getDockMotionLimits|getMeetTargets|withChatBias|randBetween/);
  });

  it("dock CSS has no legacy motion keyframes", () => {
    assert.doesNotMatch(css, /@keyframes mascot(Walk|Jump|Breath|Blink|Turn|Alert|Rest)/);
    assert.doesNotMatch(css, /\.mascot__state--walk_01/);
  });

  it("controller still enforces one-active + V1 ready path", () => {
    assert.match(controller, /activeMascot/);
    assert.match(controller, /chatActiveSprites/);
    assert.doesNotMatch(controller, /walkFrames|spriteAnimator/);
  });

  it("states retain V1 helpers used by dock", () => {
    assert.match(states, /export function chatActiveSprites/);
    assert.match(states, /export function formEventSprites/);
    assert.match(states, /export function restingChicoSprite/);
    assert.match(states, /CHICO_V1_STATES/);
  });

  it("DiagnosticPromoBanner is static — no walk assets or motion loops", () => {
    assert.ok(existsSync(bannerPath));
    const banner = readFileSync(bannerPath, "utf8");
    assert.doesNotMatch(banner, /caminando|corriendo/);
    assert.doesNotMatch(banner, /setInterval/);
    assert.doesNotMatch(banner, /framer-motion|from "framer-motion"/);
    assert.doesNotMatch(banner, /WALK_FRAMES|dumboEntering|chicoEntering/);
    assert.match(banner, /dumbo_sentado_atento\.png/);
    assert.match(banner, /data-banner-static="true"/);
    assert.match(banner, /min-h-\[44px\]/);
    assert.doesNotMatch(banner, /useMascotPauseControl|showPauseFor/);
  });
});

describe("21.6B.9A form-event one-active (no dual LOOK)", () => {
  const states = readFileSync(statesPath, "utf8");
  const controller = readFileSync(controllerPath, "utf8");

  function formEventSpritesBlock() {
    const start = states.indexOf("export function formEventSprites");
    assert.ok(start >= 0, "formEventSprites missing");
    return states.slice(start, start + 900);
  }

  it("form event + no active mascot: both REST", () => {
    const block = formEventSpritesBlock();
    assert.match(block, /if \(active === "chico"\)/);
    assert.match(block, /if \(active === "dumbo"\)/);
    assert.match(block, /return \{ chico: "idle", dumbo: "idle" \}/);
    assert.doesNotMatch(block, /chico: "looking", dumbo: "looking"/);
  });

  it("form event + Chico active: Chico LOOK / Dumbo REST", () => {
    const block = formEventSpritesBlock();
    assert.match(block, /active === "chico"\) return \{ chico: "looking", dumbo: "idle" \}/);
  });

  it("form event + Dumbo active: Chico REST / Dumbo LOOK", () => {
    const block = formEventSpritesBlock();
    assert.match(block, /active === "dumbo"\) return \{ chico: "idle", dumbo: "looking" \}/);
  });

  it("no automatic persona selection on form events", () => {
    const block = formEventSpritesBlock();
    assert.doesNotMatch(block, /openChat|setPersona|chatPersona\s*=/);
    assert.match(controller, /formEventSprites\(activeMascot\)/);
    assert.match(controller, /activeMascot: ActiveMascot = chatOpen \? chatPersona : "none"/);
    assert.doesNotMatch(controller, /formStart[\s\S]{0,400}openChat/);
  });

  it("WALK remains unreachable on form + controller path", () => {
    const block = formEventSpritesBlock();
    assert.doesNotMatch(block, /walking|walk_0|"walk"/);
    assert.doesNotMatch(controller, /"walking"|walk_0|"walk"/);
  });

  it("one-active remains enforced", () => {
    assert.match(controller, /chatOpen \? chatPersona : "none"/);
    assert.match(states, /ROLE_SEMANTICS_FROZEN = YES \(R2 soft\)/);
    assert.doesNotMatch(states, /ROLE_SEMANTICS_FROZEN = NO/);
    const block = formEventSpritesBlock();
    assert.match(block, /return \{ chico: "idle", dumbo: "idle" \}/);
    assert.doesNotMatch(block, /chico: "looking", dumbo: "looking"/);
  });
});
