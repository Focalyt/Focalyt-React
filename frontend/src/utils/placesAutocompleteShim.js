const OLD_MAPS_KEY = process.env.REACT_APP_AUTH_KEY_GOGGLE || "";

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.text || "";
}

function regionCodes(options) {
  const country = options?.componentRestrictions?.country;
  if (!country) return undefined;
  const list = (Array.isArray(country) ? country : [country])
    .map((code) => String(code).trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : undefined;
}

function primaryTypes(options) {
  const types = Array.isArray(options?.types) ? options.types : [];
  const broad = new Set(["geocode", "address", "(regions)", "(cities)"]);
  if (!types.length || types.some((type) => broad.has(type))) return undefined;
  return types.slice(0, 5);
}

function toLegacyPlace(place) {
  const loc = place.location;
  const lat = typeof loc?.lat === "function" ? loc.lat() : loc?.lat;
  const lng = typeof loc?.lng === "function" ? loc.lng() : loc?.lng;
  const hasPoint = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const rawComponents = place.addressComponents || place.toJSON?.().addressComponents || [];
  const components = (Array.isArray(rawComponents) ? rawComponents : Array.from(rawComponents)).map((component) => ({
    long_name: textOf(component.longText) || component.long_name || "",
    short_name: textOf(component.shortText) || component.short_name || "",
    types: Array.isArray(component.types) ? component.types : [],
  }));
  const formatted = textOf(place.formattedAddress) || textOf(place.displayName);

  return {
    name: textOf(place.displayName) || formatted,
    formatted_address: formatted,
    place_id: place.id || "",
    address_components: components,
    geometry: hasPoint
      ? {
          location: {
            lat: () => Number(lat),
            lng: () => Number(lng),
          },
        }
      : undefined,
  };
}

function setNativeValue(input, value) {
  input.value = value == null ? "" : String(value);
}

function mirrorInputValue(input, element, syncState) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  if (!descriptor?.get || !descriptor?.set || input._focalytValueMirror) return;
  Object.defineProperty(input, "value", {
    configurable: true,
    enumerable: true,
    get() {
      return descriptor.get.call(this);
    },
    set(next) {
      const text = next == null ? "" : String(next);
      descriptor.set.call(this, text);
      if (syncState?.fromWidget) return;
      if (element.isConnected && element.value !== text) element.value = text;
    },
  });
  input._focalytValueMirror = true;
}

function copyFieldStyle(input, element) {
  const style = window.getComputedStyle(input);
  element.style.width = "100%";
  element.style.flex = "1 1 auto";
  element.style.minWidth = "0";
  element.style.boxSizing = "border-box";
  element.style.colorScheme = "light";
  element.style.backgroundColor = style.backgroundColor || "#fff";
  element.style.color = style.color || "#212529";
  element.style.border = style.border || "1px solid #ced4da";
  element.style.borderRadius = style.borderRadius || "0.375rem";
  element.style.fontSize = style.fontSize || "14px";
  element.style.fontFamily = style.fontFamily;
  if (input.offsetHeight > 0) element.style.minHeight = `${input.offsetHeight}px`;
}

