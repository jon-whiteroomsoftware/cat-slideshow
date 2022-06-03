function wait(ms: number, r: any = null) {
  return new Promise((resolved) => setTimeout(resolved, ms, r));
}

function makeEnumObject(...keys: Array<string>) {
  return Object.freeze(
    keys.reduce((obj, str) => ({ ...obj, [str]: Symbol(str) }), {})
  );
}

function preloadImage(url: string) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = img.onabort = function () {
      reject(url);
    };
    img.src = url;
  });
}

export { wait, makeEnumObject, preloadImage };
