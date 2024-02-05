
// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function (a) {
  this.matrix = a;
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};

// SETUP RENDERER AND SCENE
var start    = Date.now();
var scene    = new THREE.Scene();
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
  map : floorTexture,
  side: THREE.DoubleSide,
});

var floorGeometry = new THREE.PlaneBufferGeometry(15, 15);
var floor         = new THREE.Mesh(floorGeometry, floorMaterial);

floor.rotation.x = Math.PI / 2;
floor.position.y = 0.0;

scene.add(floor);

// draw X,Y,Z axes
var axisGeometry = new THREE.BoxGeometry(5, 0.1, 0.1)

var materialX = new THREE.MeshBasicMaterial()
var materialY = new THREE.MeshBasicMaterial()
var materialZ = new THREE.MeshBasicMaterial()

materialX.color.set(new THREE.Color("red"))
materialY.color.set(new THREE.Color("green"))
materialZ.color.set(new THREE.Color("orange"))

var axisX = new THREE.Mesh(axisGeometry, materialX)
var axisY = new THREE.Mesh(axisGeometry, materialY)
var axisZ = new THREE.Mesh(axisGeometry, materialZ)

axisY.rotation.z = Math.PI/2
axisZ.rotation.y = Math.PI/2

scene.add(axisX)
scene.add(axisY)
scene.add(axisZ)


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

  // TODO

  // Check if matrix is a THREE.Matrix4 instance
  if (!(matrix instanceof THREE.Matrix4)) {
    console.error("Invalid matrix type. Please provide a valid THREE.Matrix4.");
    return new THREE.Matrix4();
  }

  var m = new THREE.Matrix4();
  var translationMatrix = new THREE.Matrix4();

  translationMatrix.set(
    1, 0, 0, x,
    0, 1, 0, y,
    0, 0, 1, z,
    0, 0, 0, 1,
  );

  m = multMat(translationMatrix, matrix);

  return m;
}

function rotateMat(matrix, angle, axis) {
  // Apply rotation by @angle with respect to @axis to @matrix
  // matrix: THREE.Matrix4
  // angle: float
  // axis: string "x", "y" or "z"
  // TODO

  // Check if matrix is a THREE.Matrix4 instance
  if (!(matrix instanceof THREE.Matrix4)) {
    console.error("Invalid matrix type. Please provide a valid THREE.Matrix4.");
    return new THREE.Matrix4();
  }

  // Convert the angle to radians
  var radians = angle;

  // Create a new matrix to store the rotation
  var rotationMatrix = new THREE.Matrix4();

  // Calculate sine and cosine values based on the angle
  var cosTheta = Math.cos(radians);
  var sinTheta = Math.sin(radians);

  // Apply rotation based on the specified axis
  switch (axis.toLowerCase()) {
    case "x":
      rotationMatrix.set(
        1, 0       ,  0       , 0,
        0, cosTheta, -sinTheta, 0,
        0, sinTheta,  cosTheta, 0,
        0, 0       ,  0       , 1,
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
        0       ,  0       , 1, 0, 
        0       ,  0       , 0, 1,
      );
      break;

    default:
      console.error('Invalid axis. Please use "x", "y", or "z".');
      return matrix;
  }

  // Multiply the original matrix by the rotation matrix to apply the rotation
  var m = new THREE.Matrix4();
  m = multMat(rotationMatrix, matrix);

  return m;
}

function rotateVec3(v, angle, axis) {
  // Apply rotation by @angle with respect to @axis to vector @v
  // v: THREE.Vector3
  // angle: float
  // axis: string "x", "y" or "z"
  // TODO

  // Check if v is a THREE.Vector3 instance
  if (!(v instanceof THREE.Vector3)) {
    console.error("Invalid vector type. Please provide a valid THREE.Vector3.");
    return new THREE.Vector3();
  }

  // Convert the angle to radians
  var radians = angle;

  // Calculate sine and cosine values based on the angle
  var cosTheta = Math.cos(radians);
  var sinTheta = Math.sin(radians);

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
  // TODO

  // Check if matrix is a THREE.Matrix4 instance
  if (!(matrix instanceof THREE.Matrix4)) {
    console.error("Invalid matrix type. Please provide a valid THREE.Matrix4.");
    return new THREE.Matrix4();
  }

  var m = new THREE.Matrix4();
  var scalingMatrix = new THREE.Matrix4();

  // Set the scaling values in the appropriate positions
  scalingMatrix.set(
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  );

  // Multiply the original matrix by the scaling matrix to apply the scaling
  m = multMat(scalingMatrix, matrix);

  return m;
}

