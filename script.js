// ============================================================
// 箱モジ（hacomoji） メインスクリプト
// ============================================================

// ---- 定数 ----
const DEFAULT_TEXT = '箱モジ';
const MAX_SVG_FILE_SIZE = 5 * 1024 * 1024;      // SVGファイルの上限（5MB）
const MAX_TEXTURE_FILE_SIZE = 10 * 1024 * 1024; // カスタムテクスチャの上限（10MB）
const BACKGROUND_COLOR = 0xeeeeee;

// opentype.jsで読み込むフォント（日本語フォント＋Google Fontsの英字フォント）
const OPENTYPE_FONT_URLS = {
    'noto-sans-jp': 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@4.5.0/files/noto-sans-jp-japanese-400-normal.woff',
    'noto-serif-jp': 'https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-jp@4.5.0/files/noto-serif-jp-japanese-400-normal.woff',
    'mplus-1p': 'https://cdn.jsdelivr.net/npm/@fontsource/m-plus-1p@4.5.0/files/m-plus-1p-japanese-400-normal.woff',
    'mplus-rounded-1c': 'https://cdn.jsdelivr.net/npm/@fontsource/m-plus-rounded-1c@4.5.0/files/m-plus-rounded-1c-japanese-400-normal.woff',
    'kosugi-maru': 'https://cdn.jsdelivr.net/npm/@fontsource/kosugi-maru@4.5.0/files/kosugi-maru-japanese-400-normal.woff',
    'kosugi': 'https://cdn.jsdelivr.net/npm/@fontsource/kosugi@4.5.0/files/kosugi-japanese-400-normal.woff',
    'sawarabi-gothic': 'https://cdn.jsdelivr.net/npm/@fontsource/sawarabi-gothic@4.5.0/files/sawarabi-gothic-japanese-400-normal.woff',
    'sawarabi-mincho': 'https://cdn.jsdelivr.net/npm/@fontsource/sawarabi-mincho@4.5.0/files/sawarabi-mincho-japanese-400-normal.woff',
    'roboto': 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.0/files/roboto-latin-400-normal.woff',
    'open-sans': 'https://cdn.jsdelivr.net/npm/@fontsource/open-sans@4.5.0/files/open-sans-latin-400-normal.woff'
};

// Three.js付属のtypeface.jsonフォント
const TYPEFACE_FONT_URLS = {
    'helvetiker': 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/helvetiker_regular.typeface.json',
    'optimer': 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/optimer_regular.typeface.json',
    'gentilis': 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/gentilis_regular.typeface.json',
    'droid': 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/fonts/droid/droid_sans_regular.typeface.json'
};

// テクスチャの画像ファイル（初回使用時に遅延読み込み）
const TEXTURE_FILES = {
    brick: 'images/brick.jpg',
    wood: 'images/wood.jpg',
    concrete: 'images/floor.jpg',
    fabric: 'images/grass.jpg'
};

// ---- グローバル変数 ----
let scene, camera, renderer, controls;
let textGroup;
let isInitialized = false;
let gridHelper;
let textureLoader;
const textures = {};
let ambientLight, mainLight, subLight;
let capturer;
let isRecording = false;
let rotationAngle = 0;           // 回転角度を追跡する変数
let startRotationAngle = 0;      // 録画開始時の回転角度
let recordingRotationStep = 0;   // 録画中の1フレームあたりの回転量
let svgLoader;
let currentMode = 'text';        // 現在のモード（'text' または 'svg'）
let lastLoadedSVG = null;        // 最後に読み込んだSVGデータ（パラメーター変更時の再生成用）
let renderRequested = true;      // 再描画が必要かどうか（オンデマンド描画用）
let fontRequestId = 0;           // フォント読み込みの競合防止用（古い読み込み結果を無視する）

// パラメーター
const params = {
    text: DEFAULT_TEXT,
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
    transformEnabled: true,
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

// ---- DOM要素 ----
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

// ---- 初期化 ----
window.addEventListener('load', init);

// ページが再表示された時に再描画（モバイルでタブ復帰した際の描画抜け対策）
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestRender();
    }
});

// ---- イベントリスナー ----
generateBtn.addEventListener('click', updateText);
textInput.addEventListener('keydown', (e) => {
    // 日本語入力（IME）の変換確定のEnterでは生成しない
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
        updateText();
    }
});

// タブ切り替え（表示の切り替えのみ。モードは「生成」ボタン押下時に決まる）
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');

        tabBtns.forEach(b => {
            const active = b === btn;
            b.classList.toggle('active', active);
            b.setAttribute('aria-selected', String(active));
        });

        tabContents.forEach(content => {
            content.style.display = content.id === tabId ? 'flex' : 'none';
        });
    });
});

// SVGファイルアップロード
svgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    svgFilename.textContent = file ? file.name : 'ファイルが選択されていません';
});
svgGenerateBtn.addEventListener('click', processSVG);

// 形状パラメーター（ジオメトリの再生成が必要）
[
    fontSizeSlider, depthSlider, bevelThicknessSlider, bevelSizeSlider,
    curveSegmentsSlider, letterSpacingSlider,
    horizontalScaleSlider, verticalScaleSlider, frontTaperSlider, backTaperSlider
].forEach(slider => {
    slider.addEventListener('input', updateValueDisplay);
    slider.addEventListener('change', updateParameters);
});
bevelEnabledCheckbox.addEventListener('change', () => {
    toggleBevelControls();
    updateParameters();
});
transformEnabledCheckbox.addEventListener('change', toggleTransformControls);
fontTypeSelect.addEventListener('change', updateFont);

