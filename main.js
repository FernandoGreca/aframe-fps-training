window.GAME_STATE = {
  paused: false,
  playing: false,
};

const randRange = (min, max) => Math.random() * (max - min) + min;
const THREE_REF = AFRAME.THREE;

const formatTime = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

function toggleGameplayUI(show) {
  const hud = document.getElementById("hud");
  const reticle = document.getElementById("reticle");
  const helper = document.getElementById("helper");

  if (hud) hud.classList.toggle("hidden", !show);
  if (reticle) reticle.classList.toggle("hidden", !show);
  if (helper) helper.classList.toggle("hidden", !show);
}

function setGamePaused(paused) {
  const scene = document.getElementById("scene");
  const pauseOverlay = document.getElementById("pauseOverlay");
  const helper = document.getElementById("helper");
  const reticle = document.getElementById("reticle");

  window.GAME_STATE.paused = paused;

  if (paused) {
    scene.pause();
    if (window.GAME_STATE.playing) pauseOverlay.style.display = "flex";
    if (helper) helper.style.display = "none";
    if (reticle) reticle.style.display = "none";
  } else {
    scene.play();
    pauseOverlay.style.display = "none";
    if (window.GAME_STATE.playing) {
      if (helper) helper.style.display = "block";
      if (reticle) reticle.style.display = "block";
    }
  }
}

AFRAME.registerComponent("game-environment", {
  schema: {
    spawnInterval: { default: 1200 },
    maxTargets: { default: 15 },
  },

  init: function () {
    this.lastSpawnTime = 0;
    this.score = 0;
    this.scoreEl = document.getElementById("score");
    this.timerEl = document.getElementById("timer");
    this.timerWrap = document.getElementById("timerWrap");
    this.cameraEl = document.getElementById("camera");
    this.targets = [];

    this.targetQuota = 1;
    this.playing = false;
    this.endTime = null;
    this.currentConfig = null;
  },

  tick: function () {
    if (!this.playing || window.GAME_STATE.paused) return;

    const remaining = this.endTime - Date.now();
    if (remaining <= 0) {
      this.updateTimer(0);
      this.finishGame();
      return;
    }
    this.updateTimer(remaining);

    this.maintainTargets();
  },

  startGame: function (options) {
    this.clearTargets();
    this.targetQuota = Math.min(Math.max(options.targetCount, 1), 15);
    this.currentConfig = { targetCount: this.targetQuota };

    this.score = 0;
    this.updateScoreDisplay();

    this.endTime = Date.now() + 60000;
    this.updateTimer(60000);
    if (this.timerWrap) {
      this.timerWrap.style.display = "inline-block";
    }

    this.playing = true;
    window.GAME_STATE.playing = true;
    window.GAME_STATE.paused = false;

    this.maintainTargets(true);
  },

  finishGame: function () {
    if (!this.playing) return;

    this.playing = false;
    window.GAME_STATE.playing = false;
    window.GAME_STATE.paused = false;
    this.clearTargets();

    if (document.pointerLockElement) document.exitPointerLock();
    this.el.emit("game-over", { score: this.score });
  },

  updateScoreDisplay: function () {
    if (this.scoreEl) this.scoreEl.textContent = this.score;
  },

  updateTimer: function (ms) {
    if (!this.timerEl) return;
    this.timerEl.textContent = formatTime(ms);
  },

  addScore: function (points) {
    this.score += points;
    this.updateScoreDisplay();
  },

  removeTarget: function (targetEl) {
    const idx = this.targets.indexOf(targetEl);
    if (idx !== -1) this.targets.splice(idx, 1);
    if (targetEl && targetEl.parentNode) targetEl.remove();
  },

  clearTargets: function () {
    while (this.targets.length) {
      const t = this.targets.pop();
      if (t && t.parentNode) t.remove();
    }
  },

  maintainTargets: function (force) {
    if (!this.cameraEl) return;
    const desired = Math.min(Math.max(this.targetQuota, 1), this.data.maxTargets);
    if (!force && this.targets.length >= desired) return;
    while (this.targets.length < desired) {
      this.spawnTarget();
    }
  },

  handleTargetHit: function (targetEl) {
    this.addScore(1);
    this.removeTarget(targetEl);

    if (!this.playing) return;
    this.maintainTargets();
  },

  spawnTarget: function () {
    const camObj = this.cameraEl.object3D;

    const target = document.createElement("a-entity");
    target.setAttribute(
      "geometry",
      "primitive: box; width: 0.6; height: 0.6; depth: 0.2"
    );
    target.setAttribute(
      "material",
      "color: #ff5c5c; emissive: #ff5c5c; emissiveIntensity: 0.35"
    );

    const pos = new THREE_REF.Vector3(
      randRange(-3, 3),
      randRange(0.1, 1.0),
      -randRange(8, 16)
    );
    camObj.localToWorld(pos);
    target.setAttribute("position", pos);

    this.el.appendChild(target);
    this.targets.push(target);
  },
});

