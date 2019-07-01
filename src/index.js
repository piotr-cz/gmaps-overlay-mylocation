/**
 * @copyright Copyright (C) 2019 Piotr Konieczny. All rights reserved
 * @license Proprietary
 */

/**
 * Available panes
 * @see [Docs]{@link https://developers.google.com/maps/documentation/javascript/reference/overlay-view#MapPanes}
 */
export const PANE = {
  MAP_PANE: 'mapPane',
  OVERLAY_LAYER: 'overlayLayer',
  MARKER_LAYER: 'markerLayer',
  // Using following panes render accuracy element over markers
  FLOAT_SHADOW: 'floatShadow', // Undocumented
  OVERLAY_IMAGE: 'overlayImage', // Undocumented
  OVERLAY_MOUSE_TARGET: 'overlayMouseTarget',
  FLOAT_PANE: 'floatPane'
}

/**
 * Factory
 * @param {google.maps} gMapsApi
 * @param {...*} [instanceArgs]
 * @return {function}
 */
export default function(gMapsApi, ...instanceArgs) {
  /**
   * Default marker icon
   */
  const DEFAULT_MARKER_ICON = {
    path: 'M 10, 10 m -7.5, 0 a 7.5,7.5 0 .1,0 15,0 a 7.5,7.5 0 .1,0 -15,0',
    anchor: new gMapsApi.Point(10, 10),
    fillColor: '#4285f4',
    fillOpacity: 1,
    scale: 0.9, // On desktop 10px
    strokeColor: 'white',
    strokeWeight: 1
  }

  /*
  // SVG markers drawn over accuracy element are flashing (redrawn)
  // This is particularly visible for position marker which is always over accuracy element
  const markerSvg = {
    size: 16,
    fillColor: '#4285f4',
    strokeWidth: 1,
  }

  const DEFAULT_MARKER_ICON = {
    url: `data:image/svg+xml;utf8,
<svg xmlns="http://www.w3.org/2000/svg" width="${markerSvg.size}" height="${markerSvg.size}">
<circle cx="50%" cy="50%" r="${(markerSvg.size - markerSvg.strokeWidth) / 2}" fill="${encodeURIComponent(markerSvg.fillColor)}" stroke="white" stroke-width="${markerSvg.strokeWidth}" />
</svg>`,
    anchor: new gMapsApi.Point(markerSvg.size / 2, markerSvg.size / 2),
    size: {width: markerSvg.size, height: markerSvg.size},
  }
  */

  /**
   * MyLocation overlay
   * [Docs]{@link https://developers.google.com/maps/documentation/javascript/reference/overlay-view}
   */
  class MylocationOverlay extends gMapsApi.OverlayView {
    /**
     * Constructor
     * @param {Object} [options]
     * @param {googe.maps.Map} options.map
     * @param {boolean} [options.showMarker]
     * @param {boolean} [options.showAccuracy]
     * @param {string} [options.paneName]
     * @param {Object} [options.markerIcon]
     * @param {function} [options.onAdded]
     */
    constructor({
      map = undefined,
      showMarker = true,
      showAccuracy = true,
      paneName = PANE.OVERLAY_LAYER,
      markerIcon = DEFAULT_MARKER_ICON,
      accuracyClassName = 'gmaps-overlay-mylocation-accuracy',
      onAdded = undefined
    } = {}) {
      super()

      if (!map && onAdded) {
        throw new Error('GmapsOverlayMylocation: Required to pass map instance when using onAdded callback')
      }

      this._options = {
        showMarker,
        showAccuracy,
        paneName,
        markerIcon,
        accuracyClassName,
        onAdded
      }

      this._state = {
        bounds: null,
        initializationPromise: null,
        isInitialized: false,
        isHidden: true
      }

      this._ref = {
        accuracy: null,
        marker: null
      }

      // Triggers side effect and onAdd method
      if (map) {
        this.setMap(map)
      }
    }

    /**
     * Get initialization promise
     * Overwrites onAdded callback
     * @param {google.maps.Map} [map]
     * @return {Promise}
     */
    initialize(map = undefined) {
      // Done
      if (this._state.isInitialized) {
        return Promise.resolve(this)
      }

      // Hasn't started yet
      if (!this._state.initializationPromise) {
        this._state.initializationPromise = new Promise(resolve => (this._options.onAdded = resolve))
      }

      if (map) {
        this.setMap(map)
      }

      return this._state.initializationPromise
    }

    /**
     * Set coordinates
     * @access public
     * @param {Coordinates} coords
     * @param {number} coords.latitude
     * @param {number} coords.longitude
     * @param {number} coords.accuracy
     * @param {boolean} [keepHidden]
     * @return {this}
     */
    setCoordinates(coords, keepHidden = false) {
      // Convert to LatLngLiteral
      const latLng = {
        lat: coords.latitude,
        lng: coords.longitude
      }

      // Recalculate state bounds used with draw
      const offset = this.constructor._distanceToAngle(latLng, coords.accuracy)

      this._state.bounds = new gMapsApi.LatLngBounds(
        { lat: latLng.lat - offset.lat, lng: latLng.lng - offset.lng },
        { lat: latLng.lat + offset.lat, lng: latLng.lng + offset.lng }
      )

      // Set marker position
      this._ref.marker.setPosition(latLng)

      if (!keepHidden) {
        this.show()
        this.draw()
      }

      return this
    }

    /**
     * Set accuracy
     * @param {number} accuracy
     * @return {this}
     */
    setAccuracy(accuracy, keepHidden = false) {
      if (!this._state.bounds) {
        throw new Error('GmapsOverlayMylocation: Coordinates must be set')
      }

      const boundsCenter = this._state.bounds.getCenter()

      this.setCoordinates(
        {
          latitude: boundsCenter.lat(),
          longitude: boundsCenter.lng(),
          accuracy
        },
        keepHidden
      )

      return this
    }

    /**
     * Initialize the overlay DOM elements
     * @access protected
     * @inheritdoc
     */
    onAdd() {
      // Create marker
      this._ref.marker = new gMapsApi.Marker({
        map: this.getMap(),
        clickable: false,
        draggable: false,
        visible: !this._state.isHidden,
        zIndex: 0, // When using svg, should be higher than number of other markers on map (-1)
        icon: this._options.markerIcon
      })

      const panes = this.getPanes()

      // Create accuracy element
      this._ref.accuracy = document.createElement('div')

      this._ref.accuracy.classList.add(this._options.accuracyClassName)
      this._ref.accuracy.classList.add(`${this._options.accuracyClassName}--pane-${this._options.paneName}`)

      if (this._state.isHidden) {
        this._ref.accuracy.classList.add(`${this._options.accuracyClassName}--hidden`)
      }

      panes[this._options.paneName].appendChild(this._ref.accuracy)

      // Mark as added
      this._state.isInitialized = true

      if (this._options.onAdded) {
        this._options.onAdded(this)
      }
    }

    /**
     * Remove elements from the DOM
     * @access protected
     * @inheritdoc
     */
    onRemove() {
      this._ref.marker.setMap(null)
      this._ref.marker = null

      this._ref.accuracy.parentNode.removeChild(this._ref.accuracy)
      this._ref.accuracy = null
    }

    /**
     * Draw or update the overlay
     * @access protected
     * @inheritdoc
     */
    draw() {
      // Skip when hidden or no bounds defined
      if (this._state.isHidden || !this._state.bounds) {
        return
      }

      const isInViewBounds = this.getMap()
        .getBounds()
        .intersects(this._state.bounds)

      // Toggle visibility depending on current viewport bounds
      this.toggle(isInViewBounds, true)

      // Skip drawing when outside of bounds
      if (!isInViewBounds) {
        return
      }

      const overlayProjection = this.getProjection()

      // Stretch container to bounds
      const sw = overlayProjection.fromLatLngToDivPixel(this._state.bounds.getSouthWest())
      const ne = overlayProjection.fromLatLngToDivPixel(this._state.bounds.getNorthEast())

      const width = ne.x - sw.x
      const height = sw.y - ne.y

      this._ref.accuracy.style.left = `${sw.x}px`
      this._ref.accuracy.style.top = `${ne.y}px`
      this._ref.accuracy.style.width = `${width}px`
      this._ref.accuracy.style.height = `${height}px`
    }

    /**
     * Show overlay
     * @access public
     * @return {this}
     */
    show(skipUpdateState = false) {
      if (!skipUpdateState) {
        this._state.isHidden = false
      }

      if (!this._state.isInitialized || !this._state.bounds) {
        return this
      }

      if (this._options.showAccuracy) {
        this._ref.accuracy.classList.remove(`${this._options.accuracyClassName}--hidden`)
      }

      if (this._options.showMarker) {
        this._ref.marker.setVisible(true)
      }

      return this
    }

    /**
     * Hide overlay
     * @access public
     * @return {this}
     */
    hide(skipUpdateState = false) {
      if (!skipUpdateState) {
        this._state.isHidden = true
      }

      if (!this._state.isInitialized || !this._state.bounds) {
        return this
      }

      if (this._options.showAccuracy) {
        this._ref.accuracy.classList.add(`${this._options.accuracyClassName}--hidden`)
      }

      if (this._options.showMarker) {
        this._ref.marker.setVisible(false)
      }

      return this
    }

    /**
     * Toggle overlay visibility on or off
     * @param {boolean} [state]
     * @return {this}
     */
    toggle(state = undefined, skipUpdateState = false) {
      // Invert current state
      if (state === undefined) {
        state = this._state.isHidden
      }

      if (state) {
        this.show(skipUpdateState)
      } else {
        this.hide(skipUpdateState)
      }

      return this
    }

    /**
     * Get marker
     * @return {google.maps.Marker}
     */
    getMarker() {
      return this._ref.marker
    }

    /**
     * Get accuracy element
     * @return {HTMLElement}
     */
    getAccuracyElement() {
      return this._ref.accuracyElement
    }

    /**
     * Convert distance from kilometers to angle in degreees based on given location
     * @access protected
     * @param {Object} latLng
     * @param {number} latLng.lat
     * @param {number} distance - In meters
     * @return {Object}
     */
    static _distanceToAngle(latLng, distance) {
      // Convert to KMs
      distance = distance / 1e3

      return {
        lat: distance * 0.009,
        lng: (distance * 0.009) / Math.cos((latLng.lat * Math.PI) / 180)
      }
    }
  }

  // Initialize
  if (instanceArgs.length) {
    return new MylocationOverlay(...instanceArgs)
  }

  // Return class
  return MylocationOverlay
}
