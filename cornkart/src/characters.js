// Character roster, in select-screen order (the first is the default).
// Each driver picks a vehicle from src/karts/index.js before the race.
export const CHARACTERS = [
  {
    id: 'apu',
    name: 'Apu',
    tagline: 'Big hugs, bigger heart, surprisingly heavy right foot.',
    icon: '🐸',
    model: 'apu',                // key in window.CORNKART_ASSETS (assets/apu.js)
    height: 1.3,                 // standing height in metres at kart scale
    vehicle: 'coupe',            // default vehicle, the player can change it
    stats: { speed: 4, accel: 3, handling: 3, weight: 3 }, // 1..5, before the vehicle's bonus
    idleClip: 'Idle_6',          // standing next to the kart on the menu
    // after the race: clips played sitting in the kart
    celebrate: { seated: true, win: 'Sit_Cheer_with_Left_Hand', podium: 'Sitting_Clap', lose: 'Sit_Finger_Wag_No' },
    rivalNames: ['Toxic Apu', 'Glow Apu', 'Bog Apu', 'Ash Apu', 'Mutant Apu'],
  },
  {
    id: 'cornpop',
    name: 'CornPop',
    tagline: 'Pops under pressure.',
    icon: '🌽',
    model: 'cornpop',
    height: 1.35,
    vehicle: 'hotdog',
    stats: { speed: 3, accel: 4, handling: 4, weight: 2 },
    idleClip: 'Idle_10',
    // after the race: hop out and dance, or stomp
    celebrate: { seated: false, win: 'Arm_Circle_Shuffle', podium: 'Arm_Circle_Shuffle', lose: 'Angry_Ground_Stomp_2' },
    rivalNames: ['Glowing Pop', 'Purple Pop', 'Blue Pop', 'Red Pop', 'Ash Pop'],
  },
  {
    id: 'beardy',
    name: 'Beardy',
    tagline: 'All beard, no brakes.',
    icon: '🧔',
    model: 'beardy',
    height: 1.4,
    vehicle: 'semla',
    stats: { speed: 3, accel: 3, handling: 3, weight: 4 },
    idleClip: 'Idle_4',
    // after the race: hop out and drop a beat, or cast an angry spell
    celebrate: { seated: false, win: 'Bass_Beats', podium: 'Bass_Beats', lose: 'Charged_Spell_Cast' },
    rivalNames: ['Glow Beard', 'Ash Beard', 'Toxic Beard', 'Bog Beard', 'Rust Beard'],
  },
  {
    id: 'peepo',
    name: 'Peepo',
    tagline: 'Tiny frog, big beetle energy.',
    icon: '🐞',
    model: 'peepo',
    height: 1.3,
    vehicle: 'beetle',
    stats: { speed: 4, accel: 3, handling: 4, weight: 2 },
    idleClip: 'Idle_13',
    // after the race: hop out and dance, send some love, or stomp
    celebrate: { seated: false, win: 'Boom_Dance', podium: 'Big_Heart_Gesture', lose: 'Angry_Ground_Stomp' },
    rivalNames: ['Glow Peepo', 'Ash Peepo', 'Toxic Peepo', 'Bog Peepo', 'Frost Peepo'],
  },
  {
    id: 'honkler',
    name: 'Honkler',
    tagline: 'Honk honk. Out of the way.',
    icon: '🤡',
    model: 'honkler',
    height: 1.35,
    vehicle: 'clown',
    stats: { speed: 3, accel: 4, handling: 3, weight: 3 },
    idleClip: 'Love_You_Pop_Dance', // the model has no standing idle, so he dances on the turntable
    // after the race: hip hop if he wins, a pop dance on the podium, and a dramatic death if he loses
    celebrate: { seated: false, win: 'Hip_Hop_Dance', podium: 'Love_You_Pop_Dance', lose: 'Fall_Dead_from_Abdominal_Injury' },
    rivalNames: ['Glow Honk', 'Ash Honk', 'Toxic Honk', 'Bog Honk', 'Frost Honk'],
  },
  {
    id: 'qoq',
    name: 'Qoq',
    tagline: 'Cluck first, brake never.',
    icon: '🐔',
    model: 'qoq',
    height: 1.35,
    vehicle: 'qoq',
    stats: { speed: 3, accel: 4, handling: 4, weight: 2 },
    idleClip: 'Idle_3',
    // after the race: hop out and jump for joy, punch the air, or throw a tantrum
    celebrate: { seated: false, win: 'Happy_jump_f', podium: 'Jumping_Punch', lose: 'Angry_To_Tantrum_Sit' },
    rivalNames: ['Glow Qoq', 'Ash Qoq', 'Toxic Qoq', 'Bog Qoq', 'Frost Qoq'],
  },
];

// Locked slots on the select screen, so the roster has room to grow.
export const COMING_SOON = 0;
