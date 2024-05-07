import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";

const textureLoader = new THREE.TextureLoader();

function createMaterial() {
  const material = new THREE.MeshPhongMaterial();

  // earth map
  const earthMap = textureLoader.load(
    "/src/World/assets/textures/earth/earth_map.jpg"
  );
  material.map = earthMap;

  // Optionally, include the bump and specular maps if you want
  // const earthBump = textureLoader.load(
  //   "/src/World/assets/textures/earth/earth_bump.jpg"
  // );
  // material.bumpMap = earthBump;
  // material.bumpScale = 0.005;

  // const earthSpecular = textureLoader.load(
  //   "/src/World/assets/textures/earth/earth_specular.png"
  // );
  // material.specularMap = earthSpecular;
  // material.specular = new THREE.Color("grey");

  return material;
}

function createEarth() {
  const geometry = new THREE.SphereGeometry(200, 32, 32);
  const material = createMaterial();
  const earth = new THREE.Mesh(geometry, material);

  earth.tick = (delta) => {
    earth.rotation.y += (1 / 28) * delta;
  };

  return earth;
}

export { createEarth };