class Limb {
  constructor(radius, length, initialPosition, material, parentLimb = null) {
    this.radius          = radius;
    this.length          = length;
    this.initialPosition = initialPosition;
    this.parentLimb      = parentLimb
    this.referenceMatrix = idMat4()

    this.shape           = new THREE.Mesh(this.geometry(), material);
    this.matrix          = idMat4();
    this.initialMatrix   = this.initialMatrix();
    
    scene.add(this.shape)
  }
  
  geometry     () { /* abstract */ }
  initialMatrix() { /* abstract */ }

  update() {
    var matrix = multMat(this.matrix, this.initialMatrix);
    
    if (this.parentLimb != null) { // torso
      matrix = multMat(this.parentLimb.matrix, matrix);
    }

    this.shape.setMatrix(matrix);
  }
}

class BoxLimb extends Limb {

  geometry() {
    return new THREE.CubeGeometry(this.radius * 2, this.length, this.radius, 64);
  }

  initialMatrix() {
    return translateMat(idMat4(), this.initialPosition.x, this.initialPosition.y, this.initialPosition.z);
  }
}

class SphereLimb extends Limb {
  
  geometry() {
    return new THREE.SphereGeometry(1, 32, 32);
  }

  initialMatrix() {
    var matrix = idMat4();
    matrix = rescaleMat(matrix, this.radius, this.radius, this.length);
    matrix = translateMat(matrix, this.initialPosition.x, this.initialPosition.y, this.initialPosition.z);

    return matrix;
  }
}

class Robot {
  constructor() {

    // body dimensions:
    const headsize = 0.64

    this.torsoLength   = headsize * 3
    this.armLength     = headsize * 1.25
    this.forearmLength = headsize
    this.thighLength   = headsize * 1.75
    this.legLength     = headsize * 1.5
    
    this.headRadius    = headsize / 2
    this.torsoRadius   = 0.75;
    this.armRadius     = 0.15;
    this.forearmRadius = 0.12;
    this.thighRadius   = 0.25;
    this.legRadius     = 0.2;

    this.walkDirection = new THREE.Vector3(0, 0, 1);     // Animation
    this.material      = new THREE.MeshNormalMaterial(); // Material

    // Initial pose
    this.initialize();
  }

  moveTorso(speed) {
    var deltaX = speed * this.walkDirection.x
    var deltaY = speed * this.walkDirection.y
    var deltaZ = speed * this.walkDirection.z

    this.torso.matrix = translateMat(this.torso.matrix, deltaX, deltaY, deltaZ);
    this.updateLimbs()
  }

  rotateTorso(angle) {

    var rotationMatrix = rotateMat(idMat4(), angle, "y");
    this.torso.matrix = multMat(this.torso.matrix, rotationMatrix);
    
    
    this.updateLimbs()
    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");
  }
  
  rotateHead(angle) {
    var rotationMatrix = rotateMat(idMat4(), angle, "y");
    this.head.matrix = multMat(this.head.matrix, rotationMatrix);

    this.updateLimbs("head")
  }

  rotateArm(angle) {

  }

  updateLimbs(parentLimbName="torso") {
    const childLimbs = {
      "torso"   : ["head", "armR", "armL", "thighR", "thighL"],
      "head"    : [],
      "armR"    : ["forearmR"],
      "armL"    : ["forearmL"],
      "forearmR": [],
      "forearmL": [],
      "thighR"  : ["legR"],
      "thighL"  : ["legL"],
      "legR"    : [],
      "legL"    : [],
    }

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
    
    childLimbs[parentLimbName].forEach((limb) => this.updateLimbs(limb))
  }

