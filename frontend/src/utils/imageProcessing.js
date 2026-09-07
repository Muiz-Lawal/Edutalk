const readBitmap = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('The selected image could not be read.'));
  };
  image.src = url;
});

export async function processImage(file, aspectRatio, maxWidth, quality = 0.84) {
  const image = await readBitmap(file);
  const sourceRatio = image.width / image.height;
  let cropWidth = image.width;
  let cropHeight = image.height;

  if (sourceRatio > aspectRatio) {
    cropWidth = Math.round(image.height * aspectRatio);
  } else {
    cropHeight = Math.round(image.width / aspectRatio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.min(maxWidth, cropWidth);
  canvas.height = Math.round(canvas.width / aspectRatio);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image processing is unavailable in this browser.');

  context.drawImage(
    image,
    Math.round((image.width - cropWidth) / 2),
    Math.round((image.height - cropHeight) / 2),
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return {
    url: canvas.toDataURL('image/jpeg', quality),
    width: canvas.width,
    height: canvas.height,
  };
}

export function createLqip(dataUrl) {
  const image = new Image();
  image.src = dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.filter = 'blur(3px)';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.35);
}
