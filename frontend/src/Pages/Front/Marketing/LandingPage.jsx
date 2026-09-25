import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Check, Clock, Heart, Play } from "lucide-react";
import FrontLayout from "../../../Component/Layouts/Front";
import { resolveMediaUrl } from "../../../utils/resolveMediaUrl";
import { usePublicApply } from "../../../Component/PublicApplyModal/PublicApplyModal";

const THUMB_FALLBACK = "/Assets/public_assets/images/newjoblisting/course_img.svg";

function formatFee(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^free$/i.test(raw)) return "Free";
  if (/^[₹rs.\s]/i.test(raw) || /free/i.test(raw)) return raw;
  const numeric = raw.replace(/,/g, "");
  if (!Number.isNaN(Number(numeric)) && numeric !== "") {
    return Number(numeric).toLocaleString("en-IN");
  }
  return raw;
}

function mapCourse(course, bucketUrl) {
  const photos = Array.isArray(course?.photos) ? course.photos.length : 0;
  const videos = Array.isArray(course?.videos) ? course.videos.length : 0;
  const mediaTotal = photos + videos;
  const location = [course?.city, course?.state].filter(Boolean).join(", ") || "NA";
  const sectors = Array.isArray(course?.sectorNames) ? course.sectorNames.filter(Boolean).join(", ") : "";
  const lastDate = course?.lastDateForApply
    ? moment(course.lastDateForApply).utcOffset("+05:30").format("MMM DD, YYYY")
    : "";
  const isFree = String(course?.courseFeeType || "").toLowerCase() === "free";
  const perks = [];
  if (course?.qualification) perks.push({ type: "gift", text: `Eligibility: ${course.qualification}` });
  if (course?.duration) perks.push({ type: "clock", text: `Duration: ${course.duration}` });
  if (course?.trainingMode) perks.push({ type: "dot", text: `Mode: ${course.trainingMode}` });
  if (lastDate) perks.push({ type: "heritage", text: `Last date to apply: ${lastDate}` });

  return {
    id: course?._id,
    name: course?.name || "Course",
    image: resolveMediaUrl(bucketUrl, course?.thumbnail) || THUMB_FALLBACK,
    imageFallback: THUMB_FALLBACK,
    videoUrl: course?.videos?.[0] ? resolveMediaUrl(bucketUrl, course.videos[0]) : "",
    mediaCount: mediaTotal ? `${mediaTotal} Photos & Videos` : "View details",
    location,
    distance: sectors || course?.projectName || "Focalyt",
    tag: course?.courseType === "coursejob" ? "Course + Jobs" : course?.courseFeeType || "Course",
    perks,
    ratingLabel: isFree ? "Free" : "Paid",
    ratingCount: course?.students ? `${course.students} enrolled` : course?.courseLevel || "",
    isFree,
    price: isFree ? "Free" : formatFee(course?.courseFee || course?.cutPrice) || "—",
    extraFee: course?.examFee
      ? `Exam fee ₹ ${formatFee(course.examFee)}`
      : course?.registrationCharges
        ? `Reg. charges ₹ ${formatFee(course.registrationCharges)}`
        : "",
    duration: course?.duration || "",
    description: String(course?.shareDescription || course?.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  };
}

function applyPayload(course, openTab) {
  return {
    openTab,
    kind: "course",
    id: course.id,
    name: course.name,
    image: course.image,
    location: course.location,
    extra: course.distance,
    badge: course.isFree ? "Free Course" : "Paid Course",
    applyPath: `/candidate/course/${course.id}?apply=1`,
    details: {
      perks: course.perks,
      tag: course.tag,
      price: course.price,
      isFree: course.isFree,
      extraFee: course.extraFee,
      duration: course.duration,
      description: course.description,
      ratingLabel: course.ratingLabel,
      ratingCount: course.ratingCount,
    },
  };
}

function PerkIcon({ type }) {
  if (type === "gift") return <Check size={14} strokeWidth={2.6} />;
  if (type === "clock") return <Clock size={14} strokeWidth={2.2} />;
  if (type === "dot") return <span className="htl-perk-dot" />;
  return <span className="htl-perk-diamond" aria-hidden />;
}

function CourseCard({ course, featured }) {
  const [saved, setSaved] = useState(false);
  const { openApply } = usePublicApply();

  return (
    <article className={`htl-card${featured ? " is-featured" : ""}`}>
      <div className="htl-media">
        <img
          src={course.image}
          alt={course.name}
          onError={(e) => {
            if (course.imageFallback && e.currentTarget.src !== course.imageFallback) {
              e.currentTarget.src = course.imageFallback;
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
        {course.videoUrl ? (
          <a className="htl-play" href={course.videoUrl} target="_blank" rel="noreferrer" aria-label="Play video">
            <Play size={14} fill="#1a1d2e" stroke="none" />
          </a>
        ) : null}
        <button type="button" className="htl-photos" onClick={() => openApply(applyPayload(course, "detail"))}>
          {course.mediaCount}
          <span aria-hidden>→</span>
        </button>
      </div>

      <div className="htl-body">
        <p className="htl-luxe">
          <img src="/Assets/images/logo/focalyt_new_logo.png" alt="Focalyt" />
        </p>
        <h3 className="htl-name">{course.name}</h3>
        <p className="htl-meta">
          <span className="htl-loc">{course.location}</span>
          {course.distance ? (
            <>
              <span className="htl-sep">|</span>
              <span>{course.distance}</span>
            </>
          ) : null}
        </p>
        {course.tag ? <span className="htl-tag">{course.tag}</span> : null}
        <ul className="htl-perks">
          {course.perks.map((perk) => (
            <li key={perk.text} className={`htl-perk htl-perk--${perk.type}`}>
              <PerkIcon type={perk.type} />
              <span>{perk.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="htl-aside">
        <button
          type="button"
          className="htl-login"
          onClick={() => openApply(applyPayload(course, "apply"))}
        >
          Apply Now
        </button>
      </div>
    </article>
  );
}

const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/courses`);
        setCourses(response.data.courses ?? []);
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [backendUrl]);

  const cards = courses.map((course) => mapCourse(course, bucketUrl));
  const featured = cards[0];
  const similar = cards.slice(1);

  return (
    <FrontLayout>
      <div className="foc-hotel-listing">
        <div className="htl-wrap">
          {loading ? <p className="htl-status">Loading courses…</p> : null}
          {!loading && error ? <p className="htl-status">{error}</p> : null}
          {!loading && !error && !cards.length ? <p className="htl-status">No courses found.</p> : null}

          {featured ? <CourseCard course={featured} featured /> : null}

          {similar.length ? (
            <>
              <h2 className="htl-similar">Similar Courses around {featured?.name}</h2>
              {similar.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </>
          ) : null}
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
  font-family: var(--foc-font-sans);
  color: var(--htl-text);
}
.foc-hotel-listing .htl-wrap {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
}
.foc-hotel-listing .htl-status {
  margin: 24px 0;
  text-align: center;
  color: var(--htl-muted);
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
  text-decoration: none;
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
  text-decoration: none;
}
.foc-hotel-listing .htl-body {
  padding: 4px 16px 16px;
}
.foc-hotel-listing .htl-luxe {
  margin: 0 0 6px;
  line-height: 1;
}
.foc-hotel-listing .htl-luxe img {
  display: block;
  height: 22px;
  width: auto;
}
.foc-hotel-listing .htl-name {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
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
  justify-content: flex-end;
  border-top: 1px solid #eef0f3;
}
.foc-hotel-listing .htl-login {
  border: none;
  background: linear-gradient(90deg, #2563eb 0%, #7c3aed 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  border-radius: 12px;
  min-height: 44px;
  width: 100%;
  padding: 0 16px;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.28);
}
.foc-hotel-listing .htl-login:hover {
  filter: brightness(1.06);
}
.foc-hotel-listing .htl-similar {
  margin: 12px 0 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

@media (min-width: 860px) {
  .foc-hotel-listing {
    padding: 108px 24px 64px;
  }
  .foc-hotel-listing .htl-card {
    grid-template-columns: 248px 1fr 168px;
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
    padding: 14px 16px;
    justify-content: center;
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
