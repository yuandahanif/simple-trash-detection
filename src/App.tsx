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

function App() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const trashDetectionIdRef = useRef<number | null>(null);
  const objectDetectionIdRef = useRef<number | null>(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet>();
  const [cocoSsdModel, setCocoSsdModel] = useState<cocoSsd.ObjectDetection>();
  const [detectedName, setDetectedName] = useState("");

  const [showImage, setShowImage] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();

      if (imgRef.current && imageSrc) {
        setShowImage(true);
        imgRef.current.src = imageSrc;
      }
    }
  }, [webcamRef]);

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

  function trashDetectionStop() {
    if (trashDetectionIdRef.current) {
      capture();
      clearInterval(trashDetectionIdRef.current);
    }
  }

  async function trashDetection() {
    setShowImage(false);
    setDetectedName("");
    const img = document.getElementById("img") as HTMLImageElement;

    //Start prediction
    const predictions = await model?.predictTopK(img, 3);

    console.log(predictions);

    //Rerun prediction by timeout
    trashDetectionIdRef.current = setTimeout(() => trashDetection(), 500);

    predictions?.forEach((p) => {
      if (p.probability > 0.8 && p.className != "nothing") {
        setDetectedName(p.className);
        trashDetectionStop();
      }
    });
  }

  const stopObjectDetection = () => {
    if (objectDetectionIdRef.current) {
      clearInterval(objectDetectionIdRef.current);
    }
  };

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
          text: obj.class,
        },
        obj.score < 0.6
      );
    });

    objectDetectionIdRef.current = setTimeout(() => objectDetection(), 500);
  }, [cocoSsdModel, drawBox]);

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
      objectDetection();
    }

    return () => stopObjectDetection();
  }, [modelLoaded, objectDetection]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <div
        className={`relative bg-white`}
        style={{ width: videoWidth, height: videoHeight }}
      >
        <Webcam
          audio={false}
          id="img"
          className={`absolute w-[${videoWidth}px] h-[${videoHeight}px]`}
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
            display: showImage ? "block" : "none",
            translate: "25px 25px",
          }}
        />
        {detectedName != "" && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-white">
            {detectedName}
            <br />
          </div>
        )}
      </div>

      {modelLoaded && (
        <div className="flex gap-8">
          <button
            className="rounded-full bg-red-300 px-5 py-2 text-white duration-200 hover:shadow-md"
            onClick={() => {
              trashDetection();
            }}
          >
            Mulai
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
