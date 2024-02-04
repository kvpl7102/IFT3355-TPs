// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function (a) {
  this.matrix = a;
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};

var start = Date.now();
// SETUP RENDERER AND SCENE
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // white background colour
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
  // Create Identity matrix
  // TODO
  var m = new THREE.Matrix4();
  m.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

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

  translationMatrix.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);

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
        1,
        0,
        0,
        0,
        0,
        cosTheta,
        -sinTheta,
        0,
        0,
        sinTheta,
        cosTheta,
        0,
        0,
        0,
        0,
        1
      );
      break;

    case "y":
      rotationMatrix.set(
        cosTheta,
        0,
        sinTheta,
        0,
        0,
        1,
        0,
        0,
        -sinTheta,
        0,
        cosTheta,
        0,
        0,
        0,
        0,
        1
      );
      break;

    case "z":
      rotationMatrix.set(
        cosTheta,
        -sinTheta,
        0,
        0,
        sinTheta,
        cosTheta,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1
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
      var x = v.x * cosTheta + v.z * sinTheta;
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
  scalingMatrix.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);

  // Multiply the original matrix by the scaling matrix to apply the scaling
  m = multMat(scalingMatrix, matrix);

  return m;
}

class Robot {
  constructor() {
    // Geometry
    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    this.headRadius = 0.32;
    // Add parameters for parts
    // TODO

    // Parameters for Arms
    this.armLength = 2;
    this.armRadiusX = 0.6;
    this.armRadiusY = 0.6;

    // Parameters for Forearms
    this.forearmLength = 2.5;
    this.forearmRadiusX = 0.6;
    this.forearmRadiusY = 0.6;

    // Parameters for Thighs
    this.thighLength = 1;
    this.thighRadiusX = 1;
    this.thighRadiusY = 3;

    // Animation
    this.walkDirection = new THREE.Vector3(0, 0, 1);

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize();
  }
  // ------------------------------------------------------------------------------------------------
  // Torso Matrix
  initialTorsoMatrix() {
    var initialTorsoMatrix = idMat4();
    initialTorsoMatrix = translateMat(
      initialTorsoMatrix,
      0,
      this.torsoHeight + 0.5,
      0
    );

    return initialTorsoMatrix;
  }
  // ------------------------------------------------------------------------------------------------
  // Head Matrix
  initialHeadMatrix() {
    var initialHeadMatrix = idMat4();
    initialHeadMatrix = translateMat(
      initialHeadMatrix,
      0,
      this.torsoHeight / 2 + this.headRadius,
      0
    );

    return initialHeadMatrix;
  }
  // ------------------------------------------------------------------------------------------------
  // Arms Matrices
  initialArm1Matrix() {
    var initialArm1Matrix = idMat4();

    initialArm1Matrix = translateMat(
      initialArm1Matrix,
      -2 * this.torsoRadius,
      this.torsoHeight / 2,
      0.1
    );
    initialArm1Matrix = rescaleMat(
      initialArm1Matrix,
      this.armRadiusX,
      this.armRadiusY,
      this.armLength
    );
    return initialArm1Matrix;
  }

  initialArm2Matrix() {
    var initialArm2Matrix = idMat4();

    initialArm2Matrix = translateMat(
      initialArm2Matrix,
      this.torsoRadius * 2,
      this.torsoHeight / 2,
      0.1
    );
    initialArm2Matrix = rescaleMat(
      initialArm2Matrix,
      this.armRadiusX,
      this.armRadiusY,
      this.armLength
    );
    return initialArm2Matrix;
  }
  // ------------------------------------------------------------------------------------------------
  // Forearms Matrices
  initialForearm1Matrix() {
    var initialForearm1Matrix = idMat4();

    initialForearm1Matrix = translateMat(
      initialForearm1Matrix,
      -2 * this.torsoRadius,
      this.torsoHeight / 2,
      this.forearmLength - this.armLength - 0.07
    );

    initialForearm1Matrix = rescaleMat(
      initialForearm1Matrix,
      this.forearmRadiusX,
      this.forearmRadiusY,
      this.forearmLength
    );

    return initialForearm1Matrix;
  }

