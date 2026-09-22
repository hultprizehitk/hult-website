"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface BirdInstance {
  mesh: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  body: THREE.Mesh;

  // Dynamics & Position
  pos: THREE.Vector3;
  velocity: THREE.Vector3;

  baseSpeed: number;
  currentSpeed: number;

  // Curve trajectory params
  curvePhase: number;
  curveSpeed: number;
  curveAmpX: number;
  curveAmpY: number;

  // Wing dynamics
  flapSpeed: number;
  flapPhase: number;
  glideTimer: number;
  glideDuration: number;
  isGliding: boolean;

  // Flocking
  flockId: number;

  // Respawn state
  isActive: boolean;
  respawnDelay: number;
  depthLayer: number; // 0: Far, 1: Mid, 2: Near
}

export default function ThreeBirds() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 85);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "default",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    // Mouse Parallax tracking with smooth lerp
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouse.targetX = (e.clientX / innerWidth - 0.5) * 4.5;
      mouse.targetY = -(e.clientY / innerHeight - 0.5) * 2.5;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Shared Lightweight Geometries
    // Left Wing (hinged at origin)
    const leftWingShape = new THREE.Shape();
    leftWingShape.moveTo(0, 0);
    leftWingShape.lineTo(-1.7, 0.35);
    leftWingShape.lineTo(-1.3, -0.55);
    leftWingShape.lineTo(0, -0.28);
    leftWingShape.closePath();
    const leftWingGeo = new THREE.ShapeGeometry(leftWingShape);

    // Right Wing (mirrored, hinged at origin)
    const rightWingShape = new THREE.Shape();
    rightWingShape.moveTo(0, 0);
    rightWingShape.lineTo(1.7, 0.35);
    rightWingShape.lineTo(1.3, -0.55);
    rightWingShape.lineTo(0, -0.28);
    rightWingShape.closePath();
    const rightWingGeo = new THREE.ShapeGeometry(rightWingShape);

    // Slender Body Silhouette
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(0, 0.75);
    bodyShape.lineTo(0.16, 0);
    bodyShape.lineTo(0.07, -0.85);
    bodyShape.lineTo(-0.07, -0.85);
    bodyShape.lineTo(-0.16, 0);
    bodyShape.closePath();
    const bodyGeo = new THREE.ShapeGeometry(bodyShape);

    // Layer Materials (3 depths)
    const materials = [
      // Far Layer Material (Low opacity, misty distant sky-charcoal)
      new THREE.MeshBasicMaterial({
        color: 0x182c48,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      // Mid Layer Material (Medium opacity)
      new THREE.MeshBasicMaterial({
        color: 0x122238,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      // Near Layer Material (Crisp dark silhouette)
      new THREE.MeshBasicMaterial({
        color: 0x0a1424,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ];

    // Spawn parameters (24 lightweight bird instances for low GPU footprint)
    const TOTAL_BIRDS = 24;
    const birds: BirdInstance[] = [];

    // Flock group configurations (upper sky elevation headings)
    const FLOCK_COUNT = 6;
    const flockHeadings: {
      direction: number; // 1 = Left->Right, -1 = Right->Left
      baseY: number;
      baseZ: number;
      baseSpeed: number;
      layer: number;
    }[] = [];

    for (let f = 0; f < FLOCK_COUNT; f++) {
      const direction = f % 2 === 0 ? 1 : -1; // alternate flight directions
      const layer = f < 3 ? 0 : f < 5 ? 1 : 2;

      let baseZ = -35 + Math.random() * 10;
      let baseSpeed = 0.13 + Math.random() * 0.04;
      if (layer === 1) {
        baseZ = -15 + Math.random() * 10;
        baseSpeed = 0.19 + Math.random() * 0.05;
      } else if (layer === 2) {
        baseZ = 6 + Math.random() * 8;
        baseSpeed = 0.26 + Math.random() * 0.06;
      }

      // Upper sky altitude: Y concentrated high in the sky (Y = 14 to 28)
      const baseY = 14 + Math.random() * 12;

      flockHeadings.push({
        direction,
        baseY,
        baseZ,
        baseSpeed,
        layer,
      });
    }

    // Helper to spawn/respawn a bird in the upper sky
    const configureBird = (bird: BirdInstance, isInitial = false) => {
      const flock = flockHeadings[bird.flockId % FLOCK_COUNT];
      bird.depthLayer = flock.layer;

      const layer = bird.depthLayer;
      let scale = 0.26;
      let speed = flock.baseSpeed * (0.85 + Math.random() * 0.3);

      if (layer === 0) {
        scale = 0.24 + Math.random() * 0.08;
      } else if (layer === 1) {
        scale = 0.48 + Math.random() * 0.12;
      } else {
        scale = 0.80 + Math.random() * 0.18;
      }

      bird.mesh.scale.set(scale, scale, scale);

      // Material based on layer
      const mat = materials[layer];
      bird.leftWing.material = mat;
      bird.rightWing.material = mat;
      bird.body.material = mat;

      // Spawn bounds
      const spawnSide = flock.direction; // 1 = enters from left, -1 = enters from right
      const startX = isInitial
        ? (Math.random() * 140 - 70) // distribute initially across whole upper sky
        : spawnSide > 0
        ? -78 - Math.random() * 20
        : 78 + Math.random() * 20;

      // 75% in High Upper Sky (Y = 15 to 29), 20% in Mid Sky (Y = 7 to 15), 5% in Lower Sky (Y = 3 to 7)
      const r = Math.random();
      let startY = 18;
      if (r < 0.75) {
        startY = 15 + Math.random() * 14; // High upper sky
      } else if (r < 0.95) {
        startY = 7 + Math.random() * 8; // Mid sky around text
      } else {
        startY = 3 + Math.random() * 4; // Lower sky well above building
      }

      const startZ = flock.baseZ + (Math.random() * 8 - 4);

      bird.pos.set(startX, startY, startZ);
      bird.mesh.position.copy(bird.pos);

      // Trajectory velocity (horizontal + slight diagonal)
      const vx = spawnSide * speed;
      const vy = (Math.random() * 0.04 - 0.02) * speed;
      bird.velocity.set(vx, vy, 0);
      bird.baseSpeed = speed;
      bird.currentSpeed = speed;

      bird.curvePhase = Math.random() * Math.PI * 2;
      bird.curveSpeed = 0.25 + Math.random() * 0.35;
      bird.curveAmpX = Math.random() * 1.5;
      bird.curveAmpY = 0.6 + Math.random() * 1.4;

      bird.flapSpeed = 6.8 + Math.random() * 4.2;
      bird.flapPhase = Math.random() * Math.PI * 2;
      bird.glideTimer = 0;
      bird.glideDuration = 1.2 + Math.random() * 1.8;
      bird.isGliding = false;

      bird.isActive = true;
      bird.respawnDelay = 0;
    };

    // Instantiate all birds
    for (let i = 0; i < TOTAL_BIRDS; i++) {
      const group = new THREE.Group();
      const flockId = i % FLOCK_COUNT;

      const mat = materials[0];
      const leftWing = new THREE.Mesh(leftWingGeo, mat);
      const rightWing = new THREE.Mesh(rightWingGeo, mat);
      const body = new THREE.Mesh(bodyGeo, mat);

      body.rotation.x = Math.PI / 2;
      leftWing.rotation.x = Math.PI / 2;
      rightWing.rotation.x = Math.PI / 2;

      group.add(body);
      group.add(leftWing);
      group.add(rightWing);

      scene.add(group);

      const bird: BirdInstance = {
        mesh: group,
        leftWing,
        rightWing,
        body,
        pos: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        baseSpeed: 0.18,
        currentSpeed: 0.18,
        curvePhase: 0,
        curveSpeed: 0.5,
        curveAmpX: 1,
        curveAmpY: 1,
        flapSpeed: 8,
        flapPhase: 0,
        glideTimer: 0,
        glideDuration: 1.5,
        isGliding: false,
        flockId,
        isActive: true,
        respawnDelay: 0,
        depthLayer: 0,
      };

      configureBird(bird, true);
      birds.push(bird);
    }

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Modern High-Precision Timestamp Animation Loop (Zero Three.Clock deprecation)
    let animationFrameId: number;
    let lastTime = performance.now();
    let startTime = performance.now();
    let isVisible = true;

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) {
        lastTime = now;
        return;
      }

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // Smooth Camera Parallax Lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      camera.position.x = mouse.x;
      camera.position.y = mouse.y;
      camera.lookAt(0, 0, 0);

      // Animate each bird
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];

        if (!b.isActive) {
          b.respawnDelay -= delta;
          if (b.respawnDelay <= 0) {
            configureBird(b, false);
          }
          continue;
        }

        // Horizontal movement
        const timeScale = 60 * delta;
        b.pos.x += b.velocity.x * timeScale;

        // Gentle undulating altitude with sine/cosine curves strictly constrained to upper sky
        const t = elapsed * b.curveSpeed + b.curvePhase;
        const waveY = Math.sin(t) * b.curveAmpY * 0.025;
        b.pos.y += (b.velocity.y + waveY) * timeScale;

        // Ensure birds stay strictly in upper sky and never dip over the building
        if (b.pos.y < 2.0) {
          b.pos.y = 2.0;
        }

        b.mesh.position.copy(b.pos);

        // Dynamic 3D orientation & banking
        b.mesh.rotation.y = b.velocity.x >= 0 ? Math.PI / 2 : -Math.PI / 2;
        const bank = Math.sin(t) * 0.22 * (b.velocity.x >= 0 ? 1 : -1);
        b.mesh.rotation.z = bank;
        b.mesh.rotation.x = (b.velocity.y + waveY) * 1.4;

        // Wing Flap vs Gliding state
        b.glideTimer += delta;
        if (!b.isGliding && b.glideTimer > 3.2 + (i % 5)) {
          b.isGliding = true;
          b.glideTimer = 0;
        } else if (b.isGliding && b.glideTimer > b.glideDuration) {
          b.isGliding = false;
          b.glideTimer = 0;
        }

        let wingAngle = 0;
        if (b.isGliding) {
          // Slight dihedral wing angle during gliding
          wingAngle = 0.12 + Math.sin(elapsed * 2.5 + b.flapPhase) * 0.035;
        } else {
          // Organic sine flapping
          wingAngle = Math.sin(elapsed * b.flapSpeed + b.flapPhase) * 0.56;
        }

        b.leftWing.rotation.z = wingAngle;
        b.rightWing.rotation.z = -wingAngle;

        // Check screen boundaries (bounds X = ±82)
        const isOutOfBounds =
          (b.velocity.x > 0 && b.pos.x > 82) ||
          (b.velocity.x < 0 && b.pos.x < -82);

        if (isOutOfBounds) {
          b.isActive = false;
          b.respawnDelay = 0.5 + Math.random() * 2.5; // Natural staggered pause before re-entering
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      birds.forEach((b) => {
        b.leftWing.geometry.dispose();
        b.rightWing.geometry.dispose();
        b.body.geometry.dispose();
      });

      materials.forEach((m) => m.dispose());
      leftWingGeo.dispose();
      rightWingGeo.dispose();
      bodyGeo.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-6 overflow-hidden select-none"
    />
  );
}
