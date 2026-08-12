import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      // 1. Scene & Camera
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050514, 0.015);

      const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 5, 35);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x050514, 1);
      container.appendChild(renderer.domElement);

      // Mouse tracking
      const mouse = { x: 0, y: 0 };
      const targetMouse = { x: 0, y: 0 };

      // 2. Futuristic Cyber Wave Grid Floor
      const gridWidth = 120;
      const gridHeight = 120;
      const gridSegments = 60;
      const planeGeo = new THREE.PlaneGeometry(gridWidth, gridHeight, gridSegments, gridSegments);
      planeGeo.rotateX(-Math.PI / 2.2);

      const posAttribute = planeGeo.attributes.position;
      const initialZValues = new Float32Array(posAttribute.count);
      for (let i = 0; i < posAttribute.count; i++) {
        initialZValues[i] = posAttribute.getZ(i);
      }

      const wireframeMat = new THREE.MeshStandardMaterial({
        color: 0x4f46e5,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
        emissive: 0x312e81,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      });

      const gridMesh = new THREE.Mesh(planeGeo, wireframeMat);
      gridMesh.position.y = -15;
      scene.add(gridMesh);

      // 3. Floating Quantum Data Crystals
      const crystalGroup = new THREE.Group();
      scene.add(crystalGroup);

      const crystalColors = [0x6366f1, 0x06b6d4, 0xa855f7, 0x3b82f6, 0x10b981];
      const crystals: THREE.Mesh[] = [];

      // Dodecahedrons & Octahedrons
      for (let i = 0; i < 18; i++) {
        const isOcta = i % 2 === 0;
        const geo = isOcta
          ? new THREE.OctahedronGeometry(Math.random() * 1.6 + 0.8, 0)
          : new THREE.DodecahedronGeometry(Math.random() * 1.4 + 0.6, 0);

        const color = crystalColors[i % crystalColors.length];
        const mat = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.55,
          wireframe: Math.random() > 0.4,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 70,
          (Math.random() - 0.5) * 45 + 5,
          (Math.random() - 0.5) * 40 - 5
        );

        mesh.userData = {
          rotSpeed: {
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.01,
          },
          floatSpeed: Math.random() * 0.8 + 0.4,
          floatOffset: Math.random() * Math.PI * 2,
          baseY: mesh.position.y,
        };

        crystalGroup.add(mesh);
        crystals.push(mesh);
      }

      // Central Floating Torus Knot Nexus Core
      const knotGeo = new THREE.TorusKnotGeometry(4.5, 0.8, 120, 16);
      const knotMat = new THREE.MeshStandardMaterial({
        color: 0x818cf8,
        emissive: 0x4f46e5,
        emissiveIntensity: 0.6,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const knotMesh = new THREE.Mesh(knotGeo, knotMat);
      knotMesh.position.set(0, 4, -20);
      scene.add(knotMesh);

      // 4. Dense Starfield / Particle Cloud
      const particleCount = 450;
      const particleGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);
      const pColors = new Float32Array(particleCount * 3);

      const palette = [
        new THREE.Color(0x6366f1),
        new THREE.Color(0x06b6d4),
        new THREE.Color(0xc084fc),
        new THREE.Color(0x38bdf8),
        new THREE.Color(0x34d399),
      ];

      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 110;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 90;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 10;

        const c = palette[Math.floor(Math.random() * palette.length)];
        pColors[i * 3] = c.r;
        pColors[i * 3 + 1] = c.g;
        pColors[i * 3 + 2] = c.b;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const particleSystem = new THREE.Points(particleGeo, particleMat);
      scene.add(particleSystem);

      // 5. Dynamic Aurora Lights
      const ambientLight = new THREE.AmbientLight(0x2e1065, 0.8);
      scene.add(ambientLight);

      const light1 = new THREE.PointLight(0x6366f1, 3.5, 90);
      light1.position.set(25, 20, 15);
      scene.add(light1);

      const light2 = new THREE.PointLight(0x06b6d4, 3.5, 90);
      light2.position.set(-25, -15, 10);
      scene.add(light2);

      const light3 = new THREE.PointLight(0xa855f7, 3.0, 70);
      light3.position.set(0, 30, -25);
      scene.add(light3);

      // 6. Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse damping
        targetMouse.x += (mouse.x - targetMouse.x) * 0.04;
        targetMouse.y += (mouse.y - targetMouse.y) * 0.04;

        // Camera subtle sway
        camera.position.x = targetMouse.x * 6;
        camera.position.y = 5 + targetMouse.y * 4;
        camera.lookAt(0, 0, -10);

        // Animate Grid Undulation Wave
        const positions = planeGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const u = positions.getX(i);
          const v = positions.getY(i);
          const wave = Math.sin(u * 0.15 + elapsedTime * 1.5) * Math.cos(v * 0.15 + elapsedTime * 1.2) * 1.4;
          positions.setZ(i, initialZValues[i] + wave);
        }
        positions.needsUpdate = true;

        // Rotate & Float Crystals
        for (const crystal of crystals) {
          crystal.rotation.x += crystal.userData.rotSpeed.x;
          crystal.rotation.y += crystal.userData.rotSpeed.y;
          crystal.rotation.z += crystal.userData.rotSpeed.z;

          crystal.position.y =
            crystal.userData.baseY +
            Math.sin(elapsedTime * crystal.userData.floatSpeed + crystal.userData.floatOffset) * 2.2;
        }

        // Rotate Torus Knot Core
        knotMesh.rotation.x = elapsedTime * 0.2;
        knotMesh.rotation.y = elapsedTime * 0.25;

        // Rotate Particle System
        particleSystem.rotation.y = elapsedTime * 0.03 + targetMouse.x * 0.1;
        particleSystem.rotation.x = elapsedTime * 0.015 + targetMouse.y * 0.1;

        // Move Aurora Lights
        light1.position.x = Math.sin(elapsedTime * 0.4) * 30;
        light1.position.z = Math.cos(elapsedTime * 0.5) * 25;

        light2.position.x = Math.cos(elapsedTime * 0.4) * 30;
        light2.position.y = Math.sin(elapsedTime * 0.3) * 20;

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();

      // Handlers
      const handleMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      const handleResize = () => {
        if (!renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (renderer) {
          renderer.dispose();
          if (container && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        }
      };
    } catch (e) {
      console.warn('WebGL initialization failed:', e);
    }
  }, []);

  return <div ref={containerRef} className="three-canvas-container" />;
}
