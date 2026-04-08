"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useAnimations, Html, useGLTF } from "@react-three/drei";
import { Suspense, Component, useEffect, useRef, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import { FBXLoader } from "three-stdlib";

/* =========================
MALE AVATAR
========================= */

function MaleAvatar({ isTalking }) {
    const group = useRef(null);
    const { scene, animations } = useGLTF("/businessman/buisness_man_with_talking_animation.glb");
    const { actions, names } = useAnimations(animations, group);

    // Load ALL textures for manual application
    const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
    const textures = useMemo(() => ({
        eyeL: textureLoader.load("/businessman/textures/Std_Eye_L_Diffuse.png"),
        eyeR: textureLoader.load("/businessman/textures/Std_Eye_R_Diffuse.png"),
        head: textureLoader.load("/businessman/textures/Std_Skin_Head_Diffuse.png"),
        body: textureLoader.load("/businessman/textures/Std_Skin_Body_Diffuse.png"),
        arm: textureLoader.load("/businessman/textures/Std_Skin_Arm_Diffuse.png"),
        leg: textureLoader.load("/businessman/textures/Std_Skin_Leg_Diffuse.png"),
        hair: textureLoader.load("/businessman/textures/Classic_Taper_Diffuse.jpeg"),
        scalp: textureLoader.load("/businessman/textures/Classic_Taper_Scalp_Diffuse.jpeg"),
        scalpOpacity: textureLoader.load("/businessman/textures/Classic_Taper_Scalp_Opacity.jpeg"),
        lash: textureLoader.load("/businessman/textures/Std_Eyelash_Diffuse.jpeg"),
        lashOpacity: textureLoader.load("/businessman/textures/Std_Eyelash_Opacity.png"),
        teeth: textureLoader.load("/businessman/textures/Std_Upper_Teeth_Diffuse.png"),
        tongue: textureLoader.load("/businessman/textures/Std_Tongue_Diffuse.png"),
        shirt: textureLoader.load("/businessman/textures/Business_Shirt_Diffuse.jpeg"),
        pants: textureLoader.load("/businessman/textures/Slacks_Diffuse.jpeg"),
        shoes: textureLoader.load("/businessman/textures/Leather_shoes_Diffuse.jpeg"),
    }), [textureLoader]);

    useEffect(() => {
        if (!scene) return;
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;

                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => {
                    const n = (m.name || "").toLowerCase();
                    const meshName = (child.name || "").toLowerCase();
                    m.roughness = 0.8;
                    m.metalness = 0.1;

                    if (n.includes("cornea") || n.includes("tearline") || n.includes("occlusion")) {
                        m.transparent = true; m.opacity = 0; m.depthWrite = false;
                    } else if (n.includes("eye") && !n.includes("lash")) {
                        m.map = (n.includes("left") || n.includes("_l")) ? textures.eyeL : textures.eyeR;
                    } else if (n.includes("head") || n.includes("face")) {
                        m.map = textures.head;
                    } else if (n.includes("body") || n.includes("torso")) {
                        m.map = textures.body;
                    } else if (n.includes("arm") || n.includes("hand")) {
                        m.map = textures.arm;
                    } else if (n.includes("leg") || meshName.includes("leg")) {
                        m.map = textures.leg;
                    } else if (n.includes("hair") || n.includes("taper")) {
                        m.transparent = true; m.alphaTest = 0.5;
                        m.map = n.includes("scalp") ? textures.scalp : textures.hair;
                        if (n.includes("scalp")) m.alphaMap = textures.scalpOpacity;
                    } else if (n.includes("lash")) {
                        m.transparent = true; m.map = textures.lash;
                        m.alphaMap = textures.lashOpacity; m.alphaTest = 0.5;
                    } else if (n.includes("teeth") || n.includes("tongue")) {
                        m.map = n.includes("tongue") ? textures.tongue : textures.teeth;
                    } else if (n.includes("shirt") || n.includes("top") || meshName.includes("shirt") || meshName.includes("top")) {
                        m.map = textures.shirt;
                    } else if (n.includes("pant") || n.includes("slack") || n.includes("trouser") || meshName.includes("pant") || meshName.includes("slack")) {
                        m.map = textures.pants;
                    } else if (n.includes("shoe") || n.includes("boot") || meshName.includes("shoe")) {
                        m.map = textures.shoes;
                    }
                    m.needsUpdate = true;
                });
            }
        });
    }, [scene, textures]);

    useEffect(() => {
        if (!names.length) return;
        const action = actions[names[0]];
        if (!action) return;
        action.reset();
        if (isTalking) {
            action.play();
        } else {
            action.play();
            action.paused = true;
        }
        return () => action.stop();
    }, [isTalking, actions, names]);

    return (
        <group ref={group} position={[0, -2.5, 0]}>
            <primitive object={scene} scale={2.5} />
        </group>
    );
}

