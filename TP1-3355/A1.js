// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function (a) {
  this.matrix = a;
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};

// SETUP RENDERER AND SCENE
var start = Date.now();
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();

renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far

camera.position.set(10, 5, 10);
camera.lookAt(scene.position);
scene.add(camera);

// SETUP ORBIT CONTROL OF THE CAMERA
var controls = new THREE.OrbitControls(camera);

controls.damping = 0.2;

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

// FLOOR WITH CHECKERBOARD
var floorTexture = new THREE.ImageUtils.loadTexture("images/tile.jpg");

floorTexture.wrapS = floorTexture.wrapT = THREE.MirroredRepeatWrapping;
floorTexture.repeat.set(4, 4);

var floorMaterial = new THREE.MeshBasicMaterial({
  map: floorTexture,
  side: THREE.DoubleSide,
});

var floorGeometry = new THREE.PlaneBufferGeometry(15, 15);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);

floor.rotation.x = Math.PI / 2;
floor.position.y = 0.0;

scene.add(floor);

// TRANSFORMATIONS

function multMat(m1, m2) {
  return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

function inverseMat(m) {
  return new THREE.Matrix4().getInverse(m, true);
}

function idMat4() {
  var m = new THREE.Matrix4();
  m.set(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  );

  return m;
}

function translateMat(matrix, x, y, z) {
  // Apply translation [x, y, z] to @matrix
  // matrix: THREE.Matrix4
  // x, y, z: float

  // Check if matrix is a THREE.Matrix4 instance
  if (!(matrix instanceof THREE.Matrix4)) {
    console.error("Invalid matrix type. Please provide a valid THREE.Matrix4.");
    return new THREE.Matrix4();
  }

  var translationMatrix = new THREE.Matrix4();

  translationMatrix.set(
    1, 0, 0, x,
    0, 1, 0, y,
    0, 0, 1, z,
    0, 0, 0, 1
  );

  return multMat(translationMatrix, matrix);
}

function rotateMat(matrix, angle, axis) {
  // Apply rotation by @angle with respect to @axis to @matrix
  // matrix: THREE.Matrix4
  // angle: float (we assume it's in radians)
  // axis: string "x", "y" or "z"

  if (!(matrix instanceof THREE.Matrix4)) {
    console.error("Invalid matrix type. Please provide a valid THREE.Matrix4.");
    return new THREE.Matrix4();
  }

  // Create a new matrix to store the rotation
  var rotationMatrix = new THREE.Matrix4();

  // Calculate sine and cosine values based on the angle
  var cosTheta = Math.cos(angle);
  var sinTheta = Math.sin(angle);

  // Apply rotation based on the specified axis
  switch (axis.toLowerCase()) {
    case "x":
      rotationMatrix.set(
        1, 0       , 0        , 0,
        0, cosTheta, -sinTheta, 0,
        0, sinTheta,  cosTheta, 0,
        0, 0       , 0        , 1,
      );
      break;

    case "y":
      rotationMatrix.set(
         cosTheta, 0, sinTheta, 0,
         0       , 1, 0       , 0,
        -sinTheta, 0, cosTheta, 0,
         0       , 0, 0       , 1,
      );
      break;

    case "z":
      rotationMatrix.set(
        cosTheta, -sinTheta, 0, 0,
        sinTheta,  cosTheta, 0, 0,
        0       , 0        , 1, 0,
        0       , 0        , 0, 1,
      );
      break;

    default:
      console.error('Invalid axis. Please use "x", "y", or "z".');
      return matrix;
  }

  return multMat(rotationMatrix, matrix); // apply the rotation
}

function rotateVec3(v, angle, axis) {
  // Apply rotation by @angle with respect to @axis to vector @v
  // v: THREE.Vector3
  // angle: float (we assume it's in radians)
  // axis: string "x", "y" or "z"

  if (!(v instanceof THREE.Vector3)) {
    console.error("Invalid vector type. Please provide a valid THREE.Vector3.");
    return new THREE.Vector3();
  }

  var cosTheta = Math.cos(angle);
  var sinTheta = Math.sin(angle);

  // Perform rotation based on the specified axis
  switch (axis.toLowerCase()) {
    case "x":
      var y = v.y * cosTheta - v.z * sinTheta;
      var z = v.y * sinTheta + v.z * cosTheta;
      v.set(v.x, y, z);
      break;

    case "y":
      var x =  v.x * cosTheta + v.z * sinTheta;
      var z = -v.x * sinTheta + v.z * cosTheta;
      v.set(x, v.y, z);
      break;

    case "z":
      var x = v.x * cosTheta - v.y * sinTheta;
      var y = v.x * sinTheta + v.y * cosTheta;
      v.set(x, y, v.z);
      break;

    default:
      console.error('Invalid axis. Please use "x", "y", or "z".');
      return v;
  }

  return v;
}

function rescaleMat(matrix, x, y, z) {
  // Apply scaling @x, @y and @z to @matrix
  // matrix: THREE.Matrix3
  // x, y, z: float

  if (!(matrix instanceof THREE.Matrix4)) {
    console.error("Invalid matrix type. Please provide a valid THREE.Matrix4.");
    return new THREE.Matrix4();
  }

  var scalingMatrix = new THREE.Matrix4();

  // Set the scaling values in the appropriate positions
  scalingMatrix.set(
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  );

  return multMat(scalingMatrix, matrix); //apply the scaling
}

class Limb {
  constructor(radius, length, initialPosition, material, parentLimb = null) {
    this.radius          = radius;
    this.length          = length;
    this.initialPosition = initialPosition;
    this.parentLimb      = parentLimb;

    this.shape          = new THREE.Mesh(this.geometry(), material);
    this.initialMatrix  = this.initialMatrix();
    this.transformation = this.initialMatrix;
    this.joint          = { 
      x: 0,
      y: 0,
      z: this.parentLimb ? -this.length : 0  // joint is always at the beginning of limb
    };

    scene.add(this.shape);
  }

  geometry     () { /* abstract */ } // shape of limb (unit size assumed)
  scalingMatrix() { /* abstract */ } // default scaling applied to the shape

  initialMatrix() {
    return translateMat(idMat4(), this.initialPosition.x, this.initialPosition.y, this.initialPosition.z);
  }

  transformationMatrix() {
    if (this.parentLimb === null) { // limb is torso
      return this.transformation;  
    }

    return multMat(this.parentLimb.transformationMatrix(), this.transformation);
  }

  addTransformation(transformation, order = "before") {
    const t1 = order === "after"  ? this.transformation : transformation;
    const t2 = order === "before" ? this.transformation : transformation;

    this.transformation = multMat(t1, t2);
  }

  rotateJoint(angle, axis = "y") {
    const translation = translateMat(this.initialMatrix, this.joint.x, this.joint.y, this.joint.z);
    const rotation    = rotateMat(idMat4(), angle, axis);

    this.addTransformation(inverseMat(translation));
    this.addTransformation(rotation);
    this.addTransformation(translation);
  }

  update() {
    this.shape.setMatrix(multMat(this.transformationMatrix(), this.scalingMatrix()));
  }
}

class BoxLimb extends Limb {
  geometry() {
    return new THREE.CubeGeometry(1, 1, 1, 64);
  }

  scalingMatrix() {
    return rescaleMat(idMat4(), this.radius * 2, this.length, this.radius);
  }
}

class SphereLimb extends Limb {
  geometry() {
    return new THREE.SphereGeometry(1, 32, 32);
  }

  scalingMatrix() {
    return rescaleMat(idMat4(), this.radius, this.radius, this.length);
  }
}

class Robot {
  
  constructor() {
    const headsize = 0.64;

    this.torsoLength   = headsize * 3;
    this.armLength     = headsize * 1.25;
    this.forearmLength = headsize;
    this.thighLength   = headsize * 1.5;
    this.legLength     = headsize * 1.25;

    this.headRadius    = headsize / 2;
    this.torsoRadius   = 0.75;
    this.armRadius     = 0.15;
    this.forearmRadius = 0.12;
    this.thighRadius   = 0.25;
    this.legRadius     = 0.20;

    this.walkDirection = new THREE.Vector3(0, 0, 1); // Animation
    this.material      = new THREE.MeshNormalMaterial(); // Material

    // walk animation status
    this.stepRCompleted    = false; // if this is true, right leg is the forward leg
    this.legLifted         = false; // if this is true, forward leg is completely lifted and must now go down
    this.animationProgress = 0;

    this.initialize(); // Initial pose
  }

  moveTorso(speed) {
    var deltaX = speed * this.walkDirection.x;
    var deltaY = speed * this.walkDirection.y;
    var deltaZ = speed * this.walkDirection.z;

    const translation = translateMat(idMat4(), deltaX, deltaY, deltaZ);

    this.torso.addTransformation(translation);
    this.updateLimbs();
  }

  rotateTorso(angle) {
    const rotation = rotateMat(idMat4(), angle, "y");

    this.torso.addTransformation(rotation, "after");

    this.updateLimbs();

    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");
  }

  rotateHead(angle) {
    const rotation = rotateMat(idMat4(), angle, "y");

    this.head.addTransformation(rotation);

    this.updateLimbs("head");
  }

  rotateArmR(angle, axis) {
    this.armR.rotateJoint(angle, axis);
    this.updateLimbs("armR");
  }

  rotateArmL(angle, axis) {
    this.armL.rotateJoint(angle, axis);
    this.updateLimbs("armL");
  }

  rotateForearmR(angle) {
    this.forearmR.rotateJoint(angle, "x");
    this.updateLimbs("forearmR");
  }

  rotateForearmL(angle) {
    this.forearmL.rotateJoint(angle, "x");
    this.updateLimbs("forearmL");
  }

  rotateThighR(angle) {
    this.thighR.rotateJoint(angle, "x");
    this.updateLimbs("thighR");
  }

  rotateThighL(angle) {
    this.thighL.rotateJoint(angle, "x");
    this.updateLimbs("thighL");
  }

  rotateLegR(angle) {
    this.legR.rotateJoint(angle, "x");
    this.updateLimbs("legR");
  }

  rotateLegL(angle) {
    this.legL.rotateJoint(angle, "x");
    this.updateLimbs("legL");
  }

  walk() {}

  updateLimbs(parentLimbName = "torso") {
    const childLimbs = {
      torso   : ["head", "armR", "armL", "thighR", "thighL"],
      head    : [],
      armR    : ["forearmR"],
      armL    : ["forearmL"],
      forearmR: [],
      forearmL: [],
      thighR  : ["legR"],
      thighL  : ["legL"],
      legR    : [],
      legL    : [],
    };

    switch (parentLimbName) {
      case "torso"   : this.torso   .update(); break;
      case "head"    : this.head    .update(); break;
      case "armR"    : this.armR    .update(); break;
      case "armL"    : this.armL    .update(); break;
      case "forearmR": this.forearmR.update(); break;
      case "forearmL": this.forearmL.update(); break;
      case "thighR"  : this.thighR  .update(); break;
      case "thighL"  : this.thighL  .update(); break;
      case "legR"    : this.legR    .update(); break;
      case "legL"    : this.legL    .update(); break;
    }

    childLimbs[parentLimbName].forEach((limb) => this.updateLimbs(limb)); // update child limbs recursively
  }

  initialize() {
    // initial positions
    var torsoPosition    = { x: 0                                  , y:  this.torsoLength / 2 + this.thighRadius + this.thighLength * 2 + this.legLength * 2, z: 0                                     };
    var headPosition     = { x: 0                                  , y:  this.torsoLength / 2 + this.headRadius                                             , z: 0                                     };
    var armLPosition     = { x: this.torsoRadius + this.armRadius  , y:  this.torsoLength / 2 - this.armRadius                                              , z: this.armLength                        };
    var thighLPosition   = { x: this.torsoRadius - this.thighRadius, y: -this.torsoLength / 2 - this.thighRadius                                            , z: this.thighLength                      };
    var forearmLPosition = { x: 0                                  , y: 0                                                                                   , z: this.armLength   + this.forearmLength };
    var legLPosition     = { x: 0                                  , y: 0                                                                                   , z: this.thighLength + this.legLength     };

    var armRPosition     = { x: -armLPosition    .x, y: armLPosition    .y, z: armLPosition    .z };
    var thighRPosition   = { x: -thighLPosition  .x, y: thighLPosition  .y, z: thighLPosition  .z };
    var forearmRPosition = { x: -forearmLPosition.x, y: forearmLPosition.y, z: forearmLPosition.z };
    var legRPosition     = { x: -legLPosition    .x, y: legLPosition    .y, z: legLPosition    .z };

    // Limbs
    this.torso    = new BoxLimb   (this.torsoRadius  , this.torsoLength  , torsoPosition   , this.material,            );
    this.head     = new BoxLimb   (this.headRadius   , this.headRadius   , headPosition    , this.material, this.torso );
    this.armR     = new SphereLimb(this.armRadius    , this.armLength    , armRPosition    , this.material, this.torso );
    this.armL     = new SphereLimb(this.armRadius    , this.armLength    , armLPosition    , this.material, this.torso );
    this.forearmR = new SphereLimb(this.forearmRadius, this.forearmLength, forearmRPosition, this.material, this.armR  );
    this.forearmL = new SphereLimb(this.forearmRadius, this.forearmLength, forearmLPosition, this.material, this.armL  );
    this.thighR   = new SphereLimb(this.thighRadius  , this.thighLength  , thighRPosition  , this.material, this.torso );
    this.thighL   = new SphereLimb(this.thighRadius  , this.thighLength  , thighLPosition  , this.material, this.torso );
    this.legR     = new SphereLimb(this.legRadius    , this.legLength    , legRPosition    , this.material, this.thighR);
    this.legL     = new SphereLimb(this.legRadius    , this.legLength    , legLPosition    , this.material, this.thighL);

    this.rotateArmR  (Math.PI / 2, "x");
    this.rotateArmL  (Math.PI / 2, "x");
    this.rotateThighR(Math.PI / 2);
    this.rotateThighL(Math.PI / 2);

    this.updateLimbs();

  }

  adjustHeight() {
    const dR = -this.legR.shape.position.y + Math.sin(this.legR.shape.rotation.x) * this.legR.length
    const dL = -this.legL.shape.position.y + Math.sin(this.legL.shape.rotation.x) * this.legL.length

    const translation = translateMat(idMat4(), 0, Math.max(dR, dL), 0)
    this.torso.addTransformation(translation)
    this.updateLimbs()
  }

  // Walking animation
  walk(speed) {
    this.moveTorso(speed);

    const thighHasLifted = this.animationProgress > Math.PI / 4
    const thighHasLanded = this.animationProgress < 0;

    if (thighHasLifted) {
      this.legLifted = true;

    } else if (thighHasLanded) {
      this.stepRCompleted = !this.stepRCompleted;
      this.legLifted      = false;
    }

    var angle = Math.abs(speed) * 0.5;
    
    if (this.legLifted) {
      angle *= -1
    }
    
    if (!this.stepRCompleted) { 
      this.rotateThighR  (-angle       )
      this.rotateLegR    ( angle       )
      this.rotateThighL  ( angle * 0.75)
      this.rotateLegL    ( angle * 0.75)
      this.rotateArmR    ( angle, "x"  )
      this.rotateForearmR(-angle       )
      this.rotateArmL    (-angle, "x"  )
      this.rotateForearmL(-angle       )

    } else {
      this.rotateThighL  (-angle       )
      this.rotateLegL    ( angle       )
      this.rotateThighR  ( angle * 0.75)
      this.rotateLegR    ( angle * 0.75)
      this.rotateArmR    (-angle, "x"  )
      this.rotateForearmR(-angle       )
      this.rotateArmL    ( angle, "x"  )
      this.rotateForearmL(-angle       )
    }

    this.adjustHeight()
    this.animationProgress += angle;

  }
}

var robot = new Robot();

// ------------------------------------------------------------------------------------------------
// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Full body",
  "Torso",
  "Head",
  "Right Arm",
  "Left Arm",
  "Right Forearm",
  "Left Forearm",
  "Right Thigh",
  "Left Thigh",
  "Right Leg",
  "Left Leg",
];
var numberComponents = components.length;

