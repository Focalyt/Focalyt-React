# Complete Referral Flow Analysis - Share Link to Achievement Display

## 📋 Complete Flow Overview

### Step 1: Referral Link Generation & Sharing
**Location**: `frontend/src/Pages/App/Candidate/Jobs/CandidatesJobs.jsx`

1. **Candidate A** shares a job
2. System extracts Candidate A's ID (refCode) from token/localStorage
3. Generates share URL: `/candidate/login?returnUrl=/candidate/job/{jobId}?refCode={refCode}`
4. URL is shared via WhatsApp/Web Share API

**Code Flow**:
```javascript
// Get refCode from candidate ID
const refCode = localStorage.getItem('candidateId') || 
                decodeToken(localStorage.getItem('token')).id;

// Build URL with refCode
const jobDetailUrl = `/candidate/job/${jobId}`;
const returnUrl = `${jobDetailUrl}?refCode=${refCode}`;
const loginUrl = `/candidate/login?returnUrl=${encodeURIComponent(returnUrl)}`;
```

---

### Step 2: Candidate B Visits Referral Link
**Location**: `frontend/src/Pages/App/Candidate/Login/CandidateLogin.jsx`

1. **Candidate B** clicks referral link
2. Lands on login page with refCode in URL
3. refCode is saved to localStorage: `localStorage.setItem('refCode', refCode)`
4. After login/registration, redirected to job page with refCode preserved

**Code Flow**:
```javascript
// Extract refCode from URL
const refCode = queryParams.get("refCode");

// Save to localStorage
useEffect(() => {
    if (refCode) {
        localStorage.setItem('refCode', refCode);
    }
}, [refCode]);

// Preserve in returnUrl after login
if (refCode && !returnUrl.includes('refCode=')) {
    finalReturnUrl = `${returnUrl}?refCode=${refCode}`;
}
```

---

### Step 3: Candidate B Applies for Job
**Location**: `frontend/src/Pages/App/Candidate/Jobs/CandidateViewJobs.jsx`

1. **Candidate B** views job details page
2. refCode extracted from URL and saved to localStorage again
3. When applying, refCode retrieved from localStorage
4. refCode sent to backend in request body

**Code Flow**:
```javascript
// Extract refCode from URL
useEffect(() => {
    const refCode = searchParams.get('refCode');
    if (refCode) {
        localStorage.setItem('refCode', refCode);
    }
}, [searchParams]);

// Send refCode when applying
const applyJob = async () => {
    const refCode = localStorage.getItem('refCode');
    const requestBody = refCode ? { refCode } : {};
    
    await axios.post(`${backendUrl}/candidate/job/${JobId}/apply`, requestBody, {
        headers: { 'x-auth': localStorage.getItem('token') }
    });
};
```

---

### Step 4: Backend Processing - Job Apply Route
**Location**: `backend/controllers/routes/candidate/candidateRoutes.js` (Line ~2345)

#### 4.1 Extract refCode
```javascript
const refCode = req.body?.refCode || req.query?.refCode;
```

#### 4.2 Find Referrer Candidate
```javascript
let referrerId = candidate?.referredBy;

if (!referrerId && refCode && mongoose.Types.ObjectId.isValid(refCode)) {
    const refCodeObjectId = new mongoose.Types.ObjectId(refCode);
    const referrerCandidate = await Candidate.findOne({ 
        _id: refCodeObjectId, 
        status: true, 
        isDeleted: false 
    }).lean();
    
    if (referrerCandidate && referrerCandidate._id.toString() !== candidate._id.toString()) {
        referrerId = refCodeObjectId;
        // Update candidate's referredBy for future use
        await Candidate.findByIdAndUpdate(candidate._id, { referredBy: referrerId });
    }
}
```

#### 4.3 Create Job Application
```javascript
const appliedData = await AppliedJobs.create({
    _job: jobId,
    _candidate: candidate._id,
    _company: vacancy._company
});
```

#### 4.4 Create Referral Rewards (CandidateCashBack)
```javascript
if (referrerId) {
    const offer = await ReferralShareOffer.findOne({ 
        offerType: "JOB", 
        isActive: true 
    }).sort({ createdAt: -1 }).lean();
    
    if (offer) {
        const referrerReward = Number(offer.referrerAmount ?? offer.amount ?? 0);
        const referredReward = Number(offer.referredAmount ?? 0);
        const commentKey = `refApply:JOB:${jobId}:${candidate._id}`;
        
        // Create Referrer Cashback
        if (referrerReward > 0) {
            await CandidateCashBack.create({
                candidateId: referrerId,
                eventType: "credit",
                eventName: "referrer_job_apply",
                amount: referrerReward,
                isPending: true,
                comment: commentKey,
            });
        }
        
        // Create Referee Cashback
        if (referredReward > 0) {
            await CandidateCashBack.create({
                candidateId: candidate._id,
                eventType: "credit",
                eventName: "referee_job_apply",
                amount: referredReward,
                isPending: true,
                comment: commentKey,
            });
        }
    }
}
```

---

### Step 5: Data Storage

#### 5.1 CandidateCashBack Model (2 entries created)
**Collection**: `candidatecashbacks`

**Entry 1 - Referrer**:
```javascript
{
    candidateId: referrerId,              // Candidate A (who shared)
    eventType: "credit",
    eventName: "referrer_job_apply",
    amount: 100,                          // ₹100 reward
    isPending: true,
    comment: "refApply:JOB:{jobId}:{candidateId}",
    createdAt: Date,
    updatedAt: Date
}
```

