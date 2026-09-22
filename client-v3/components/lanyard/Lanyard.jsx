'use client';
import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// Public asset paths for Next.js
const cardGLB = '/assets/lanyard/card.glb';
const lanyard = '/assets/lanyard/lanyard.png';

useGLTF.preload(cardGLB);
useTexture.preload(lanyard);

import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export default function Lanyard({
  position = [0, 0, 19],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1.5,
  cardScale = 3.85,
  anchorX = undefined
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeAnchorX = anchorX !== undefined ? anchorX : (isMobile ? 0 : -2.75);

  return (
    <div className="lanyard-wrapper relative z-0 w-full h-full min-h-[500px] flex justify-center items-center scale-100 origin-center">
      <Canvas
        camera={{ position: position, fov: fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[0, 10, 10]} intensity={2.5} />
        <directionalLight position={[-10, 5, 5]} intensity={1.5} />
        <directionalLight position={[10, 5, 5]} intensity={1.5} />
        <pointLight position={[0, 0, 8]} intensity={2} />
        <Suspense fallback={null}>
          <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            <Band
              isMobile={isMobile}
              frontImage={frontImage}
              backImage={backImage}
              imageFit={imageFit}
              lanyardImage={lanyardImage}
              lanyardWidth={lanyardWidth}
              cardScale={cardScale}
              anchorX={activeAnchorX}
            />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1.5,
  cardScale = 3.85,
  anchorX = 0
}) {
  const scaleMult = cardScale / 2.25;
  const bandLeft = useRef(),
    bandRight = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();
  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardImage || lanyard);
  // useTexture must be called unconditionally; use a blank pixel when an image
  // isn't supplied for a given face, then skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // Composite the front/back images into the card's texture atlas (front = left
  // half, back = right half). Each image is drawn aspect-preserving (no stretch).
  const cardMap = useMemo(() => {
    const baseMap = materials?.base?.map;
    if (!baseMap || !baseMap.image) return baseMap;

    const baseImg = baseMap.image;
    const W = baseImg.width || 1024;
    const H = baseImg.height || 1024;
    if (!W || !H) return baseMap;

    if (!frontImage && !backImage) return baseMap;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return baseMap;

      ctx.drawImage(baseImg, 0, 0, W, H);

      const drawFitted = (img, rect) => {
        if (!img || !img.width || !img.height || img.width <= 0 || img.height <= 0) return;
        const rx = rect.x * W;
        const ry = rect.y * H;
        const rw = rect.w * W;
        const rh = rect.h * H;
        const pick = imageFit === 'contain' ? Math.min : Math.max;
        const scale = pick(rw / img.width, rh / img.height);
        if (!isFinite(scale) || scale <= 0) return;
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = rx + (rw - dw) / 2;
        const dy = ry + (rh - dh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      };

      if (frontImage && frontTex?.image && frontTex.image.width > 0) {
        drawFitted(frontTex.image, FRONT_UV_RECT);
      }
      if (backImage && backTex?.image && backTex.image.width > 0) {
        drawFitted(backTex.image, BACK_UV_RECT);
      }

      const composite = new THREE.CanvasTexture(canvas);
      composite.colorSpace = THREE.SRGBColorSpace;
      if (baseMap.flipY !== undefined) composite.flipY = baseMap.flipY;
      composite.anisotropy = 8;
      composite.needsUpdate = true;
      return composite;
    } catch (err) {
      console.warn('Could not composite card texture, using base:', err);
      return baseMap;
    }
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials?.base?.map]);

  const [curveLeft] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [curveRight] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  curveLeft.curveType = 'chordal';
  curveRight.curveType = 'chordal';

  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const handleMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  useEffect(() => {
    const handleGlobalPointerDown = (e) => {
      const dom = document.querySelector('.lanyard-wrapper canvas');
      if (!dom) return;
      if (e.target === dom && !hovered && !dragged) {
        dom.style.pointerEvents = 'none';
        const target = document.elementFromPoint(e.clientX, e.clientY);
        dom.style.pointerEvents = 'auto';
        if (target) {
          const clickable = target.closest('a, button, [role="button"]');
          if (clickable) clickable.click();
        }
      }
    };
    window.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => window.removeEventListener('pointerdown', handleGlobalPointerDown);
  }, [hovered, dragged]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 0.82]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.82]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.82]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5 * scaleMult, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    try {
      if (card.current && state.gl?.domElement) {
        if (dragged) {
          if (state.gl.domElement.style.pointerEvents !== 'auto') {
            state.gl.domElement.style.pointerEvents = 'auto';
          }
        } else {
          const cardTranslation = card.current.translation();
          vec.set(cardTranslation.x, cardTranslation.y - 0.3, cardTranslation.z).project(state.camera);
          const rect = state.gl.domElement.getBoundingClientRect();
          const cardPxX = rect.left + ((vec.x + 1) / 2) * rect.width;
          const cardPxY = rect.top + ((-vec.y + 1) / 2) * rect.height;

          const dx = Math.abs(mouseRef.current.x - cardPxX);
          const dy = Math.abs(mouseRef.current.y - cardPxY);
          const isNear = dx < 220 * (cardScale / 3) && dy < 280 * (cardScale / 3);

          const desired = isNear ? 'auto' : 'none';
          if (state.gl.domElement.style.pointerEvents !== desired) {
            state.gl.domElement.style.pointerEvents = desired;
          }
        }
      }

      if (dragged && card.current) {
        vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
        dir.copy(vec).sub(state.camera.position).normalize();
        vec.add(dir.multiplyScalar(state.camera.position.length()));
        [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp?.());
        card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
      }
      if (fixed.current && card.current && j1.current && j2.current && j3.current) {
        const safeDelta = Math.min(delta, 1 / 30);
        [j1, j2].forEach(ref => {
          if (ref.current) {
            if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
            const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
            const lerpFactor = Math.min(1, Math.max(0, safeDelta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))));
            ref.current.lerped.lerp(ref.current.translation(), lerpFactor);
          }
        });

        const fixedPos = fixed.current.translation();
        const j3Pos = j3.current.translation();
        const j1Pos = j1.current.lerped || j1.current.translation();
        const j2Pos = j2.current.lerped || j2.current.translation();

        // Left diagonal lanyard strap
        curveLeft.points[0].copy(j3Pos);
        curveLeft.points[1].set(j2Pos.x - 0.25, j2Pos.y, j2Pos.z);
        curveLeft.points[2].set(j1Pos.x - 0.55, j1Pos.y + 0.15, j1Pos.z);
        curveLeft.points[3].set(fixedPos.x - 0.95, fixedPos.y + 0.95, fixedPos.z);

        // Right diagonal lanyard strap
        curveRight.points[0].copy(j3Pos);
        curveRight.points[1].set(j2Pos.x + 0.25, j2Pos.y, j2Pos.z);
        curveRight.points[2].set(j1Pos.x + 0.55, j1Pos.y + 0.15, j1Pos.z);
        curveRight.points[3].set(fixedPos.x + 0.95, fixedPos.y + 0.95, fixedPos.z);

        if (bandLeft.current?.geometry) {
          bandLeft.current.geometry.setPoints(curveLeft.getPoints(isMobile ? 16 : 32));
        }
        if (bandLeft.current?.material) {
          bandLeft.current.material.resolution.set(state.size.width, state.size.height);
        }
        if (bandRight.current?.geometry) {
          bandRight.current.geometry.setPoints(curveRight.getPoints(isMobile ? 16 : 32));
        }
        if (bandRight.current?.material) {
          bandRight.current.material.resolution.set(state.size.width, state.size.height);
        }

        ang.copy(card.current.angvel());
        rot.copy(card.current.rotation());
        card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
      }
    } catch {
      // guard against any physics step timing edge cases
    }
  });

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[anchorX, 4.15, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.41, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.82, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.23, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.64, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8 * scaleMult, 1.125 * scaleMult, 0.01]} />
          <group
            scale={cardScale}
            position={[0, -1.2 * scaleMult, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={8}
                clearcoat={isMobile ? 0 : 0.6}
                clearcoatRoughness={0.15}
                roughness={0.35}
                metalness={0.05}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      {/* Left Diagonal Strap */}
      <mesh ref={bandLeft}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-1, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>

      {/* Right Diagonal Strap */}
      <mesh ref={bandRight}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-1, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}