// マテリアル・テクスチャ（ジオメトリの再生成は不要なのでマテリアルのみ差し替える）
[roughnessSlider, metalnessSlider, opacitySlider, textureScaleSlider].forEach(slider => {
    slider.addEventListener('input', updateValueDisplay);
    slider.addEventListener('input', updateMaterialParameters);
});
colorPicker.addEventListener('input', updateMaterialParameters);
materialTypeSelect.addEventListener('change', () => {
    toggleMaterialControls();
    updateMaterialParameters();
});
textureEnabledCheckbox.addEventListener('change', updateMaterialParameters);
textureSelect.addEventListener('change', updateMaterialParameters);
customTextureInput.addEventListener('change', handleCustomTexture);

// エクスポート
exportSTLBtn.addEventListener('click', exportSTL);
exportOBJBtn.addEventListener('click', exportOBJ);
exportPNGBtn.addEventListener('click', exportPNG);

// グリッドの表示/非表示
gridEnabledCheckbox.addEventListener('change', toggleGrid);

// 光源（スライダーはドラッグ中もリアルタイムに反映）
[
    ambientLightIntensitySlider,
    mainLightIntensitySlider, mainLightXSlider, mainLightYSlider, mainLightZSlider,
    subLightIntensitySlider, subLightXSlider, subLightYSlider, subLightZSlider
].forEach(slider => {
    slider.addEventListener('input', updateValueDisplay);
    slider.addEventListener('input', updateLights);
});
[ambientLightColorPicker, mainLightColorPicker, subLightColorPicker].forEach(picker => {
    picker.addEventListener('input', updateLights);
});
[ambientLightEnabledCheckbox, mainLightEnabledCheckbox, subLightEnabledCheckbox].forEach(checkbox => {
    checkbox.addEventListener('change', updateLights);
});

// 回転アニメーション
rotationEnabledCheckbox.addEventListener('change', updateRotation);
rotationAxisSelect.addEventListener('change', updateRotation);
rotationSpeedSlider.addEventListener('input', updateValueDisplay);
rotationSpeedSlider.addEventListener('change', updateRotation);

// 動画出力
videoQualitySelect.addEventListener('change', updateVideoSettings);
videoFrameRateSelect.addEventListener('change', updateVideoSettings);
videoDurationSlider.addEventListener('input', updateValueDisplay);
videoDurationSlider.addEventListener('change', updateVideoSettings);
startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);

// ============================================================
// 初期化
// ============================================================

function init() {
    // 外部ライブラリの読み込み失敗（通信エラー・SRI不一致など）に備える
    if (typeof THREE === 'undefined' || typeof opentype === 'undefined') {
        showFatalError('3D表示に必要なライブラリを読み込めませんでした。ページを再読み込みしてください。');
        return;
    }

    // Three.jsの初期化（WebGL非対応環境では失敗する）
    try {
        initThreeJS();
    } catch (e) {
        console.error(e);
        showFatalError('お使いのブラウザではWebGLが利用できないため、3D表示ができません。');
        return;
    }

    svgLoader = new THREE.SVGLoader();
    textureLoader = new THREE.TextureLoader();

    // スライダーの現在値を表示
    updateAllValueDisplays();

    // DOMの状態をパラメーターに反映
    readParameters();

    // 各コントロールの初期表示
    toggleBevelControls();
    toggleMaterialControls();
    toggleTextureControls();
    toggleTransformControlsVisibility();
    toggleLightControls();
    toggleRotationControls();

    // 折り畳みセクションの初期化
    initCollapsibleSections();

    // 初期テキストを生成
    createText();
}

// 3Dビューに致命的なエラーを表示する
function showFatalError(message) {
    const viewContainer = document.getElementById('three-d-view');
    if (!viewContainer) return;
    viewContainer.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'fatal-error';
    box.setAttribute('role', 'alert');
    box.textContent = message;
    viewContainer.appendChild(box);
}

// 折り畳みセクションの初期化
function initCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');

    sectionHeaders.forEach(header => {
        const toggle = () => setSectionOpen(header, !header.classList.contains('open'));

        header.addEventListener('click', toggle);
        // キーボード操作（Enter / Space）にも対応
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });

        // 初期状態のaria属性を揃える
        header.setAttribute('aria-expanded', String(header.classList.contains('open')));
    });
}

// セクションの開閉状態を設定する
function setSectionOpen(header, open) {
    const sectionName = header.getAttribute('data-section');
    const content = document.getElementById(`${sectionName}-content`);
    const icon = header.querySelector('.toggle-icon');

    header.classList.toggle('open', open);
    header.setAttribute('aria-expanded', String(open));
    if (icon) icon.textContent = open ? '▼' : '▶';
    if (content) content.style.display = open ? 'block' : 'none';
}

