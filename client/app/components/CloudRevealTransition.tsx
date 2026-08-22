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

    // 1. Scene, Camera, Renderer
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(width, height);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    // 2. Soft Fluffy Cloud Texture
    const createCloudTexture = () => {
      const texSize = 256;
      const canvas = document.createElement("canvas");
      canvas.width = texSize;
      canvas.height = texSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Texture();

      ctx.clearRect(0, 0, texSize, texSize);

      const drawPuff = (cx: number, cy: number, r: number, a: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255, 255, 255, ${a})`);
        g.addColorStop(0.4, `rgba(255, 254, 252, ${a * 0.92})`);
        g.addColorStop(0.75, `rgba(250, 250, 254, ${a * 0.4})`);
        g.addColorStop(1, "rgba(250, 250, 254, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      const c = texSize / 2;
      drawPuff(c, c, 110, 1.0);

      const lobes = 8;
      for (let i = 0; i < lobes; i++) {
        const ang = (i / lobes) * Math.PI * 2;
        const dist = 40 + (i % 2) * 20;
        drawPuff(c + Math.cos(ang) * dist, c + Math.sin(ang) * dist, 60, 0.85);
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
    });

    // 3. Bilateral Cloud Curtain Groups
    const leftGroup = new THREE.Group();
    const rightGroup = new THREE.Group();
    scene.add(leftGroup);
    scene.add(rightGroup);

    const puffGeo = new THREE.PlaneGeometry(width * 0.75, width * 0.75);

    const PUFFS_COUNT = 18;
    for (let i = 0; i < PUFFS_COUNT; i++) {
      const normalizedY = i / (PUFFS_COUNT - 1) - 0.5;
      const pY = normalizedY * height * 1.35;

      // Left curtain
      const meshL = new THREE.Mesh(puffGeo, cloudMat);
      const lX = -width * 0.15 + ((i % 3) - 1) * width * 0.12;
      meshL.position.set(lX, pY, i * 0.1);
      meshL.scale.set(1.15, 1.15, 1);
      leftGroup.add(meshL);

      // Right curtain
      const meshR = new THREE.Mesh(puffGeo, cloudMat);
      const rX = width * 0.15 - ((i % 3) - 1) * width * 0.12;
      meshR.position.set(rX, pY, i * 0.1);
      meshR.scale.set(1.15, 1.15, 1);
      rightGroup.add(meshR);
    }

    const offscreenDistance = width * 1.1;
    leftGroup.position.x = -offscreenDistance;
    rightGroup.position.x = offscreenDistance;

    // 4. Continuous Fluid Transition Loop (No Stuck / Freeze Points)
    const DURATION = 2.4; // 2.4s continuous sweep
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / DURATION, 1.0);

      // Smooth continuous closing -> parting trajectory
      if (progress < 0.44) {
        // Stage 1: Fluid Closing Sweep (0.0s -> 1.05s)
        const t = progress / 0.44;
        // Smooth sine ease-in-out
        const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);

        leftGroup.position.x = THREE.MathUtils.lerp(-offscreenDistance, 0, ease);
        rightGroup.position.x = THREE.MathUtils.lerp(offscreenDistance, 0, ease);
        cloudMat.opacity = Math.min(1.0, 0.4 + ease * 0.6);
      } else {
        // Stage 2: Smooth Parting Sweep (1.05s -> 2.4s) without any pause/stuck point
        if (!coveredFiredRef.current) {
          coveredFiredRef.current = true;
          onCoveredRef.current?.();
        }

        const t = (progress - 0.44) / 0.56;
        // Smooth cubic ease-out for elegant parting
        const ease = 1 - Math.pow(1 - t, 2.6);

        leftGroup.position.x = THREE.MathUtils.lerp(0, -offscreenDistance * 1.15, ease);
        rightGroup.position.x = THREE.MathUtils.lerp(0, offscreenDistance * 1.15, ease);

        if (t > 0.45) {
          const fade = (t - 0.45) / 0.55;
          cloudMat.opacity = Math.max(0, 1 - fade);
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
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
    />
  );
}