  initialForearm2Matrix() {
    var initialForearm2Matrix = idMat4();

    initialForearm2Matrix = translateMat(
      initialForearm2Matrix,
      this.torsoRadius * 2,
      this.torsoHeight / 2,
      this.forearmLength - this.armLength - 0.07
    );

    initialForearm2Matrix = rescaleMat(
      initialForearm2Matrix,
      this.forearmRadiusX,
      this.forearmRadiusY,
      this.forearmLength
    );

    return initialForearm2Matrix;
  }
  // ------------------------------------------------------------------------------------------------
  // Thighs Matrices
  initialThigh1Matrix() {
    var initialThigh1Matrix = idMat4();

    initialThigh1Matrix = translateMat(
      initialThigh1Matrix,
      4,
      5,
      0.1
    );

    initialThigh1Matrix = rescaleMat(
      initialThigh1Matrix,
      this.thighRadiusX,
      this.thighRadiusY,
      this.thighLength
    );

    return initialThigh1Matrix;
  }
  // ------------------------------------------------------------------------------------------------
  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(
      2 * this.torsoRadius,
      this.torsoHeight,
      this.torsoRadius,
      64
    );
    this.torso = new THREE.Mesh(torsoGeometry, this.material);
    // ------------------------------------------------------------------------------------------------
    // Head
    var headGeometry = new THREE.CubeGeometry(
      2 * this.headRadius,
      this.headRadius,
      this.headRadius
    );
    this.head = new THREE.Mesh(headGeometry, this.material);
    // Add parts
    // TODO

    // Arms
    var armGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    this.arm1 = new THREE.Mesh(armGeometry, this.material);
    this.arm2 = new THREE.Mesh(armGeometry, this.material);

    // Forearms
    var forearmGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    this.forearm1 = new THREE.Mesh(forearmGeometry, this.material);
    this.forearm2 = new THREE.Mesh(forearmGeometry, this.material);

    // Thighs
    var thighGeometry = new THREE.SphereGeometry(0.5, 16, 48);
    this.thigh1 = new THREE.Mesh(thighGeometry, this.material);

    // ------------------------------------------------------------------------------------------------
    // Torso transformation
    this.torsoInitialMatrix = this.initialTorsoMatrix();
    this.torsoMatrix = idMat4();
    this.torso.setMatrix(this.torsoInitialMatrix);

    // ------------------------------------------------------------------------------------------------
    // Head transformation
    this.headInitialMatrix = this.initialHeadMatrix();
    this.headMatrix = idMat4();
    var matrixHead = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrixHead);
    // ------------------------------------------------------------------------------------------------
    // Add transformations
    // TODO

    // Arms transformations
    this.arm1InitialMatrix = this.initialArm1Matrix();
    this.arm1Matrix = idMat4();
    var matrixArm1 = multMat(this.torsoInitialMatrix, this.arm1InitialMatrix);
    this.arm1.setMatrix(matrixArm1);

    this.arm2InitialMatrix = this.initialArm2Matrix();
    this.arm2Matrix = idMat4();
    var matrixArm2 = multMat(this.torsoInitialMatrix, this.arm2InitialMatrix);
    this.arm2.setMatrix(matrixArm2);

    // ------------------------------------------------------------------------------------------------
    // Forearms transformations
    this.forearm1InitialMatrix = this.initialForearm1Matrix();
    this.forearm1Matrix = idMat4();
    var matrixForearm1 = multMat(
      this.torsoInitialMatrix,
      this.forearm1InitialMatrix
    );
    this.forearm1.setMatrix(matrixForearm1);

    this.forearm2InitialMatrix = this.initialForearm2Matrix();
    this.forearm2Matrix = idMat4();
    var matrixForearm2 = multMat(
      this.torsoInitialMatrix,
      this.forearm2InitialMatrix
    );
    this.forearm2.setMatrix(matrixForearm2);

    // ------------------------------------------------------------------------------------------------
    // Thighs transformations
    this.thigh1InitialMatrix = this.initialThigh1Matrix();
    this.thigh1Matrix = idMat4();
    var matrixThigh1 = multMat(
      this.torsoInitialMatrix,
      this.thigh1InitialMatrix
    );
    this.thigh1.setMatrix(matrixThigh1);
    // this.thigh1.setMatrix(this.thigh1Matrix);

    // ------------------------------------------------------------------------------------------------
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
  // ------------------------------------------------------------------------------------------------
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
  // ------------------------------------------------------------------------------------------------
  moveTorso(speed) {
    this.torsoMatrix = translateMat(
      this.torsoMatrix,
      speed * this.walkDirection.x,
      speed * this.walkDirection.y,
      speed * this.walkDirection.z
    );

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);
  }
  // ------------------------------------------------------------------------------------------------
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
      case "Torso":
        robot.moveTorso(0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // DOWN
  if (keyboard.pressed("s")) {
    switch (components[selectedRobotComponent]) {
      case "Torso":
        robot.moveTorso(-0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // LEFT
  if (keyboard.pressed("a")) {
    switch (components[selectedRobotComponent]) {
      case "Torso":
        robot.rotateTorso(0.1);
        break;
      case "Head":
        robot.rotateHead(0.1);
        break;
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")) {
    switch (components[selectedRobotComponent]) {
      case "Torso":
        robot.rotateTorso(-0.1);
        break;
      case "Head":
        robot.rotateHead(-0.1);
        break;
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
