"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ClothWindOverlayProps {
  mouseOffset?: { x: number; y: number };
  isRevealed?: boolean;
}

export default function ClothWindOverlay({
  mouseOffset = { x: 0, y: 0 },
  isRevealed = false,
}: ClothWindOverlayProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const smoothMouseRef = useRef({ x: 0, y: 0 });
  const mouseTargetRef = useRef(mouseOffset);
  mouseTargetRef.current = mouseOffset;

  const isRevealedRef = useRef(isRevealed);
  isRevealedRef.current = isRevealed;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Coordinate space calibrated to background photo: 3344 x 1882
    const WORLD_W = 3344;
    const WORLD_H = 1882;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -WORLD_W / 2,
      WORLD_W / 2,
      WORLD_H / 2,
      -WORLD_H / 2,
      0.1,
      2000
    );
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "default",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // =========================================================================
    // VERTICAL HULT PRIZE BANNERS (LEFT & RIGHT)
    // =========================================================================
    const textureLoader = new THREE.TextureLoader();
    const bannerTexture = textureLoader.load("/hult-banner-vertical.png", (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
    });

    const bannerUniformsLeft = {
      uTime: { value: 0 },
      uTexture: { value: bannerTexture },
      uWindStrength: { value: 1.0 },
      uMouseOffset: { value: new THREE.Vector2(0, 0) },
      uSide: { value: -1.0 },
      uUnfurlProgress: { value: isRevealedRef.current ? 1.0 : 0.0 },
    };

    const bannerUniformsRight = {
      uTime: { value: 0 },
      uTexture: { value: bannerTexture },
      uWindStrength: { value: 1.0 },
      uMouseOffset: { value: new THREE.Vector2(0, 0) },
      uSide: { value: 1.0 },
      uUnfurlProgress: { value: isRevealedRef.current ? 1.0 : 0.0 },
    };

    const bannerVertexShader = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform vec2 uMouseOffset;
      uniform float uSide;
      uniform float uUnfurlProgress;
      varying vec2 vUv;
      varying float vFoldLighting;
      varying float vAlpha;
      varying float vRollGleam;

      #define PI 3.14159265359

      void main() {
        vUv = uv;
        vec3 pos = position;

        // --- 3D Cylindrical Scroll Unroll Physics ---
        float vertexY = 1.0 - uv.y; // 0.0 at top anchor -> 1.0 at bottom chevron
        float rollPos = clamp(uUnfurlProgress, 0.0, 1.0);
        float dist = vertexY - rollPos;

        // Scroll radius diminishes from thick tube to thin film as cloth unrolls
        float rollRadius = 18.0 * max(0.15, (1.0 - rollPos * 0.8));
        float curlZone = 0.075;

        vRollGleam = 0.0;

        if (dist > 0.0) {
          vAlpha = 0.0;
          vFoldLighting = 0.0;
        } else if (dist > -curlZone) {
          // Active 3D scroll roll: cylinder arc deformation
          float curlAngle = (-dist / curlZone) * PI;
          pos.z += sin(curlAngle) * rollRadius;
          pos.y += (1.0 - cos(curlAngle)) * (rollRadius * 0.45);

          vRollGleam = pow(max(0.0, sin(curlAngle)), 2.5) * 0.35;
          vFoldLighting = sin(curlAngle) * 0.25 - 0.05;
          vAlpha = smoothstep(0.0, 0.01, -dist);
        } else {
          vAlpha = 1.0;
          vFoldLighting = 0.0;
        }

        // Hanging freedom: taut at top anchor, gentle sway in the middle,
        // then tightens again near the bottom (weighted bottom bar/chevron)
        float rawHang = clamp(vertexY, 0.0, 1.0);
        float bottomTighten = 1.0 - smoothstep(0.78, 1.0, rawHang); // bottom stays taut/flat
        float hangingFactor = pow(rawHang, 1.3) * bottomTighten * smoothstep(0.08, 0.85, uUnfurlProgress);

        // Top anchor clamping: first 8% of cloth is rigid (pinned to building)
        float topRigid = smoothstep(0.0, 0.08, rawHang);
        hangingFactor *= topRigid;

        // Gentle natural wind (not too dramatic)
        float speed = uTime * 2.5;
        float wave1 = sin(vertexY * 6.5 - speed + uv.x * 1.5) * 6.0 * hangingFactor;
        float wave2 = cos(vertexY * 13.0 - speed * 1.2 + uv.x * 2.0) * 2.5 * hangingFactor;
        float wave3 = sin(vertexY * 3.0 - speed * 0.5) * 3.0 * hangingFactor * uSide;
        
        float mouseSway = uMouseOffset.x * 4.0 * hangingFactor;

        pos.z += (wave1 + wave2) * uWindStrength;
        pos.x += (wave3 + mouseSway) * uWindStrength;

        // Subtle fabric fold lighting
        float slope = cos(vertexY * 6.5 - speed) * 6.5 * 6.0 * hangingFactor;
        vFoldLighting += clamp(slope * 0.003, -0.07, 0.07);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const bannerFragmentShader = `
      uniform sampler2D uTexture;
      varying vec2 vUv;
      varying float vFoldLighting;
      varying float vAlpha;
      varying float vRollGleam;

      void main() {
        if (vAlpha <= 0.001) discard;

        vec4 texColor = texture2D(uTexture, vUv);
        if (texColor.a < 0.05) discard;

        // Exact original colors enhanced with 3D scroll sheen and fabric fold shading
        float foldShade = clamp(1.0 + vFoldLighting + vRollGleam, 0.72, 1.45);
        vec3 finalColor = texColor.rgb * foldShade;
        float finalAlpha = texColor.a * vAlpha;

        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `;

    // Banner geometry & proportions (147 x 865) with high-density mesh for silky 3D curves
    const BANNER_W = 147;
    const BANNER_H = 865;
    const bannerGeo = new THREE.PlaneGeometry(BANNER_W, BANNER_H, 36, 110);
    // Shift top edge to pivot point (0, 0)
    bannerGeo.translate(0, -BANNER_H / 2, 0);

    const bannerMatLeft = new THREE.ShaderMaterial({
      vertexShader: bannerVertexShader,
      fragmentShader: bannerFragmentShader,
      uniforms: bannerUniformsLeft,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    const bannerMatRight = new THREE.ShaderMaterial({
      vertexShader: bannerVertexShader,
      fragmentShader: bannerFragmentShader,
      uniforms: bannerUniformsRight,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    // Left Banner Mesh (no visible rod — banner anchors cleanly to building edge)
    const leftBannerMesh = new THREE.Mesh(bannerGeo, bannerMatLeft);
    leftBannerMesh.position.set(-1150, 333, 5);
    leftBannerMesh.rotation.z = -0.026;
    scene.add(leftBannerMesh);

    // Right Banner Mesh
    const rightBannerMesh = new THREE.Mesh(bannerGeo, bannerMatRight);
    rightBannerMesh.position.set(1150, 333, 5);
    rightBannerMesh.rotation.z = 0.017;
    scene.add(rightBannerMesh);

    // =========================================================================
    // ANIMATION LOOP WITH GRAVITATIONAL SPRING SETTLING
    // =========================================================================
    let animationFrameId: number;
    const startTime = performance.now();
    let unfurlStartTime: number | null = null;

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    const animate = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (timestamp - startTime) * 0.001;

      // Smooth mouse interpolation
      smoothMouseRef.current.x += (mouseTargetRef.current.x - smoothMouseRef.current.x) * 0.05;
      smoothMouseRef.current.y += (mouseTargetRef.current.y - smoothMouseRef.current.y) * 0.05;

      // Physics-driven unfurl with gravitational descent & soft elastic settle
      let unfurlProgress = 0.0;
      if (isRevealedRef.current) {
        if (unfurlStartTime === null) {
          unfurlStartTime = timestamp;
        }
        const unfurlElapsed = (timestamp - unfurlStartTime) * 0.001;
        const UNFURL_DURATION = 2.4;
        const t = Math.min(1.0, unfurlElapsed / UNFURL_DURATION);

        if (t < 0.82) {
          // Gravitational roll-down acceleration (smooth cubic ease)
          const p = t / 0.82;
          unfurlProgress = p * p * (3.0 - 2.0 * p);
        } else {
          // Gentle elastic bounce/settle as banner fully extends
          const bounceTime = (t - 0.82) / 0.18;
          const decay = Math.exp(-bounceTime * 4.5);
          const bounce = Math.sin(bounceTime * Math.PI * 2.5) * 0.018 * decay;
          unfurlProgress = 1.0 + bounce;
        }
      } else {
        unfurlStartTime = null;
        unfurlProgress = 0.0;
      }

      bannerUniformsLeft.uTime.value = elapsedTime;
      bannerUniformsLeft.uMouseOffset.value.set(smoothMouseRef.current.x, smoothMouseRef.current.y);
      bannerUniformsLeft.uUnfurlProgress.value = unfurlProgress;

      bannerUniformsRight.uTime.value = elapsedTime;
      bannerUniformsRight.uMouseOffset.value.set(smoothMouseRef.current.x, smoothMouseRef.current.y);
      bannerUniformsRight.uUnfurlProgress.value = unfurlProgress;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      bannerGeo.dispose();
      bannerMatLeft.dispose();
      bannerMatRight.dispose();
      bannerTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-[3]">
      <div
        ref={mountRef}
        className="relative aspect-[3344/1882] min-w-full min-h-full w-auto h-auto shrink-0"
      />
    </div>
  );
}
