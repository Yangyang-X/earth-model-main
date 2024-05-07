import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import earcut from "https://cdn.jsdelivr.net/npm/earcut@2.2.4/+esm";

// Array to keep track of previous highlighted polygons
const previousPolygons = [];

// Function to convert GeoJSON to 3D polygon meshes using Earcut
function geoJsonTo3DMesh(geoJson, baseRadius, color) {
  if (!geoJson || !geoJson.features) {
    console.error("Invalid GeoJSON data:", geoJson);
    return [];
  }

  const meshes = [];

  geoJson.features.forEach((feature, featureIndex) => {
    if (feature.geometry && feature.geometry.coordinates) {
      feature.geometry.coordinates.forEach((polygon, polyIndex) => {
        polygon.forEach((ring, ringIndex) => {
          const vertices = [];
          const ringIndices = [];

          if (ring && Array.isArray(ring)) {
            // Ensure the polygon is closed by repeating the first coordinate pair
            const closedRing = [...ring, ring[0]];

            closedRing.forEach(([lng, lat], pointIndex) => {
              if (typeof lng !== "number" || typeof lat !== "number") {
                console.error(
                  `Invalid coordinate at feature index ${featureIndex}, polygon index ${polyIndex}, ring index ${ringIndex}, point index ${pointIndex}:`,
                  { lng, lat }
                );
                return;
              }

              const [x, y, z] = findPosition(lat, lng, baseRadius * 1.01);

              if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.error(
                  `Invalid spherical coordinates at feature index ${featureIndex}, polygon index ${polyIndex}, ring index ${ringIndex}, point index ${pointIndex}:`,
                  { lat, lng, x, y, z }
                );
                return;
              }

              ringIndices.push(vertices.length / 3);
              vertices.push(x, y, z);
            });

            // Create the geometry and set the vertices
            const geometry = new THREE.BufferGeometry();

            // Use Earcut to triangulate the polygon
            const indices = earcut(vertices, null, 3);

            geometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(vertices, 3)
            );
            geometry.setIndex(indices);
            geometry.computeVertexNormals();

            const material = new THREE.MeshBasicMaterial({
              color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.6, // Adjust opacity if needed
            });
            const mesh = new THREE.Mesh(geometry, material);

            previousPolygons.push(mesh.uuid);
            meshes.push(mesh);
          } else {
            console.error(
              `Invalid ring format at feature index ${featureIndex}, polygon index ${polyIndex}, ring index ${ringIndex}`,
              ring
            );
          }
        });
      });
    } else {
      console.error(`Feature does not have a valid geometry:`, feature);
    }
  });

  return meshes;
}

// Function to project coordinates to spherical coordinates
function findPosition(lat, lng, radius = 100) {
  // Convert latitude and longitude to radians
  const phi = ((90 - lat) * Math.PI) / 180; // Polar angle in radians
  const theta = ((180 + lng) * Math.PI) / 180; // Azimuthal angle in radians

  // Convert spherical coordinates to Cartesian coordinates
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

// Function to remove previous polygons
function deletePreviousPolygons(earth) {
  if (previousPolygons.length > 0) {
    previousPolygons.forEach((polygonId) => {
      const previousPolygon = earth.getObjectByProperty("uuid", polygonId);
      if (previousPolygon) {
        previousPolygon.material.dispose();
        previousPolygon.geometry.dispose();
        earth.remove(previousPolygon);
      }
    });
    previousPolygons.length = 0;
  }
}

// Function to highlight a polygon
function highlightPolygon(geoJson, earth, baseRadius = 100, color = "yellow") {
  console.log("GeoJSON input:", geoJson);

  // Remove previously highlighted polygons
  deletePreviousPolygons(earth);

  // Create new polygon meshes
  const polygonMeshes = geoJsonTo3DMesh(geoJson, baseRadius, color);

  // Add polygon meshes to the Earth
  polygonMeshes.forEach((mesh) => {
    console.log("Adding mesh:", mesh);
    earth.add(mesh);
  });
}

export { highlightPolygon };
