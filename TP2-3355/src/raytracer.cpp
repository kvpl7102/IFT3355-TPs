#include <cstdio>
#include <cstdlib>
#include <cfloat>
#include <cmath>
#include <algorithm>
#include <string>
#include <fstream>
#include <vector>
#include <iostream>
#include <sstream>
#include <map>
#include <vector>

#include "raytracer.h"
#include "scene.h"
#include "frame.h"
#include <math.h>

void Raytracer::render(const Scene& scene, Frame* output)
{       
    // Crée le z_buffer.
    double *z_buffer = new double[scene.resolution[0] * scene.resolution[1]];

    for (int i = 0; i < scene.resolution[0] * scene.resolution[1]; i ++) {
        z_buffer[i] = scene.camera.z_far; //Anciennement DBL_MAX. À remplacer avec la valeur de scene.camera.z_far
    }

    // Camera
    double3 cam_direction_forward = normalize(scene.camera.center - scene.camera.position);
    double3 cam_direction_up      = normalize(scene.camera.up);
    double3 cam_direction_right   = normalize(cross(cam_direction_forward, cam_direction_up));
//    printf("cam_direction_forward = [%f, %f, %f],\n", cam_direction_forward.x, cam_direction_forward.y, cam_direction_forward.z);
//    printf("cam_direction_up      = [%f, %f, %f],\n", cam_direction_up     .x, cam_direction_up     .y, cam_direction_up     .z);
//    printf("cam_direction_right   = [%f, %f, %f],\n", cam_direction_right  .x, cam_direction_right  .y, cam_direction_right  .z);
    double alpha = scene.camera.z_near / cam_direction_forward.y;

    // Projection plane
    double3 pjp_position = scene.camera.center;
    double  pjp_hight    = 2*alpha * tan(deg2rad(scene.camera.fovy) );
    double  pjp_width    = pjp_hight * scene.camera.aspect;

    // Pixel dimensions according to camera
    double  pxl_width           = pjp_width / scene.resolution[0];
    double  pxl_hight           = pjp_hight / scene.resolution[1];
    double3 pxl_top_left_corner = pjp_position - pjp_width/2 * cam_direction_right + pjp_hight/2 * cam_direction_up;
                                               + pxl_width/2 * cam_direction_right - pxl_hight/2 * cam_direction_up;

    // Itère sur tous les pixels de l'image.
    for (int y = 0; y < scene.resolution[1]; y ++) {
		if (y % 40) {
			std::cout << "\rScanlines completed: " << y << "/" << scene.resolution[1] << '\r';
		}

        for (int x = 0; x < scene.resolution[0]; x++) {

			double3 avg_ray_color { 0, 0, 0 };
            double  avg_z_depth  = 0;
            double3 pxl_position = pxl_top_left_corner + x * pxl_width * cam_direction_right + y * pxl_hight * cam_direction_up;

            for (int i = 0; i < scene.samples_per_pixel; i ++) {

                double3 random_point_in_pxl = {
                    pxl_position.x + rand_double() * scene.jitter_radius,
                    pxl_position.y + rand_double() * scene.jitter_radius,
                    pxl_position.z
                };
                double3 direction_to_pxl = normalize(double3 {
                    random_point_in_pxl.x - scene.camera.position.x,
                    random_point_in_pxl.y - scene.camera.position.y,
                    random_point_in_pxl.z - scene.camera.position.z,
                });
//                printf("[x, y, z] = [%f, %f, %f] + t[%f, %f, %f],\n", random_point_in_pxl.x, random_point_in_pxl.y, random_point_in_pxl.z, cam_direction_forward.x, cam_direction_forward.y, cam_direction_forward.z);

				Ray     ray         = Ray(random_point_in_pxl, direction_to_pxl);
				int     ray_depth   = 0;
                double  out_z_depth = scene.camera.z_far;
                double3 ray_color { 0, 0, 0 };

                trace(scene, ray, ray_depth, &ray_color, &out_z_depth);

                avg_ray_color += ray_color;
                avg_z_depth   += out_z_depth;
			}

			avg_z_depth   = avg_z_depth   / scene.samples_per_pixel;
			avg_ray_color = avg_ray_color / scene.samples_per_pixel;
//            printf("RGB   at (%d, %d): %f %f %f\n", x, y, avg_ray_color.x, avg_ray_color.y, avg_ray_color.z);
//            printf("depth at (%d, %d): %f\n", x, y, avg_z_depth);

			// Test de profondeur
			if (scene.camera.z_near <= avg_z_depth && avg_z_depth <= scene.camera.z_far && avg_z_depth < z_buffer[x + y*scene.resolution[0]]) {
				z_buffer[x + y*scene.resolution[0]] = avg_z_depth;

				// Met à jour la couleur de l'image (et sa profondeur)
				output->set_color_pixel(x, y, avg_ray_color);
				output->set_depth_pixel(x, y, (avg_z_depth - scene.camera.z_near) / (scene.camera.z_far-scene.camera.z_near));
			}
        }
    }

    delete[] z_buffer;
}