**Entry 2 - Referee**:
```javascript
{
    candidateId: candidate._id,           // Candidate B (who applied)
    eventType: "credit",
    eventName: "referee_job_apply",
    amount: 50,                           // ₹50 reward
    isPending: true,
    comment: "refApply:JOB:{jobId}:{candidateId}",  // Same comment key
    createdAt: Date,
    updatedAt: Date
}
```

#### 5.2 Candidate Model (referredBy update)
**Collection**: `candidates`

```javascript
{
    _id: candidate._id,
    referredBy: referrerId,               // Candidate A's ID
    // ... other fields
}
```

---

### Step 6: Admin Dashboard - Referral Tracking
**Location**: `backend/controllers/routes/admin/referralTracking.js`

#### 6.1 Fetch Referral Transactions
```javascript
const pipeline = [
    { 
        $match: { 
            eventName: { 
                $in: ["referrer_job_apply", "referee_job_apply"] 
            } 
        } 
    },
    {
        $group: {
            _id: "$comment",              // Group by comment key
            entries: { $push: "$$ROOT" },
            createdAt: { $min: "$createdAt" },
        },
    },
    { $sort: { createdAt: -1 } },
];

const allGroups = await CandidateCashBack.aggregate(pipeline);
```

#### 6.2 Process Transactions
```javascript
for (const group of allGroups) {
    const commentKey = group._id;         // "refApply:JOB:{jobId}:{candidateId}"
    const parts = commentKey.split(":");
    const offerType = parts[1];            // "JOB"
    const itemId = parts[2];              // jobId
    
    // Find referrer and referee entries
    let referrerEntry = null;
    let refereeEntry = null;
    
    for (const entry of group.entries) {
        if (entry.eventName.startsWith("referrer_")) {
            referrerEntry = entry;
        } else if (entry.eventName.startsWith("referee_")) {
            refereeEntry = entry;
        }
    }
    
    // Fetch candidate details
    const [referrer, referee] = await Promise.all([
        Candidate.findById(referrerEntry?.candidateId),
        Candidate.findById(refereeEntry?.candidateId)
    ]);
    
    transactions.push({
        referrer: referrer,
        referee: referee,
        offerType: offerType,
        referrerAmount: referrerEntry?.amount || 0,
        refereeAmount: refereeEntry?.amount || 0,
        date: group.createdAt,
    });
}
```

#### 6.3 Display in Admin Dashboard
**Location**: `backend/views/admin/referralTracking/referralTracking.ejs`

- Shows all referral transactions in a table
- Displays referrer name, referee name, rewards, date
- Filterable by type (JOB/COURSE), date range, search

---

### Step 7: Frontend - My Achievements Display
**Location**: `frontend/src/Pages/App/Candidate/Earning/MyAchievement.jsx`

#### Current Implementation:
- Fetches only `RewardClaim` entries (approved rewards)
- Does NOT show referral achievements from `CandidateCashBack`

#### Required Changes:
1. Modify backend API to include referral achievements
2. Update frontend to display referral achievements

---

## 🔄 Data Flow Diagram

```
Candidate A (Referrer)
    │
    ├─ Shares Job with refCode
    │
    └─> Referral Link Generated
            │
            │ URL: /candidate/login?returnUrl=/candidate/job/{jobId}?refCode={refCode}
            │
            ▼
Candidate B (Referee)
    │
    ├─ Clicks Link → Login Page
    │   └─> refCode saved to localStorage
    │
    ├─ Logs in/Registers
    │   └─> Redirected to Job Page with refCode
    │
    ├─ Applies for Job
    │   └─> refCode sent to backend
    │
    └─> Backend Processing
            │
            ├─> AppliedJobs.create()          // Job application saved
            │
            ├─> CandidateCashBack.create()    // Referrer reward (₹100)
            │   └─> eventName: "referrer_job_apply"
            │
            ├─> CandidateCashBack.create()    // Referee reward (₹50)
            │   └─> eventName: "referee_job_apply"
            │
            └─> Candidate.update()           // referredBy field updated
                    │
                    ▼
            Data Storage
                │
                ├─> candidatecashbacks (2 entries)
                │   ├─ Referrer entry
                │   └─ Referee entry
                │
                ├─> candidates (1 update)
                │   └─ referredBy field
                │
                └─> appliedjobs (1 entry)
                    └─ Job application
                            │
                            ▼
            Display Locations
                │
                ├─> Admin Dashboard
                │   └─> Referral Tracking (/admin/referralTracking)
                │       └─> Shows all referral transactions
                │
                └─> Candidate Dashboard
                    └─> My Achievements (/candidate/achievements)
                        └─> Should show referral achievements (NEEDS UPDATE)
```

---

## 📊 Database Collections Involved

1. **candidatecashbacks** - Referral rewards storage
2. **candidates** - Candidate profiles with referredBy field
3. **appliedjobs** - Job applications
4. **referralshareoffers** - Active referral offers
5. **rewardclaims** - Reward claims (for achievements display)

---

## ✅ Current Status

### Working:
- ✅ Referral link generation
- ✅ refCode capture and storage
- ✅ Job application with refCode
- ✅ CandidateCashBack entries creation
- ✅ Admin referral tracking dashboard

### Needs Update:
- ⚠️ My Achievements component - Does not show referral achievements
- ⚠️ Backend API - approvedRewardClaims does not include referral achievements

---

## 🎯 Next Steps

1. **Update Backend API** (`/candidate/approvedRewardClaims`)
   - Include referral achievements from CandidateCashBack
   - Format as achievement cards

2. **Update Frontend Component** (`MyAchievement.jsx`)
   - Display referral achievements
   - Show referrer/referee achievements separately
   - Add appropriate badges/icons

3. **Test Complete Flow**
   - Share referral link
   - Apply from link
   - Verify admin dashboard
   - Verify My Achievements page
