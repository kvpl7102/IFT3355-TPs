
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


class Robot {
  constructor() {
    
    const headsize = 0.64
    // Normal body dimensions:
    // head   : 1 head
    // torso  : 3 heads
    // arm    : 1.25 head
    // forearm: 1 head
    // thigh  : 1.75 head
    // leg    : 1.5 head

    this.headRadius    = headsize / 2

    this.torsoLength   = headsize * 3
    this.armLength     = headsize * 1.25
    this.forearmLength = headsize
    this.thighLength   = headsize * 1.75
    this.legLength     = headsize * 1.5
    
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

  initialTorsoMatrix() {
    var initialTorsoMatrix = idMat4();

    var x = 0
    var y = this.torsoLength + this.thighLength + this.legLength
    var z = 0

    return translateMat(initialTorsoMatrix, x, y, z);
  }

  initialHeadMatrix() {
    var initialHeadMatrix = idMat4();

    var x = 0
    var y = this.torsoLength / 2 + this.headRadius
    var z = 0

    return translateMat(initialHeadMatrix, x, y, z);
  }

  initialArmMatrix(side) {
    
    var x = this.torsoRadius + this.armRadius
    var y = this.torsoLength / 2 - this.armRadius
    var z = this.armLength - this.torsoRadius / 2 
    
    if (side == "left") {
      x *= -1
    }
    
    var matrix = idMat4();
    matrix = rescaleMat(matrix, this.armRadius, this.armRadius, this.armLength);
    matrix = translateMat(matrix, x, y, z);
    
    return matrix;
  }

  initialForearmMatrix(side) {
    
    var x = this.torsoRadius + this.armRadius
    var y = this.torsoLength /  2 - this.armRadius
    var z = this.armLength * 2 + this.forearmLength - this.torsoRadius / 2
    
    if (side == "left") {
      x *= -1
    }

    var matrix = idMat4();
    matrix = rescaleMat(matrix, this.forearmRadius, this.forearmRadius, this.forearmLength);
    matrix = translateMat(matrix, x, y, z);

    return matrix;
  }

  initialThighMatrix(side) {
    
    var x = this.torsoRadius - this.thighRadius
    var y = - this.torsoLength / 2
    var z = this.thighLength - this.torsoRadius / 2
    
    if (side == "left") {
      x *= -1
    }
    
    var matrix = idMat4()
    matrix = rescaleMat(matrix, this.thighRadius, this.thighRadius, this.thighLength);
    matrix = translateMat(matrix, x, y, z);

    return matrix
  }


  initialLegMatrix(side) {
    
    var x = this.torsoRadius - this.thighRadius
    var y = - this.torsoLength / 2
    var z = this.legLength + this.thighLength * 2 - this.torsoRadius / 2

    if (side == "left") {
      x *= -1
    }
    
    var matrix = idMat4();
    matrix = rescaleMat(matrix, this.legRadius, this.legRadius, this.legLength);
    matrix = translateMat(matrix, x, y, z);

    return matrix;
  }

  moveTorso(speed) {
    var deltaX = speed * this.walkDirection.x
    var deltaY = speed * this.walkDirection.y
    var deltaZ = speed * this.walkDirection.z

    this.torsoMatrix = translateMat(this.torsoMatrix, deltaX, deltaY, deltaZ);
    this.updateLimbs()
  }

  rotateTorso(angle) {

    var rotationMatrix = rotateMat(idMat4(), angle, "y");
    this.torsoMatrix = multMat(this.torsoMatrix, rotationMatrix);

    this.updateLimbs()

    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");
  }
  
  rotateHead(angle) {
    var headMatrix = this.headMatrix;

    this.headMatrix = idMat4();
    this.headMatrix = rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    this.updateLimbs("head")
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
      case "torso"   : this.updateTorso   (); break;
      case "head"    : this.updateHead    (); break;
      case "armR"    : this.updateArmR    (); break;
      case "armL"    : this.updateArmL    (); break;
      case "forearmR": this.updateForearmR(); break;
      case "forearmL": this.updateForearmL(); break;
      case "thighR"  : this.updateThighR  (); break;
      case "thighL"  : this.updateThighL  (); break;
      case "legR"    : this.updateLegR    (); break;
      case "legL"    : this.updateLegL    (); break;
    }
    
    childLimbs[parentLimbName].forEach((limb) => this.updateLimbs(limb))
  }
  
