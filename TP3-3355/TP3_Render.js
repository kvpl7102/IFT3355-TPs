
class Branch {
  constructor(node, radialDivisions) {
    this.node            = node
    this.radialDivisions = radialDivisions

    this.init();
    
  }

  init() {
    this.length          = this.node.p0.distanceTo(this.node.p1)
    this.geometry        = new THREE.CylinderBufferGeometry(this.node.a1, this.node.a0, this.length, this.radialDivisions);
    this.axisAngle       = TP3.Geometry.findRotation(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(this.node.p1, this.node.p0));
    this.rotationMatrix  = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(this.axisAngle[0], this.axisAngle[1]));

    this.geometry.applyMatrix4(this.rotationMatrix);
    this.geometry.translate( // move to center
      (this.node.p0.x + this.node.p1.x) / 2,
      (this.node.p0.y + this.node.p1.y) / 2,
      (this.node.p0.z + this.node.p1.z) / 2,
    );
  }
}

class Apple {
  constructor(branch, alpha) {
    this.branch = branch
    this.alpha  = alpha

    this.init()
  }

  init() {
    this.geometry = new THREE.SphereBufferGeometry(0.1, 8, 8);

    let h     = (Math.random() - 0.5) * this.alpha * 2; // random position along the branch
    let theta = Math.random() * Math.PI    * 2; // random translation angle
    let r     = Math.random() * this.alpha / 2; // random distance from branch

    const x = r * Math.cos(theta)
    const y = r * Math.sin(theta)
    const z = h

    const position = this.branch.node.p1.add(new THREE.Vector3(x, y, z));

    this.geometry.translate(position.x, position.y, position.z);
  }
}


class Leaf {
  constructor(branch, alpha) {
    this.branch = branch
    this.alpha  = alpha
    
    this.init()
  }

  init() {
    this.geometry = new THREE.PlaneBufferGeometry(this.alpha, this.alpha)

    let h     = (Math.random() - 0.5) * this.alpha * 2; // random position along the branch
    let theta = Math.random() * Math.PI    * 2; // random translation angle
    let r     = Math.random() * this.alpha / 2; // random distance from branch

    // apply random rotation
    this.geometry.rotateX(Math.random() * Math.PI * 2);
    this.geometry.rotateY(Math.random() * Math.PI * 2);
    this.geometry.rotateZ(Math.random() * Math.PI * 2);

        
    const x = r * Math.cos(theta)
    const y = r * Math.sin(theta)
    const z = h

    const position = this.branch.node.p1.add(new THREE.Vector3(x, y, z));

    this.geometry.translate(position.x, position.y, position.z);
  }
}

class Tree {
  constructor(branches, apples, leaves) {
    this.branches = branches
    this.apples   = apples
    this.leaves   = leaves

    this.init()
  }

  init() {
    
    let branchGeometries = Array.from(this.branches, (branch) => branch.geometry)
    let appleGeometries  = Array.from(this.apples  , (apple ) => apple .geometry)
    let leafGeometries   = Array.from(this.leaves  , (leaf  ) => leaf  .geometry)
    
    // merge branches
    if (branchGeometries.length > 0) {
      this.branchesGeometry = new THREE.CylinderBufferGeometry();
      this.branchesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(branchGeometries);
      this.branchesGeometry = new THREE.Mesh(this.branchesGeometry, new THREE.MeshLambertMaterial({ color: 0x8b5a2b }));
    }

    // merge apples
    if (appleGeometries.length > 0) {
      console.log(appleGeometries)
      this.applesGeometry = new THREE.SphereBufferGeometry();
      this.applesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(appleGeometries);
      this.applesGeometry = new THREE.Mesh(this.applesGeometry, new THREE.MeshPhongMaterial({ color: 0x5f0b0b }));
    }

    // merge leaves
    if (leafGeometries.length > 0) {
      this.leavesGeometry = new THREE.PlaneBufferGeometry();
      this.leavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(leafGeometries);
      this.leavesGeometry = new THREE.Mesh(this.leavesGeometry, new THREE.MeshPhongMaterial({ color: 0x3a5f0b }));
    }
  }
}


