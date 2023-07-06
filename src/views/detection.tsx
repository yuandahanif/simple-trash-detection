/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as tmImage from "@teachablemachine/image";
import Webcam from "react-webcam";

import * as cocoSsd from "@tensorflow-models/coco-ssd";

const videoWidth = 500;
const videoHeight = 500;
const videoConstraints = {
  height: videoWidth,
  width: videoHeight,
  facingMode: "environment",
};

const URL = "/model/trash/";
const modelURL = URL + "model.json";
const metadataURL = URL + "metadata.json";

function Detection({ onStepEnd }: { onStepEnd: () => void }) {
  const mascotContainerRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const objectDetectionIdRef = useRef<number | null>(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet>();
  const [cocoSsdModel, setCocoSsdModel] = useState<cocoSsd.ObjectDetection>();
  const [detectedName, setDetectedName] = useState("");
  const [binResult, setBinResult] = useState<
    "trash" | "recycle" | "compost" | "none"
  >("none");

  const [detectionStep, setDetectionStep] = useState<
    "person" | "trash" | "bin" | "result"
  >("person");

  const [showImage, setShowImage] = useState(false);

  const drawBox = useCallback(
    (
      {
        x,
        y,
        w,
        h,
        text,
      }: {
        text: string;
        x: number;
        y: number;
        w: number;
        h: number;
      },
      clear?: boolean
    ) => {
      const ctx = canvasRef.current?.getContext("2d");

      if (!ctx) return;

      ctx.clearRect(0, 0, videoWidth, videoHeight);
      if (clear) return;

      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(videoWidth - x - w, y, w, h);

      ctx.fillStyle = "red";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(text, videoWidth - x - w + w * 0.5, y - 14);
    },
    []
  );

  const displayMascot = () => {
    if (mascotContainerRef.current == null) return;
    const springTransform = [
      { opacity: "1" },
      { transform: "scale(.9)" },
      { transform: "scale(1.1)" },
      { transform: "scale(1)" },
    ];

    // mascotContainerRef.current.style.opacity = "0";
    mascotContainerRef.current.classList.replace("hidden", "flex");
    mascotContainerRef.current?.animate(springTransform, {
      duration: 1000,
      iterations: 1,
      endDelay: 2000,
    });

    setTimeout(() => {
      if (mascotContainerRef.current == null) return;
      mascotContainerRef.current.classList.replace("flex", "hidden");
    }, 3000);
  };

  async function loadModel() {
    try {
      const model = await tmImage.load(modelURL, metadataURL);
      const coco = await cocoSsd.load();
      setModel(model);
      setCocoSsdModel(coco);
      console.log("set loaded Model");
    } catch (err) {
      console.log(err);
      console.log("failed load model");
    }
  }

  const trashDetection = useCallback(async () => {
    setShowImage(false);
    setDetectedName("");
    const img = document.getElementById("img") as HTMLImageElement;

    //Start prediction
    const predictions = await model?.predictTopK(img, 3);

    console.log(predictions);

    predictions?.forEach((p) => {
      if (p.probability > 0.9 && p.className != "nothing") {
        setDetectedName(p.className);
        setDetectionStep("bin");
      }
    });
  }, [model]);

  const objectDetection = useCallback(async () => {
    const img = document.getElementById("img") as HTMLImageElement;

    const prediction = await cocoSsdModel?.detect(img);

    console.log(prediction);

    prediction?.forEach((obj) => {
      drawBox(
        {
          x: obj.bbox[0],
          y: obj.bbox[1],
          w: obj.bbox[2],
          h: obj.bbox[3],
          text: obj.class == "person" ? "Yuanda" : obj.class,
        },
        obj.score < 0.6
      );

      if (obj.class == "person" && obj.score > 0.6) {
        setDetectionStep("trash");
      }
    });
  }, [cocoSsdModel, drawBox]);

  const stoptDetection = () => {
    if (objectDetectionIdRef.current) {
      clearInterval(objectDetectionIdRef.current);
    }
  };

  const detection = useCallback(() => {
    if (detectionStep == "person") {
      objectDetection();
    }

    if (detectionStep == "trash") {
      // trashDetection();
      const keydownListener = (e: KeyboardEvent) => {
        if (e.code == "ArrowRight") {
          stoptDetection();
          setDetectionStep("bin");
          window.removeEventListener("keydown", keydownListener);
        }
      };
      window.addEventListener("keydown", keydownListener);
    }

    if (detectionStep == "bin") {
      // * SIMULASI deteksi sensor benar
      const keydownListener = (e: KeyboardEvent) => {
        if (e.code == "ArrowUp") {
          stoptDetection();
          displayMascot();
          setDetectionStep("result");
          setBinResult("recycle");
          window.removeEventListener("keydown", keydownListener);
        }

        if (e.code == "ArrowDown") {
          stoptDetection();
          setBinResult("trash");
          window.removeEventListener("keydown", keydownListener);
        }
      };
      window.addEventListener("keydown", keydownListener);
    }

    if (detectionStep == "result") {
      // displayMascot();
      setDetectionStep("person");
      onStepEnd();
    }

    objectDetectionIdRef.current = setTimeout(() => detection(), 1000);
  }, [detectionStep, objectDetection]);

  useEffect(() => {
    tf.ready()
      .then(() => {
        return loadModel();
      })
      .finally(() => {
        setModelLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (modelLoaded) {
      detection();
    }

    return () => stoptDetection();
  }, [detection, modelLoaded, objectDetection]);

  return (
    <div className="mx-auto flex h-screen w-fit flex-col items-center justify-center gap-4 ">
      <div
        className={`relative`}
        style={{ width: videoWidth, height: videoHeight }}
      >
        <div
          className={`relative overflow-hidden rounded-md border-[.6em] border-[#00DA7E] bg-[#00DA7E]`}
          style={{ width: videoWidth, height: videoHeight }}
        >
          <Webcam
            audio={false}
            id="img"
            className={`absolute rounded-sm w-[${videoWidth}px] h-[${videoHeight}px]`}
            ref={webcamRef}
            screenshotQuality={1}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            mirrored
          />

          <canvas
            ref={canvasRef}
            className="absolute"
            width={videoWidth}
            height={videoHeight}
          />

          <img
            alt="foto"
            ref={imgRef}
            className="absolute grayscale"
            style={{
              width: videoWidth - 50,
              height: videoHeight - 50,
              display: showImage ? "none" : "none",
              translate: "25px 25px",
            }}
          />
        </div>

        <img
          alt="logo"
          src="/images/logo.png"
          className="absolute top-0 -translate-x-1/3 -translate-y-1/3"
        />

        <img
          alt="trash left"
          src="/images/trash-left.png"
          className="absolute bottom-0 -translate-x-1/2 translate-y-1/3"
        />
        <img
          alt="trash right"
          src="/images/trash-right.png"
          className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3"
        />

        {detectedName != "" && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-md bg-green-400 px-3 py-1 text-center text-white">
            {detectedName}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="rounded-md bg-green-400 px-3 py-1 text-center text-xl text-white">
          {detectionStep == "person" &&
            "Perlihatkan wajah anda kedalam kamera!"}
          {detectionStep == "trash" &&
            "Wajah terdeteksi! Perlihatkan sampah ke kamera!"}
          {detectionStep == "bin" &&
            "Sampah terdeteksi! Silahkan pilih tempat sampah"}
        </div>
      </div>

      <div
        ref={mascotContainerRef}
        className="fixed hidden h-96 w-96 flex-col items-center justify-center gap-3 rounded-lg bg-green-400 text-white shadow-xl"
      >
        <img src="/images/mascot-happy.png" className="animate-bounce" />
        <span className="text-2xl font-semibold">100 Buat kamu</span>
      </div>
    </div>
  );
}

export default Detection;
