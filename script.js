// シーン、カメラ、レンダラーの設定
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerHeight / -2,
    1,
    1000
);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("threejs-container").appendChild(renderer.domElement);

// 平面ジオメトリの作成
const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight, 100, 100);

// パステルカラーのグラデーションテクスチャの作成
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 1;
const ctx = canvas.getContext("2d");
const gradient = ctx.createLinearGradient(0, 0, 256, 0);
gradient.addColorStop(0, "#FFCCCC"); // 薄ピンク
gradient.addColorStop(0.2, "#CCE5FF"); // 薄水色
gradient.addColorStop(0.4, "#E6CCFF"); // 薄紫
gradient.addColorStop(0.6, "#FFFFCC"); // 薄黄色
gradient.addColorStop(0.8, "#CCFFCC"); // 薄緑
gradient.addColorStop(1, "#FFD9CC"); // 薄オレンジ
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 256, 1);
const texture = new THREE.Texture(canvas);
texture.needsUpdate = true;

// シェーダーマテリアルの作成
const material = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0 },
        u_gradientTexture: { value: texture },
    },
    vertexShader: `
    uniform float u_time;
    varying float v_n;
    //
    // Description : Array and textureless GLSL 2D simplex noise function.
    //      Author : Ian McEwan, Ashima Arts.
    //  Maintainer : ijm
    //     Lastmod : 20110822 (ijm)
    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
    //               Distributed under the MIT License. See LICENSE file.
    //               https://github.com/ashima/webgl-noise
    // 

    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec2 mod289(vec2 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec3 permute(vec3 x) {
      return mod289(((x*34.0)+1.0)*x);
    }

    float snoise(vec2 v)
      {
      const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                          0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                         -0.577350269189626,  // -1.0 + 2.0 * C.x
                          0.024390243902439); // 1.0 / 41.0
    // First corner
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);

    // Other corners
      vec2 i1;
      //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
      //i1.y = 1.0 - i1.x;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      // x0 = x0 - 0.0 + 0.0 * C.xx ;
      // x1 = x0 - i1 + 1.0 * C.xx ;
      // x2 = x0 - 1.0 + 2.0 * C.xx ;
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;

    // Permutations
      i = mod289(i); // Avoid truncation effects in permutation
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));

      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;

    // Gradients: 41 points uniformly over a line, mapped onto a diamond
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

    // Compute final noise value at P
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    //
    void main() {
      vec3 pos = position;
      float n = snoise(vec2(pos.x * 0.01 + u_time * 0.05, pos.y * 0.01 + u_time * 0.05));
      pos.z += n * 50.0;
      v_n = n;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D u_gradientTexture;
    varying float v_n;
    void main() {
      float n = (v_n + 1.0) / 2.0; // ノイズ値を0〜1に正規化
      vec4 color = texture2D(u_gradientTexture, vec2(n, 0.5));
      gl_FragColor = color;
    }
  `,
});

// メッシュの作成とシーンに追加
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// ポストプロセシングの設定（すりガラス効果）
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

// 水平ブラーパス
const horizontalBlurPass = new THREE.ShaderPass({
    uniforms: {
        tDiffuse: { value: null },
        h: { value: (1 / window.innerWidth) * 5 },
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float h;
    varying vec2 vUv;
    void main() {
      vec4 sum = vec4(0.0);
      sum += texture2D(tDiffuse, vec2(vUv.x - 4.0 * h, vUv.y)) * 0.05;
      sum += texture2D(tDiffuse, vec2(vUv.x - 3.0 * h, vUv.y)) * 0.09;
      sum += texture2D(tDiffuse, vec2(vUv.x - 2.0 * h, vUv.y)) * 0.12;
      sum += texture2D(tDiffuse, vec2(vUv.x - h, vUv.y)) * 0.15;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.16;
      sum += texture2D(tDiffuse, vec2(vUv.x + h, vUv.y)) * 0.15;
      sum += texture2D(tDiffuse, vec2(vUv.x + 2.0 * h, vUv.y)) * 0.12;
      sum += texture2D(tDiffuse, vec2(vUv.x + 3.0 * h, vUv.y)) * 0.09;
      sum += texture2D(tDiffuse, vec2(vUv.x + 4.0 * h, vUv.y)) * 0.05;
      gl_FragColor = sum;
    }
  `,
});
composer.addPass(horizontalBlurPass);

// 垂直ブラーパス
const verticalBlurPass = new THREE.ShaderPass({
    uniforms: {
        tDiffuse: { value: null },
        v: { value: (1 / window.innerHeight) * 5 },
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float v;
    varying vec2 vUv;
    void main() {
      vec4 sum = vec4(0.0);
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 4.0 * v)) * 0.05;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 3.0 * v)) * 0.09;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 2.0 * v)) * 0.12;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - v)) * 0.15;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.16;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + v)) * 0.15;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 2.0 * v)) * 0.12;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 3.0 * v)) * 0.09;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 4.0 * v)) * 0.05;
      gl_FragColor = sum;
    }
  `,
});
composer.addPass(verticalBlurPass);

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    material.uniforms.u_time.value += 0.05;
    composer.render();
}
animate();

// ウィンドウリサイズ対応
window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    composer.setSize(width, height);
    camera.left = width / -2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / -2;
    camera.updateProjectionMatrix();
});
