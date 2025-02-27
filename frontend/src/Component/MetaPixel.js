import { useEffect } from "react";

const MetaPixel = () => {
  useEffect(() => {
    // ✅ Check if fbq is already defined
    if (!window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return; 
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; 
        n.push = n; 
        n.loaded = true; 
        n.version = '2.0'; 
        n.queue = []; 
        t = b.createElement(e); 
        t.async = true;
        t.src = v; 
        s = b.getElementsByTagName(e)[0]; 
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', '3800389873545664'); // ✅ Apna Pixel ID replace karein
      window.fbq('track', 'PageView');

      // ✅ Add <noscript> manually for users with JS disabled
      const noscriptTag = document.createElement("noscript");
      const img = document.createElement("img");
      img.src = "https://www.facebook.com/tr?id=3800389873545664&ev=PageView&noscript=1";
      img.height = 1;
      img.width = 1;
      img.style.display = "none";
      noscriptTag.appendChild(img);
      document.body.appendChild(noscriptTag);
    } else {
      // ✅ Agar script already loaded hai to sirf PageView event track karein
      window.fbq('track', 'PageView');
    }
  }, []);

  return null; // Component kuch render nahi karega, sirf tracking karega
};

export default MetaPixel;
