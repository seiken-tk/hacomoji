// グローバル変数
let scene, camera, renderer, controls, textMesh;
let font;
let textGroup = new THREE.Group();
let isInitialized = false;
let gridHelper;
let textureLoader = new THREE.TextureLoader();
let textures = {};
let ambientLight, mainLight, subLight;
let lightHelpers = [];
let animationId;
let capturer;
let isRecording = false;
let rotationAngle = 0; // 回転角度を追跡する変数
let startRotationAngle = 0; // 録画開始時の回転角度
let fullRotationRecording = false; // 一周録画モードのフラグ
let svgLoader; // SVGローダー
let currentMode = 'text'; // 現在のモード（'text' または 'svg'）

// パラメーター
const params = {
    text: '箱モジ',
    size: 10,
    depth: 5,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.3,
    curveSegments: 12,
    letterSpacing: 0.2,
    fontType: 'noto-sans-jp',
    materialType: 'normal',
    color: '#1976D2',
    roughness: 0.4,
    metalness: 0.3,
    opacity: 1.0,
    textureEnabled: false,
    textureType: 'brick',
    textureScale: 1.0,
    customTexture: null,
    
    // 文字変形の設定
    transformEnabled: false,
    horizontalScale: 1.0,
    verticalScale: 1.0,
    frontTaper: 0.0,
    backTaper: 0.0,

    // 光源の設定
    ambientLightEnabled: true,
    ambientLightColor: '#ffffff',
    ambientLightIntensity: 0.5,
    
    mainLightEnabled: true,
    mainLightColor: '#ffffff',
    mainLightIntensity: 0.8,
    mainLightX: 10,
    mainLightY: 10,
    mainLightZ: 10,
    
    subLightEnabled: true,
    subLightColor: '#ffffff',
    subLightIntensity: 0.3,
    subLightX: -10,
    subLightY: 5,
    subLightZ: -10,
    
    // 回転アニメーションの設定
    rotationEnabled: false,
    rotationAxis: 'y', // 'x', 'y', 'z'
    rotationSpeed: 0.01,
    
    // 動画出力の設定
    videoQuality: 'high', // 'low', 'medium', 'high'
    videoFrameRate: 30,
    videoDuration: 5 // 秒
};

// DOM要素
const textInput = document.getElementById('text-input');
const generateBtn = document.getElementById('generate-btn');
const fontSizeSlider = document.getElementById('font-size');
const depthSlider = document.getElementById('depth');
const bevelEnabledCheckbox = document.getElementById('bevel-enabled');
const bevelThicknessSlider = document.getElementById('bevel-thickness');
const bevelSizeSlider = document.getElementById('bevel-size');
const curveSegmentsSlider = document.getElementById('curve-segments');
const letterSpacingSlider = document.getElementById('letter-spacing');
const fontTypeSelect = document.getElementById('font-type');
const materialTypeSelect = document.getElementById('material-type');
const colorPicker = document.getElementById('color');
const roughnessSlider = document.getElementById('roughness');
const metalnessSlider = document.getElementById('metalness');
const opacitySlider = document.getElementById('opacity');
const textureEnabledCheckbox = document.getElementById('texture-enabled');
const textureSelect = document.getElementById('texture-select');
const textureScaleSlider = document.getElementById('texture-scale');
const customTextureInput = document.getElementById('custom-texture');
const customTextureContainer = document.getElementById('custom-texture-container');
const gridEnabledCheckbox = document.getElementById('grid-enabled');
const exportSTLBtn = document.getElementById('export-stl');
const exportOBJBtn = document.getElementById('export-obj');
const exportPNGBtn = document.getElementById('export-png');
const pngResolutionSelect = document.getElementById('png-resolution');

// SVG関連のDOM要素
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const svgUpload = document.getElementById('svg-upload');
const svgFilename = document.getElementById('svg-filename');
const svgGenerateBtn = document.getElementById('svg-generate-btn');

// 文字変形のDOM要素
const transformEnabledCheckbox = document.getElementById('transform-enabled');
const horizontalScaleSlider = document.getElementById('horizontal-scale');
const verticalScaleSlider = document.getElementById('vertical-scale');
const frontTaperSlider = document.getElementById('front-taper');
const backTaperSlider = document.getElementById('back-taper');

// 環境光のコントロール
const ambientLightEnabledCheckbox = document.getElementById('ambient-light-enabled');
const ambientLightIntensitySlider = document.getElementById('ambient-light-intensity');
const ambientLightColorPicker = document.getElementById('ambient-light-color');

// メイン光源のコントロール
const mainLightEnabledCheckbox = document.getElementById('main-light-enabled');
const mainLightIntensitySlider = document.getElementById('main-light-intensity');
const mainLightColorPicker = document.getElementById('main-light-color');
const mainLightXSlider = document.getElementById('main-light-x');
const mainLightYSlider = document.getElementById('main-light-y');
const mainLightZSlider = document.getElementById('main-light-z');

// サブ光源のコントロール
const subLightEnabledCheckbox = document.getElementById('sub-light-enabled');
const subLightIntensitySlider = document.getElementById('sub-light-intensity');
const subLightColorPicker = document.getElementById('sub-light-color');
const subLightXSlider = document.getElementById('sub-light-x');
const subLightYSlider = document.getElementById('sub-light-y');
const subLightZSlider = document.getElementById('sub-light-z');

// 回転アニメーションのコントロール
const rotationEnabledCheckbox = document.getElementById('rotation-enabled');
const rotationAxisSelect = document.getElementById('rotation-axis');
const rotationSpeedSlider = document.getElementById('rotation-speed');

// 動画出力のコントロール
const videoQualitySelect = document.getElementById('video-quality');
const videoFrameRateSelect = document.getElementById('video-frame-rate');
const videoDurationSlider = document.getElementById('video-duration');
const startRecordingBtn = document.getElementById('start-recording');
const stopRecordingBtn = document.getElementById('stop-recording');

// 値表示要素
const valueDisplays = document.querySelectorAll('.value-display');

// 初期化
window.addEventListener('load', init);

// ページの可視性変更イベント（モバイル最適化用）
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && isMobileDevice()) {
        // ページが表示された時に再レンダリング
        renderer && renderer.render(scene, camera);
    }
});

// イベントリスナー
generateBtn.addEventListener('click', updateText);
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        updateText();
    }
});

// タブ切り替え
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // アクティブなタブを更新
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // タブコンテンツを表示/非表示
        const tabId = btn.getAttribute('data-tab');
        tabContents.forEach(content => {
            content.style.display = content.id === tabId ? 'flex' : 'none';
        });
        
        // 現在のモードを更新
        currentMode = tabId === 'text-tab' ? 'text' : 'svg';
    });
});

// SVGファイルアップロード
svgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        svgFilename.textContent = file.name;
    } else {
        svgFilename.textContent = 'ファイルが選択されていません';
    }
});

// SVG生成ボタン
svgGenerateBtn.addEventListener('click', processSVG);

fontSizeSlider.addEventListener('input', updateValueDisplay);
depthSlider.addEventListener('input', updateValueDisplay);
bevelThicknessSlider.addEventListener('input', updateValueDisplay);
bevelSizeSlider.addEventListener('input', updateValueDisplay);
curveSegmentsSlider.addEventListener('input', updateValueDisplay);
letterSpacingSlider.addEventListener('input', updateValueDisplay);
roughnessSlider.addEventListener('input', updateValueDisplay);
metalnessSlider.addEventListener('input', updateValueDisplay);
opacitySlider.addEventListener('input', updateValueDisplay);
textureScaleSlider.addEventListener('input', updateValueDisplay);