// Three.jsの初期化
function initThreeJS() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND_COLOR);

    // モバイルデバイスかどうかを確認
    const isMobile = isMobileDevice();

    // カメラの作成 - モバイルの場合はFOVを調整
    const fov = isMobile ? 85 : 75;
    camera = new THREE.PerspectiveCamera(fov, getAspectRatio(), 0.1, 1000);
    // 初期視点を斜め上から
    camera.position.set(30, 40, 50);

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({
        antialias: !isMobile, // モバイルではアンチエイリアスを無効化してパフォーマンス向上
        alpha: true,
        powerPreference: 'high-performance'
    });
    // 高DPIディスプレイでの過剰なレンダリング負荷を防ぐため上限を2に制限
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(getViewWidth(), getViewHeight(), false);
    renderer.setClearColor(BACKGROUND_COLOR, 1);
    renderer.shadowMap.enabled = false;

    // レンダラーをDOMに追加（CSSサイズは常にコンテナに追従させる）
    const viewContainer = document.getElementById('three-d-view');
    viewContainer.innerHTML = '';
    viewContainer.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none'; // タッチ操作時のスクロールを防止

    // コントロールの作成（タッチ操作はOrbitControlsが標準で対応：1本指で回転、2本指でズーム・移動）
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = isMobile ? 0.7 : 1.0;
    // ホイールズーム時はOrbitControls内部でupdate()が呼ばれ、描画ループ側のupdate()が
    // 「変化なし」と判定して再描画をスキップしてしまうため、changeイベントで再描画を要求する
    controls.addEventListener('change', requestRender);
    controls.update();

    // 光源の追加
    addLights();

    // グリッドヘルパーの追加（背面に表示するために低いrenderOrderを設定）
    gridHelper = new THREE.GridHelper(100, 10);
    gridHelper.renderOrder = -1;
    gridHelper.visible = gridEnabledCheckbox.checked;
    scene.add(gridHelper);

    // テキストグループをシーンに追加（前面に表示するために高いrenderOrderを設定）
    textGroup = new THREE.Group();
    textGroup.renderOrder = 1;
    scene.add(textGroup);

    // ウィンドウリサイズ対応
    window.addEventListener('resize', onWindowResize);
    if (isMobile) {
        // 画面回転の完了を待ってからリサイズ
        window.addEventListener('orientationchange', () => setTimeout(onWindowResize, 200));
    }

    // アニメーションループの開始
    animate();
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
    scene.add(mainLight);

    // ディレクショナルライト（サブ）
    subLight = new THREE.DirectionalLight(
        new THREE.Color(params.subLightColor),
        params.subLightIntensity
    );
    subLight.position.set(params.subLightX, params.subLightY, params.subLightZ);
    subLight.visible = params.subLightEnabled;
    scene.add(subLight);
}

// ============================================================
// 描画ループ
// ============================================================

// 次のフレームで再描画する
function requestRender() {
    renderRequested = true;
}

// アニメーションループ
// 何も変化がないフレームでは描画をスキップしてCPU/GPU負荷とバッテリー消費を抑える
function animate() {
    requestAnimationFrame(animate);

    // ダンピング中や操作中はtrueが返る
    const cameraMoved = controls.update();
    let needsRender = renderRequested || cameraMoved;

    // 回転アニメーション
    if (params.rotationEnabled) {
        // 録画中は「設定した長さでちょうど1周」するように回転量を固定する
        const step = isRecording ? recordingRotationStep : params.rotationSpeed;
        textGroup.rotation[params.rotationAxis] += step;
        rotationAngle += step;
        needsRender = true;
    }

    if (!needsRender) return;
    renderRequested = false;

    renderer.render(scene, camera);

    // 録画中の場合、フレームをキャプチャ
    if (isRecording && capturer) {
        capturer.capture(renderer.domElement);

        // 1周（2π）分のフレームをキャプチャしたら録画を停止
        if (rotationAngle - startRotationAngle >= Math.PI * 2 - recordingRotationStep / 2) {
            stopRecording();
        }
    }
}

// ============================================================
// フォントの読み込み
// ============================================================

// 読み込み中／読み込み済みのフォント（URL → Promise）。同じフォントの重複ダウンロードを防ぐ
const openTypeFontPromises = {};
const typefaceFontPromises = {};
// 読み込み済みフォント（URL → フォントオブジェクト）。同期的に使えるものはローディング表示を出さない
const loadedOpenTypeFonts = {};
const loadedTypefaceFonts = {};

function isOpenTypeFont(fontType) {
    return Object.prototype.hasOwnProperty.call(OPENTYPE_FONT_URLS, fontType);
}

function isJapaneseFont(fontType) {
    return isOpenTypeFont(fontType) && fontType !== 'roboto' && fontType !== 'open-sans';
}

// opentype.jsでフォントを読み込む（キャッシュ付き）
function loadOpenTypeFont(url) {
    if (!openTypeFontPromises[url]) {
        openTypeFontPromises[url] = new Promise((resolve, reject) => {
            opentype.load(url, (err, font) => {
                if (err || !font) {
                    reject(err || new Error('フォントの読み込みに失敗しました'));
                    return;
                }
                loadedOpenTypeFonts[url] = font;
                resolve(font);
            });
        }).catch(err => {
            // 失敗した場合は次回に再試行できるようキャッシュを消す
            delete openTypeFontPromises[url];
            throw err;
        });
    }
    return openTypeFontPromises[url];
}

// Three.jsのFontLoaderでtypeface.jsonフォントを読み込む（キャッシュ付き）
function loadTypefaceFont(url) {
    if (!typefaceFontPromises[url]) {
        typefaceFontPromises[url] = new Promise((resolve, reject) => {
            new THREE.FontLoader().load(url, font => {
                loadedTypefaceFonts[url] = font;
                resolve(font);
            }, undefined, err => reject(err || new Error('フォントの読み込みに失敗しました')));
        }).catch(err => {
            delete typefaceFontPromises[url];
            throw err;
        });
    }
    return typefaceFontPromises[url];
}

// フォントの更新
function updateFont() {
    params.fontType = fontTypeSelect.value;
    // SVGモデル表示中はフォントを変えてもモデルは変わらない
    if (currentMode === 'text') {
        createText();
    }
}

// ============================================================
// テキストの生成
// ============================================================

// テキストグループを破棄処理付きでクリア（GPUメモリの解放）
function clearTextGroup() {
    const materials = new Set();
    textGroup.traverse(obj => {
        if (obj.isMesh) {
            obj.geometry.dispose();
            // テクスチャ（material.map）はキャッシュして再利用するため破棄しない
            if (obj.material) materials.add(obj.material);
        }
    });
    materials.forEach(material => material.dispose());
    textGroup.clear();
    requestRender();
}

