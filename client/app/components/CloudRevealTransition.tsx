"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface CloudRevealProps {
  isActive: boolean;
  onCovered?: () => void;
  onComplete?: () => void;
}

export default function CloudRevealTransition({
  isActive,
  onCovered,
  onComplete,
}: CloudRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store callbacks in stable refs to avoid resetting the animation loop on parent state updates
  const onCoveredRef = useRef(onCovered);
  onCoveredRef.current = onCovered;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const coveredFiredRef = useRef(false);
  const completeFiredRef = useRef(false);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const container = containerRef.current;

    coveredFiredRef.current = false;
    completeFiredRef.current = false;

    // 1. Scene, Orthographic Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      1,
      1000
    );
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    // 2. High-Fidelity Soft Cloud Puff Texture (Silky Smooth Radial Falloff)
    const createCloudTexture = () => {
      const texSize = 512;
      const canvas = document.createElement("canvas");
      canvas.width = texSize;
      canvas.height = texSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Texture();

      ctx.clearRect(0, 0, texSize, texSize);

      const drawPuff = (cx: number, cy: number, r: number, a: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255, 255, 255, ${a})`);
        g.addColorStop(0.35, `rgba(255, 254, 252, ${a * 0.95})`);
        g.addColorStop(0.7, `rgba(250, 250, 252, ${a * 0.45})`);
        g.addColorStop(1, "rgba(250, 250, 252, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      const c = texSize / 2;
      // Core volume
      drawPuff(c, c, 220, 1.0);

      // Surrounding organic cloud lobes for billowy contours
      const lobes = 10;
      for (let i = 0; i < lobes; i++) {
        const ang = (i / lobes) * Math.PI * 2;
        const dist = 80 + Math.random() * 50;
        drawPuff(c + Math.cos(ang) * dist, c + Math.sin(ang) * dist, 110 + Math.random() * 40, 0.9);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    const cloudTex = createCloudTexture();
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    // 3. Bilateral Cloud Curtain Groups (Dense Overlapping Formations)
    const leftGroup = new THREE.Group();
    const rightGroup = new THREE.Group();
    scene.add(leftGroup);
    scene.add(rightGroup);

    const puffGeo = new THREE.PlaneGeometry(width * 0.65, width * 0.65);

    // Left Curtain Puffs: Stacked along the vertical profile, extending rightwards
    const PUFFS_COUNT = 24;
    for (let i = 0; i < PUFFS_COUNT; i++) {
      const meshL = new THREE.Mesh(puffGeo, cloudMat);
      const normalizedY = (i / (PUFFS_COUNT - 1) - 0.5);
      const lY = normalizedY * height * 1.35 + (Math.random() * 40 - 20);
      const lX = -width * 0.25 + (Math.random() * 0.45 * width) - (i % 2 === 0 ? 0 : width * 0.15);
      const scaleL = 1.0 + Math.random() * 0.55;

      meshL.position.set(lX, lY, i * 0.2);
      meshL.scale.set(scaleL, scaleL, 1);
      leftGroup.add(meshL);

      // Right Curtain Puffs: Mirrored density
      const meshR = new THREE.Mesh(puffGeo, cloudMat);
      const rY = normalizedY * height * 1.35 + (Math.random() * 40 - 20);
      const rX = width * 0.25 - (Math.random() * 0.45 * width) + (i % 2 === 0 ? 0 : width * 0.15);
      const scaleR = 1.0 + Math.random() * 0.55;

      meshR.position.set(rX, rY, i * 0.2);
      meshR.scale.set(scaleR, scaleR, 1);
      rightGroup.add(meshR);
    }

    // Set initial offscreen positions
    const offscreenDistance = width * 0.95;
    leftGroup.position.x = -offscreenDistance;
    rightGroup.position.x = offscreenDistance;

    // 4. Silky-Smooth Continuous Motion Timeline
    // Phase 1 (0.0s -> 1.05s): Left & right formations sweep in and overlap in center
    // Phase 2 (1.05s -> 1.35s): Seamless 100% full-screen cover hold (triggers onCovered)
    // Phase 3 (1.35s -> 2.85s): Smooth parting reveal to the sides (smooth deceleration)
    const DURATION = 2.85;
    const startTime = performance.now();
    let animationFrameId: number;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 3.8);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / DURATION, 1.0);

      if (progress < 0.37) {
        // Stage 1: Closing in smoothly (0.0s -> 1.05s)
        const t = progress / 0.37;
        const ease = easeInOutCubic(t);

        leftGroup.position.x = THREE.MathUtils.lerp(-offscreenDistance, 0, ease);
        rightGroup.position.x = THREE.MathUtils.lerp(offscreenDistance, 0, ease);

        cloudMat.opacity = Math.min(1.0, 0.4 + ease * 0.6);
      } else if (progress >= 0.37 && progress < 0.47) {
        // Stage 2: Full Cover Hold (1.05s -> 1.35s)
        leftGroup.position.x = 0;
        rightGroup.position.x = 0;
        cloudMat.opacity = 1.0;

        if (!coveredFiredRef.current) {
          coveredFiredRef.current = true;
          onCoveredRef.current?.();
        }
      } else {
        // Stage 3: Smooth Parting Reveal (1.35s -> 2.85s)
        const t = (progress - 0.47) / 0.53;
        const ease = easeOutQuint(t);

        // Smooth physical gliding apart toward outer edges
        leftGroup.position.x = THREE.MathUtils.lerp(0, -offscreenDistance * 1.15, ease);
        rightGroup.position.x = THREE.MathUtils.lerp(0, offscreenDistance * 1.15, ease);

        // Maintain full opacity through most of the travel, fading gently only at the very end
        if (t > 0.65) {
          const fadeProgress = (t - 0.65) / 0.35;
          cloudMat.opacity = Math.max(0, 1 - fadeProgress);
        } else {
          cloudMat.opacity = 1.0;
        }
      }

      renderer.render(scene, camera);

      if (progress >= 1.0 && !completeFiredRef.current) {
        completeFiredRef.current = true;
        onCompleteRef.current?.();
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);

      cloudTex.dispose();
      cloudMat.dispose();
      puffGeo.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-auto fixed inset-0 z-50 overflow-hidden select-none"
    />
  );
}
