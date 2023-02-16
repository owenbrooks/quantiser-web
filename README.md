# Quantiser
A web application to demonstrate the effects of performing [DCT quantisation](https://cs.stanford.edu/people/eroberts/courses/soco/projects/data-compression/lossy/jpeg/dct.htm) between frames.

<img width="759" alt="quantiser-screenshot" src="https://user-images.githubusercontent.com/7232997/219260075-1b216e7d-829c-4b86-a37d-28e7b23ff8cb.png">

An example of quantisation performed on the DCT coefficients between frames (temporally):
<video src="https://user-images.githubusercontent.com/7232997/219350424-bfc27c17-178c-44ef-bcaa-bdd0747b8f41.mp4" controls loop />

Video processing is done in a rust library compiled to web assembly: https://github.com/owenbrooks/squish. Conversion of videos between formats is handled by [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm).

## Requirements
- [node.js](https://nodejs.org/en/) (Developed using v19.4.0)
- [rust](https://www.rust-lang.org/) (Developed using 1.65.0)

## Installation
```
git clone https://github.com/owenbrooks/quantiser-web
cd quantiser-web
npm install
npm run dev
```
