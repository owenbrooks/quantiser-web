# Quantiser
A web application to demonstrate the effects of performing [DCT quantisation](https://cs.stanford.edu/people/eroberts/courses/soco/projects/data-compression/lossy/jpeg/dct.htm) between frames.

<img width="759" alt="quantiser-screenshot" src="https://user-images.githubusercontent.com/7232997/219260075-1b216e7d-829c-4b86-a37d-28e7b23ff8cb.png">

Video processing is done in a rust library compiled to web assembly: https://github.com/owenbrooks/squish. Conversion of videos between formats is handled by [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm).

## Requirements
- [node.js](https://nodejs.org/en/)
- [rust](https://www.rust-lang.org/)

## Installation
```
git clone https://github.com/owenbrooks/quantiser-web
cd quantiser-web
npm install
npm run dev
```