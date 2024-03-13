#include "aabb.h" 

// @@@@@@ VOTRE CODE ICI
// Implémenter l'intersection d'un rayon avec un AABB dans l'intervalle décrit.
bool AABB::intersect(Ray ray, double t_min, double t_max)  {
	
	bool hit = true;

	// Calculate the intersection distances along each axis
	double t_xmin = (min.x - ray.origin.x) / ray.direction.x;
	double t_xmax = (max.x - ray.origin.x) / ray.direction.x;
	double t_ymin = (min.y - ray.origin.y) / ray.direction.y;
	double t_ymax = (max.y - ray.origin.y) / ray.direction.y;
	double t_zmin = (min.z - ray.origin.z) / ray.direction.z;
	double t_zmax = (max.z - ray.origin.z) / ray.direction.z;

	// Find the minimum and maximum intersection distances
	double t_min_intersect = std::max(std::max(std::min(t_xmin, t_xmax), std::min(t_ymin, t_ymax)), std::min(t_zmin, t_zmax));
	double t_max_intersect = std::min(std::min(std::max(t_xmin, t_xmax), std::max(t_ymin, t_ymax)), std::max(t_zmin, t_zmax));

	// Check for intersection conditions
	if (t_max_intersect < 0) {
		hit = false; // No intersection if the maximum intersection distance is negative
	}
	if (t_min_intersect > t_max_intersect) {
		hit = false; // No intersection if the minimum intersection distance is greater than the maximum intersection distance
	}
	if (t_min_intersect > t_max || t_max_intersect < t_min) {
		hit = false; // No intersection if the intersection distances are outside the specified range
	}
	return hit;
};

// @@@@@@ VOTRE CODE ICI
// Implémenter la fonction qui permet de trouver les 8 coins de notre AABB.
std::vector<double3> retrieve_corners(AABB aabb) {
	
	std::vector<double3> corners;
	
	corners.push_back(aabb.min); 									// Add the minimum point of the AABB to the corners vector
	corners.push_back(double3{aabb.min.x, aabb.min.y, aabb.max.z}); // Add a corner with minimum x, minimum y, and maximum z
	corners.push_back(double3{aabb.min.x, aabb.max.y, aabb.min.z}); // Add a corner with minimum x, maximum y, and minimum z
	corners.push_back(double3{aabb.min.x, aabb.max.y, aabb.max.z}); // Add a corner with minimum x, maximum y, and maximum z
	corners.push_back(double3{aabb.max.x, aabb.min.y, aabb.min.z}); // Add a corner with maximum x, minimum y, and minimum z
	corners.push_back(double3{aabb.max.x, aabb.min.y, aabb.max.z}); // Add a corner with maximum x, minimum y, and maximum z
	corners.push_back(double3{aabb.max.x, aabb.max.y, aabb.min.z}); // Add a corner with maximum x, maximum y, and minimum z
	corners.push_back(aabb.max); 									// Add the maximum point of the AABB to the corners vector
	
	return corners;
};

// @@@@@@ VOTRE CODE ICI
// Implémenter la fonction afin de créer un AABB qui englobe tous les points.
AABB construct_aabb(std::vector<double3> points) {
	AABB aabb = AABB{double3{DBL_MAX,DBL_MAX,DBL_MAX},double3{-DBL_MAX,-DBL_MAX,-DBL_MAX}};

	for (auto point : points) {
		aabb.min = min(aabb.min, point);
		aabb.max = max(aabb.max, point);
	}
	return aabb;
};

AABB combine(AABB a, AABB b) {
	return AABB{min(a.min,b.min),max(a.max,b.max)};
};

bool compare(AABB a, AABB b, int axis){
	return a.min[axis] < b.min[axis];
};