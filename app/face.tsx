"use client";

import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";
import { AuthenticatorSchema } from "./type";
import { useFormContext } from "react-hook-form";

export function FaceDetect() {
  const { control, setValue } = useFormContext<AuthenticatorSchema>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState<boolean>(false);
  const [faceDirection, setFaceDirection] =
    useState<string>("No face detected");
  const lastCaptureTime = useRef<number>(0);
  const captureDebounceTime = 100;

  const [currentPose, setCurrentPose] = useState<string>("Straight");
  const [count, setCount] = useState(0);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.NEXT_PUBLIC_PUBLIC_URL + "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setIsModelsLoaded(true);
    };
    loadModels();
  }, []);

  // Function to calculate face pose based on landmarks
  const calculateFacePose = (landmarks: any) => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const noseTop = nose[3];
    const noseBottom = nose[6];

    const leftEyeCenter = {
      x:
        leftEye.reduce((sum: number, point: any) => sum + point.x, 0) /
        leftEye.length,
      y:
        leftEye.reduce((sum: number, point: any) => sum + point.y, 0) /
        leftEye.length,
    };
    const rightEyeCenter = {
      x:
        rightEye.reduce((sum: number, point: any) => sum + point.x, 0) /
        rightEye.length,
      y:
        rightEye.reduce((sum: number, point: any) => sum + point.y, 0) /
        rightEye.length,
    };

    const eyeDistance = rightEyeCenter.x - leftEyeCenter.x;
    const noseCenterX = (noseTop.x + noseBottom.x) / 2;
    const eyesCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const yaw = ((noseCenterX - eyesCenterX) / eyeDistance) * 100;

    const eyeLevel = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const noseHeight = noseBottom.y - noseTop.y;
    const pitch = ((noseBottom.y - eyeLevel) / noseHeight - 1.5) * 50;

    return { yaw, pitch };
  };

  // Function to determine face direction based on angles
  const getFaceDirection = (pose: { yaw: number; pitch: number }) => {
    const { yaw, pitch } = pose;

    const yawThreshold = 12;
    const pitchThreshold = 10;

    if (Math.abs(pitch) > pitchThreshold) {
      if (pitch < 90 && yaw < 10) return "Up";
      if (pitch > 160 && yaw < 10) return "Down";
    }

    if (Math.abs(yaw) > yawThreshold) {
      if (yaw < 0) return "Right";
      if (yaw > 15) return "Left";
    }

    return "Straight";
  };

  // Capture and save frame from video stream
  const captureAndSaveFrameFromVideo = async (
    boundingBox: faceapi.Box,
    direction: string
  ) => {
    // Check debounce time
    const currentTime = Date.now();
    if (currentTime - lastCaptureTime.current < captureDebounceTime) {
      return;
    }

    if (videoRef.current) {
      const video = videoRef.current;

      try {
        const offscreenCanvas = new OffscreenCanvas(224, 224);
        const context = offscreenCanvas.getContext("2d");

        if (context) {
          context.drawImage(
            video,
            boundingBox.x - 50,
            boundingBox.y - 50,
            boundingBox.width,
            boundingBox.height,
            0,
            0,
            224,
            224
          );

          const blob = await offscreenCanvas.convertToBlob({
            type: "image/jpeg",
            quality: 1,
          });

          const formData = new FormData();
          formData.append("image", blob, `${direction}-${Date.now()}.jpg`);

          const response = await fetch("/api/save-image", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            console.log(`save img success`);
          } else {
            console.error("Failed to save image");
          }
        }

        lastCaptureTime.current = currentTime;
      } catch (error) {
        console.error("Error capturing and saving frame from video:", error);
      }
    }
  };

  // Activate camera
  useEffect(() => {
    if (isModelsLoaded && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    }
  }, [isModelsLoaded]);

  const handleVideoPlay = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        // Ensure only one face is detected
        if (detections.length >= 2) {
          setFaceDirection("Multiple faces detected");
          return; // Skip further processing if more than one face is detected
        }

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        const context = canvas.getContext("2d");

        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (resizedDetections.length > 0) {
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            const pose = calculateFacePose(resizedDetections[0].landmarks);
            const direction = getFaceDirection(pose);
            setFaceDirection(direction);

            const boundingBox = resizedDetections[0].detection.box;

            if (
              direction === currentPose &&
              faceDirection === "Multiple faces detected"
            ) {
              setCount((prevCount) => prevCount + 1);
              captureAndSaveFrameFromVideo(boundingBox, direction);
            }

            context.fillStyle = "white";
            context.font = "16px Arial";
            context.fillText(
              `Yaw: ${pose.yaw.toFixed(1)} Pitch: ${pose.pitch.toFixed(1)}`,
              10,
              20
            );
          } else {
            setFaceDirection("No face detected");
          }
        }
      }, 100);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoPlay}
        width="720"
        height="560"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        width="720"
        height="560"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "20px",
          borderRadius: "5px",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        Looking for: {currentPose}
        <div>Your pose: {faceDirection}</div>
      </div>
    </div>
  );
}