function createCompat() {
  function Autocomplete(input, options) {
    if (input && input._focalytPlacesInstance) return input._focalytPlacesInstance;
    if (!(this instanceof Autocomplete)) return new Autocomplete(input, options);

    this.__focalytPlaces = true;
    this.listeners = [];
    this.place = null;
    this._mount(input, options || {});
    if (input) input._focalytPlacesInstance = this;
    return this;
  }

  Autocomplete.__focalytCompat = true;

  Autocomplete.prototype.getPlace = function getPlace() {
    return this.place || {};
  };

  Autocomplete.prototype.addListener = function addListener(eventName, handler) {
    if (eventName === "place_changed" && typeof handler === "function") {
      this.listeners.push(handler);
    }
    return {
      remove: () => {
        this.listeners = this.listeners.filter((fn) => fn !== handler);
      },
    };
  };

  Autocomplete.prototype._mount = function mount(input, options) {
    if (!input || input.nodeType !== 1) return;

    const PlaceAutocompleteElement = window.google?.maps?.places?.PlaceAutocompleteElement;
    if (!PlaceAutocompleteElement) return;

    const regions = regionCodes(options);
    const types = primaryTypes(options);
    const elementOptions = {};
    if (regions) elementOptions.includedRegionCodes = regions;
    if (types) elementOptions.includedPrimaryTypes = types;

    let element;
    try {
      element = new PlaceAutocompleteElement(elementOptions);
    } catch (error) {
      console.error("Places autocomplete failed to start", error);
      return;
    }

    element.classList.add("focalyt-places-input");
    copyFieldStyle(input, element);
    if (input.getAttribute("placeholder")) element.placeholder = input.getAttribute("placeholder");
    if (input.maxLength > 0) element.maxlength = input.maxLength;
    if (input.value) element.value = input.value;

    input.classList.add("focalyt-places-source");
    input.insertAdjacentElement("afterend", element);

    let applyingPlace = false;
    const syncState = { fromWidget: false };
    mirrorInputValue(input, element, syncState);

    const widgetText = () => (element.value == null ? "" : String(element.value));

    // The visible box is Google's widget. Typed text that is not a map place
    // still has to reach the hidden input, or React keeps the field empty.
    const syncTypedValue = (event) => {
      if (applyingPlace) return;
      const target = event?.target;
      const text = target && target !== element && typeof target.value === "string"
        ? target.value
        : widgetText();
      if (input.value === text) return;
      syncState.fromWidget = true;
      setNativeValue(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      window.setTimeout(() => {
        syncState.fromWidget = false;
      }, 0);
    };

    const bindInnerInput = () => {
      const root = element.shadowRoot;
      const inner = root && root.querySelector("input, textarea");
      if (!inner || inner._focalytTypedSync) return;
      inner._focalytTypedSync = true;
      inner.addEventListener("input", syncTypedValue);
      inner.addEventListener("change", syncTypedValue);
    };

    element.addEventListener("input", syncTypedValue);
    element.addEventListener("change", syncTypedValue);
    element.addEventListener("focusout", () => {
      if (applyingPlace) return;
      const text = widgetText();
      const selected = this.place;
      if (selected) {
        const formatted = selected.formatted_address || "";
        const name = selected.name || "";
        if (text === formatted || text === name) return;
      }
      syncTypedValue();
    });
    bindInnerInput();
    window.requestAnimationFrame(bindInnerInput);

    const emit = () => {
      this.listeners.slice().forEach((handler) => {
        try {
          handler();
        } catch (error) {
          console.error(error);
        }
      });
    };

    const applyPlace = async (event) => {
      const placePrediction = event?.placePrediction || event?.detail?.placePrediction;
      if (!placePrediction?.toPlace) return;
      const predictionId = placePrediction.placeId || "";
      if (predictionId && predictionId === element._focalytLastPrediction) return;
      element._focalytLastPrediction = predictionId;

      try {
        const place = placePrediction.toPlace();
        try {
          await place.fetchFields({
            fields: ["formattedAddress", "location", "addressComponents", "displayName", "id"],
          });
        } catch (error) {
          await place.fetchFields({ fields: ["formattedAddress", "location", "displayName"] });
        }

        this.place = toLegacyPlace(place);
        const formatted = this.place.formatted_address || this.place.name || "";
        applyingPlace = true;
        try {
          if (formatted) {
            element.value = formatted;
            setNativeValue(input, formatted);
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
          emit();
        } finally {
          window.setTimeout(() => {
            applyingPlace = false;
          }, 0);
        }
      } catch (error) {
        applyingPlace = false;
        console.error("Places lookup failed", error);
      }
    };

    element.addEventListener("gmp-select", applyPlace);
    element.addEventListener("gmp-placeselect", applyPlace);

    const observer = new MutationObserver(() => {
      if (!input.isConnected) {
        observer.disconnect();
        element.remove();
        return;
      }
      if (!element.isConnected) input.insertAdjacentElement("afterend", element);
      input.classList.add("focalyt-places-source");
    });
    if (input.parentElement) observer.observe(input.parentElement, { childList: true });
  };

  return Autocomplete;
}

const pendingAutocomplete = [];

function rememberQueued(input, shell, options) {
  pendingAutocomplete.push({ input, shell, options });
  if (input) input._focalytPlacesInstance = shell;
}

function ensureAutocompleteQueue() {
  const maps = window.google?.maps;
  if (!maps || maps.__focalytPlacesHook || maps.places?.PlaceAutocompleteElement || maps.places?.Autocomplete?.__focalytCompat) {
    return;
  }

  function QueuedAutocomplete(input, options) {
    if (input?._focalytPlacesInstance) return input._focalytPlacesInstance;
    const shell = {
      __focalytPlaces: true,
      listeners: [],
      place: null,
      getPlace() {
        return this.place || {};
      },
      addListener(eventName, handler) {
        if (eventName === "place_changed" && typeof handler === "function") this.listeners.push(handler);
        return { remove() {} };
      },
    };
    rememberQueued(input, shell, options || {});
    return shell;
  }
  QueuedAutocomplete.__focalytQueue = true;

  let realPlaces = maps.places;
  const queuedPlaces = realPlaces || { Autocomplete: QueuedAutocomplete };
  if (realPlaces) realPlaces.Autocomplete = QueuedAutocomplete;

  try {
    Object.defineProperty(maps, "places", {
      configurable: true,
      enumerable: true,
      get() {
        return realPlaces || queuedPlaces;
      },
      set(value) {
        realPlaces = value || realPlaces;
        if (realPlaces && !realPlaces.Autocomplete?.__focalytCompat) {
          realPlaces.Autocomplete = QueuedAutocomplete;
        }
        installAutocomplete(realPlaces);
        flushAutocompleteQueue();
      },
    });
    maps.__focalytPlacesHook = true;
  } catch (error) {
    if (!maps.places) maps.places = queuedPlaces;
    else maps.places.Autocomplete = QueuedAutocomplete;
  }
}

function flushAutocompleteQueue() {
  const places = window.google?.maps?.places;
  if (!pendingAutocomplete.length || !places?.Autocomplete?.__focalytCompat) return;
  const pending = pendingAutocomplete.splice(0, pendingAutocomplete.length);
  pending.forEach(({ input, shell, options }) => {
    if (input) delete input._focalytPlacesInstance;
    const created = new places.Autocomplete(input, options);
    shell.listeners.forEach((handler) => created.addListener("place_changed", handler));
    shell.getPlace = () => created.getPlace();
    shell.addListener = (eventName, handler) => created.addListener(eventName, handler);
    shell.listeners = created.listeners;
  });
}

function installAutocomplete(places) {
  if (!places?.PlaceAutocompleteElement) return false;
  if (places.Autocomplete?.__focalytCompat) return true;

  const Compat = createCompat();
  try {
    Object.defineProperty(places, "Autocomplete", {
      configurable: true,
      enumerable: true,
      get() {
        return Compat;
      },
      set() {},
    });
  } catch (error) {
    places.Autocomplete = Compat;
  }
  return true;
}

function patchClearListeners() {
  const mapsEvent = window.google?.maps?.event;
  if (!mapsEvent || mapsEvent.__focalytPatched || typeof mapsEvent.clearInstanceListeners !== "function") return;
  const original = mapsEvent.clearInstanceListeners.bind(mapsEvent);
  mapsEvent.clearInstanceListeners = (instance) => {
    if (instance?.__focalytPlaces) {
      instance.listeners = [];
      return;
    }
    try {
      return original(instance);
    } catch (error) {
      return undefined;
    }
  };
  mapsEvent.__focalytPatched = true;
}

function callbackName(src) {
  try {
    return new URL(src, window.location.href).searchParams.get("callback");
  } catch (error) {
    return null;
  }
}

function blockLegacyMapsScript(node) {
  if (!OLD_MAPS_KEY || !node || node.tagName !== "SCRIPT" || typeof node.src !== "string" || !node.src.includes(OLD_MAPS_KEY)) {
    return false;
  }
  const name = callbackName(node.src);
  node.removeAttribute("src");
  if (node.parentNode) node.parentNode.removeChild(node);
  if (name && typeof window[name] === "function") {
    window.__focalytPlacesReady
      .then(() => window[name]())
      .catch(() => {});
  }
  return true;
}

function patchScriptInsertion() {
  if (Element.prototype.__focalytScriptPatch) return;
  const appendChild = Element.prototype.appendChild;
  const insertBefore = Element.prototype.insertBefore;
  Element.prototype.appendChild = function appendChildPatched(node) {
    if (blockLegacyMapsScript(node)) return node;
    return appendChild.call(this, node);
  };
  Element.prototype.insertBefore = function insertBeforePatched(node, reference) {
    if (blockLegacyMapsScript(node)) return node;
    return insertBefore.call(this, node, reference);
  };
  Element.prototype.__focalytScriptPatch = true;
}

function waitFor(predicate, timeoutMs) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (predicate()) {
        window.clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("Google Maps did not load"));
      }
    }, 30);
  });
}

async function loadLibrary(name) {
  try {
    await window.google.maps.importLibrary(name);
  } catch (error) {
    console.warn(`Google Maps library "${name}" did not load`, error);
  }
}

async function boot() {
  patchScriptInsertion();
  await waitFor(() => window.google?.maps?.importLibrary, 20000);
  ensureAutocompleteQueue();
  await loadLibrary("maps");
  await loadLibrary("places");
  await loadLibrary("geocoding");
  await loadLibrary("geometry");
  installAutocomplete(window.google.maps.places);
  flushAutocompleteQueue();
  patchClearListeners();

  const timer = window.setInterval(() => {
    installAutocomplete(window.google?.maps?.places);
    flushAutocompleteQueue();
    patchClearListeners();
  }, 250);
  window.setTimeout(() => window.clearInterval(timer), 10000);
}

if (!window.__focalytPlacesReady) {
  window.__focalytPlacesReady = boot();
}
