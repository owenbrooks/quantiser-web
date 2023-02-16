import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useState } from "react";

const ffmpeg = createFFmpeg({ log: true });

function useFfmpeg() {
  const [errorMsg, setErrorMsg] = useState<string>();

  const loadLibrary = async () => {
    await ffmpeg.load();
  };

  useEffect(() => {
    if (!ffmpeg.isLoaded()) {
        loadLibrary().catch(e => {
          if (e instanceof RangeError) {
            const message = "Error: Out of memory. This application requires significant memory to run. For best results, use a desktop machine."
            setErrorMsg(message);
          } else if (e instanceof Error) {
            const message = "An error was encountered. For best results use a desktop machine. Error: " + e.message;
            setErrorMsg(message);
          }
        });
    }
  }, []);

  return {
    ffmpeg,
    isLoaded: ffmpeg.isLoaded,
    isError: errorMsg !== null,
    errorMsg,
  };
}

export default useFfmpeg;