  updateTorso() {
    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);
  }
  updateHead() {
    var matrix = multMat(this.torso.matrix, multMat(this.headMatrix, this.headInitialMatrix));
    this.head.setMatrix(matrix);
  }

  updateArmR() {
    var matrix = multMat(this.torso.matrix, multMat(this.armRMatrix, this.armRInitialMatrix));
    this.armR.setMatrix(matrix);
  }

  updateArmL() {
    var matrix = multMat(this.torso.matrix, multMat(this.armLMatrix, this.armLInitialMatrix));
    this.armL.setMatrix(matrix);
  }

  updateForearmR() {
    var matrix = multMat(this.torso.matrix, multMat(this.forearmRMatrix, this.forearmRInitialMatrix));
    this.forearmR.setMatrix(matrix);
  }

  updateForearmL() {
    var matrix = multMat(this.torso.matrix, multMat(this.forearmLMatrix, this.forearmLInitialMatrix));
    this.forearmL.setMatrix(matrix);
  }

  updateThighR() {
    var matrix = multMat(this.torso.matrix, multMat(this.thighRMatrix, this.thighRInitialMatrix));
    this.thighR.setMatrix(matrix);
  }

  updateThighL() {
    var matrix = multMat(this.torso.matrix, multMat(this.thighLMatrix, this.thighLInitialMatrix));
    this.thighL.setMatrix(matrix);
  }

  updateLegR() {
    var matrix = multMat(this.torso.matrix, multMat(this.legRMatrix, this.legRInitialMatrix));
    this.legR.setMatrix(matrix);
  }

  updateLegL() {
    var matrix = multMat(this.torso.matrix, multMat(this.legLMatrix, this.legLInitialMatrix));
    this.legL.setMatrix(matrix);
  }

  initialize() {
    // Geometry
    var torsoGeometry   = new THREE.CubeGeometry(this.torsoRadius * 2, this.torsoLength, this.torsoRadius, 64);
    var headGeometry    = new THREE.CubeGeometry(this.headRadius  * 2, this.headRadius , this.headRadius);
    var armGeometry     = new THREE.SphereGeometry(1, 32, 32);
    var forearmGeometry = new THREE.SphereGeometry(1, 32, 32);
    var thighGeometry   = new THREE.SphereGeometry(1, 32, 32);
    var legGeometry     = new THREE.SphereGeometry(1, 32, 32);
    
    // Parts
    this.torso    = new THREE.Mesh(torsoGeometry  , this.material);
    this.head     = new THREE.Mesh(headGeometry   , this.material);
    this.armR     = new THREE.Mesh(armGeometry    , this.material);
    this.armL     = new THREE.Mesh(armGeometry    , this.material);
    this.forearmR = new THREE.Mesh(forearmGeometry, this.material);
    this.forearmL = new THREE.Mesh(forearmGeometry, this.material);
    this.thighR   = new THREE.Mesh(thighGeometry  , this.material);
    this.thighL   = new THREE.Mesh(thighGeometry  , this.material);
    this.legR     = new THREE.Mesh(legGeometry    , this.material);
    this.legL     = new THREE.Mesh(legGeometry    , this.material);
    

    // Initial transformations
    this.torsoInitialMatrix    = this.initialTorsoMatrix();
    this.headInitialMatrix     = this.initialHeadMatrix();
    this.armRInitialMatrix     = this.initialArmMatrix("right");
    this.armLInitialMatrix     = this.initialArmMatrix("left");
    this.forearmRInitialMatrix = this.initialForearmMatrix("right");
    this.forearmLInitialMatrix = this.initialForearmMatrix("left");
    this.thighRInitialMatrix   = this.initialThighMatrix("right");
    this.thighLInitialMatrix   = this.initialThighMatrix("left");
    this.legRInitialMatrix     = this.initialLegMatrix("right");
    this.legLInitialMatrix     = this.initialLegMatrix("left");

    this.torsoMatrix    = idMat4();
    this.headMatrix     = idMat4();
    this.armRMatrix     = idMat4();
    this.armLMatrix     = idMat4();
    this.forearmRMatrix = idMat4();
    this.forearmLMatrix = idMat4();
    this.thighRMatrix   = idMat4();
    this.thighLMatrix   = idMat4();
    this.legRMatrix     = idMat4();
    this.legLMatrix     = idMat4();

    this.updateLimbs()

    // Add robot to scene
    scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.armR);
    scene.add(this.armL);
    scene.add(this.forearmR);
    scene.add(this.forearmL);
    scene.add(this.thighR);
    scene.add(this.thighL);
    scene.add(this.legR);
    scene.add(this.legL);
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
