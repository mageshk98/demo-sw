const version_number = 7;
const staticAssets = `staticCache-${version_number}`;
const imageAssets = `imageCache-${version_number}`;
const dynamicCache = `dynamicCache-${version_number}`;

const Assets = ["/css/style.css", "/js/app.js", "/index.html", "/"];

const Images = ["/images/image-1.jpg"];

self.addEventListener("install", (ev) => {
  console.log("Install Event");
  ev.waitUntil(
    caches
      .open(staticAssets)
      .then((cache) => {
        return cache.addAll(Assets);
      })
      .then(() => {
        caches.open(imageAssets).then((cache) => {
          return cache.addAll(Images);
        });
      })
  );
  self.skipWaiting();
  //To cache files like html, css, images, js, json, fonts
});

self.addEventListener("activate", (ev) => {
  console.log("Activate Event");
  ev.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter(
              (key) =>
                key !== staticAssets &&
                key !== imageAssets &&
                key !== dynamicCache
            )
            .map((key) => {
              console.log("deleting stale cache", key);
              return caches.delete(key);
            })
        );
      })
      .then(() => clients.claim())
  );
  // to get rid of old cache files
});

self.addEventListener("fetch", (event) => {
  // intercept the fetch calls to get files from cache or server request
  //
  //
  // Cache Only
  // event.respondWith(caches.match(event.request));
  //
  // Network Only
  //
  // Cache First
  //   event.respondWith(
  //     caches.match(event.request).then((cachedResponse) => {
  //       return cachedResponse || fetch(event.request);
  //     })
  //   );
  //
  // Network First
  //   event.respondWith(
  //     fetch(event.request).catch((err) => {
  //       return caches.match(event.request);
  //     })
  //   );
  //Stale while revalidate
  //
  if (!(event.request.url.indexOf("http") === 0)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // update the cache with a clone of the network response
          const responseClone = response.clone();
          let type = response.headers.get("content-type");
          if (type && type.match(/^image\//i)) {
            caches.open(imageAssets).then((cache) => {
              cache.put(event.request, responseClone);
            });
          } else {
            caches.open(dynamicCache).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(function (reason) {
          console.error("ServiceWorker fetch failed: ", reason);
        });
      return cachedResponse || networkFetch;
    })
  );
});

self.addEventListener("message", async (ev) => {
  console.log("Message recevied on SW", ev);
  let data = ev.data;
  let allClients = [];
  let clientId = ev.source.id;

  //   if (clientId) {
  //     let client = await clients.get(clientId);
  //     allClients.push(client);
  //   }
  if (data.action === "update-theme") {
    allClients = await clients.matchAll();
  }
  return Promise.all(allClients.map((client) => client.postMessage(data)));
});
