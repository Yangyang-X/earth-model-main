import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { createCamera } from "./components/Camera.js";
import { createEarth } from "./components/Earth.js";
import { createScene } from "./components/Scene.js";
import { createLight } from "./components/Light.js";

// importing systems
import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/resizer.js";
import { Loop } from "./systems/animationLoop.js";
import { createControls } from "./systems/cameraControls.js";
import { highlightPolygon } from "./systems/highlightRegion.js";

let loop;
let controls;
let resizer;

class World {
  constructor(container) {
    this.camera = createCamera(container);
    this.scene = createScene();
    this.earth = createEarth();
    this.earthRadius = this.earth.earthRadius;
    this.renderer = createRenderer();
    container.append(this.renderer.domElement);

    // Add Earth to scene
    this.scene.add(this.earth);

    // Add lights to scene
    const { mainLight, ambientLight } = createLight();
    this.scene.add(mainLight, ambientLight);

    // Camera controls
    controls = createControls(this.camera, container);

    // Window resizing
    resizer = new Resizer(container, this.camera, this.renderer);

    // Animation loop
    loop = new Loop(this.camera, this.scene, this.renderer);
    loop.updatables.push(this.earth);

    

    // const countryMesh = geoJsonToMesh(geoJsonCountryData, 200, "yellow");
    // this.earth.add(countryMesh);

    // // Example rotation to a specific location
    // this.highlightCountry(29, 108); // Latitude, Longitude
  }

  highlightCountry(lat, lng) {
    const phi = (90 - lat) * (Math.PI / 180); // Polar angle
    const theta = (lng + 180) * (Math.PI / 180); // Azimuthal angle

    // Adjust Earth rotation for longitude (Y-axis)
    this.earth.rotation.y = theta;
    // Adjust Earth rotation for latitude (X-axis)
    this.earth.rotation.x = -phi;
  }

  highlightRegion(geoJsonCountryData) {
    console.log('highlight region')
    highlightPolygon(geoJsonCountryData, this.earth, this.earthRadius)
  }


  render() {
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export { World };
