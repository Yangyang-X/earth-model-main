import * as THREE from "three";
import earcut from "https://cdn.jsdelivr.net/npm/earcut@2.2.4/+esm";
import { latLngTo3DPosition } from "../utils/geoUtils.js";

// Constants for default values
const DEFAULT_RADIUS = 100;
const DEFAULT_COLOR = "red";

var previousGeometries = [];

async function geoJsonTo3DMesh(geoJson, radius = DEFAULT_RADIUS) {
  if (!geoJson || !geoJson.features) {
    console.error("Invalid GeoJSON data:", geoJson);
    return [];
  }

  const meshes = [];
  const meshMethod = geoJson['meshMethod']

  for (const feature of geoJson.features) {
    if (feature.geometry && feature.geometry.coordinates) {
      const geometryType = feature.geometry.type;
      let polygons = [];

      if (geometryType === "Polygon") {
        polygons = [feature.geometry.coordinates];
      } else if (geometryType === "MultiPolygon") {
        polygons = feature.geometry.coordinates;
      } else {
        console.error(`Unsupported geometry type: ${geometryType}`);
        continue;
      }

      for (const polygonCoords of polygons) {
        // Calculate the area of the polygon to decide the processing method
        const polygon = turf.polygon(polygonCoords);
        const area = turf.area(polygon) / 1000000; // Area in square kilometers
        // console.log(`Area: ${area}, MeshMethod: ${meshMethod}`);

        if (meshMethod === 'earcut') {
          const data = earcut.flatten(polygonCoords);
          const { vertices, holes, dimensions } = data;
          const indices = earcut(vertices, holes, dimensions);
          // Convert and create mesh
          const mesh = createMesh(vertices, indices, dimensions, radius);
          meshes.push(mesh);
          continue
        }
        if (area <= 200000 && meshMethod !== 'turf') {
          // Use Earcut directly for smaller areas
          const data = earcut.flatten(polygonCoords);
          const { vertices, holes, dimensions } = data;
          const indices = earcut(vertices, holes, dimensions);
          // Convert and create mesh
          const mesh = createMesh(vertices, indices, dimensions, radius);
          meshes.push(mesh);
        } else {
          if (area > 7000000) {
            const data = earcut.flatten(polygonCoords);
            const { vertices, holes, dimensions } = data;
            const indices = earcut(vertices, holes, dimensions);
            const mesh = createMesh(vertices, indices, dimensions, radius * (area > 10000000 ? 1.06 : 1.05));
            meshes.push(mesh);
          } else {

            // Use grid splitting for larger areas
            const bbox = turf.bbox(polygon);
            var cellSide = 30.0; // size of the grid cell in kilometers
            if (area > 1000000) {
              cellSide = 75.0;
            }
            const squareGrid = turf.squareGrid(bbox, cellSide, {
              units: "kilometers",
            });
            const clippedPolygons = squareGrid.features
              .map((cell) => turf.intersect(cell, polygon))
              .filter(Boolean);
            const validClippedPolygons = clippedPolygons.filter(
              (p) =>
                p.geometry.coordinates.length > 0 &&
                p.geometry.coordinates[0].length >= 3
            );

            for (const clipped of validClippedPolygons) {
              const data = earcut.flatten(clipped.geometry.coordinates);
              const { vertices, holes, dimensions } = data;
              const indices = earcut(vertices, holes, dimensions);
              // Convert and create mesh
              const mesh = createMesh(vertices, indices, dimensions, radius);
              meshes.push(mesh);
            }
          }
        }
      }
    } else {
      console.error(`Feature does not have a valid geometry:`, feature);
    }
  }

  return meshes;
}

