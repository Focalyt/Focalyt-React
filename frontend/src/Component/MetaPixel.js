import { useEffect } from "react";

const MetaPixel = () => {
  useEffect(() => {
    // Check if fbq is already defined
    if (!window.fbq) {
      // ✅ Meta Pixel Script Add Karna
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ?
            n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      // ✅ Pixel ID Set Karna
      window.fbq('init', '3800389873545664'); // Apna Pixel ID Replace Karein
      window.fbq('track', 'PageView'); // PageView Event Fire Karein
    } else {
      // ✅ Agar script already loaded hai to sirf PageView event track karein
      window.fbq('track', 'PageView');
    }
  }, []);

  return null; // Component kuch render nahi karega, sirf tracking karega
};

export default MetaPixel;

