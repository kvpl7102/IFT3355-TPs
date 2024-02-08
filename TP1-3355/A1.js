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

// draw X,Y,Z axes
var axisGeometry = new THREE.BoxGeometry(5, 0.1, 0.1);

var materialX = new THREE.MeshBasicMaterial();
var materialY = new THREE.MeshBasicMaterial();
var materialZ = new THREE.MeshBasicMaterial();

materialX.color.set(new THREE.Color("red"));
materialY.color.set(new THREE.Color("green"));
materialZ.color.set(new THREE.Color("orange"));

var axisX = new THREE.Mesh(axisGeometry, materialX);
var axisY = new THREE.Mesh(axisGeometry, materialY);
var axisZ = new THREE.Mesh(axisGeometry, materialZ);

axisY.rotation.z = Math.PI / 2;
axisZ.rotation.y = Math.PI / 2;

scene.add(axisX);
scene.add(axisY);
scene.add(axisZ);

// TRANSFORMATIONS

function multMat(m1, m2) {
  return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

function inverseMat(m) {
  return new THREE.Matrix4().getInverse(m, true);
}

function idMat4() {
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

class Limb {
  constructor(radius, length, initialPosition, material, parentLimb = null) {
    this.radius = radius;
    this.length = length;
    this.initialPosition = initialPosition;
    this.parentLimb = parentLimb;

    this.shape = new THREE.Mesh(this.geometry(), material);
    this.initialMatrix = this.initialMatrix();
    this.transformation = this.initialMatrix;
    this.joint = {
      x: 0,
      y: 0,
      z: this.parentLimb ? -this.length : 0,
    };

    scene.add(this.shape);
  }

  geometry() {
    /* abstract */
  } // shape of limb (unit size assumed)
  scalingMatrix() {
    /* abstract */
  } // default scaling applied to the shape

  initialMatrix() {
    return translateMat(
      idMat4(),
      this.initialPosition.x,
      this.initialPosition.y,
      this.initialPosition.z
    );
  }

  transformationMatrix() {
    var transformationMatrix = this.transformation;

    if (this.parentLimb !== null) {
      transformationMatrix = multMat(
        this.parentLimb.transformationMatrix(),
        this.transformation
      );
    }

    return transformationMatrix;
  }

  addTransformation(transformation, order = "before") {
    const t1 = order === "after" ? this.transformation : transformation;
    const t2 = order === "before" ? this.transformation : transformation;

    this.transformation = multMat(t1, t2);
  }

  rotateJoint(angle, axis = "y") {
    const translation = translateMat(
      this.initialMatrix,
      this.joint.x,
      this.joint.y,
      this.joint.z
    );
    const rotation = rotateMat(idMat4(), angle, axis);

    this.addTransformation(inverseMat(translation));
    this.addTransformation(rotation);
    this.addTransformation(translation);
  }

  update() {
    this.shape.setMatrix(
      multMat(this.transformationMatrix(), this.scalingMatrix())
    );
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
    // body dimensions:
    const headsize = 0.64;

    this.torsoLength = headsize * 3;
    this.armLength = headsize * 1.25;
    this.forearmLength = headsize;
    this.thighLength = headsize * 1.75;
    this.legLength = headsize * 1.5;

    this.headRadius = headsize / 2;
    this.torsoRadius = 0.75;
    this.armRadius = 0.15;
    this.forearmRadius = 0.12;
    this.thighRadius = 0.25;
    this.legRadius = 0.2;

    this.walkDirection = new THREE.Vector3(0, 0, 1); // Animation
    this.material = new THREE.MeshNormalMaterial(); // Material

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
      torso: ["head", "armR", "armL", "thighR", "thighL"],
      head: [],
      armR: ["forearmR"],
      armL: ["forearmL"],
      forearmR: [],
      forearmL: [],
      thighR: ["legR"],
      thighL: ["legL"],
      legR: [],
      legL: [],
    };

    switch (parentLimbName) {
      case "torso":
        this.torso.update();
        break;
      case "head":
        this.head.update();
        break;
      case "armR":
        this.armR.update();
        break;
      case "armL":
        this.armL.update();
        break;
      case "forearmR":
        this.forearmR.update();
        break;
      case "forearmL":
        this.forearmL.update();
        break;
      case "thighR":
        this.thighR.update();
        break;
      case "thighL":
        this.thighL.update();
        break;
      case "legR":
        this.legR.update();
        break;
      case "legL":
        this.legL.update();
        break;
    }

    childLimbs[parentLimbName].forEach((limb) => this.updateLimbs(limb));
  }

  initialize() {
    // initial positions
    var torsoPosition = {
      x: 0,
      y:
        this.torsoLength / 2 +
        this.thighRadius +
        this.thighLength * 2 +
        this.legLength * 2,
      z: 0,
    };
    var headPosition = {
      x: 0,
      y: this.torsoLength / 2 + this.headRadius,
      z: 0,
    };
    var armRPosition = {
      x: this.torsoRadius + this.armRadius,
      y: this.torsoLength / 2 - this.armRadius,
      z: this.armLength,
    };
    var thighRPosition = {
      x: this.torsoRadius - this.thighRadius,
      y: -this.torsoLength / 2 - this.thighRadius,
      z: this.thighLength,
    };
    var forearmRPosition = {
      x: 0,
      y: 0,
      z: this.armLength + this.forearmLength,
    };
    var legRPosition = { x: 0, y: 0, z: this.thighLength + this.legLength };

    var armLPosition = {
      x: -armRPosition.x,
      y: armRPosition.y,
      z: armRPosition.z,
    };
    var thighLPosition = {
      x: -thighRPosition.x,
      y: thighRPosition.y,
      z: thighRPosition.z,
    };
    var forearmLPosition = {
      x: -forearmRPosition.x,
      y: forearmRPosition.y,
      z: forearmRPosition.z,
    };
    var legLPosition = {
      x: -legRPosition.x,
      y: legRPosition.y,
      z: legRPosition.z,
    };

    // Limbs
    this.torso = new BoxLimb(
      this.torsoRadius,
      this.torsoLength,
      torsoPosition,
      this.material
    );
    this.head = new BoxLimb(
      this.headRadius,
      this.headRadius,
      headPosition,
      this.material,
      this.torso
    );
    this.armR = new SphereLimb(
      this.armRadius,
      this.armLength,
      armRPosition,
      this.material,
      this.torso
    );
    this.armL = new SphereLimb(
      this.armRadius,
      this.armLength,
      armLPosition,
      this.material,
      this.torso
    );
    this.forearmR = new SphereLimb(
      this.forearmRadius,
      this.forearmLength,
      forearmRPosition,
      this.material,
      this.armR
    );
    this.forearmL = new SphereLimb(
      this.forearmRadius,
      this.forearmLength,
      forearmLPosition,
      this.material,
      this.armL
    );
    this.thighR = new SphereLimb(
      this.thighRadius,
      this.thighLength,
      thighRPosition,
      this.material,
      this.torso
    );
    this.thighL = new SphereLimb(
      this.thighRadius,
      this.thighLength,
      thighLPosition,
      this.material,
      this.torso
    );
    this.legR = new SphereLimb(
      this.legRadius,
      this.legLength,
      legRPosition,
      this.material,
      this.thighR
    );
    this.legL = new SphereLimb(
      this.legRadius,
      this.legLength,
      legLPosition,
      this.material,
      this.thighL
    );

    this.rotateArmR(Math.PI / 2, "x");
    this.rotateArmL(Math.PI / 2, "x");
    this.rotateThighR(Math.PI / 2);
    this.rotateThighL(Math.PI / 2);

    this.updateLimbs();

    this.thighAngle = 0; // Angle of thighs
    this.halfWalk = true; // Determine if animation is moving forward or backward
  }

  // Walking animation
  walkAnimation(speed) {
    this.moveTorso(speed);
    speed = Math.abs(speed);

    if (this.thighAngle <= -0.5) {
      this.rotateThighL(-speed);
      this.rotateThighR(speed);
      this.rotateArmL(-speed);
      this.rotateArmR(speed);

      this.thighAngle += speed;
      this.halfWalk = true;
    } else if (this.thighAngle >= 0.5) {
      this.rotateThighL(speed);
      this.rotateThighR(-speed);
      this.rotateArmL(speed);
      this.rotateArmR(-speed);

      this.thighAngle -= speed;
      this.halfWalk = false;
    } else if (this.halfWalk) {
      this.rotateThighL(-speed);
      this.rotateThighR(speed);
      this.rotateArmL(-speed);
      this.rotateArmR(speed);
      this.thighAngle += speed;
    } else if (!this.halfWalk) {
      this.rotateThighL(speed);
      this.rotateThighR(-speed);
      this.rotateArmL(speed);
      this.rotateArmR(-speed);
      this.thighAngle -= speed;
    }

    this.adjustWalk();
  }

  // Function to adjust the height of the robot while walking
  adjustWalk() {
    var walkDirectionTemp = this.walkDirection;

    // Determine the position (on y-axis) of the legs relative to the ground 
    var leftY = this.legL.shape.position.y;
    var rightY = this.legL.shape.position.y;

    if (leftY - rightY < 0) {
      var yMove = -leftY + 1.5 * this.legRadius * Math.cos(this.thighAngle);
    } else {
      var yMove = -rightY + 1.5 * this.legRadius * Math.cos(this.thighAngle);
    }

    this.walkDirection = new THREE.Vector3(0, yMove, 0);
    this.moveTorso(1);

    this.walkDirection = walkDirectionTemp;
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
  "ArmR",
  "ArmL",
  "ForearmR",
  "ForearmL",
  "ThighR",
  "ThighL",
  "LegR",
  "LegL",
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
        robot.walkAnimation(0.1);
        break;
      case "Head":
        /* do nothing */ break;
      case "ArmR":
        robot.rotateArmR(-0.1, "x");
        break;
      case "ArmL":
        robot.rotateArmL(-0.1, "x");
        break;
      case "ForearmR":
        robot.rotateForearmR(-0.1);
        break;
      case "ForearmL":
        robot.rotateForearmL(-0.1);
        break;
      case "ThighR":
        robot.rotateThighR(-0.1);
        break;
      case "ThighL":
        robot.rotateThighL(-0.1);
        break;
      case "LegR":
        robot.rotateLegR(-0.1);
        break;
      case "LegL":
        robot.rotateLegL(-0.1);
        break;
    }
  }

  // DOWN
  if (keyboard.pressed("s")) {
    switch (components[selectedRobotComponent]) {
      case "Torso":
        robot.walkAnimation(-0.1);
        break;
      case "Head":
        /* do nothing */ break;
      case "ArmR":
        robot.rotateArmR(0.1, "x");
        break;
      case "ArmL":
        robot.rotateArmL(0.1, "x");
        break;
      case "ForearmR":
        robot.rotateForearmR(0.1);
        break;
      case "ForearmL":
        robot.rotateForearmL(0.1);
        break;
      case "ThighR":
        robot.rotateThighR(0.1);
        break;
      case "ThighL":
        robot.rotateThighL(0.1);
        break;
      case "LegR":
        robot.rotateLegR(0.1);
        break;
      case "LegL":
        robot.rotateLegL(0.1);
        break;
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
      case "ArmR":
        robot.rotateArmR(-0.1, "y");
        break;
      case "ArmL":
        robot.rotateArmL(-0.1, "y");
        break;
      case "ForearmR":
        /* do nothing */ break;
      case "ForearmL":
        /* do nothing */ break;
      case "ThighR":
        /* do nothing */ break;
      case "ThighL":
        /* do nothing */ break;
      case "LegR":
        /* do nothing */ break;
      case "LegL":
        /* do nothing */ break;
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
      case "ArmR":
        robot.rotateArmR(0.1, "y");
        break;
      case "ArmL":
        robot.rotateArmL(0.1, "y");
        break;
      case "ForearmR":
        /* do nothing */ break;
      case "ForearmL":
        /* do nothing */ break;
      case "ThighR":
        /* do nothing */ break;
      case "ThighL":
        /* do nothing */ break;
      case "LegR":
        /* do nothing */ break;
      case "LegL":
        /* do nothing */ break;
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
