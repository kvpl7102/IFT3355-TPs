
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

    const x = (Math.random() - 0.5) * this.alpha
    const y = (Math.random() - 0.5) * this.alpha
    const z = (Math.random() - 0.5) * this.alpha

    const position = this.branch.node.p1.add(new THREE.Vector3(x, y, z));

    this.geometry.translate(position.x, position.y, position.z);
  }
}


class Leaf {
  constructor(branch, alpha) {
    this.branch       = branch
    this.alpha        = alpha
    
    this.init()
  }

  init() {
    this.geometry = new THREE.PlaneBufferGeometry(this.alpha, this.alpha)

    let leafableWidth = this.alpha

    if (this.branch.childNode === undefined) {
      leafableWidth += this.alpha
    }

    let h     = Math.random() * leafableWidth - this.alpha; // random position along the branch
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
    
    if (branch.node.a0 < alpha * leavesCutoff) {
      if (Math.random() < applesProbability) { // create apple
        apples.push(new Apple(branch, alpha))
      }

      for (var i = 0; i < leavesDensity; i++) { // create leaves
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

    // let branches = []
    // let apples   = []
    // let leaves   = []

    // // Liste des segments
    // let segments   = rootNode.sections

    // const indexes  = []; // Correspondance entre les points et leur indice
    // const vertices = []; // Sommets
    // const faces    = []; // Faces

    // const meanIndices = [];
    // const topListIndices = [];
    // const bottomListIndices = [];

    // let currentIdx = 0;

    // for (const section of rootNode.sections) {
    //   console.log(section)
    // }

    // for (let i = 0; i < pointsList.length; i++) {
    //   const subIndexList = [];

    //   if (i == 0 || i == pointsList.length - 1) {
    //     for (let j = 0; j < pointsList[i].length; j++) {
    //       customVertices.push(pointsList[i][j].x, pointsList[i][j].y, pointsList[i][j].z);
    //       if (i == 0) { topListIndices   .push(currentIdx); }
    //       else        { bottomListIndices.push(currentIdx); }

    //       currentIdx ++;
    //     }
    //     const meanPoint = TP3.Geometry.meanPoint(pointsList[i]);
    //     customVertices.push(meanPoint.x, meanPoint.y, meanPoint.z);
    //     meanIndices.push(currentIdx);
    //     currentIdx++;
    //   }

    //   for (let j = 0; j < pointsList[i].length; j++) {
    //     customVertices.push(pointsList[i][j].x, pointsList[i][j].y, pointsList[i][j].z);
    //     subIndexList.push(currentIdx);
    //     currentIdx++;
    //   }
    //   indexList.push(subIndexList);
    // }

    // for (let i = 1; i < indexList.length; i++) {
    //   for (let j = 0; j < indexList[i].length; j++) {
    //     const topLeft     = indexList[i    ][j                            ];
    //     const topRight    = indexList[i    ][(j + 1) % indexList[i].length];
    //     const bottomLeft  = indexList[i - 1][j                            ];
    //     const bottomRight = indexList[i - 1][(j + 1) % indexList[i].length];

    //     customIdx.push(topLeft, bottomRight, bottomLeft); // Face 0
    //     customIdx.push(topLeft, topRight   , bottomRight); // Face 1
    //   }
    // }

    // for (let j = 0; j < indexList[0].length; j++) {
    //   const topLeft  = topListIndices[j];
    //   const topRight = topListIndices[(j + 1) % indexList[0].length];
    //   const bottom   = meanIndices[0];

    //   customIdx.push(topLeft, topRight, bottom); // Face 0
    // }

    // for (let j = 0; j < indexList[indexList.length - 1].length; j++) {
    //   const topLeft  = bottomListIndices[j];
    //   const topRight = bottomListIndices[(j + 1) % bottomListIndices.length];
    //   const bottom   = meanIndices[1];

    //   customIdx.push(topLeft, bottom, topRight); //Face 0
    // }

    // //Liste des sommets en float32
    // const floatCustomVertices = new Float32Array(customVertices);

    // //Créer la branche
    // const branchBuffer = new THREE.BufferGeometry();

    // branchBuffer.setAttribute(
    //   "position",
    //   new THREE.BufferAttribute(floatCustomVertices, 3)
    // );
    // branchBuffer.setIndex(customIdx); //Set faces
    // branchBuffer.computeVertexNormals();

    // // Même matériel que dans drawTreeRough
    // // new THREE.MeshLambertMaterial({color: 0x8b5a2b})
    // branchGeometries.push(branchBuffer);

    // if (rootNode.a0 < alpha * leavesCutoff) {
    //   //Si la branche n'est pas terminale
    //   if (rootNode.childNode != undefined) {
    //     for (let i = 0; i < leavesDensity; i++) {
    //       var leaf = new THREE.PlaneBufferGeometry(alpha, alpha);

    //       //Random sur la ligne
    //       var h = Math.random() * alpha;
    //       //Rotation random
    //       var theta = Math.random() * Math.PI * 2;
    //       //Random entre la ligne et la circomférence
    //       var r = (Math.random() * alpha) / 2;

    //       //Transformer en cartésien
    //       var point = new THREE.Vector3(
    //         r * Math.cos(theta),
    //         r * Math.sin(theta),
    //         h
    //       );

    //       //Appliquer le random sur notre référentiel (p1)
    //       var finalPoint = point.add(rootNode.p1);

    //       //Appliquer une rotation aléatoirement
    //       leaf.rotateX(Math.random() * Math.PI * 2);
    //       leaf.rotateY(Math.random() * Math.PI * 2);
    //       leaf.rotateZ(Math.random() * Math.PI * 2);

    //       leaf.translate(finalPoint.x, finalPoint.y, finalPoint.z);

    //       leafGeometries.push(leaf);
    //     }
    //   }
    //   //Si la branche est terminale
    //   else {
    //     for (let i = 0; i < leavesDensity; i++) {
    //       var leaf = new THREE.Mesh(
    //         new THREE.PlaneBufferGeometry(alpha, alpha),
    //         new THREE.MeshPhongMaterial({ color: 0x3a5f0b })
    //       );

    //       // Random sur la ligne
    //       var h = Math.random() * (alpha * 2);
    //       // Rotation random
    //       var theta = Math.random() * Math.PI * 2;
    //       // Random entre la ligne et la circomférence
    //       var r = (Math.random() * alpha) / 2;

    //       // Transformer en cartésien
    //       var point = new THREE.Vector3(
    //         r * Math.cos(theta),
    //         r * Math.sin(theta),
    //         h
    //       );

    //       // Appliquer le random sur notre référentiel (p1)

    //       var finalPoint = point.add(rootNode.p1);

    //       // Appliquer une rotation aléatoirement
    //       leaf.rotateX(Math.random() * Math.PI * 2);
    //       leaf.rotateY(Math.random() * Math.PI * 2);
    //       leaf.rotateZ(Math.random() * Math.PI * 2);

    //       leaf.translate(finalPoint.x, finalPoint.y, finalPoint.z);

    //       leafGeometries.push(leaf);
    //     }
    //   }
    // }

    // // Créer les pommes
    // if (Math.random() < applesProbability) {
    //   var apple = new THREE.Mesh(
    //     new THREE.SphereBufferGeometry(0.1, 8, 8),
    //     new THREE.MeshPhongMaterial({ color: 0x5f0b0b })
    //   );

    //   // Random sur la ligne
    //   var h = Math.random() * (alpha * 2);

    //   // Rotation random
    //   var theta = Math.random() * Math.PI * 2;

    //   // Random entre la ligne et la circomférence
    //   var r = (Math.random() * alpha) / 2;

    //   // Transformer en cartésien
    //   var point = new THREE.Vector3(
    //     r * Math.cos(theta),
    //     r * Math.sin(theta),
    //     h
    //   );

    //   //Appliquer le random sur notre référentiel (p1)
    //   var finalPoint = point.add(rootNode.p1);

    //   apple.translate(finalPoint.x, finalPoint.y, finalPoint.z);

    //   appleGeometries.push(apple);
    // }

    // //Traverser toutes les branches
    // if (rootNode.childNode != undefined) {
    //   for (let i = 0; i < rootNode.childNode.length; i++) {
    //     this.drawTreeHermite(
    //       rootNode.childNode[i],
    //       scene,
    //       alpha,
    //       leavesCutoff,
    //       leavesDensity,
    //       applesProbability,
    //       matrix
    //     );
    //   }
    // }

    // if (rootNode.parentNode == undefined) {
    //   // Merge pour les branches
    //   let treeGeometry = new THREE.CylinderBufferGeometry();
    //   treeGeometry =
    //     THREE.BufferGeometryUtils.mergeBufferGeometries(branchGeometries);
    //   const tree = new THREE.Mesh(
    //     treeGeometry,
    //     new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
    //   );
    //   scene.add(tree);

    //   // Pour les feuilles
    //   let leavesGeometry = new THREE.PlaneBufferGeometry();
    //   leavesGeometry =
    //     THREE.BufferGeometryUtils.mergeBufferGeometries(leafGeometries);
    //   const leaves = new THREE.Mesh(
    //     leavesGeometry,
    //     new THREE.MeshPhongMaterial({ color: 0x3a5f0b })
    //   );
    //   scene.add(leaves);

    //   // Pour les pommes
    //   let applesGeometry = new THREE.SphereBufferGeometry();
    //   applesGeometry =
    //     THREE.BufferGeometryUtils.mergeBufferGeometries(appleGeometries);
    //   const apples = new THREE.Mesh(
    //     applesGeometry,
    //     new THREE.MeshPhongMaterial({ color: 0x5f0b0b })
    //   );
    //   scene.add(apples);
    // }

    branchGeometries = new Array();
    leafGeometries = new Array();
    appleGeometries = new Array();

    // Liste des segments
    let pointsList = rootNode.sections;

    const indexList = []; // Correspondance entre les points et leur indice
    const customVertices = []; // Sommets
    const customIdx = []; // Faces

    const meanIndices = [];
    const topListIndices = [];
    const bottomListIndices = [];

    let currentIdx = 0;

    for (const section of rootNode.sections) {
      console.log(section)
    }
    for (let i = 0; i < pointsList.length; i++) {
      const subIndexList = [];

      if (i == 0 || i == pointsList.length - 1) {
        for (let j = 0; j < pointsList[i].length; j++) {
          customVertices.push(
            pointsList[i][j].x,
            pointsList[i][j].y,
            pointsList[i][j].z
          );
          if (i == 0) {
            topListIndices.push(currentIdx);
          } else {
            bottomListIndices.push(currentIdx);
          }
          currentIdx++;
        }
        const meanPoint = TP3.Geometry.meanPoint(pointsList[i]);
        customVertices.push(meanPoint.x, meanPoint.y, meanPoint.z);
        meanIndices.push(currentIdx);
        currentIdx++;
      }

      for (let j = 0; j < pointsList[i].length; j++) {
        customVertices.push(
          pointsList[i][j].x,
          pointsList[i][j].y,
          pointsList[i][j].z
        );
        subIndexList.push(currentIdx);
        currentIdx++;
      }
      indexList.push(subIndexList);
    }

    for (let i = 1; i < indexList.length; i++) {
      for (let j = 0; j < indexList[i].length; j++) {
        const topLeft = indexList[i][j];
        const topRight = indexList[i][(j + 1) % indexList[i].length];
        const bottomLeft = indexList[i - 1][j];
        const bottomRight = indexList[i - 1][(j + 1) % indexList[i].length];

        customIdx.push(topLeft, bottomRight, bottomLeft); // Face 0
        customIdx.push(topLeft, topRight, bottomRight); // Face 1
      }
    }

    for (let j = 0; j < indexList[0].length; j++) {
      const topLeft = topListIndices[j];
      const topRight = topListIndices[(j + 1) % indexList[0].length];
      const bottom = meanIndices[0];

      customIdx.push(topLeft, topRight, bottom); // Face 0
    }

    for (let j = 0; j < indexList[indexList.length - 1].length; j++) {
      const topLeft = bottomListIndices[j];
      const topRight = bottomListIndices[(j + 1) % bottomListIndices.length];
      const bottom = meanIndices[1];

      customIdx.push(topLeft, bottom, topRight); //Face 0
    }

    //Liste des sommets en float32
    const floatCustomVertices = new Float32Array(customVertices);

    //Créer la branche
    const branchBuffer = new THREE.BufferGeometry();

    branchBuffer.setAttribute(
      "position",
      new THREE.BufferAttribute(floatCustomVertices, 3)
    );
    branchBuffer.setIndex(customIdx); //Set faces
    branchBuffer.computeVertexNormals();

    // Même matériel que dans drawTreeRough
    // new THREE.MeshLambertMaterial({color: 0x8b5a2b})
    branchGeometries.push(branchBuffer);

    if (rootNode.a0 < alpha * leavesCutoff) {
      //Si la branche n'est pas terminale
      if (rootNode.childNode != undefined) {
        for (let i = 0; i < leavesDensity; i++) {
          var leaf = new THREE.PlaneBufferGeometry(alpha, alpha);

          //Random sur la ligne
          var h = Math.random() * alpha;
          //Rotation random
          var theta = Math.random() * Math.PI * 2;
          //Random entre la ligne et la circomférence
          var r = (Math.random() * alpha) / 2;

          //Transformer en cartésien
          var point = new THREE.Vector3(
            r * Math.cos(theta),
            r * Math.sin(theta),
            h
          );

          //Appliquer le random sur notre référentiel (p1)
          var finalPoint = point.add(rootNode.p1);

          //Appliquer une rotation aléatoirement
          leaf.rotateX(Math.random() * Math.PI * 2);
          leaf.rotateY(Math.random() * Math.PI * 2);
          leaf.rotateZ(Math.random() * Math.PI * 2);

          leaf.translate(finalPoint.x, finalPoint.y, finalPoint.z);

          leafGeometries.push(leaf);
        }
      }
      //Si la branche est terminale
      else {
        for (let i = 0; i < leavesDensity; i++) {
          var leaf = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(alpha, alpha),
            new THREE.MeshPhongMaterial({ color: 0x3a5f0b })
          );

          // Random sur la ligne
          var h = Math.random() * (alpha * 2);
          // Rotation random
          var theta = Math.random() * Math.PI * 2;
          // Random entre la ligne et la circomférence
          var r = (Math.random() * alpha) / 2;

          // Transformer en cartésien
          var point = new THREE.Vector3(
            r * Math.cos(theta),
            r * Math.sin(theta),
            h
          );

          // Appliquer le random sur notre référentiel (p1)

          var finalPoint = point.add(rootNode.p1);

          // Appliquer une rotation aléatoirement
          leaf.rotateX(Math.random() * Math.PI * 2);
          leaf.rotateY(Math.random() * Math.PI * 2);
          leaf.rotateZ(Math.random() * Math.PI * 2);

          leaf.translate(finalPoint.x, finalPoint.y, finalPoint.z);

          leafGeometries.push(leaf);
        }
      }
    }

    // Créer les pommes
    if (Math.random() < applesProbability) {
      var apple = new THREE.Mesh(
        new THREE.SphereBufferGeometry(0.1, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0x5f0b0b })
      );

      // Random sur la ligne
      var h = Math.random() * (alpha * 2);

      // Rotation random
      var theta = Math.random() * Math.PI * 2;

      // Random entre la ligne et la circomférence
      var r = (Math.random() * alpha) / 2;

      // Transformer en cartésien
      var point = new THREE.Vector3(
        r * Math.cos(theta),
        r * Math.sin(theta),
        h
      );

      //Appliquer le random sur notre référentiel (p1)
      var finalPoint = point.add(rootNode.p1);

      apple.translate(finalPoint.x, finalPoint.y, finalPoint.z);

      appleGeometries.push(apple);
    }

    //Traverser toutes les branches
    if (rootNode.childNode != undefined) {
      for (let i = 0; i < rootNode.childNode.length; i++) {
        this.drawTreeHermite(
          rootNode.childNode[i],
          scene,
          alpha,
          leavesCutoff,
          leavesDensity,
          applesProbability,
          matrix
        );
      }
    }

    if (rootNode.parentNode == undefined) {
      // Merge pour les branches
      let treeGeometry = new THREE.CylinderBufferGeometry();
      treeGeometry =
        THREE.BufferGeometryUtils.mergeBufferGeometries(branchGeometries);
      const tree = new THREE.Mesh(
        treeGeometry,
        new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
      );
      scene.add(tree);

      // Pour les feuilles
      let leavesGeometry = new THREE.PlaneBufferGeometry();
      leavesGeometry =
        THREE.BufferGeometryUtils.mergeBufferGeometries(leafGeometries);
      const leaves = new THREE.Mesh(
        leavesGeometry,
        new THREE.MeshPhongMaterial({ color: 0x3a5f0b })
      );
      scene.add(leaves);

      // Pour les pommes
      let applesGeometry = new THREE.SphereBufferGeometry();
      applesGeometry =
        THREE.BufferGeometryUtils.mergeBufferGeometries(appleGeometries);
      const apples = new THREE.Mesh(
        applesGeometry,
        new THREE.MeshPhongMaterial({ color: 0x5f0b0b })
      );
      scene.add(apples);
    }
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