/* =========================
FEMALE AVATAR
========================= */

function FemaleAvatar({ isTalking }) {
    const group = useRef();
    const mixer = useRef();
    const actions = useRef({});
    const currentAction = useRef();
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);

    // Keep the GLTF model
    const { scene } = useGLTF("/female-avatar/source/664cbf464c3b647e2d6af7b4.glb");

    // Disable frustum culling to prevent head flickering/disappearing
    useEffect(() => {
        if (!scene) return;
        scene.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false;
            }
        });
    }, [scene]);

    // FBX Animations from the new public/animations/female/fbx folder
    const animationPaths = useMemo(() => [
        "/animations/female/fbx/blender Talking (4).fbx",
        "/animations/female/fbx/blender Talking (5).fbx",
        "/animations/female/fbx/blender Talking (6).fbx",
        "/animations/female/fbx/blender Talking (7).fbx",
        "/animations/female/fbx/blender Talking (8).fbx",
        "/animations/female/fbx/blender idle(1).fbx",
        "/animations/female/fbx/blender Standing Arguing (1).fbx",
        "/animations/female/fbx/blender Waving (1).fbx"
    ], []);

    // Helper: Normalize bone names for aggressive matching
    const normalize = (name) => name.toLowerCase().replace(/mixamorig|armature|scene|skeleton|[:|._-]/g, "");

    /* ----------- Setup mixer & retarget one-time ----------- */

    useEffect(() => {
        if (!scene) return;

        const fbxLoader = new FBXLoader();
        mixer.current = new THREE.AnimationMixer(scene);

        // Map GLTF bones
        const boneMap = {};
        scene.traverse((obj) => {
            if (obj.isBone) {
                const clean = normalize(obj.name);
                boneMap[clean] = obj.name;
            }
        });

        const newActions = {};
        let loadedCount = 0;

        animationPaths.forEach((path) => {
            fbxLoader.load(path, (fbx) => {
                if (fbx.animations && fbx.animations.length > 0) {
                    const clip = fbx.animations[0].clone();

                    // Retarget FBX tracks to GLTF bones
                    clip.tracks.forEach((track) => {
                        const [bonePart, property] = track.name.split(".");
                        const clean = normalize(bonePart);
                        if (boneMap[clean]) {
                            track.name = boneMap[clean] + "." + property;
                        }
                    });

                    const fileName = path.split("/").pop();
                    const action = mixer.current.clipAction(clip);
                    newActions[fileName] = action;
                }

                loadedCount++;
                if (loadedCount === animationPaths.length) {
                    actions.current = newActions;
                    setIsFullyLoaded(true);

                    // Start Initial Animation
                    const idleAction = newActions["blender idle(1).fbx"];
                    if (idleAction) {
                        idleAction.play();
                        currentAction.current = idleAction;
                    }
                }
            });
        });

        return () => {
            if (mixer.current) mixer.current.stopAllAction();
        };
    }, [scene, animationPaths]);


    /* ----------- Controlled Switch ----------- */

    useEffect(() => {
        if (!isFullyLoaded || !actions.current) return;
        const acts = actions.current;

        let target;
        if (isTalking) {
            const talkers = Object.keys(acts).filter(a => a.includes("Talking"));
            if (talkers.length > 0) {
                target = acts[talkers[Math.floor(Math.random() * talkers.length)]];
            }
        } else {
            target = acts["blender idle(1).fbx"];
        }

        if (!target || target === currentAction.current) return;

        if (currentAction.current) currentAction.current.fadeOut(0.3);
        target.reset().fadeIn(0.3).play();
        currentAction.current = target;

    }, [isTalking, isFullyLoaded]);


    /* ----------- Engine ----------- */

    useFrame((_, delta) => {
        if (mixer.current) mixer.current.update(delta);
    });

    return (
        <group ref={group} position={[0, -2.5, 0]}>
            <primitive object={scene} scale={2.2} />
        </group>
    );
}

