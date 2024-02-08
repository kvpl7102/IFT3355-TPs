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

  // Create a new matrix to store the rotation
  var rotationMatrix = new THREE.Matrix4();

  // Calculate sine and cosine values based on the angle
  var cosTheta = Math.cos(angle);
  var sinTheta = Math.sin(angle);

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

  // Calculate sine and cosine values based on the angle
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
    // body dimensions:
    // const headsize = 0.64;

    // this.torsoLength = headsize * 2.7;
    // this.leftArmength = headsize * 1.25;
    // this.foreleftArmength = headsize;
    // this.thighLength = headsize * 1.75;
    // this.legLength = headsize * 1.5;

    // this.headRadius = headsize / 2;
    // this.torsoRadius = 0.75;
    // this.rightArmadius = 0.15;
    // this.forerightArmadius = 0.12;
    // this.thighRadius = 0.25;
    // this.legRadius = 0.2;

    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    this.headRadius = 0.32;

    this.armsHeight = 0.8;
    this.armsRadius = 0.3;
    this.forearmsHeight = 0.4;
    this.forearmsRadius = 0.2;

    this.lowerHeight = (5 / 4) * this.torsoHeight;
    this.thighsRadius = this.lowerHeight / 6;
    this.legsRadius = this.lowerHeight / 6;

    this.walkDirection = new THREE.Vector3(0, 0, 1); // Animation
    this.material = new THREE.MeshNormalMaterial(); // Material

    // Initial pose
    this.initialize();
  }

  // Initial Torso Matrix
  initialTorsoMatrix() {
    var initialTorsoMatrix = idMat4();
    initialTorsoMatrix = translateMat(
      initialTorsoMatrix,
      0,
      this.torsoHeight / 2 + this.lowerHeight,
      0
    );

    return initialTorsoMatrix;
  }

  // Initial Head Matrix
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

  // Initial Arms Matrices
  initialArmsMatrix(side) {
    var initialArmsMatrix = idMat4();

    switch (side) {
      case "left":
        initialArmsMatrix = translateMat(
          initialArmsMatrix,
          this.torsoRadius * 2.35,
          this.armsHeight / 3,
          0
        );
        initialArmsMatrix = rescaleMat(initialArmsMatrix, 0.5, 1.5, 0.5);
        break;

      case "right":
        initialArmsMatrix = translateMat(
          initialArmsMatrix,
          -this.torsoRadius * 2.35,
          this.armsHeight / 3,
          0
        );
        initialArmsMatrix = rescaleMat(initialArmsMatrix, 0.5, 1.5, 0.5);
        break;

      default:
        break;
    }
    return initialArmsMatrix;
  }

  // Initial Forearms Matrices
  initialForearmsMatrix(side) {
    var initialForearmsMatrix = idMat4();

    switch (side) {
      case "left":
        initialForearmsMatrix = translateMat(
          initialForearmsMatrix,
          this.torsoRadius * 2.35,
          this.armsHeight * 0.95,
          0
        );
        initialForearmsMatrix = rescaleMat(
          initialForearmsMatrix,
          0.5,
          1.5,
          0.5
        );
        break;

      case "right":
        initialForearmsMatrix = translateMat(
          initialForearmsMatrix,
          -this.torsoRadius * 2.35,
          this.armsHeight * 0.95,
          0
        );
        initialForearmsMatrix = rescaleMat(
          initialForearmsMatrix,
          0.5,
          1.5,
          0.5
        );
        break;

      default:
        break;
    }

    return initialForearmsMatrix;
  }

  // Initial Thighs Matrices
  initialThighsMatrix(side) {
    var initialThighsMatrix = idMat4();

    switch (side) {
      case "left":
        initialThighsMatrix = translateMat(
          initialThighsMatrix,
          this.torsoRadius,
          (-2 * (this.torsoRadius + this.thighsRadius * 1.5)) / 3,
          0
        );
        initialThighsMatrix = rescaleMat(initialThighsMatrix, 0.75, 1.5, 0.75);
        break;

      case "right":
        initialThighsMatrix = translateMat(
          initialThighsMatrix,
          -this.torsoRadius,
          (-2 * (this.torsoRadius + this.thighsRadius * 1.5)) / 3,
          0
        );
        initialThighsMatrix = rescaleMat(initialThighsMatrix, 0.75, 1.5, 0.75);
        break;

      default:
        break;
    }

    return initialThighsMatrix;
  }

  // Initial Legs Matrices
  initialLegsMatrix(side) {
    var initialLegsMatrix = idMat4();

    switch (side) {
      case "left":
        initialLegsMatrix = translateMat(
          initialLegsMatrix,
          this.torsoRadius * 1.5,
          (-2 * (this.torsoRadius + this.thighsRadius * 1.5)) / 3 -
            (this.thighsRadius + this.legsRadius),
          0
        );
        initialLegsMatrix = rescaleMat(initialLegsMatrix, 0.5, 1.5, 0.5);
        break;

      case "right":
        initialLegsMatrix = translateMat(
          initialLegsMatrix,
          -this.torsoRadius * 1.5,
          (-2 * (this.torsoRadius + this.thighsRadius * 1.5)) / 3 -
            (this.thighsRadius + this.legsRadius),
          0
        );
        initialLegsMatrix = rescaleMat(initialLegsMatrix, 0.5, 1.5, 0.5);
        break;

      default:
        break;
    }

    return initialLegsMatrix;
  }

  initialize() {
    // --------------------------------------------------------------------------------------
    // Add parts
    // Torso

    var torsoGeometry = new THREE.CubeGeometry(
      2 * this.torsoRadius,
      this.torsoHeight,
      this.torsoRadius,
      64
    );
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(
      2 * this.headRadius,
      this.headRadius,
      this.headRadius
    );
    this.head = new THREE.Mesh(headGeometry, this.material);

    // Arms
    var armsGeometry = new THREE.SphereGeometry(this.armsRadius, 32, 32);
    this.rightArm = new THREE.Mesh(armsGeometry, this.material);
    this.leftArm = new THREE.Mesh(armsGeometry, this.material);

    //Forearms
    var forearmsGeometry = new THREE.SphereGeometry(
      this.forearmsRadius,
      32,
      32
    );
    this.rightForearm = new THREE.Mesh(forearmsGeometry, this.material);
    this.leftForearm = new THREE.Mesh(forearmsGeometry, this.material);

    //Thighs
    var thighsGeometry = new THREE.SphereGeometry(this.thighsRadius, 32, 32);
    this.leftThigh = new THREE.Mesh(thighsGeometry, this.material);
    this.rightThigh = new THREE.Mesh(thighsGeometry, this.material);

    //Legs
    var legsGeometry = new THREE.SphereGeometry(this.legsRadius, 32, 32);
    this.leftLeg = new THREE.Mesh(legsGeometry, this.material);
    this.rightLeg = new THREE.Mesh(legsGeometry, this.material);

    // --------------------------------------------------------------------------------------
    // Transformations

    // Torse transformation
    this.torsoInitialMatrix = this.initialTorsoMatrix();
    this.torsoMatrix = idMat4();
    this.torso.setMatrix(this.torsoInitialMatrix);

    // Head transformation
    this.headInitialMatrix = this.initialHeadMatrix();
    this.headMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrix);

    // Arms transformation
    // Left arm
    this.leftArmInitialMatrix = this.initialArmsMatrix("left");
    this.leftArmMatrix = idMat4();
    this.leftArm.setMatrix(
      multMat(this.torsoInitialMatrix, this.leftArmInitialMatrix)
    );

    // Right arm
    this.rightArmInitialMatrix = this.initialArmsMatrix("right");
    this.rightArmMatrix = idMat4();
    this.rightArm.setMatrix(
      multMat(this.torsoInitialMatrix, this.rightArmInitialMatrix)
    );

    // Forearms transformation
    // Left forearm
    this.leftForearmInitialMatrix = this.initialForearmsMatrix("left");
    this.leftForearmMatrix = idMat4();
    this.leftForearm.setMatrix(
      multMat(this.torsoInitialMatrix, this.leftForearmInitialMatrix)
    );

    // Right forearm
    this.rightForearmInitialMatrix = this.initialForearmsMatrix("right");
    this.rightForearmMatrix = idMat4();
    this.rightForearm.setMatrix(
      multMat(this.torsoInitialMatrix, this.rightForearmInitialMatrix)
    );

    // Legs transformation
    // Left leg
    this.leftLegInitialMatrix = this.initialLegsMatrix("left");
    this.leftLegMatrix = idMat4();
    this.leftLeg.setMatrix(
      multMat(this.torsoInitialMatrix, this.leftLegInitialMatrix)
    );

    // Right leg
    this.rightLegInitialMatrix = this.initialLegsMatrix("right");
    this.rightLegMatrix = idMat4();
    this.rightLeg.setMatrix(
      multMat(this.torsoInitialMatrix, this.rightLegInitialMatrix)
    );

    //Thighs transformation
    // Left thigh
    this.leftThighInitialMatrix = this.initialThighsMatrix("left");
    this.leftThighMatrix = idMat4();
    this.leftThigh.setMatrix(
      multMat(this.torsoInitialMatrix, this.leftThighInitialMatrix)
    );

    // Right thigh
    this.rightThighInitialMatrix = this.initialThighsMatrix("right");
    this.rightThighMatrix = idMat4();
    this.rightThigh.setMatrix(
      multMat(this.torsoInitialMatrix, this.rightThighInitialMatrix)
    );

    // Add robot to scene
    scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.leftArm);
    scene.add(this.rightArm);
    scene.add(this.leftForearm);
    scene.add(this.rightForearm);
    scene.add(this.leftThigh);
    scene.add(this.rightThigh);
    scene.add(this.leftLeg);
    scene.add(this.rightLeg);

    //Saved variables for animation later
    this.totalAngle1 = 0; //Pour l'angle de la jambe
    this.halfWalk = true; //Pour si l'animation avance ou recule
  }

  rotateTorso(angle) {
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, "y");
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrix);

    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    var matrix1 = multMat(matrix, matrix2);
    this.head.setMatrix(matrix1);

    // Attaching body parts to the torso rotation

    // Attach arms
    this.leftArm.setMatrix(
      multMat(matrix, multMat(this.leftArmMatrix, this.leftArmInitialMatrix))
    );
    this.rightArm.setMatrix(
      multMat(matrix, multMat(this.rightArmMatrix, this.rightArmInitialMatrix))
    );

    // Attach forearms
    this.leftForearm.setMatrix(
      multMat(
        matrix,
        multMat(this.leftForearmMatrix, this.leftForearmInitialMatrix)
      )
    );
    this.rightForearm.setMatrix(
      multMat(
        matrix,
        multMat(this.rightForearmMatrix, this.rightForearmInitialMatrix)
      )
    );

    // Attach thighs
    this.leftThigh.setMatrix(
      multMat(
        matrix,
        multMat(this.leftThighMatrix, this.leftThighInitialMatrix)
      )
    );
    this.rightThigh.setMatrix(
      multMat(
        matrix,
        multMat(this.rightThighMatrix, this.rightThighInitialMatrix)
      )
    );

    // Attach legs
    this.leftLeg.setMatrix(
      multMat(matrix, multMat(this.leftLegMatrix, this.leftLegInitialMatrix))
    );
    this.rightLeg.setMatrix(
      multMat(matrix, multMat(this.rightLegMatrix, this.rightLegInitialMatrix))
    );

    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");
  }

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
    var matrix1 = multMat(matrix, matrix2);
    this.head.setMatrix(matrix1);

    // Attach body parts to torso movement

    // Attach arms
    this.leftArm.setMatrix(
      multMat(matrix, multMat(this.leftArmMatrix, this.leftArmInitialMatrix))
    );
    this.rightArm.setMatrix(
      multMat(matrix, multMat(this.rightArmMatrix, this.rightArmInitialMatrix))
    );

    // Attach forearms
    this.leftForearm.setMatrix(
      multMat(
        matrix,
        multMat(this.leftForearmMatrix, this.leftForearmInitialMatrix)
      )
    );
    this.rightForearm.setMatrix(
      multMat(
        matrix,
        multMat(this.rightForearmMatrix, this.rightForearmInitialMatrix)
      )
    );

    // Attach thighs
    this.leftThigh.setMatrix(
      multMat(
        matrix,
        multMat(this.leftThighMatrix, this.leftThighInitialMatrix)
      )
    );
    this.rightThigh.setMatrix(
      multMat(
        matrix,
        multMat(this.rightThighMatrix, this.rightThighInitialMatrix)
      )
    );

    // Attach legs
    this.leftLeg.setMatrix(
      multMat(matrix, multMat(this.leftLegMatrix, this.leftLegInitialMatrix))
    );
    this.rightLeg.setMatrix(
      multMat(matrix, multMat(this.rightLegMatrix, this.rightLegInitialMatrix))
    );
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

  // Function to rotate arms (and forearms)
  rotateArm(side, angle) {
    var rotationMatrix = rotateMat(idMat4(), angle, "x");

    if (side == "left") {
      this.leftArmMatrix = multMat(this.leftArmMatrix, rotationMatrix);

      var transformationMatrix = multMat(
        this.leftArmMatrix,
        this.leftArmInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.leftArm.setMatrix(transformationMatrix);
      this.rotateForearm(side, angle);
    } else {
      this.rightArmMatrix = multMat(this.rightArmMatrix, rotationMatrix);

      var transformationMatrix = multMat(
        this.rightArmMatrix,
        this.rightArmInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.rightArm.setMatrix(transformationMatrix);
      this.rotateForearm(side, angle);
    }
  }

  // Function to rotate forearms
  rotateForearm(side, angle) {
    var rotationMatrix = rotateMat(idMat4(), angle, "x");

    if (side == "left") {
      this.leftForearmMatrix = multMat(this.leftForearmMatrix, rotationMatrix);

      var transformationMatrix = multMat(
        this.leftForearmMatrix,
        this.leftForearmInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.leftForearm.setMatrix(transformationMatrix);
    } else {
      this.rightForearmMatrix = multMat(
        this.rightForearmMatrix,
        rotationMatrix
      );

      var transformationMatrix = multMat(
        this.rightForearmMatrix,
        this.rightForearmInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.rightForearm.setMatrix(transformationMatrix);
    }
  }

  // Function to rotate thighs (and legs)
  rotateThigh(side, angle) {
    var rotationMatrix = rotateMat(idMat4(), angle, "x");

    if (side == "left") {
      this.leftThighMatrix = multMat(this.leftThighMatrix, rotationMatrix);

      var transformationMatrix = multMat(
        this.leftThighMatrix,
        this.leftThighInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.leftThigh.setMatrix(transformationMatrix);
      this.rotateLeg(side, angle);
    } else {
      this.rightThighMatrix = multMat(this.rightThighMatrix, rotationMatrix);

      var transformationMatrix = multMat(
        this.rightThighMatrix,
        this.rightThighInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.rightThigh.setMatrix(transformationMatrix);
      this.rotateLeg(side, angle);
    }
  }

  // Function to rotate legs
  rotateLeg(side, angle) {
    var rotationMatrix = rotateMat(idMat4(), angle, "x");

    if (side == "left") {
      this.leftLegMatrix = multMat(this.leftLegMatrix, rotationMatrix);

      var transformationMatrix = multMat(
        this.leftLegMatrix,
        this.leftLegInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.leftLeg.setMatrix(transformationMatrix);
    } else {
      this.rightLegMatrix = multMat(this.rightLegMatrix, rotationMatrix);

      var transformationMatrix = multMat(
        this.rightLegMatrix,
        this.rightLegInitialMatrix
      );
      transformationMatrix = multMat(this.torsoMatrix, transformationMatrix);
      transformationMatrix = multMat(
        this.torsoInitialMatrix,
        transformationMatrix
      );

      this.rightLeg.setMatrix(transformationMatrix);
    }
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
  "Left forearm",
  "Left arm",
  "Right forearm",
  "Right arm",
  "Left thigh",
  "Left leg",
  "Right thigh",
  "Right leg",
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
      case "Left arm":
        robot.rotateArm("left", 0.1);
        break;
      case "Left forearm":
        robot.rotateForearm("left", 0.1);
        break;
      case "Right arm":
        robot.rotateArm("right", 0.1);
        break;
      case "Right forearm":
        robot.rotateForearm("right", 0.1);
        break;
      case "Left thigh":
        robot.rotateThigh("left", 0.05);
        break;
      case "Left leg":
        robot.rotateLeg("left", 0.05);
        break;
      case "Right thigh":
        robot.rotateThigh("right", 0.05);
        break;
      case "Right leg":
        robot.rotateLeg("right", 0.05);
        break;
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
      case "Left arm":
        robot.rotateArm("left", -0.1);
        break;
      case "Left forearm":
        robot.rotateForearm("left", -0.1);
        break;
      case "Right arm":
        robot.rotateArm("right", -0.1);
        break;
      case "Right forearm":
        robot.rotateForearm("left", -0.1);
        break;
      case "Left thigh":
        robot.rotateThigh("left", -0.05);
        break;
      case "Left leg":
        robot.rotateLeg("left", -0.05);
        break;
      case "Right thigh":
        robot.rotateThigh("right", -0.05);
        break;
      case "Right leg":
        robot.rotateLeg("right", -0.05);
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
      case "Left arm":
        break;
      case "Left forearm":
        break;
      case "Right arm":
        break;
      case "Right forearm":
        break;
      case "Left thigh":
        break;
      case "Left leg":
        break;
      case "Right thigh":
        break;
      case "Right leg":
        break;
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
      case "Left arm":
        break;
      case "Left forearm":
        break;
      case "Right arm":
        break;
      case "Right forearm":
        break;
      case "Left thigh":
        break;
      case "Left leg":
        break;
      case "Right thigh":
        break;
      case "Right leg":
        break;
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
