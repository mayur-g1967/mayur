import { FilesetResolver, FaceLandmarker, PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';

let faceLandmarker = null;
let poseLandmarker = null;
let handLandmarker = null;
let isInitializing = false;

// Subdue MediaPipe WASM informational logs
if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('TensorFlow Lite XNNPACK delegate')) {
            return;
        }
        originalConsoleError(...args);
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
        if (typeof args[0] === 'string' && (args[0].includes('XNNPACK') || args[0].includes('WASM'))) {
            return;
        }
        originalConsoleWarn(...args);
    };
}

// Load models singleton
export async function initMediaPipeModels() {
    if (faceLandmarker && poseLandmarker && handLandmarker) return;
    if (isInitializing) {
        // Simple polling if already initializing
        while (isInitializing) {
            await new Promise(r => setTimeout(r, 100));
        }
        return;
    }

    isInitializing = true;
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                delegate: "CPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
        });

        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                delegate: "CPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
        });

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "CPU"
            },
            runningMode: "VIDEO",
            numHands: 2
        });
    } catch (err) {
        console.error("❌ MediaPipe initialization error:", err);
    } finally {
        isInitializing = false;
        console.log(`✅ MediaPipe Init Complete. Models loaded: Face(${!!faceLandmarker}) Pose(${!!poseLandmarker}) Hand(${!!handLandmarker})`);
    }
}

// Posture heuristic for desk/webcam users - returns 0-100 continuous score
// Uses nose-to-shoulder relationship since hips/knees are rarely visible in desk webcam shots
function determinePostureScore(poseLandmarks) {
    if (!poseLandmarks || poseLandmarks.length < 17) return -1; // sentinel: no person

    const nose = poseLandmarks[0];
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];

    const noseVisible = nose?.visibility > 0.5;
    const leftShoulderVisible = leftShoulder?.visibility > 0.3;
    const rightShoulderVisible = rightShoulder?.visibility > 0.3;

    if (!noseVisible || (!leftShoulderVisible && !rightShoulderVisible)) {
        return -1; // not enough landmarks
    }

    const shoulderMidY = (
        ((leftShoulderVisible ? leftShoulder.y : 0) + (rightShoulderVisible ? rightShoulder.y : 0)) /
        ((leftShoulderVisible ? 1 : 0) + (rightShoulderVisible ? 1 : 0))
    );

    // In MediaPipe, Y increases downward. Nose should be above (lower Y) than shoulders.
    const nosePctAboveShoulders = shoulderMidY - nose.y; // positive = nose is higher than shoulders

    // Centering: nose X should be near middle
    const distFromCenter = Math.abs(nose.x - 0.5); // 0 = perfect center, 0.5 = edge
    const centerScore = Math.max(0, 1 - (distFromCenter / 0.4)); // 100% at center, 0% at edge

    // Vertical score: scale nosePctAboveShoulders. ~0.05 is bad, ~0.25 is great.
    const verticalRaw = (nosePctAboveShoulders - 0.05) / (0.25 - 0.05); // 0 to 1
    const verticalScore = Math.max(0, Math.min(1, verticalRaw));

    return Math.round(verticalScore * 0.7 * 100 + centerScore * 0.3 * 100); // weighted combo
}

function evaluateEmotion(faceBlendshapes) {
    if (!faceBlendshapes || faceBlendshapes.length === 0) return "neutral";

    const getScore = (name) => {
        const shape = faceBlendshapes.find(b => b.categoryName === name);
        return shape ? shape.score : 0;
    };

    const smileLeft = getScore("mouthSmileLeft");
    const smileRight = getScore("mouthSmileRight");
    const browDownLeft = getScore("browDownLeft");
    const browDownRight = getScore("browDownRight");

    if (smileLeft > 0.4 && smileRight > 0.4) return "positive";
    if (browDownLeft > 0.4 && browDownRight > 0.4) return "tense";

    return "neutral";
}

// Helper to continuously run tracking
export function startMediaPipeStream(videoElement, onResults) {
    let active = true;
    let lastVideoTime = -1;

    async function detectFrame() {
        if (!active || !videoElement || videoElement.readyState < 2) {
            if (active) {
                // Throttle logs slightly to not spam on idle, but verify it's checking
                if (Math.random() < 0.05) console.log("⏳ MediaPipe waiting: videoElement readyState=", videoElement?.readyState);
                requestAnimationFrame(detectFrame);
            }
            return;
        }

        const currentTimeMs = performance.now();

        if (videoElement.currentTime !== lastVideoTime) {
            lastVideoTime = videoElement.currentTime;

            let faceResult = null;
            let poseResult = null;
            let handResult = null;
            let postureScore = -1; // -1 = no person detected
            let emotion = "neutral";

            if (faceLandmarker) {
                faceResult = faceLandmarker.detectForVideo(videoElement, currentTimeMs);
                if (faceResult && faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
                    emotion = evaluateEmotion(faceResult.faceBlendshapes[0].categories);
                }
            }
            if (poseLandmarker) {
                poseResult = poseLandmarker.detectForVideo(videoElement, currentTimeMs);
                if (poseResult && poseResult.landmarks && poseResult.landmarks.length > 0) {
                    postureScore = determinePostureScore(poseResult.landmarks[0]);
                }
            }
            if (handLandmarker) {
                handResult = handLandmarker.detectForVideo(videoElement, currentTimeMs);
            }

            // Fire callback
            onResults({
                face: faceResult,
                pose: poseResult,
                hand: handResult,
                postureScore,
                emotion,
                handsVisible: handResult?.landmarks?.length > 0
            });
        }

        if (active) {
            requestAnimationFrame(detectFrame);
        }
    }

    // Assure initialization before starting loop
    initMediaPipeModels().then(() => {
        if (active) detectFrame();
    });

    return () => {
        active = false;
    };
}
