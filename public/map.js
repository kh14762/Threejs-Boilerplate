// Three.js - Custom Geometry - Heightmap
// from https://threejsfundamentals.org/threejs/threejs-custom-geometry-heightmap.html

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 200;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(20, 20, 20);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();

  const scene = new THREE.Scene();

  function addLight(...pos) {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...pos);
    scene.add(light);
  }

  addLight(-1, 2, 4);
  addLight(1, 2, -2);

  const imgLoader = new THREE.ImageLoader();
  imgLoader.load('https://threejsfundamentals.org/threejs/resources/images/heightmap-96x64.png', createHeightmap);

  function createHeightmap(image) {
    // extract the data from the image by drawing it to a canvas
    // and calling getImageData
    const ctx = document.createElement('canvas').getContext('2d');
    const {width, height} = image;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.drawImage(image, 0, 0);
    const {data} = ctx.getImageData(0, 0, width, height);

    const geometry = new THREE.Geometry();

    // if width = 3 and height = 3 then the indices of the vertices we generate will be
    // 
    //  00---01---02
    //  |\  /|\  /|
    //  | 04 | 05 |
    //  |/  \|/  \|
    //  06---07---08
    //  |\  /|\  /|
    //  | 09 | 10 |
    //  |/  \|/  \|
    //  11---12---13

    for (let z = 0; z < height; ++z) {
      // add the corners
      for (let x = 0; x < width; ++x) {
          // compute row offsets into the height data
          // we multiply by 4 because the data is R,G,B,A but we
          // only care about R
          const base = (z * width + x) * 4;
          const h = data[base] / 32;

          geometry.vertices.push(new THREE.Vector3(x, h, z));
      }
      // add the midpoints
      const isLastRow = z === height - 1;
      if (!isLastRow) {
        for (let x = 0; x < width - 1; ++x) {
          const base = (z * width + x) * 4;

          // look up height of this cell and height of next
          const h0 = data[base] / 32;
          const h1 = data[base + 4] / 32;

          geometry.vertices.push(new THREE.Vector3(x + 0.5, (h0 + h1) / 2, z + 0.5));
        }
      }
    }

    const cellsAcross = width - 1;
    const cellsDeep = height - 1;
    for (let z = 0; z < cellsDeep; ++z) {
      for (let x = 0; x < cellsAcross; ++x) {
        const topNdx = z * (width + width - 1) + x;
        const midNdx = topNdx + width;
        const botNdx = midNdx + width - 1;

        // create 4 triangles
        geometry.faces.push(
          new THREE.Face3(topNdx    , midNdx, topNdx + 1),
          new THREE.Face3(topNdx + 1, midNdx, botNdx + 1),
          new THREE.Face3(botNdx + 1, midNdx, botNdx    ),
          new THREE.Face3(botNdx    , midNdx, topNdx    ),
        );

        // add the texture coordinates for each vertex of each face.
        const u0 = x / cellsAcross;
        const v0 = z / cellsDeep;
        const u1 = (x + 1) / cellsAcross;
        const v1 = (z + 1) / cellsDeep;
        const um = (u0 + u1) / 2;
        const vm = (v0 + v1) / 2;
        geometry.faceVertexUvs[0].push(
          [ new THREE.Vector2(u0, v0), new THREE.Vector2(um, vm), new THREE.Vector2(u1, v0) ],
          [ new THREE.Vector2(u1, v0), new THREE.Vector2(um, vm), new THREE.Vector2(u1, v1) ],
          [ new THREE.Vector2(u1, v1), new THREE.Vector2(um, vm), new THREE.Vector2(u0, v1) ],
          [ new THREE.Vector2(u0, v1), new THREE.Vector2(um, vm), new THREE.Vector2(u0, v0) ],
        );
      }
    }

    geometry.computeVertexNormals();

    // center the geometry
    geometry.translate(width / -2, 0, height / -2);

    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/star.png');

    const material = new THREE.MeshPhongMaterial({color: 'green', map: texture});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render() {

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
