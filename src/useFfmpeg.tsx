import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useState } from "react";

const ffmpeg = createFFmpeg({ log: true });

function useFfmpeg() {
  const [isLoaded, setLoaded] = useState(false);

  const loadLibrary = async () => {
    await ffmpeg.load();
    setLoaded(true);
  };

  useEffect(() => {
    if (!ffmpeg.isLoaded()) {
        loadLibrary();
    }
  }, []);

  return {
    ffmpeg,
    isLoaded: ffmpeg.isLoaded(),
  };
}

export default useFfmpeg;
