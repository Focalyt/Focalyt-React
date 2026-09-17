import React, { useState } from "react";
import { Check, Clock, Heart, Play, Star } from "lucide-react";
import FrontLayout from "../../../Component/Layouts/Front";

const PROPERTIES = [
  {
    id: "taj-palace",
    name: "The Taj Mahal Palace, Mumbai",
    stars: 5,
    location: "Colaba, Mumbai",
    distance: "About a minute walk to The Taj Mahal Palace",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Taj_Mahal_Palace_Hotel.jpg?width=960",
    imageFallback:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=960&q=80",
    mediaCount: "1115 Photos & Videos",
    ratingLabel: "Excellent",
    rating: "4.6",
    ratingCount: "1673 Ratings",
    price: "27,000",
    taxes: "4,860",
    perks: [
      { type: "gift", text: "Get Taj Gift Card worth INR 3000 for Dining & Spa" },
      { type: "clock", text: "Guaranteed Early Check-in/Late Check-out available" },
      { type: "heritage", text: "Enjoy guided Heritage Walk of the Palace and learn about its history" },
    ],
  },
  {
    id: "taj-tower",
    name: "Taj Mahal Tower, Mumbai",
    stars: 5,
    location: "Colaba, Mumbai",
    distance: "100 m from The Taj Mahal Palace, Mumbai",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=960&q=80",
    imageFallback:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=960&q=80",
    mediaCount: "2657 Photos & Videos",
    ratingLabel: "Excellent",
    rating: "4.7",
    ratingCount: "5897 Ratings",
    price: "18,500",
    taxes: "3,330",
    perks: [
      { type: "gift", text: "Get Taj Gift Card worth INR 2500 for Dining & Spa" },
      { type: "dot", text: "Complimentary Welcome Drink on arrival" },
      {
        type: "heritage",
        text: "Experience stunning views of the Gateway of India, excellent hospitality, fine dining options",
      },
    ],
  },
];

function StarRow({ count }) {
  return (
    <span className="htl-stars" aria-label={`${count} star hotel`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill="#f5b301" stroke="#f5b301" />
      ))}
    </span>
  );
}

function PerkIcon({ type }) {
  if (type === "gift") return <Check size={14} strokeWidth={2.6} />;
  if (type === "clock") return <Clock size={14} strokeWidth={2.2} />;
  if (type === "dot") return <span className="htl-perk-dot" />;
  return <span className="htl-perk-diamond" aria-hidden />;
}

