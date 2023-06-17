import { useEffect, useState, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as tmImage from "@teachablemachine/image";
import Webcam from "react-webcam";

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
  const [model, setModel] = useState<tmImage.CustomMobileNet>();
  const webcamRef = useRef<Webcam>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const loopId = useRef<number | null>(null);
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

  async function loadModel() {
    try {
      const model = await tmImage.load(modelURL, metadataURL);
      setModel(model);
      console.log("set loaded Model");
    } catch (err) {
      console.log(err);
      console.log("failed load model");
    }
  }

  function detectionStop() {
    if (loopId.current) {
      capture();
      clearInterval(loopId.current);
    }
  }

  async function decetionStart() {
    setShowImage(false);
    setDetectedName("");
    //Start prediction

    const predictions = await model?.predictTopK(
      document.getElementById("img") as HTMLImageElement,
      3
    );

    console.log(predictions);

    //Rerun prediction by timeout
    loopId.current = setTimeout(() => decetionStart(), 500);

    predictions?.forEach((p) => {
      if (p.probability > 0.8 && p.className != "nothing") {
        setDetectedName(p.className);
        detectionStop();
      }
    });
  }

  useEffect(() => {
    tf.ready().then(() => {
      loadModel();
    });
  }, []);

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

      <div className="flex gap-8">
        <button
          className="rounded-full bg-red-300 px-5 py-2 text-white duration-200 hover:shadow-md"
          onClick={() => {
            decetionStart();
          }}
        >
          Mulai
        </button>
      </div>
    </div>
  );
}

export default App;
