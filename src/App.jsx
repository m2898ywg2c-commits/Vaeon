import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Dumbbell, ChevronLeft, ChevronRight, Check, Video, TrendingUp, RotateCcw, Flame, Settings, CalendarDays, Timer, BarChart3, MessageCircle, X, Mic } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as THREE from "three";
import { storage } from "./storage";

// ---------- PLAN DATA ----------
const DAYS = [
  { key: "tue", label: "Tuesday", short: "TUE", focus: "Chest & Push — Strength" },
  { key: "wed", label: "Wednesday", short: "WED", focus: "Legs, Glutes & Abs — Strength" },
  { key: "thu", label: "Thursday", short: "THU", focus: "Chest & Biceps — Hypertrophy" },
  { key: "fri", label: "Friday", short: "FRI", focus: "Thighs, Glutes & Abs" },
];

const BENCH_PCTS = [0.875, 0.9, 0.925, 0.95, 0.975, 0.85];
const SQUAT_PCTS = [0.792, 0.833, 0.854, 0.896, 0.917, 0.771];

// a 5-6 minute warm-up tailored to each day's movement pattern, not loggable, just a routine to run through
const WARMUPS = {
  tue: {
    title: "Chest & Push Warm-Up",
    duration: "5-6 min",
    steps: [
      "Arm circles, 20 seconds each direction",
      "Band pull-aparts or empty-bar pull-aparts, 15 reps",
      "Push-up to downward dog, 8 slow reps",
      "Shoulder dislocates with a band or broomstick, 10 reps",
      "Light bench press with just the bar, 2 sets of 10",
    ],
  },
  wed: {
    title: "Legs, Glutes & Abs Warm-Up",
    duration: "5-6 min",
    steps: [
      "Leg swings, 10 each direction per leg",
      "Bodyweight squats, 15 reps, pause at the bottom on the last 3",
      "Glute bridges, 15 reps",
      "Walking knee hugs, 10 steps each leg",
      "Empty bar or light goblet squats, 2 sets of 8",
    ],
  },
  thu: {
    title: "Chest & Biceps Warm-Up",
    duration: "5-6 min",
    steps: [
      "Arm circles, 20 seconds each direction",
      "Light band curls or empty-bar curls, 15 reps",
      "Push-up to downward dog, 8 slow reps",
      "Wrist and forearm rotations, 15 seconds each way",
      "Light incline press with just the bar, 2 sets of 10",
    ],
  },
  fri: {
    title: "Thighs & Glutes Warm-Up",
    duration: "5-6 min",
    steps: [
      "Leg swings, 10 each direction per leg",
      "Walking lunges, no weight, 8 steps each leg",
      "Glute bridges, 15 reps",
      "Bodyweight Bulgarian split squat, 6 reps each leg",
      "Ankle bounces or light calf raises, 15 reps",
    ],
  },
};

const roundTo25 = (n) => Math.round(n / 2.5) * 2.5;

const mk = (id, name, sets, reps, note, query, increment = 2.5) => ({
  id,
  name,
  sets,
  reps,
  note,
  type: "strength",
  increment,
  video: `https://www.youtube.com/results?search_query=${encodeURIComponent(query || name + " proper form")}`,
});

const mkCardio = (id, name, note, query, target = "500m") => ({
  id,
  name,
  note,
  type: "cardio",
  target,
  video: `https://www.youtube.com/results?search_query=${encodeURIComponent(query || name + " technique")}`,
});

const CARDIO_NOTES = [
  "Baseline effort. Go hard but controlled and log your time, this is what you're chasing from here.",
  "Aim to match or shave a second or two off week 1.",
  "Push for a new best. Small chunks off your time count.",
  "Same again, keep hunting a faster split.",
  "Peak week, empty the tank on this one.",
  "Deload. Easy, steady pace, this isn't about time this week.",
];

function conditioning(weekIdx) {
  const note = CARDIO_NOTES[weekIdx];
  return [
    mkCardio("skierg_500", "SkiErg 500m", note, "skierg technique 500m", "500m"),
    mkCardio("row_500", "Row 500m", note, "rowing machine technique 500m Concept2", "500m"),
    mkCardio("battle_ropes", "Battle Ropes", note, "battle ropes technique intervals", "6 x 30 sec on / 30 sec off"),
    mkCardio("sled_push_pull", "Sled Push & Pull", note, "sled push pull technique HYROX", "20m push + 20m pull"),
    mkCardio("hyrox_lunge_carry", "Weighted Lunge Walk", note, "hyrox sandbag lunge technique", "100m"),
  ];
}

function buildPlan(weekIdx, benchBase, squatBase) {
  const benchNum = parseFloat(benchBase);
  const squatNum = parseFloat(squatBase);
  const bench = benchNum ? roundTo25(benchNum * BENCH_PCTS[weekIdx]) : null;
  const squat = squatNum ? roundTo25(squatNum * SQUAT_PCTS[weekIdx]) : null;
  const deload = weekIdx === 5;
  const benchNote = bench ? `Work up to ~${bench}kg` : "Set your bench baseline in Settings";
  const squatNote = squat ? `Work up to ~${squat}kg` : "Set your squat baseline in Settings";

  return {
    tue: [
      mk("bench", "Barbell Bench Press", 5, "5", benchNote, "barbell bench press technique Alan Thrall", 2.5),
      mk("incline_db", "Incline Dumbbell Press", 4, "8", deload ? "Moderate weight" : "Push for 2-3kg up on last set", "incline dumbbell press form Jeff Nippard", 2),
      mk("dips", "Weighted Dips", 3, "10", deload ? "Bodyweight only" : "Add weight belt if 10 is easy", "weighted dips proper form", 2.5),
      mk("push_press", "Double DB Push Press", 4, "6", "Base at 30kg per hand, drive from legs", "dumbbell push press technique", 2),
      mk("cable_fly", "Cable Fly", 3, "12", "Slow negative, squeeze at top", "cable fly form", 1),
      mk("hanging_leg_raise", "Hanging Leg Raise", 3, "15", "Control the swing", "hanging leg raise proper form", 1),
      mk("plank", "Plank", 3, "45 sec", "Brace, don't let hips sag", "plank correct form", 1),
      ...conditioning(weekIdx),
    ],
    wed: [
      mk("squat", "Back Squat", 5, "5", squatNote, "back squat technique Squat University", 2.5),
      mk("rdl", "Romanian Deadlift", 4, "8", "Feel it in the hamstrings, not the lower back", "romanian deadlift form", 2.5),
      mk("lunges", "Weighted Walking Lunges", 3, "12 per leg", "HYROX-relevant, keep torso upright and stride controlled rather than rushed", "walking lunges form", 1),
      mk("sled_push", "Weighted Sled Push", 4, "20m", "Low body angle, drive through the legs, this is the actual HYROX load, not a light warm-up", "sled push technique HYROX", 5),
      mk("hip_thrust", "Hip Thrust", 4, "10", "Full lockout, squeeze glutes hard", "barbell hip thrust technique", 2.5),
      mk("leg_press", "Leg Press", 3, "15", "Full range, don't lock knees out hard", "leg press proper form", 5),
      mk("woodchop", "Cable Woodchop", 3, "12 per side", "Rotate through the core, not just arms", "cable woodchop technique", 1),
      ...conditioning(weekIdx),
    ],
    thu: [
      mk("incline_bb", "Incline Barbell Press", 4, "8", "Moderate weight, focus on the squeeze", "incline barbell bench press form", 2.5),
      mk("db_bench", "Dumbbell Bench Press", 4, "10", "Full stretch at the bottom", "dumbbell bench press form", 2),
      mk("bb_curl", "Barbell Curl", 4, "10", "No swinging, control the eccentric", "barbell curl proper form", 1),
      mk("hammer_curl", "Hammer Curl", 3, "12", "Hits the brachialis, keep elbows pinned", "hammer curl form", 1),
      mk("cable_curl", "Cable Curl", 3, "15", "Constant tension, squeeze at top", "cable curl form", 1),
      mk("cable_crunch", "Cable Crunch", 3, "15", "Curl the spine, don't just bend at hips", "cable crunch proper form", 1),
      ...conditioning(weekIdx),
    ],
    fri: [
      mk("bulgarian_split_squat", "Bulgarian Split Squat", 4, "8 per leg", "Brutal but effective, go lighter than you think", "bulgarian split squat technique", 1),
      mk("hip_thrust_2", "Hip Thrust", 4, "12", "Higher reps than Wednesday, lighter load", "barbell hip thrust technique", 2.5),
      mk("leg_curl", "Leg Curl", 3, "12", "Slow and controlled", "seated leg curl form", 2),
      mk("leg_extension", "Leg Extension", 3, "15", "Pause at the top", "leg extension proper form", 2),
      mk("calf_raise", "Calf Raises", 3, "15", "Full stretch at bottom, pause at top", "standing calf raise form", 2.5),
      mk("bicycle_crunch", "Bicycle Crunch", 3, "20", "Slow, controlled rotation", "bicycle crunch proper form", 1),
      ...conditioning(weekIdx),
    ],
  };
}

const WEEK_NOTES = [
  "Technique week. Land on the working weights below and don't chase failure, get the movement patterns dialled in.",
  "Same weights as week 1, but push for cleaner reps and slightly better bar speed.",
  "Progression begins. Add load on the main lifts where form held last week.",
  "Keep pushing the main lifts. Accessories can creep up in weight if reps are easy.",
  "Peak week. This is the hardest week of the block, main lifts are at their heaviest.",
  "Deload. Same movements, lighter weight, fewer hard sets. Let the body recover before the next block.",
];

const BODY_FIELDS = [
  { key: "bodyweight", label: "Bodyweight", unit: "kg" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "thigh", label: "Thigh", unit: "cm" },
  { key: "arm", label: "Arm (flexed)", unit: "cm" },
];

// post-workout meal per training day, aimed at recovery without blowing the daily calorie budget
// two or three real post-workout options per training day, so it's genuinely about refuelling after training
// rather than a generic day's meal plan unconnected to what you've just done
const POST_WORKOUT = {
  tue: [
    { meal: "Grilled chicken breast, sweet potato, steamed greens", kcal: 450, protein: "40g protein" },
    { meal: "Turkey mince stir-fry with rice and mixed vegetables", kcal: 480, protein: "38g protein" },
    { meal: "Greek yoghurt, banana, honey, scoop of protein powder", kcal: 350, protein: "35g protein" },
  ],
  wed: [
    { meal: "Baked salmon, brown rice, broccoli", kcal: 500, protein: "35g protein" },
    { meal: "Lean beef mince with sweet potato mash and greens", kcal: 520, protein: "40g protein" },
    { meal: "Cottage cheese, oats, berries, honey", kcal: 380, protein: "30g protein" },
  ],
  thu: [
    { meal: "Greek yoghurt, berries, honey, scoop of protein powder", kcal: 350, protein: "35g protein" },
    { meal: "Grilled chicken wrap with salad and hummus", kcal: 460, protein: "36g protein" },
    { meal: "Prawn and quinoa bowl with roasted vegetables", kcal: 470, protein: "34g protein" },
  ],
  fri: [
    { meal: "Prawn stir-fry, quinoa, mixed vegetables", kcal: 470, protein: "38g protein" },
    { meal: "Baked chicken thigh, roasted potatoes, green beans", kcal: 510, protein: "37g protein" },
    { meal: "Protein smoothie, oats, peanut butter, banana", kcal: 420, protein: "32g protein" },
  ],
};

const NUTRITION_CHECKS_KEY = "workout-nutrition-checks-v1";
const notesKeyForBlock = (blockNum) => `workout-notes-block-${blockNum}`;

// a bit of hype when you hit a PR, picked deterministically per exercise/week so it doesn't flicker while typing
const COACH_MESSAGES = [
  "Consistency beats intensity, most days.",
  "Your last session's already banked, nothing undoes that.",
  "Small sessions still count. Show up, that's the whole job today.",
  "You don't need to feel ready, you just need to start.",
  "Whatever today looks like, it's still a rep in the bank.",
  "The plan doesn't need you to be perfect, just present.",
];

const STRENGTH_HYPE = [
  "Wow, you're getting strong now.",
  "That's a proper new best, nice work.",
  "Numbers don't lie, you're stronger than last week.",
  "Getting stronger by the week, keep this up.",
  "That's the kind of progress that adds up fast.",
];

function hypeFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return STRENGTH_HYPE[hash % STRENGTH_HYPE.length];
}

const WAIST_UP_COMMENTS = [
  "No drama, everyone has a heavier week now and then. Back at it.",
  "A touch more this week, nothing a good week won't sort.",
  "Numbers crept up slightly, happens to everyone, onwards.",
];
const WAIST_DOWN_COMMENTS = [
  "Waist's heading the right way, nice work.",
  "Trimming down nicely, keep this up.",
  "That's a solid drop this week, well done.",
];

function waistComment(diffNum, weekIdx) {
  const bank = diffNum > 0 ? WAIST_UP_COMMENTS : diffNum < 0 ? WAIST_DOWN_COMMENTS : null;
  if (!bank) return null;
  const seed = "waist" + weekIdx;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return bank[hash % bank.length];
}

