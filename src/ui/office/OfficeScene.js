import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { EffectComposer } from 'https://unpkg.com/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.128.0/examples/jsm/postprocessing/UnrealBloomPass.js';

export class OfficeScene {
    constructor(container) {
        this.container = container;
        this.isLite = window.__PERF && window.__PERF.lite === true;
        
        this.clock = new THREE.Clock();
        this.staffMeshList = [];
        this.monitorsList = [];

        this.initEngine();
        this.initEnvironmentMap();
        this.initLighting();
        this.initRoom();
        this.initFurniture();
        this.initStaff();
        
        if (!this.isLite) {
            this.initPostProcessing();
        }

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    initEngine() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a24);
        this.scene.fog = new THREE.FogExp2(0x1a1a24, 0.015);

        // Camera (Isometric View)
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const d = 12;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: !this.isLite, powerPreference: "high-performance" });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isLite ? 1.5 : 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        if (!this.isLite) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else {
            this.renderer.shadowMap.enabled = false;
        }

        this.container.appendChild(this.renderer.domElement);
    }

    initEnvironmentMap() {
        // Membuat Environment Map procedural dari Canvas untuk pantulan PBR yang kaya
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#4a90e2'); // Langit virtual
        gradient.addColorStop(0.5, '#2c3e50'); // Horizon
        gradient.addColorStop(1, '#111119'); // Lantai virtual
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);

        this.envTexture = new THREE.CanvasTexture(canvas);
        this.envTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = this.envTexture;
    }

    initLighting() {
        // Ambient Light untuk penerangan dasar ruangan
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Matahari / Directional Light utama
        const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
        dirLight.position.set(15, 25, 15);
        
        if (!this.isLite) {
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 1024;
            dirLight.shadow.mapSize.height = 1024;
            dirLight.shadow.camera.near = 0.5;
            dirLight.shadow.camera.far = 50;
            const d = 15;
            dirLight.shadow.camera.left = -d;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = -d;
            dirLight.shadow.bias = -0.0005;
        }
        this.scene.add(dirLight);

        // Lampu isi (Fill light) dari arah berlawanan
        const fillLight = new THREE.DirectionalLight(0x7090ff, 0.4);
        fillLight.position.set(-15, 15, -15);
        this.scene.add(fillLight);
    }

    createProceduralFloorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Background ubin / kayu modern
        ctx.fillStyle = '#2d3238';
        ctx.fillRect(0, 0, 256, 256);
        
        // Pola ubin grid
        ctx.strokeStyle = '#1e2227';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 256, 256);
        ctx.strokeRect(0, 0, 128, 128);
        ctx.strokeRect(128, 0, 128, 128);
        ctx.strokeRect(0, 128, 128, 128);
        ctx.strokeRect(128, 128, 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        return texture;
    }

    initRoom() {
        // Lantai PBR dengan tekstur procedural
        const floorGeo = new THREE.PlaneGeometry(16, 16);
        const floorMat = new THREE.MeshStandardMaterial({
            map: this.createProceduralFloorTexture(),
            roughness: 0.2,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = !this.isLite;
        this.scene.add(floor);

        // Dinding Ruangan (Dua sisi)
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            roughness: 0.8,
            metalness: 0.1
        });

        // Dinding Belakang Kiri
        const wall1 = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 0.3), wallMat);
        wall1.position.set(0, 2.5, -8);
        wall1.receiveShadow = !this.isLite;
        this.scene.add(wall1);

        // Dinding Belakang Kanan
        const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5, 16), wallMat);
        wall2.position.set(-8, 2.5, 0);
        wall2.receiveShip = !this.isLite;
        this.scene.add(wall2);

        // Ambient Occlusion / Trik sudut pertemuan dinding & lantai
        const aoMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        const ao1 = new THREE.Mesh(new THREE.PlaneGeometry(16, 0.5), aoMat);
        ao1.position.set(0, 0.25, -7.85);
        this.scene.add(ao1);
    }

    initFurniture() {
        // Membuat Meja Kerja & Komputer dengan Emissive Material
        this.createDesk(-3, 0, -3);
        this.createDesk(3, 0, -3);
        this.createDesk(-3, 0, 3);
        this.createDesk(3, 0, 3);

        // Tanaman Rimbun (Multi-Sphere Geometry)
        this.createDetailedPlant(6, 0, 6);
        this.createDetailedPlant(-6, 0, 6);
    }

    createDesk(x, y, z) {
        const deskGroup = new THREE.Group();

        // Material Kayu PBR untuk Meja
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x8e44ad,
            roughness: 0.4,
            metalness: 0.1
        });

        // Material Logam untuk Kaki Meja
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x95a5a6,
            roughness: 0.2,
            metalness: 0.9
        });

        // Papan Meja
        const topGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
        const topMesh = new THREE.Mesh(topGeo, woodMat);
        topMesh.position.set(0, 1.0, 0);
        topMesh.castShadow = !this.isLite;
        topMesh.receiveShadow = !this.isLite;
        deskGroup.add(topMesh);

        // Kaki Meja
        const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0);
        const leg1 = new THREE.Mesh(legGeo, metalMat);
        leg1.position.set(-1.1, 0.5, -0.5);
        leg1.castShadow = !this.isLite;
        deskGroup.add(leg1);

        const leg2 = leg1.clone();
        leg2.position.set(1.1, 0.5, -0.5);
        deskGroup.add(leg2);

        const leg3 = leg1.clone();
        leg3.position.set(-1.1, 0.5, 0.5);
        deskGroup.add(leg3);

        const leg4 = leg1.clone();
        leg4.position.set(1.1, 0.5, 0.5);
        deskGroup.add(leg4);

        // Monitor Komputer dengan Layar Emissive (Menyala)
        const monitorGroup = new THREE.Group();
        
        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: new THREE.Color(0x00d2ff),
            emissiveIntensity: this.isLite ? 0.8 : 1.5,
            roughness: 0.1
        });
        
        const screenGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.5, 0);
        monitorGroup.add(screen);

        const standGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(0, 1.2, 0);
        monitorGroup.add(stand);

        deskGroup.add(monitorGroup);
        this.monitorsList.push(screenMat); // Untuk animasi kedip/pendaran opsional

        deskGroup.position.set(x, y, z);
        this.scene.add(deskGroup);
    }

    createDetailedPlant(x, y, z) {
        const plantGroup = new THREE.Group();

        // Pot
        const potMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.6 });
        const potGeo = new THREE.CylinderGeometry(0.4, 0.25, 0.6, 8);
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.set(0, 0.3, 0);
        pot.castShadow = !this.isLite;
        plantGroup.add(pot);

        // Daun Rimbun (Kombinasi banyak SphereGeometry untuk detail AAA)
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.5 });
        const leafGeo = new THREE.SphereGeometry(0.3, 7, 7);

        const offsets = [
            [0, 0.7, 0],
            [0.2, 0.8, 0.1],
            [-0.2, 0.75, -0.1],
            [0.1, 0.9, -0.2],
            [-0.15, 0.85, 0.15]
        ];

        offsets.forEach(pos => {
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(...pos);
            leaf.castShadow = !this.isLite;
            plantGroup.add(leaf);
        });

        plantGroup.position.set(x, y, z);
        this.scene.add(plantGroup);
    }

    initStaff() {
        // Karakter Staf dengan Idle Animasi Napas
        this.createStaffMember(-3, 0, -1.5);
        this.createStaffMember(3, 0, -1.5);
    }

    createStaffMember(x, y, z) {
        const staffGroup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.5 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, roughness: 0.6 });

        // Badan
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.6, 0);
        body.castShadow = !this.isLite;
        staffGroup.add(body);

        // Kepala
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 1.2, 0);
        head.castShadow = !this.isLite;
        staffGroup.add(head);

        staffGroup.position.set(x, y, z);
        this.scene.add(staffGroup);
        
        // Simpan referensi untuk animasi napas
        this.staffMeshList.push({ group: staffGroup, body: body, baseScaleY: 1 });
    }

    initPostProcessing() {
        // Effect Composer & Unreal Bloom (Hanya untuk HP Kuat)
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            0.4,  // Strength
            0.4,  // Radius
            0.85  // Threshold
        );
        this.composer.addPass(bloomPass);
    }

    update() {
        const elapsedTime = this.clock.getElapsedTime();

        // Animasi Idle Staf (Efek napas naik-turun halus)
        this.staffMeshList.forEach((staff, index) => {
            const breath = Math.sin(elapsedTime * 3 + index) * 0.03;
            staff.body.scale.y = staff.baseScaleY + breath;
        });
    }

    render() {
        this.update();
        if (this.composer && !this.isLite) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;
        const d = 12;

        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }
}