function createMesh(vertices, indices, dimensions, radius) {
  const vertices3D = [];
  for (let i = 0; i < vertices.length; i += dimensions) {
    const lat = vertices[i + 1];
    const lng = vertices[i];
    const [x, y, z] = latLngTo3DPosition(lat, lng, radius);
    vertices3D.push(x, y, z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices3D, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({
    color: DEFAULT_COLOR,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

// Function to convert GeoJSON polygons to 3D lines using THREE.js
function geoJsonTo3DLines(geoJson, radius = DEFAULT_RADIUS) {
  if (!geoJson || !geoJson.features) {
    console.error("Invalid GeoJSON data:", geoJson);
    return [];
  }

  const lines = [];

  geoJson.features.forEach((feature, featureIndex) => {
    if (feature.geometry && feature.geometry.coordinates) {
      feature.geometry.coordinates.forEach((polygon, polyIndex) => {
        polygon.forEach((ring, ringIndex) => {
          const vertices3D = [];
          ring.forEach(([lng, lat]) => {
            const [x, y, z] = latLngTo3DPosition(lat, lng, radius);
            vertices3D.push(x, y, z);
          });

          // Ensure the polygon is closed
          const firstPoint = vertices3D.slice(0, 3);
          vertices3D.push(...firstPoint);

          // Create geometry for the line
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices3D, 3)
          );

          const material = new THREE.LineBasicMaterial({
            color: DEFAULT_COLOR,
          });
          const line = new THREE.LineLoop(geometry, material);
          lines.push(line);
        });
      });
    } else {
      console.error(`Feature does not have a valid geometry:`, feature);
    }
  });

  return lines;
}

// Function to convert GeoJSON polygons and multipolygons to a single 3D pin using THREE.js
function geoJsonToSingle3DPin(geoJson, radius = DEFAULT_RADIUS) {
  if (!geoJson || !geoJson.features) {
    console.error("Invalid GeoJSON data:", geoJson);
    return [];
  }
  const pins = [];
  const firstFeature = geoJson.features[0];

  if (
    firstFeature &&
    firstFeature.geometry &&
    firstFeature.geometry.coordinates
  ) {
    // Function to calculate the centroid of a polygon
    const calculateCentroid = (coordinates) => {
      let totalLng = 0;
      let totalLat = 0;
      let count = 0;

      coordinates.forEach((ring) => {
        ring.forEach(([lng, lat]) => {
          totalLng += lng;
          totalLat += lat;
          count++;
        });
      });

      return [totalLat / count, totalLng / count];
    };

    // Extract coordinates based on geometry type
    let centroidLatLng;
    if (firstFeature.geometry.type === "Polygon") {
      // Take the first polygon of the first feature
      const firstPolygon = firstFeature.geometry.coordinates;
      centroidLatLng = calculateCentroid(firstPolygon);
    } else if (firstFeature.geometry.type === "MultiPolygon") {
      // Take the first polygon of the first feature
      const firstPolygon = firstFeature.geometry.coordinates[0];
      centroidLatLng = calculateCentroid(firstPolygon);
    } else {
      console.error(`Unsupported geometry type:`, firstFeature.geometry.type);
      return [];
    }

    // Convert the centroid to 3D coordinates
    const [centroidLat, centroidLng] = centroidLatLng;
    const [x, y, z] = latLngTo3DPosition(centroidLat, centroidLng, radius);

    // Create a custom pin
    const pin = createClassicPin(DEFAULT_COLOR);

    // Set the position of the pin
    pin.position.set(x, y, z);

    // Calculate the normal vector and align the pin outward
    const normal = new THREE.Vector3(x, y, z).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Create a quaternion to align the pin with the normal vector
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    pin.setRotationFromQuaternion(quaternion);

    pins.push(pin);
  } else {
    console.error(
      `First feature does not have a valid geometry:`,
      firstFeature
    );
  }

  return pins;
}

// Function to create a classic pin
function createClassicPin(color) {
  // Create a group for the pin
  const pinGroup = new THREE.Group();

  // Scale factors based on globe radius
  const stickHeight = 4; // Height of the stick (in units)
  const stickGeometry = new THREE.CylinderGeometry(0.1, 0.1, stickHeight, 16);
  const stickMaterial = new THREE.MeshBasicMaterial({ color });
  const stick = new THREE.Mesh(stickGeometry, stickMaterial);

  // Create the ball
  const ballRadius = 1.5; // Radius of the ball (in units)
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballMaterial = new THREE.MeshBasicMaterial({ color });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);

  // Create the base
  const baseRadius = 0.5; // Radius of the base (in units)
  const baseHeight = 0.2; // Height of the base (in units)
  const baseGeometry = new THREE.CylinderGeometry(
    baseRadius,
    baseRadius,
    baseHeight,
    16
  );
  const baseMaterial = new THREE.MeshBasicMaterial({ color });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);

  // Position the components along the Z-axis
  stick.position.set(0, stickHeight / 2, 0);
  ball.position.set(0, stickHeight + ballRadius, 0);
  base.position.set(0, -baseHeight / 2, 0);

  // Add components to the group
  pinGroup.add(stick);
  pinGroup.add(ball);
  pinGroup.add(base);

  return pinGroup;
}

// Function to remove previous geometries
function removePreviousGeometries(earth) {
  if (previousGeometries.length > 0) {
    previousGeometries.forEach((geometryId) => {
      const previousGeometry = earth.getObjectByProperty("uuid", geometryId);
      if (previousGeometry) {
        earth.remove(previousGeometry);
      }
    });
    previousGeometries.length = 0;
  }
}

// Function to highlight a region with different styles
async function highlightPolygons(
  geoJson,
  earth,
  radius = DEFAULT_RADIUS,
  style = "mesh",
  elevation = 1.0
) {
  // Resize the Earth to the initial radius if zoomed
  earth.scale.set(1, 1, 1);

  // Highlight new polygons after a delay
  let polygonMeshes = [];

  if (style === "mesh") {
    polygonMeshes = await geoJsonTo3DMesh(geoJson, radius * elevation);
  } else if (style === "lines") {
    polygonMeshes = geoJsonTo3DLines(geoJson, radius * elevation);
  } else if (style === "pin") {
    polygonMeshes = geoJsonToSingle3DPin(geoJson, radius * elevation);
  }

  // Add polygon meshes to the Earth
  polygonMeshes.forEach((geometry) => {
    previousGeometries.push(geometry.uuid);
    earth.add(geometry);
  });
}

export { highlightPolygons, removePreviousGeometries };
