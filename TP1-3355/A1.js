
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

  initialArm1Matrix() {
    var initialArm1Matrix = idMat4();

    var x = this.torsoRadius * -2
    var y = this.torsoHeight /  2
    var z = 0.1

    initialArm1Matrix = translateMat(initialArm1Matrix, x, y, z);
    initialArm1Matrix = rescaleMat(initialArm1Matrix, this.armRadiusX, this.armRadiusY, this.armLength);
    
    return initialArm1Matrix;
  }
  
  initialArm2Matrix() {
    var initialArm2Matrix = idMat4();

    var x = this.torsoRadius * 2
    var y = this.torsoHeight / 2
    var z = 0.1

    initialArm2Matrix = translateMat(initialArm2Matrix, x, y, z);
    initialArm2Matrix = rescaleMat(initialArm2Matrix, this.armRadiusX, this.armRadiusY, this.armLength);
    
    return initialArm2Matrix;
  }

  initialForearm1Matrix() {
    var initialForearm1Matrix = idMat4();

    var x = this.torsoRadius * -2
    var y = this.torsoHeight /  2
    var z = this.forearmLength - this.armLength - 0.07

    initialForearm1Matrix = translateMat(initialForearm1Matrix, x, y, z);
    initialForearm1Matrix = rescaleMat(initialForearm1Matrix, this.forearmRadiusX, this.forearmRadiusY, this.forearmLength);

    return initialForearm1Matrix;
  }

  initialForearm2Matrix() {
    var initialForearm2Matrix = idMat4();

    var x = this.torsoRadius * 2
    var y = this.torsoHeight / 2
    var z = this.forearmLength - this.armLength - 0.07
    
    initialForearm2Matrix = translateMat(initialForearm2Matrix, x, y, z);
    initialForearm2Matrix = rescaleMat(initialForearm2Matrix, this.forearmRadiusX, this.forearmRadiusY, this.forearmLength);

    return initialForearm2Matrix;
  }

  initialThigh1Matrix() {
    var initialThigh1Matrix = idMat4();

    var x = 4
    var y = 5
    var z = 0.1

    initialThigh1Matrix = translateMat(initialThigh1Matrix, x, y, z);
    initialThigh1Matrix = rescaleMat(initialThigh1Matrix, this.thighRadiusX, this.thighRadiusY, this.thighLength);

    return initialThigh1Matrix;
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
    var headMatrix  = multMat(this.headMatrix, this.headInitialMatrix);

    var bodyMatrix  = multMat(torsoMatrix, headMatrix);

    this.torso.setMatrix(bodyMatrix);
    this.head .setMatrix(bodyMatrix);
  }
  
  rotateHead(angle) {
    var headMatrix = this.headMatrix;

    this.headMatrix = idMat4();
    this.headMatrix = rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    var matrix = multMat(this.headMatrix, this.headInitialMatrix);
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
    this.arm1     = new THREE.Mesh(armGeometry    , this.material);
    this.arm2     = new THREE.Mesh(armGeometry    , this.material);
    this.forearm1 = new THREE.Mesh(forearmGeometry, this.material);
    this.forearm2 = new THREE.Mesh(forearmGeometry, this.material);
    this.thigh1   = new THREE.Mesh(thighGeometry  , this.material);
    

    // Initial transformations
    this.torsoInitialMatrix    = this.initialTorsoMatrix();
    this.headInitialMatrix     = this.initialHeadMatrix();
    this.arm1InitialMatrix     = this.initialArm1Matrix();
    this.arm2InitialMatrix     = this.initialArm2Matrix();
    this.forearm1InitialMatrix = this.initialForearm1Matrix();
    this.forearm2InitialMatrix = this.initialForearm2Matrix();
    this.thigh1InitialMatrix   = this.initialThigh1Matrix();

    this.torsoMatrix    = idMat4();
    this.headMatrix     = idMat4();
    this.arm1Matrix     = idMat4();
    this.arm2Matrix     = idMat4();
    this.forearm1Matrix = idMat4();
    this.forearm2Matrix = idMat4();
    this.thigh1Matrix   = idMat4();

    var matrixHead     = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    var matrixArm1     = multMat(this.torsoInitialMatrix, this.arm1InitialMatrix);
    var matrixArm2     = multMat(this.torsoInitialMatrix, this.arm2InitialMatrix);
    var matrixForearm1 = multMat(this.torsoInitialMatrix, this.forearm1InitialMatrix);
    var matrixForearm2 = multMat(this.torsoInitialMatrix, this.forearm2InitialMatrix);
    var matrixThigh1   = multMat(this.torsoInitialMatrix, this.thigh1InitialMatrix);

    this.torso   .setMatrix(this.torsoInitialMatrix);
    this.head    .setMatrix(matrixHead);
    this.arm1    .setMatrix(matrixArm1);
    this.arm2    .setMatrix(matrixArm2);
    this.forearm1.setMatrix(matrixForearm1);
    this.forearm2.setMatrix(matrixForearm2);
    this.thigh1  .setMatrix(matrixThigh1);

    // Add robot to scene
    scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.arm1);
    scene.add(this.arm2);
    scene.add(this.forearm1);
    scene.add(this.forearm2);
    scene.add(this.thigh1);

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