function checkKeyboard() {
  // Next element
  if (keyboard.pressed("e")) {
    selectedRobotComponent ++;
    selectedRobotComponent %= numberComponents;

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // Previous element
  if (keyboard.pressed("q")) {
    selectedRobotComponent --;

    if (selectedRobotComponent < 0) {
      selectedRobotComponent += numberComponents;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // UP
  if (keyboard.pressed("w")) {
    switch (components[selectedRobotComponent]) {
      case "Full body"    : robot.walk          (0.1      ); break;
      case "Torso"        : robot.moveTorso     (0.1      ); break;
      case "Head"         : /* do nothing */                 break;
      case "Right Arm"    : robot.rotateArmR    (-0.1, "x"); break;
      case "Left Arm"     : robot.rotateArmL    (-0.1, "x"); break;
      case "Right Forearm": robot.rotateForearmR(-0.1     ); break;
      case "Left Forearm" : robot.rotateForearmL(-0.1     ); break;
      case "Right Thigh"  : robot.rotateThighR  (-0.1     ); break;
      case "Left Thigh"   : robot.rotateThighL  (-0.1     ); break;
      case "Right Leg"    : robot.rotateLegR    (-0.1     ); break;
      case "Left Leg"     : robot.rotateLegL    (-0.1     ); break;
    }
  }

  // DOWN
  if (keyboard.pressed("s")) {
    switch (components[selectedRobotComponent]) {
      case "Full body"    : robot.walk          (-0.1    ); break;
      case "Torso"        : robot.moveTorso     (-0.1    ); break;
      case "Head"         : /* do nothing */                break;
      case "Right Arm"    : robot.rotateArmR    (0.1, "x"); break;
      case "Left Arm"     : robot.rotateArmL    (0.1, "x"); break;
      case "Right Forearm": robot.rotateForearmR(0.1     ); break;
      case "Left Forearm" : robot.rotateForearmL(0.1     ); break;
      case "Right Thigh"  : robot.rotateThighR  (0.1     ); break;
      case "Left Thigh"   : robot.rotateThighL  (0.1     ); break;
      case "Right Leg"    : robot.rotateLegR    (0.1     ); break;
      case "Left Leg"     : robot.rotateLegL    (0.1     ); break;
    }
  }

  // LEFT
  if (keyboard.pressed("a")) {
    switch (components[selectedRobotComponent]) {
      case "Full body"    : robot.rotateTorso( 0.1     ); break;
      case "Torso"        : robot.rotateTorso( 0.1     ); break;
      case "Head"         : robot.rotateHead ( 0.1     ); break;
      case "Right Arm"    : robot.rotateArmR (-0.1, "y"); break;
      case "Left Arm"     : robot.rotateArmL (-0.1, "y"); break;
      case "Right Forearm": /* do nothing */              break;
      case "Left Forearm" : /* do nothing */              break;
      case "Right Thigh"  : /* do nothing */              break;
      case "Left Thigh"   : /* do nothing */              break;
      case "Right Leg"    : /* do nothing */              break;
      case "Left Leg"     : /* do nothing */              break;
    }
  }

  // RIGHT
  if (keyboard.pressed("d")) {
    switch (components[selectedRobotComponent]) {
      case "Full body"    : robot.rotateTorso(-0.1     ); break;
      case "Torso"        : robot.rotateTorso(-0.1     ); break;
      case "Head"         : robot.rotateHead (-0.1     ); break;
      case "Right Arm"    : robot.rotateArmR ( 0.1, "y"); break;
      case "Left Arm"     : robot.rotateArmL ( 0.1, "y"); break;
      case "Right Forearm": /* do nothing */              break;
      case "Left Forearm" : /* do nothing */              break;
      case "Right Thigh"  : /* do nothing */              break;
      case "Left Thigh"   : /* do nothing */              break;
      case "Right Leg"    : /* do nothing */              break;
      case "Left Leg"     : /* do nothing */              break;
    }
  }
}

// SETUP UPDATE CALL-BACK
function update() {
  checkKeyboard();
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();
