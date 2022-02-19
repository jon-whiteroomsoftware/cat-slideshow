let wait = (ms, r) => new Promise((resolved) => setTimeout(resolved, ms, r));

function makeEnumObject(...keys) {
  return Object.freeze(
    keys.reduce((obj, str) => ({ ...obj, [str]: Symbol(str) }), {})
  );
}

function preloadImage(url) {
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