TP3.Render = {
  drawTreeRough: function (
    rootNode,
    scene,
    alpha,
    radialDivisions   = 8,
    leavesCutoff      = 0.1,
    leavesDensity     = 10,
    applesProbability = 0.05,
    matrix            = new THREE.Matrix4()
  ) {

    let branches = []
    let apples   = []
    let leaves   = []
    
    let branch = new Branch(rootNode, radialDivisions)
    branches.push(branch)

    if (Math.random() < applesProbability) { // Create apple
      apples.push(new Apple(branch, alpha))
    }

    if (branch.node.a0 < alpha * leavesCutoff) { // Create leaves
      for (var i = 0; i < leavesDensity; i++) {
        leaves.push(new Leaf(branch, alpha));
      }
    }

    if (rootNode.childNode !== undefined) { // recurse children
      for (var i = 0; i < rootNode.childNode.length; i++) {
        let geometries = this.drawTreeRough(
          rootNode.childNode[i],
          scene,
          alpha,
          radialDivisions,
          leavesCutoff,
          leavesDensity,
          applesProbability,
          matrix
        );

        geometries[0].forEach((branch) => branches.push(branch))
        geometries[1].forEach((apple ) => apples  .push(apple ))
        geometries[2].forEach((leaf  ) => leaves  .push(leaf  ))
      }
    }
    if (rootNode.parentNode === null) {
      let tree = new Tree(branches, apples, leaves)

      if (tree.branchesGeometry !== undefined) scene.add(tree.branchesGeometry)
      if (tree.applesGeometry   !== undefined) scene.add(tree.applesGeometry)
      if (tree.leavesGeometry   !== undefined) scene.add(tree.leavesGeometry)
    }
    

    return [branches, apples, leaves]
  },

  drawTreeHermite: function (
    rootNode,
    scene,
    alpha,
    leavesCutoff = 0.1,
    leavesDensity = 10,
    applesProbability = 0.05,
    matrix = new THREE.Matrix4()
  ) {
    //TODO
  },

  updateTreeHermite: function (
    trunkGeometryBuffer,
    leavesGeometryBuffer,
    applesGeometryBuffer,
    rootNode
  ) {
    //TODO
  },

  drawTreeSkeleton: function (
    rootNode,
    scene,
    color = 0xffffff,
    matrix = new THREE.Matrix4()
  ) {
    var stack = [];
    stack.push(rootNode);

    var points = [];

    while (stack.length > 0) {
      var currentNode = stack.pop();

      for (var i = 0; i < currentNode.childNode.length; i++) {
        stack.push(currentNode.childNode[i]);
      }

      points.push(currentNode.p0);
      points.push(currentNode.p1);
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: color });
    var line = new THREE.LineSegments(geometry, material);
    line.applyMatrix4(matrix);
    scene.add(line);

    return line.geometry;
  },

  updateTreeSkeleton: function (geometryBuffer, rootNode) {
    var stack = [];
    stack.push(rootNode);

    var idx = 0;
    while (stack.length > 0) {
      var currentNode = stack.pop();

      for (var i = 0; i < currentNode.childNode.length; i++) {
        stack.push(currentNode.childNode[i]);
      }
      geometryBuffer[idx * 6] = currentNode.p0.x;
      geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
      geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
      geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
      geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
      geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

      idx++;
    }
  },

  drawTreeNodes: function (
    rootNode,
    scene,
    color = 0x00ff00,
    size = 0.05,
    matrix = new THREE.Matrix4()
  ) {
    var stack = [];
    stack.push(rootNode);

    var points = [];

    while (stack.length > 0) {
      var currentNode = stack.pop();

      for (var i = 0; i < currentNode.childNode.length; i++) {
        stack.push(currentNode.childNode[i]);
      }

      points.push(currentNode.p0);
      points.push(currentNode.p1);
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.PointsMaterial({ color: color, size: size });
    var points = new THREE.Points(geometry, material);
    points.applyMatrix4(matrix);
    scene.add(points);
  },

  drawTreeSegments: function (
    rootNode,
    scene,
    lineColor = 0xff0000,
    segmentColor = 0xffffff,
    orientationColor = 0x00ff00,
    matrix = new THREE.Matrix4()
  ) {
    var stack = [];
    stack.push(rootNode);

    var points = [];
    var pointsS = [];
    var pointsT = [];

    while (stack.length > 0) {
      var currentNode = stack.pop();

      for (var i = 0; i < currentNode.childNode.length; i++) {
        stack.push(currentNode.childNode[i]);
      }

      const segments = currentNode.sections;
      for (var i = 0; i < segments.length - 1; i++) {
        points.push(TP3.Geometry.meanPoint(segments[i]));
        points.push(TP3.Geometry.meanPoint(segments[i + 1]));
      }
      for (var i = 0; i < segments.length; i++) {
        pointsT.push(TP3.Geometry.meanPoint(segments[i]));
        pointsT.push(segments[i][0]);
      }

      for (var i = 0; i < segments.length; i++) {
        for (var j = 0; j < segments[i].length - 1; j++) {
          pointsS.push(segments[i][j]);
          pointsS.push(segments[i][j + 1]);
        }
        pointsS.push(segments[i][0]);
        pointsS.push(segments[i][segments[i].length - 1]);
      }
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
    var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

    var material = new THREE.LineBasicMaterial({ color: lineColor });
    var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
    var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

    var line = new THREE.LineSegments(geometry, material);
    var lineS = new THREE.LineSegments(geometryS, materialS);
    var lineT = new THREE.LineSegments(geometryT, materialT);

    line.applyMatrix4(matrix);
    lineS.applyMatrix4(matrix);
    lineT.applyMatrix4(matrix);

    scene.add(line);
    scene.add(lineS);
    scene.add(lineT);
  },
};
