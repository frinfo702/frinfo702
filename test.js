document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Add this initThreeJS function at the beginning of your test.js file
    function initThreeJS() {
        // Create a scene
        const scene = new THREE.Scene();

        // Create a camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 2;

        // Create a renderer and attach it to your canvas
        const renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Create a simple material and geometry for testing
        const geometry = new THREE.PlaneGeometry(5, 5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.5
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            mesh.rotation.x += 0.005;
            mesh.rotation.y += 0.007;
            renderer.render(scene, camera);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start animation
        animate();
    }

    // Initialize Three.js scene
    initThreeJS(); // or whatever your initialization function is called

    // キャンバスのサイズ設定
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Anthropicのブランドカラー
    const colors = {
        background: '#fafaf7',
        accent: ['#CC785C', '#D4A27F', '#ebdbbc'],
        grey: ['#BFBFBA', '#91918D', '#666663'],
        text: '#262625'
    };

    // アニメーションの状態
    let time = 0;

    // 洗練された形状用のパラメータ
    const shapes = [];
    const shapeCount = 5; // 少なくして洗練された印象に

    // シンプルで洗練された形状を生成
    for (let i = 0; i < shapeCount; i++) {
        shapes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 150 + 50,
            color: i % 2 === 0 ?
                colors.accent[Math.floor(Math.random() * colors.accent.length)] :
                colors.grey[Math.floor(Math.random() * colors.grey.length)],
            opacity: Math.random() * 0.07 + 0.02, // より繊細な透明度
            speed: Math.random() * 0.2 + 0.05,
            angle: Math.random() * Math.PI * 2,
            pathRadius: Math.random() * 100 + 50,
            pathOffset: Math.random() * Math.PI * 2
        });
    }

    // 背景のドットパターン
    const dots = [];
    const dotCount = Math.floor((canvas.width * canvas.height) / 15000); // 画面サイズに応じたドット数

    for (let i = 0; i < dotCount; i++) {
        dots.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            color: colors.grey[Math.floor(Math.random() * colors.grey.length)],
            opacity: Math.random() * 0.15 + 0.05
        });
    }

    function animate() {
        // クリアしてから背景色を設定
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 背景のドットパターンを描画
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.fillStyle = `${dot.color}${Math.floor(dot.opacity * 255).toString(16).padStart(2, '0')}`;
            ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // 柔らかい形状を描画
        shapes.forEach(shape => {
            // 形状の中心点が緩やかに移動
            shape.x = canvas.width / 2 + Math.cos(time * shape.speed + shape.pathOffset) * shape.pathRadius;
            shape.y = canvas.height / 2 + Math.sin(time * shape.speed + shape.pathOffset) * shape.pathRadius;

            // グラデーションサークル
            const gradient = ctx.createRadialGradient(
                shape.x, shape.y, 0,
                shape.x, shape.y, shape.size
            );
            gradient.addColorStop(0, `${shape.color}${Math.floor(shape.opacity * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${shape.color}00`); // 完全に透明

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // 繊細な線を追加（ごく少数）
        ctx.beginPath();
        ctx.strokeStyle = `${colors.grey[1]}15`; // かなり透明な線
        ctx.lineWidth = 0.5;

        const lineX1 = canvas.width * 0.2 + Math.sin(time * 0.1) * 30;
        const lineY1 = canvas.height * 0.3 + Math.cos(time * 0.12) * 20;
        const lineX2 = canvas.width * 0.8 + Math.sin(time * 0.11) * 30;
        const lineY2 = canvas.height * 0.7 + Math.cos(time * 0.13) * 20;

        ctx.moveTo(lineX1, lineY1);

        // なめらかな曲線を描く
        const cp1x = canvas.width * 0.4 + Math.sin(time * 0.14) * 40;
        const cp1y = canvas.height * 0.1 + Math.cos(time * 0.15) * 30;
        const cp2x = canvas.width * 0.6 + Math.sin(time * 0.16) * 40;
        const cp2y = canvas.height * 0.9 + Math.cos(time * 0.17) * 30;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, lineX2, lineY2);
        ctx.stroke();

        // アクセントとなる繊細な円
        ctx.beginPath();
        ctx.strokeStyle = `${colors.accent[0]}20`;
        ctx.lineWidth = 0.5;
        const circleX = canvas.width * 0.7 + Math.cos(time * 0.2) * 50;
        const circleY = canvas.height * 0.4 + Math.sin(time * 0.2) * 30;
        ctx.arc(circleX, circleY, 80 + Math.sin(time * 0.3) * 10, 0, Math.PI * 2);
        ctx.stroke();

        time += 0.01;
        requestAnimationFrame(animate);
    }

    // テーマ切替のイベントリスナー
    document.getElementById('theme-toggle')?.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
    });

    // アニメーション開始
    animate();
});