// テキストの作成（フォントが未読み込みなら読み込んでから生成する）
function createText() {
    const requestId = ++fontRequestId;
    const fontType = params.fontType;

    if (isOpenTypeFont(fontType)) {
        const url = OPENTYPE_FONT_URLS[fontType];

        // 読み込み済みなら即時生成
        if (loadedOpenTypeFonts[url]) {
            hideLoading();
            buildOpenTypeText(loadedOpenTypeFonts[url]);
            return;
        }

        showLoading(isJapaneseFont(fontType) ? '日本語フォントを読み込み中...' : 'フォントを読み込み中...');
        loadOpenTypeFont(url).then(font => {
            // 読み込み中に別のフォントが選ばれた場合は何もしない
            if (requestId !== fontRequestId) return;
            hideLoading();
            showToast('フォントの読み込みが完了しました');
            buildOpenTypeText(font);
        }).catch(err => {
            console.error('フォントの読み込みに失敗しました:', err);
            if (requestId !== fontRequestId) return;
            hideLoading();
            showToast('フォントの読み込みに失敗しました。通信環境をご確認ください。', true);
        });
        return;
    }

    // Three.js付属フォント
    const url = TYPEFACE_FONT_URLS[fontType] || TYPEFACE_FONT_URLS.helvetiker;

    if (loadedTypefaceFonts[url]) {
        hideLoading();
        buildTypefaceText(loadedTypefaceFonts[url]);
        return;
    }

    showLoading('フォントを読み込み中...');
    loadTypefaceFont(url).then(font => {
        if (requestId !== fontRequestId) return;
        hideLoading();
        buildTypefaceText(font);
    }).catch(err => {
        console.error('フォントの読み込みに失敗しました:', err);
        if (requestId !== fontRequestId) return;
        hideLoading();
        showToast('フォントの読み込みに失敗しました。通信環境をご確認ください。', true);
    });
}

// 押し出し設定を作成
function createExtrudeSettings() {
    return {
        steps: 1,
        depth: params.depth,
        bevelEnabled: params.bevelEnabled,
        bevelThickness: params.bevelThickness,
        bevelSize: params.bevelSize,
        bevelSegments: 3,
        curveSegments: params.curveSegments
    };
}

// Three.js付属フォント（typeface.json）でテキストを生成
function buildTypefaceText(font) {
    clearTextGroup();

    const text = params.text;
    if (!text) return;

    // テキストジオメトリの作成
    const textGeometry = new THREE.TextGeometry(text, {
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

    const textMesh = new THREE.Mesh(textGeometry, createMaterial());
    textMesh.renderOrder = 2;
    textGroup.add(textMesh);

    isInitialized = true;
    requestRender();
}

// opentype.jsで読み込んだフォントから1文字ずつ3Dモデルを構築する
function buildOpenTypeText(font) {
    clearTextGroup();

    const text = params.text;
    if (!text) return;

    // サロゲートペア（絵文字など）を壊さないようにArray.fromで分割
    const characters = Array.from(text);
    const material = createMaterial();
    const extrudeSettings = createExtrudeSettings();

    // 文字間のスペース
    const spacing = params.size * params.letterSpacing;
    // 横幅の変形は文字送りにも反映する（そうしないと文字同士が重なる）
    const horizontalScale = params.transformEnabled ? params.horizontalScale : 1;

    // 各文字の幅を計算（フォントユニットからサイズ単位に変換）
    const advances = characters.map(char => {
        const glyph = font.charToGlyph(char);
        return glyph.advanceWidth / font.unitsPerEm * params.size * horizontalScale;
    });
    const totalWidth = advances.reduce((sum, w) => sum + w, 0) + spacing * (characters.length - 1);

    // 開始位置（中央揃え）
    let xPos = -totalWidth / 2;

    characters.forEach((char, index) => {
        const glyph = font.charToGlyph(char);
        const path = glyph.getPath(0, 0, params.size);
        const shapes = createShapesFromPath(path);

        shapes.forEach(shape => {
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

            if (params.transformEnabled) {
                applyTransformToGeometry(geometry);
            }

            const charMesh = new THREE.Mesh(geometry, material);
            charMesh.position.x = xPos;
            charMesh.renderOrder = 2;
            textGroup.add(charMesh);
        });

        xPos += advances[index] + spacing;
    });

    isInitialized = true;
    requestRender();
}

// OpenType.jsのパスからThree.jsのシェイプを作成
// OpenTypeはY軸下向きなので、Yを反転してThree.jsのY軸上向きに合わせる
// 輪郭をShapePathにまとめ、SVGLoader.createShapesで外形と穴（「口」の内側など）を判定する
function createShapesFromPath(path) {
    const shapePath = new THREE.ShapePath();

    path.commands.forEach(cmd => {
        switch (cmd.type) {
            case 'M': // 移動
                shapePath.moveTo(cmd.x, -cmd.y);
                break;
            case 'L': // 直線
                shapePath.lineTo(cmd.x, -cmd.y);
                break;
            case 'C': // 3次ベジェ曲線
                shapePath.bezierCurveTo(cmd.x1, -cmd.y1, cmd.x2, -cmd.y2, cmd.x, -cmd.y);
                break;
            case 'Q': // 2次ベジェ曲線
                shapePath.quadraticCurveTo(cmd.x1, -cmd.y1, cmd.x, -cmd.y);
                break;
            case 'Z': // 閉じる
                if (shapePath.currentPath) {
                    shapePath.currentPath.closePath();
                }
                break;
        }
    });

    // フォントの塗りつぶしはnonzeroルールで判定する
    shapePath.userData = { style: { fillRule: 'nonzero' } };

    return THREE.SVGLoader.createShapes(shapePath);
}

// ジオメトリに変形（横幅・縦幅・前方/後方すぼみ）を適用する
function applyTransformToGeometry(geometry) {
    const position = geometry.attributes.position;
    const { horizontalScale, verticalScale, frontTaper, backTaper } = params;

    // 変形が実質的に無い場合は何もしない
    if (horizontalScale === 1 && verticalScale === 1 && frontTaper === 0 && backTaper === 0) {
        return;
    }

    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const centerZ = (bbox.max.z + bbox.min.z) / 2;
    const halfSizeZ = (bbox.max.z - bbox.min.z) / 2;

    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        // 基本的なスケーリング
        let newX = x * horizontalScale;
        const newY = y * verticalScale;

        // 前方/後方のすぼみ（Z方向の相対位置 -1〜1 に応じて横幅を絞る）
        if (halfSizeZ > 0) {
            const relativeZ = (z - centerZ) / halfSizeZ;
            if (relativeZ > 0) {
                newX *= 1.0 - frontTaper * relativeZ;
            } else if (relativeZ < 0) {
                newX *= 1.0 - backTaper * -relativeZ;
            }
        }

        position.setX(i, newX);
        position.setY(i, newY);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
}

// ============================================================
// マテリアル・テクスチャ
// ============================================================

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
            texture.repeat.set(params.textureScale, params.textureScale);
            material.map = texture;
        }
    }

    return material;
}

