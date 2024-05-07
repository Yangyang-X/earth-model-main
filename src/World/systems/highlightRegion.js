import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";

// Array to keep track of previous highlighted polygons
const previousPolygons = [];

// Function to convert GeoJSON to mesh
function geoJsonToMesh(geoJson, radius, color) {
  if (!geoJson || !geoJson.features) {
    console.error("Invalid GeoJSON data:", geoJson);
    return [];
  }

  const meshes = [];

  geoJson.features.forEach((feature, featureIndex) => {
    if (feature.geometry && feature.geometry.coordinates) {
      feature.geometry.coordinates.forEach((polygon, polyIndex) => {
        polygon.forEach((ring, ringIndex) => {
          const shape = new THREE.Shape();

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

              const [x, y, z] = projectToSphere(lat, lng, radius);

              if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.error(
                  `Invalid spherical coordinates at feature index ${featureIndex}, polygon index ${polyIndex}, ring index ${ringIndex}, point index ${pointIndex}:`,
                  { lat, lng, x, y, z }
                );
                return;
              }

              if (pointIndex === 0) {
                shape.moveTo(x, y, z);
              } else {
                shape.lineTo(x, y, z);
              }
            });

            const geometry = new THREE.ShapeGeometry(shape);
            const material = new THREE.MeshBasicMaterial({
              color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.6, // Adjust opacity if needed
            });
            const mesh = new THREE.Mesh(geometry, material);

            // Project polygon onto the Earth's surface
            const [centroidX, centroidY, centroidZ] = computeCentroid(closedRing, radius);
            mesh.position.set(centroidX, centroidY, centroidZ);

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

// Function to compute the centroid and project to spherical coordinates
function computeCentroid(ring, radius) {
  let sumLat = 0,
    sumLng = 0;
  ring.forEach(([lng, lat]) => {
    sumLat += lat;
    sumLng += lng;
  });
  const avgLat = sumLat / ring.length;
  const avgLng = sumLng / ring.length;
  return projectToSphere(avgLat, avgLng, radius);
}

// Function to project coordinates to spherical coordinates
function projectToSphere(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

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
function highlightPolygon(geoJson, earth, radius = 200, color = "yellow") {
  console.log("GeoJSON input:", geoJson);

  // Remove previously highlighted polygons
  deletePreviousPolygons(earth);

  // Create new polygon meshes
  const polygonMeshes = geoJsonToMesh(geoJson, radius, color);

  // Add polygon meshes to the Earth
  polygonMeshes.forEach((mesh) => {
    console.log("Adding mesh:", mesh);
    earth.add(mesh);
  });
}

export { highlightPolygon };