fontSizeSlider.addEventListener('change', updateParameters);
depthSlider.addEventListener('change', updateParameters);
bevelEnabledCheckbox.addEventListener('change', updateParameters);
bevelThicknessSlider.addEventListener('change', updateParameters);
bevelSizeSlider.addEventListener('change', updateParameters);
curveSegmentsSlider.addEventListener('change', updateParameters);
letterSpacingSlider.addEventListener('change', updateParameters);
fontTypeSelect.addEventListener('change', updateFont);
materialTypeSelect.addEventListener('change', updateParameters);
colorPicker.addEventListener('change', updateParameters);
roughnessSlider.addEventListener('change', updateParameters);
metalnessSlider.addEventListener('change', updateParameters);
opacitySlider.addEventListener('change', updateParameters);
textureEnabledCheckbox.addEventListener('change', updateParameters);
textureSelect.addEventListener('change', updateParameters);
textureScaleSlider.addEventListener('change', updateParameters);
customTextureInput.addEventListener('change', handleCustomTexture);

exportSTLBtn.addEventListener('click', exportSTL);
exportOBJBtn.addEventListener('click', exportOBJ);
exportPNGBtn.addEventListener('click', exportPNG);

// ベベルコントロールの表示/非表示
bevelEnabledCheckbox.addEventListener('change', toggleBevelControls);

// マテリアルコントロールの表示/非表示
materialTypeSelect.addEventListener('change', toggleMaterialControls);

// 文字変形コントロールの表示/非表示
transformEnabledCheckbox.addEventListener('change', toggleTransformControls);

// 文字変形パラメーターのイベントリスナー
horizontalScaleSlider.addEventListener('input', updateValueDisplay);
verticalScaleSlider.addEventListener('input', updateValueDisplay);
frontTaperSlider.addEventListener('input', updateValueDisplay);
backTaperSlider.addEventListener('input', updateValueDisplay);

horizontalScaleSlider.addEventListener('change', updateParameters);
verticalScaleSlider.addEventListener('change', updateParameters);
frontTaperSlider.addEventListener('change', updateParameters);
backTaperSlider.addEventListener('change', updateParameters);

// グリッドの表示/非表示
gridEnabledCheckbox.addEventListener('change', toggleGrid);

// 環境光の設定
ambientLightEnabledCheckbox.addEventListener('change', updateLights);
ambientLightIntensitySlider.addEventListener('input', updateValueDisplay);
ambientLightIntensitySlider.addEventListener('change', updateLights);
ambientLightColorPicker.addEventListener('change', updateLights);

// メイン光源の設定
mainLightEnabledCheckbox.addEventListener('change', updateLights);
mainLightIntensitySlider.addEventListener('input', updateValueDisplay);
mainLightIntensitySlider.addEventListener('change', updateLights);
mainLightColorPicker.addEventListener('change', updateLights);
mainLightXSlider.addEventListener('input', updateValueDisplay);
mainLightXSlider.addEventListener('change', updateLights);
mainLightYSlider.addEventListener('input', updateValueDisplay);
mainLightYSlider.addEventListener('change', updateLights);
mainLightZSlider.addEventListener('input', updateValueDisplay);
mainLightZSlider.addEventListener('change', updateLights);

// サブ光源の設定
subLightEnabledCheckbox.addEventListener('change', updateLights);
subLightIntensitySlider.addEventListener('input', updateValueDisplay);
subLightIntensitySlider.addEventListener('change', updateLights);
subLightColorPicker.addEventListener('change', updateLights);
subLightXSlider.addEventListener('input', updateValueDisplay);
subLightXSlider.addEventListener('change', updateLights);
subLightYSlider.addEventListener('input', updateValueDisplay);
subLightYSlider.addEventListener('change', updateLights);
subLightZSlider.addEventListener('input', updateValueDisplay);
subLightZSlider.addEventListener('change', updateLights);

// 回転アニメーションの設定
rotationEnabledCheckbox.addEventListener('change', updateRotation);
rotationAxisSelect.addEventListener('change', updateRotation);
rotationSpeedSlider.addEventListener('input', updateValueDisplay);
rotationSpeedSlider.addEventListener('change', updateRotation);

// 動画出力の設定
videoQualitySelect.addEventListener('change', updateVideoSettings);
videoFrameRateSelect.addEventListener('change', updateVideoSettings);
videoDurationSlider.addEventListener('input', updateValueDisplay);
videoDurationSlider.addEventListener('change', updateVideoSettings);
startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);

// 初期化関数
function init() {
    // Three.jsの初期化
    initThreeJS();
    
    // テクスチャの初期化
    initTextures();
    
    // フォントのロード
    loadFont();
    
    // SVGローダーの初期化
    svgLoader = new THREE.SVGLoader();
    
    // スライダーの初期値を表示
    updateAllValueDisplays();
    
    // ベベルコントロールの初期表示
    toggleBevelControls();
    
    // マテリアルコントロールの初期表示
    toggleMaterialControls();
    
    // テクスチャコントロールの初期表示
    toggleTextureControls();
    
    // 文字変形を有効にする（チェックボックスをオンにする）
    transformEnabledCheckbox.checked = true;
    params.transformEnabled = true;
    
    // 文字変形コントロールの初期表示
    toggleTransformControls();
    
    // 光源コントロールの初期表示
    toggleLightControls();
    
    // 回転アニメーションコントロールの初期表示（動画出力コントロールも含む）
    toggleRotationControls();
    
    // 影と光源の値表示を更新
    updateLightShadowValueDisplays();
    
    // 回転と動画出力の値表示を更新
    updateRotationVideoValueDisplays();
    
    // 折り畳みセクションの初期化
    initCollapsibleSections();
    
    // CCapture.jsの初期化
    initCCapture();
}

// 折り畳みセクションの初期化
function initCollapsibleSections() {
    // すべてのセクションヘッダーに対してイベントリスナーを追加
    const sectionHeaders = document.querySelectorAll('.section-header');
    
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sectionName = header.getAttribute('data-section');
            const content = document.getElementById(`${sectionName}-content`);
            const isOpen = header.classList.contains('open');
            
            // 開閉状態を切り替え
            if (isOpen) {
                header.classList.remove('open');
                header.querySelector('.toggle-icon').textContent = '▶';
                content.style.display = 'none';
            } else {
                header.classList.add('open');
                header.querySelector('.toggle-icon').textContent = '▼';
                content.style.display = 'block';
            }
        });
    });
}

// テクスチャの初期化
function initTextures() {
    // 基本テクスチャをロード
    textures.brick = textureLoader.load('images/brick.jpg');
    textures.wood = textureLoader.load('images/wood.jpg');
    textures.concrete = textureLoader.load('images/floor.jpg');
    textures.fabric = textureLoader.load('images/grass.jpg');
    
    // テクスチャの繰り返し設定
    Object.values(textures).forEach(texture => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
    });
}

