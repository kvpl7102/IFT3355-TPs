const appleMass = 0.075;

TP3.Physics = {
  initTree: function (rootNode) {
    this.computeTreeMass(rootNode);

    var stack = [];
    stack.push(rootNode);

    while (stack.length > 0) {
      var currentNode = stack.pop();
      for (var i = 0; i < currentNode.childNode.length; i++) {
        stack.push(currentNode.childNode[i]);
      }

      currentNode.vel = new THREE.Vector3();
      currentNode.strength = currentNode.a0;
    }
  },

  computeTreeMass: function (node) {
    var mass = 0;

    for (var i = 0; i < node.childNode.length; i++) {
      mass += this.computeTreeMass(node.childNode[i]);
    }
    mass += node.a1;
    if (node.appleIndices !== null) {
      mass += appleMass;
    }
    node.mass = mass;

    return mass;
  },

  applyForces: function (node, dt, time) {
    var u, v;
    u  = Math.sin(1   * time) * 4;
    u += Math.sin(2.5 * time) * 2;
    u += Math.sin(5   * time) * 0.4;

    v  = Math.cos(1   * time + 56485) * 4;
    v += Math.cos(2.5 * time + 56485) * 2;
    v += Math.cos(5   * time + 56485) * 0.4;

    let windForce    = new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt);
    let gravityForce = new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt);

    node.vel.add(windForce   ); // Ajouter le vent
    node.vel.add(gravityForce); // Ajouter la gravite

    // Projection du mouvement, force de restitution et amortissement de la velocite
    let newP1     = node.p1.clone().addScaledVector(node.vel, dt);

    var d1        = new THREE.Vector3().subVectors(node.p1, node.p0).normalize(); // direction before
    var d2        = new THREE.Vector3().subVectors(node.p1, node.p0).normalize(); // direction now

    let axisAngle = TP3.Geometry.findRotation(d1, d2);
    let rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1]));

    // Calculer la vrai velocite
    newP1 = node.p1.clone().applyMatrix4(rotMatrix);
    
    // Force de restitution
    node.vel.add(new THREE.Vector3().subVectors(newP1, node.p1).multiplyScalar(1.0 / dt));

    // Rotation entre direction initiale et la nouvelle direction
    axisAngle = TP3.Geometry.findRotation(d1, d2);

    // Matrice de rotation mais dans le sens contraire de l'angle au carré
    rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(axisAngle[0],-Math.pow(axisAngle[1], 2)));

    // Créer la vélocité dans le sens contraire (vélocité de restitution)
    let restVel = d1.clone().applyMatrix4(rotMatrix).multiplyScalar(node.a0 * 1000);

    // Ajouter la vélocité de restitution
    node.vel.add(restVel);
    node.vel.multiplyScalar(0.7)

    // Appliquer notre velocite à nos points
    newP1 = node.p1.clone().addScaledVector(node.vel, dt); 

    d2 = new THREE.Vector3().subVectors(newP1, node.p0).normalize(); 

    axisAngle = TP3.Geometry.findRotation(d1, d2);
    rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
      new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1])
    );

    d1.applyMatrix4(rotMatrix);
    node.p1 = node.p0.clone().addScaledVector(d1, new THREE.Vector3().subVectors(node.p1, node.p0).length());

    // Nouvelle matrice de rotation entre direction initiale et direction finale
    axisAngle = TP3.Geometry.findRotation(d1,new THREE.Vector3().subVectors(node.p1, node.p0));
    rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1]));

    // Projecte la transformation sur les enfants (if possible)
    if (node.hasChildren()) {
      for (let i = 0; i < node.childNode.length; i++) {
        let childDir = new THREE.Vector3().subVectors(
          node.childNode[i].p1,
          node.childNode[i].p0
        );
        let childLength = childDir.length();
        childDir.normalize();

        node.childNode[i].p0 = node.p1;
        childDir.applyMatrix4(rotMatrix);
        node.childNode[i].p1 = node.p1.clone().addScaledVector(childDir, childLength);
        this.applyForces(node.childNode[i], dt, time);
      }
    }

  },
};