// pre-written coaching notes, no live AI, just genuinely useful cues for the moment you finish a set
const COACH_TIPS = {
  bench: "Keep your feet planted and a slight arch in your back, drive the bar in a straight line, not a curve. If your shoulders ache more than your chest, your elbows are probably flaring too wide.",
  incline_db: "Set the bench to 30 degrees, any steeper and it turns into a shoulder press. Let the dumbbells come down to the sides of your chest, not your collarbone.",
  dips: "Lean forward slightly to keep this chest-dominant rather than triceps-dominant. Stop the descent when your shoulders dip below your elbows, going lower just strains the joint.",
  push_press: "Dip at the knees, not the hips, then drive up hard and punch the dumbbells overhead. If your lower back arches at the top, your core isn't bracing enough.",
  cable_fly: "Keep a soft bend in the elbows throughout, this is a hug motion, not a press. Squeeze and hold half a second at the point your hands meet.",
  hanging_leg_raise: "Curl your pelvis up rather than just swinging your legs, that's what actually works the abs. If you're swinging a lot, drop the reps and slow right down.",
  plank: "Squeeze your glutes and think about pulling your belly button to your spine. Hips sagging is the number one sign you're fatiguing, that's your cue to stop the set.",
  squat: "Break at the hips and knees together, chest stays tall. Push your knees out in the same direction as your toes, don't let them cave in on the way up.",
  rdl: "Soft knees, hinge at the hips and push them back like closing a car boot with your bum. The bar should stay close, almost brushing your legs, the whole way down.",
  lunges: "Front knee tracks over your foot, not past your toes. Most of the weight should stay in the front heel, not the back knee.",
  hip_thrust: "Bench should hit just below your shoulder blades. Drive through your heels and squeeze your glutes hard at the top, don't just extend your back.",
  hip_thrust_2: "Same setup as your heavier days, but focus on a slow controlled tempo since the weight's lighter here. Pause a full second at the top of every rep.",
  leg_press: "Feet roughly shoulder width, don't let your lower back round off the pad at the bottom, that's your depth limit for the day.",
  woodchop: "Rotate through your torso and hips together, keep your arms relatively straight, they're just transmitting the force, not generating it.",
  incline_bb: "Same bar path as flat bench, just angled, keep your wrists stacked directly over your elbows at the bottom.",
  db_bench: "Let the dumbbells travel slightly inward as you press, following a natural arc rather than straight up, that's easier on the shoulders.",
  bb_curl: "Elbows pinned to your sides the entire rep. If you're swinging your torso to finish a rep, the weight's too heavy.",
  hammer_curl: "Thumbs up throughout, this targets the forearm and the outer arm differently to a regular curl, don't twist into a normal curl halfway.",
  cable_curl: "The cable keeps tension on through the whole range, so don't rush the top, that's where most of the benefit is.",
  cable_crunch: "Move from your ribs, not your hips, kneel far enough back that you can round your spine properly into the crunch.",
  bulgarian_split_squat: "Back foot up on the bench, most of the work should be felt in the front leg. If your back knee is doing the work, your front foot's too close to the bench.",
  leg_curl: "Slow the lowering phase down deliberately, that's where hamstrings actually build most of their strength.",
  leg_extension: "Point your toes slightly up and pause at the top for a beat, don't let momentum carry the weight back down.",
  calf_raise: "Full stretch at the bottom, genuine pause at the top. Most people cut the range short and wonder why calves don't grow.",
  bicycle_crunch: "Slow and controlled beats fast and sloppy every time here, rotate your ribcage towards the opposite knee rather than just pulling with your neck.",
  skierg_500: "Drive with your legs first, then finish with your arms, not the other way round. Long powerful pulls beat short frantic ones.",
  row_500: "Legs, then hips, then arms on the drive, reverse it coming back. If your arms are burning out early, you're probably pulling too much with them too soon.",
  sled_push: "Low body angle, almost like pushing into a wall, short choppy steps drive more power than long strides. Keep your arms locked out, don't let the sled steer you.",
  battle_ropes: "Power comes from your legs and core, not just your arms, stay in a slight squat throughout. Big waves beat fast tiny ones for actual conditioning value.",
  sled_push_pull: "Same low angle and short steps on the push. On the pull, sit back like a reverse row and walk backwards under control, don't yank with your arms alone.",
  hyrox_lunge_carry: "Keep the load close to your body, controlled stride length, this is about pacing for distance, not rushing individual steps.",
};

// --- reporting helpers ---

// weekly total tonnage across all four training days, for the whole-block chart
function weeklyTonnageSeries(logsObj, benchBase, squatBase) {
  return Array.from({ length: 6 }, (_, w) => {
    const plan = buildPlan(w, benchBase, squatBase);
    let total = 0;
    DAYS.forEach((d) => {
      total += computeTonnage(logsObj, w, d.key, plan[d.key]);
    });
    return { week: `W${w + 1}`, tonnage: total };
  });
}

// top set weight per week for a given lift, e.g. bench on Tuesday
function weeklyTopLiftSeries(logsObj, dayKey, exerciseId, numSets) {
  return Array.from({ length: 6 }, (_, w) => ({
    week: `W${w + 1}`,
    weight: maxSetWeight(getSets(logsObj, w, dayKey, exerciseId, numSets)) || null,
  }));
}

// a body measurement across the six weeks, for charting
function bodyFieldSeries(bodyLogsObj, field) {
  return Array.from({ length: 6 }, (_, w) => {
    const wk = bodyLogsObj[`w${w + 1}`];
    const v = wk ? parseFloat(wk[field]) : null;
    return { week: `W${w + 1}`, value: v || null };
  });
}

// first logged value vs most recent logged value for a body measurement
function fieldTrend(bodyLogsObj, field) {
  let first = null;
  let last = null;
  for (let w = 1; w <= 6; w++) {
    const v = bodyLogsObj[`w${w}`] && parseFloat(bodyLogsObj[`w${w}`][field]);
    if (v) {
      if (first === null) first = v;
      last = v;
    }
  }
  if (first === null) return null;
  return { first, last, diff: +(last - first).toFixed(1) };
}

// counts every PR hit across the whole block, strength and cardio combined
function countBlockPRs(logsObj, benchBase, squatBase) {
  let count = 0;
  for (let w = 0; w < 6; w++) {
    const plan = buildPlan(w, benchBase, squatBase);
    DAYS.forEach((d) => {
      plan[d.key].forEach((ex) => {
        if (ex.type === "cardio") {
          if (isCardioPR(logsObj, w, d.key, ex.id)) count++;
        } else {
          if (isPR(logsObj, w, d.key, ex.id, ex.sets)) count++;
        }
      });
    });
  }
  return count;
}

function blockStats(logsObj, bodyLogsObj, benchBase, squatBase) {
  const tonnageSeries = weeklyTonnageSeries(logsObj, benchBase, squatBase);
  const totalTonnage = tonnageSeries.reduce((a, b) => a + (b.tonnage || 0), 0);
  const prCount = countBlockPRs(logsObj, benchBase, squatBase);
  const bw = fieldTrend(bodyLogsObj, "bodyweight");
  return { totalTonnage, prCount, bwChange: bw ? bw.diff : null };
}

// a discipline reminder for each training day, meant to be read before you touch a weight
const DAY_KEYS_ORDER = ["tue", "wed", "thu", "fri"];

// a real pool, picked by week and day together so it varies properly, not the same four
// lines on repeat every single week
const DISCIPLINE_QUOTES = [
  "Discipline is remembering what you want most, not what you want right now.",
  "You don't have to feel like it. You just have to show up anyway.",
  "Consistency is the only cheat code that's ever actually worked.",
  "The rep you're tempted to skip is usually the one that changes you.",
  "Motivation gets you here once. Discipline gets you here every time.",
  "Nobody regrets the session they finished. Plenty regret the one they skipped.",
  "You're not building today's body. You're building the one six weeks from now.",
  "The plan doesn't care how you feel this morning. Show up anyway.",
  "Small, boring, repeated. That's the whole secret.",
  "The days you don't want to train are the ones that actually count.",
  "Progress hides in the sessions nobody's watching.",
  "You've never once regretted finishing strong.",
  "Some days it's heavy. Show up anyway, that's the job.",
  "The version of you that quits today never meets the version six weeks from now.",
  "Nobody's coming to do this for you. Good, that means it's entirely yours.",
  "One more session in the bank. That's all today needs to be.",
];

function getDayQuote(weekIdx, dayKey) {
  const dayIndex = DAY_KEYS_ORDER.indexOf(dayKey);
  const idx = (weekIdx * DAY_KEYS_ORDER.length + (dayIndex >= 0 ? dayIndex : 0)) % DISCIPLINE_QUOTES.length;
  return DISCIPLINE_QUOTES[idx];
}

// silly but roughly real-world reference points for the tonnage counter, ascending order
const TONNAGE_COMPARISONS = [
  { kg: 50, label: "a large dog" },
  { kg: 300, label: "a baby cow" },
  { kg: 500, label: "a grand piano" },
  { kg: 1000, label: "a small car" },
  { kg: 1500, label: "a great white shark" },
  { kg: 3000, label: "a hippo" },
  { kg: 6000, label: "an African elephant" },
  { kg: 12000, label: "a London double-decker bus" },
];

function tonnageComparison(kg) {
  if (kg <= 0) return { current: null, next: TONNAGE_COMPARISONS[0] };
  let current = null;
  let next = null;
  for (let i = 0; i < TONNAGE_COMPARISONS.length; i++) {
    if (TONNAGE_COMPARISONS[i].kg <= kg) {
      current = TONNAGE_COMPARISONS[i];
    } else {
      next = TONNAGE_COMPARISONS[i];
      break;
    }
  }
  return { current, next };
}

// total kg shifted today: sum of each individual set's own weight x reps, now that sets are logged separately
function computeTonnage(logs, weekIdx, dayKey, exercises) {
  let total = 0;
  exercises.forEach((ex) => {
    if (ex.type === "cardio") return;
    if (String(ex.reps).toLowerCase().includes("sec")) return; // planks etc, not a rep-based lift
    const sets = getSets(logs, weekIdx, dayKey, ex.id, ex.sets);
    sets.forEach((s) => {
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps) || parseInt(ex.reps) || 0;
      if (w && r) total += w * r;
    });
  });
  return Math.round(total);
}

const META_KEY = "workout-meta-v1";
const ARCHIVE_KEY = "workout-archive-v1";
const logsKeyForBlock = (blockNum) => `workout-logs-block-${blockNum}`;
const bodyKeyForBlock = (blockNum) => `workout-body-block-${blockNum}`;
const logKey = (week, day, exerciseId) => `w${week + 1}-${day}-${exerciseId}`;
const dayNoteKey = (week, day) => `w${week + 1}-${day}`;

// returns a fixed-length array of {weight, reps} for every set of an exercise, filling in blanks
const WORD_NUMS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
function toNum(str) {
  if (!str) return null;
  const n = parseFloat(str);
  if (!isNaN(n)) return n;
  return WORD_NUMS[String(str).toLowerCase()] || null;
}

// understands phrases like "set 1, 20kg for 5" or "rep one, 20 kilos for five", typed or dictated
function parseQuickEntry(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const setMatch = lower.match(/(?:set|rep)s?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/);
  const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)/);
  const repsMatch =
    lower.match(/for\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/) ||
    lower.match(/x\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/) ||
    lower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*reps?/);
  const setNum = setMatch ? toNum(setMatch[1]) : null;
  if (!setNum) return null;
  return {
    setIndex: setNum - 1,
    weight: weightMatch ? weightMatch[1] : null,
    reps: repsMatch ? toNum(repsMatch[1]) : null,
  };
}

function getSets(logs, weekIdx, dayKey, exerciseId, numSets) {
  const entry = logs[logKey(weekIdx, dayKey, exerciseId)];
  const sets = (entry && entry.sets) || [];
  return Array.from({ length: numSets }, (_, i) => sets[i] || { weight: "", reps: "" });
}

function maxSetWeight(sets) {
  let max = 0;
  sets.forEach((s) => {
    const w = parseFloat(s.weight);
    if (w && w > max) max = w;
  });
  return max || null;
}

function isPR(logs, weekIdx, dayKey, exerciseId, numSets) {
  const currentMax = maxSetWeight(getSets(logs, weekIdx, dayKey, exerciseId, numSets));
  if (!currentMax) return false;
  for (let w = 0; w < 6; w++) {
    if (w === weekIdx) continue;
    const otherMax = maxSetWeight(getSets(logs, w, dayKey, exerciseId, numSets));
    if (otherMax && otherMax >= currentMax) return false;
  }
  return true;
}

