// Three.jsの簡略化されたシェーダー
const fragmentShader = `
uniform float time;
uniform vec2 resolution;
uniform vec3 colorA;
uniform vec3 colorB;
uniform vec3 colorC;
uniform vec3 colorD;
uniform vec3 colorE;
uniform vec3 colorF;
uniform float isDark;

// シンプルなノイズ関数
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // 4つの角の値を補間
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// 複数のノイズレイヤーを組み合わせたFBM（Fractional Brownian Motion）
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st * frequency);
        st += st * 0.4;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

// Y座標に基づいて色を取得するヘルパー関数
vec3 getColorByY(float y) {
    if (y < 0.2) {
        return mix(colorA, colorB, smoothstep(0.0, 0.2, y));
    } else if (y < 0.36) {
        return mix(colorB, colorC, smoothstep(0.2, 0.36, y));
    } else if (y < 0.52) {
        return mix(colorC, colorD, smoothstep(0.36, 0.52, y));
    } else if (y < 0.68) {
        return mix(colorD, colorE, smoothstep(0.52, 0.68, y));
    } else if (y < 0.84) {
        return mix(colorE, colorF, smoothstep(0.68, 0.84, y));
    } else {
        return mix(colorF, colorA, smoothstep(0.84, 1.0, y));
    }
}

vec3 getColor(vec2 uv) {
    // 時間に応じて変化する値
    float t = time * 0.2;
    
    // 基本的なノイズ（複数のスケールのノイズを組み合わせる）
    float noise1 = fbm(uv * 3.0 + t * 0.1);
    float noise2 = fbm(uv * 6.0 - t * 0.2);
    float noise3 = fbm(uv * 1.5 + vec2(t * 0.3, t * -0.2));
    
    // 複数の波を重ね合わせる
    float diagonal1 = (uv.x + uv.y) * 0.5;
    float diagonal2 = (uv.x - uv.y) * 0.7;
    float wave1 = sin(diagonal1 * 5.0 - t) * 0.1;
    float wave2 = sin(diagonal2 * 3.0 + t * 0.7) * 0.08;
    float wave3 = sin(uv.x * 4.0 - t * 1.3) * 0.06;
    
    // 波と複数のノイズを組み合わせてY座標をずらす
    float yOffset = wave1 + wave2 + wave3 + noise1 * 0.25 + noise3 * 0.15;
    float y = uv.y + yOffset;
    
    // 横方向のランダム性を高める
    float xNoise = (sin(uv.x * 8.0 + time * 0.15) * 0.1) * noise2;
    float xOffset = noise3 * 0.2 + xNoise;
    
    // 直線的なグラデーションの基本色を取得
    vec3 baseColor;
    if (y < 0.2) {
        baseColor = mix(colorA, colorB, smoothstep(0.0, 0.2, y));
    } else if (y < 0.36) {
        baseColor = mix(colorB, colorC, smoothstep(0.2, 0.36, y));
    } else if (y < 0.52) {
        baseColor = mix(colorC, colorD, smoothstep(0.36, 0.52, y));
    } else if (y < 0.68) {
        baseColor = mix(colorD, colorE, smoothstep(0.52, 0.68, y));
    } else if (y < 0.84) {
        baseColor = mix(colorE, colorF, smoothstep(0.68, 0.84, y));
    } else {
        baseColor = mix(colorF, colorA, smoothstep(0.84, 1.0, y));
    }
    
    // ランダムに他の色を混ぜて境界をぼかす
    vec3 randomColor1 = getColorByY(fract(y + noise2 * 0.3));
    vec3 randomColor2 = getColorByY(fract(y - noise1 * 0.25));
    
    // 複数の色を混ぜる強さをノイズで調整
    float mixStrength1 = noise2 * 0.4;
    float mixStrength2 = noise1 * noise3 * 0.6;
    
    // 基本色と他のランダムな色を混ぜる
    vec3 color = baseColor;
    color = mix(color, randomColor1, mixStrength1);
    color = mix(color, randomColor2, mixStrength2);
    
    // 波の交差部分を強調する
    float waveCross = abs(wave1 * wave2) * 10.0;
    vec3 highlightColor = mix(color, vec3(1.0), waveCross * noise2 * 0.3);
    color = mix(color, highlightColor, noise1 * 0.4);
    
    // 透明度の高い部分を追加
    float frost = fbm(uv * 10.0 + vec2(time * 0.05, 0.0)) * 0.15;
    vec3 frostColor = isDark > 0.5 ? vec3(0.1, 0.1, 0.15) : vec3(1.0, 1.0, 1.0);
    color = mix(color, frostColor, frost);
    
    // 明るい粒子効果
    float particles = smoothstep(0.4, 0.6, noise(uv * 20.0 + time * 0.1));
    particles *= smoothstep(0.7, 0.9, noise2) * 0.5;
    color += particles * 0.2;
    
    return color;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 color = getColor(uv);
    
    // ビネットエフェクト（画面の端を暗く）
    float vignette = 1.0 - smoothstep(0.5, 1.5, length((uv - 0.5) * 2.0));
    color *= mix(0.85, 1.0, vignette);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

// Three.jsの初期化
function initThreeJS() {
    // エラー処理を追加
    try {
        if (!THREE) {
            console.error('THREE.js が読み込まれていません');
            fallbackBackground();
            return;
        }

        // キャンバスの確認
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            console.error('canvas要素が見つかりません');
            fallbackBackground();
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });

        // WebGLのサポート確認
        if (!renderer.capabilities.isWebGL2 && !renderer.extensions.get('ANGLE_instanced_arrays')) {
            console.error('WebGLがサポートされていません');
            fallbackBackground();
            return;
        }

        // カラーテーマの設定 - 指定された6色を使用
        let isDarkTheme = false;

        // 16進数カラーを0-1のRGB値に変換
        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            return new THREE.Vector3(r, g, b);
        }

        // 指定された色を使用
        const lightColors = {
            A: hexToRgb('#FFE082'), // 明るい黄色
            B: hexToRgb('#FFAB91'), // サーモン
            C: hexToRgb('#90CAF9'), // 水色
            D: hexToRgb('#B39DDB'), // ラベンダー
            E: hexToRgb('#4DB6AC'), // 青緑
            F: hexToRgb('#26A69A')  // ティール
        };

        // ダークテーマ用の色 - 同じ色の暗い版
        const darkColors = {
            A: hexToRgb('#B39B58'), // 暗い黄色
            B: hexToRgb('#B37865'), // 暗いサーモン
            C: hexToRgb('#5A80AB'), // 暗い水色
            D: hexToRgb('#7B6B99'), // 暗いラベンダー
            E: hexToRgb('#357F78'), // 暗い青緑
            F: hexToRgb('#1A726A')  // 暗いティール
        };

        // シェーダーマテリアルの作成 - 6色を使用
        const material = new THREE.ShaderMaterial({
            fragmentShader,
            vertexShader,
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                colorA: { value: lightColors.A },
                colorB: { value: lightColors.B },
                colorC: { value: lightColors.C },
                colorD: { value: lightColors.D },
                colorE: { value: lightColors.E },
                colorF: { value: lightColors.F },
                isDark: { value: 0.0 }
            }
        });

        // テーマトグルボタンを確認
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function (e) {
                e.preventDefault();
                isDarkTheme = !isDarkTheme;

                // テーマに基づいてシェーダーの色を更新
                material.uniforms.colorA.value = isDarkTheme ? darkColors.A : lightColors.A;
                material.uniforms.colorB.value = isDarkTheme ? darkColors.B : lightColors.B;
                material.uniforms.colorC.value = isDarkTheme ? darkColors.C : lightColors.C;
                material.uniforms.colorD.value = isDarkTheme ? darkColors.D : lightColors.D;
                material.uniforms.colorE.value = isDarkTheme ? darkColors.E : lightColors.E;
                material.uniforms.colorF.value = isDarkTheme ? darkColors.F : lightColors.F;
                material.uniforms.isDark.value = isDarkTheme ? 1.0 : 0.0;

                // ボディクラスを更新
                document.body.classList.toggle('dark-theme');
            });
        } else {
            console.warn('theme-toggleボタンが見つかりません');
        }

        // メッシュの作成
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // リサイズハンドラ
        function onWindowResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            material.uniforms.resolution.value.x = width;
            material.uniforms.resolution.value.y = height;
        }

        // アニメーションループ
        function animate(time) {
            material.uniforms.time.value = time * 0.001;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        // イベントリスナーの設定
        window.addEventListener('resize', onWindowResize);
        onWindowResize();
        requestAnimationFrame(animate);

        console.log('Three.jsの初期化が成功しました');
    } catch (error) {
        console.error('Three.js初期化エラー:', error);
        fallbackBackground();
    }
}

// フォールバック背景の設定 - Three.jsが動作しない場合のために
function fallbackBackground() {
    console.log('フォールバック背景を適用します');
    document.body.style.background = 'linear-gradient(135deg, #FFE082 0%, #FFAB91 20%, #90CAF9 40%, #B39DDB 60%, #4DB6AC 80%, #26A69A 100%)';
}

// ページ読み込み完了イベント
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM読み込み完了');

    // Three.jsが読み込まれているか確認
    if (typeof THREE === 'undefined') {
        console.error('THREE.jsライブラリが見つかりません');
        // Three.jsを動的に読み込む
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = function () {
            console.log('Three.jsを動的に読み込みました');
            initThreeJS();
        };
        script.onerror = function () {
            console.error('Three.jsの読み込みに失敗しました');
            fallbackBackground();
        };
        document.head.appendChild(script);
    } else {
        // Three.jsがすでに読み込まれている場合は直接初期化
        initThreeJS();
    }

    try {
        setupInteractions();

        // ロードアニメーション
        window.addEventListener('load', function () {
            document.body.classList.add('loaded');
        });
    } catch (error) {
        console.error('初期化エラー:', error);
    }
});

// アバターのインタラクション設定
function setupInteractions() {
    // アバタークリックイベント
    const avatar = document.getElementById('avatar');
    if (avatar) {
        avatar.addEventListener('click', function () {
            // アバターをクリックしたときのランダムなアニメーション
            const randomEffect = Math.floor(Math.random() * 3);
            const circle = this;

            if (randomEffect === 0) {
                // エフェクト1: 回転
                circle.style.animation = 'none';
                setTimeout(() => {
                    circle.style.animation = 'spin 1s ease-in-out';
                    setTimeout(() => {
                        circle.style.animation = 'organicPulse 6s infinite ease-in-out';
                    }, 1000);
                }, 10);
            } else if (randomEffect === 1) {
                // エフェクト2: ジャンプ
                circle.style.animation = 'none';
                setTimeout(() => {
                    circle.style.animation = 'jump 0.5s ease-in-out';
                    setTimeout(() => {
                        circle.style.animation = 'organicPulse 6s infinite ease-in-out';
                    }, 500);
                }, 10);
            } else {
                // エフェクト3: 拡大縮小
                circle.style.animation = 'none';
                setTimeout(() => {
                    circle.style.animation = 'popBounce 0.7s ease-in-out';
                    setTimeout(() => {
                        circle.style.animation = 'organicPulse 6s infinite ease-in-out';
                    }, 700);
                }, 10);
            }
        });
    } else {
        console.warn('avatar要素が見つかりません');
    }
}