// 選択されたテクスチャを取得（未読み込みならここで読み込む）
function getSelectedTexture() {
    const type = params.textureType;

    if (type === 'custom') {
        return params.customTexture;
    }

    if (!textures[type] && TEXTURE_FILES[type]) {
        // 読み込み完了時に再描画して反映する
        const texture = textureLoader.load(TEXTURE_FILES[type], requestRender, undefined, () => {
            showToast('テクスチャ画像の読み込みに失敗しました', true);
        });
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        textures[type] = texture;
    }
    return textures[type];
}

// 既存メッシュのマテリアルだけを差し替える（ジオメトリの再生成は行わない）
function applyMaterial() {
    if (textGroup.children.length === 0) return;

    const material = createMaterial();
    const oldMaterials = new Set();

    textGroup.traverse(obj => {
        if (obj.isMesh) {
            if (obj.material) oldMaterials.add(obj.material);
            obj.material = material;
        }
    });
    oldMaterials.forEach(m => m.dispose());

    requestRender();
}

// カスタムテクスチャの処理
function handleCustomTexture(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
    }
    if (file.size > MAX_TEXTURE_FILE_SIZE) {
        alert('画像ファイルが大きすぎます（上限10MB）');
        return;
    }

    const objectUrl = URL.createObjectURL(file);
    textureLoader.load(objectUrl, texture => {
        URL.revokeObjectURL(objectUrl);

        // 前のカスタムテクスチャを破棄
        if (textures.custom) textures.custom.dispose();

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        textures.custom = texture;
        params.customTexture = texture;

        applyMaterial();
    }, undefined, () => {
        URL.revokeObjectURL(objectUrl);
        alert('画像の読み込みに失敗しました');
    });
}

// ============================================================
// パラメーターの更新
// ============================================================

// テキストの更新
function updateText() {
    const value = textInput.value;
    params.text = value.trim() ? value : DEFAULT_TEXT;
    currentMode = 'text';
    createText();
}

// 形状に関するパラメーターをDOMから読み込む
function readParameters() {
    params.size = parseFloat(fontSizeSlider.value);
    params.depth = parseFloat(depthSlider.value);
    params.bevelEnabled = bevelEnabledCheckbox.checked;
    params.bevelThickness = parseFloat(bevelThicknessSlider.value);
    params.bevelSize = parseFloat(bevelSizeSlider.value);
    params.curveSegments = parseInt(curveSegmentsSlider.value, 10);
    params.letterSpacing = parseFloat(letterSpacingSlider.value);
    params.fontType = fontTypeSelect.value;

    params.transformEnabled = transformEnabledCheckbox.checked;
    params.horizontalScale = parseFloat(horizontalScaleSlider.value);
    params.verticalScale = parseFloat(verticalScaleSlider.value);
    params.frontTaper = parseFloat(frontTaperSlider.value);
    params.backTaper = parseFloat(backTaperSlider.value);

    readMaterialParameters();
}

// マテリアル・テクスチャに関するパラメーターをDOMから読み込む
function readMaterialParameters() {
    params.materialType = materialTypeSelect.value;
    params.color = colorPicker.value;
    params.roughness = parseFloat(roughnessSlider.value);
    params.metalness = parseFloat(metalnessSlider.value);
    params.opacity = parseFloat(opacitySlider.value);
    params.textureEnabled = textureEnabledCheckbox.checked;
    params.textureType = textureSelect.value;
    params.textureScale = parseFloat(textureScaleSlider.value);
}

// 形状パラメーターの更新（モデルを再生成する）
function updateParameters() {
    readParameters();
    rebuildModel();
}

// マテリアルパラメーターの更新（マテリアルのみ差し替える）
function updateMaterialParameters() {
    readMaterialParameters();
    toggleTextureControls();
    applyMaterial();
}

// 現在のモードに応じてモデルを再生成する
function rebuildModel() {
    if (currentMode === 'svg' && lastLoadedSVG) {
        createSVGModel(lastLoadedSVG);
    } else {
        createText();
    }
}

// ============================================================
// SVGの処理
// ============================================================