// Three.jsの初期化
function initThreeJS() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);
    
    // モバイルデバイスかどうかを確認
    const isMobile = isMobileDevice();
    
    // カメラの作成 - モバイルの場合はFOVを調整
    const fov = isMobile ? 85 : 75;
    camera = new THREE.PerspectiveCamera(fov, getAspectRatio(), 0.1, 1000);
    camera.position.set(0, 30, 50);
    
    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({
        antialias: !isMobile, // モバイルではアンチエイリアスを無効化してパフォーマンス向上
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(getViewWidth(), getViewHeight());
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio);
    
    // レンダラーをDOMに追加
    const viewContainer = document.getElementById('three-d-view');
    viewContainer.innerHTML = '';
    viewContainer.appendChild(renderer.domElement);
    
    // レンダラーのスタイル設定 - モバイル対応
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none'; // タッチイベントの競合を防止
    
    // コントロールの作成
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = !isMobile; // モバイルではパンを無効化
    controls.rotateSpeed = isMobile ? 0.7 : 1.0; // モバイルでは回転速度を調整
    
    // 初期視点を斜め上から
    camera.position.set(30, 40, 50);
    controls.update();
    
    // 光源の追加
    addLights();
    
    // グリッドヘルパーの追加
    gridHelper = new THREE.GridHelper(100, 10);
    // グリッドヘルパーを背面に表示するために低いrenderOrderを設定
    gridHelper.renderOrder = -1;
    scene.add(gridHelper);
    
    // テキストグループをシーンに追加
    // テキストを前面に表示するために高いrenderOrderを設定
    textGroup.renderOrder = 1;
    scene.add(textGroup);
    
    // アニメーションループの開始
    animate();
    
    // ウィンドウリサイズ対応
    window.addEventListener('resize', onWindowResize);
    
    // モバイルデバイスの場合、orientationchangeイベントも監視
    if (isMobile) {
        window.addEventListener('orientationchange', function() {
            // 少し遅延させて実行（画面回転の完了を待つ）
            setTimeout(onWindowResize, 200);
        });
        
        // モバイルデバイス用のタッチイベント最適化
        const viewContainer = document.getElementById('three-d-view');
        
        // タッチイベントの処理
        viewContainer.addEventListener('touchstart', function(e) {
            // デフォルトのスクロール動作を防止
            e.preventDefault();
            
            // タッチイベントがOrbitControlsに渡されるようにする
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            renderer.domElement.dispatchEvent(mouseEvent);
        }, { passive: false });
        
        // ピンチズーム検出用の変数
        let lastTouchDistance = 0;
        
        viewContainer.addEventListener('touchmove', function(e) {
            e.preventDefault();
            
            // マルチタッチの場合（ピンチズーム）
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                // 2点間の距離を計算
                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                // 前回の距離との差分でズーム
                if (lastTouchDistance > 0) {
                    const delta = distance - lastTouchDistance;
                    // カメラの位置を調整（ズームイン/アウト）
                    camera.position.z -= delta * 0.1;
                    // 範囲制限
                    camera.position.z = Math.max(10, Math.min(100, camera.position.z));
                }
                
                lastTouchDistance = distance;
            } else if (e.touches.length === 1) {
                // 単一タッチの場合（回転）
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                renderer.domElement.dispatchEvent(mouseEvent);
            }
        }, { passive: false });
        
        viewContainer.addEventListener('touchend', function(e) {
            e.preventDefault();
            
            // ピンチズームの状態をリセット
            lastTouchDistance = 0;
            
            const mouseEvent = new MouseEvent('mouseup');
            renderer.domElement.dispatchEvent(mouseEvent);
        }, { passive: false });
    }
}

// 光源の追加
function addLights() {
    // 環境光
    ambientLight = new THREE.AmbientLight(
        new THREE.Color(params.ambientLightColor),
        params.ambientLightIntensity
    );
    ambientLight.visible = params.ambientLightEnabled;
    scene.add(ambientLight);
    
    // ディレクショナルライト（メイン）
    mainLight = new THREE.DirectionalLight(
        new THREE.Color(params.mainLightColor),
        params.mainLightIntensity
    );
    mainLight.position.set(params.mainLightX, params.mainLightY, params.mainLightZ);
    mainLight.visible = params.mainLightEnabled;
    
    // 影の設定は削除
    mainLight.castShadow = false;
    
    scene.add(mainLight);
    
    // ディレクショナルライト（サブ）
    subLight = new THREE.DirectionalLight(
        new THREE.Color(params.subLightColor),
        params.subLightIntensity
    );
    subLight.position.set(params.subLightX, params.subLightY, params.subLightZ);
    subLight.visible = params.subLightEnabled;
    scene.add(subLight);
    
    // 影の設定は削除
    renderer.shadowMap.enabled = false;
    
    // テキストグループに影を受ける設定は削除
    textGroup.receiveShadow = false;
    textGroup.castShadow = false;
}

// フォントのロード
function loadFont() {
    const loader = new THREE.FontLoader();
    
    let fontPath;
    
    // 日本語フォントの場合
    if (params.fontType.startsWith('noto-sans-jp') ||
        params.fontType.startsWith('noto-serif-jp') ||
        params.fontType.startsWith('mplus') ||
        params.fontType.startsWith('kosugi') ||
        params.fontType.startsWith('sawarabi')) {
        // 日本語フォントの場合は特別な処理
        font = null; // フォントオブジェクトはnullに設定
        createText(); // 直接テキスト作成へ
        return;
    }
    
    // 英字フォントの場合
    switch (params.fontType) {
        case 'optimer':
            fontPath = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/optimer_regular.typeface.json';
            break;
        case 'gentilis':
            fontPath = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/gentilis_regular.typeface.json';
            break;
        case 'droid':
            fontPath = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/droid/droid_sans_regular.typeface.json';
            break;
        case 'roboto':
        case 'open-sans':
            // Google Fontsの英字フォントはThree.jsのフォントローダーでは直接サポートされていないため、
            // デフォルトのhelvetikerを使用
            fontPath = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/helvetiker_regular.typeface.json';
            break;
        default: // helvetiker
            fontPath = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/helvetiker_regular.typeface.json';
    }
    
    // 通常のフォントをロード
    loader.load(fontPath, function(loadedFont) {
        font = loadedFont;
        createText();
    });
}

// フォントの更新
function updateFont() {
    params.fontType = fontTypeSelect.value;
    loadFont();
}

// テキストの作成
function createText() {
    // 既存のテキストメッシュをクリア
    textGroup.clear();
    
    // 日本語フォントの場合
    if (params.fontType.startsWith('noto-sans-jp') ||
        params.fontType.startsWith('noto-serif-jp') ||
        params.fontType.startsWith('mplus') ||
        params.fontType.startsWith('kosugi') ||
        params.fontType.startsWith('sawarabi')) {
        createJapaneseText();
        return;
    }
    
    // 通常のフォントの場合
    if (!font) return;
    
    // テキストジオメトリの作成
    const textGeometry = new THREE.TextGeometry(params.text, {
        font: font,
        size: params.size,
        height: params.depth,
        curveSegments: params.curveSegments,
        bevelEnabled: params.bevelEnabled,
        bevelThickness: params.bevelThickness,
        bevelSize: params.bevelSize,
        bevelSegments: 5
    });
    
    // ジオメトリを中央に配置
    textGeometry.computeBoundingBox();
    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
    textGeometry.translate(-textWidth / 2, -textHeight / 2, 0);
    
    // 変形が有効な場合、ジオメトリを変形
    if (params.transformEnabled) {
        applyTransformToGeometry(textGeometry);
    }
    
    // マテリアルの作成
    const material = createMaterial();
    
    // メッシュの作成
    textMesh = new THREE.Mesh(textGeometry, material);
    // テキストメッシュを前面に表示するためにrenderOrderを設定
    textMesh.renderOrder = 2;
    
    textGroup.add(textMesh);
    
    // 初期化完了
    isInitialized = true;
}

