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


/**
 * Transforms a 3D point using a 4x4 transformation matrix.
 *
 * @param point The 3D point to transform.
 * @param transform The 4x4 transformation matrix.
 * @return The transformed 3D point.
 */
double3 transform_point(double3 point, double4x4 transform) {
	double x = point.x * transform[0][0] + point.y * transform[1][0] + point.z * transform[2][0] + transform[3][0];
	double y = point.x * transform[0][1] + point.y * transform[1][1] + point.z * transform[2][1] + transform[3][1];
	double z = point.x * transform[0][2] + point.y * transform[1][2] + point.z * transform[2][2] + transform[3][2];
	return double3(x, y, z);
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection d'une sphère.
//
// Référez-vous au PDF pour la paramétrisation des coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
bool Sphere::local_intersect(Ray ray, double t_min, double t_max, Intersection *hit) {
	double a = dot(ray.direction, ray.direction);
	double b = 2 * dot(ray.direction, ray.origin);
	double c = length2(ray.origin) - pow(radius, 2);
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
			hit->uv.x = (atan2(hit->position.y, hit->position.x) + PI) / (2 * PI);
			hit->uv.y = (hit->position.z - (-radius)) / (2 * radius);
			return true;
		} else if (t_1 > t_min && t_1 < t_max) {
			// If t_1 is within the valid range, set the intersection information
			hit->depth = t_1;
			hit->position = ray.origin + t_1 * ray.direction;
			hit->normal = normalize(hit->position);
			hit->uv.x = (atan2(hit->position.y, hit->position.x) + PI) / (2 * PI);
			hit->uv.y = (hit->position.z - (-radius)) / (2 * radius);
			return true;
		}
	} else if (discriminant == 0) { // 1 intersection point
		// Calculate the single intersection depth
		double t = -b / (2 * a);
		if (t > t_min && t < t_max) {
			// If t is within the valid range, set the intersection information
			hit->depth = t;
			hit->position = ray.origin + t * ray.direction;
			hit->normal = normalize(hit->position);
			hit->uv.x = (atan2(hit->position.y, hit->position.x) + PI) / (2 * PI);
			hit->uv.y = (hit->position.z - (-radius)) / (2 * radius);
			return true;
		}
	}
	return false; // No intersection found
}

