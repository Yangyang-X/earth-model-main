
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
import { markLocation } from "./systems/locationFinder.js";


let loop;
let controls;
let resizer;

class World {
  constructor(container) {
    this.camera = createCamera(container);
    this.scene = createScene();
    this.earthRadius = 100;
    this.earth = createEarth(this.earthRadius, 32);
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

  }

  findLocation(lat, lng) {
    const marker = markLocation(lat, lng, this.earth);
    this.earth.add(marker);
  }

  highlightRegion(geoJsonCountryData) {
    console.log('highlight region', this.earthRadius)
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
