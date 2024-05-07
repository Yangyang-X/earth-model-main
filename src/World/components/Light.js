import { DirectionalLight, AmbientLight } from "https://unpkg.com/three@0.127.0/build/three.module.js";

const createLight = () => {
  // Increase ambient light intensity to create a "full light everywhere" effect
  const ambientLight = new AmbientLight("white", 3.0);

  // Use a directional light to simulate the sun with a softer intensity
  const mainLight = new DirectionalLight("white", 1.0);

  // Position the directional light
  mainLight.position.set(5, 3, 5);

  return { mainLight, ambientLight };
};

export { createLight };