AABB Sphere::compute_aabb() {
	// Calculate the AABB in local space
	AABB localAABB;
	localAABB = construct_aabb({double3{-radius, -radius, -radius}, double3{radius, radius, radius}});
	
	// Transform the corners of the local AABB into global coordinate system
	double3 globalMin = transform_point(localAABB.min, transform);
	double3 globalMax = transform_point(localAABB.max, transform);

	// Construct the final AABB from the transformed points
	AABB finalAABB = construct_aabb({globalMin, globalMax});

	return finalAABB;
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un quad (rectangle).
//
// Référez-vous au PDF pour la paramétrisation des coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
bool Quad::local_intersect(Ray ray, double t_min, double t_max, Intersection *hit)
{
	// The normal vector of the quad
	double3 normal = double3(0, 0, 1);

	// The denominator of the t parameter in the ray-plane intersection formula
	double denominator = dot(ray.direction, normal);

	// If the ray is parallel to the quad, there's no intersection
	if (abs(denominator) < 1e-6) {
		return false;
	}

	double t = dot(double3(0, 0, 1) - ray.origin, normal) / denominator;

	// If the intersection is outside the valid range, there's no intersection
	if (t < t_min || t > t_max) {
		return false;
	}

	// The intersection point
	double3 intersection = ray.origin + t * ray.direction;

	// If the intersection point is outside the quad, there's no intersection
	if (intersection.x < -1 || intersection.x > 1 || intersection.y < -1 || intersection.y > 1) {
		return false;
	}

	hit->depth = t;
	hit->position = intersection;
	hit->normal = normal;

	// Calculate UV coordinates
	hit->uv.x = (intersection.x + 1) / 2;
	hit->uv.y = (intersection.y + 1) / 2;

	return true;
}

AABB Quad::compute_aabb() {
	// Compute the minimum and maximum coordinates of the quad
	double min_x = -1;
	double max_x = 1;
	double min_y = -1;
	double max_y = 1;
	double min_z = 0;
	double max_z = 0;

	// Expand the AABB slightly to avoid floating point errors
	min_x -= EPSILON;
	max_x += EPSILON;
	min_y -= EPSILON;
	max_y += EPSILON;

	// Create and return the AABB
	AABB aabb = construct_aabb({double3{min_x, min_y, min_z}, double3{max_x, max_y, max_z}});
	return aabb;
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un cylindre.
//
// Référez-vous au PDF pour la paramétrisation des coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
bool Cylinder::local_intersect(Ray ray, double t_min, double t_max, Intersection *hit)
{
	// Calculate the coefficients of the quadratic equation for the intersection of the ray with the cylinder
	double a = pow(ray.direction.x, 2) + pow(ray.direction.z, 2);
	double b = 2 * ray.origin.x * ray.direction.x + 2 * ray.origin.z * ray.direction.z;
	double c = pow(ray.origin.x, 2) + pow(ray.origin.z, 2) - 1;
	double discriminant = b * b - 4 * a * c;

	// Check if the discriminant is negative, indicating no intersection with the cylinder
	if (discriminant < 0) {
		return false;
	}

	// Calculate the two possible intersection distances
	double t_0 = (-b - sqrt(discriminant)) / (2 * a);
	double t_1 = (-b + sqrt(discriminant)) / (2 * a);

	// Check if either of the intersection distances is within the valid range
	if (t_0 > t_min && t_0 < t_max) {
		// Set the intersection information for t_0
		hit->depth = t_0;
		hit->position = ray.origin + t_0 * ray.direction;
		hit->normal = double3(hit->position.x, 0, hit->position.z);

		// Calculate UV coordinates
		double u = atan2(hit->position.x, hit->position.z) / (2 * PI);
		double v = hit->position.y;

		// Update UV coordinates
		hit->uv = double2(u, v);

		return true;
	} else if (t_1 > t_min && t_1 < t_max) {
		// Set the intersection information for t_1
		hit->depth = t_1;
		hit->position = ray.origin + t_1 * ray.direction;
		hit->normal = double3(hit->position.x, 0, hit->position.z);

		// Calculate UV coordinates
		double u = atan2(hit->position.x, hit->position.z) / (2 * PI);
		double v = hit->position.y;

		// Update UV coordinates
		hit->uv = double2(u, v);

		return true;
	}

	return false; // No intersection found
}


AABB Cylinder::compute_aabb() {
	// Calculate AABB in local space
	AABB localAABB = construct_aabb({double3{-1, -1, -1}, double3{1, 1, 1}});

	// Reproject corners into global coordinate system
	double3 transformedMin = transform_point(localAABB.min, transform);
	double3 transformedMax = transform_point(localAABB.max, transform);

	// Construct final AABB from transformed points
	AABB globalAABB = construct_aabb({transformedMin, transformedMax});

	return globalAABB;
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un mesh.
//
// Référez-vous au PDF pour la paramétrisation pour les coordonnées UV.
//
// Pour plus de d'informations sur la géométrie, référez-vous à la classe object.h.
//
bool Mesh::local_intersect(Ray ray,  
						   double t_min, double t_max, 
						   Intersection* hit)
{
	double closest_hit_distance = std::numeric_limits<double>::max();
	bool hit_found = false;

	// Parcourir tous les triangles
	for (auto& tri : triangles) {
		Intersection temp_hit;
		if (intersect_triangle(ray, t_min, closest_hit_distance, tri, &temp_hit)) {
			hit_found = true;
			closest_hit_distance = temp_hit.depth;
			*hit = temp_hit;
		}
	}
	return hit_found;
}

// @@@@@@ VOTRE CODE ICI
// Occupez-vous de compléter cette fonction afin de trouver l'intersection avec un triangle.
// S'il y a intersection, remplissez hit avec l'information sur la normale et les coordonnées texture.
bool Mesh::intersect_triangle(Ray  ray, 
							  double t_min, double t_max,
							  Triangle const tri,
							  Intersection *hit)
{
	// Extrait chaque position de sommet des données du maillage.
	double3 const &p0 = positions[tri[0].pi]; // ou Sommet A (Pour faciliter les explications)
	double3 const &p1 = positions[tri[1].pi]; // ou Sommet B
	double3 const &p2 = positions[tri[2].pi]; // ou Sommet C

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
	double3 min = double3(std::numeric_limits<double>::max());
	double3 max = double3(std::numeric_limits<double>::min());

	// Find the minimum and maximum coordinates of the mesh
	for (auto& pos : positions) {
		min = linalg::min(min, pos);
		max = linalg::max(max, pos);
	}
	return construct_aabb({min, max});
}