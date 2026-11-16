import { DEFAULT_EXTERNAL_NAV_LINKS } from '../../../../config/club/navigationConfig';
import { CMS_SEED } from './cmsSeed';

/**
 * Generates a self-contained SVG data URI for club and activity visuals
 * using the Focalyt White & Pink palette so images never fail or break offline.
 */
export function createClubArtworkDataUrl(
  title,
  subtitle,
  primaryHex = '#1BA7FF',
  secondaryHex = '#DFF1FF',
  bgHex = '#EAF4FF',
  motif = 'art'
) {
  const motifShapes = {
    music: `
      <circle cx="510" cy="145" r="78" fill="${secondaryHex}" opacity="0.9"/>
      <circle cx="510" cy="145" r="32" fill="#FFFFFF" opacity="0.95"/>
      <path d="M470 210 V95 L545 78 V190" stroke="${primaryHex}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="456" cy="210" r="16" fill="#FF2DAA"/>
      <circle cx="531" cy="192" r="16" fill="${primaryHex}"/>
    `,
    sports: `
      <circle cx="505" cy="148" r="80" fill="${secondaryHex}"/>
      <path d="M445 110 Q505 155 565 110 M445 188 Q505 140 565 188 M505 68 V228" stroke="${primaryHex}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="505" cy="148" r="80" stroke="#FF2DAA" stroke-width="6" fill="none"/>
    `,
    art: `
      <rect x="435" y="72" width="140" height="150" rx="26" fill="${secondaryHex}" transform="rotate(-6 505 147)"/>
      <circle cx="485" cy="125" r="22" fill="#FF2DAA" opacity="0.85"/>
      <circle cx="532" cy="150" r="16" fill="#061426" opacity="0.75"/>
      <path d="M455 190 Q505 145 555 190" stroke="${primaryHex}" stroke-width="7" fill="none" stroke-linecap="round"/>
    `,
    kindred: `
      <circle cx="478" cy="145" r="58" fill="${secondaryHex}"/>
      <circle cx="532" cy="145" r="58" fill="#FF2DAA" opacity="0.22"/>
      <path d="M505 188 C505 188 452 152 452 118 C452 98 470 86 486 96 C496 102 505 114 505 114 C505 114 514 102 524 96 C540 86 558 98 558 118 C558 152 505 188 505 188 Z" fill="#FF2DAA"/>
    `,
    makers: `
      <rect x="435" y="78" width="145" height="135" rx="22" fill="${secondaryHex}"/>
      <path d="M482 122 L458 146 L482 170 M532 122 L556 146 L532 170 M514 114 L498 178" stroke="${primaryHex}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    afterhours: `
      <circle cx="508" cy="142" r="76" fill="#061426" opacity="0.92"/>
      <path d="M522 98 A46 46 0 1 0 552 168 A38 38 0 1 1 522 98 Z" fill="${primaryHex}"/>
      <circle cx="475" cy="112" r="5" fill="#FF2DAA"/>
      <circle cx="545" cy="118" r="4" fill="#EAF4FF"/>
    `,
    event: `
      <rect x="430" y="75" width="150" height="145" rx="24" fill="${secondaryHex}"/>
      <rect x="430" y="75" width="150" height="42" rx="16" fill="${primaryHex}"/>
      <circle cx="468" cy="150" r="10" fill="#FF2DAA"/>
      <circle cx="505" cy="150" r="10" fill="#061426" opacity="0.5"/>
      <circle cx="542" cy="150" r="10" fill="#061426" opacity="0.5"/>
    `,
  };

  const safeTitle = String(title).replace(/&/g, '&amp;');
  const safeSub = String(subtitle).replace(/&/g, '&amp;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" width="640" height="300">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="#FFFFFF" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1BA7FF" />
        <stop offset="100%" stop-color="#FF2DAA" />
      </linearGradient>
    </defs>
    <rect width="640" height="300" fill="url(#bgGrad)" />
    <circle cx="80" cy="40" r="120" fill="${secondaryHex}" opacity="0.55" />
    <circle cx="580" cy="260" r="110" fill="#FFD6EE" opacity="0.4" />
    ${motifShapes[motif] || motifShapes.art}
    <rect x="44" y="56" width="128" height="28" rx="14" fill="#FFFFFF" stroke="#1BA7FF" />
    <text x="108" y="75" font-family="Orbitron, sans-serif" font-size="10" font-weight="700" fill="#1BA7FF" text-anchor="middle">${safeSub}</text>
    <text x="44" y="152" font-family="Orbitron, sans-serif" font-size="25" font-weight="800" fill="#061426">${safeTitle}</text>
    <rect x="44" y="176" width="68" height="5" rx="2.5" fill="url(#accentGrad)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AVAILABLE_INTERESTS = [
  'Acoustic Music',
  'Songwriting',
  'Football & Futsal',
  'Badminton',
  'Sketching & Illustration',
  'Photography',
  'Community Volunteering',
  'Sustainability',
  'UI/UX & Web',
  'Hardware & IoT',
  'Board Games',
  'Open Mic & Poetry',
];

export const INITIAL_CLUB_STORE_STATE = {
  currentStudent: {
    id: 'stu-1',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@focalyt.edu',
    institutionId: 'inst-1',
    department: 'B.Des & Digital Product',
    year: '2nd Year',
    selectedInterests: ['Acoustic Music', 'Photography', 'UI/UX & Web'],
    savedActivityIds: ['act-1', 'act-4'],
    points: 420,
    badgesEarned: ['badge-1', 'badge-2'],
    bio: 'Product design student who hosts Friday acoustic circles.',
  },
  externalLinks: { ...DEFAULT_EXTERNAL_NAV_LINKS },
  institutions: [
    {
      id: 'inst-1',
      name: 'Focalyt Main Campus — Chandigarh',
      type: 'University',
      city: 'Chandigarh',
      contactEmail: 'clubs.chd@focalyt.com',
      memberCount: 420,
      status: 'Active',
      description: 'Flagship campus community hub hosting creative, tech, sports, and social clubs.',
    },
    {
      id: 'inst-2',
      name: 'Focalyt Skill & Innovation Hub — Delhi NCR',
      type: 'Training Hub',
      city: 'Gurugram',
      contactEmail: 'delhi.community@focalyt.com',
      memberCount: 275,
      status: 'Active',
      description: 'Applied learning and maker community focused on hands-on peer collaboration.',
    },
    {
      id: 'inst-3',
      name: 'Focalyt Partner Institute — Jaipur',
      type: 'College',
      city: 'Jaipur',
      contactEmail: 'jaipur.clubs@focalyt.com',
      memberCount: 190,
      status: 'Onboarding',
      description: 'Growing campus network for cultural exchanges, sports leagues, and volunteering.',
    },
  ],
  people: [
    {
      id: 'per-1',
      name: 'Meera Kapoor',
      email: 'meera.kapoor@focalyt.com',
      role: 'Coordinator',
      institutionId: 'inst-1',
      clubId: 'club-music-room',
      avatarInitials: 'MK',
      department: 'Performing Arts & Culture',
      bio: 'Classical & indie vocalist mentoring student jam sessions and acoustic showcases.',
    },
    {
      id: 'per-2',
      name: 'Kabir Verma',
      email: 'kabir.verma@focalyt.com',
      role: 'Coordinator',
      institutionId: 'inst-1',
      clubId: 'club-playmakers',
      avatarInitials: 'KV',
      department: 'Athletics & Wellness',
      bio: 'Organises inter-batch futsal, badminton ladders, and inclusive turf nights.',
    },
    {
      id: 'per-3',
      name: 'Zoya Nair',
      email: 'zoya.nair@focalyt.com',
      role: 'Coordinator',
      institutionId: 'inst-1',
      clubId: 'club-creative-corner',
      avatarInitials: 'ZN',
      department: 'Visual Arts & Communication',
      bio: 'Visual storyteller running zine workshops, film walks, and studio critique circles.',
    },
    {
      id: 'per-4',
      name: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@focalyt.com',
      role: 'Coordinator',
      institutionId: 'inst-2',
      clubId: 'club-kindred-collective',
      avatarInitials: 'RD',
      department: 'Social Outreach',
      bio: 'Coordinates peer mentoring, neighbourhood literacy drives, and campus sustainability.',
    },
    {
      id: 'per-5',
      name: 'Devika Menon',
      email: 'devika.menon@focalyt.com',
      role: 'Coordinator',
      institutionId: 'inst-2',
      clubId: 'club-makers',
      avatarInitials: 'DM',
      department: 'Engineering & Product Lab',
      bio: 'Full-stack builder and robotics enthusiast leading weekly prototype sprints.',
    },
    {
      id: 'per-6',
      name: 'Aryan Sen',
      email: 'aryan.sen@focalyt.com',
      role: 'Coordinator',
      institutionId: 'inst-1',
      clubId: 'club-after-hours',
      avatarInitials: 'AS',
      department: 'Student Life',
      bio: 'Curates board game cafés, trivia evenings, and unplugged storytelling circles.',
    },
    {
      id: 'per-7',
      name: 'Simran Gill',
      email: 'simran.gill@focalyt.com',
      role: 'Activity In-Charge',
      institutionId: 'inst-1',
      clubId: 'club-music-room',
      avatarInitials: 'SG',
      department: 'Student Events',
      bio: 'Manages stage sound, room bookings, and check-ins for campus gigs.',
    },
    {
      id: 'per-8',
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@focalyt.com',
      role: 'Institution Admin',
      institutionId: 'inst-1',
      avatarInitials: 'VR',
      department: 'Campus Operations',
      bio: 'Oversees club charters, safety guidelines, and cross-campus festivals.',
    },
  ],
  clubs: [
    {
      id: 'club-music-room',
      name: 'The Music Room',
      tagline: 'Jam circles, songwriting corners, and unplugged courtyard evenings.',
      description:
        'Whether you play an instrument, sing in the shower, produce beats on your laptop, or just love discovering new melodies, The Music Room is a warm space to rehearse, collaborate, and perform without pressure.',
      category: 'Creative',
      institutionId: 'inst-1',
      coordinatorId: 'per-1',
      eligibility: 'Open to all students across years; no prior stage experience needed.',
      joiningMethod: 'Open Join',
      meetingSchedule: 'Wednesdays & Fridays • 5:00 PM – 6:30 PM',
      location: 'Studio B2, Student Commons',
      interests: ['Acoustic Music', 'Songwriting', 'Open Mic & Poetry'],
      featured: true,
      accentColor: '#1BA7FF',
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'The Music Room',
        'CREATIVE',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'music'
      ),
      members: [
        {
          id: 'mem-1',
          studentId: 'stu-1',
          studentName: 'Ananya Sharma',
          studentEmail: 'ananya.sharma@focalyt.edu',
          department: 'B.Des & Digital Product',
          status: 'joined',
          requestedAt: '2026-10-01',
          joinedAt: '2026-10-01',
        },
        {
          id: 'mem-2',
          studentId: 'stu-102',
          studentName: 'Ishaan Khatri',
          studentEmail: 'ishaan.k@focalyt.edu',
          department: 'Computer Science',
          status: 'joined',
          requestedAt: '2026-09-20',
          joinedAt: '2026-09-20',
        },
      ],
    },
    {
      id: 'club-playmakers',
      name: 'Playmakers',
      tagline: 'Friendly turf matches, badminton rallies, and high-energy team play.',
      description:
        'Playmakers brings students together after lectures for 5v5 futsal, mixed-doubles badminton, ultimate frisbee, and weekend fitness challenges. Built around sportsmanship, movement, and fun rather than cut-throat trials.',
      category: 'Sports & Games',
      institutionId: 'inst-1',
      coordinatorId: 'per-2',
      eligibility: 'All students welcome. Basic sports footwear required for turf and court sessions.',
      joiningMethod: 'Open Join',
      meetingSchedule: 'Tuesdays & Thursdays • 5:30 PM – 7:00 PM',
      location: 'North Turf & Indoor Arena',
      interests: ['Football & Futsal', 'Badminton'],
      featured: true,
      accentColor: '#1BA7FF',
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'Playmakers',
        'SPORTS & GAMES',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'sports'
      ),
      members: [
        {
          id: 'mem-3',
          studentId: 'stu-103',
          studentName: 'Riya Malhotra',
          studentEmail: 'riya.m@focalyt.edu',
          department: 'Electronics',
          status: 'joined',
          requestedAt: '2026-09-18',
          joinedAt: '2026-09-18',
        },
      ],
    },
    {
      id: 'club-creative-corner',
      name: 'The Creative Corner',
      tagline: 'Sketchbooks, photo walks, zine-making, and visual storytelling.',
      description:
        'A cosy studio collective for illustrators, photographers, filmmakers, and curious beginners. Bring a sketchbook or phone camera for weekly prompts, campus photo walks, and collaborative exhibition walls.',
      category: 'Creative',
      institutionId: 'inst-1',
      coordinatorId: 'per-3',
      eligibility: 'Open to all students from any discipline.',
      joiningMethod: 'Approval Required',
      meetingSchedule: 'Thursdays • 4:30 PM – 6:00 PM',
      location: 'Atrium Design Loft, 2nd Floor',
      interests: ['Sketching & Illustration', 'Photography'],
      featured: true,
      accentColor: '#1BA7FF',
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'The Creative Corner',
        'CREATIVE',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'art'
      ),
      members: [
        {
          id: 'mem-4',
          studentId: 'stu-104',
          studentName: 'Neha Joshi',
          studentEmail: 'neha.j@focalyt.edu',
          department: 'Media Studies',
          status: 'pending',
          requestedAt: '2026-10-14',
          note: 'Love street photography and want to join the weekend photo walks!',
        },
      ],
    },
    {
      id: 'club-kindred-collective',
      name: 'Kindred Collective',
      tagline: 'Empathy in action — community drives, peer support, and green initiatives.',
      description:
        'Kindred Collective connects students who care about making campus and surrounding neighbourhoods kinder and greener. From weekend teaching circles to zero-waste campus swaps, every small action counts.',
      category: 'Social & Impact',
      institutionId: 'inst-2',
      coordinatorId: 'per-4',
      eligibility: 'Open to all students committed to respectful community engagement.',
      joiningMethod: 'Open Join',
      meetingSchedule: 'Saturdays • 10:30 AM – 12:30 PM',
      location: 'Community Courtyard & Partner Centres',
      interests: ['Community Volunteering', 'Sustainability'],
      featured: false,
      accentColor: '#1BA7FF',
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'Kindred Collective',
        'SOCIAL & IMPACT',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'kindred'
      ),
      members: [
        {
          id: 'mem-5',
          studentId: 'stu-105',
          studentName: 'Pranav Kulkarni',
          studentEmail: 'pranav.k@focalyt.edu',
          department: 'Commerce & Social Enterprise',
          status: 'joined',
          requestedAt: '2026-09-28',
          joinedAt: '2026-09-28',
        },
      ],
    },
    {
      id: 'club-makers',
      name: 'The Makers Club',
      tagline: 'Tinker with code, hardware, design systems, and quirky weekend hacks.',
      description:
        'A hands-on playground for builders, coders, designers, and hardware tinkerers. We team up on mini-products, IoT gadgets, open-source tools, and peer demo days where unfinished prototypes are celebrated.',
      category: 'Tech & Makers',
      institutionId: 'inst-2',
      coordinatorId: 'per-5',
      eligibility: 'Open to all batches. Approval helps pair members into balanced project squads.',
      joiningMethod: 'Approval Required',
      meetingSchedule: 'Wednesdays • 6:00 PM – 7:30 PM',
      location: 'Innovation Lab 104 & Discord Stage',
      interests: ['UI/UX & Web', 'Hardware & IoT'],
      featured: true,
      accentColor: '#1BA7FF',
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'The Makers Club',
        'TECH & MAKERS',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'makers'
      ),
      members: [
        {
          id: 'mem-6',
          studentId: 'stu-1',
          studentName: 'Ananya Sharma',
          studentEmail: 'ananya.sharma@focalyt.edu',
          department: 'B.Des & Digital Product',
          status: 'pending',
          requestedAt: '2026-10-15',
          note: 'Excited to collaborate on UI/UX for student hardware projects.',
        },
        {
          id: 'mem-7',
          studentId: 'stu-106',
          studentName: 'Harshvardhan Singh',
          studentEmail: 'harsh.s@focalyt.edu',
          department: 'Computer Applications',
          status: 'joined',
          requestedAt: '2026-09-12',
          joinedAt: '2026-09-14',
        },
      ],
    },
    {
      id: 'club-after-hours',
      name: 'After Hours',
      tagline: 'Unwind with tabletop games, storytelling nights, and warm conversations.',
      description:
        'When classes wrap up, After Hours turns the student lounge into a welcoming living room. Drop in for strategy board games, poetry slams, acoustic listening sessions, and low-key connection.',
      category: 'Social & Impact',
      institutionId: 'inst-1',
      coordinatorId: 'per-6',
      eligibility: 'Open to all registered students across campuses.',
      joiningMethod: 'Open Join',
      meetingSchedule: 'Fridays • 6:30 PM – 8:00 PM',
      location: 'The Rose Lounge, Student Block C',
      interests: ['Board Games', 'Open Mic & Poetry'],
      featured: false,
      accentColor: '#1BA7FF',
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'After Hours',
        'SOCIAL & IMPACT',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'afterhours'
      ),
      members: [],
    },
  ],
  activities: [
    {
      id: 'act-1',
      title: 'Pink Hour Unplugged: Courtyard Acoustic & Open Verse Jam',
      clubId: 'club-music-room',
      inChargeId: 'per-7',
      date: '2026-10-23',
      time: '5:30 PM – 7:30 PM',
      location: 'Amphitheatre Lawn, Main Campus',
      mode: 'In-Person',
      summary:
        'Our signature sunset acoustic session where vocalists, instrumentalists, and spoken-word poets share original pieces and crowd favourites.',
      description:
        'Bring your guitar, ukulele, cajón, or simply come to listen under the string lights. We open with a 30-minute collaborative warm-up followed by 10 open-slot performances. Lyrics sheets and house instruments are available for anyone trying the stage for the first time.',
      featured: true,
      capacity: 60,
      tags: ['Live Music', 'Open Mic', 'Beginner Friendly'],
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'Pink Hour Unplugged',
        'FEATURED EVENT',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'music'
      ),
      registrations: [
        {
          id: 'reg-1',
          activityId: 'act-1',
          studentId: 'stu-1',
          studentName: 'Ananya Sharma',
          studentEmail: 'ananya.sharma@focalyt.edu',
          registeredAt: '2026-10-14',
          attendance: 'Pending',
        },
        {
          id: 'reg-2',
          activityId: 'act-1',
          studentId: 'stu-102',
          studentName: 'Ishaan Khatri',
          studentEmail: 'ishaan.k@focalyt.edu',
          registeredAt: '2026-10-14',
          attendance: 'Present',
        },
      ],
    },
    {
      id: 'act-2',
      title: 'Under-the-Lights 5v5 Mixed Futsal Mixer',
      clubId: 'club-playmakers',
      inChargeId: 'per-2',
      date: '2026-10-25',
      time: '6:00 PM – 7:45 PM',
      location: 'North Turf Arena',
      mode: 'In-Person',
      summary: 'Rotating 12-minute friendly matches with mixed teams drawn on the spot.',
      description:
        'No pre-formed teams needed! Show up solo or with a friend, warm up together, and rotate through four short games. Bibs, hydration, and first-aid kit are provided at the turf desk.',
      featured: false,
      capacity: 30,
      tags: ['Futsal', 'Fitness', 'Team Mixer'],
      bannerSvgDataUrl: createClubArtworkDataUrl(
        '5v5 Futsal Mixer',
        'SPORTS & GAMES',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'sports'
      ),
      registrations: [
        {
          id: 'reg-3',
          activityId: 'act-2',
          studentId: 'stu-103',
          studentName: 'Riya Malhotra',
          studentEmail: 'riya.m@focalyt.edu',
          registeredAt: '2026-10-15',
          attendance: 'Pending',
        },
      ],
    },
    {
      id: 'act-3',
      title: 'Golden Hour Photo Walk & Zine Folding Lab',
      clubId: 'club-creative-corner',
      inChargeId: 'per-3',
      date: '2026-10-27',
      time: '4:15 PM – 6:00 PM',
      location: 'Heritage Walkway & Design Loft',
      mode: 'Hybrid',
      summary: 'Capture textures and candid moments around campus, then turn 8 shots into a pocket zine.',
      description:
        'Phone cameras and DSLRs are equally welcome. We spend the first 45 minutes walking the campus botanical trail and the next hour printing and folding mini risograph-style zines. Remote participants can join the live layout critique online.',
      featured: false,
      capacity: 25,
      tags: ['Photography', 'Zines', 'Hands-On'],
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'Photo Walk & Zine Lab',
        'CREATIVE',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'art'
      ),
      registrations: [],
    },
    {
      id: 'act-4',
      title: 'Ship-It Saturday: 3-Hour Micro-App & Figma Jam',
      clubId: 'club-makers',
      inChargeId: 'per-5',
      date: '2026-10-30',
      time: '2:00 PM – 5:00 PM',
      location: 'Innovation Lab 104 + Live Stream',
      mode: 'Online',
      summary: 'Pair up a designer and a developer to prototype a playful campus tool in 180 minutes.',
      description:
        'A low-stress creative coding and design sprint. Pick from three fun prompts at kickoff, collaborate in breakout rooms, and demo what you built at 4:30 PM. Beginners get starter templates and mentor support throughout.',
      featured: false,
      capacity: 45,
      tags: ['Web & UI', 'Prototyping', 'Team Sprint'],
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'Ship-It Saturday',
        'TECH & MAKERS',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'makers'
      ),
      registrations: [],
    },
    {
      id: 'act-5',
      title: 'Campus Book & Clothes Swap for Sustainability Week',
      clubId: 'club-kindred-collective',
      inChargeId: 'per-4',
      date: '2026-11-02',
      time: '11:00 AM – 3:00 PM',
      location: 'Central Student Plaza',
      mode: 'In-Person',
      summary: 'Bring pre-loved novels, hoodies, or stationery and swap them with fellow students.',
      description:
        'Give your shelf favourites a second home! Every item you bring earns swap tokens, and unswapped books are donated to our partner neighbourhood library drive.',
      featured: false,
      capacity: 80,
      tags: ['Sustainability', 'Community', 'Zero Waste'],
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'Book & Clothes Swap',
        'SOCIAL & IMPACT',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'kindred'
      ),
      registrations: [],
    },
    {
      id: 'act-6',
      title: 'Catan, Codenames & Chai: Friday Tabletop Social',
      clubId: 'club-after-hours',
      inChargeId: 'per-6',
      date: '2026-11-06',
      time: '6:30 PM – 8:30 PM',
      location: 'The Rose Lounge, Block C',
      mode: 'In-Person',
      summary: 'Unplug from screens over strategy board games, quick party games, and masala chai.',
      description:
        'We set up 6 game tables ranging from 15-minute icebreaker card games to strategy classics. Game hosts explain rules at every table so newcomers can jump right in.',
      featured: false,
      capacity: 36,
      tags: ['Board Games', 'Social', 'Friday Evening'],
      bannerSvgDataUrl: createClubArtworkDataUrl(
        'Tabletop & Chai Social',
        'AFTER HOURS',
        '#1BA7FF',
        '#DFF1FF',
        '#EAF4FF',
        'afterhours'
      ),
      registrations: [],
    },
  ],
  suggestions: [
    {
      id: 'sug-1',
      name: 'Culinary & Campus Bakers Circle',
      category: 'Creative',
      description: 'No-bake hostel recipes, regional food stories, and weekend potluck tastings.',
      whyNeeded: 'Many outstation students miss home-cooked food and want to learn simple recipes together.',
      expectedFormat: 'Bi-weekly Saturday afternoon tasting & recipe exchange.',
      submittedBy: 'Ananya Sharma',
      submittedAt: '2026-10-12',
      status: 'Under Review',
    },
  ],
  ...CMS_SEED,
};
