import * as THREE from "three";
import { createCamera } from "./components/Camera.js";
import { createEarth } from "./components/Earth.js";
import { createScene } from "./components/Scene.js";
import { createLight } from "./components/Light.js";
import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/resizer.js";
import { createControls } from "./systems/cameraControls.js";
import { highlightPolygons, removePreviousGeometries } from "./systems/highlightRegion.js";
import { calculatePolygonCentroid, latLngTo3DPosition } from "./utils/geoUtils.js";

const MARGIN = 24; // Margin in units on each side
const MAX_EARTH_RADIUS = 100;

let controls;
let resizer;

class World {
  constructor(container) {
    const containerWidth = container.clientWidth;
    this.earthRadius = Math.min((containerWidth - MARGIN * 2) / 2, MAX_EARTH_RADIUS);

    this.camera = createCamera(container);
    this.scene = createScene();
    this.earth = createEarth(this.earthRadius, 32);
    this.renderer = createRenderer();
    container.append(this.renderer.domElement);

    this.scene.add(this.earth);

    const { mainLight, ambientLight } = createLight();
    this.scene.add(mainLight, ambientLight);

    controls = createControls(this.camera, container);
    resizer = new Resizer(container, this.camera, this.renderer);

    this.previousTarget = new THREE.Vector3(0, 0, 1);
  }

  async fetchGeoJson(relativePath) {
    try {
      const response = await fetch(relativePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching GeoJSON:", error);
      return null;
    }
  }

  async showCountry(countryCca2, style = "pin") {
    const geoJsonPath = `/src/World/assets/country/${countryCca2}.json`;
    const geoJsonData = await this.fetchGeoJson(geoJsonPath);
    this.highlightRegion(geoJsonData, style);
  }

  highlightRegion(geoJsonCountryData, style = "pin") {
    removePreviousGeometries(this.earth);

    setTimeout(() => {
      this.earth.scale.set(1, 1, 1);
      highlightPolygons(geoJsonCountryData, this.earth, this.earthRadius, style);

      const firstFeature = geoJsonCountryData.features[0];
      const centroid = calculatePolygonCentroid(firstFeature.geometry.coordinates[0]);

      const [x, y, z] = latLngTo3DPosition(centroid.lat, centroid.lng, this.earthRadius);
      const targetPosition = new THREE.Vector3(x, y, z);

      this.rotateGlobeTo(targetPosition);
    }, 200);
  }

  rotateGlobeTo(targetPosition) {
    const targetDirection = targetPosition.clone().normalize();

    // Adjust target direction if needed
    if (targetDirection.x < 0) {
      targetDirection.x += 0.5;
    } else if (targetDirection.x > 0) {
      targetDirection.x -= 0.5;
    }

    // Use the previous target direction as the starting point for rotation
    const initialDirection = this.previousTarget.clone().normalize();

    // Calculate the azimuthal angle difference
    const initialAzimuthalAngle = Math.atan2(initialDirection.z, initialDirection.x);
    const targetAzimuthalAngle = Math.atan2(targetDirection.z, targetDirection.x);

    const azimuthalRotation = targetAzimuthalAngle - initialAzimuthalAngle;

    // Create a quaternion for azimuthal rotation only
    const azimuthalQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0), // Rotate around y-axis
      azimuthalRotation
    );

    // // Determine z-axis rotation to adjust tilting
    // const zRotation = -targetDirection.y;

    // const zQuaternion = new THREE.Quaternion().setFromAxisAngle(
    //   new THREE.Vector3(0, 0, 1), // Rotate around z-axis
    //   zRotation
    // );

    // // Combine all rotations
    // const combinedRotation = azimuthalQuaternion.multiply(zQuaternion);

    // Apply the rotation to the Earth using a smooth animation
    const initialRotation = this.earth.quaternion.clone();
    const targetRotation = initialRotation.clone().multiply(azimuthalQuaternion);

    let t = 0;
    const duration = 1.5; // Duration of the animation in seconds
    const clock = new THREE.Clock();

    const animateRotation = () => {
      t += clock.getDelta() / duration;
      this.earth.quaternion.slerp(targetRotation, t);

      if (t < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        // Update the previous target to the current one
        this.previousTarget.copy(targetPosition);
      }
    };

    animateRotation();
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
}

export { World };