/* =========================
FALLBACK
========================= */

function FallbackAvatar() {
    return (
        <group position={[0, -2, 0]}>
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 1.5, 32]} />
                <meshStandardMaterial color="#4C1D95" />
            </mesh>
        </group>
    );
}

/* =========================
ERROR BOUNDARY
========================= */

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="absolute top-6 left-6 z-20 bg-red-500/10 backdrop-blur-md p-4 rounded-xl border border-red-500/20 max-w-sm">
                        <p className="text-xs text-red-400 font-bold mb-1 uppercase tracking-wider">Avatar Engine Error</p>
                        <p className="text-[10px] text-red-400/70 font-mono break-words">{this.state.error?.message}</p>
                    </div>
                    <Canvas camera={{ position: [0, 0, 5], fov: 40 }} className="w-full h-full">
                        <ambientLight intensity={0.5} />
                        <FallbackAvatar />
                    </Canvas>
                </div>
            );
        }

        return this.props.children;
    }
}

/* =========================
MAIN EXPERIENCE
========================= */

export function AvatarExperience({ isTalking, avatarType = "male" }) {
    return (
        <div
            className="w-full h-full relative group overflow-hidden"
            style={{
                backgroundImage: 'url("/assets/avatar-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'local'
            }}
        >
            {/* Subtle Gradient Background Overlay */}
            <div className="absolute inset-0 bg-radial from-white/10 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent pointer-events-none" />

            <ErrorBoundary>
                <Canvas
                    key={avatarType}
                    shadows
                    camera={{ position: [0, 0, 7.5], fov: 38 }}
                    className="w-full h-full"
                >
                    <ambientLight intensity={1.5} />
                    <spotLight
                        position={[10, 20, 10]}
                        angle={0.15}
                        penumbra={1}
                        intensity={2}
                        castShadow
                    />
                    <pointLight position={[-10, 5, -10]} intensity={1.5} color="#ffffff" />
                    <pointLight position={[10, 5, 10]} intensity={1} color="#fcd34d" />

                    <Suspense fallback={
                        <Html center>
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest animate-pulse">Initializing Neural Link</span>
                            </div>
                        </Html>
                    }>
                        {avatarType === "female"
                            ? <FemaleAvatar isTalking={isTalking} />
                            : <MaleAvatar isTalking={isTalking} />
                        }
                        <Environment preset="city" />
                    </Suspense>

                    <OrbitControls
                        enablePan={false}
                        enableZoom={false}
                        target={[0, -0.5, 0]}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                </Canvas>
            </ErrorBoundary>

            {/* Subtle Overlay Fade */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-white/80 dark:from-[#0f1115]/80 to-transparent pointer-events-none" />
        </div>
    );
}

/* =========================
PRELOAD
========================= */

useGLTF.preload("/businessman/buisness_man_with_talking_animation.glb");
useGLTF.preload("/female-avatar/source/664cbf464c3b647e2d6af7b4.glb");