  initialize() {
    // initial positions
    var torsoPosition    = { x: 0                                                     , y: this.torsoLength + this.thighLength + this.legLength       , z: 0                                                          };
    var headPosition     = { x: torsoPosition .x                                      , y: torsoPosition .y  + this.torsoLength / 2 + this.headRadius , z: torsoPosition .z                                           };
    var armRPosition     = { x: torsoPosition .x + this.torsoRadius + this.armRadius  , y: torsoPosition .y  + this.torsoLength / 2 - this.armRadius  , z: torsoPosition .z + this.armLength   - this.torsoRadius / 2 };
    var thighRPosition   = { x: torsoPosition .x + this.torsoRadius - this.thighRadius, y: torsoPosition .y  - this.torsoLength / 2 - this.thighRadius, z: torsoPosition .z + this.thighLength - this.torsoRadius / 2 };
    var forearmRPosition = { x: armRPosition  .x                                      , y: armRPosition  .y                                           , z: armRPosition  .z + this.armLength   + this.forearmLength   };
    var legRPosition     = { x: thighRPosition.x                                      , y: thighRPosition.y                                           , z: thighRPosition.z + this.thighLength + this.legLength       };

    var armLPosition     = { x: -armRPosition    .x, y: armRPosition    .y, z: armRPosition    .z };
    var thighLPosition   = { x: -thighRPosition  .x, y: thighRPosition  .y, z: thighRPosition  .z };
    var forearmLPosition = { x: -forearmRPosition.x, y: forearmRPosition.y, z: forearmRPosition.z };
    var legLPosition     = { x: -legRPosition    .x, y: legRPosition    .y, z: legRPosition    .z };

    // Limbs
    this.torso    = new BoxLimb   (this.torsoRadius  , this.torsoLength  , torsoPosition   , this.material)
    this.head     = new BoxLimb   (this.headRadius   , this.headRadius   , headPosition    , this.material, this.torso)
    this.armR     = new SphereLimb(this.armRadius    , this.armLength    , armRPosition    , this.material, this.torso)
    this.armL     = new SphereLimb(this.armRadius    , this.armLength    , armLPosition    , this.material, this.torso)
    this.forearmR = new SphereLimb(this.forearmRadius, this.forearmLength, forearmRPosition, this.material, this.torso)
    this.forearmL = new SphereLimb(this.forearmRadius, this.forearmLength, forearmLPosition, this.material, this.torso)
    this.thighR   = new SphereLimb(this.thighRadius  , this.thighLength  , thighRPosition  , this.material, this.torso)
    this.thighL   = new SphereLimb(this.thighRadius  , this.thighLength  , thighLPosition  , this.material, this.torso)
    this.legR     = new SphereLimb(this.legRadius    , this.legLength    , legRPosition    , this.material, this.torso)
    this.legL     = new SphereLimb(this.legRadius    , this.legLength    , legLPosition    , this.material, this.torso)

    this.updateLimbs()
  }

}

var robot = new Robot();

// ------------------------------------------------------------------------------------------------
// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Torso",
  "Head",
  // Add parts names
  // TODO
];
var numberComponents = components.length;

function checkKeyboard() {
  // Next element
  if (keyboard.pressed("e")) {
    selectedRobotComponent = selectedRobotComponent + 1;

    if (selectedRobotComponent < 0) {
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents) {
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // Previous element
  if (keyboard.pressed("q")) {
    selectedRobotComponent = selectedRobotComponent - 1;

    if (selectedRobotComponent < 0) {
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents) {
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // UP
  if (keyboard.pressed("w")) {
    switch (components[selectedRobotComponent]) {
      case "Torso": robot.moveTorso(0.1); break;
      case "Head" : break;
      // Add more cases
      // TODO
    }
  }

  // DOWN
  if (keyboard.pressed("s")) {
    switch (components[selectedRobotComponent]) {
      case "Torso": robot.moveTorso(-0.1); break;
      case "Head" : break;
      // Add more cases
      // TODO
    }
  }

  // LEFT
  if (keyboard.pressed("a")) {
    switch (components[selectedRobotComponent]) {
      case "Torso": robot.rotateTorso(0.1); break;
      case "Head" : robot.rotateHead (0.1); break;
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")) {
    switch (components[selectedRobotComponent]) {
      case "Torso": robot.rotateTorso(-0.1); break;
      case "Head" : robot.rotateHead (-0.1); break;
      // Add more cases
      // TODO
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