AFRAME.registerComponent("gun", {
  init: function () {
    this.onMouseDown = this.fire.bind(this);
    this.el.sceneEl.addEventListener("mousedown", this.onMouseDown);
  },

  remove: function () {
    this.el.sceneEl.removeEventListener("mousedown", this.onMouseDown);
  },

  fire: function (event) {
    if (window.GAME_STATE.paused) return;
    if (event && event.button !== 0) return;

    const cameraEl = document.getElementById("camera");
    const camObj = cameraEl.object3D;

    const dir = new THREE_REF.Vector3();
    camObj.getWorldDirection(dir);
    dir.multiplyScalar(-1);
    dir.normalize();

    const start = new THREE_REF.Vector3();
    camObj.getWorldPosition(start);
    start.add(dir.clone().multiplyScalar(0.5));

    const projectile = document.createElement("a-sphere");
    projectile.setAttribute("radius", 0.06);
    projectile.setAttribute("color", "#ffd166");
    projectile.setAttribute("emissive", "#ffd166");
    projectile.setAttribute("emissiveIntensity", 0.7);
    projectile.setAttribute("position", `${start.x} ${start.y} ${start.z}`);
    projectile.setAttribute("projectile", {
      dirX: dir.x,
      dirY: dir.y,
      dirZ: dir.z,
      speed: 30,
      lifespan: 1200,
    });

    this.el.sceneEl.appendChild(projectile);
  },
});

AFRAME.registerComponent("projectile", {
  schema: {
    speed: { default: 20 },
    lifespan: { default: 1000 },
    dirX: { default: 0 },
    dirY: { default: 0 },
    dirZ: { default: -1 },
  },

  init: function () {
    this.startTime = Date.now();
    this.direction = new THREE_REF.Vector3(
      this.data.dirX,
      this.data.dirY,
      this.data.dirZ
    ).normalize();

    this.tmpVec = new THREE_REF.Vector3();
    this.scene = this.el.sceneEl;
    this.game = this.scene.components["game-environment"];
  },

  tick: function (time, delta) {
    if (window.GAME_STATE.paused) return;

    const dt = delta / 1000;

    this.tmpVec.copy(this.direction).multiplyScalar(this.data.speed * dt);
    this.el.object3D.position.add(this.tmpVec);

    for (const t of this.game.targets) {
      if (!t.object3D) continue;

      const dist = this.el.object3D.position.distanceTo(t.object3D.position);
      if (dist < 0.5) {
        this.game.handleTargetHit(t);
        this.destroy();
        return;
      }
    }

    if (Date.now() - this.startTime > this.data.lifespan) this.destroy();
  },

  destroy: function () {
    if (this.el.parentNode) this.el.remove();
  },
});

window.addEventListener("load", () => {
  const scene = document.getElementById("scene");
  const pauseOverlay = document.getElementById("pauseOverlay");
  const btnResume = document.getElementById("btnResume");
  const btnRestart = document.getElementById("btnRestart");
  const btnPauseMenu = document.getElementById("btnPauseMenu");
  const startMenu = document.getElementById("startMenu");
  const endOverlay = document.getElementById("endOverlay");
  const finalScore = document.getElementById("finalScore");
  const btnBackToMenu = document.getElementById("btnBackToMenu");
  const btnStartGame = document.getElementById("btnStartGame");
  const ballCountInput = document.getElementById("ballCount");

  let game;

  const showMenu = () => {
    startMenu.style.display = "flex";
    endOverlay.style.display = "none";
    toggleGameplayUI(false);
    if (document.pointerLockElement) document.exitPointerLock();
  };

  const startMatch = () => {
    if (!game) return;
    const value = parseInt(ballCountInput.value, 10);
    if (Number.isNaN(value) || value < 1 || value > 15) {
      ballCountInput.value = Math.min(Math.max(value || 1, 1), 15);
      return;
    }

    game.startGame({ targetCount: value });

    startMenu.style.display = "none";
    endOverlay.style.display = "none";
    toggleGameplayUI(true);
    setGamePaused(false);

    const canvas = scene.canvas;
    if (canvas) canvas.requestPointerLock();
  };

  scene.addEventListener("game-over", (evt) => {
    toggleGameplayUI(false);
    endOverlay.style.display = "flex";
    finalScore.textContent = evt.detail.score ?? 0;
  });

  scene.addEventListener("loaded", () => {
    const canvas = scene.canvas;
    game = scene.components["game-environment"];

    canvas.addEventListener("click", () => {
      if (window.GAME_STATE.paused || !window.GAME_STATE.playing) return;
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === canvas;
      if (!locked && window.GAME_STATE.playing) {
        setGamePaused(true);
      } else if (locked) {
        setGamePaused(false);
      }
    });
  });

  btnResume.addEventListener("click", () => {
    const canvas = scene.canvas;
    if (!canvas) return;
    canvas.requestPointerLock();
  });

  btnPauseMenu.addEventListener("click", () => {
    if (game) game.finishGame();
    pauseOverlay.style.display = "none";
    showMenu();
  });

  btnRestart.addEventListener("click", () => {
    if (!game || !game.currentConfig) return;
    ballCountInput.value = game.currentConfig.targetCount;
    startMatch();
  });

  btnBackToMenu.addEventListener("click", () => {
    if (game) game.finishGame();
    showMenu();
  });

  btnStartGame.addEventListener("click", startMatch);

  toggleGameplayUI(false);
  pauseOverlay.style.display = "none";
});
