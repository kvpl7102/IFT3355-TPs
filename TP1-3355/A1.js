
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
  var radians = angle * (Math.PI / 180);

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
  var radians = angle * (Math.PI / 180);

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

class Robot {

  constructor() {
    // Geometry
    this.headRadius     = 0.32;
    
    this.torsoHeight    = 1.5;
    this.torsoRadius    = 0.75;

    this.armLength      = 2;
    this.armRadiusX     = 0.6;
    this.armRadiusY     = 0.6;

    this.forearmLength  = 2.5;
    this.forearmRadiusX = 0.6;
    this.forearmRadiusY = 0.6;

    this.thighLength    = 1;
    this.thighRadiusX   = 1;
    this.thighRadiusY   = 3;

    this.walkDirection = new THREE.Vector3(0, 0, 1);     // Animation
    this.material      = new THREE.MeshNormalMaterial(); // Material

    // Initial pose
    this.initialize();
  }

  initialTorsoMatrix() {
    var initialTorsoMatrix = idMat4();

    var x = 0
    var y = this.torsoHeight + 0.5
    var z = 0

    return translateMat(initialTorsoMatrix, x, y, z);
  }

  initialHeadMatrix() {
    var initialHeadMatrix = idMat4();

    var x = 0
    var y = this.torsoHeight / 2 + this.headRadius
    var z = 0

    return translateMat(initialHeadMatrix, x, y, z);
  }

  initialArmRMatrix() {
    var initialArmRMatrix = idMat4();

    var x = this.torsoRadius * -2
    var y = this.torsoHeight /  2
    var z = 0.1

    initialArmRMatrix = translateMat(initialArmRMatrix, x, y, z);
    initialArmRMatrix = rescaleMat(initialArmRMatrix, this.armRadiusX, this.armRadiusY, this.armLength);
    
    return initialArmRMatrix;
  }
  
  initialArmLMatrix() {
    var initialArmLMatrix = idMat4();

    var x = this.torsoRadius * 2
    var y = this.torsoHeight / 2
    var z = 0.1

    initialArmLMatrix = translateMat(initialArmLMatrix, x, y, z);
    initialArmLMatrix = rescaleMat(initialArmLMatrix, this.armRadiusX, this.armRadiusY, this.armLength);
    
    return initialArmLMatrix;
  }

  initialForearmRMatrix() {
    var initialForearmRMatrix = idMat4();

    var x = this.torsoRadius * -2
    var y = this.torsoHeight /  2
    var z = this.forearmLength - this.armLength - 0.07

    initialForearmRMatrix = translateMat(initialForearmRMatrix, x, y, z);
    initialForearmRMatrix = rescaleMat(initialForearmRMatrix, this.forearmRadiusX, this.forearmRadiusY, this.forearmLength);

    return initialForearmRMatrix;
  }

  initialForearmLMatrix() {
    var initialForearmLMatrix = idMat4();

    var x = this.torsoRadius * 2
    var y = this.torsoHeight / 2
    var z = this.forearmLength - this.armLength - 0.07
    
    initialForearmLMatrix = translateMat(initialForearmLMatrix, x, y, z);
    initialForearmLMatrix = rescaleMat(initialForearmLMatrix, this.forearmRadiusX, this.forearmRadiusY, this.forearmLength);

    return initialForearmLMatrix;
  }

  initialThighRMatrix() {
    var initialThighRMatrix = idMat4();

    var x = 4
    var y = 5
    var z = -0.1

    initialThighRMatrix = translateMat(initialThighRMatrix, x, y, z);
    initialThighRMatrix = rescaleMat(initialThighRMatrix, this.thighRadiusX, this.thighRadiusY, this.thighLength);

    return initialThighRMatrix;
  }

  rotateTorso(angle) {
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, "y");
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);

    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");
  }
  
  moveTorso(speed) {
    var deltaX = speed * this.walkDirection.x
    var deltaY = speed * this.walkDirection.y
    var deltaZ = speed * this.walkDirection.z

    this.torsoMatrix = translateMat(this.torsoMatrix, deltaX, deltaY, deltaZ);

    var torsoMatrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    var headMatrix  = multMat(torsoMatrix, multMat(this.headMatrix, this.headInitialMatrix));

    this.torso.setMatrix(torsoMatrix);
    this.head .setMatrix(headMatrix);
  }
  
  rotateHead(angle) {
    var headMatrix = this.headMatrix;

    this.headMatrix = idMat4();
    this.headMatrix = rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    var matrix
    matrix = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    
    this.head.setMatrix(matrix);
  }

  // Add methods for other parts
  // TODO

  initialize() {
    // Geometry
    var torsoGeometry   = new THREE.CubeGeometry(this.torsoRadius * 2, this.torsoHeight, this.torsoRadius, 64);
    var headGeometry    = new THREE.CubeGeometry(this.headRadius  * 2, this.headRadius , this.headRadius);
    var armGeometry     = new THREE.SphereGeometry(0.2, 32, 32);
    var forearmGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    var thighGeometry   = new THREE.SphereGeometry(0.5, 16, 48);
    
    // Parts
    this.torso    = new THREE.Mesh(torsoGeometry  , this.material);
    this.head     = new THREE.Mesh(headGeometry   , this.material);
    this.armR     = new THREE.Mesh(armGeometry    , this.material);
    this.armL     = new THREE.Mesh(armGeometry    , this.material);
    this.forearmR = new THREE.Mesh(forearmGeometry, this.material);
    this.forearmL = new THREE.Mesh(forearmGeometry, this.material);
    this.thighR   = new THREE.Mesh(thighGeometry  , this.material);
    

    // Initial transformations
    this.torsoInitialMatrix    = this.initialTorsoMatrix();
    this.headInitialMatrix     = this.initialHeadMatrix();
    this.armRInitialMatrix     = this.initialArmRMatrix();
    this.armLInitialMatrix     = this.initialArmLMatrix();
    this.forearmRInitialMatrix = this.initialForearmRMatrix();
    this.forearmLInitialMatrix = this.initialForearmLMatrix();
    this.thighRInitialMatrix   = this.initialThighRMatrix();

    this.torsoMatrix    = idMat4();
    this.headMatrix     = idMat4();
    this.armRMatrix     = idMat4();
    this.armLMatrix     = idMat4();
    this.forearmRMatrix = idMat4();
    this.forearmLMatrix = idMat4();
    this.thighRMatrix   = idMat4();

    var matrixTorso    = this.torsoInitialMatrix
    var matrixHead     = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    var matrixArmR     = multMat(this.torsoInitialMatrix, this.armRInitialMatrix);
    var matrixArmL     = multMat(this.torsoInitialMatrix, this.armLInitialMatrix);
    var matrixForearmR = multMat(this.torsoInitialMatrix, this.forearmRInitialMatrix);
    var matrixForearmL = multMat(this.torsoInitialMatrix, this.forearmLInitialMatrix);
    var matrixThighR   = multMat(this.torsoInitialMatrix, this.thighRInitialMatrix);

    this.torso   .setMatrix(matrixTorso);
    this.head    .setMatrix(matrixHead);
    this.armR    .setMatrix(matrixArmR);
    this.armL    .setMatrix(matrixArmL);
    this.forearmR.setMatrix(matrixForearmR);
    this.forearmL.setMatrix(matrixForearmL);
    this.thighR  .setMatrix(matrixThighR);

    // Add robot to scene
    scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.armR);
    scene.add(this.armL);
    scene.add(this.forearmR);
    scene.add(this.forearmL);
    scene.add(this.thighR);

    // Add parts
    // TODO
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
      case "Head": break;
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
