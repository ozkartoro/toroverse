/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  AvatarCustomization,
  HairStyleId,
  HeadwearId,
  BackAccessoryId,
  FaceExpressionId,
} from '../types/game';

export interface VoxelCharacterInstance {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  backGroup: THREE.Group;
  triggerAttack: (weaponId: string) => void;
  updateAnimation: (
    isMoving: boolean,
    isJumping: boolean,
    isAction: boolean,
    dt: number,
    animType?: string
  ) => void;
  updateCustomization: (custom: AvatarCustomization) => void;
}

// Procedural Face Texture for 21 expressions
function createFaceTexture(expression: FaceExpressionId, skinColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    dummy.colorSpace = THREE.SRGBColorSpace;
    return dummy;
  }

  // Base skin color
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 64, 64);

  // Helper for blush
  const drawBlush = () => {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.fillRect(8, 38, 10, 5);
    ctx.fillRect(46, 38, 10, 5);
  };

  switch (expression) {
    case 'happy_kawaii': {
      // Curved happy eyes ^ ^
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(20, 28, 7, 1.1 * Math.PI, 1.9 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(44, 28, 7, 1.1 * Math.PI, 1.9 * Math.PI);
      ctx.stroke();
      // Big open smile
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(32, 42, 7, 0, Math.PI);
      ctx.fill();
      drawBlush();
      break;
    }

    case 'confident_wink': {
      // Left eye wink line -
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(13, 28);
      ctx.lineTo(25, 28);
      ctx.stroke();
      // Right eye bright open
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(39, 22, 11, 14);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(41, 26, 7, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(42, 24, 4, 4);
      // Smirk
      ctx.beginPath();
      ctx.arc(32, 42, 7, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      drawBlush();
      break;
    }

    case 'cyber_hud': {
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(6, 20, 52, 14);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(8, 22, 48, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('SYS.OK', 14, 30);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(20, 44, 24, 3);
      break;
    }

    case 'star_eyes': {
      // Golden glowing 4-point stars
      const drawStar = (cx: number, cy: number) => {
        ctx.fillStyle = '#fee440';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx + 3, cy - 3);
        ctx.lineTo(cx + 8, cy);
        ctx.lineTo(cx + 3, cy + 3);
        ctx.lineTo(cx, cy + 8);
        ctx.lineTo(cx - 3, cy + 3);
        ctx.lineTo(cx - 8, cy);
        ctx.lineTo(cx - 3, cy - 3);
        ctx.closePath();
        ctx.fill();
      };
      drawStar(20, 27);
      drawStar(44, 27);
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(32, 42, 8, 0, Math.PI);
      ctx.fill();
      drawBlush();
      break;
    }

    case 'heart_eyes': {
      const drawHeart = (cx: number, cy: number) => {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 2, 4, Math.PI, 0);
        ctx.arc(cx + 3, cy - 2, 4, Math.PI, 0);
        ctx.lineTo(cx, cy + 7);
        ctx.closePath();
        ctx.fill();
      };
      drawHeart(20, 26);
      drawHeart(44, 26);
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(32, 43, 6, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      drawBlush();
      break;
    }

    case 'code_glitch': {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('0 1', 12, 28);
      ctx.fillText('1 0', 38, 28);
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 18, 18, 14);
      ctx.strokeRect(36, 18, 18, 14);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(22, 44, 20, 3);
      break;
    }

    case 'angry_battle': {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      // Angled eyebrows
      ctx.beginPath();
      ctx.moveTo(10, 20);
      ctx.lineTo(26, 26);
      ctx.moveTo(54, 20);
      ctx.lineTo(38, 26);
      ctx.stroke();
      // Red eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(14, 26, 9, 8);
      ctx.fillRect(41, 26, 9, 8);
      // Gritted teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 42, 24, 6);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 42, 24, 6);
      break;
    }

    case 'zen_calm': {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, 28);
      ctx.lineTo(26, 28);
      ctx.moveTo(38, 28);
      ctx.lineTo(52, 28);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(32, 42, 6, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      break;
    }

    case 'xd_laugh': {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      // > < eyes
      ctx.beginPath();
      ctx.moveTo(12, 23);
      ctx.lineTo(24, 28);
      ctx.lineTo(12, 33);
      ctx.moveTo(52, 23);
      ctx.lineTo(40, 28);
      ctx.lineTo(52, 33);
      ctx.stroke();
      // Big laughing D mouth
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(32, 42, 9, 0, Math.PI);
      ctx.fill();
      drawBlush();
      break;
    }

    case 'cool_shades': {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 22, 22, 12);
      ctx.fillRect(34, 22, 22, 12);
      ctx.fillRect(28, 24, 8, 3);
      // Glare reflection
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 24, 3, 3);
      ctx.fillRect(38, 24, 3, 3);
      // Smirk
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(26, 44);
      ctx.lineTo(38, 42);
      ctx.stroke();
      break;
    }

    case 'chibi_blush': {
      // Big cute dark eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(20, 26, 6, 0, Math.PI * 2);
      ctx.arc(44, 26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(18, 23, 3, 3);
      ctx.fillRect(42, 23, 3, 3);
      // Small w mouth
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(28, 42, 4, 0, Math.PI);
      ctx.arc(36, 42, 4, 0, Math.PI);
      ctx.stroke();
      // Strong blush
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(8, 36, 12, 6);
      ctx.fillRect(44, 36, 12, 6);
      break;
    }

    case 'pixel_robot': {
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(14, 24, 10, 6);
      ctx.fillRect(40, 24, 10, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(20, 42, 24, 4);
      break;
    }

    case 'derp_silly': {
      // Derpy eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 22, 12, 12);
      ctx.fillRect(40, 22, 12, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(13, 23, 5, 5); // top left
      ctx.fillRect(46, 28, 5, 5); // bottom right
      // Tongue sticking out
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(22, 42);
      ctx.lineTo(42, 42);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(32, 44, 5, 0, Math.PI);
      ctx.fill();
      break;
    }

    case 'lightning_eyes': {
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      const drawLightning = (cx: number) => {
        ctx.beginPath();
        ctx.moveTo(cx, 18);
        ctx.lineTo(cx - 4, 26);
        ctx.lineTo(cx + 2, 26);
        ctx.lineTo(cx - 2, 34);
        ctx.stroke();
      };
      drawLightning(20);
      drawLightning(44);
      ctx.strokeStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(24, 43);
      ctx.lineTo(40, 43);
      ctx.stroke();
      break;
    }

    case 'galaxy_cosmic': {
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(14, 22, 11, 14);
      ctx.fillRect(39, 22, 11, 14);
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(16, 24, 7, 7);
      ctx.fillRect(41, 24, 7, 7);
      ctx.fillStyle = '#fee440';
      ctx.fillRect(19, 27, 2, 2);
      ctx.fillRect(44, 27, 2, 2);
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(32, 42, 6, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      break;
    }

    case 'vampire_fangs': {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 22, 10, 14);
      ctx.fillRect(40, 22, 10, 14);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(16, 26, 6, 8);
      ctx.fillRect(42, 26, 6, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 24, 4, 4);
      ctx.fillRect(42, 24, 4, 4);
      // Smile with fangs
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(32, 42, 8, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(27, 42);
      ctx.lineTo(29, 47);
      ctx.lineTo(31, 42);
      ctx.moveTo(33, 42);
      ctx.lineTo(35, 47);
      ctx.lineTo(37, 42);
      ctx.fill();
      drawBlush();
      break;
    }

    case 'surprised_open': {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(20, 26, 6, 0, Math.PI * 2);
      ctx.arc(44, 26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(19, 23, 3, 3);
      ctx.fillRect(43, 23, 3, 3);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(32, 44, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'determined': {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(14, 24, 10, 10);
      ctx.fillRect(40, 24, 10, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 26, 6, 6);
      ctx.fillRect(42, 26, 6, 6);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(24, 44);
      ctx.lineTo(40, 44);
      ctx.stroke();
      break;
    }

    case 'victoria_smile':
    default: {
      // Victoria's signature vibrant cyber teal eyes
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 22, 10, 14);
      ctx.fillRect(40, 22, 10, 14);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(16, 26, 6, 8);
      ctx.fillRect(42, 26, 6, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 24, 4, 4);
      ctx.fillRect(42, 24, 4, 4);
      // Bright hopeful smile
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(32, 43, 8, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      drawBlush();
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export function createVoxelCharacter(initialCustom: AvatarCustomization): VoxelCharacterInstance {
  const root = new THREE.Group();
  root.name = 'VoxelAvatar';

  // Base Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialCustom.skinColor),
    roughness: 0.7,
    metalness: 0.1,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialCustom.shirtColor),
    roughness: 0.6,
    metalness: 0.15,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialCustom.pantsColor),
    roughness: 0.65,
    metalness: 0.1,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialCustom.hairColor),
    roughness: 0.8,
    metalness: 0.1,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#00f5d4'),
    emissive: new THREE.Color('#00bbf9'),
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  // Chest Badge
  const badgeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.04);
  const badge = new THREE.Mesh(badgeGeo, accentMat);
  badge.position.set(0, 0.15, 0.21);
  torso.add(badge);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.45 + 0.35, 0);
  torso.add(headGroup);

  const headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  let faceTexture = createFaceTexture(initialCustom.faceExpression, initialCustom.skinColor);
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    roughness: 0.7,
    metalness: 0.1,
  });
  const headMaterials = [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat];
  const headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Containers
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  const headwearGroup = new THREE.Group();
  headGroup.add(headwearGroup);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.3, 0.85, 0.3);
  armGeo.translate(0, -0.35, 0);
  const armMatArray = [shirtMat, shirtMat, shirtMat, skinMat, shirtMat, shirtMat];

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.52, 0.35, 0);
  torso.add(leftArm);
  const leftArmMesh = new THREE.Mesh(armGeo, armMatArray);
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.52, 0.35, 0);
  torso.add(rightArm);
  const rightArmMesh = new THREE.Mesh(armGeo.clone(), armMatArray);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.32, 0.9, 0.34);
  legGeo.translate(0, -0.45, 0);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, -0.45, 0);
  torso.add(leftLeg);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, -0.45, 0);
  torso.add(rightLeg);
  const rightLegMesh = new THREE.Mesh(legGeo.clone(), pantsMat);
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);

  // Back Group
  const backGroup = new THREE.Group();
  backGroup.position.set(0, 0.1, -0.22);
  torso.add(backGroup);

  // Procedural Builder for 21 Hair Styles, 21 Headwear, 21 Back Items
  function buildAccessories(custom: AvatarCustomization) {
    while (hairGroup.children.length > 0) hairGroup.remove(hairGroup.children[0]);
    while (headwearGroup.children.length > 0) headwearGroup.remove(headwearGroup.children[0]);
    while (backGroup.children.length > 0) backGroup.remove(backGroup.children[0]);

    // 1. Hair Styles (21 options)
    const hStyle = custom.hairStyle;
    // Hair base cap
    const baseCap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.72), hairMat);
    baseCap.position.set(0, 0.26, -0.02);
    hairGroup.add(baseCap);

    if (hStyle === 'victoria_ponytail') {
      const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.15, 0.15), hairMat);
      bangs.position.set(0, 0.22, 0.28);
      const ponytail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.22), hairMat);
      ponytail.position.set(0, 0.05, -0.42);
      ponytail.rotation.x = -0.25;
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), accentMat);
      ribbon.position.set(0, 0.22, -0.36);
      hairGroup.add(bangs, ponytail, ribbon);
    } else if (hStyle === 'cyber_spiky' || hStyle === 'anime_spikes') {
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.22), hairMat);
        spike.position.set(i * 0.13, 0.44, 0.08 - Math.abs(i) * 0.05);
        spike.rotation.x = 0.35;
        hairGroup.add(spike);
      }
    } else if (hStyle === 'afro_cube') {
      const afro = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), hairMat);
      afro.position.set(0, 0.35, 0);
      hairGroup.add(afro);
    } else if (hStyle === 'neon_horns') {
      const hornGeo = new THREE.ConeGeometry(0.09, 0.38, 4);
      const leftHorn = new THREE.Mesh(hornGeo, accentMat);
      leftHorn.position.set(-0.25, 0.44, 0);
      leftHorn.rotation.z = 0.35;
      const rightHorn = new THREE.Mesh(hornGeo, accentMat);
      rightHorn.position.set(0.25, 0.44, 0);
      rightHorn.rotation.z = -0.35;
      hairGroup.add(leftHorn, rightHorn);
    } else if (hStyle === 'twin_pigtails') {
      const ptGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
      const leftPigtail = new THREE.Mesh(ptGeo, hairMat);
      leftPigtail.position.set(-0.42, 0.05, -0.1);
      leftPigtail.rotation.z = -0.2;
      const rightPigtail = new THREE.Mesh(ptGeo, hairMat);
      rightPigtail.position.set(0.42, 0.05, -0.1);
      rightPigtail.rotation.z = 0.2;
      hairGroup.add(leftPigtail, rightPigtail);
    } else if (hStyle === 'punk_mohawk') {
      const mohawk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.38, 0.72), hairMat);
      mohawk.position.set(0, 0.44, 0);
      hairGroup.add(mohawk);
    } else if (hStyle === 'samurai_topknot') {
      const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 8), hairMat);
      knot.position.set(0, 0.46, -0.1);
      hairGroup.add(knot);
    } else if (hStyle === 'cyber_waves' || hStyle === 'holo_dreads') {
      const sides = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.65, 0.78), hairMat);
      sides.position.set(0, 0.1, -0.05);
      hairGroup.add(sides);
    } else {
      // Sleek bob / general cap
      const sides = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.74), hairMat);
      sides.position.set(0, 0.18, -0.04);
      hairGroup.add(sides);
    }

    // 2. Headwear (21 options)
    const hw = custom.headwear;
    if (hw === 'victoria_visor' || hw === 'cyber_goggles') {
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.22), accentMat);
      visor.position.set(0, 0.05, 0.32);
      headwearGroup.add(visor);
    } else if (hw === 'creator_crown') {
      const crownMat = new THREE.MeshStandardMaterial({ color: '#fee440', metalness: 0.95, roughness: 0.15 });
      const crown = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.16, 0.74), crownMat);
      crown.position.set(0, 0.4, 0);
      headwearGroup.add(crown);
      for (let a = 0; a < 4; a++) {
        const gem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.12), accentMat);
        gem.position.set(a % 2 === 0 ? 0.33 : -0.33, 0.48, a > 1 ? 0.33 : -0.33);
        headwearGroup.add(gem);
      }
    } else if (hw === 'cat_ears') {
      const earGeo = new THREE.ConeGeometry(0.13, 0.25, 4);
      const earMat = new THREE.MeshStandardMaterial({ color: '#f43f5e', emissive: '#be123c', emissiveIntensity: 0.5 });
      const leftEar = new THREE.Mesh(earGeo, earMat);
      leftEar.position.set(-0.25, 0.45, 0);
      const rightEar = new THREE.Mesh(earGeo, earMat);
      rightEar.position.set(0.25, 0.45, 0);
      headwearGroup.add(leftEar, rightEar);
    } else if (hw === 'builder_helmet') {
      const helmMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.5, roughness: 0.3 });
      const helm = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.24, 0.76), helmMat);
      helm.position.set(0, 0.38, 0);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.1), accentMat);
      lamp.position.set(0, 0.4, 0.4);
      headwearGroup.add(helm, lamp);
    } else if (hw === 'steampunk_tophat') {
      const hatMat = new THREE.MeshStandardMaterial({ color: '#451a03', metalness: 0.2, roughness: 0.8 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16), hatMat);
      brim.position.set(0, 0.36, 0);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.45, 16), hatMat);
      top.position.set(0, 0.58, 0);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.1, 16), accentMat);
      band.position.set(0, 0.42, 0);
      headwearGroup.add(brim, top, band);
    } else if (hw === 'gamer_headset') {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 16, Math.PI), accentMat);
      band.rotation.z = -Math.PI / 2;
      band.position.set(0, 0.35, 0);
      const earCupL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.25), accentMat);
      earCupL.position.set(-0.36, 0.05, 0);
      const earCupR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.25), accentMat);
      earCupR.position.set(0.36, 0.05, 0);
      headwearGroup.add(band, earCupL, earCupR);
    } else if (hw === 'halo_angel') {
      const haloGeo = new THREE.TorusGeometry(0.38, 0.04, 8, 24);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xfee440 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.65, 0);
      headwearGroup.add(halo);
    } else if (hw === 'pixel_shades') {
      const shadesMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const shades = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 0.15), shadesMat);
      shades.position.set(0, 0.06, 0.34);
      headwearGroup.add(shades);
    } else if (hw === 'wizard_hat') {
      const coneMat = new THREE.MeshStandardMaterial({ color: '#6d28d9', roughness: 0.7 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 16), coneMat);
      brim.position.set(0, 0.36, 0);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 12), coneMat);
      cone.position.set(0, 0.68, -0.05);
      cone.rotation.x = -0.2;
      headwearGroup.add(brim, cone);
    }

    // 3. Back Accessories (21 options)
    const ba = custom.backAccessory;
    if (
      ba === 'quantum_wings' ||
      ba === 'crystal_angel_wings' ||
      ba === 'demon_neon_wings' ||
      ba === 'steampunk_wings'
    ) {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(0.95, 0.65);
      wingShape.lineTo(0.75, 0.15);
      wingShape.lineTo(0.9, -0.45);
      wingShape.lineTo(0, -0.1);
      wingShape.closePath();

      const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.04, bevelEnabled: false });
      const wingColor =
        ba === 'crystal_angel_wings'
          ? '#ffffff'
          : ba === 'demon_neon_wings'
          ? '#f43f5e'
          : ba === 'steampunk_wings'
          ? '#d97706'
          : '#00f5d4';

      const wingMat = new THREE.MeshStandardMaterial({
        color: wingColor,
        emissive: wingColor,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
        metalness: 0.5,
        roughness: 0.2,
      });

      const leftWing = new THREE.Mesh(wingExtrude, wingMat);
      leftWing.position.set(-0.15, 0.1, 0);
      leftWing.rotation.y = Math.PI - 0.2;
      leftWing.name = 'leftWing';

      const rightWing = new THREE.Mesh(wingExtrude, wingMat);
      rightWing.position.set(0.15, 0.1, 0);
      rightWing.rotation.y = 0.2;
      rightWing.scale.x = -1;
      rightWing.name = 'rightWing';

      backGroup.add(leftWing, rightWing);
    } else if (ba === 'cyber_katana') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 0.05), accentMat);
      blade.rotation.z = 0.65;
      blade.position.set(0.1, 0.15, -0.06);
      backGroup.add(blade);
    } else if (ba === 'twin_swords') {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 0.05), accentMat);
      s1.rotation.z = 0.65;
      s1.position.set(0, 0.15, -0.06);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 0.05), accentMat);
      s2.rotation.z = -0.65;
      s2.position.set(0, 0.15, -0.08);
      backGroup.add(s1, s2);
    } else if (ba === 'jetpack' || ba === 'rocket_booster') {
      const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.65, 8);
      const tankMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.2 });
      const t1 = new THREE.Mesh(tankGeo, tankMat);
      t1.position.set(-0.2, 0, -0.1);
      const t2 = new THREE.Mesh(tankGeo, tankMat);
      t2.position.set(0.2, 0, -0.1);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), flameMat);
      f1.position.set(-0.2, -0.45, -0.1);
      f1.rotation.x = Math.PI;
      const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), flameMat);
      f2.position.set(0.2, -0.45, -0.1);
      f2.rotation.x = Math.PI;
      backGroup.add(t1, t2, f1, f2);
    } else if (ba === 'drone_companion') {
      const drone = new THREE.Group();
      drone.name = 'droneCompanion';
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), accentMat);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 16), accentMat);
      ring.rotation.x = Math.PI / 2;
      drone.add(body, ring);
      drone.position.set(0.65, 0.6, -0.2);
      backGroup.add(drone);
    } else if (ba === 'holo_cape') {
      const capeGeo = new THREE.BoxGeometry(0.65, 1.1, 0.04);
      const capeMat = new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0284c7',
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.75,
      });
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.position.set(0, -0.4, -0.06);
      cape.rotation.x = 0.15;
      backGroup.add(cape);
    } else if (ba === 'kawaii_cat_backpack' || ba === 'explorer_backpack') {
      const packMat = new THREE.MeshStandardMaterial({ color: '#f43f5e', roughness: 0.8 });
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.25), packMat);
      pack.position.set(0, 0, -0.15);
      backGroup.add(pack);
    }
  }

  buildAccessories(initialCustom);

  let walkCycle = 0;
  let wingCycle = 0;
  let attackTimer = 0;
  let attackMaxDuration = 0.32;
  let activeAttackWeapon = 'sword';
  let attackComboToggle = 1;

  function triggerAttack(weaponId: string) {
    activeAttackWeapon = weaponId;
    attackComboToggle = -attackComboToggle;
    attackMaxDuration = weaponId === 'hammer' ? 0.45 : weaponId === 'sword' ? 0.28 : 0.24;
    attackTimer = attackMaxDuration;
  }

  function updateAnimation(
    isMoving: boolean,
    isJumping: boolean,
    isAction: boolean,
    dt: number,
    animType?: string
  ) {
    // Emote Animations
    if (animType === 'dance') {
      walkCycle += dt * 8;
      torso.position.y = 1.35 + Math.sin(walkCycle) * 0.15;
      torso.rotation.y = Math.sin(walkCycle * 0.5) * 0.4;
      torso.rotation.x = 0;
      leftArm.rotation.x = Math.sin(walkCycle) * 1.5;
      rightArm.rotation.x = -Math.sin(walkCycle) * 1.5;
      leftArm.rotation.z = 0.2;
      rightArm.rotation.z = -0.2;
      leftLeg.rotation.x = Math.sin(walkCycle) * 0.4;
      rightLeg.rotation.x = -Math.sin(walkCycle) * 0.4;
      return;
    }

    if (animType === 'wave') {
      walkCycle += dt * 7;
      torso.position.y = 1.35;
      torso.rotation.y = 0;
      torso.rotation.x = 0;
      // Right arm high waving
      rightArm.rotation.x = -2.7;
      rightArm.rotation.z = -0.3 + Math.sin(walkCycle) * 0.45;
      leftArm.rotation.x = 0;
      leftArm.rotation.z = 0.1;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      return;
    }

    if (animType === 'cheer') {
      walkCycle += dt * 9;
      // Jump up and down celebrating
      torso.position.y = 1.35 + Math.abs(Math.sin(walkCycle)) * 0.16;
      torso.rotation.x = 0;
      torso.rotation.y = 0;
      // Both arms up
      leftArm.rotation.x = -2.8;
      rightArm.rotation.x = -2.8;
      leftArm.rotation.z = 0.35 + Math.sin(walkCycle) * 0.2;
      rightArm.rotation.z = -0.35 - Math.sin(walkCycle) * 0.2;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      return;
    }

    if (animType === 'flex') {
      walkCycle += dt * 4;
      torso.position.y = 1.35;
      torso.rotation.x = 0;
      torso.rotation.y = Math.sin(walkCycle) * 0.2;
      // Bodybuilder bicep flex pose
      leftArm.rotation.x = -1.8;
      leftArm.rotation.z = 0.85;
      rightArm.rotation.x = -1.8;
      rightArm.rotation.z = -0.85;
      leftLeg.rotation.x = 0.1;
      rightLeg.rotation.x = -0.1;
      return;
    }

    if (animType === 'bow') {
      torso.position.y = 1.32;
      torso.rotation.x = 0.52; // respectful forward bow
      torso.rotation.y = 0;
      leftArm.rotation.x = 0.2;
      leftArm.rotation.z = 0.1;
      rightArm.rotation.x = 0.2;
      rightArm.rotation.z = -0.1;
      leftLeg.rotation.x = -0.25;
      rightLeg.rotation.x = -0.25;
      return;
    }

    if (animType === 'point') {
      torso.position.y = 1.35;
      torso.rotation.x = 0;
      torso.rotation.y = 0;
      // Right arm pointing straight forward
      rightArm.rotation.x = -1.55;
      rightArm.rotation.y = 0.1;
      rightArm.rotation.z = 0;
      leftArm.rotation.x = 0;
      leftArm.rotation.z = 0.1;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      return;
    }

    if (animType === 'laugh') {
      walkCycle += dt * 10;
      torso.position.y = 1.35;
      torso.rotation.x = -0.2 + Math.sin(walkCycle) * 0.18;
      torso.rotation.y = 0;
      leftArm.rotation.x = -0.8;
      leftArm.rotation.z = 0.3;
      rightArm.rotation.x = -0.8;
      rightArm.rotation.z = -0.3;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      return;
    }

    if (animType === 'spin') {
      walkCycle += dt * 10;
      torso.position.y = 1.45 + Math.sin(walkCycle * 0.5) * 0.1;
      torso.rotation.y += dt * 12;
      torso.rotation.x = 0;
      leftArm.rotation.x = -1.5;
      leftArm.rotation.z = 0.8;
      rightArm.rotation.x = -1.5;
      rightArm.rotation.z = -0.8;
      leftLeg.rotation.x = 0.2;
      rightLeg.rotation.x = -0.2;
      return;
    }

    // Reset torso angles when not in special emote
    torso.rotation.x = 0;
    torso.rotation.y = 0;
    leftArm.rotation.z = 0;
    rightArm.rotation.z = 0;
    rightArm.rotation.y = 0;

    if (attackTimer > 0) {
      attackTimer = Math.max(0, attackTimer - dt);
    }
    const isAttacking = attackTimer > 0 || isAction;

    if (isJumping && !isAttacking) {
      leftLeg.rotation.x = -0.5;
      rightLeg.rotation.x = 0.3;
      leftArm.rotation.x = 2.2;
      rightArm.rotation.x = 2.2;
      torso.position.y = 1.35;
      return;
    }

    if (isMoving) {
      walkCycle += dt * 10;
      const legAngle = Math.sin(walkCycle) * 0.7;
      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;
      if (!isAttacking) {
        leftArm.rotation.x = -legAngle * 0.8;
        rightArm.rotation.x = legAngle * 0.8;
      }
      torso.position.y = 1.35 + Math.abs(Math.sin(walkCycle)) * 0.06;
    } else {
      walkCycle += dt * 2.5;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      if (!isAttacking) {
        leftArm.rotation.x = Math.sin(walkCycle) * 0.05;
        rightArm.rotation.x = -Math.sin(walkCycle) * 0.05;
      }
      torso.position.y = 1.35 + Math.sin(walkCycle) * 0.02;
    }

    if (attackTimer > 0) {
      const progress = 1.0 - attackTimer / attackMaxDuration;
      if (activeAttackWeapon === 'hammer') {
        // Two-handed overhead seismic slam
        const slamArc = Math.sin(progress * Math.PI);
        torso.rotation.x = progress < 0.35 ? -0.35 : 0.45 * slamArc;
        rightArm.rotation.x = THREE.MathUtils.lerp(-2.8, -0.35, Math.min(1, progress * 1.4));
        leftArm.rotation.x = THREE.MathUtils.lerp(-2.6, -0.45, Math.min(1, progress * 1.4));
        rightArm.rotation.z = 0.25;
        leftArm.rotation.z = -0.25;
      } else if (activeAttackWeapon === 'sword') {
        // Wide dynamic diagonal slash + torso twist
        const swing = Math.sin(progress * Math.PI);
        torso.rotation.y = attackComboToggle * (0.55 - progress * 1.1);
        torso.rotation.x = 0.22 * swing;
        rightArm.rotation.x = -1.65 + progress * 1.5;
        rightArm.rotation.z = attackComboToggle * (-0.75 + progress * 1.35);
        leftArm.rotation.x = -0.5 * swing;
        leftArm.rotation.z = 0.35;
      } else {
        // Blaster / Bow aim + sharp recoil kickback
        const kick = Math.sin(progress * Math.PI);
        torso.rotation.y = -0.25;
        rightArm.rotation.x = -1.55 - kick * 0.45;
        leftArm.rotation.x = activeAttackWeapon === 'bow' ? -1.45 : -0.6;
      }
    } else if (isAction) {
      rightArm.rotation.x = -1.2 + Math.sin(Date.now() * 0.02) * 0.8;
    }

    // Wings flutter
    const lWing = backGroup.getObjectByName('leftWing') as THREE.Mesh;
    const rWing = backGroup.getObjectByName('rightWing') as THREE.Mesh;
    if (lWing && rWing) {
      wingCycle += dt * (isJumping ? 14 : 5);
      const flutter = Math.sin(wingCycle) * 0.28;
      lWing.rotation.y = Math.PI - 0.2 + flutter;
      rWing.rotation.y = 0.2 - flutter;
    }

    // Drone companion orbit
    const drone = backGroup.getObjectByName('droneCompanion') as THREE.Group;
    if (drone) {
      drone.position.y = 0.6 + Math.sin(Date.now() * 0.003) * 0.12;
      drone.rotation.y += dt * 2;
    }
  }

  function updateCustomization(custom: AvatarCustomization) {
    skinMat.color.set(custom.skinColor);
    shirtMat.color.set(custom.shirtColor);
    pantsMat.color.set(custom.pantsColor);
    hairMat.color.set(custom.hairColor);

    faceTexture.dispose();
    faceTexture = createFaceTexture(custom.faceExpression, custom.skinColor);
    faceMat.map = faceTexture;
    faceMat.needsUpdate = true;

    buildAccessories(custom);
    root.scale.set(custom.scale, custom.scale, custom.scale);
  }

  return {
    root,
    head: headGroup,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    backGroup,
    triggerAttack,
    updateAnimation,
    updateCustomization,
  };
}

export const VICTORIA_TORO_CUSTOMIZATION: AvatarCustomization = {
  skinColor: '#fcd34d',
  hairStyle: 'victoria_ponytail',
  hairColor: '#0f172a',
  shirtColor: '#0284c7',
  pantsColor: '#1e293b',
  headwear: 'victoria_visor',
  backAccessory: 'quantum_wings',
  faceExpression: 'victoria_smile',
  scale: 1.0,
};
