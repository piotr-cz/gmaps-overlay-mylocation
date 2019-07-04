# My location Google Maps overlay
Show [Coordinates](https://developer.mozilla.org/en-US/docs/Web/API/Coordinates) (latitude, longitude, accuracy) on map

Why not just draw [circle shape](https://developers.google.com/maps/documentation/javascript/examples/circle-simple)to show accuracy area ?
- Package is using a HTML element to draw accuracy area. It's easier to style HTML element and work with native events than when using [google.maps.Circle](https://developers.google.com/maps/documentation/javascript/reference/polygon#Circle)
- It's possible to choose pane layer.
  This is handy when using multiple overlays.


![screenshot](./images/screenshot.png)

## Installation
```sh
npm install @piotr-cz/gmaps-overlay-mylocation
```


## Setup

```js
import mylocationOverlayFactory from 'gmaps-overlay-mylocation'
import '@piotr-cz/gmaps-overlay-mylocation/dist/index.css'

// Initialize Google Maps API your way
//...

// Initialize overlay using callback
const mylocationOverlay = mylocationOverlayFactory(google.maps, {
  map: mapInstance,
  onAdded: mylocationOverlay => console.log('MylocationOverlay: Initialized, may set coords now')
})

```

It's also possible to receive promise instead of using callback

```js
// Initialize overlay aynchronously(requires Promise support)
const mylocationOverlay = mylocationOverlayFactory(google.maps)

await mylocationOverlay.initialize(mapInstance)
```


## Usage

```js
// Get position
const position = await new Promise((resolve, reject) =>
  window.navigator.geolocation.getCurrentPosition(resolve, reject, {enableHighAccuracy: true})
)

// Set coordinates and show
mylocationOverlay.setCoordinates(position.coords)
```


## Options

- _{google.maps.Map}_ **map** - Map
- _{boolean}_ **showMarker** - Show marker (defaults to `true`)
- _{boolean}_ **showAccuracy** - Show accuracy area (defaults to `true`)
- _{string}_ **paneName** - Define pane to use for accuracy element (defaults to `overlayLayer`, see [MapPanes](https://developers.google.com/maps/documentation/javascript/reference/overlay-view#MapPanes))
- _{Object|string}_ **markerIcon** - Pass custom marker definition (see [Icon](https://developers.google.com/maps/documentation/javascript/reference/marker#Icon)|[Symbol](https://developers.google.com/maps/documentation/javascript/reference/marker#Symbol))
- _{string}_ **accuracyClassName** - Accuracy element className (Defaults to `gmaps-overlay-mylocation-accuracy`)
- _{function}_ **onAdded** - Overlay initialized callback


## Methods

- **setCoordinates(coords: Coordinates)** - Set [Coordinates](https://developer.mozilla.org/en-US/docs/Web/API/Coordinates). Automatically shows overlay
- **show()** - Show overlay
- **hide()** - Hide overlay
- **toggle(state: boolean)** - Toggle overlay visibility
- **getMarker(): google.maps.Marker** - Get marker
- **getAccuracyElement(): HTMLElement** - Get accuracy element
