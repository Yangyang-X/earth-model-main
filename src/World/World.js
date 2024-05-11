import * as THREE from "three";
import { createCamera } from "./components/Camera.js";
import { createEarth } from "./components/Earth.js";
import { createScene } from "./components/Scene.js";
import { createLight } from "./components/Light.js";
import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/resizer.js";
import { createControls } from "./systems/cameraControls.js";
import {
  highlightPolygons,
  removePreviousGeometries,
} from "./systems/highlightRegion.js";
import {
  calculatePolygonCentroid,
  latLngTo3DPosition,
} from "./utils/geoUtils.js";

const MARGIN = 24; // Margin in units on each side
const MAX_EARTH_RADIUS = 100;

let controls;
let resizer;

class World {
  constructor(container) {
    const containerWidth = container.clientWidth;
    this.earthRadius = Math.min(
      (containerWidth - MARGIN * 2) / 2,
      MAX_EARTH_RADIUS
    );

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

    this.previousTargetLatLng = { lat: 0, lng: -90 };
    this.resetPosition();
  }

  resetPosition() {
    const [x, y, z] = latLngTo3DPosition(0, -90, this.earthRadius);
    const direction = new THREE.Vector3(x, y, z).normalize();
    this.earth.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction
    );
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

    removePreviousGeometries(this.earth);

