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
    for(int i = 0; i < scene.resolution[0] * scene.resolution[1]; i++) {
        z_buffer[i] = scene.camera.z_far; //Anciennement DBL_MAX. À remplacer avec la valeur de scene.camera.z_far
    }

	// @@@@@@ VOTRE CODE ICI
	// Calculez les paramètres de la caméra pour les rayons.
		double3 forward = normalize(scene.camera.center - scene.camera.position); // z-direction of the camera 
	    double3 right = cross(forward, scene.camera.up); // x-direction of the camera 
		double3 up = cross(right, forward); // y-direction of the camera 

		double aspect_ratio = static_cast<double>(scene.resolution[0]) / scene.resolution[1];
		
		double alpha = scene.camera.z_near / forward[2];
		
		double3 centerPOV = scene.camera.position - alpha * forward; // Position of the center of the projection plane
		double heightPOV = 2 * alpha * tan(0.5 * deg2rad(scene.camera.fovy)); // Height of the projection plane
		double widthPOV = heightPOV * scene.camera.aspect; // Width of the projection plane
		
		double pixelWidth = widthPOV / scene.resolution[0];  // Width of a pixel according to the camera (screen width / resolution in x [number of pixels in width])
		double pixelHeight = heightPOV / scene.resolution[1]; // Height of a pixel according to the camera

		double3 bottomLeftCornerPOV = centerPOV - 0.5 * heightPOV * up - 0.5 * widthPOV * right; // Bottom-left corner of the projection plane
		bottomLeftCornerPOV += 0.5 * pixelWidth * right + 0.5 * pixelHeight * up; // Offset to be at the center of the pixel


    // Itère sur tous les pixels de l'image.
    for(int y = 0; y < scene.resolution[1]; y++) {
		if (y % 40){
			std::cout << "\rScanlines completed: " << y << "/" << scene.resolution[1] << '\r';
		}

        for(int x = 0; x < scene.resolution[0]; x++) {

			int avg_z_depth = 0;
			double3 avg_ray_color{0,0,0};
			
			for(int iray = 0; iray < scene.samples_per_pixel; iray++) {
				// Génère le rayon approprié pour ce pixel.
				Ray ray;
				// Initialise la profondeur de récursivité du rayon.
				int ray_depth = 0;
				// Initialize la couleur du rayon
				double3 ray_color{0,0,0};

				// @@@@@@ VOTRE CODE ICI
				// Mettez en place le rayon primaire en utilisant les paramètres de la caméra.
				// Lancez le rayon de manière uniformément aléatoire à l'intérieur du pixel dans la zone délimité par jitter_radius. 
				// Faites la moyenne des différentes couleurs obtenues suite à la récursion.
				
				double3 pixel_center = bottomLeftCornerPOV + x * pixelWidth * right - y * pixelHeight * up;
				ray = Ray(scene.camera.position, normalize(pixel_center - scene.camera.position));
				double depth = scene.camera.z_far;

				trace(scene, ray, ray_depth, &ray_color, &depth);
				
			}

			avg_z_depth = avg_z_depth / scene.samples_per_pixel;
			avg_ray_color = avg_ray_color / scene.samples_per_pixel;

			// Test de profondeur
			if(avg_z_depth >= scene.camera.z_near && avg_z_depth <= scene.camera.z_far && 
				avg_z_depth < z_buffer[x + y*scene.resolution[0]]) {
				z_buffer[x + y*scene.resolution[0]] = avg_z_depth;

				// Met à jour la couleur de l'image (et sa profondeur)
				output->set_color_pixel(x, y, avg_ray_color);
				output->set_depth_pixel(x, y, (avg_z_depth - scene.camera.z_near) / 
										(scene.camera.z_far-scene.camera.z_near));
			}
        }
    }

    delete[] z_buffer;
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
//          - Mettre à jour la nouvelle profondeure.
void Raytracer::trace(const Scene& scene,
					  Ray ray, int ray_depth,
					  double3* out_color, double* out_z_depth)
{
	Intersection hit;
	// Fait appel à l'un des containers spécifiées.
	if(scene.container->intersect(ray,EPSILON,*out_z_depth,&hit)) {		
		Material& material = ResourceManager::Instance()->materials[hit.key_material];
		
		// @@@@@@ VOTRE CODE ICI
		// Déterminer la couleur associée à la réflection d'un rayon de manière récursive.
				
		// Reflection
		if (!(abs(material.k_reflection) < EPSILON) && (ray_depth < MAX_DEPTH)) { // if reflected
		    for (auto lightIter = scene.lights.begin(); lightIter != scene.lights.end(); lightIter++) {
				double3 reflected_color{0, 0 ,0};
				double3 v_i = ray.origin - ray.direction; // inverse direction of the ray
				double3 reflected_ray = 2 * linalg::dot(v_i, hit.normal) * hit.normal - v_i;
						
				Ray reflected_lightRay = Ray(hit.position + EPSILON * hit.normal, reflected_ray);
				double reflected_z_depth = scene.camera.z_far;

				if (ray_depth < scene.max_ray_depth) {
					trace(scene, reflected_lightRay, ray_depth++, &reflected_color, &reflected_z_depth);
				}

				// Update shading for the intersection point by weighting according to the reflected color
				*out_color += material.k_reflection * reflected_color;
			}
		}
		
		// @@@@@@ VOTRE CODE ICI
		// Déterminer la couleur associée à la réfraction d'un rayon de manière récursive.
		if (!(abs(material.k_refraction) < EPSILON) && (ray_depth < MAX_DEPTH)) { // if refracted
			double3 refracted_color{0, 0, 0};
			double3 incident_direction = ray.direction;
			double3 normal = hit.normal;
			double3 transmitted_direction = incident_direction;
			double3 reflected_direction = incident_direction - 2 * linalg::dot(incident_direction, normal) * normal;
			double3 refracted_ray = transmitted_direction - reflected_direction;
			
			Ray refracted_lightRay = Ray(hit.position + EPSILON * hit.normal, refracted_ray);
			double refracted_z_depth = scene.camera.z_far;

			if (ray_depth < scene.max_ray_depth) {
				trace(scene, refracted_lightRay, ray_depth++, &refracted_color, &refracted_z_depth);
			}

			// Update shading for the intersection point by weighting according to the transmitted color
			*out_color += material.k_refraction * refracted_color;
		} 
		// Assumez que l'extérieur/l'air a un indice de réfraction de 1.
		//
		// Toutes les géométries sont des surfaces et non pas de volumes.
		*out_color = shade(scene, hit);
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
	Material& material = ResourceManager::Instance()->materials[hit.key_material];
	double3 color;

	if (material.texture_albedo.width() > 0 && material.texture_albedo.height() > 0) {
		// Calculate UV coordinates
		double u = hit.uv.x;
		double v = hit.uv.y;

		// Get the color from the texture at the UV coordinates
		int x = static_cast<int>(u * material.texture_albedo.width());
		int y = static_cast<int>(v * material.texture_albedo.height());
		rgb_t texture_color = material.texture_albedo.get_pixel(x, y);

		// Convert the texture color to double3 in the range [0, 1]
		color = double3{ texture_color.red / 255.0, texture_color.green / 255.0, texture_color.blue / 255.0 };
	} else {
		// Use the color_albedo if the texture is missing
		color = material.color_albedo;
	}

	// Ambient contribution
	double3 ambient = scene.ambient_light * material.k_ambient;

	// Diffuse and specular contributions
	double3 diffuse{0, 0, 0};
	double3 specular{0, 0, 0};

	// Ambient contribution
	double3 ambient = scene.ambient_light * material.k_ambient;

	// Diffuse and specular contributions
	double3 diffuse{0, 0, 0};
	double3 specular{0, 0, 0};

	for (const auto& light : scene.lights) {
		// Calculate the direction from the intersection point to the light
		double3 light_direction = linalg::normalize(light.position - hit.position);

		// Calculate the halfway vector for the Blinn specular model
		double3 view_direction = linalg::normalize(scene.camera.position - hit.position);
		double3 halfway_direction = linalg::normalize(light_direction + view_direction);

		// Calculate the diffuse component
		double diffuse_intensity = std::max(0.0, linalg::dot(hit.normal, light_direction));
		diffuse += light.emission * material.k_diffuse * diffuse_intensity;

		// Calculate the specular component using the Blinn specular model
		double specular_intensity = std::pow(std::max(0.0, linalg::dot(hit.normal, halfway_direction)), material.shininess);
		specular += light.emission * material.k_specular * specular_intensity;

		// Calculate the occlusion factor for penumbra
		double occlusion_factor = 0.0;
		int num_rays = 16; // Number of rays to sample

		for (int i = 0; i < num_rays; i++) {
			// Sample a random direction inside the cone between the intersection point and the light
			double2 random_direction_2d = random_in_unit_disk();
			double3 random_direction{ random_direction_2d.x, random_direction_2d.y, 0.0 };
			random_direction *= light.radius;
			double3 sampled_direction = linalg::normalize(light_direction + random_direction);

			// Check if the sampled direction is occluded
			Ray shadow_ray(hit.position + EPSILON * hit.normal, sampled_direction);
			Intersection shadow_hit;

			if (scene.container->intersect(shadow_ray, EPSILON, scene.camera.z_far, &shadow_hit)) {
				occlusion_factor += 1.0; // Increment occlusion factor if the ray is occluded
			}
		}

		occlusion_factor /= num_rays; // Average the occlusion factor based on the number of rays

		// Apply the occlusion factor to the diffuse and specular contributions
		diffuse *= (1.0 - occlusion_factor);
		specular *= (1.0 - occlusion_factor);
	}

	// Combine the ambient, diffuse, and specular contributions
	color = color * ambient + color * diffuse + specular;

	return color;
}
