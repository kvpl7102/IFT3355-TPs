// const { Vector3 } = require("./js/three");

class Node {
  constructor(parentNode) {
    this.parentNode = parentNode;
    this.childNode  = []; // why isnt this plural ??

    this.p0         = null; // Position de depart de la branche
    this.p1         = null; // Position finale de la branche

    this.a0         = null; // Rayon de la branche a p0
    this.a1         = null; // Rayon de la branche a p1

    this.sections   = null; // Liste contenant une liste de points representant les segments circulaires du cylindre generalise
  }

  hasChildren() {
    return this.childNode !== null;
  }

  isRootOfTree() {
    return this.parentNode === null;
  }
}

TP3.Geometry = {
  simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
    
    if (!rootNode.hasChildren()) {
      return rootNode;
    }

    if (rootNode.childNode.length !== 1) {
      rootNode.childNode.forEach((node) => node = this.simplifySkeleton(node, rotationThreshold));

      return rootNode;
    }

    let childNode = rootNode.childNode[0]; // root node has one child
    let rootVect  = new THREE.Vector3().subVectors(rootNode .p1, rootNode .p0);
    let childVect = new THREE.Vector3().subVectors(childNode.p1, childNode.p0);

    let angle     = this.findRotation(rootVect, childVect)[1];

    if (angle < rotationThreshold) { // must remove node
      rootNode.a1        = childNode.a1;
      rootNode.p1        = childNode.p1;
      rootNode.childNode = childNode.childNode;

      
      if (!rootNode.hasChildren()) { // no new children
        rootNode.childNode[0] = this.simplifySkeleton(rootNode.childNode[0], rotationThreshold);

        return rootNode;
      }
      
      // Update a0, p0, and parentNode of the new children
      for (let i = 0; i < rootNode.childNode.length; i++) {
        rootNode.childNode[i].a0         = rootNode.a1;
        rootNode.childNode[i].p0         = rootNode.p1;
        rootNode.childNode[i].parentNode = rootNode;
      }
    }

    return this.simplifySkeleton(rootNode, rotationThreshold); // Recurse on root
  },

  generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
    rootNode.sections = new Array(lengthDivisions); 
    let segments      = new Array(lengthDivisions); // (point, vector) of hermite segments
    
    let p0 = rootNode.p0
    let pn = rootNode.p1
    let vn = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0)
    let v0 = rootNode.isRootOfTree() ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3().subVectors(rootNode.parentNode.p1, rootNode.parentNode.p0)

    segments[0                  ] = [p0, v0]; // start of hermite
    segments[segments.length - 1] = [pn, vn]; // end   of hermite
    
    
    if (!rootNode.isRootOfTree()) {
      rootNode.sections[0] = rootNode.parentNode.sections[lengthDivisions - 1];

    } else {

      //Équation cercle paramétrique: P(theta) = p+r*cos(theta)v1+r*sin(theta)v2
      /*
			Ici p = centre ; v1 = un des vecteurs unitaires du plan et v2 = l'autre
				r = rayon (interpolation entre a0 et a1) ; theta = angle
				Nous allons déterminer v1 et v2 à l'aide de l'équation du plan (la normale est la tangente au point)

				Rappel: Ax+By+Cz+D=0 avec le vecteur normal définit comme (A,B,C)
				
				Voici nos étapes de raisonnement:
				-Déterminer D avec la normale et le point central
				-Déterminer des valeurs arbitraires pour x et y (x=2; y=1) et trouver z qui satisfait ce sera un des vecteurs directeurs du plan
				-Faire produit vectoriel entre normal et premier vecteur directeur pour trouver le second

			On peut faire ceci seulement pour le premier i=0 
			Ensuite on fait une translation de p[i]-p[i-1]
			Puis on détermine le vecteur unitaire du rayon et on y applique la matrice de rotation entre v_i-1 et v_i
			Finalement notre point est le centre translater avec le vecteur unitaire du rayon tourne de taille du rayon voulu interpolé entre [a0,a1]
			*/

      let x, y, z;
      let D = -v0.dot(p0);
      let f = (a, b, c) => -(a * 2 + b * 1 + D) / c;

      // find a normal
      if      (v0.z !== 0) { x = 2; y = 1; z = f(v0.x, v0.y, v0.z); } // x = 2; y = 1 
      else if (v0.y !== 0) { x = 2; z = 1; y = f(v0.x, v0.z, v0.y); } // x = 2; z = 1
      else if (v0.z !== 0) { y = 2; z = 1; x = f(v0.y, v0.z, v0.x); } // y = 2; z = 1

      let v1 = new THREE.Vector3(x, y, z)              .normalize();
      let v2 = new THREE.Vector3().crossVectors(v0, v1).normalize();

      let section = new Array(radialDivisions);

      // Faire les segments circulaires (nbr de points = radialDivisions)
      for (let i = 0; i < radialDivisions; i++) {
        section[i] = p0.clone();
        section[i].addScaledVector(v1, rootNode.a0 * Math.cos((-i * 2*Math.PI) / radialDivisions));
        section[i].addScaledVector(v2, rootNode.a0 * Math.sin((-i * 2*Math.PI) / radialDivisions));

        rootNode.sections[0] = section;
      }
    }

    for (let i = 1; i < lengthDivisions; i++) {
      let section = new Array(radialDivisions);
      let segment = this.hermite(p0, pn, v0, vn, i / lengthDivisions)
      let decay   = rootNode.a1 / rootNode.a0;


      //Trouver la matrice de rotation
      let axisAngle = this.findRotation(segment[1], segment[1]);
      let rotMat    = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1]));

      //Faire les segments circulaires (nbr de segments = radialDivisions)
      let currentRadiusValue = rootNode.a0 * (1 + (i / (lengthDivisions - 1)) * (decay - 1));

      for (let j = 0; j < radialDivisions; j++) {
        
        section[j] = rootNode.sections[i - 1][j].clone();
        section[j].add(new THREE.Vector3().subVectors(segment[0], segments[i - 1][0])); // Translation du segment d'avant vers le présent (pour chaque point)

        //Vecteur du rayon
        let currentRadius = new THREE.Vector3().subVectors(section[j], segment[0]).normalize();

        //Rotation du vecteur du rayon dans la bonne direction
        currentRadius.applyMatrix4(rotMat);

        //Vrai point du segment (centre + rayonVect*R)
        section[j].add(currentRadius.multiplyScalar(currentRadiusValue) );

        // assign
        rootNode.sections[i] = section;
        segments[i]          = segment;
      }
    }
    //On traite les enfants par récursion
    if (rootNode.hasChildren()) {
      for (let i = 0; i < rootNode.childNode.length; i++) {
        rootNode.childNode[i] = this.generateSegmentsHermite(
          rootNode.childNode[i],
          lengthDivisions,
          radialDivisions
        );
      }
    }

    return rootNode;

    // rootNode.sections = new Array(lengthDivisions);
    // let segments      = new Array(lengthDivisions); // (point, vector) of hermite segments

    // let lastVector  = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0)
    // let firstVector = rootNode.parentNode === null 
    //     ? new THREE.Vector3(0, 1, 0)
    //     : new THREE.Vector3().subVectors(rootNode.parentNode.p1, rootNode.parentNode.p0)

    // segments[0                  ] = [rootNode.p0, firstVector]; // start p1, v1
    // segments[segments.length - 1] = [rootNode.p1, lastVector ]; // end p1,v1
    
    // for (let i = 0; i < lengthDivisions; i++) {
    //   //On ignore nos valeurs déjà définies
    //   if (i !== 0 && i !== lengthDivisions - 1) {
    //     segments[i] = this.hermite(
    //       rootNode.p0,
    //       rootNode.p1,
    //       segments[0][1],
    //       segments[segments.length - 1][1],
    //       i / (lengthDivisions - 1)
    //     );
    //   }

    //   //Équation cercle paramétrique: P(theta) = p+r*cos(theta)v1+r*sin(theta)v2
    //   /*
		// 	Ici p = centre ; v1 = un des vecteurs unitaires du plan et v2 = l'autre
		// 		r = rayon (interpolation entre a0 et a1) ; theta = angle
		// 		Nous allons déterminer v1 et v2 à l'aide de l'équation du plan (la normale est la tangente au point)

		// 		Rappel: Ax+By+Cz+D=0 avec le vecteur normal définit comme (A,B,C)
				
		// 		Voici nos étapes de raisonnement:
		// 		-Déterminer D avec la normale et le point central
		// 		-Déterminer des valeurs arbitraires pour x et y (x=2; y=1) et trouver z qui satisfait ce sera un des vecteurs directeurs du plan
		// 		-Faire produit vectoriel entre normal et premier vecteur directeur pour trouver le second

		// 	On peut faire ceci seulement pour le premier i=0 
		// 	Ensuite on fait une translation de p[i]-p[i-1]
		// 	Puis on détermine le vecteur unitaire du rayon et on y applique la matrice de rotation entre v_i-1 et v_i
		// 	Finalement notre point est le centre translater avec le vecteur unitaire du rayon tourne de taille du rayon voulu interpolé entre [a0,a1]
		// 	*/

    //   //On travaille sur le rootNode
    //   let decay = rootNode.a1 / rootNode.a0;

    //   if (i == 0) { // first segment
    //     if (rootNode.parentNode == undefined) { // root of tree
    //       let v1;
    //       let D = -segments[i][1].dot(segments[i][0]);
          
    //       //Normale ne peut pas être (0,0,0)
    //       if (segments[i][1].z !== 0) { // x = 2; y = 1
    //         let z = -(segments[i][1].x * 2 + segments[i][1].y * 1 + D) / segments[i][1].z;
    //         v1 = new THREE.Vector3(2.0, 1.0, z).normalize();
          
    //       } else if (segments[i][1].y !== 0) { //x = 2; z = 1
          
    //         let y = -(segments[i][1].x * 2 + segments[i][1].z * 1 + D) / segments[i][1].y;
    //         v1 = new THREE.Vector3(2.0, y, 1.0).normalize();

    //       } else { //y=2; z=1
            
    //         let x = -(segments[i][1].y * 2 + segments[i][1].z * 1 + D) / segments[i][1].x;
    //         v1 = new THREE.Vector3(x, 2.0, 1.0).normalize();
    //       }

    //       let v2 = new THREE.Vector3()
    //         .crossVectors(segments[i][1], v1)
    //         .normalize();

    //       rootNode.sections[i    ] = new Array(radialDivisions);
    //       rootNode.sections[i + 1] = new Array(radialDivisions);

    //       //Faire les segments circulaires (nbr de points = radialDivisions)

    //       for (let j = 0; j < radialDivisions; j++) {
    //         rootNode.sections[i][j] = segments[i][0].clone();
    //         rootNode.sections[i][j].addScaledVector(
    //           v1,
    //           rootNode.a0 * Math.cos((-j * 2 * Math.PI) / radialDivisions)
    //         );
    //         rootNode.sections[i][j].addScaledVector(
    //           v2,
    //           rootNode.a0 * Math.sin((-j * 2 * Math.PI) / radialDivisions)
    //         );
    //       }
    //     } else {
    //       //Sinon on prend le dernier segment du parent
    //       rootNode.sections[i] = rootNode.parentNode.sections[lengthDivisions - 1];
    //     }

    //   } else {
    //     rootNode.sections[i] = new Array(radialDivisions);

    //     //Trouver la matrice de rotation
    //     let axisAngle = this.findRotation(segments[i - 1][1], segments[i][1]);
    //     let rotMat = new THREE.Matrix4().makeRotationFromQuaternion(
    //       new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1])
    //     );

    //     //Faire les segments circulaires (nbr de segments = radialDivisions)
    //     let currentRadiusValue = rootNode.a0 * (1 + (i / (lengthDivisions - 1)) * (decay - 1));

    //     for (let j = 0; j < radialDivisions; j++) {
    //       rootNode.sections[i][j] = rootNode.sections[i - 1][j].clone();
    //       rootNode.sections[i][j].add(new THREE.Vector3().subVectors(segments[i][0], segments[i - 1][0])); // Translation du segment d'avant vers le présent (pour chaque point)

    //       //Vecteur du rayon
    //       let currentRadius = new THREE.Vector3()
    //         .subVectors(rootNode.sections[i][j], segments[i][0])
    //         .normalize();

    //       //Rotation du vecteur du rayon dans la bonne direction
    //       currentRadius.applyMatrix4(rotMat);

    //       //Vrai point du segment (centre + rayonVect*R)
    //       rootNode.sections[i][j] = segments[i][0].clone();
    //       rootNode.sections[i][j].addScaledVector(
    //         currentRadius,
    //         currentRadiusValue
    //       );
    //     }
    //   }
    // }

    // //On traite les enfants par récursion
    // if (rootNode.childNode != undefined) {
    //   for (let i = 0; i < rootNode.childNode.length; i++) {
    //     rootNode.childNode[i] = this.generateSegmentsHermite(
    //       rootNode.childNode[i],
    //       lengthDivisions,
    //       radialDivisions
    //     );
    //   }
    // }

    // return rootNode;
  },

  hermite: function (h0, h1, v0, v1, t) {
    
    // hermite functions
    const x1 =  2 * t**3 - 3 * t**2 + 1;
    const x2 = -2 * t**3 + 3 * t**2;
    const x3 =      t**3 - 2 * t**2 + t;
    const x4 =      t**3 -     t**2;

    // derivatives of hermite functions
    const dx1 =  6 * t**2 - 6 * t;
    const dx2 = -6 * t**2 + 6 * t;
    const dx3 =  3 * t**2 - 4 * t + 1;
    const dx4 =  3 * t**2 - 2 * t;

  
    const p = h0.multiplyScalar(x1)
         .add(h1.multiplyScalar(x2))
         .add(v0.multiplyScalar(x3))
         .add(v1.multiplyScalar(x4));

    const dp = h0.multiplyScalar(dx1)
          .add(h1.multiplyScalar(dx2))
          .add(v0.multiplyScalar(dx3))
          .add(v1.multiplyScalar(dx4));
    
    return [p, dp];
  },

  // Trouver l'axe et l'angle de rotation entre deux vecteurs
  findRotation: function (a, b) {
    const axis = new THREE.Vector3().crossVectors(a, b).normalize();
    var c = a.dot(b) / (a.length() * b.length());

    if (c < -1) {
      c = -1;
    } else if (c > 1) {
      c = 1;
    }

    const angle = Math.acos(c);

    return [axis, angle];
  },

  // Projeter un vecter a sur b
  project: function (a, b) {
    return b.clone().multiplyScalar(a.dot(b) / b.lengthSq());
  },

  // Trouver le vecteur moyen d'une liste de vecteurs
  meanPoint: function (points) {
    var mp = new THREE.Vector3();

    for (var i = 0; i < points.length; i++) {
      mp.add(points[i]);
    }

    return mp.divideScalar(points.length);
  },
};
