import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import useFfmpeg from "./useFfmpeg";
import { fetchFile } from "@ffmpeg/ffmpeg";

type VideoPlayerProps = {
  src: string | undefined;
};

function VideoPlayer(props: VideoPlayerProps) {
  if (!props.src) {
    return null;
  }

  return <video className="py-3 max-w-lg" src={props.src} controls />;
}

function App() {
  const { ffmpeg, isLoaded } = useFfmpeg();

  const [videoSrc, setVideoSrc] = useState<string>();

  const transcode = async ({ target: { files } }) => {
    if (isLoaded) {
      const { name } = files[0];
      ffmpeg.FS("writeFile", name, await fetchFile(files[0]));
      await ffmpeg.run("-i", name, "output.mp4");
      const data = ffmpeg.FS("readFile", "output.mp4");
      setVideoSrc(
        URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
      );
    }
  };

  return (
    <div className="App py-3">
      <h1 className="py-3 text-6xl font-extralight">Quantise</h1>
      <input className="py-3" type="file" id="uploader" onChange={transcode} />
      <VideoPlayer src={videoSrc} />
    </div>
  );
}

export default App;