    setTimeout(() => {
      this.earth.scale.set(1, 1, 1);
      const firstFeature = geoJsonData.features[0];
      const centroid = calculatePolygonCentroid(firstFeature.geometry);
      const targetLatLng = { lat: centroid.lat, lng: centroid.lng };

      this.rotateGlobeTo(targetLatLng, () => {
        highlightPolygons(geoJsonData, this.earth, this.earthRadius, style);
      });
    }, 200);
  }

  getZone(lat) {
    if (lat >= 50) {
      return 3;
    } else if (lat >= 40) {
      return 2;
    } else if (lat >= 30) {
      return 1;
    } else if (lat <= -50) {
      return -3;
    } else if (lat <= -40) {
      return -2;
    } else if (lat <= -30) {
      return -1;
    } else {
      return 0;
    }
  }

  determinePolarRotation = (initialLat, targetLat) => {
    const initialZone = this.getZone(initialLat);
    const targetZone = this.getZone(targetLat);

    if (initialZone == targetZone) {
      return 0; // North to North
    }

    if (initialZone == 3) {
      if (targetZone == 2) {
        return THREE.MathUtils.degToRad(-10); // North 50 to North 40
      } else if (targetZone == 1) {
        return THREE.MathUtils.degToRad(-20); // North 50 to North 40
      } else if (targetZone == 0) {
        return THREE.MathUtils.degToRad(-50); // North 50 to North 40
      } else if (targetZone == -1) {
        return THREE.MathUtils.degToRad(-80); // North 50 to North 40
      } else if (targetZone == -2) {
        return THREE.MathUtils.degToRad(-90); // North 50 to North 40
      }
    }

    if (initialZone == 2) {
      if (targetZone == 3) {
        return THREE.MathUtils.degToRad(10); // North 50 to North 40
      } else if (targetZone == 1) {
        return THREE.MathUtils.degToRad(-10); // North 50 to North 40
      } else if (targetZone == 0) {
        return THREE.MathUtils.degToRad(-40); // North 50 to North 40
      } else if (targetZone == -1) {
        return THREE.MathUtils.degToRad(-70); // North 50 to North 40
      } else if (targetZone == -2) {
        return THREE.MathUtils.degToRad(-80); // North 50 to North 40
      }
    }

    if (initialZone == 1) {
      if (targetZone == 3) {
        return THREE.MathUtils.degToRad(20); // North 50 to North 40
      } else if (targetZone == 2) {
        return THREE.MathUtils.degToRad(10); // North 50 to North 40
      } else if (targetZone == 0) {
        return THREE.MathUtils.degToRad(-30); // North 50 to North 40
      } else if (targetZone == -1) {
        return THREE.MathUtils.degToRad(-60); // North 50 to North 40
      } else if (targetZone == -2) {
        return THREE.MathUtils.degToRad(-70); // North 50 to North 40
      }
    }

    if (initialZone == 0) {
      if (targetZone == 3) {
        return THREE.MathUtils.degToRad(50); // North 50 to North 40
      } else if (targetZone == 2) {
        return THREE.MathUtils.degToRad(40); // North 50 to North 40
      } else if (targetZone == 1) {
        return THREE.MathUtils.degToRad(30); // North 50 to North 40
      } else if (targetZone == -1) {
        return THREE.MathUtils.degToRad(-30); // North 50 to North 40
      } else if (targetZone == -2) {
        return THREE.MathUtils.degToRad(-40); // North 50 to North 40
      }
    }

    if (initialZone == -1) {
      if (targetZone == 3) {
        return THREE.MathUtils.degToRad(80); // North 50 to North 40
      } else if (targetZone == 2) {
        return THREE.MathUtils.degToRad(70); // North 50 to North 40
      } else if (targetZone == 1) {
        return THREE.MathUtils.degToRad(60); // North 50 to North 40
      } else if (targetZone == 0) {
        return THREE.MathUtils.degToRad(30); // North 50 to North 40
      } else if (targetZone == -2) {
        return THREE.MathUtils.degToRad(-10); // North 50 to North 40
      }
    }

    if (initialZone == -2) {
      if (targetZone == 3) {
        return THREE.MathUtils.degToRad(90); // North 50 to North 40
      } else if (targetZone == 2) {
        return THREE.MathUtils.degToRad(80); // North 50 to North 40
      } else if (targetZone == 1) {
        return THREE.MathUtils.degToRad(70); // North 50 to North 40
      } else if (targetZone == 0) {
        return THREE.MathUtils.degToRad(40); // North 50 to North 40
      } else if (targetZone == -2) {
        return THREE.MathUtils.degToRad(10); // North 50 to North 40
      }
    }
  };

  rotateGlobeTo(targetLatLng, onComplete) {
    const initialLatLng = this.previousTargetLatLng;

    // Normalize the longitude difference for the shortest path
    const normalizeAngle = (angle) => {
      return ((angle + 180) % 360) - 180;
    };

    const azimuthalAngle = normalizeAngle(targetLatLng.lng - initialLatLng.lng);
    const azimuthalRotation = THREE.MathUtils.degToRad(azimuthalAngle);

    // Calculate polar rotation based on latitudinal change
    const polarAngle = targetLatLng.lat - initialLatLng.lat;
    const polarRotation = THREE.MathUtils.degToRad(polarAngle);

    // Create quaternions for each rotation
    const azimuthalQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),  // Rotate around Y-axis for longitude
      -azimuthalRotation
    );

    const polarQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),  // Rotate around X-axis for latitude
      polarRotation
    );

    // Combine rotations: first apply polar rotation, then azimuthal
    const finalRotation = polarQuaternion.multiply(azimuthalQuaternion);

    this.animateRotation(finalRotation, onComplete);
  }

  animateRotation(finalRotation, onComplete) {
    const duration = 2000;  // Duration of the animation in milliseconds
    const startTime = Date.now();
    const startRotation = this.earth.quaternion.clone();  // Clone the current rotation

    const animate = () => {
        const currentTime = Date.now();
        const fraction = (currentTime - startTime) / duration;
        const quaternion = new THREE.Quaternion()
        if (fraction < 1) {
            // Interpolating the quaternion
            quaternion.slerp(
                startRotation,
                finalRotation,
                this.earth.quaternion,
                fraction
            );
            requestAnimationFrame(animate);
        } else {
            // Ensuring the rotation ends exactly at the target orientation
            this.earth.quaternion.copy(finalRotation);
            if (typeof onComplete === 'function') {
                onComplete();
            }
        }
    };

    animate();
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