// Returns direction of ray after reflection.
// The formula used is a simplification of the orthogonal projection formula.
double3 reflect(double3 incident_vector, Intersection hit)
{
    double3 normal = normalize(hit.normal); // make sure that normal used is a unit vector

    return 2 * linalg::dot(-incident_vector, normal) * normal + incident_vector;
}

// Returns direction of ray after refraction.
// The formula used is a derivation of Snell's law: https://www.starkeffects.com/snells-law-vector.shtml
double3 refract(double3 incident_vector, Intersection hit, double n1, double n2)
{
    double3 normal              = hit.normal;
    double3 normal_x_incident   = cross(normal, incident_vector);

    return n1/n2 * cross(normal, cross(-normal, incident_vector))
         - normal * sqrt(1 - pow(n1/n2, 2) * normal_x_incident * normal_x_incident);

}

// @@@@@@ VOTRE CODE ICI
// Veuillez remplir les objectifs suivants:
// 		- Détermine si le rayon intersecte la géométrie.
//      	- Calculer la contribution associée à la réflexion.
//			- Calculer la contribution associée à la réfraction.
//			- Mettre à jour la couleur avec le shading + 
//			  Ajouter réflexion selon material.reflection +
//			  Ajouter réfraction selon material.refraction 
//            pour la couleur de sortie.
//          - Mettre à jour la nouvelle profondeur.
void Raytracer::trace(
    const Scene&   scene,
          Ray      ray,
          int      ray_depth,
          double3* out_color,
          double*  out_z_depth
) {
	Intersection hit;

	// Fait appel à l'un des containers spécifiées.
	if (scene.container->intersect(ray, EPSILON, *out_z_depth, &hit)) {
        Material& material = ResourceManager::Instance()->materials[hit.key_material];

        if (ray_depth < MAX_DEPTH) {
            if (abs(material.k_reflection) >= EPSILON) { // Find reflection color recursively
                double3 reflected_color     = { 255, 255, 255 };
                double3 reflected_direction = reflect(ray.direction, hit);
                Ray     reflected_ray       = Ray(hit.position, reflected_direction);

                if (ray_depth < scene.max_ray_depth) {
                    ray_depth ++;
                    trace(scene, reflected_ray, ray_depth, &reflected_color, out_z_depth);
                }
            }

            if (abs(material.k_refraction) >= EPSILON) { // Find refraction color recursively
                double3 refracted_color     = { 255, 255, 255 };
                double3 refracted_direction = refract(ray.direction, hit, 1, material.refractive_index); // n1 is 1 for air
                Ray     refracted_ray       = Ray(hit.position, refracted_direction);

                if (ray_depth < scene.max_ray_depth) {
                    ray_depth ++;
                    trace(scene, refracted_ray, ray_depth, &refracted_color, out_z_depth);
                }
            }
        }

		*out_color   = shade(scene, hit);
		*out_z_depth = hit.depth;
	}
}
// @@@@@@ VOTRE CODE ICI
// Veuillez remplir les objectifs suivants:
// 		* Calculer la contribution des lumières dans la scène.
//			- Itérer sur toutes les lumières.
//				- Inclure la contribution spéculaire selon le modèle de Blinn en incluant la composante métallique.
//	          	- Inclure la contribution diffuse. (Faites attention au produit scalare. >= 0)
//   	  	- Inclure la contribution ambiante
//      * Calculer si le point est dans l'ombre
//			- Itérer sur tous les objets et détecter si le rayon entre l'intersection et la lumière est occludé.
//				- Ne pas considérer les points plus loins que la lumière.
//			- Par la suite, intégrer la pénombre dans votre calcul
//		* Déterminer la couleur du point d'intersection.
//        	- Si texture est présente, prende la couleur à la coordonnées uv
//			- Si aucune texture, prendre la couleur associé au matériel.

double3 Raytracer::shade(const Scene& scene, Intersection hit)
{
	// Material& material = ResourceManager::Instance()->materials[hit.key_material]; lorsque vous serez rendu à la partie texture.
	return double3{255,255,255};
}
