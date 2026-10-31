// Successful assets survive retries. Images remain decoded through the reveal.
const prepared = new Map();
export async function prepareAssets(assets, onProgress = () => {}, {concurrency = 6, timeout = 30000} = {}) {
  const total = assets.reduce((sum, asset) => sum + asset.bytes, 0) || 1;
  let completed = 0, cursor = 0;
  const failures = [];
  onProgress(0);
  async function load({url}) {
    if (prepared.has(url)) return;
    let timer;
    const controller = new AbortController();
    let image;
    try {
      const task = /\.(png|jpg|svg)$/.test(url) ? new Promise((resolve, reject) => {
        image = new Image(); image.decoding = 'async';
        image.onload = async () => { try { if (image.decode) await image.decode(); resolve(image); } catch (error) { reject(error); } };
        image.onerror = () => reject(new Error(`Artwork unavailable: ${url}`));
        image.src = url;
      }) : fetch(url, {signal:controller.signal, cache:'force-cache'}).then(async response => {
        if (!response.ok) throw new Error(`File unavailable: ${url}`);
        return response.arrayBuffer();
      });
      const result = await Promise.race([task, new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); if (image) image.src = ''; reject(new Error(`Loading timed out: ${url}`)); }, timeout);
      })]);
      prepared.set(url, result);
    } finally { clearTimeout(timer); }
  }
  async function worker() {
    while (cursor < assets.length) {
      const asset = assets[cursor++];
      try { await load(asset); completed += asset.bytes; onProgress(completed / total); }
      catch (error) { failures.push(error); }
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency, assets.length)}, worker));
  if (failures.length) throw new AggregateError(failures, `${failures.length} game files could not load`);
}