function processSVG() {
    const file = svgUpload.files[0];
    if (!file) {
        alert('SVGファイルを選択してください');
        return;
    }
    if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') {
        alert('SVGファイル（.svg）を選択してください');
        return;
    }
    if (file.size > MAX_SVG_FILE_SIZE) {
        alert('SVGファイルが大きすぎます（上限5MB）');
        return;
    }

    showLoading('SVGファイルを処理中...');

    const reader = new FileReader();
    reader.onload = (e) => {
        const svgData = e.target.result;
        // ローディング表示を描画してから重い処理を始める
        setTimeout(() => {
            try {
                if (createSVGModel(svgData)) {
                    lastLoadedSVG = svgData;
                    currentMode = 'svg';
                }
            } catch (err) {
                console.error('SVGの処理に失敗しました:', err);
                alert('SVGの処理に失敗しました。別のSVGファイルをお試しください。');
            } finally {
                hideLoading();
            }
        }, 0);
    };
    reader.onerror = () => {
        hideLoading();
        alert('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file);
}

// SVGデータから3Dモデルを作成（成功したらtrueを返す）
function createSVGModel(svgData) {
    // SVGデータをパース（DOMParserによる解析のみでスクリプトは実行されない）
    const svgResult = svgLoader.parse(svgData);
    let paths = svgResult.paths;

    // 塗りのないパス（線のみ）は押し出せないので除外。すべて除外される場合はそのまま使う
    const filledPaths = paths.filter(path => {
        const style = path.userData && path.userData.style;
        return !style || style.fill !== 'none';
    });
    if (filledPaths.length > 0) paths = filledPaths;

    // 全てのパスの境界ボックスを計算
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    paths.forEach(path => {
        path.subPaths.forEach(subPath => {
            subPath.getPoints().forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });
        });
    });

    const maxDimension = Math.max(maxX - minX, maxY - minY);
    if (paths.length === 0 || !isFinite(maxDimension) || maxDimension <= 0) {
        alert('SVGから3D化できる図形が見つかりませんでした');
        return false;
    }

    // SVGの中心と大きさからスケール係数を計算（大きすぎるSVGを適切なサイズに調整）
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scaleFactor = params.size * 2 / maxDimension;

    clearTextGroup();

    const material = createMaterial();
    const extrudeSettings = createExtrudeSettings();
    let meshCount = 0;

    paths.forEach(path => {
        // fill-rule（穴の判定）を考慮してシェイプを作成
        const shapes = THREE.SVGLoader.createShapes(path);

        shapes.forEach(shape => {
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

            // スケーリングして中心に配置（SVGはY軸下向きなのでYを反転）
            geometry.scale(scaleFactor, -scaleFactor, scaleFactor);
            geometry.translate(-centerX * scaleFactor, centerY * scaleFactor, 0);

            if (params.transformEnabled) {
                applyTransformToGeometry(geometry);
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 2;
            textGroup.add(mesh);
            meshCount++;
        });
    });

    if (meshCount === 0) {
        alert('SVGから3D化できる図形が見つかりませんでした');
        return false;
    }

    isInitialized = true;
    requestRender();
    return true;
}

// ============================================================
// コントロールの表示/非表示
// ============================================================

// 複数の要素の表示/非表示を切り替える（control-itemはgridレイアウト）
function setControlsVisible(selector, visible) {
    document.querySelectorAll(selector).forEach(control => {
        control.style.display = visible ? 'grid' : 'none';
    });
}

// ベベルコントロールの表示/非表示
function toggleBevelControls() {
    setControlsVisible('.bevel-control', bevelEnabledCheckbox.checked);
}

// マテリアルコントロール（粗さ・反射率は標準マテリアルのみ）の表示/非表示
function toggleMaterialControls() {
    setControlsVisible('.material-control', materialTypeSelect.value === 'normal');
}

// テクスチャコントロールの表示/非表示
function toggleTextureControls() {
    const enabled = textureEnabledCheckbox.checked;
    setControlsVisible('.texture-control', enabled);
    customTextureContainer.style.display =
        (enabled && textureSelect.value === 'custom') ? 'grid' : 'none';
}

// 文字変形コントロールの表示/非表示（表示のみ）
function toggleTransformControlsVisibility() {
    setControlsVisible('.transform-control', transformEnabledCheckbox.checked);
}

// 文字変形の有効/無効の切り替え
function toggleTransformControls() {
    toggleTransformControlsVisibility();

    if (!transformEnabledCheckbox.checked) {
        // 変形を無効にした場合、スライダーをデフォルト値に戻す
        horizontalScaleSlider.value = 1;
        verticalScaleSlider.value = 1;
        frontTaperSlider.value = 0;
        backTaperSlider.value = 0;
        updateAllValueDisplays();
    }

    updateParameters();
}

// 光源コントロールの表示/非表示
function toggleLightControls() {
    setControlsVisible('.ambient-light-control', ambientLightEnabledCheckbox.checked);
    setControlsVisible('.main-light-control', mainLightEnabledCheckbox.checked);
    setControlsVisible('.sub-light-control', subLightEnabledCheckbox.checked);
}

// 回転アニメーションコントロールの表示/非表示（動画出力は回転が有効な時だけ表示）
function toggleRotationControls() {
    const enabled = rotationEnabledCheckbox.checked;

    setControlsVisible('.video-control', enabled);

    const videoButtons = document.querySelector('.video-buttons');
    if (videoButtons) videoButtons.style.display = enabled ? 'flex' : 'none';

    const videoHeading = document.querySelector('#rotation-content h4');
    if (videoHeading) videoHeading.style.display = enabled ? 'block' : 'none';

    const videoInfo = document.querySelector('.video-info');
    if (videoInfo) videoInfo.style.display = enabled ? 'block' : 'none';
}

// 値表示の更新（単一要素）
function updateValueDisplay(e) {
    const slider = e.target;
    const valueDisplay = slider.nextElementSibling;
    if (valueDisplay && valueDisplay.classList.contains('value-display')) {
        valueDisplay.textContent = slider.value;
    }
}

// すべての値表示の更新
function updateAllValueDisplays() {
    document.querySelectorAll('.control-item input[type="range"]').forEach(slider => {
        const valueDisplay = slider.nextElementSibling;
        if (valueDisplay && valueDisplay.classList.contains('value-display')) {
            valueDisplay.textContent = slider.value;
        }
    });
}

// グリッドの表示/非表示を切り替える
function toggleGrid() {
    if (gridHelper) {
        gridHelper.visible = gridEnabledCheckbox.checked;
        requestRender();
    }
}

