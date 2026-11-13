// onnxruntime-web's exports map has no "types" entry for its builds; they all
// share onnxruntime-common's API.
declare module 'onnxruntime-web' {
  export * from 'onnxruntime-common';
}

declare module 'onnxruntime-web/webgpu' {
  export * from 'onnxruntime-common';
}