// "mm:ss" or "ss" -> total seconds, null if not parseable
function timeToSeconds(str) {
  if (!str) return null;
  const parts = String(str).split(":").map((p) => parseFloat(p));
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

// for cardio, a PR is a faster (lower) time than every other week logged
function isCardioPR(logs, weekIdx, dayKey, exerciseId) {
  const current = logs[logKey(weekIdx, dayKey, exerciseId)];
  const currentSecs = timeToSeconds(current && current.time);
  if (currentSecs === null) return false;
  for (let w = 0; w < 6; w++) {
    if (w === weekIdx) continue;
    const l = logs[logKey(w, dayKey, exerciseId)];
    const otherSecs = timeToSeconds(l && l.time);
    if (otherSecs !== null && otherSecs <= currentSecs) return false;
  }
  return true;
}

// looks back through previous weeks for the heaviest set logged on this exercise, and suggests the next jump
// deload weeks suggest a drop instead of a rise
function suggestedWeight(logs, weekIdx, dayKey, exerciseId, numSets, increment, isDeload) {
  for (let w = weekIdx - 1; w >= 0; w--) {
    const prevMax = maxSetWeight(getSets(logs, w, dayKey, exerciseId, numSets));
    if (prevMax) {
      const suggested = isDeload ? roundTo25(prevMax * 0.85) : roundTo25(prevMax + increment);
      return { suggested, prevWeight: prevMax, prevWeek: w + 1 };
    }
  }
  return null;
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function weekFromDate(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 0;
  return Math.min(5, Math.floor(diffDays / 7));
}

// maps today's real weekday onto the plan, returns null on a rest day (Mon, Sat, Sun)
function todaysDayKey() {
  const map = { 2: "tue", 3: "wed", 4: "thu", 5: "fri" };
  return map[new Date().getDay()] || null;
}

const DEFAULT_META = { blockNum: 1, startDate: todayStr(), benchBase: "", squatBase: "" };

// ---------- DESIGN TOKENS ----------
// Black, teal and white. One accent (teal) used only for calls to action, PRs and the timer.
const C = {
  page: "#F4F3EF",
  card: "#FFFFFF",
  ink: "#111111",
  sub: "#5C5C5C",
  note: "#7A7A7A",
  line: "#111111",
  accent: "#0E6E67",
  good: "#3FAFA3",
};

// ---------- PERSONALITY ASSESSMENT ----------
// Same validated framework as the standalone prototype: three independent axes
// (structure preference, task vs ego achievement orientation, solo vs social),
// restyled to this app's existing black/teal/white identity rather than a
// separate colour language. Doesn't change the actual programme yet, that's
// deliberate, the 6-week block stays exactly as tested. This layer is here so
// the coaching voice and companion can be personal while the training itself
// stays proven.
const ASSESSMENT_KEY = "workout-assessment-v1";
const AGE_GROUPS = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const INTAKE_GOALS = [
  { id: "hyrox", label: "HYROX / hybrid fitness" },
  { id: "5k", label: "Run a 5K" },
  { id: "10k", label: "Run a 10K" },
  { id: "half", label: "Half marathon" },
  { id: "marathon", label: "Marathon" },
  { id: "ironman", label: "Triathlon / Ironman" },
  { id: "weightloss", label: "Lose weight" },
  { id: "cutting", label: "Cut, get lean" },
  { id: "bulking", label: "Bulk, add size" },
  { id: "toned_glutes", label: "Lean & toned, glute-focused" },
  { id: "strength", label: "General strength" },
  { id: "calisthenics", label: "Calisthenics" },
  { id: "general", label: "General fitness" },
];

const TYPES = {
  engineer: {
    name: "The Engineer",
    tagline: "You want the numbers to add up, against yourself, and you'd rather work it out alone.",
    desc: "Precise plans and a clear target, measured against your own last effort, done without an audience.",
    x: 1,
    social: false,
  },
  anchor: {
    name: "The Anchor",
    tagline: "Same reliable structure every time, and it's better with others around.",
    desc: "A fixed plan you return to, chasing your own progress, steadier when training alongside other people.",
    x: 1,
    social: true,
  },
  challenger: {
    name: "The Challenger",
    tagline: "A proven system that puts you ahead of everyone else, built alone.",
    desc: "Plan laid out precisely, no decisions to make, driven by being better than the people around you, worked out quietly on your own.",
    x: 1,
    social: false,
  },
  captain: {
    name: "The Captain",
    tagline: "A proven system, and you want to prove it in front of people.",
    desc: "Structure and a clear benchmark matter, but so does an audience, at your best leading or competing where others can see it.",
    x: 1,
    social: true,
  },
  explorer: {
    name: "The Explorer",
    tagline: "You train for you, whatever that looks like each day, happiest figuring it out alone.",
    desc: "Freedom to choose the session that fits how you feel, success measured entirely by your own growth.",
    x: -1,
    social: false,
  },
  companion: {
    name: "The Companion",
    tagline: "You train for you, but it's better with people around.",
    desc: "Flexibility and your own sense of progress matter, but it sticks better with company, not competition, just people.",
    x: -1,
    social: true,
  },
  competitor: {
    name: "The Competitor",
    tagline: "You train to win, wherever the challenge shows up, chasing it alone.",
    desc: "Fixed routines bore you fast, driven by beating a number or a rival, chased on your own terms.",
    x: -1,
    social: false,
  },
  maverick: {
    name: "The Maverick",
    tagline: "You train to win, and you want the room to feel it too.",
    desc: "Variety keeps you interested, beating someone else is what drives you, best of all live, in front of other people.",
    x: -1,
    social: true,
  },
};

const TASK_TYPES = ["engineer", "anchor", "explorer", "companion"];

// ---------- GOAL-BASED REFERENCE PLANS ----------
// These are reference plans tied to whatever goal was picked at assessment, viewable in
// their own screen. The actual day-to-day logging in the Workout tab stays on the tested
// HYROX programme regardless, this doesn't replace that, it sits alongside it. Content is
// written once per goal, delivery (exact numbers vs a menu of options) varies by type,
// same pattern as everything else in this app.
const GOAL_PLAN_CONTENT = {
  strength: {
    label: "General strength",
    caveat: null,
    days: [
      { day: "Day 1 — Full Body, Push Focus", exercises: [
        { name: "Squat", structured: "4 sets x 6 reps", options: ["Barbell Back Squat", "Goblet Squat", "Leg Press"] },
        { name: "Bench Press", structured: "4 sets x 6 reps", options: ["Barbell Bench Press", "Dumbbell Bench Press"] },
        { name: "Row", structured: "3 sets x 8 reps", options: ["Barbell Row", "Cable Row"] },
        { name: "Core Finisher", structured: "3 sets x 40 sec", options: ["Plank", "Dead Bug"] },
      ]},
      { day: "Day 2 — Conditioning + Core", exercises: [
        { name: "Interval Cardio", structured: "8 rounds, 1 min hard / 1 min easy", options: ["Bike", "Row", "SkiErg"] },
        { name: "Core Circuit", structured: "3 rounds", options: ["Hanging Knee Raise", "Cable Woodchop"] },
      ]},
      { day: "Day 3 — Full Body, Pull Focus", exercises: [
        { name: "Deadlift", structured: "4 sets x 5 reps", options: ["Barbell Deadlift", "Trap Bar Deadlift", "Romanian Deadlift"] },
        { name: "Pulldown or Pull-Up", structured: "4 sets x 8 reps", options: ["Lat Pulldown", "Assisted Pull-Up"] },
        { name: "Overhead Press", structured: "3 sets x 8 reps", options: ["Barbell Overhead Press", "Dumbbell Shoulder Press"] },
        { name: "Core Finisher", structured: "3 sets x 10 per side", options: ["Dead Bug", "Pallof Press"] },
      ]},
      { day: "Day 4 — Metabolic Finisher", exercises: [
        { name: "Complex Circuit", structured: "5 rounds, 40 sec on / 20 sec off", options: ["Kettlebell Swing", "Dumbbell Thruster", "Burpee"] },
      ]},
    ],
  },
  bulking: {
    label: "Bulk, add size",
    caveat: "Higher volume than the other plans on purpose, that's what drives size, recovery matters more here, don't skip sleep or food to compensate.",
    days: [
      { day: "Day 1 — Chest & Triceps", exercises: [
        { name: "Bench Press", structured: "4 sets x 6 reps", options: ["Barbell Bench Press", "Dumbbell Bench Press"] },
        { name: "Incline Press", structured: "4 sets x 8 reps", options: ["Incline Barbell Press", "Incline Dumbbell Press"] },
        { name: "Dips", structured: "3 sets x 10 reps", options: ["Weighted Dips", "Bodyweight Dips"] },
        { name: "Cable Fly", structured: "3 sets x 12 reps", options: ["Cable Fly", "Pec Deck"] },
        { name: "Tricep Pushdown", structured: "3 sets x 12 reps", options: ["Cable Pushdown", "Overhead Extension"] },
      ]},
      { day: "Day 2 — Back & Biceps", exercises: [
        { name: "Deadlift", structured: "4 sets x 5 reps", options: ["Barbell Deadlift", "Trap Bar Deadlift"] },
        { name: "Row", structured: "4 sets x 8 reps", options: ["Barbell Row", "Chest-Supported Row"] },
        { name: "Pulldown", structured: "3 sets x 10 reps", options: ["Lat Pulldown", "Pull-Up"] },
        { name: "Barbell Curl", structured: "3 sets x 10 reps", options: ["Barbell Curl", "EZ Bar Curl"] },
        { name: "Hammer Curl", structured: "3 sets x 12 reps", options: ["Dumbbell Hammer Curl", "Cable Hammer Curl"] },
      ]},
      { day: "Day 3 — Legs", exercises: [
        { name: "Squat", structured: "4 sets x 6 reps", options: ["Barbell Back Squat", "Front Squat"] },
        { name: "Leg Press", structured: "4 sets x 10 reps", options: ["Leg Press", "Hack Squat"] },
        { name: "Romanian Deadlift", structured: "3 sets x 10 reps", options: ["Barbell RDL", "Dumbbell RDL"] },
        { name: "Leg Curl", structured: "3 sets x 12 reps", options: ["Lying Leg Curl", "Seated Leg Curl"] },
        { name: "Calf Raise", structured: "4 sets x 15 reps", options: ["Standing Calf Raise", "Leg Press Calf Raise"] },
      ]},
      { day: "Day 4 — Shoulders & Arms", exercises: [
        { name: "Overhead Press", structured: "4 sets x 8 reps", options: ["Barbell Overhead Press", "Dumbbell Shoulder Press"] },
        { name: "Lateral Raise", structured: "4 sets x 15 reps", options: ["Dumbbell Lateral Raise", "Cable Lateral Raise"] },
        { name: "Rear Delt Fly", structured: "3 sets x 15 reps", options: ["Rear Delt Fly", "Face Pull"] },
        { name: "Close-Grip Bench", structured: "3 sets x 10 reps", options: ["Close-Grip Bench Press", "Skull Crusher"] },
        { name: "Preacher Curl", structured: "3 sets x 12 reps", options: ["Preacher Curl", "Concentration Curl"] },
      ]},
    ],
  },
  toned_glutes: {
    label: "Lean & toned, glute-focused",
    caveat: null,
    days: [
      { day: "Day 1 — Glutes & Hamstrings", exercises: [
        { name: "Romanian Deadlift", structured: "4 sets x 8 reps", options: ["Barbell RDL", "Dumbbell RDL"] },
        { name: "Hip Thrust", structured: "4 sets x 10 reps", options: ["Barbell Hip Thrust", "Single-Leg Hip Thrust"] },
        { name: "Walking Lunge", structured: "3 sets x 12 per leg", options: ["Walking Lunge", "Reverse Lunge"] },
        { name: "Cable Kickback", structured: "3 sets x 15 per leg", options: ["Cable Kickback", "Band Kickback"] },
      ]},
      { day: "Day 2 — Full Body Tone", exercises: [
        { name: "Goblet Squat", structured: "3 sets x 12 reps", options: ["Goblet Squat", "Leg Press"] },
        { name: "Dumbbell Bench Press", structured: "3 sets x 12 reps", options: ["Dumbbell Bench Press", "Push-Up"] },
        { name: "Lat Pulldown", structured: "3 sets x 12 reps", options: ["Lat Pulldown", "Assisted Pull-Up"] },
        { name: "Core Finisher", structured: "3 sets x 40 sec", options: ["Plank", "Side Plank"] },
      ]},
      { day: "Day 3 — Glutes & Core", exercises: [
        { name: "Bulgarian Split Squat", structured: "4 sets x 8 per leg", options: ["Bulgarian Split Squat", "Step-Up"] },
        { name: "Hip Thrust", structured: "4 sets x 12 reps", options: ["Barbell Hip Thrust", "Glute Bridge"] },
        { name: "Cable Woodchop", structured: "3 sets x 12 per side", options: ["Cable Woodchop", "Pallof Press"] },
      ]},
      { day: "Day 4 — Conditioning", exercises: [
        { name: "Incline Walk", structured: "30 minutes", options: ["Treadmill Incline Walk", "Outdoor Hill Walk"] },
        { name: "Lateral Band Walk", structured: "3 sets x 10 per side", options: ["Lateral Band Walk", "Monster Walk"] },
      ]},
    ],
  },
  calisthenics: {
    label: "Calisthenics",
    caveat: "Progressions matter more than reps here, don't rush to the next progression before the current one is genuinely controlled.",
    days: [
      { day: "Day 1 — Push", exercises: [
        { name: "Push-Up Progression", structured: "4 sets to near failure", options: ["Standard Push-Up", "Deficit Push-Up", "Archer Push-Up"] },
        { name: "Dip Progression", structured: "3 sets to near failure", options: ["Bench Dip", "Bar Dip", "Weighted Dip"] },
        { name: "Pike Push-Up", structured: "3 sets x 8 reps", options: ["Pike Push-Up", "Elevated Pike Push-Up"] },
        { name: "Core Finisher", structured: "3 sets x 40 sec", options: ["Plank", "Hollow Hold"] },
      ]},
      { day: "Day 2 — Pull", exercises: [
        { name: "Pull-Up Progression", structured: "4 sets to near failure", options: ["Band-Assisted Pull-Up", "Pull-Up", "Weighted Pull-Up"] },
        { name: "Row Progression", structured: "3 sets x 10 reps", options: ["Australian Row", "Ring Row"] },
        { name: "Core Finisher", structured: "3 sets x 20 sec", options: ["Hollow Hold", "L-Sit"] },
      ]},
      { day: "Day 3 — Legs", exercises: [
        { name: "Pistol Squat Progression", structured: "3 sets x 8 per leg", options: ["Assisted Pistol Squat", "Box Pistol Squat", "Pistol Squat"] },
        { name: "Bulgarian Split Squat", structured: "3 sets x 10 per leg", options: ["Bodyweight", "Weighted"] },
        { name: "Calf Raise", structured: "3 sets x 15 reps", options: ["Standing Calf Raise", "Single-Leg Calf Raise"] },
        { name: "Wall Sit", structured: "3 sets x 40 sec", options: ["Wall Sit", "Single-Leg Wall Sit"] },
      ]},
      { day: "Day 4 — Skills & Core", exercises: [
        { name: "L-Sit Progression", structured: "3 sets, max hold", options: ["Tucked L-Sit", "One-Leg L-Sit", "Full L-Sit"] },
        { name: "Handstand Practice", structured: "5 sets x 30 sec", options: ["Wall Handstand", "Freestanding Attempt"] },
        { name: "Hanging Leg Raise", structured: "3 sets x 10 reps", options: ["Hanging Knee Raise", "Hanging Leg Raise"] },
      ]},
    ],
  },
};

// endurance goals share one structure, since the sessions are the same shape, only the
// distances and intensities change, that's parametrised here rather than duplicated five times
const ENDURANCE_TARGETS = {
  "5k": { intervals: "6 x 400m", longRun: "5km", caveat: "A single six-week block is a reasonable amount of time to genuinely improve a 5K, this one holds up well on its own." },
  "10k": { intervals: "6 x 600m", longRun: "8km", caveat: "Six weeks is workable for a 10K if there's some existing running base, less so starting from zero." },
  half: { intervals: "5 x 1km", longRun: "12-14km, building week to week", caveat: "Six weeks is a short runway for a half marathon. Fine as a focused block if there's existing running fitness, not a full beginner-to-half-marathon plan on its own." },
  marathon: { intervals: "5 x 1200m", longRun: "16-20km, building week to week", caveat: "Being straightforward here: proper marathon preparation genuinely needs 16 to 20 weeks of structured build, not six. Treat this as one solid block within a longer build, not the whole plan, and get a dedicated marathon programme or coach alongside it." },
  ironman: { intervals: "5 x 1200m (run leg only)", longRun: "16-20km, building week to week", caveat: "This only covers the running third of an Ironman. It says nothing about swim or bike volume, both of which need real structured training too. Full Ironman preparation runs months, not weeks, and really deserves a qualified triathlon coach rather than a generic app plan. Treat this as a run-fitness base at most." },
};

function enduranceDays(goalId) {
  const t = ENDURANCE_TARGETS[goalId];
  return [
    { day: "Day 1 — Easy Run", exercises: [{ name: "Easy Pace Run", structured: "30-40 min, conversational pace", options: ["Outdoor Run", "Treadmill Run"] }] },
    { day: "Day 2 — Intervals", exercises: [{ name: "Interval Session", structured: t.intervals, options: ["Track Intervals", "Treadmill Intervals"] }] },
    { day: "Day 3 — Strength Support", exercises: [
      { name: "Squat", structured: "3 sets x 8 reps", options: ["Goblet Squat", "Barbell Squat"] },
      { name: "Romanian Deadlift", structured: "3 sets x 8 reps", options: ["Barbell RDL", "Dumbbell RDL"] },
      { name: "Lunge", structured: "3 sets x 10 per leg", options: ["Walking Lunge", "Reverse Lunge"] },
      { name: "Core Finisher", structured: "3 sets x 40 sec", options: ["Plank", "Side Plank"] },
    ]},
    { day: "Day 4 — Long Run", exercises: [{ name: "Long Run", structured: t.longRun, options: ["Outdoor Long Run"] }] },
  ];
}

// which types get exact numbers vs a menu of options, and how progress gets framed,
// reused across every goal rather than repeated per plan
function resolveGoalPlan(goalId, typeId) {
  if (goalId === "hyrox") return null; // this is the live tracked programme already, nothing extra to show
  const t = TYPES[typeId];
  const isStructured = t ? t.x === 1 : true;
  const isTask = TASK_TYPES.includes(typeId);

  let content;
  if (ENDURANCE_TARGETS[goalId]) {
    content = { label: GOALS_LABELS[goalId], caveat: ENDURANCE_TARGETS[goalId].caveat, days: enduranceDays(goalId) };
  } else if (goalId === "weightloss" || goalId === "cutting" || goalId === "general") {
    content = { ...GOAL_PLAN_CONTENT.strength, label: GOALS_LABELS[goalId] };
  } else {
    content = GOAL_PLAN_CONTENT[goalId];
  }
  if (!content) return null;

  const days = content.days.map((d) => ({
    day: d.day,
    exercises: d.exercises.map((ex) => ({
      name: ex.name,
      display: isStructured ? ex.structured : `Pick one: ${ex.options.join(", ")}`,
    })),
  }));

  const progressNote = isTask
    ? "Track this against your own last session, the only comparison that matters is you a few weeks ago."
    : "Aim to benchmark these against real standards for your level, not just your own history.";

  const socialNote = t && t.social
    ? "This works best with someone else doing it alongside you."
    : "Built to run entirely solo.";

  return { label: content.label, caveat: content.caveat, days, progressNote, socialNote };
}

const GOALS_LABELS = {
  hyrox: "HYROX / hybrid fitness",
  "5k": "a 5K",
  "10k": "a 10K",
  half: "a half marathon",
  marathon: "a marathon",
  ironman: "a Triathlon / Ironman",
  weightloss: "losing weight",
  cutting: "cutting, getting lean",
  bulking: "bulking, adding size",
  toned_glutes: "a lean, toned, glute-focused physique",
  strength: "general strength",
  calisthenics: "calisthenics",
  general: "general fitness",
};

function resolveType(structureScore, orientationScore, socialScore) {
  const x = structureScore >= 0 ? "s" : "a";
  const y = orientationScore >= 0 ? "t" : "e";
  const z = socialScore >= 0 ? "social" : "solo";
  if (x === "s" && y === "t") return z === "solo" ? "engineer" : "anchor";
  if (x === "s" && y === "e") return z === "solo" ? "challenger" : "captain";
  if (x === "a" && y === "t") return z === "solo" ? "explorer" : "companion";
  return z === "solo" ? "competitor" : "maverick";
}

const ASSESSMENT_QUESTIONS = [
  { a: "I like knowing exactly what my day looks like before it starts.", b: "I like seeing how the day unfolds and deciding as I go.", axis: "structure" },
  { a: "I feel proudest comparing myself to who I was last year.", b: "I feel proudest comparing myself to the people around me.", axis: "orientation" },
  { a: "I do my best work surrounded by other people doing the same thing.", b: "I do my best work on my own, away from distraction.", axis: "social" },
  { a: "I keep a routine I return to, day after day.", b: "My routine changes shape depending on how I feel.", axis: "structure" },
  { a: "Getting better at something matters more to me than being the best at it.", b: "Being the best at something matters more to me than just getting better.", axis: "orientation" },
  { a: "Sharing what I'm working on with other people keeps me going.", b: "Keeping what I'm working on to myself keeps me going.", axis: "social" },
  { a: "A detailed to-do list makes me feel in control.", b: "A detailed to-do list makes me feel boxed in.", axis: "structure" },
  { a: "In a game or a task, I care more about how well I played.", b: "In a game or a task, I care more about whether I won.", axis: "orientation" },
  { a: "I'd choose a team challenge over a solo one, given the choice.", b: "I'd choose a solo challenge over a team one, given the choice.", axis: "social" },
  { a: "I feel calmer with a plan already set, even a strict one.", b: "I feel calmer with room to improvise as I go.", axis: "structure" },
  { a: "My own progress is the win I actually notice.", b: "Where I stand against others is the win I actually notice.", axis: "orientation" },
  { a: "A group effort energises me.", b: "A group effort drains me, I'd rather go it alone.", axis: "social" },
];

// companion blend runs black-to-teal, this app's own palette, rather than a new colour language
const COACH_CORAL = "#FF6B57";
const COACH_CYAN = "#4CC9F0";

function Companion({ typeId, mood = "idle", size = 100 }) {
  const t = typeId ? TYPES[typeId] : null;
  const mix = t ? (t.x + 1) / 2 : 0.5;
  const eyeY = mood === "celebrating" ? 42 : mood === "encouraging" ? 48 : 45;
  const mouthPath =
    mood === "celebrating" ? "M40 62 Q60 78 80 62" : mood === "encouraging" ? "M42 64 Q60 68 78 64" : "M44 62 Q60 70 76 62";

  return (
    <div style={{ width: size, height: size, position: "relative", display: "inline-block" }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <defs>
          <linearGradient id={`coach-grad-${typeId || "default"}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset={`${(1 - mix) * 100}%`} stopColor={COACH_CYAN} />
            <stop offset={`${mix * 100}%`} stopColor={COACH_CORAL} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="48" fill={`url(#coach-grad-${typeId || "default"})`} />
        <circle cx="44" cy={eyeY} r="5" fill="#FFFFFF" />
        <circle cx="76" cy={eyeY} r="5" fill="#FFFFFF" />
        <path d={mouthPath} stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
      {t && t.social && (
        <div style={{ position: "absolute", right: -size * 0.12, bottom: -size * 0.02, width: size * 0.42, height: size * 0.42 }}>
          <svg width="100%" height="100%" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill={`url(#coach-grad-${typeId || "default"})`} opacity="0.6" />
            <circle cx="44" cy="45" r="6" fill="#FFFFFF" />
            <circle cx="76" cy="45" r="6" fill="#FFFFFF" />
            <path d="M44 62 Q60 70 76 62" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      )}
    </div>
  );
}

const CORAL_HEX = 0xff6b57;
const CYAN_HEX = 0x4cc9f0;

// the real 3D coach, reserved for the moments that matter, the reveal, the type card,
// the intro, rather than every tiny icon, a full WebGL scene at 30px adds weight without
// adding anything visible
function CrystalCoach({ mix = 0.5, social = false, mood = "idle" }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const coreGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f3f0,
      metalness: 0.25,
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const satGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const satMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f3f0,
      metalness: 0.25,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    });
    const satellite = new THREE.Mesh(satGeo, satMat);
    scene.add(satellite);

    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 2.4 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.55 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const coralLight = new THREE.PointLight(CORAL_HEX, 6, 12);
    coralLight.position.set(-3, 1.5, 3);
    scene.add(coralLight);

    const cyanLight = new THREE.PointLight(CYAN_HEX, 6, 12);
    cyanLight.position.set(3, -1, 3);
    scene.add(cyanLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const rimLight = new THREE.PointLight(0xffffff, 1.5, 15);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    stateRef.current = { scene, camera, renderer, core, satellite, particles, coralLight, cyanLight, clock: new THREE.Clock(), burst: 0 };

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const s = stateRef.current;
      const t = s.clock.getElapsedTime();
      const m = s.moodTarget || { speed: 1, scaleAmp: 0.03, glow: 0.4, particleSpeed: 1 };

      s.core.rotation.y += 0.006 * m.speed;
      s.core.rotation.x += 0.002 * m.speed;

      const breathe = 1 + Math.sin(t * 1.6) * m.scaleAmp + (s.burst > 0 ? s.burst : 0);
      s.core.scale.setScalar(breathe);
      if (s.burst > 0) s.burst *= 0.9;

      const coralBase = s.coralBaseIntensity != null ? s.coralBaseIntensity : 5;
      const cyanBase = s.cyanBaseIntensity != null ? s.cyanBaseIntensity : 5;
      s.coralLight.intensity = coralBase + Math.sin(t * 1.2) * 1.5 * m.glow + m.glow * 3;
      s.cyanLight.intensity = cyanBase + Math.cos(t * 1.2) * 1.5 * m.glow + m.glow * 3;

      s.particles.rotation.y += 0.0015 * m.particleSpeed;
      s.particles.rotation.x += 0.0008 * m.particleSpeed;

      if (s.satellite.visible) {
        const orbT = t * 0.7 * m.speed;
        s.satellite.position.set(Math.cos(orbT) * 2.6, Math.sin(orbT * 0.6) * 0.8, Math.sin(orbT) * 2.6);
        s.satellite.rotation.y += 0.01;
      }

      s.renderer.render(s.scene, s.camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.core) return;
    s.satellite.visible = social;

    const moodMap = {
      idle: { speed: 1, scaleAmp: 0.03, glow: 0.35, particleSpeed: 1 },
      celebrating: { speed: 2.4, scaleAmp: 0.05, glow: 1, particleSpeed: 2.2 },
      encouraging: { speed: 0.5, scaleAmp: 0.015, glow: 0.15, particleSpeed: 0.5 },
    };
    s.moodTarget = moodMap[mood] || moodMap.idle;
    if (mood === "celebrating") s.burst = 0.18;

    // don't blend coral and cyan into one flat colour, that's what was averaging out to
    // purple, keep the material neutral and let the two coloured lights do the actual work,
    // your type just shifts which light leans stronger, both stay genuinely visible
    s.coralBaseIntensity = 3 + mix * 5;
    s.cyanBaseIntensity = 3 + (1 - mix) * 5;
    s.core.material.color = new THREE.Color(0xf0f0f2);
    s.core.material.emissive = new THREE.Color(0x000000);
    s.satellite.material.color = new THREE.Color(0xf0f0f2);
  }, [mix, social, mood]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

// same typeId-based API as the flat Companion, so it drops straight into existing spots
function Coach3D({ typeId, mood = "idle", size = 100 }) {
  const t = typeId ? TYPES[typeId] : null;
  const mix = t ? (t.x + 1) / 2 : 0.5;
  const social = t ? t.social : false;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden" }}>
      <CrystalCoach mix={mix} social={social} mood={mood} />
    </div>
  );
}

function AssessmentAxisBar({ leftLabel, rightLabel, value }) {
  const pct = ((value + 4) / 8) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.sub, marginBottom: 4, fontWeight: 700 }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#E4E2DB", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.accent, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// the one-off onboarding flow, shown only until an assessment result is saved
const OB_BG = "#0E1224";
const OB_CARD = "#181D33";
const OB_LINE = "#2A2F4C";
const OB_SUB = "#9098B5";

function Onboarding({ onComplete }) {
  const [step, setStep] = useState("intro");
  const [ageGroup, setAgeGroup] = useState(null);
  const [goals, setGoals] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(ASSESSMENT_QUESTIONS.length).fill(null));

  const scores = useMemo(() => {
    let structureScore = 0;
    let orientationScore = 0;
    let socialScore = 0;
    answers.forEach((side, i) => {
      if (!side) return;
      const q = ASSESSMENT_QUESTIONS[i];
      const delta = side === "a" ? 1 : -1;
      if (q.axis === "structure") structureScore += delta;
      else if (q.axis === "orientation") orientationScore += delta;
      else socialScore += delta;
    });
    return { structureScore, orientationScore, socialScore };
  }, [answers]);

  const typeId = resolveType(scores.structureScore, scores.orientationScore, scores.socialScore);

  const answer = (side) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = side;
      return next;
    });

    if (qIndex + 1 < ASSESSMENT_QUESTIONS.length) {
      setTimeout(() => setQIndex((i) => i + 1), 150);
    } else {
      setTimeout(() => setStep("reveal"), 350);
    }
  };

  const goBack = () => {
    if (qIndex > 0) setQIndex((i) => i - 1);
  };

  const finish = () => {
    onComplete({ typeId, ageGroup, goals, completedAt: new Date().toISOString() });
  };

  const gradientBtn = { background: `linear-gradient(90deg, ${COACH_CYAN}, ${COACH_CORAL})`, color: "#0E1224" };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: OB_BG }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="max-w-md mx-auto px-5 py-10">
        {step === "intro" && (
          <div className="text-center pt-10">
            <Coach3D mood="idle" size={90} />
            <h1 className="font-display mt-5 text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.4rem" }}>
              WHAT'S YOUR TRAINING STYLE?
            </h1>
            <p className="mt-2 text-sm" style={{ color: OB_SUB, lineHeight: 1.6 }}>
              Twelve quick calls, no right answers. Your training programme stays exactly the same either way, this
              just shapes how your coach talks to you.
            </p>
            <button onClick={() => setStep("age")} className="mt-6 px-8 py-3 rounded-full font-bold text-sm" style={gradientBtn}>
              Start
            </button>
          </div>
        )}

        {step === "age" && (
          <div>
            <p className="text-xs font-bold uppercase" style={{ color: OB_SUB }}>
              Quick one first
            </p>
            <h2 className="font-display text-2xl mt-1 mb-4 text-white">Which age group's you?</h2>
            <div className="space-y-2">
              {AGE_GROUPS.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setAgeGroup(a);
                    setStep("goal");
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold text-white"
                  style={{ borderColor: OB_LINE, backgroundColor: OB_CARD }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "goal" && (
          <div>
            <p className="text-xs font-bold uppercase" style={{ color: OB_SUB }}>
              What's this really for
            </p>
            <h2 className="font-display text-2xl mt-1 mb-4 text-white">Pick up to two.</h2>
            <div className="grid grid-cols-2 gap-2">
              {INTAKE_GOALS.map((g) => {
                const selected = goals.includes(g.id);
                const disabled = !selected && goals.length >= 2;
                return (
                  <button
                    key={g.id}
                    disabled={disabled}
                    onClick={() => setGoals((prev) => (selected ? prev.filter((id) => id !== g.id) : [...prev, g.id]))}
                    className="text-left px-3 py-3 rounded-xl border text-sm font-semibold"
                    style={{
                      borderColor: selected ? COACH_CORAL : OB_LINE,
                      backgroundColor: selected ? "rgba(255,107,87,0.14)" : OB_CARD,
                      color: disabled ? OB_SUB : "#FFFFFF",
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep("quiz")}
              disabled={goals.length === 0}
              className="w-full mt-5 py-3 rounded-full font-bold text-sm"
              style={goals.length === 0 ? { backgroundColor: OB_CARD, color: OB_SUB } : gradientBtn}
            >
              {goals.length === 0 ? "Pick at least one" : "Continue"}
            </button>
          </div>
        )}

        {step === "quiz" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              {qIndex > 0 ? (
                <button onClick={goBack} className="text-xs font-bold flex items-center gap-1" style={{ color: OB_SUB }}>
                  <ChevronLeft size={14} /> Back
                </button>
              ) : (
                <span />
              )}
              <p className="text-xs font-bold" style={{ color: OB_SUB }}>
                {String(qIndex + 1).padStart(2, "0")} / {String(ASSESSMENT_QUESTIONS.length).padStart(2, "0")}
              </p>
            </div>
            <AssessmentAxisBar leftLabel="AUTONOMY" rightLabel="STRUCTURE" value={scores.structureScore} />
            <AssessmentAxisBar leftLabel="BEATING OTHERS" rightLabel="BEATING YOUR OWN BEST" value={scores.orientationScore} />
            <AssessmentAxisBar leftLabel="SOLO" rightLabel="SOCIAL" value={scores.socialScore} />
            <h2 className="font-display text-xl mt-6 mb-4 text-white">Which is closer to true?</h2>
            <button
              onClick={() => answer("a")}
              className="w-full text-left px-4 py-4 rounded-xl border text-sm mb-3 text-white"
              style={{
                borderColor: answers[qIndex] === "a" ? COACH_CORAL : OB_LINE,
                backgroundColor: answers[qIndex] === "a" ? "rgba(255,107,87,0.14)" : OB_CARD,
                lineHeight: 1.5,
              }}
            >
              {ASSESSMENT_QUESTIONS[qIndex].a}
            </button>
            <button
              onClick={() => answer("b")}
              className="w-full text-left px-4 py-4 rounded-xl border text-sm text-white"
              style={{
                borderColor: answers[qIndex] === "b" ? COACH_CORAL : OB_LINE,
                backgroundColor: answers[qIndex] === "b" ? "rgba(255,107,87,0.14)" : OB_CARD,
                lineHeight: 1.5,
              }}
            >
              {ASSESSMENT_QUESTIONS[qIndex].b}
            </button>
          </div>
        )}

        {step === "reveal" && (
          <div className="text-center">
            <p className="text-xs font-bold uppercase" style={{ color: OB_SUB }}>
              Your type
            </p>
            <Coach3D typeId={typeId} mood="celebrating" size={140} />
            <h1 className="font-display text-3xl mt-4 text-white">{TYPES[typeId].name}</h1>
            <p className="text-sm mt-1 italic" style={{ color: OB_SUB }}>
              {TYPES[typeId].tagline}
            </p>
            <p className="text-sm mt-4 text-left text-white" style={{ lineHeight: 1.7 }}>
              {TYPES[typeId].desc}
            </p>
            <button onClick={finish} className="w-full mt-6 py-3 rounded-full font-bold text-sm" style={gradientBtn}>
              Start training
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SplashScreen({ dayKey, onEnter, typeId }) {
  const dayInfo = DAYS.find((d) => d.key === dayKey);
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: C.ink }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
      {typeId ? <Coach3D typeId={typeId} mood="idle" size={80} /> : <Dumbbell size={40} color={C.accent} strokeWidth={2.5} />}
      <h1 className="mt-4 text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", letterSpacing: "0.03em" }}>
        READY TO TRAIN?
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#BFBFBF", fontFamily: "'Inter', sans-serif" }}>
        {dayInfo ? `Today is ${dayInfo.label}, time for ${dayInfo.focus}.` : "Today's a rest day, recovery is training too."}
      </p>
      <button
        onClick={onEnter}
        className="mt-8 px-8 py-3 rounded-full font-bold text-sm"
        style={{ backgroundColor: C.accent, color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}
      >
        {dayInfo ? "Let's go" : "Open tracker"}
      </button>
    </div>
  );
}

export default function WorkoutTracker() {
  const [meta, setMeta] = useState(DEFAULT_META);
  const [weekIdx, setWeekIdx] = useState(0);
  const [dayKey, setDayKey] = useState("tue");
  const [logs, setLogs] = useState({});
  const [bodyLogs, setBodyLogs] = useState({});
  const [archive, setArchive] = useState([]);
  const [nutritionChecks, setNutritionChecks] = useState({});
  const [dayNotes, setDayNotes] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(null);
  const [activeTip, setActiveTip] = useState(null);
  const [warmupOpen, setWarmupOpen] = useState(true);
  const [quickEntryDrafts, setQuickEntryDrafts] = useState({});
  const [listeningFor, setListeningFor] = useState(null);
  const speechSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState("workout");
  const [restSeconds, setRestSeconds] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentLoaded, setAssessmentLoaded] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMsg, setCoachMsg] = useState(() => COACH_MESSAGES[Math.floor(Math.random() * COACH_MESSAGES.length)]);

  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) return;
    const id = setInterval(() => setRestSeconds((s) => (s === null ? null : Math.max(0, s - 1))), 1000);
    return () => clearInterval(id);
  }, [restSeconds]);

  useEffect(() => {
    (async () => {
      let loadedMeta = DEFAULT_META;
      try {
        const res = await storage.get(META_KEY);
        if (res && res.value) loadedMeta = JSON.parse(res.value);
      } catch (e) {}
      setMeta(loadedMeta);
      setWeekIdx(weekFromDate(loadedMeta.startDate));
      const todayKey = todaysDayKey();
      if (todayKey) setDayKey(todayKey);

      try {
        const res = await storage.get(logsKeyForBlock(loadedMeta.blockNum));
        if (res && res.value) setLogs(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(bodyKeyForBlock(loadedMeta.blockNum));
        if (res && res.value) setBodyLogs(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(ARCHIVE_KEY);
        if (res && res.value) setArchive(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(NUTRITION_CHECKS_KEY);
        if (res && res.value) setNutritionChecks(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(notesKeyForBlock(loadedMeta.blockNum));
        if (res && res.value) setDayNotes(JSON.parse(res.value));
      } catch (e) {}
      try {
        const res = await storage.get(ASSESSMENT_KEY);
        if (res && res.value) setAssessmentResult(JSON.parse(res.value));
      } catch (e) {}
      setAssessmentLoaded(true);
      setLoaded(true);
    })();
  }, []);

  const persistMeta = useCallback(async (next) => {
    setMeta(next);
    try {
      await storage.set(META_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Could not save settings", e);
    }
  }, []);

  const persist = useCallback(
    async (next) => {
      setLogs(next);
      try {
        await storage.set(logsKeyForBlock(meta.blockNum), JSON.stringify(next));
      } catch (e) {
        console.error("Could not save", e);
      }
    },
    [meta.blockNum]
  );

  const persistBody = useCallback(
    async (next) => {
      setBodyLogs(next);
      try {
        await storage.set(bodyKeyForBlock(meta.blockNum), JSON.stringify(next));
      } catch (e) {
        console.error("Could not save", e);
      }
    },
    [meta.blockNum]
  );

  const persistNutrition = useCallback(async (next) => {
    setNutritionChecks(next);
    try {
      await storage.set(NUTRITION_CHECKS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Could not save", e);
    }
  }, []);

  const persistNotes = useCallback(
    async (next) => {
      setDayNotes(next);
      try {
        await storage.set(notesKeyForBlock(meta.blockNum), JSON.stringify(next));
      } catch (e) {
        console.error("Could not save", e);
      }
    },
    [meta.blockNum]
  );

  const persistAssessment = useCallback(async (result) => {
    setAssessmentResult(result);
    try {
      await storage.set(ASSESSMENT_KEY, JSON.stringify(result));
    } catch (e) {
      console.error("Could not save assessment", e);
    }
  }, []);

  const retakeAssessment = useCallback(async () => {
    setAssessmentResult(null);
    try {
      await storage.delete(ASSESSMENT_KEY);
    } catch (e) {
      console.error("Could not clear assessment", e);
    }
  }, []);

  const startNewBlock = async (newStartDate, newBenchBase, newSquatBase, review) => {
    const nextArchive = [
      ...archive,
      {
        blockNum: meta.blockNum,
        startDate: meta.startDate,
        benchBase: meta.benchBase,
        squatBase: meta.squatBase,
        logs,
        bodyLogs,
        dayNotes,
        review: review || null,
      },
    ];
    setArchive(nextArchive);
    try {
      await storage.set(ARCHIVE_KEY, JSON.stringify(nextArchive));
    } catch (e) {
      console.error("Could not archive block", e);
    }
    const newMeta = {
      blockNum: meta.blockNum + 1,
      startDate: newStartDate,
      benchBase: newBenchBase,
      squatBase: newSquatBase,
      currentGoal: review && review.goalNow ? review.goalNow : meta.currentGoal || "",
    };
    await persistMeta(newMeta);
    setLogs({});
    setBodyLogs({});
    setDayNotes({});
    setWeekIdx(weekFromDate(newStartDate));
    setView("workout");
  };

  // bundles everything into one file so it can be moved to a new phone, or handed to Claude
  // to help plan the next block based on what actually happened in this one
  const exportAllData = () => {
    const payload = { meta, logs, bodyLogs, archive, nutritionChecks, dayNotes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workout-tracker-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importAllData = async (file) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed.meta) throw new Error("That doesn't look like a workout tracker backup file.");
    setMeta(parsed.meta);
    setLogs(parsed.logs || {});
    setBodyLogs(parsed.bodyLogs || {});
    setArchive(parsed.archive || []);
    setNutritionChecks(parsed.nutritionChecks || {});
    setDayNotes(parsed.dayNotes || {});
    setWeekIdx(weekFromDate(parsed.meta.startDate));
    await storage.set(META_KEY, JSON.stringify(parsed.meta));
    await storage.set(logsKeyForBlock(parsed.meta.blockNum), JSON.stringify(parsed.logs || {}));
    await storage.set(bodyKeyForBlock(parsed.meta.blockNum), JSON.stringify(parsed.bodyLogs || {}));
    await storage.set(ARCHIVE_KEY, JSON.stringify(parsed.archive || []));
    await storage.set(NUTRITION_CHECKS_KEY, JSON.stringify(parsed.nutritionChecks || {}));
    await storage.set(notesKeyForBlock(parsed.meta.blockNum), JSON.stringify(parsed.dayNotes || {}));
  };

  const plan = useMemo(() => buildPlan(weekIdx, meta.benchBase, meta.squatBase), [weekIdx, meta.benchBase, meta.squatBase]);
  const exercises = plan[dayKey];
  const day = DAYS.find((d) => d.key === dayKey);

  const updateLog = (exerciseId, field, value) => {
    const key = logKey(weekIdx, dayKey, exerciseId);
    const existing = logs[key] || {};
    setLogs({ ...logs, [key]: { ...existing, [field]: value } });
  };

  const updateSetLog = (exerciseId, setIdx, field, value, numSets) => {
    const key = logKey(weekIdx, dayKey, exerciseId);
    const existing = logs[key] || {};
    const existingSets = existing.sets || [];
    const newSets = Array.from({ length: numSets }, (_, i) =>
      i === setIdx ? { ...(existingSets[i] || { weight: "", reps: "" }), [field]: value } : existingSets[i] || { weight: "", reps: "" }
    );
    setLogs({ ...logs, [key]: { ...existing, sets: newSets } });
  };

  // reads a phrase like "set 1, 20kg for 5" (typed or dictated) and fills the matching set row
  const applyQuickEntry = (exerciseId, text, numSets) => {
    const parsed = parseQuickEntry(text);
    if (!parsed || parsed.setIndex < 0 || parsed.setIndex >= numSets) return false;
    if (parsed.weight !== null) updateSetLog(exerciseId, parsed.setIndex, "weight", String(parsed.weight), numSets);
    if (parsed.reps !== null) updateSetLog(exerciseId, parsed.setIndex, "reps", String(parsed.reps), numSets);
    setQuickEntryDrafts((d) => ({ ...d, [exerciseId]: "" }));
    return true;
  };

  // in-app mic button, a bonus where the phone supports it; dictation via the keyboard mic works everywhere regardless
  const startVoiceEntry = (exerciseId, numSets) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuickEntryDrafts((d) => ({ ...d, [exerciseId]: transcript }));
      applyQuickEntry(exerciseId, transcript, numSets);
    };
    recognition.onerror = () => setListeningFor(null);
    recognition.onend = () => setListeningFor(null);
    setListeningFor(exerciseId);
    recognition.start();
  };

  const saveEntry = (exerciseId) => {
    persist(logs);
    setSavedFlash(exerciseId);
    setTimeout(() => setSavedFlash(null), 1200);
    if (COACH_TIPS[exerciseId]) setActiveTip(exerciseId);
  };

  const completedCount = exercises.filter((ex) => {
    if (ex.type === "cardio") {
      const l = logs[logKey(weekIdx, dayKey, ex.id)];
      return !!(l && l.time);
    }
    return !!maxSetWeight(getSets(logs, weekIdx, dayKey, ex.id, ex.sets));
  }).length;

  const isBlockFinished = weekFromDate(meta.startDate) >= 5 && weekIdx === 5;
  const pct = Math.round((completedCount / exercises.length) * 100);
  const tonnage = useMemo(() => computeTonnage(logs, weekIdx, dayKey, exercises), [logs, weekIdx, dayKey, exercises]);
  const tonnageInfo = tonnageComparison(tonnage);

  if (assessmentLoaded && !assessmentResult) {
    return <Onboarding onComplete={persistAssessment} />;
  }

  return (
    <div className="min-h-screen font-sans pb-24" style={{ backgroundColor: C.page, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {showSplash && (
        <SplashScreen
          dayKey={todaysDayKey()}
          onEnter={() => setShowSplash(false)}
          typeId={assessmentResult ? assessmentResult.typeId : null}
        />
      )}

      {/* Masthead */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: C.ink }}>
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {assessmentResult ? (
                <Companion typeId={assessmentResult.typeId} mood={pct === 100 ? "celebrating" : "idle"} size={42} />
              ) : (
                <Dumbbell size={22} color="#FFFFFF" strokeWidth={2.5} />
              )}
              <h1 className="font-display text-3xl text-white">BLOCK {meta.blockNum}</h1>
            </div>
            <button onClick={() => setView("settings")} className="p-2 rounded-full" style={{ backgroundColor: "#2A2A2A" }} aria-label="Settings">
              <Settings size={18} color={view === "settings" ? C.accent : "#FFFFFF"} />
            </button>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#BFBFBF" }}>
            Chest · Biceps · Abs · Thighs & Glutes, self-run
          </p>
          {meta.currentGoal && (
            <p className="text-xs mt-1 italic" style={{ color: "#9DC8EE" }}>
              This block: {meta.currentGoal}
            </p>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              ["workout", "Workout"],
              ["history", "History"],
              ["body", "Body"],
              ["nutrition", "Nutrition"],
              ["report", "Report"],
              ["goalPlan", "Plan"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="px-4 py-1.5 rounded-full text-sm font-bold transition"
                style={
                  view === key
                    ? { backgroundColor: C.accent, color: "#FFFFFF" }
                    : { backgroundColor: "#2A2A2A", color: "#D9D9D9" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "workout" && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setWeekIdx((w) => Math.max(0, w - 1))}
              disabled={weekIdx === 0}
              className="p-2 rounded-full disabled:opacity-30"
              style={{ backgroundColor: C.ink }}
              aria-label="Previous week"
            >
              <ChevronLeft size={20} color="#FFFFFF" />
            </button>
            <div className="text-center">
              <div className="font-display text-5xl leading-none" style={{ color: C.ink }}>
                WEEK {weekIdx + 1}
              </div>
              {weekIdx === weekFromDate(meta.startDate) && (
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold mt-1" style={{ color: C.sub }}>
                  <CalendarDays size={11} /> TODAY'S WEEK
                </div>
              )}
              {weekIdx === 4 && (
                <div className="flex items-center justify-center gap-1 text-xs font-bold mt-1" style={{ color: C.accent }}>
                  <Flame size={12} /> PEAK WEEK
                </div>
              )}
              {weekIdx === 5 && (
                <div className="text-xs font-bold mt-1" style={{ color: C.sub }}>
                  DELOAD
                </div>
              )}
            </div>
            <button
              onClick={() => setWeekIdx((w) => Math.min(5, w + 1))}
              disabled={weekIdx === 5}
              className="p-2 rounded-full disabled:opacity-30"
              style={{ backgroundColor: C.ink }}
              aria-label="Next week"
            >
              <ChevronRight size={20} color="#FFFFFF" />
            </button>
          </div>
          <p className="text-sm text-center mt-2 px-4" style={{ color: C.sub }}>
            {WEEK_NOTES[weekIdx]}
          </p>

          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: C.ink }}>
            <p className="font-display text-2xl leading-snug text-white text-center">"{getDayQuote(weekIdx, dayKey)}"</p>
          </div>

          {isBlockFinished && (
            <div className="mt-4 rounded-xl p-3 text-center" style={{ backgroundColor: C.ink }}>
              <p className="text-sm text-white font-semibold">This block is done. Nice work.</p>
              <div className="flex gap-2 justify-center mt-2">
                <button
                  onClick={() => setView("report")}
                  className="text-sm font-bold rounded-lg px-4 py-1.5"
                  style={{ backgroundColor: "#FFFFFF", color: C.ink }}
                >
                  See your report
                </button>
                <button
                  onClick={() => setView("blockReview")}
                  className="text-sm font-bold rounded-lg px-4 py-1.5"
                  style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
                >
                  Start block {meta.blockNum + 1}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5 mt-5">
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDayKey(d.key)}
                className="py-2 rounded-lg text-sm font-bold border-2 transition"
                style={
                  dayKey === d.key
                    ? { backgroundColor: C.ink, color: "#FFFFFF", borderColor: C.ink }
                    : { backgroundColor: C.card, color: C.ink, borderColor: "#DDDBD5" }
                }
              >
                {d.short}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="font-display text-2xl" style={{ color: C.ink }}>
              {day.focus.toUpperCase()}
            </h2>
            <span className="text-xs font-bold" style={{ color: C.sub }}>
              {completedCount}/{exercises.length} logged
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: "#E4E2DB" }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COACH_CYAN}, ${COACH_CORAL})` }} />
          </div>

          {WARMUPS[dayKey] && (
            <div className="mt-4 rounded-xl border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
              <button
                onClick={() => setWarmupOpen((o) => !o)}
                className="w-full flex items-center justify-between p-3"
              >
                <span className="text-sm font-bold flex items-center gap-2" style={{ color: C.ink }}>
                  <Timer size={16} style={{ color: C.accent }} />
                  {WARMUPS[dayKey].title} · {WARMUPS[dayKey].duration}
                </span>
                <span className="text-xs font-bold" style={{ color: C.accent }}>
                  {warmupOpen ? "hide" : "show"}
                </span>
              </button>
              {warmupOpen && (
                <ol className="px-4 pb-4 space-y-1.5">
                  {WARMUPS[dayKey].steps.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: C.sub }}>
                      <span className="font-bold shrink-0" style={{ color: C.ink }}>
                        {i + 1}.
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {exercises.map((ex) => {
              const key = logKey(weekIdx, dayKey, ex.id);
              const entry = logs[key] || {};
              const isSaved = savedFlash === ex.id;
              const pr = ex.type === "cardio" ? isCardioPR(logs, weekIdx, dayKey, ex.id) : isPR(logs, weekIdx, dayKey, ex.id, ex.sets);
              const suggestion =
                ex.type === "cardio" ? null : suggestedWeight(logs, weekIdx, dayKey, ex.id, ex.sets, ex.increment || 2.5, weekIdx === 5);
              const noteToShow = suggestion
                ? weekIdx === 5
                  ? `Deload to ~${suggestion.suggested}kg, down from ${suggestion.prevWeight}kg in week ${suggestion.prevWeek}`
                  : `Aim for ~${suggestion.suggested}kg, up from ${suggestion.prevWeight}kg in week ${suggestion.prevWeek}`
                : ex.note;
              const setRows = ex.type === "cardio" ? [] : getSets(logs, weekIdx, dayKey, ex.id, ex.sets);
              return (
                <div key={ex.id} className="rounded-xl p-4 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg leading-tight" style={{ color: C.ink }}>
                          {ex.name}
                        </h3>
                        {pr && (
                          <span
                            className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: COACH_CORAL, color: "#FFFFFF" }}
                          >
                            <Flame size={10} /> PR
                          </span>
                        )}
                      </div>
                      {pr && (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: COACH_CORAL }}>
                          {hypeFor(ex.id + weekIdx)}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.sub }}>
                        {ex.type === "cardio" ? ex.target : `${ex.sets} sets × ${ex.reps} reps`}
                      </p>
                      <p className="text-sm mt-1 italic" style={{ color: C.note }}>
                        {noteToShow}
                      </p>
                    </div>
                    <a
                      href={ex.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-0.5 shrink-0"
                      style={{ color: C.ink }}
                    >
                      <Video size={20} />
                      <span className="text-[10px] font-bold">form</span>
                    </a>
                    {COACH_TIPS[ex.id] && (
                      <button
                        onClick={() => setActiveTip(activeTip === ex.id ? null : ex.id)}
                        className="flex flex-col items-center gap-0.5 shrink-0"
                        style={{ color: activeTip === ex.id ? C.accent : C.ink }}
                      >
                        <MessageCircle size={20} />
                        <span className="text-[10px] font-bold">coach</span>
                      </button>
                    )}
                  </div>

                  {activeTip === ex.id && COACH_TIPS[ex.id] && (
                    <div className="mt-3 rounded-lg p-3 border-2 flex items-start gap-2" style={{ backgroundColor: "#EAF5F4", borderColor: C.accent }}>
                      <MessageCircle size={16} className="shrink-0 mt-0.5" style={{ color: C.accent }} />
                      <p className="text-sm flex-1" style={{ color: C.ink }}>
                        {COACH_TIPS[ex.id]}
                      </p>
                      <button onClick={() => setActiveTip(null)} className="shrink-0" style={{ color: C.sub }}>
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {ex.type === "cardio" ? (
                    <div className="flex items-end gap-2 mt-3">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
                          Time (mm:ss)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={entry.time || ""}
                          onChange={(e) => updateLog(ex.id, "time", e.target.value)}
                          placeholder="1:45"
                          className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
                          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                        />
                      </div>
                      <button
                        onClick={() => saveEntry(ex.id)}
                        className="h-[38px] px-3 rounded-lg font-bold text-sm flex items-center gap-1 transition"
                        style={isSaved ? { backgroundColor: C.good, color: "#FFFFFF" } : { backgroundColor: C.ink, color: "#FFFFFF" }}
                      >
                        <Check size={16} />
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={quickEntryDrafts[ex.id] || ""}
                          onChange={(e) => setQuickEntryDrafts((d) => ({ ...d, [ex.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") applyQuickEntry(ex.id, quickEntryDrafts[ex.id], ex.sets);
                          }}
                          placeholder="Say or type: set 1, 20kg for 5"
                          className="flex-1 rounded-lg px-3 py-2 outline-none text-sm border-2"
                          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                        />
                        {speechSupported && (
                          <button
                            onClick={() => startVoiceEntry(ex.id, ex.sets)}
                            className="h-[38px] w-[38px] shrink-0 rounded-lg flex items-center justify-center"
                            style={
                              listeningFor === ex.id
                                ? { backgroundColor: C.accent, color: "#FFFFFF" }
                                : { backgroundColor: C.ink, color: "#FFFFFF" }
                            }
                            aria-label="Voice entry"
                          >
                            <Mic size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => applyQuickEntry(ex.id, quickEntryDrafts[ex.id], ex.sets)}
                          className="h-[38px] px-3 shrink-0 rounded-lg text-sm font-bold"
                          style={{ backgroundColor: "#EFEDE7", color: C.ink }}
                        >
                          Fill
                        </button>
                      </div>
                      {setRows.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-bold w-10 shrink-0" style={{ color: C.sub }}>
                            Set {i + 1}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={s.weight}
                            onChange={(e) => updateSetLog(ex.id, i, "weight", e.target.value, ex.sets)}
                            placeholder="kg"
                            className="w-20 rounded-lg px-2 py-2 outline-none text-sm border-2 font-semibold text-center"
                            style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                          />
                          <input
                            type="text"
                            value={s.reps}
                            onChange={(e) => updateSetLog(ex.id, i, "reps", e.target.value, ex.sets)}
                            placeholder={ex.reps}
                            className="w-16 rounded-lg px-2 py-2 outline-none text-sm border-2 font-semibold text-center"
                            style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => saveEntry(ex.id)}
                        className="w-full h-[38px] px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition"
                        style={isSaved ? { backgroundColor: C.good, color: "#FFFFFF" } : { backgroundColor: C.ink, color: "#FFFFFF" }}
                      >
                        <Check size={16} />
                        {isSaved ? "Saved" : "Save all sets"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {tonnage > 0 && (
            <div
              className="mt-4 rounded-xl p-4 text-center"
              style={{ backgroundColor: C.card, border: `2px solid transparent`, backgroundImage: `linear-gradient(${C.card}, ${C.card}), linear-gradient(90deg, ${COACH_CYAN}, ${COACH_CORAL})`, backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" }}
            >
              <p className="text-xs uppercase tracking-wide font-bold" style={{ color: C.sub }}>
                Today's tonnage
              </p>
              <p
                className="font-display text-4xl mt-1"
                style={{ background: `linear-gradient(90deg, ${COACH_CYAN}, ${COACH_CORAL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {tonnage.toLocaleString()} kg
              </p>
              {tonnageInfo.current && (
                <p className="text-sm mt-1" style={{ color: C.ink }}>
                  That's heavier than {tonnageInfo.current.label}
                  {tonnageInfo.next && (
                    <>
                      , {(tonnageInfo.next.kg - tonnage).toLocaleString()}kg off matching {tonnageInfo.next.label}
                    </>
                  )}
                  .
                </p>
              )}
              {!tonnageInfo.current && tonnageInfo.next && (
                <p className="text-sm mt-1" style={{ color: C.ink }}>
                  {(tonnageInfo.next.kg - tonnage).toLocaleString()}kg off matching {tonnageInfo.next.label}.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 rounded-xl p-4 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
            <p className="text-sm font-bold" style={{ color: C.ink }}>
              Notes for today
            </p>
            <p className="text-xs mt-0.5 mb-2" style={{ color: C.sub }}>
              How did it feel, anything to remember for next time, anything that niggled. This gets saved and can be
              handed over when planning the next block.
            </p>
            <textarea
              value={dayNotes[dayNoteKey(weekIdx, dayKey)] || ""}
              onChange={(e) => persistNotes({ ...dayNotes, [dayNoteKey(weekIdx, dayKey)]: e.target.value })}
              placeholder="e.g. left knee felt a bit off on the last two sets of squats, dropped the weight slightly"
              rows={3}
              className="w-full rounded-lg px-3 py-2 outline-none text-sm border-2"
              style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
            />
          </div>
        </div>
      )}

      {view === "history" && <HistoryView logs={logs} onReset={() => persist({})} />}
      {view === "body" && <BodyView bodyLogs={bodyLogs} weekIdx={weekIdx} setWeekIdx={setWeekIdx} onSave={persistBody} />}
      {view === "nutrition" && <NutritionView checks={nutritionChecks} onSave={persistNutrition} />}
      {view === "report" && <ReportView logs={logs} bodyLogs={bodyLogs} meta={meta} archive={archive} dayNotes={dayNotes} />}
      {view === "goalPlan" && <GoalPlanView assessmentResult={assessmentResult} />}
      {view === "blockReview" && (
        <BlockReviewView
          meta={meta}
          logs={logs}
          bodyLogs={bodyLogs}
          dayNotes={dayNotes}
          assessmentResult={assessmentResult}
          onSubmit={startNewBlock}
          onCancel={() => setView("report")}
        />
      )}
      {view === "settings" && (
        <SettingsView
          meta={meta}
          archive={archive}
          onStartNewBlock={startNewBlock}
          onUpdateMeta={persistMeta}
          onExport={exportAllData}
          onImport={importAllData}
          assessmentResult={assessmentResult}
          onRetakeAssessment={retakeAssessment}
        />
      )}

      {/* Floating coach, present on every screen */}
      {assessmentResult && (
        <div className="fixed bottom-4 left-4 z-20">
          {coachOpen && (
            <div className="rounded-xl p-4 mb-2 w-56 shadow-xl border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
              <p className="text-[10px] uppercase tracking-wide font-bold mb-1" style={{ color: C.sub }}>
                {TYPES[assessmentResult.typeId].name}'s coach
              </p>
              <p className="text-sm" style={{ color: C.ink, lineHeight: 1.5 }}>
                {coachMsg}
              </p>
              <button
                onClick={() => setCoachMsg(COACH_MESSAGES[Math.floor(Math.random() * COACH_MESSAGES.length)])}
                className="text-xs font-bold mt-2"
                style={{ color: C.accent }}
              >
                Another one
              </button>
            </div>
          )}
          <button onClick={() => setCoachOpen((o) => !o)} className="shadow-lg rounded-full" aria-label="Your coach">
            <Companion typeId={assessmentResult.typeId} mood={pct === 100 ? "celebrating" : "idle"} size={56} />
          </button>
        </div>
      )}

      {/* Floating rest timer */}
      <div className="fixed bottom-4 right-4 z-20">
        {timerOpen && (
          <div className="rounded-xl p-4 mb-2 w-48 shadow-xl border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
            {restSeconds !== null ? (
              <div className="text-center">
                <div className="font-display text-5xl" style={{ color: restSeconds === 0 ? C.good : C.accent }}>
                  {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, "0")}
                </div>
                <p className="text-xs mt-1 font-semibold" style={{ color: C.sub }}>
                  {restSeconds === 0 ? "Rest's up" : "resting"}
                </p>
                <button
                  onClick={() => setRestSeconds(null)}
                  className="mt-2 text-xs font-bold rounded-lg px-3 py-1"
                  style={{ backgroundColor: "#EFEDE7", color: C.ink }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-wide font-bold mb-2 text-center" style={{ color: C.sub }}>
                  Rest timer
                </p>
                <div className="flex gap-1.5 justify-center">
                  {[60, 90, 120].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRestSeconds(s)}
                      className="font-bold text-sm rounded-lg px-2.5 py-1.5"
                      style={{ backgroundColor: C.ink, color: "#FFFFFF" }}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setTimerOpen((o) => !o)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg font-display text-lg"
          style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
        >
          {restSeconds !== null ? `${restSeconds}` : <Timer size={22} />}
        </button>
      </div>
    </div>
  );
}

function SettingsView({ meta, archive, onStartNewBlock, onUpdateMeta, onExport, onImport, assessmentResult, onRetakeAssessment }) {
  const [startDate, setStartDate] = useState(meta.startDate);
  const [benchBase, setBenchBase] = useState(meta.benchBase);
  const [squatBase, setSquatBase] = useState(meta.squatBase);
  const [confirmingNewBlock, setConfirmingNewBlock] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const currentWeek = weekFromDate(startDate);

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await onImport(file);
      setImportStatus("Backup restored.");
    } catch (err) {
      setImportStatus("That file couldn't be read, check it's the right backup file.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5">
      <h2 className="font-display text-2xl flex items-center gap-2" style={{ color: C.ink }}>
        <Settings size={18} /> SETTINGS
      </h2>

      {assessmentResult && (
        <div className="rounded-xl p-4 border-2 mt-4 flex items-center gap-3" style={{ backgroundColor: C.card, borderColor: C.line }}>
          <Coach3D typeId={assessmentResult.typeId} mood="idle" size={64} />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
              Your type
            </p>
            <p className="font-display text-xl" style={{ color: C.ink }}>
              {TYPES[assessmentResult.typeId].name}
            </p>
            <button onClick={onRetakeAssessment} className="text-xs font-bold mt-1" style={{ color: C.accent }}>
              Retake assessment
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 border-2 mt-4" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
          Block {meta.blockNum} start date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
        />
        <p className="text-sm mt-2" style={{ color: C.sub }}>
          Based on this date, you're currently in Week {currentWeek + 1}.
        </p>
        <button
          onClick={() => onUpdateMeta({ ...meta, startDate })}
          className="mt-3 text-sm font-bold rounded-lg px-4 py-1.5"
          style={{ backgroundColor: C.ink, color: "#FFFFFF" }}
        >
          Save date
        </button>
      </div>

      <div className="rounded-xl p-4 border-2 mt-3" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.ink }}>
          Current baseline lifts
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
              Bench (kg)
            </label>
            <input
              type="number"
              value={benchBase}
              onChange={(e) => setBenchBase(e.target.value)}
              placeholder="e.g. 80"
              className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
              style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
              Squat (kg)
            </label>
            <input
              type="number"
              value={squatBase}
              onChange={(e) => setSquatBase(e.target.value)}
              placeholder="e.g. 100"
              className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
              style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
            />
          </div>
        </div>
        <button
          onClick={() => onUpdateMeta({ ...meta, benchBase: parseFloat(benchBase), squatBase: parseFloat(squatBase) })}
          className="mt-3 text-sm font-bold rounded-lg px-4 py-1.5"
          style={{ backgroundColor: C.ink, color: "#FFFFFF" }}
        >
          Save baselines
        </button>
      </div>

      <div className="rounded-xl p-4 border-2 mt-3" style={{ backgroundColor: C.card, borderColor: C.accent }}>
        <p className="text-sm font-bold mb-1" style={{ color: C.ink }}>
          Start a new six week block
        </p>
        <p className="text-sm mb-3" style={{ color: C.sub }}>
          This archives block {meta.blockNum}'s logs (you won't lose them) and opens a fresh six weeks starting from a new
          date, with new baseline lifts based on wherever you've ended up.
        </p>
        {!confirmingNewBlock ? (
          <button
            onClick={() => setConfirmingNewBlock(true)}
            className="text-sm font-bold rounded-lg px-4 py-1.5"
            style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
          >
            Start block {meta.blockNum + 1}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm" style={{ color: C.ink }}>
              New block starts <strong>{startDate}</strong> with bench base <strong>{benchBase}kg</strong> and squat base{" "}
              <strong>{squatBase}kg</strong>. Update the fields above first if these have changed, then confirm.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onStartNewBlock(startDate, parseFloat(benchBase), parseFloat(squatBase));
                  setConfirmingNewBlock(false);
                }}
                className="text-sm font-bold rounded-lg px-4 py-1.5"
                style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
              >
                Confirm, start new block
              </button>
              <button onClick={() => setConfirmingNewBlock(false)} className="text-sm px-2" style={{ color: C.sub }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 border-2 mt-3" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <p className="text-sm font-bold mb-1" style={{ color: C.ink }}>
          Backup & Restore
        </p>
        <p className="text-sm mb-3" style={{ color: C.sub }}>
          Export everything to move to a new phone, or to send to Claude at the end of a block.
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={onExport} className="text-sm font-bold rounded-lg px-4 py-1.5" style={{ backgroundColor: C.ink, color: "#FFFFFF" }}>
            Export backup
          </button>
          <label className="text-sm font-bold rounded-lg px-4 py-1.5 cursor-pointer" style={{ backgroundColor: C.accent, color: "#FFFFFF" }}>
            Import backup
            <input type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
        {importStatus && (
          <p className="text-sm mt-2" style={{ color: C.sub }}>
            {importStatus}
          </p>
        )}
      </div>

      {archive.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide font-bold mb-2" style={{ color: C.sub }}>
            Past blocks
          </p>
          {archive.map((a) => (
            <div key={a.blockNum} className="text-sm py-1 border-t" style={{ color: C.sub, borderColor: "#DDDBD5" }}>
              Block {a.blockNum}, started {a.startDate}, bench base {a.benchBase}kg, squat base {a.squatBase}kg
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl p-3 border-2 text-center" style={{ backgroundColor: C.card, borderColor: C.line }}>
      <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
        {label}
      </p>
      <p className="font-display text-3xl mt-1" style={{ color: C.ink }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: C.note }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// simple, rule-based onward mapping, not a full AI system yet, just genuinely useful pattern
// matching on the stats and what you actually typed, transparent about being basic
function suggestNextBlockFocus(stats, bwTrend, changeText) {
  const notes = [];
  if (stats.prCount >= 3) notes.push("Several PRs this block, the current progression rate is working, worth pushing loads up again rather than easing off.");
  else if (stats.prCount === 0) notes.push("No PRs logged this block, worth a touch more recovery or a slightly gentler progression next time rather than repeating the same rate.");
  if (bwTrend && bwTrend.diff > 1) notes.push(`Bodyweight moved up ${bwTrend.diff}kg this block, worth checking that's the direction you actually wanted.`);
  if (bwTrend && bwTrend.diff < -1) notes.push(`Bodyweight came down ${Math.abs(bwTrend.diff)}kg this block.`);
  const lower = (changeText || "").toLowerCase();
  if (lower.includes("knee")) notes.push("You mentioned your knee, worth easing knee-loading exercises back in gradually rather than resuming at full intensity.");
  if (lower.includes("back")) notes.push("You mentioned your back, same idea, ease back in rather than jumping straight to full load.");
  if (lower.includes("tired") || lower.includes("fatigue")) notes.push("Sounds like fatigue built up, week 6's deload exists for exactly this, worth actually taking it easy this time.");
  if (notes.length === 0) notes.push("Nothing particular flagged, standard progression into the next block should be fine.");
  return notes;
}

function BlockReviewView({ meta, logs, bodyLogs, dayNotes, assessmentResult, onSubmit, onCancel }) {
  const stats = blockStats(logs, bodyLogs, meta.benchBase, meta.squatBase);
  const bwTrend = fieldTrend(bodyLogs, "bodyweight");

  const [feelText, setFeelText] = useState("");
  const [goalNow, setGoalNow] = useState(meta.currentGoal || "");
  const [changeText, setChangeText] = useState("");
  const [benchBase, setBenchBase] = useState(meta.benchBase || "");
  const [squatBase, setSquatBase] = useState(meta.squatBase || "");

  const noteEntries = Object.entries(dayNotes || {}).filter(([, v]) => v && v.trim());

  const submit = () => {
    const review = { feelText, goalNow, changeText, completedAt: new Date().toISOString() };
    onSubmit(todayStr(), parseFloat(benchBase), parseFloat(squatBase), review);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5 pb-10">
      <div className="flex items-center gap-3 mb-4">
        {assessmentResult && <Coach3D typeId={assessmentResult.typeId} mood="celebrating" size={64} />}
        <div>
          <h2 className="font-display text-2xl" style={{ color: C.ink }}>
            BLOCK {meta.blockNum} REVIEW
          </h2>
          <p className="text-sm" style={{ color: C.sub }}>
            Six weeks done. Let's recap, then set up the next one properly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Total tonnage" value={`${stats.totalTonnage.toLocaleString()}kg`} sub="moved this block" />
        <StatCard label="PRs hit" value={stats.prCount} sub="across every lift" />
        <StatCard
          label="Bodyweight"
          value={bwTrend ? `${bwTrend.diff > 0 ? "+" : ""}${bwTrend.diff}kg` : "—"}
          sub={bwTrend ? `${bwTrend.first}kg → ${bwTrend.last}kg` : "not logged"}
        />
        <StatCard label="Sessions noted" value={noteEntries.length} sub="days with a written note" />
      </div>

      <div className="rounded-xl p-4 border-2 mb-4" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.ink }}>
          Quick interview before we set up the next block
        </p>

        <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
          How did this block feel overall?
        </label>
        <textarea
          value={feelText}
          onChange={(e) => setFeelText(e.target.value)}
          rows={2}
          placeholder="e.g. good progress on bench, legs felt beat up most weeks"
          className="w-full mt-1 mb-3 rounded-lg px-3 py-2 outline-none text-sm border-2"
          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
        />

        <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
          What's your goal now?
        </label>
        <textarea
          value={goalNow}
          onChange={(e) => setGoalNow(e.target.value)}
          rows={2}
          placeholder="e.g. push harder on HYROX conditioning, less focused on pure strength this block"
          className="w-full mt-1 mb-3 rounded-lg px-3 py-2 outline-none text-sm border-2"
          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
        />

        <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
          Anything you want to change?
        </label>
        <textarea
          value={changeText}
          onChange={(e) => setChangeText(e.target.value)}
          rows={2}
          placeholder="e.g. swap an exercise that's been niggling something, add a rest day"
          className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2"
          style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
        />
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#FFF4F2", border: `1px solid ${COACH_CORAL}` }}>
        <p className="text-xs uppercase tracking-wide font-bold mb-2" style={{ color: COACH_CORAL }}>
          Going into the next block
        </p>
        {suggestNextBlockFocus(stats, bwTrend, changeText).map((note, i) => (
          <p key={i} className="text-sm mt-1" style={{ color: C.ink, lineHeight: 1.5 }}>
            {note}
          </p>
        ))}
        <p className="text-xs mt-2" style={{ color: C.sub }}>
          Simple pattern-matching on your numbers and your own words, not a full AI system yet, but genuinely
          reacting to your actual block rather than saying the same thing every time.
        </p>
      </div>

      <div className="rounded-xl p-4 border-2 mb-4" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.ink }}>
          New baseline lifts
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
              Bench (kg)
            </label>
            <input
              type="number"
              value={benchBase}
              onChange={(e) => setBenchBase(e.target.value)}
              className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
              style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
              Squat (kg)
            </label>
            <input
              type="number"
              value={squatBase}
              onChange={(e) => setSquatBase(e.target.value)}
              className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
              style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="text-sm px-3 py-2" style={{ color: C.sub }}>
          Not yet
        </button>
        <button
          onClick={submit}
          className="flex-1 text-sm font-bold rounded-lg py-3"
          style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
        >
          Start block {meta.blockNum + 1}
        </button>
      </div>
    </div>
  );
}

function GoalPlanView({ assessmentResult }) {
  if (!assessmentResult || !assessmentResult.goals || assessmentResult.goals.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 mt-5 text-center">
        <p className="text-sm" style={{ color: C.sub }}>
          No goals on file yet, complete the assessment in Settings to see a plan here.
        </p>
      </div>
    );
  }

  const plans = assessmentResult.goals.map((g) => resolveGoalPlan(g, assessmentResult.typeId)).filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5 pb-10">
      <h2 className="font-display text-2xl" style={{ color: C.ink }}>
        YOUR GOAL PLANS
      </h2>
      <p className="text-sm mt-1 mb-4" style={{ color: C.sub }}>
        Reference plans for what you told the assessment you're training for. Your actual day-to-day logging
        stays on the HYROX programme in the Workout tab, this is here to show what a dedicated plan would look
        like for each goal.
      </p>

      {assessmentResult.goals.includes("hyrox") && (
        <div className="rounded-xl p-4 border-2 mb-5" style={{ backgroundColor: C.card, borderColor: C.line }}>
          <p className="text-sm font-bold" style={{ color: C.ink }}>
            HYROX / hybrid fitness
          </p>
          <p className="text-sm mt-1" style={{ color: C.sub }}>
            This is the programme you're already logging every day in the Workout tab, nothing extra to show here.
          </p>
        </div>
      )}

      {plans.map((plan, i) => (
        <div key={i} className="mb-6">
          <h3 className="font-display text-xl" style={{ color: C.ink }}>
            {plan.label.toUpperCase()}
          </h3>
          {plan.caveat && (
            <div className="rounded-lg p-3 mt-2 mb-3" style={{ backgroundColor: "#FFF4F2", border: `1px solid ${COACH_CORAL}` }}>
              <p className="text-xs" style={{ color: C.ink, lineHeight: 1.5 }}>
                {plan.caveat}
              </p>
            </div>
          )}
          <div className="space-y-3 mt-2">
            {plan.days.map((d, j) => (
              <div key={j} className="rounded-xl p-4 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
                <p className="font-display text-base font-bold mb-2" style={{ color: C.ink }}>
                  {d.day}
                </p>
                {d.exercises.map((ex, k) => (
                  <div key={k} className="flex justify-between gap-3 py-1.5" style={{ borderTop: k > 0 ? `1px solid #EEEEEE` : "none" }}>
                    <span className="text-sm font-medium" style={{ color: C.ink }}>
                      {ex.name}
                    </span>
                    <span className="text-xs text-right" style={{ color: C.sub }}>
                      {ex.display}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="rounded-lg p-3 mt-2" style={{ backgroundColor: "#F4F3EF" }}>
            <p className="text-xs" style={{ color: C.sub }}>
              {plan.progressNote}
            </p>
            <p className="text-xs mt-1" style={{ color: C.sub }}>
              {plan.socialNote}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportView({ logs, bodyLogs, meta, archive, dayNotes }) {
  const tonnageSeries = useMemo(() => weeklyTonnageSeries(logs, meta.benchBase, meta.squatBase), [logs, meta.benchBase, meta.squatBase]);
  const benchSeries = useMemo(() => weeklyTopLiftSeries(logs, "tue", "bench", 5), [logs]);
  const squatSeries = useMemo(() => weeklyTopLiftSeries(logs, "wed", "squat", 5), [logs]);
  const bwSeries = useMemo(() => bodyFieldSeries(bodyLogs, "bodyweight"), [bodyLogs]);
  const waistSeries = useMemo(() => bodyFieldSeries(bodyLogs, "waist"), [bodyLogs]);
  const bwTrend = fieldTrend(bodyLogs, "bodyweight");
  const waistTrend = fieldTrend(bodyLogs, "waist");
  const totalTonnage = tonnageSeries.reduce((a, b) => a + (b.tonnage || 0), 0);
  const prCount = countBlockPRs(logs, meta.benchBase, meta.squatBase);

  const liftChartData = benchSeries.map((b, i) => ({ week: b.week, bench: b.weight, squat: squatSeries[i].weight }));
  const bodyChartData = bwSeries.map((b, i) => ({ week: b.week, bodyweight: b.value, waist: waistSeries[i].value }));

  const allBlocks = [
    ...archive.map((a) => ({ blockNum: a.blockNum, ...blockStats(a.logs, a.bodyLogs, a.benchBase, a.squatBase) })),
    { blockNum: meta.blockNum, ...blockStats(logs, bodyLogs, meta.benchBase, meta.squatBase), current: true },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5 pb-8">
      <h2 className="font-display text-2xl flex items-center gap-2" style={{ color: C.ink }}>
        <BarChart3 size={18} /> BLOCK {meta.blockNum} REPORT
      </h2>
      <p className="text-sm mt-1 mb-4" style={{ color: C.sub }}>
        A rolling summary of what this block has actually done, updated as you log.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Bodyweight"
          value={bwTrend ? `${bwTrend.diff > 0 ? "+" : ""}${bwTrend.diff}kg` : "—"}
          sub={bwTrend ? `${bwTrend.first}kg → ${bwTrend.last}kg` : "Log your weight to see this"}
        />
        <StatCard
          label="Waist"
          value={waistTrend ? `${waistTrend.diff > 0 ? "+" : ""}${waistTrend.diff}cm` : "—"}
          sub={waistTrend ? `${waistTrend.first}cm → ${waistTrend.last}cm` : "Log your waist to see this"}
        />
        <StatCard label="Total tonnage" value={`${totalTonnage.toLocaleString()}kg`} sub="Moved so far this block" />
        <StatCard label="PRs hit" value={prCount} sub="Across every lift this block" />
      </div>

      <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
        STRENGTH PROGRESSION
      </h3>
      <p className="text-xs mb-2" style={{ color: C.sub }}>
        Top set each week, bench and squat.
      </p>
      <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={liftChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4E2DB" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.sub }} />
            <YAxis tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="bench" stroke={C.accent} strokeWidth={2} connectNulls dot={{ r: 3 }} />
            <Line type="monotone" dataKey="squat" stroke={C.ink} strokeWidth={2} connectNulls dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
        BODY MEASUREMENTS
      </h3>
      <p className="text-xs mb-2" style={{ color: C.sub }}>
        Bodyweight and waist across the block.
      </p>
      <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={bodyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4E2DB" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.sub }} />
            <YAxis tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="bodyweight" stroke={C.accent} strokeWidth={2} connectNulls dot={{ r: 3 }} />
            <Line type="monotone" dataKey="waist" stroke={C.ink} strokeWidth={2} connectNulls dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
        WEEKLY TONNAGE
      </h3>
      <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tonnageSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E4E2DB" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.sub }} />
            <YAxis tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip />
            <Bar dataKey="tonnage" fill={C.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {allBlocks.length > 1 && (
        <>
          <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
            BLOCK BY BLOCK
          </h3>
          <p className="text-xs mb-2" style={{ color: C.sub }}>
            Total tonnage across every block you've run, current one included.
          </p>
          <div className="rounded-xl p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={allBlocks.map((b) => ({ name: `Block ${b.blockNum}`, tonnage: b.totalTonnage }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E4E2DB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.sub }} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} />
                <Tooltip />
                <Bar dataKey="tonnage" fill={C.ink} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {allBlocks.map((b) => (
              <div key={b.blockNum} className="text-xs flex justify-between" style={{ color: C.sub }}>
                <span>
                  Block {b.blockNum}
                  {b.current ? " (current)" : ""}
                </span>
                <span>
                  {b.prCount} PRs, {b.bwChange !== null ? `${b.bwChange > 0 ? "+" : ""}${b.bwChange}kg bodyweight` : "no bodyweight logged"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {Object.values(dayNotes || {}).some((n) => n && n.trim()) && (
        <>
          <h3 className="font-display text-xl mt-6" style={{ color: C.ink }}>
            SESSION NOTES
          </h3>
          <p className="text-xs mb-2" style={{ color: C.sub }}>
            Everything logged this block, in one place, ready to hand over when planning the next one.
          </p>
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, w) => w).map((w) =>
              DAYS.map((d) => {
                const note = dayNotes[dayNoteKey(w, d.key)];
                if (!note || !note.trim()) return null;
                return (
                  <div key={`${w}-${d.key}`} className="rounded-lg p-3 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
                    <p className="text-xs font-bold" style={{ color: C.accent }}>
                      Week {w + 1}, {d.label}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: C.ink }}>
                      {note}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <p className="text-sm mt-6 text-center" style={{ color: C.note }}>
        This report updates live as you log. When you start a new block, it archives here and a fresh report begins.
      </p>
    </div>
  );
}

function NutritionView({ checks, onSave }) {
  const toggleMeal = (dayKey, idx) => {
    const key = `${dayKey}-${idx}`;
    onSave({ ...checks, [key]: !checks[key] });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5 pb-6">
      <h2 className="font-display text-2xl" style={{ color: C.ink }}>
        POST-WORKOUT NUTRITION
      </h2>
      <p className="text-sm mt-1 mb-3" style={{ color: C.sub }}>
        Eat within 60 to 90 minutes of training to help recovery. A few options for each day, pick whichever you fancy
        or have in.
      </p>
      <div className="space-y-5">
        {DAYS.map((d) => (
          <div key={d.key}>
            <h3 className="font-display text-xl" style={{ color: C.ink }}>
              {d.label.toUpperCase()}
            </h3>
            <div className="space-y-2 mt-2">
              {POST_WORKOUT[d.key].map((meal, i) => {
                const done = !!checks[`${d.key}-${i}`];
                return (
                  <button
                    key={i}
                    onClick={() => toggleMeal(d.key, i)}
                    className="w-full text-left rounded-xl p-4 border-2 flex items-start justify-between gap-3 transition"
                    style={{ backgroundColor: done ? C.ink : C.card, borderColor: C.line }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: done ? "#FFFFFF" : C.ink }}>
                        {meal.meal}
                      </p>
                      <p className="text-xs mt-1" style={{ color: done ? "#D9D9D9" : C.sub }}>
                        {meal.protein}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs font-bold" style={{ color: done ? "#FFFFFF" : C.accent }}>
                        ~{meal.kcal} kcal
                      </span>
                      <span
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: done ? "#FFFFFF" : C.line, backgroundColor: done ? C.accent : "transparent" }}
                      >
                        {done && <Check size={14} color="#FFFFFF" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm mt-5 text-center" style={{ color: C.note }}>
        These are a starting point, swap ingredients for whatever you like as long as you're in a similar ballpark.
      </p>
    </div>
  );
}

function BodyView({ bodyLogs, weekIdx, setWeekIdx, onSave }) {
  const weekData = bodyLogs[`w${weekIdx + 1}`] || {};

  const updateField = (field, value) => {
    onSave({ ...bodyLogs, [`w${weekIdx + 1}`]: { ...weekData, [field]: value } });
  };

  const startVal = (field) => {
    const w1 = bodyLogs["w1"];
    return w1 ? w1[field] : null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekIdx((w) => Math.max(0, w - 1))}
          disabled={weekIdx === 0}
          className="p-2 rounded-full disabled:opacity-30"
          style={{ backgroundColor: C.ink }}
          aria-label="Previous week"
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </button>
        <div className="font-display text-4xl leading-none" style={{ color: C.ink }}>
          WEEK {weekIdx + 1}
        </div>
        <button
          onClick={() => setWeekIdx((w) => Math.min(5, w + 1))}
          disabled={weekIdx === 5}
          className="p-2 rounded-full disabled:opacity-30"
          style={{ backgroundColor: C.ink }}
          aria-label="Next week"
        >
          <ChevronRight size={20} color="#FFFFFF" />
        </button>
      </div>
      <p className="text-sm text-center mt-2" style={{ color: C.sub }}>
        Log this once a week, same day and time if you can (first thing in the morning is most consistent).
      </p>

      <div className="mt-5 space-y-3">
        {BODY_FIELDS.map((f) => {
          const val = weekData[f.key] || "";
          const start = startVal(f.key);
          const diff = start && val ? (parseFloat(val) - parseFloat(start)).toFixed(1) : null;
          return (
            <div key={f.key} className="rounded-xl p-4 border-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wide font-bold" style={{ color: C.sub }}>
                    {f.label} ({f.unit})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={val}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder="0"
                    className="w-full mt-1 rounded-lg px-3 py-2 outline-none text-sm border-2 font-semibold"
                    style={{ backgroundColor: "#FAFAF7", color: C.ink, borderColor: "#DDDBD5" }}
                  />
                </div>
                {diff !== null && weekIdx > 0 && (
                  <div className="text-xs font-bold shrink-0" style={{ color: diff.startsWith("-") ? C.good : diff === "0.0" ? C.sub : C.accent }}>
                    {diff > 0 ? `+${diff}` : diff} vs W1
                  </div>
                )}
              </div>
              {f.key === "waist" && diff !== null && diff !== "0.0" && weekIdx > 0 && (
                <p className="text-xs font-semibold mt-2" style={{ color: parseFloat(diff) > 0 ? C.sub : C.good }}>
                  {waistComment(parseFloat(diff), weekIdx)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm mt-4 text-center pb-6" style={{ color: C.note }}>
        These numbers move slower than the weights on the bar. Don't read too much into week to week noise, look at the
        trend across all six weeks.
      </p>
    </div>
  );
}

function HistoryView({ logs, onReset }) {
  const allDays = buildPlan(0, 100, 120);
  const [confirmReset, setConfirmReset] = useState(false);

  const exerciseRows = useMemo(() => {
    const rows = [];
    Object.entries(allDays).forEach(([dayKey, exList]) => {
      exList.forEach((ex) => {
        const weeks = [];
        for (let w = 0; w < 6; w++) {
          if (ex.type === "cardio") {
            const l = logs[logKey(w, dayKey, ex.id)];
            weeks.push(l && l.time ? l.time : "—");
          } else {
            const sets = getSets(logs, w, dayKey, ex.id, ex.sets).filter((s) => s.weight);
            weeks.push(sets.length ? sets.map((s) => `${s.weight}${s.reps ? `×${s.reps}` : ""}`).join(" / ") : "—");
          }
        }
        rows.push({ dayKey, name: ex.name, weeks });
      });
    });
    return rows;
  }, [logs]);

  return (
    <div className="max-w-2xl mx-auto px-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} style={{ color: C.ink }} />
          <h2 className="font-display text-2xl" style={{ color: C.ink }}>
            PROGRESS LOG
          </h2>
        </div>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="text-xs flex items-center gap-1 font-semibold" style={{ color: C.sub }}>
            <RotateCcw size={12} /> Reset block
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: C.accent }}>Sure?</span>
            <button
              onClick={() => {
                onReset();
                setConfirmReset(false);
              }}
              className="font-bold"
              style={{ color: C.accent }}
            >
              Yes
            </button>
            <button onClick={() => setConfirmReset(false)} style={{ color: C.sub }}>
              No
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse min-w-[560px]">
          <thead>
            <tr>
              <th className="text-left py-2 pr-2 font-bold sticky left-0" style={{ backgroundColor: C.page, color: C.ink }}>
                Exercise
              </th>
              {[1, 2, 3, 4, 5, 6].map((w) => (
                <th key={w} className="text-center py-2 px-1 font-bold" style={{ color: C.ink }}>
                  W{w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exerciseRows.map((row, i) => (
              <tr key={i} className="border-t-2" style={{ borderColor: "#DDDBD5" }}>
                <td className="py-2 pr-2 font-semibold sticky left-0" style={{ backgroundColor: C.page, color: C.ink }}>
                  {row.name}
                </td>
                {row.weeks.map((w, j) => (
                  <td key={j} className="text-center py-2 px-1 whitespace-nowrap" style={{ color: C.sub }}>
                    {w}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm mt-4 text-center pb-6" style={{ color: C.note }}>
        This shows the current block only. Past blocks are kept safe under Settings.
      </p>
    </div>
  );
}