// ============================================================
// 光源
// ============================================================

// 光源の設定を更新（既存の光源をその場で更新する）
function updateLights() {
    params.ambientLightEnabled = ambientLightEnabledCheckbox.checked;
    params.ambientLightIntensity = parseFloat(ambientLightIntensitySlider.value);
    params.ambientLightColor = ambientLightColorPicker.value;

    params.mainLightEnabled = mainLightEnabledCheckbox.checked;
    params.mainLightIntensity = parseFloat(mainLightIntensitySlider.value);
    params.mainLightColor = mainLightColorPicker.value;
    params.mainLightX = parseInt(mainLightXSlider.value, 10);
    params.mainLightY = parseInt(mainLightYSlider.value, 10);
    params.mainLightZ = parseInt(mainLightZSlider.value, 10);

    params.subLightEnabled = subLightEnabledCheckbox.checked;
    params.subLightIntensity = parseFloat(subLightIntensitySlider.value);
    params.subLightColor = subLightColorPicker.value;
    params.subLightX = parseInt(subLightXSlider.value, 10);
    params.subLightY = parseInt(subLightYSlider.value, 10);
    params.subLightZ = parseInt(subLightZSlider.value, 10);

    toggleLightControls();

    if (!ambientLight) return;

    ambientLight.visible = params.ambientLightEnabled;
    ambientLight.color.set(params.ambientLightColor);
    ambientLight.intensity = params.ambientLightIntensity;

    mainLight.visible = params.mainLightEnabled;
    mainLight.color.set(params.mainLightColor);
    mainLight.intensity = params.mainLightIntensity;
    mainLight.position.set(params.mainLightX, params.mainLightY, params.mainLightZ);

    subLight.visible = params.subLightEnabled;
    subLight.color.set(params.subLightColor);
    subLight.intensity = params.subLightIntensity;
    subLight.position.set(params.subLightX, params.subLightY, params.subLightZ);

    requestRender();
}

// ============================================================
// 回転アニメーション・動画出力
// ============================================================

// 回転パラメーターの更新
function updateRotation() {
    const previousAxis = params.rotationAxis;

    params.rotationEnabled = rotationEnabledCheckbox.checked;
    params.rotationAxis = rotationAxisSelect.value;
    params.rotationSpeed = parseFloat(rotationSpeedSlider.value);

    toggleRotationControls();

    // 回転を無効にした場合、または回転軸を変えた場合は姿勢をリセット
    if (!params.rotationEnabled || previousAxis !== params.rotationAxis) {
        textGroup.rotation.set(0, 0, 0);
        rotationAngle = 0;
        requestRender();
    }

    // 録画中に回転を止めた場合は録画も終了する（永遠に1周しないため）
    if (!params.rotationEnabled && isRecording) {
        stopRecording();
    }
}

// 動画出力設定の更新
function updateVideoSettings() {
    params.videoQuality = videoQualitySelect.value;
    params.videoFrameRate = parseInt(videoFrameRateSelect.value, 10);
    params.videoDuration = parseInt(videoDurationSlider.value, 10);
}

// スクリプトをSRI検証付きで動的に読み込む
function loadScript(src, integrity) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.integrity = integrity;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = () => reject(new Error(`${src} の読み込みに失敗しました`));
        document.head.appendChild(script);
    });
}

// CCapture.jsの読み込み（録画開始時に一度だけ読み込む）
let ccapturePromise = null;
function loadCCapture() {
    if (!ccapturePromise) {
        ccapturePromise = Promise.all([
            loadScript(
                'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/build/CCapture.all.min.js',
                'sha384-pX8+MdJDFHanQqmT/W7sedg6GzbDwjkVpHUHUBAz5ZQu2Zrf+WRsGFkdpCxtGqiO'
            ),
            loadScript(
                'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/src/webm-writer-0.2.0.js',
                'sha384-I31/YKbmYGVlfLlQ3jafOubOgmvdS/vedn8c+qj7M3LL9sVID1/FW0zoZAPGtp02'
            )
        ]).catch(err => {
            ccapturePromise = null;
            throw err;
        });
    }
    return ccapturePromise;
}

// WebM動画の出力に必要なWebPエンコードにブラウザが対応しているか
function supportsWebMRecording() {
    try {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').startsWith('data:image/webp');
    } catch (e) {
        return false;
    }
}

// 録画開始
async function startRecording() {
    if (!isInitialized || isRecording) return;

    if (textGroup.children.length === 0) {
        alert('先にモデルを生成してください');
        return;
    }
    if (!supportsWebMRecording()) {
        alert('お使いのブラウザは動画出力（WebM）に対応していません。Google ChromeまたはMicrosoft Edgeをご利用ください。');
        return;
    }

    startRecordingBtn.disabled = true;
    startRecordingBtn.textContent = '準備中...';

    // 録画ライブラリを読み込む（初回のみダウンロード）
    try {
        await loadCCapture();
    } catch (e) {
        console.error(e);
        startRecordingBtn.disabled = false;
        startRecordingBtn.textContent = '録画開始';
        alert('録画ライブラリの読み込みに失敗しました。通信環境をご確認ください。');
        return;
    }

    updateVideoSettings();

    // 回転が有効でない場合は有効にする
    if (!params.rotationEnabled) {
        params.rotationEnabled = true;
        rotationEnabledCheckbox.checked = true;
        toggleRotationControls();
        showToast('録画のため回転を有効にしました');
    }

    // 「長さ × フレームレート」フレームでちょうど1周するように回転量を決める
    const totalFrames = Math.max(1, Math.round(params.videoFrameRate * params.videoDuration));
    recordingRotationStep = (Math.PI * 2) / totalFrames;
    startRotationAngle = rotationAngle;

    // CCaptureのqualityは0〜100で指定する
    const qualityMap = { low: 50, medium: 75, high: 95 };

    capturer = new CCapture({
        format: 'webm',
        framerate: params.videoFrameRate,
        quality: qualityMap[params.videoQuality] || 75,
        verbose: false
    });
    capturer.start();

    isRecording = true;
    startRecordingBtn.textContent = '録画中...';
    stopRecordingBtn.disabled = false;
}

