#include "container.h"
#include <stack>

// @@@@@@ VOTRE CODE ICI
// - Parcourir l'arbre DEPTH FIRST SEARCH selon les conditions suivantes:
// 		- S'il s'agit d'une feuille, faites l'intersection avec la géométrie.
//		- Sinon, il s'agit d'un noeud altérieur.
//			- Faites l'intersection du rayon avec le AABB gauche et droite. 
//				- S'il y a intersection, ajouter le noeud à ceux à visiter. 
// - Retourner l'intersection avec la profondeur maximale la plus PETITE.
bool BVH::intersect(Ray ray, double t_min, double t_max, Intersection* hit) {
	
	// Initialize a stack for the nodes to visit.
    std::stack<BVHNode*> nodes_to_visit;
    // Start with the root node.
    nodes_to_visit.push(root);

    // Initialize the closest hit distance to the maximum possible value.
    double3 closest_hit_distance = std::numeric_limits<double3>::max();
    // Initialize a flag to indicate whether a hit was found.
    bool hit_found = false;

    // While there are still nodes to visit, visit the next node.
    while(!nodes_to_visit.empty()) {
        BVHNode* node = nodes_to_visit.top();
        nodes_to_visit.pop();

        // If the node is a leaf, intersect the ray with the geometry.
        if(node->left == nullptr && node->right == nullptr) {
            Intersection temp_hit;
            if(objects[node->idx]->intersect(ray, t_min, t_max, &temp_hit)) {
                // If the intersection is closer than the closest hit found so far, update the closest hit.
                if(temp_hit.position < closest_hit_distance) {
                    closest_hit_distance = temp_hit.position;
                    *hit = temp_hit;
                    hit_found = true;
                }
            }
        }
        // Otherwise, the node is an internal node.
        else {
            // Intersect the ray with the left and right AABBs.
            
            bool hit_left = node->left->aabb.intersect(ray, t_min, t_max);
            bool hit_right = node->right->aabb.intersect(ray, t_min, t_max);

            // If there is an intersection, add the node to the nodes to visit.
            if(hit_left) nodes_to_visit.push(node->left);
            if(hit_right) nodes_to_visit.push(node->right);
        }
    }
    return hit_found;
}

// @@@@@@ VOTRE CODE ICI
// - Parcourir tous les objets
// 		- Détecter l'intersection avec l'AABB
//			- Si intersection, détecter l'intersection avec la géométrie.
//				- Si intersection, mettre à jour les paramètres.
// - Retourner l'intersection avec la profondeur maximale la plus PETITE.
bool Naive::intersect(Ray ray, double t_min, double t_max, Intersection* hit) {
    bool hit_found = false;
    double closest_hit_distance = t_max;

    for (auto& object : objects) {
        Intersection temp_hit;
        if (object->intersect(ray, t_min, closest_hit_distance, &temp_hit)) {
            hit_found = true;
            closest_hit_distance = temp_hit.depth;
            *hit = temp_hit;
        }
    }
    return hit_found;
}

