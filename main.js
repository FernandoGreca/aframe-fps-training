// Estado global simples
window.GAME_STATE = {
  paused: false,
};

const randRange = (min, max) => Math.random() * (max - min) + min;
const THREE_REF = AFRAME.THREE;

function setGamePaused(paused) {
  const scene = document.getElementById("scene");
  const pauseOverlay = document.getElementById("pauseOverlay");
  const helper = document.getElementById("helper");
  const reticle = document.getElementById("reticle");

  window.GAME_STATE.paused = paused;

  if (paused) {
    scene.pause();
    pauseOverlay.style.display = "flex";
    if (helper) helper.style.display = "none";
    if (reticle) reticle.style.display = "none";
  } else {
    scene.play();
    pauseOverlay.style.display = "none";
    if (helper) helper.style.display = "block";
    if (reticle) reticle.style.display = "block";
  }
}

AFRAME.registerComponent("game-environment", {
  schema: {
    spawnInterval: { default: 1500 },
    maxTargets: { default: 8 },
  },

  init: function () {
    this.lastSpawnTime = 0;
    this.score = 0;
    this.scoreEl = document.getElementById("score");
    this.cameraEl = document.getElementById("camera");
    this.targets = [];

    for (let i = 0; i < 4; i++) this.spawnTarget();
  },

  tick: function (time) {
    if (window.GAME_STATE.paused) return;

    if (time - this.lastSpawnTime > this.data.spawnInterval) {
      if (this.targets.length < this.data.maxTargets) {
        this.spawnTarget();
      }
      this.lastSpawnTime = time;
    }
  },

  addScore: function (points) {
    this.score += points;
    this.scoreEl.textContent = this.score;
  },

  removeTarget: function (targetEl) {
    const idx = this.targets.indexOf(targetEl);
    if (idx !== -1) this.targets.splice(idx, 1);
    if (targetEl && targetEl.parentNode) targetEl.remove();
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
      randRange(-0.5, 1.5),
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
    dir.multiplyScalar(-1); // Ajusta direção para frente da câmera
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
        this.game.addScore(1);
        this.game.removeTarget(t);
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

  scene.addEventListener("loaded", () => {
    const canvas = scene.canvas;
    if (!canvas) return;

    canvas.addEventListener("click", () => {
      if (window.GAME_STATE.paused) return;
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === canvas;
      if (!locked) {
        setGamePaused(true);
      } else {
        setGamePaused(false);
      }
    });
  });

  btnResume.addEventListener("click", () => {
    const canvas = scene.canvas;
    if (!canvas) return;
    canvas.requestPointerLock();
  });

  btnRestart.addEventListener("click", () => {
    location.reload();
  });

  setGamePaused(false);
});