function PropertyCard({ property, featured }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className={`htl-card${featured ? " is-featured" : ""}`}>
      <div className="htl-media">
        <img
          src={property.image}
          alt={property.name}
          onError={(e) => {
            if (property.imageFallback && e.currentTarget.src !== property.imageFallback) {
              e.currentTarget.src = property.imageFallback;
            }
          }}
        />
        <button
          type="button"
          className={`htl-heart${saved ? " is-saved" : ""}`}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          onClick={() => setSaved((v) => !v)}
        >
          <Heart size={16} fill={saved ? "#e11d48" : "none"} stroke={saved ? "#e11d48" : "#fff"} />
        </button>
        <div className="htl-dots" aria-hidden>
          <span className="is-active" />
          <span />
          <span />
          <span />
        </div>
        <button type="button" className="htl-play" aria-label="Play video">
          <Play size={14} fill="#1a1d2e" stroke="none" />
        </button>
        <button type="button" className="htl-photos">
          {property.mediaCount}
          <span aria-hidden>→</span>
        </button>
      </div>

      <div className="htl-body">
        <p className="htl-luxe">
          <span>MMT</span>
          <em>Luxe</em>
        </p>
        <h3 className="htl-name">
          {property.name} <StarRow count={property.stars} />
        </h3>
        <p className="htl-meta">
          <span className="htl-loc">{property.location}</span>
          <span className="htl-sep">|</span>
          <span>{property.distance}</span>
        </p>
        <span className="htl-tag">Couple Friendly</span>
        <ul className="htl-perks">
          {property.perks.map((perk) => (
            <li key={perk.text} className={`htl-perk htl-perk--${perk.type}`}>
              <PerkIcon type={perk.type} />
              <span>{perk.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="htl-aside">
        <div className="htl-rating">
          <div className="htl-rating-top">
            <span className="htl-rating-label">{property.ratingLabel}</span>
            <span className="htl-score">{property.rating}</span>
          </div>
          <p className="htl-rating-count">({property.ratingCount})</p>
        </div>
        <div className="htl-price-block">
          <p className="htl-price">
            <span className="htl-currency">₹</span> {property.price}
          </p>
          <p className="htl-taxes">+ ₹ {property.taxes} taxes &amp; fees</p>
          <p className="htl-night">Per Night</p>
        </div>
        <button type="button" className="htl-login">
          Login to Book Now &amp; Pay Later!
        </button>
      </div>
    </article>
  );
}

const LandingPage = () => {
  return (
    <FrontLayout>
      <div className="foc-hotel-listing">
        <div className="htl-wrap">
          <PropertyCard property={PROPERTIES[0]} featured />
          <h2 className="htl-similar">
            Similar Properties around The Taj Mahal Palace, Mumbai
          </h2>
          <PropertyCard property={PROPERTIES[1]} />
        </div>
      </div>

      <style>{`
.foc-hotel-listing,
.foc-hotel-listing * { box-sizing: border-box; }
.foc-hotel-listing {
  --htl-text: #1a1d2e;
  --htl-muted: #6b7280;
  --htl-blue: #1a73e8;
  --htl-teal: #0a8a86;
  --htl-green: #1b8a3e;
  --htl-gold: #b0892e;
  background: #f3f3f3;
  min-height: 100%;
  padding: 96px 16px 48px;
  font-family: "Segoe UI", "Manrope", system-ui, sans-serif;
  color: var(--htl-text);
}
.foc-hotel-listing .htl-wrap {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}
.foc-hotel-listing .htl-card {
  display: grid;
  grid-template-columns: 1fr;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(26, 29, 46, 0.08);
  overflow: hidden;
}
.foc-hotel-listing .htl-media {
  position: relative;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  height: 210px;
  background: #dbe3ea;
}
.foc-hotel-listing .htl-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.foc-hotel-listing .htl-heart,
.foc-hotel-listing .htl-play {
  position: absolute;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}
.foc-hotel-listing .htl-heart {
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(4px);
}
.foc-hotel-listing .htl-heart.is-saved {
  background: rgba(255, 255, 255, 0.92);
}
.foc-hotel-listing .htl-play {
  left: 10px;
  bottom: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0,0,0,.25);
}
.foc-hotel-listing .htl-dots {
  position: absolute;
  left: 12px;
  bottom: 48px;
  display: flex;
  gap: 4px;
}
.foc-hotel-listing .htl-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.55);
}
.foc-hotel-listing .htl-dots span.is-active {
  background: #fff;
}
.foc-hotel-listing .htl-photos {
  position: absolute;
  left: 34px;
  bottom: 12px;
  border: none;
  background: rgba(20, 24, 33, 0.78);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px 6px 16px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.foc-hotel-listing .htl-body {
  padding: 4px 16px 16px;
}
.foc-hotel-listing .htl-luxe {
  margin: 0 0 2px;
  display: flex;
  align-items: baseline;
  gap: 3px;
  line-height: 1;
}
.foc-hotel-listing .htl-luxe span {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .04em;
  color: #8b8f9a;
}
.foc-hotel-listing .htl-luxe em {
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  font-weight: 700;
  color: #8a2b3b;
  font-size: 15px;
}
.foc-hotel-listing .htl-name {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.foc-hotel-listing .htl-stars {
  display: inline-flex;
  gap: 1px;
}
.foc-hotel-listing .htl-meta {
  margin: 0 0 8px;
  font-size: 12.5px;
  color: var(--htl-muted);
  line-height: 1.45;
}
.foc-hotel-listing .htl-loc {
  color: var(--htl-teal);
  font-weight: 700;
}
.foc-hotel-listing .htl-sep {
  margin: 0 6px;
  color: #c4c7ce;
}
.foc-hotel-listing .htl-tag {
  display: inline-block;
  font-size: 11px;
  color: #5f6570;
  border: 1px solid #d7dbe2;
  border-radius: 4px;
  padding: 3px 8px;
  margin-bottom: 10px;
}
.foc-hotel-listing .htl-perks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 7px;
}
.foc-hotel-listing .htl-perk {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
}
.foc-hotel-listing .htl-perk svg,
.foc-hotel-listing .htl-perk-dot,
.foc-hotel-listing .htl-perk-diamond {
  flex: 0 0 auto;
  margin-top: 2px;
}
.foc-hotel-listing .htl-perk--gift { color: var(--htl-green); }
.foc-hotel-listing .htl-perk--clock { color: var(--htl-teal); }
.foc-hotel-listing .htl-perk--dot { color: var(--htl-text); }
.foc-hotel-listing .htl-perk--heritage { color: var(--htl-gold); }
.foc-hotel-listing .htl-perk-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4b5563;
  margin-top: 6px;
}
.foc-hotel-listing .htl-perk-diamond {
  width: 8px;
  height: 8px;
  background: var(--htl-blue);
  transform: rotate(45deg);
  margin-top: 5px;
  border-radius: 1px;
}
.foc-hotel-listing .htl-aside {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  border-top: 1px solid #eef0f3;
}
.foc-hotel-listing .htl-rating-top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.foc-hotel-listing .htl-rating-label {
  color: var(--htl-blue);
  font-weight: 800;
  font-size: 16px;
}
.foc-hotel-listing .htl-score {
  background: var(--htl-blue);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  min-width: 34px;
  padding: 3px 7px;
  border-radius: 4px;
  text-align: center;
}
.foc-hotel-listing .htl-rating-count {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--htl-muted);
}
.foc-hotel-listing .htl-price-block {
  margin-top: 22px;
}
.foc-hotel-listing .htl-price {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.foc-hotel-listing .htl-currency {
  font-size: 18px;
  font-weight: 700;
}
.foc-hotel-listing .htl-taxes,
.foc-hotel-listing .htl-night {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--htl-muted);
}
.foc-hotel-listing .htl-login {
  margin-top: auto;
  padding-top: 18px;
  border: none;
  background: none;
  color: var(--htl-blue);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.foc-hotel-listing .htl-login:hover {
  text-decoration: underline;
}
.foc-hotel-listing .htl-similar {
  margin: 28px 0 14px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

@media (min-width: 860px) {
  .foc-hotel-listing {
    padding: 108px 24px 64px;
  }
  .foc-hotel-listing .htl-card {
    grid-template-columns: 248px 1fr 220px;
    min-height: 232px;
  }
  .foc-hotel-listing .htl-media {
    height: auto;
    min-height: 210px;
    margin: 12px 8px 12px 12px;
  }
  .foc-hotel-listing .htl-body {
    padding: 14px 16px 14px 10px;
    border-right: 1px solid #eef0f3;
  }
  .foc-hotel-listing .htl-aside {
    border-top: none;
    padding: 14px 18px 16px;
    justify-content: space-between;
  }
  .foc-hotel-listing .htl-price-block {
    margin-top: 8px;
  }
}

@media (max-width: 479px) {
  .foc-hotel-listing {
    padding: 84px 10px 32px;
  }
  .foc-hotel-listing .htl-similar {
    font-size: 18px;
  }
  .foc-hotel-listing .htl-name {
    font-size: 16px;
  }
}
      `}</style>
    </FrontLayout>
  );
};

export default LandingPage;