// 録画停止
function stopRecording() {
    if (!isRecording) return;

    isRecording = false;
    const currentCapturer = capturer;
    capturer = null;

    // 回転は継続させる（params.rotationEnabledはそのまま）
    startRecordingBtn.disabled = false;
    startRecordingBtn.textContent = '録画開始';
    stopRecordingBtn.disabled = true;

    if (!currentCapturer) return;

    currentCapturer.stop();
    showToast('録画が完了しました。動画をダウンロードします。');

    const filename = `${getExportFilename()}_rotation.webm`;
    currentCapturer.save(blob => saveBlob(blob, filename));
}

// ============================================================
// エクスポート
// ============================================================

// 回転アニメーション中でも正面向きの姿勢でエクスポートするためのヘルパー
function withUnrotatedGroup(fn) {
    const savedRotation = textGroup.rotation.clone();
    textGroup.rotation.set(0, 0, 0);
    textGroup.updateMatrixWorld(true);
    try {
        return fn();
    } finally {
        textGroup.rotation.copy(savedRotation);
        textGroup.updateMatrixWorld(true);
    }
}

// STLエクスポート（バイナリ形式：ASCIIより大幅に小さい）
function exportSTL() {
    if (!isInitialized || textGroup.children.length === 0) return;

    const result = withUnrotatedGroup(() => new THREE.STLExporter().parse(textGroup, { binary: true }));
    saveBlob(new Blob([result], { type: 'application/octet-stream' }), `${getExportFilename()}.stl`);
}

// OBJエクスポート
function exportOBJ() {
    if (!isInitialized || textGroup.children.length === 0) return;

    const result = withUnrotatedGroup(() => new THREE.OBJExporter().parse(textGroup));
    saveBlob(new Blob([result], { type: 'text/plain' }), `${getExportFilename()}.obj`);
}

// 透過PNGエクスポート
function exportPNG() {
    if (!isInitialized || textGroup.children.length === 0) return;

    const resolutionScale = parseInt(pngResolutionSelect.value, 10) || 1;
    const width = getViewWidth();
    const height = getViewHeight();

    // 現在の設定を保存
    const originalPixelRatio = renderer.getPixelRatio();
    const currentBackground = scene.background;

    // 出力サイズ = 表示サイズ × 倍率（デバイスのピクセル比に依存させない）
    renderer.setPixelRatio(1);
    renderer.setSize(width * resolutionScale, height * resolutionScale, false);

    // 背景を透明にしてレンダリング
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);

    const filename = `${getExportFilename()}_${resolutionScale}x.png`;
    const canvas = renderer.domElement;

    const restore = () => {
        scene.background = currentBackground;
        renderer.setClearColor(BACKGROUND_COLOR, 1);
        renderer.setPixelRatio(originalPixelRatio);
        renderer.setSize(width, height, false);
        requestRender();
    };

    if (canvas.toBlob) {
        // 描画バッファは次の描画で消えるため、同期的にBlobを取得する
        canvas.toBlob(blob => {
            if (blob) {
                saveBlob(blob, filename);
            } else {
                alert('PNGの生成に失敗しました。解像度を下げてお試しください。');
            }
        }, 'image/png');
    } else {
        saveDataUrl(canvas.toDataURL('image/png'), filename);
    }

    restore();
}

// Blobをファイルとして保存
function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    saveDataUrl(url, filename);
    // ダウンロード開始前にURLが無効になるのを防ぐため少し待ってから解放する
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// URLをファイルとして保存
function saveDataUrl(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// ファイル名を取得（エクスポート用。ファイル名に使えない文字は置換する）
function getExportFilename() {
    let name;
    if (currentMode === 'text') {
        name = params.text;
    } else {
        const file = svgUpload.files[0];
        name = file ? file.name.replace(/\.[^/.]+$/, '') : 'model';
    }

    name = name
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
        .trim()
        .slice(0, 50);

    return name || 'hacomoji';
}

// ============================================================
// ビューのサイズ・デバイス判定
// ============================================================

// ウィンドウリサイズ対応
function onWindowResize() {
    if (!renderer) return;
    camera.aspect = getAspectRatio();
    camera.updateProjectionMatrix();
    renderer.setSize(getViewWidth(), getViewHeight(), false);
    requestRender();
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

// モバイルデバイスの検出（UA判定は一度だけ実行してキャッシュ）
const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
function isMobileDevice() {
    return isMobileUA || window.innerWidth < 768;
}

// ============================================================
// ローディング表示・通知
// ============================================================

// ローディング表示（画面中央に固定表示）
function showLoading(message) {
    hideLoading();

    const container = document.createElement('div');
    container.id = 'loading-overlay';
    container.className = 'loading-overlay';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');

    const messageEl = document.createElement('div');
    messageEl.className = 'loading-message';
    messageEl.textContent = message;

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const subMessage = document.createElement('div');
    subMessage.className = 'loading-sub';
    subMessage.textContent = '少々お待ちください...';

    container.append(messageEl, spinner, subMessage);
    document.body.appendChild(container);
}

// ローディング表示を消す
function hideLoading() {
    const container = document.getElementById('loading-overlay');
    if (container) container.remove();
}

// 一時的な通知メッセージを表示する
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = isError ? 'toast toast-error' : 'toast';
    toast.setAttribute('role', isError ? 'alert' : 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), isError ? 4000 : 2500);
}
