// Content and option data, mirrored from the reference duedoh.info build.

export const CITIES = ["Hyderabad", "Visakhapatnam"];

export const AREAS = {
  Hyderabad: [
    "Charminar & Old City",
    "Banjara Hills",
    "Jubilee Hills",
    "Hitec City",
    "Gachibowli",
    "Madhapur",
    "Secunderabad",
    "Begumpet",
    "Ameerpet",
    "Kukatpally",
    "Golconda",
    "Abids & Koti",
    "Shamshabad & Airport",
  ],
  Visakhapatnam: [
    "RK Beach",
    "Beach Road",
    "Rushikonda",
    "Kailasagiri",
    "MVP Colony",
    "Dwaraka Nagar",
    "Gajuwaka",
    "Simhachalam",
    "Jagadamba",
    "Araku (day trip)",
  ],
};

export const OCCUPATIONS = [
  "Student",
  "Part-time work",
  "Employed",
  "Auto driver",
  "Cab driver",
  "Other",
];

export const LANGUAGES = ["Telugu", "English", "Hindi", "Tamil", "Kannada", "Urdu", "Other"];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// "What can you offer?" -> maps to a tier
export const OFFERS = [
  { key: "Lite", title: "On foot", description: "Walk the city with travellers. No vehicle needed." },
  { key: "Pro Bike", title: "My bike", description: "Two-wheeler" },
  { key: "Pro Auto", title: "My auto", description: "Auto-rickshaw" },
  { key: "Pro Car", title: "My car", description: "Four-wheeler" },
];

// Pro tiers require licence + vehicle documents
export const VEHICLE_TIERS = ["Pro Bike", "Pro Auto", "Pro Car"];

export const VEHICLE_LABELS = {
  "Pro Bike": "Two-wheeler",
  "Pro Auto": "Auto-rickshaw",
  "Pro Car": "Four-wheeler",
};

export const TIERS = ["Lite", "Pro Bike", "Pro Auto", "Pro Car"];

export const PIPELINE = ["Applied", "Under Review", "Interview", "Verification", "Approved"];
export const ALL_STATUSES = [...PIPELINE, "Rejected", "Suspended"];

export const STATUS_MESSAGES = {
  Applied: "We've got your application. We'll review it within 2 days.",
  "Under Review": "We're checking your details.",
  Interview: "We'll call you to arrange a short conversation.",
  Verification: "Background verification is in progress.",
  Approved: "You're in. We'll contact you about your first booking.",
  Rejected: "We're not able to move forward right now.",
  Suspended: "Your Dude account is currently paused. Our team will contact you.",
};

export const HOW_IT_WORKS = [
  ["Apply", "takes 5 minutes on your phone"],
  ["Get verified", "ID check and a short conversation with our team"],
  ["Pick your hours", "you choose the days you're free"],
  ["Start earning", "meet travellers and make their day work"],
];

export const ELIGIBILITY = [
  "You live in Hyderabad or Visakhapatnam",
  "You know your city well",
  "A bike, auto or car means you can earn more — but it's not required.",
];

export const EARNINGS = [
  { label: "Weekends only", amount: "₹6,000 – ₹17,000", note: "/ month" },
  { label: "Part-time work", amount: "₹25,000", note: "/ month" },
  { label: "Full-time with a car", amount: "₹40,000+", note: "/ month" },
];

export const CONSENT_TEXT =
  "I understand and consent to Duedoh collecting and using my information for verification, safety, and payments.";

export const PRIVACY_TEXT =
  "We collect identity, contact, vehicle, and payment details to verify you, make bookings safe, and pay you. We keep verification records while you are active and only as long afterward as legally required. You can ask us to access or delete eligible data by contacting Duedoh support.";

// Status badge colour classes, keyed by status
export const STATUS_STYLES = {
  Applied: "bg-slate-100 text-slate-700",
  "Under Review": "bg-amber-100 text-amber-800",
  Interview: "bg-violet-100 text-violet-800",
  Verification: "bg-cyan-100 text-cyan-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Suspended: "bg-slate-200 text-slate-700",
};

export function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// --- Image uploads -----------------------------------------------------------
// Every photo field in the application flow is capped at this size.
export const MAX_IMAGE_BYTES = 90 * 1024;
export const MAX_IMAGE_LABEL = "90 KB";

export const MIN_VEHICLE_IMAGES = 2;
export const MAX_VEHICLE_IMAGES = 3;

// Vehicle photos are stored one document per image, keyed by tier + position.
export const VEHICLE_DOC_SLUGS = {
  "Pro Bike": "bike",
  "Pro Auto": "auto",
  "Pro Car": "car",
};

export function vehicleDocType(tier, index) {
  return `vehicle_${VEHICLE_DOC_SLUGS[tier] || "other"}_${index + 1}`;
}

export function formatBytes(bytes) {
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.ceil(kb)} KB`;
}

// Returns a message when the picked file can't be accepted, otherwise "".
export function imageFileError(file) {
  if (!file) return "";
  if (file.type && !file.type.startsWith("image/")) {
    return "Choose an image file (JPG, PNG or WEBP).";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is ${formatBytes(
      file.size
    )}. Each image must be ${MAX_IMAGE_LABEL} or smaller — compress it and try again.`;
  }
  return "";
}

// Lenient Indian number-plate check: 6-12 alphanumerics with letters and digits.
export function isValidVehicleNumber(value) {
  const compact = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (
    /^[A-Z0-9]{6,12}$/.test(compact) && /[A-Z]/.test(compact) && /\d/.test(compact)
  );
}
