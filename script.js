const fragmentShader = `
uniform float time;
uniform vec2 resolution;

// Dummy fbm function (replace with your own noise function if available)
float fbm(vec3 st) {
    return fract(sin(dot(st.xy ,vec2(12.9898,78.233))) * 43758.5453123);
}

vec3 getColor(vec2 uv, float noise) {
    vec3 yellow = vec3(1.0, 0.878, 0.510);    // #FFE082
    vec3 salmon = vec3(1.0, 0.671, 0.569);      // #FFAB91
    vec3 lightBlue = vec3(0.565, 0.792, 0.976);   // #90CAF9
    vec3 purple = vec3(0.702, 0.616, 0.859);      // #B39DDB
    vec3 turquoise = vec3(0.302, 0.714, 0.675);   // #4DB6AC
    vec3 emerald = vec3(0.149, 0.651, 0.604);       // #26A69A
    vec3 white = vec3(1.0, 1.0, 1.0);
    
    // 斜めのグラデーション効果
    float diagonal = (uv.x + uv.y) * 0.5;
    float wave = sin(diagonal * 5.0 - time * 0.2) * 0.1;
    float y = uv.y + wave + noise * 0.2;
    
    vec3 color;
    if (y < 0.3) {
        color = mix(emerald, turquoise, smoothstep(0.0, 0.3, y));
    } else if (y < 0.5) {
        color = mix(turquoise, lightBlue, smoothstep(0.3, 0.5, y));
        color = mix(color, purple, smoothstep(0.4, 0.6, uv.x));
    } else if (y < 0.7) {
        color = mix(lightBlue, salmon, smoothstep(0.5, 0.7, y));
        color = mix(color, yellow, noise);
    } else {
        color = mix(salmon, yellow, smoothstep(0.7, 1.0, y));
    }
    
    // すりガラス効果
    float frost = fbm(vec3(uv * 15.0, time * 0.1)) * 0.1;
    color = mix(color, white, frost);
    
    return color;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float noise = fbm(vec3(uv * 10.0, time));
    vec3 color = getColor(uv, noise);
    gl_FragColor = vec4(color, 1.0);
}
`;


const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

// Three.jsのセットアップ
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true
});

// リサイズハンドラ
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  material.uniforms.resolution.value.x = width;
  material.uniforms.resolution.value.y = height;
}

// マテリアルの作成
const material = new THREE.ShaderMaterial({
  fragmentShader,
  vertexShader,
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  }
});

// メッシュの作成
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// アニメーションループ
function animate(time) {
  material.uniforms.time.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// イベントリスナーの設定
window.addEventListener('resize', onWindowResize);
onWindowResize();
animate(0);
