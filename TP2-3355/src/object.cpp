#include <cmath>
#include <cfloat>
#include <fstream>
#include <sstream>
#include <map>
#include <vector>
#include <iostream>


#include "object.h"

// Fonction retournant soit la valeur v0 ou v1 selon le signe.
int rsign(double value, double v0, double v1) {
	return (int(std::signbit(value)) * (v1-v0)) + v0;
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection d'une sphère.
//
// Référez-vous au PDF pour la paramétrisation des coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
bool Sphere::local_intersect(
    Ray           ray,
	double        t_min,
    double        t_max,
	Intersection* hit
) {
	double a            = dot(ray.direction, ray.direction);
	double b            = 2 * dot(ray.direction, ray.origin);
	double c            = length2(ray.origin) - pow(radius, 2);
	double discriminant = b * b - 4 * a * c;

	if (b < 0) {
		return false;
	}

	if (discriminant > 0) { // 2 intersection points
		// Calculate the two possible intersection depths
		double t_0 = (-b - sqrt(discriminant)) / (2 * a);
		double t_1 = (-b + sqrt(discriminant)) / (2 * a);
		if (t_0 > t_min && t_0 < t_max) {
			// If t_0 is within the valid range, set the intersection information
			hit->depth = t_0;
			hit->position = ray.origin + t_0 * ray.direction;
			hit->normal = normalize(hit->position);
			return true;
		} else if (t_1 > t_min && t_1 < t_max) {
			// If t_1 is within the valid range, set the intersection information
			hit->depth = t_1;
			hit->position = ray.origin + t_1 * ray.direction;
			hit->normal = normalize(hit->position);
			return true;
		}
	} 
	else if (discriminant == 0) { // 1 intersection point
		// Calculate the single intersection depth
		double t = -b / (2 * a);
		if (t > t_min && t < t_max) {
			// If t is within the valid range, set the intersection information
			hit->depth = t;
			hit->position = ray.origin + t * ray.direction;
			hit->normal = normalize(hit->position);
			return true;
		}
	}
	return false; // No intersection found
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de calculer le AABB pour la sphère.
// Il faut que le AABB englobe minimalement notre objet à moins que l'énoncé prononce le contraire (comme ici).
AABB Sphere::compute_aabb() {
	return Object::compute_aabb();
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un quad (rectangle).
//
// Référez-vous au PDF pour la paramétrisation des coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
bool Quad::local_intersect(
    Ray           ray,
    double        t_min,
    double        t_max,
	Intersection* hit
) {
    printf("[x, y, z] = [%f, %f, %f] + t[%f, %f, %f],\n", ray.origin.x, ray.origin.y, ray.origin.z, ray.direction.x, ray.direction.y, ray.direction.z);


    double3 intersection_pt {
        ray.origin.x - ray.direction.x * ray.origin.z / ray.direction.z,
        ray.origin.y - ray.direction.y * ray.origin.z / ray.direction.z,
        0,
    };
    double3 depth = (intersection_pt - ray.origin)/ray.direction;

    bool is_proper_depth  = t_min <= linalg::length(depth) <= t_max;
    bool doesnt_intersect = std::isnan(intersection_pt.x) || std::isnan(intersection_pt.y) || std::isnan(intersection_pt.z);

    if (not is_proper_depth || doesnt_intersect) {
        return false;
    }

    if (intersection_pt.x <= half_size && intersection_pt.y <= half_size) { // successful hit
        hit->position = intersection_pt;
        hit->normal   = -normalize(hit->normal);
    }


	return false;
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de calculer le AABB pour le quad (rectangle).
// Il faut que le AABB englobe minimalement notre objet à moins que l'énoncé prononce le contraire.
AABB Quad::compute_aabb() {
	return Object::compute_aabb();
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un cylindre.
//
// Référez-vous au PDF pour la paramétrisation des coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
bool Cylinder::local_intersect(
    Ray           ray,
    double        t_min,
    double        t_max,
	Intersection* hit
) {
    return false;
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de calculer le AABB pour le cylindre.
// Il faut que le AABB englobe minimalement notre objet à moins que l'énoncé prononce le contraire (comme ici).
AABB Cylinder::compute_aabb() {
	return Object::compute_aabb();
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un mesh.
//
// Référez-vous au PDF pour la paramétrisation pour les coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
//
bool Mesh::local_intersect(
    Ray           ray,
    double        t_min,
    double        t_max,
    Intersection* hit
) {
	double closest_hit_distance = std::numeric_limits<double>::max();
	bool hit_found              = false;

	// Parcourir tous les triangles
	for (auto& triangle : triangles) {
		Intersection temp_hit;
		if (intersect_triangle(ray, t_min, closest_hit_distance, triangle, &temp_hit)) {
			hit_found            = true;
			closest_hit_distance = temp_hit.depth;
			*hit                 = temp_hit;
		}
	}

	return hit_found;

}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un triangle.
// S'il y a intersection, remplissez hit avec l'information sur la normale et les coordonnées texture.
bool Mesh::intersect_triangle(
    Ray            ray,
    double         t_min,
    double         t_max,
    Triangle const triangle,
	Intersection*  hit
) {
	// Extrait chaque position de sommet des données du maillage.
	double3 const &p0 = positions[triangle[0].pi]; // ou Sommet A (Pour faciliter les explications)
	double3 const &p1 = positions[triangle[1].pi]; // ou Sommet B
	double3 const &p2 = positions[triangle[2].pi]; // ou Sommet C

	// Triangle en question. Respectez la convention suivante pour vos variables.
	//
	//     A
	//    / \
	//   /   \
	//  B --> C
	//
	// Respectez la règle de la main droite pour la normale.

	// @@@@@@ VOTRE CODE ICI
	// Décidez si le rayon intersecte le triangle (p0,p1,p2).
	// Si c'est le cas, remplissez la structure hit avec les informations
	// de l'intersection et renvoyez true.
	// Pour plus de d'informations sur la géométrie, référez-vous à la classe dans object.hpp.
	//
	// NOTE : hit.depth est la profondeur de l'intersection actuellement la plus proche,
	// donc n'acceptez pas les intersections qui occurent plus loin que cette valeur.

	
	// Intersection test between the ray and the triangle (p0, p1, p2)
	double3 edge1 = p1 - p0;
	double3 edge2 = p2 - p0;
	double3 h = cross(ray.direction, edge2);
	double determinant = dot(edge1, h);

	if (abs(determinant) < EPSILON) {
		return false; // Ray is parallel to the triangle
	}

	double invDeterminant = 1.0 / determinant;
	double3 s = ray.origin - p0;
	double u = invDeterminant * dot(s, h);

	if (u < 0.0 || u > 1.0) {
		return false; // Intersection is outside the triangle on the u-axis
	}

	double3 q = cross(s, edge1);
	double v = invDeterminant * dot(ray.direction, q);

	if (v < 0.0 || u + v > 1.0) {
		return false; // Intersection is outside the triangle on the v-axis or outside the triangle bounds
	}

	double t = invDeterminant * dot(edge2, q);

	if (t < t_min || t > t_max) {
		return false; // Intersection is outside the valid t range
	}

	// Fill the hit structure with intersection information
	hit->depth = t;
	hit->position = ray.origin + t * ray.direction;
	hit->normal = normalize(cross(edge1, edge2));

	return true; // Intersection found
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de calculer le AABB pour le Mesh.
// Il faut que le AABB englobe minimalement notre objet à moins que l'énoncé prononce le contraire.
AABB Mesh::compute_aabb() {
	return construct_aabb(positions); // not sure
}