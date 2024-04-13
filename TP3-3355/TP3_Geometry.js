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
    return this.childNode?.length > 0;
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


  generateSegmentsHermite: function (
    rootNode,
    lengthDivisions = 4,
    radialDivisions = 8
  ) {
    //TODO
	
    rootNode.sections = new Array(lengthDivisions); //Initialisation de la liste des sections

    let allPs = new Array(lengthDivisions); //Liste de tous les (p,v) des segments

    //Si on est à la racine (on considère la normale comme Vector3(0,1,0) direction initiale de la tortue dans le monde sans transformation)
    if (rootNode.parentNode == undefined) {
      allPs[0] = [rootNode.p0, new THREE.Vector3(0, 1, 0)];
    } else {
      //Si on n'est pas à la racine, on peut utiliser le parent
      allPs[0] = [
        rootNode.p0,
        new THREE.Vector3().subVectors(
          rootNode.parentNode.p1,
          rootNode.parentNode.p0
        ),
      ]; //p0,v0 de début
    }

    allPs[allPs.length - 1] = [
      rootNode.p1,
      new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0),
    ]; //p1,v1 de fin

    for (let i = 0; i < rootNode.sections.length; i++) {
      //On ignore nos valeurs déjà définies
      if (i != 0 || i != allPs.length - 1) {
        allPs[i] = this.hermite(
          rootNode.p0,
          rootNode.p1,
          allPs[0][1],
          allPs[allPs.length - 1][1],
          i / (lengthDivisions - 1)
        );
      }

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

      //On travaille sur le rootNode
      let decay = rootNode.a1 / rootNode.a0;
      //Si c'est le premier segment
      if (i == 0) {
        //Si on est à la racine de l'arbre
        if (rootNode.parentNode == undefined) {
          let D = -allPs[i][1].dot(allPs[i][0]);
          let v1;

          //Normale ne peut pas être (0,0,0)
          if (allPs[i][1].z != 0) {
            //x=2; y=1
            let z =
              -(allPs[i][1].x * 2 + allPs[i][1].y * 1 + D) / allPs[i][1].z;
            v1 = new THREE.Vector3(2.0, 1.0, z).normalize();
          } else if (allPs[i][1].y != 0) {
            //x=2; z=1
            let y =
              -(allPs[i][1].x * 2 + allPs[i][1].z * 1 + D) / allPs[i][1].y;
            v1 = new THREE.Vector3(2.0, y, 1.0).normalize();
          } else {
            //y=2; z=1
            let x =
              -(allPs[i][1].y * 2 + allPs[i][1].z * 1 + D) / allPs[i][1].x;
            v1 = new THREE.Vector3(x, 2.0, 1.0).normalize();
          }

          let v2 = new THREE.Vector3()
            .crossVectors(allPs[i][1], v1)
            .normalize();

          rootNode.sections[i] = new Array(radialDivisions);
          rootNode.sections[i + 1] = new Array(radialDivisions);

          //Faire les segments circulaires (nbr de points = radialDivisions)

          for (let j = 0; j < radialDivisions; j++) {
            rootNode.sections[i][j] = allPs[i][0].clone();
            rootNode.sections[i][j].addScaledVector(
              v1,
              rootNode.a0 * Math.cos((-j * 2 * Math.PI) / radialDivisions)
            );
            rootNode.sections[i][j].addScaledVector(
              v2,
              rootNode.a0 * Math.sin((-j * 2 * Math.PI) / radialDivisions)
            );
          }
        } else {
          //Sinon on prend le dernier segment du parent
          rootNode.sections[i] =
            rootNode.parentNode.sections[lengthDivisions - 1];
        }
      } else {
        rootNode.sections[i] = new Array(radialDivisions);

        //Trouver la matrice de rotation
        let axisAngle = this.findRotation(allPs[i - 1][1], allPs[i][1]);
        let rotMat = new THREE.Matrix4().makeRotationFromQuaternion(
          new THREE.Quaternion().setFromAxisAngle(axisAngle[0], axisAngle[1])
        );

        //Faire les segments circulaires (nbr de segments = radialDivisions)
        let currentRadiusValue =
          rootNode.a0 * (1 + (i / (lengthDivisions - 1)) * (decay - 1));
        for (let j = 0; j < radialDivisions; j++) {
          rootNode.sections[i][j] = rootNode.sections[i - 1][j].clone();
          //Translation du segment d'avant vers le présent (pour chaque point)
          rootNode.sections[i][j].add(
            new THREE.Vector3().subVectors(allPs[i][0], allPs[i - 1][0])
          );

          //Vecteur du rayon
          let currentRadius = new THREE.Vector3()
            .subVectors(rootNode.sections[i][j], allPs[i][0])
            .normalize();

          //Rotation du vecteur du rayon dans la bonne direction
          currentRadius.applyMatrix4(rotMat);

          //Vrai point du segment (centre + rayonVect*R)
          rootNode.sections[i][j] = allPs[i][0].clone();
          rootNode.sections[i][j].addScaledVector(
            currentRadius,
            currentRadiusValue
          );
        }
      }
    }

    //On traite les enfants par récursion
    if (rootNode.childNode != undefined) {
      for (let i = 0; i < rootNode.childNode.length; i++) {
        rootNode.childNode[i] = this.generateSegmentsHermite(
          rootNode.childNode[i],
          lengthDivisions,
          radialDivisions
        );
      }
    }

    //Retourne rootNode après le traitement des enfants s'il y a lieu
    return rootNode;
  },

  hermite: function (h0, h1, v0, v1, t) {
    //TODO
    var p = new THREE.Vector3().addScaledVector(h0,2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1);
    p.addScaledVector(h1, -2 * Math.pow(t, 3) + 3 * Math.pow(t, 2));
    p.addScaledVector(v0, Math.pow(t, 3) - 2 * Math.pow(t, 2) + t);
    p.addScaledVector(v1, Math.pow(t, 3) - Math.pow(t, 2));

    var dp = new THREE.Vector3().addScaledVector(
      h0,
      6 * Math.pow(t, 2) - 6 * t
    );
    dp.addScaledVector(h1, -6 * Math.pow(t, 2) + 6 * t);
    dp.addScaledVector(v0, 3 * Math.pow(t, 2) - 4 * t + 1);
    dp.addScaledVector(v1, 3 * Math.pow(t, 2) - 2 * t);

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