// 日本語テキストの作成（OpenType.jsを使用）
function createJapaneseText() {
    const text = params.text;
    console.log('日本語テキスト作成:', text);
    if (!text) return;
    
    // ローディングアニメーションを表示
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'font-loading-container';
    loadingContainer.style.position = 'absolute';
    loadingContainer.style.top = '50%';
    loadingContainer.style.left = '50%';
    loadingContainer.style.transform = 'translate(-50%, -50%)';
    loadingContainer.style.textAlign = 'center';
    loadingContainer.style.zIndex = '1000';
    loadingContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    loadingContainer.style.padding = '25px';
    loadingContainer.style.borderRadius = '12px';
    loadingContainer.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
    loadingContainer.style.width = '300px';
    loadingContainer.style.border = '1px solid rgba(25, 118, 210, 0.2)';
    
    // ローディングメッセージ
    const loadingMessage = document.createElement('div');
    loadingMessage.style.color = '#1976D2';
    loadingMessage.style.fontSize = '20px';
    loadingMessage.style.fontWeight = 'bold';
    loadingMessage.style.marginBottom = '15px';
    loadingMessage.textContent = '日本語フォントを読み込み中...';
    
    // ローディングスピナー
    const spinner = document.createElement('div');
    spinner.style.border = '6px solid #f3f3f3';
    spinner.style.borderTop = '6px solid #1976D2';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.margin = '0 auto';
    spinner.style.animation = 'spin 1s linear infinite';
    
    // 進捗メッセージ
    const progressMessage = document.createElement('div');
    progressMessage.style.color = '#666';
    progressMessage.style.fontSize = '14px';
    progressMessage.style.marginTop = '15px';
    progressMessage.style.fontStyle = 'italic';
    progressMessage.textContent = '少々お待ちください...';
    
    // スピナーのアニメーションスタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
    `;
    document.head.appendChild(style);
    
    // 要素を追加
    loadingContainer.appendChild(loadingMessage);
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(progressMessage);
    document.body.appendChild(loadingContainer);
    
    // 選択されたフォントに基づいてフォントURLを設定
    let fontUrl;
    switch (params.fontType) {
        case 'noto-sans-jp':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@4.5.0/files/noto-sans-jp-japanese-400-normal.woff';
            break;
        case 'noto-serif-jp':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-jp@4.5.0/files/noto-serif-jp-japanese-400-normal.woff';
            break;
        case 'mplus-1p':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/m-plus-1p@4.5.0/files/m-plus-1p-japanese-400-normal.woff';
            break;
        case 'mplus-rounded-1c':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/m-plus-rounded-1c@4.5.0/files/m-plus-rounded-1c-japanese-400-normal.woff';
            break;
        case 'kosugi-maru':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/kosugi-maru@4.5.0/files/kosugi-maru-japanese-400-normal.woff';
            break;
        case 'kosugi':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/kosugi@4.5.0/files/kosugi-japanese-400-normal.woff';
            break;
        case 'sawarabi-gothic':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/sawarabi-gothic@4.5.0/files/sawarabi-gothic-japanese-400-normal.woff';
            break;
        case 'sawarabi-mincho':
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/sawarabi-mincho@4.5.0/files/sawarabi-mincho-japanese-400-normal.woff';
            break;
        default:
            fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@4.5.0/files/noto-sans-jp-japanese-400-normal.woff';
    }
    
    // 日本語フォントを読み込む
    opentype.load(fontUrl, function(err, font) {
        // ローディングコンテナを削除
        const loadingContainer = document.getElementById('font-loading-container');
        if (loadingContainer) {
            document.body.removeChild(loadingContainer);
        }
        
        // フォント読み込み完了メッセージを表示（一時的に）
        const completionMessage = document.createElement('div');
        completionMessage.style.position = 'absolute';
        completionMessage.style.top = '20px';
        completionMessage.style.left = '50%';
        completionMessage.style.transform = 'translateX(-50%)';
        completionMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
        completionMessage.style.color = 'white';
        completionMessage.style.padding = '10px 20px';
        completionMessage.style.borderRadius = '5px';
        completionMessage.style.zIndex = '1000';
        completionMessage.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        completionMessage.style.animation = 'fadeInOut 2s forwards';
        completionMessage.textContent = 'フォントの読み込みが完了しました';
        document.body.appendChild(completionMessage);
        
        // フェードイン・フェードアウトのアニメーション
        const fadeStyle = document.createElement('style');
        fadeStyle.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(fadeStyle);
        
        // 2秒後にメッセージを削除
        setTimeout(() => {
            if (document.body.contains(completionMessage)) {
                document.body.removeChild(completionMessage);
            }
        }, 2000);
        
        if (err) {
            console.error('フォントの読み込みに失敗しました:', err);
            return;
        }
        
        // 文字の配列
        const characters = text.split('');
        
        // マテリアルの作成
        const material = createMaterial();
        
        // 文字間のスペース
        const spacing = params.size * params.letterSpacing;
        
        // 文字の幅を計算
        const charWidths = [];
        let totalWidth = 0;
        
        characters.forEach(char => {
            // 文字のグリフを取得
            const glyph = font.charToGlyph(char);
            // 文字の幅を取得（フォントユニットからピクセルに変換）
            const width = glyph.advanceWidth / font.unitsPerEm * params.size;
            charWidths.push(width);
            totalWidth += width + spacing;
        });
        
        // 最後のスペースを引く
        totalWidth -= spacing;
        
        // 開始位置（中央揃え）
        let xPos = -totalWidth / 2;
        
        // 各文字の3Dオブジェクトを作成
        characters.forEach((char, index) => {
            // 文字のグリフを取得
            const glyph = font.charToGlyph(char);
            
            // グリフのパスを取得
            const path = glyph.getPath(0, 0, params.size);
            
            // パスをThree.jsのシェイプに変換
            const shapes = createShapesFromPath(path);
            
            if (shapes.length > 0) {
                // 押し出し設定
                const extrudeSettings = {
                    steps: 1,
                    depth: params.depth,
                    bevelEnabled: params.bevelEnabled,
                    bevelThickness: params.bevelThickness,
                    bevelSize: params.bevelSize,
                    bevelSegments: 3,
                    curveSegments: params.curveSegments
                };
                
                // 各シェイプを押し出して3Dジオメトリを作成
                shapes.forEach(shape => {
                    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    
                    // 変形が有効な場合、ジオメトリを変形
                    if (params.transformEnabled) {
                        applyTransformToGeometry(geometry);
                    }
                    
                    // メッシュの作成
                    const charMesh = new THREE.Mesh(geometry, material);
                    
                    // 位置の設定
                    charMesh.position.x = xPos;
                    // Y軸を反転（OpenTypeとThree.jsの座標系の違いを調整）
                    charMesh.rotation.x = Math.PI;
                    // 文字メッシュを前面に表示するためにrenderOrderを設定
                    charMesh.renderOrder = 2;
                    
                    // 影の設定は削除
                    
                    // グループに追加
                    textGroup.add(charMesh);
                });
            }
            
            // 次の文字の位置を更新
            xPos += charWidths[index] + spacing;
        });
        
        // 初期化完了
        isInitialized = true;
    });
}

// OpenType.jsのパスからThree.jsのシェイプを作成
function createShapesFromPath(path) {
    const shapes = [];
    let currentShape = new THREE.Shape();
    let currentPosition = { x: 0, y: 0 };
    let firstPosition = null;
    
    // パスのコマンドを処理
    path.commands.forEach(cmd => {
        switch (cmd.type) {
            case 'M': // 移動
                if (firstPosition !== null) {
                    // 前のシェイプを閉じて新しいシェイプを開始
                    shapes.push(currentShape);
                    currentShape = new THREE.Shape();
                }
                currentPosition = { x: cmd.x, y: cmd.y };
                firstPosition = { x: cmd.x, y: cmd.y };
                currentShape.moveTo(cmd.x, cmd.y);
                break;
                
            case 'L': // 直線
                currentPosition = { x: cmd.x, y: cmd.y };
                currentShape.lineTo(cmd.x, cmd.y);
                break;
                
            case 'C': // 3次ベジェ曲線
                currentPosition = { x: cmd.x, y: cmd.y };
                currentShape.bezierCurveTo(
                    cmd.x1, cmd.y1,
                    cmd.x2, cmd.y2,
                    cmd.x, cmd.y
                );
                break;
                
            case 'Q': // 2次ベジェ曲線
                currentPosition = { x: cmd.x, y: cmd.y };
                currentShape.quadraticCurveTo(
                    cmd.x1, cmd.y1,
                    cmd.x, cmd.y
                );
                break;
                
            case 'Z': // 閉じる
                if (firstPosition !== null) {
                    currentShape.closePath();
                    shapes.push(currentShape);
                    currentShape = new THREE.Shape();
                    firstPosition = null;
                }
                break;
        }
    });
    
    // 最後のシェイプが追加されていない場合は追加
    if (firstPosition !== null && currentShape.curves.length > 0) {
        shapes.push(currentShape);
    }
    
    return shapes;
}

// マテリアルの作成
function createMaterial() {
    const color = new THREE.Color(params.color);
    const transparent = params.opacity < 1.0;
    let material;
    
    switch (params.materialType) {
        case 'phong':
            material = new THREE.MeshPhongMaterial({
                color: color,
                shininess: 100,
                transparent: transparent,
                opacity: params.opacity
            });
            break;
        case 'lambert':
            material = new THREE.MeshLambertMaterial({
                color: color,
                transparent: transparent,
                opacity: params.opacity
            });
            break;
        case 'wireframe':
            material = new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true,
                transparent: transparent,
                opacity: params.opacity
            });
            break;
        default: // normal
            material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: params.metalness,
                roughness: params.roughness,
                transparent: transparent,
                opacity: params.opacity
            });
            break;
    }
    
    // テクスチャが有効な場合、テクスチャを適用
    if (params.textureEnabled && params.materialType !== 'wireframe') {
        const texture = getSelectedTexture();
        if (texture) {
            // テクスチャのスケールを設定
            texture.repeat.set(params.textureScale, params.textureScale);
            
            // マテリアルにテクスチャを適用
            material.map = texture;
        }
    }
    
    return material;
}

// 選択されたテクスチャを取得
function getSelectedTexture() {
    if (params.textureType === 'custom' && params.customTexture) {
        return textures.custom;
    }
    return textures[params.textureType];
}

// テクスチャの更新
function updateTexture() {
    params.textureEnabled = textureEnabledCheckbox.checked;
    params.textureType = textureSelect.value;
    params.textureScale = parseFloat(textureScaleSlider.value);
    
    // カスタムテクスチャコンテナの表示/非表示
    customTextureContainer.style.display =
        (params.textureEnabled && params.textureType === 'custom') ? 'flex' : 'none';
    
    // テキストを再生成（テクスチャを適切に適用するため）
    createText();
}

// アニメーションループ
function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    
    // 回転アニメーションが有効な場合
    if (params.rotationEnabled && textGroup) {
        // 選択された軸に基づいて回転
        switch (params.rotationAxis) {
            case 'x':
                textGroup.rotation.x += params.rotationSpeed;
                rotationAngle += params.rotationSpeed;
                break;
            case 'y':
                textGroup.rotation.y += params.rotationSpeed;
                rotationAngle += params.rotationSpeed;
                break;
            case 'z':
                textGroup.rotation.z += params.rotationSpeed;
                rotationAngle += params.rotationSpeed;
                break;
        }
        
        // 一周録画モードが有効で、一周（2π）以上回転した場合に録画を停止
        if (fullRotationRecording && isRecording && (rotationAngle - startRotationAngle) >= Math.PI * 2) {
            stopRecording();
        }
    }
    
    // モバイルデバイスの場合、パフォーマンス最適化
    if (isMobileDevice()) {
        // 画面が表示されている場合のみレンダリング
        if (document.visibilityState === 'visible') {
            renderer.render(scene, camera);
            
            // 録画中の場合、フレームをキャプチャ
            if (isRecording && capturer) {
                capturer.capture(renderer.domElement);
            }
        }
    } else {
        renderer.render(scene, camera);
        
        // 録画中の場合、フレームをキャプチャ
        if (isRecording && capturer) {
            capturer.capture(renderer.domElement);
        }
    }
}

// テキストの更新
function updateText() {
    params.text = textInput.value || '箱モジ';
    console.log('テキスト更新:', params.text);
    currentMode = 'text';
    createText();
}

// パラメーターの更新（モードに応じて適切な処理を呼び出す）
function updateParameters() {
    // 共通パラメーターの更新
    params.size = parseFloat(fontSizeSlider.value);
    params.depth = parseFloat(depthSlider.value);
    params.bevelEnabled = bevelEnabledCheckbox.checked;
    params.bevelThickness = parseFloat(bevelThicknessSlider.value);
    params.bevelSize = parseFloat(bevelSizeSlider.value);
    params.curveSegments = parseInt(curveSegmentsSlider.value);
    params.letterSpacing = parseFloat(letterSpacingSlider.value);
    
    // 変形パラメーターの更新
    params.transformEnabled = transformEnabledCheckbox.checked;
    params.horizontalScale = parseFloat(horizontalScaleSlider.value);
    params.verticalScale = parseFloat(verticalScaleSlider.value);
    params.frontTaper = parseFloat(frontTaperSlider.value);
    params.backTaper = parseFloat(backTaperSlider.value);
    
    // マテリアルとテクスチャのパラメーターも更新
    params.materialType = materialTypeSelect.value;
    params.color = colorPicker.value;
    params.roughness = parseFloat(roughnessSlider.value);
    params.metalness = parseFloat(metalnessSlider.value);
    params.opacity = parseFloat(opacitySlider.value);
    params.textureEnabled = textureEnabledCheckbox.checked;
    params.textureType = textureSelect.value;
    params.textureScale = parseFloat(textureScaleSlider.value);
    
    // テクスチャコントロールの表示/非表示を更新
    const textureControls = document.querySelectorAll('.texture-control');
    const display = params.textureEnabled ? 'flex' : 'none';
    
    textureControls.forEach(control => {
        control.style.display = display;
    });
    
    // カスタムテクスチャコンテナの表示/非表示
    customTextureContainer.style.display =
        (params.textureEnabled && params.textureType === 'custom') ? 'flex' : 'none';
    
    // 現在のモードに応じて適切な処理を呼び出す
    if (currentMode === 'text') {
        createText();
    } else if (currentMode === 'svg') {
        // 最後に読み込んだSVGデータがあれば再処理
        if (window.lastLoadedSVG) {
            createSVGModel(window.lastLoadedSVG);
        }
    }
}

// SVGの処理
function processSVG() {
    const file = svgUpload.files[0];
    if (!file) {
        // テスト用：ファイルが選択されていない場合は、テスト用のSVGを直接読み込む
        console.log('テスト用SVGを読み込みます');
        fetch('test-shape.svg')
            .then(response => response.text())
            .then(svgData => {
                createSVGModel(svgData);
            })
            .catch(error => {
                console.error('SVGの読み込みに失敗しました:', error);
                alert('SVGファイルを選択してください');
            });
        return;
        return;
    }
    
    // ローディングアニメーションを表示
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'svg-loading-container';
    loadingContainer.style.position = 'absolute';
    loadingContainer.style.top = '50%';
    loadingContainer.style.left = '50%';
    loadingContainer.style.transform = 'translate(-50%, -50%)';
    loadingContainer.style.textAlign = 'center';
    loadingContainer.style.zIndex = '1000';
    loadingContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    loadingContainer.style.padding = '25px';
    loadingContainer.style.borderRadius = '12px';
    loadingContainer.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
    loadingContainer.style.width = '300px';
    loadingContainer.style.border = '1px solid rgba(25, 118, 210, 0.2)';
    
    // ローディングメッセージ
    const loadingMessage = document.createElement('div');
    loadingMessage.style.color = '#1976D2';
    loadingMessage.style.fontSize = '20px';
    loadingMessage.style.fontWeight = 'bold';
    loadingMessage.style.marginBottom = '15px';
    loadingMessage.textContent = 'SVGファイルを処理中...';
    
    // ローディングスピナー
    const spinner = document.createElement('div');
    spinner.style.border = '6px solid #f3f3f3';
    spinner.style.borderTop = '6px solid #1976D2';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.margin = '0 auto';
    spinner.style.animation = 'spin 1s linear infinite';
    
    // 進捗メッセージ
    const progressMessage = document.createElement('div');
    progressMessage.style.color = '#666';
    progressMessage.style.fontSize = '14px';
    progressMessage.style.marginTop = '15px';
    progressMessage.style.fontStyle = 'italic';
    progressMessage.textContent = '少々お待ちください...';
    
    // 要素を追加
    loadingContainer.appendChild(loadingMessage);
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(progressMessage);
    document.body.appendChild(loadingContainer);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const svgData = e.target.result;
        // SVGデータを保存して後で再利用できるようにする
        window.lastLoadedSVG = svgData;
        createSVGModel(svgData);
        
        // ローディングコンテナを削除
        const loadingContainer = document.getElementById('svg-loading-container');
        if (loadingContainer) {
            document.body.removeChild(loadingContainer);
        }
    };
    reader.readAsText(file);
    
    currentMode = 'svg';
}

// SVGデータから3Dモデルを作成
function createSVGModel(svgData) {
    // 既存のテキストメッシュをクリア
    textGroup.clear();
    
    // SVGデータをパース
    const svgPaths = svgLoader.parse(svgData);
    
    // マテリアルの作成
    const material = createMaterial();
    
    // SVGのパスを処理
    const paths = svgPaths.paths;
    
    // 全てのパスの境界ボックスを計算するための変数
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    // 各パスの境界を計算
    paths.forEach(path => {
        path.subPaths.forEach(subPath => {
            const points = subPath.getPoints();
            points.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });
        });
    });
    
    // SVGの中心と大きさを計算
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const svgWidth = maxX - minX;
    const svgHeight = maxY - minY;
    
    // スケール係数を計算（大きすぎるSVGを適切なサイズに調整）
    const maxDimension = Math.max(svgWidth, svgHeight);
    const scaleFactor = params.size * 2 / maxDimension;
    
    // 各パスを処理
    paths.forEach(path => {
        const shapes = path.toShapes(true);
        
        shapes.forEach(shape => {
            // 押し出し設定
            const extrudeSettings = {
                steps: 1,
                depth: params.depth,
                bevelEnabled: params.bevelEnabled,
                bevelThickness: params.bevelThickness,
                bevelSize: params.bevelSize,
                bevelSegments: 3,
                curveSegments: params.curveSegments
            };
            
            // ジオメトリを作成
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            
            // ジオメトリをスケーリングして中心に配置
            geometry.scale(scaleFactor, -scaleFactor, scaleFactor); // Y軸は反転
            geometry.translate(-centerX * scaleFactor, -centerY * -scaleFactor, 0);
            
            // 変形が有効な場合、ジオメトリを変形
            if (params.transformEnabled) {
                applyTransformToGeometry(geometry);
            }
            
            // メッシュの作成
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 2;
            
            // グループに追加
            textGroup.add(mesh);
        });
    });
    
    // 初期化完了
    isInitialized = true;
}

// ジオメトリの更新（テキストモード専用）
function updateGeometry() {
    // パラメーターの更新関数を呼び出す
    updateParameters();
    params.bevelEnabled = bevelEnabledCheckbox.checked;
    params.bevelThickness = parseFloat(bevelThicknessSlider.value);
    params.bevelSize = parseFloat(bevelSizeSlider.value);
    params.curveSegments = parseInt(curveSegmentsSlider.value);
    params.letterSpacing = parseFloat(letterSpacingSlider.value);
    
    createText();
}

// マテリアルの更新
function updateMaterial() {
    // パラメーターの更新関数を呼び出す
    updateParameters();
}

// マテリアルコントロールの表示/非表示
function toggleMaterialControls() {
    const materialControls = document.querySelectorAll('.material-control');
    const display = params.materialType === 'normal' ? 'flex' : 'none';
    
    materialControls.forEach(control => {
        control.style.display = display;
    });
}

// 値表示の更新（単一要素）
function updateValueDisplay(e) {
    const slider = e.target;
    const valueDisplay = slider.nextElementSibling;
    valueDisplay.textContent = slider.value;
}

// すべての値表示の更新
function updateAllValueDisplays() {
    fontSizeSlider.nextElementSibling.textContent = fontSizeSlider.value;
    depthSlider.nextElementSibling.textContent = depthSlider.value;
    bevelThicknessSlider.nextElementSibling.textContent = bevelThicknessSlider.value;
    bevelSizeSlider.nextElementSibling.textContent = bevelSizeSlider.value;
    curveSegmentsSlider.nextElementSibling.textContent = curveSegmentsSlider.value;
    letterSpacingSlider.nextElementSibling.textContent = letterSpacingSlider.value;
    roughnessSlider.nextElementSibling.textContent = roughnessSlider.value;
    metalnessSlider.nextElementSibling.textContent = metalnessSlider.value;
    opacitySlider.nextElementSibling.textContent = opacitySlider.value;
    textureScaleSlider.nextElementSibling.textContent = textureScaleSlider.value;
    
    // 文字変形の設定
    horizontalScaleSlider.nextElementSibling.textContent = horizontalScaleSlider.value;
    verticalScaleSlider.nextElementSibling.textContent = verticalScaleSlider.value;
    frontTaperSlider.nextElementSibling.textContent = frontTaperSlider.value;
    backTaperSlider.nextElementSibling.textContent = backTaperSlider.value;
    
    // 環境光の設定
    ambientLightIntensitySlider.nextElementSibling.textContent = ambientLightIntensitySlider.value;
    
    // メイン光源の設定
    mainLightIntensitySlider.nextElementSibling.textContent = mainLightIntensitySlider.value;
    mainLightXSlider.nextElementSibling.textContent = mainLightXSlider.value;
    mainLightYSlider.nextElementSibling.textContent = mainLightYSlider.value;
    mainLightZSlider.nextElementSibling.textContent = mainLightZSlider.value;
    
    // サブ光源の設定
    subLightIntensitySlider.nextElementSibling.textContent = subLightIntensitySlider.value;
    subLightXSlider.nextElementSibling.textContent = subLightXSlider.value;
    subLightYSlider.nextElementSibling.textContent = subLightYSlider.value;
    subLightZSlider.nextElementSibling.textContent = subLightZSlider.value;
}

// ベベルコントロールの表示/非表示
function toggleBevelControls() {
    const bevelControls = document.querySelectorAll('.bevel-control');
    const display = bevelEnabledCheckbox.checked ? 'flex' : 'none';
    
    bevelControls.forEach(control => {
        control.style.display = display;
    });
}

// テクスチャコントロールの表示/非表示
function toggleTextureControls() {
    // パラメーターの更新関数を呼び出す
    updateParameters();
}

// 文字変形コントロールの表示/非表示
function toggleTransformControls() {
    // チェックボックスの状態を取得
    params.transformEnabled = transformEnabledCheckbox.checked;
    
    // 文字変形コントロールの表示/非表示を切り替え
    const transformControls = document.querySelectorAll('.transform-control');
    const display = params.transformEnabled ? 'flex' : 'none';
    
    transformControls.forEach(control => {
        control.style.display = display;
    });
    
    // 変形が有効な場合、変形パラメーターを更新
    if (params.transformEnabled) {
        updateTransform();
    } else {
        // 変形を無効にした場合、デフォルト値に戻す
        params.horizontalScale = 1.0;
        params.verticalScale = 1.0;
        params.frontTaper = 0.0;
        params.backTaper = 0.0;
        
        // スライダーの値を更新
        horizontalScaleSlider.value = 1.0;
        verticalScaleSlider.value = 1.0;
        frontTaperSlider.value = 0.0;
        backTaperSlider.value = 0.0;
        
        // 値表示を更新
        horizontalScaleSlider.nextElementSibling.textContent = 1.0;
        verticalScaleSlider.nextElementSibling.textContent = 1.0;
        frontTaperSlider.nextElementSibling.textContent = 0.0;
        backTaperSlider.nextElementSibling.textContent = 0.0;
        
        createText();
    }
}

// 変形パラメーターの更新（テキストモード専用）
function updateTransform() {
    // パラメーターの更新関数を呼び出す
    updateParameters();
}

// STLエクスポート
function exportSTL() {
    if (!isInitialized || (currentMode === 'text' && params.fontType !== 'japanese' && !textMesh)) return;
    
    const exporter = new THREE.STLExporter();
    const result = exporter.parse(textGroup);
    
    saveString(result, `${getExportFilename()}.stl`);
}

// OBJエクスポート
function exportOBJ() {
    if (!isInitialized || (currentMode === 'text' && params.fontType !== 'japanese' && !textMesh)) return;
    
    const exporter = new THREE.OBJExporter();
    const result = exporter.parse(textGroup);
    
    saveString(result, `${getExportFilename()}.obj`);
}

// 透過PNGエクスポート
function exportPNG() {
    if (!isInitialized || (currentMode === 'text' && params.fontType !== 'japanese' && !textMesh)) return;
    
    // 解像度倍率を取得
    const resolutionScale = parseInt(pngResolutionSelect.value);
    
    // 現在のレンダラーのサイズとピクセル比を保存
    const originalWidth = renderer.domElement.width;
    const originalHeight = renderer.domElement.height;
    const originalPixelRatio = renderer.getPixelRatio();
    
    // 現在の背景色を保存
    const currentBackground = scene.background;
    
    // レンダラーのサイズを一時的に変更
    renderer.setSize(getViewWidth() * resolutionScale, getViewHeight() * resolutionScale);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // 背景を透明に設定
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    
    // カメラのアスペクト比を更新
    camera.aspect = getViewWidth() / getViewHeight();
    camera.updateProjectionMatrix();
    
    // 高解像度でレンダリング
    renderer.render(scene, camera);
    
    // 画像データを取得
    const imgData = renderer.domElement.toDataURL('image/png');
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `${getExportFilename()}_${resolutionScale}x.png`;
    link.click();
    
    // レンダラーのサイズを元に戻す
    renderer.setSize(originalWidth, originalHeight);
    renderer.setPixelRatio(originalPixelRatio);
    
    // 背景を元に戻す
    scene.background = currentBackground;
    renderer.setClearColor(0xeeeeee, 1);
    
    // 再レンダリング
    renderer.render(scene, camera);
}

// 文字列をファイルとして保存
function saveString(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
}

// ファイル名を取得（エクスポート用）
function getExportFilename() {
    if (currentMode === 'text') {
        return params.text;
    } else {
        const file = svgUpload.files[0];
        if (file) {
            // 拡張子を除いたファイル名を取得
            return file.name.replace(/\.[^/.]+$/, "");
        }
        return 'model';
    }
}

// ウィンドウリサイズ対応
function onWindowResize() {
    camera.aspect = getAspectRatio();
    camera.updateProjectionMatrix();
    renderer.setSize(getViewWidth(), getViewHeight());
}

// ビュー幅の取得
function getViewWidth() {
    const viewContainer = document.getElementById('three-d-view');
    return viewContainer.clientWidth || window.innerWidth;
}

// ビュー高さの取得
function getViewHeight() {
    const viewContainer = document.getElementById('three-d-view');
    return viewContainer.clientHeight || 500; // デフォルト高さ
}

// アスペクト比の取得
function getAspectRatio() {
    return getViewWidth() / getViewHeight();
}

// モバイルデバイスの検出
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// グリッドの表示/非表示を切り替える
function toggleGrid() {
    if (gridHelper) {
        gridHelper.visible = gridEnabledCheckbox.checked;
    }
}

// 影コントロールの表示/非表示
function toggleShadowControls() {
    const shadowControls = document.querySelectorAll('.shadow-control');
    const display = shadowsEnabledCheckbox.checked ? 'flex' : 'none';
    
    shadowControls.forEach(control => {
        control.style.display = display;
    });
}

// 光源コントロールの表示/非表示
function toggleLightControls() {
    // 環境光のコントロール
    const ambientLightControls = document.querySelectorAll('.ambient-light-control');
    const ambientDisplay = ambientLightEnabledCheckbox.checked ? 'flex' : 'none';
    
    ambientLightControls.forEach(control => {
        control.style.display = ambientDisplay;
    });
    
    // メイン光源のコントロール
    const mainLightControls = document.querySelectorAll('.main-light-control');
    const mainDisplay = mainLightEnabledCheckbox.checked ? 'flex' : 'none';
    
    mainLightControls.forEach(control => {
        control.style.display = mainDisplay;
    });
    
    // サブ光源のコントロール
    const subLightControls = document.querySelectorAll('.sub-light-control');
    const subDisplay = subLightEnabledCheckbox.checked ? 'flex' : 'none';
    
    subLightControls.forEach(control => {
        control.style.display = subDisplay;
    });
}

// 光源の設定を更新
function updateLights() {
    // 環境光の設定
    params.ambientLightEnabled = ambientLightEnabledCheckbox.checked;
    params.ambientLightIntensity = parseFloat(ambientLightIntensitySlider.value);
    params.ambientLightColor = ambientLightColorPicker.value;
    
    // メイン光源の設定
    params.mainLightEnabled = mainLightEnabledCheckbox.checked;
    params.mainLightIntensity = parseFloat(mainLightIntensitySlider.value);
    params.mainLightColor = mainLightColorPicker.value;
    params.mainLightX = parseInt(mainLightXSlider.value);
    params.mainLightY = parseInt(mainLightYSlider.value);
    params.mainLightZ = parseInt(mainLightZSlider.value);
    
    // サブ光源の設定
    params.subLightEnabled = subLightEnabledCheckbox.checked;
    params.subLightIntensity = parseFloat(subLightIntensitySlider.value);
    params.subLightColor = subLightColorPicker.value;
    params.subLightX = parseInt(subLightXSlider.value);
    params.subLightY = parseInt(subLightYSlider.value);
    params.subLightZ = parseInt(subLightZSlider.value);
    
    // 光源コントロールの表示/非表示を更新
    toggleLightControls();
    
    // シーンから既存の光源を削除
    if (ambientLight) scene.remove(ambientLight);
    if (mainLight) scene.remove(mainLight);
    if (subLight) scene.remove(subLight);
    
    // ライトヘルパーを削除
    lightHelpers.forEach(helper => {
        if (helper) scene.remove(helper);
    });
    lightHelpers = [];
    
    // 光源を再追加
    addLights();
}

// 影と光源の値表示を更新
function updateLightShadowValueDisplays() {
    // 環境光の設定
    ambientLightIntensitySlider.nextElementSibling.textContent = ambientLightIntensitySlider.value;
    
    // メイン光源の設定
    mainLightIntensitySlider.nextElementSibling.textContent = mainLightIntensitySlider.value;
    mainLightXSlider.nextElementSibling.textContent = mainLightXSlider.value;
    mainLightYSlider.nextElementSibling.textContent = mainLightYSlider.value;
    mainLightZSlider.nextElementSibling.textContent = mainLightZSlider.value;
    
    // サブ光源の設定
    subLightIntensitySlider.nextElementSibling.textContent = subLightIntensitySlider.value;
    subLightXSlider.nextElementSibling.textContent = subLightXSlider.value;
    subLightYSlider.nextElementSibling.textContent = subLightYSlider.value;
    subLightZSlider.nextElementSibling.textContent = subLightZSlider.value;
}

// 回転と動画出力の値表示を更新
function updateRotationVideoValueDisplays() {
    // 回転アニメーションの設定
    if (rotationSpeedSlider && rotationSpeedSlider.nextElementSibling) {
        rotationSpeedSlider.nextElementSibling.textContent = rotationSpeedSlider.value;
    }
    
    // 動画出力の設定
    if (videoDurationSlider && videoDurationSlider.nextElementSibling) {
        videoDurationSlider.nextElementSibling.textContent = videoDurationSlider.value;
    }
}

// 回転アニメーションコントロールの表示/非表示
function toggleRotationControls() {
    // チェックボックスの状態を取得
    params.rotationEnabled = rotationEnabledCheckbox.checked;
    
    // 回転アニメーションコントロールは常に表示（CSSで設定済み）
    
    // 動画出力コントロールのみ回転アニメーションの状態に連動させる
    const videoControls = document.querySelectorAll('.video-control');
    const display = params.rotationEnabled ? 'flex' : 'none';
    
    videoControls.forEach(control => {
        control.style.display = display;
    });
    
    // 録画ボタンの表示/非表示
    const videoButtons = document.querySelector('.video-buttons');
    if (videoButtons) {
        videoButtons.style.display = params.rotationEnabled ? 'flex' : 'none';
    }
}

// 回転パラメーターの更新
function updateRotation() {
    params.rotationEnabled = rotationEnabledCheckbox.checked;
    params.rotationAxis = rotationAxisSelect.value;
    params.rotationSpeed = parseFloat(rotationSpeedSlider.value);
    
    // 回転コントロールの表示/非表示を更新
    toggleRotationControls();
    
    // 回転が無効な場合、回転をリセット
    if (!params.rotationEnabled) {
        textGroup.rotation.set(0, 0, 0);
    }
}

// 動画出力コントロールの表示/非表示関数は削除し、回転コントロールに統合

// 動画出力設定の更新
function updateVideoSettings() {
    params.videoQuality = videoQualitySelect.value;
    params.videoFrameRate = parseInt(videoFrameRateSelect.value);
    params.videoDuration = parseInt(videoDurationSlider.value);
}

// CCapture.jsの初期化
function initCCapture() {
    // CCapture.jsのスクリプトを動的に読み込む
    const ccaptureScript = document.createElement('script');
    ccaptureScript.src = 'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/build/CCapture.all.min.js';
    document.head.appendChild(ccaptureScript);
    
    // WebMエンコーダーのスクリプトを動的に読み込む
    const webmScript = document.createElement('script');
    webmScript.src = 'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/src/webm-writer-0.2.0.js';
    document.head.appendChild(webmScript);
}

// 録画開始
function startRecording() {
    if (!isInitialized || isRecording) return;
    
    // 回転が有効でない場合は有効にする
    if (!params.rotationEnabled) {
        params.rotationEnabled = true;
        rotationEnabledCheckbox.checked = true;
        toggleRotationControls();
        
        // 回転が有効になったことをユーザーに通知
        alert('録画のため回転が有効になりました');
    }
    
    // 録画中フラグを設定
    isRecording = true;
    
    // 一周録画モードを有効にし、開始時の回転角度を記録
    fullRotationRecording = true;
    startRotationAngle = rotationAngle;
    
    // 録画品質に基づいて設定を調整
    let quality = 0.7;
    let frameRate = params.videoFrameRate;
    
    switch (params.videoQuality) {
        case 'low':
            quality = 0.5;
            break;
        case 'medium':
            quality = 0.7;
            break;
        case 'high':
            quality = 0.9;
            break;
    }
    
    // CCapturerの初期化
    capturer = new CCapture({
        format: 'webm',
        framerate: frameRate,
        quality: quality,
        verbose: true
    });
    
    // 録画開始
    capturer.start();
    
    // 録画中の表示
    startRecordingBtn.disabled = true;
    startRecordingBtn.textContent = '録画中...';
    stopRecordingBtn.disabled = false;
}
// 録画停止
function stopRecording() {
    if (!isRecording) return;
    
    // 録画停止（回転は継続）
    isRecording = false;
    fullRotationRecording = false; // 一周録画モードをリセット
    capturer.stop();
    
    // 録画完了のアラートを表示
    alert('録画が完了しました。動画ファイルをダウンロードします。');
    
    // 録画データの保存
    capturer.save(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${params.text}_rotation.webm`;
        link.click();
        
        URL.revokeObjectURL(url);
    });
    
    // ボタンの状態を戻す
    startRecordingBtn.disabled = false;
    startRecordingBtn.textContent = '録画開始';
    stopRecordingBtn.disabled = true;
    
    // 回転は継続させる（params.rotationEnabledはそのまま）
}
// ジオメトリに変形を適用する
function applyTransformToGeometry(geometry) {
    // ジオメトリの頂点を取得
    const position = geometry.attributes.position;
    
    // 変形パラメーター
    const horizontalScale = params.horizontalScale;
    const verticalScale = params.verticalScale;
    const frontTaper = params.frontTaper;
    const backTaper = params.backTaper;
    
    // ジオメトリのバウンディングボックスを計算して、モデルの範囲を把握
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    
    // モデルの中心と寸法を計算
    const centerX = (bbox.max.x + bbox.min.x) / 2;
    const centerY = (bbox.max.y + bbox.min.y) / 2;
    const centerZ = (bbox.max.z + bbox.min.z) / 2;
    const sizeZ = bbox.max.z - bbox.min.z;
    
    // 各頂点に変形を適用
    for (let i = 0; i < position.count; i++) {
        // 頂点の座標を取得
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        
        // 基本的なスケーリング
        let newX = x * horizontalScale;
        let newY = y * verticalScale;
        
        // 前方/後方のすぼみ計算のための相対Z位置（0～1の範囲）
        // 前方: z > centerZ、後方: z < centerZ
        const relativeZ = (z - centerZ) / (sizeZ / 2);
        
        // 前方すぼみ（モデルの前方部分）
        if (relativeZ > 0) {
            const taperFactor = frontTaper * relativeZ;
            newX *= (1.0 - taperFactor);
        }
        // 後方すぼみ（モデルの後方部分）
        else if (relativeZ < 0) {
            const taperFactor = backTaper * Math.abs(relativeZ);
            newX *= (1.0 - taperFactor);
        }
        
        // 変形した座標を設定
        position.setX(i, newX);
        position.setY(i, newY);
    }
    
    // ジオメトリを更新
    position.needsUpdate = true;
    
    // 法線を再計算
    geometry.computeVertexNormals();
}
// カスタムテクスチャの処理
function handleCustomTexture(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // カスタムテクスチャを作成
            const image = new Image();
            image.onload = function() {
                textures.custom = new THREE.Texture(image);
                textures.custom.needsUpdate = true;
                textures.custom.wrapS = THREE.RepeatWrapping;
                textures.custom.wrapT = THREE.RepeatWrapping;
                textures.custom.repeat.set(params.textureScale, params.textureScale);
                
                // カスタムテクスチャを設定
                params.customTexture = textures.custom;
                
                // 現在のモードに応じて適切な処理を呼び出す
                if (currentMode === 'text') {
                    createText();
                } else if (currentMode === 'svg') {
                    if (window.lastLoadedSVG) {
                        createSVGModel(window.lastLoadedSVG);
                    }
                }
            };
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}
