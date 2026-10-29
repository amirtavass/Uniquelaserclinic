// theme/visuals.ts — single central map of clinic photography → surfaces.
// Law (docs/ui/00-design-system-usage-rules.md): screens require() nothing; they ask this module.
// Sources: client-supplied originals normalised to assets/clinic/ (M1 register T02):
// bounded copies, .jfif→.jpg extension fixed for Metro resolution, before/after composite cropped
// to a neutral detail half (deviation flagged in the register — never silent).

export type Visual = {
  /** Metro asset id (require() result). */
  source: number;
  /**
   * Vertical focal bias 0..1 (0.5 = centre). RN `resizeMode="cover"` crops centrally;
   * ClinicImage translates the over-drawn image by (focus − 0.5) so faces/treatment
   * areas in the skin & tattoo shots are never awkwardly cropped.
   */
  focus: number;
};

const IMG = {
  office: require('../assets/clinic/clinic-office-room.webp'),
  consult: require('../assets/clinic/consult-with-therapist.jpg'),
  laserMachine: require('../assets/clinic/laser-machine.webp'),
  skinLaser: require('../assets/clinic/skin-rejuvenation-laser.webp'),
  tattooTreatment: require('../assets/clinic/tattoo-removal-treatment.jpg'),
  tattooMachine: require('../assets/clinic/tattoo-removal-machine.webp'),
  logo: require('../assets/unique-laser-clinics-logo-300x146.webp'),
} as const;

const v = (source: number, focus = 0.5): Visual => ({ source, focus });

/** Fixed presentation frames — every card/header uses one of these, never intrinsic size. */
export const aspect = {
  /** Category & featured treatment cards. */
  card: 16 / 10,
  /** Hero & treatment-detail banners. */
  banner: 16 / 9,
  /** Consult-tab hero (portrait-ish content). */
  feature: 4 / 3,
  /** Clinic office showcase strip. */
  wide: 21 / 9,
} as const;

export const visuals = {
  /** Guest-home surfaces (02-home/00). */
  clinicOffice: v(IMG.office, 0.5),
  consultBanner: v(IMG.consult, 0.38), // faces upper third
  adviseMeCard: v(IMG.consult, 0.42), // J2 “not sure yet” card
  trustEquipment: v(IMG.laserMachine, 0.5), // medical-grade trust card
  logo: IMG.logo,

  /** Categories → photo or brand-art fallback (gradient + initial). */
  category: {
    laser: v(IMG.laserMachine, 0.5),
    skin: v(IMG.skinLaser, 0.45),
    'anti-ageing': v(IMG.skinLaser, 0.5),
    body: null,
    wellness: null,
  } as Record<string, Visual | null>,

  /** Concern pills’ deep-state visual (03-discover/02). */
  concern: {
    'unwanted-hair': v(IMG.laserMachine, 0.5),
    'ageing-and-texture': v(IMG.skinLaser, 0.45),
    'pigment-and-veins': v(IMG.skinLaser, 0.55),
    acne: v(IMG.skinLaser, 0.4),
    tattoos: v(IMG.tattooTreatment, 0.5),
  } as Record<string, Visual | null>,

  /** Treatment slug → card + detail-banner visual (directive §1.3 mapping). */
  treatment: {
    'laser-hair-removal': v(IMG.laserMachine, 0.5),
    'laser-tattoo-removal': v(IMG.tattooTreatment, 0.5),
    'laser-skin-rejuvenation': v(IMG.skinLaser, 0.45),
    'carbon-laser-peel': v(IMG.skinLaser, 0.5),
    'acne-treatment': v(IMG.skinLaser, 0.4),
    'pigmentation-removal': v(IMG.skinLaser, 0.55),
    'laser-skin-tightening': null, // Anti-Ageing non-skin imagery gap — art fallback
    'thread-vein-removal': null,
  } as Record<string, Visual | null>,

  /** Tattoo detail swaps machine shot for the banner so the treatment photo isn’t doubled. */
  treatmentBanner: {
    'laser-tattoo-removal': v(IMG.tattooMachine, 0.5),
  } as Record<string, Visual>,
};

/** Resolution order: treatment slug → treatment banner override (detail) → category → art fallback. */
export function visualForTreatment(slug: string, categoryId?: string | null, forBanner = false): Visual | null {
  if (forBanner) {
    const override = visuals.treatmentBanner[slug];
    if (override) return override;
  }
  const direct = visuals.treatment[slug];
  if (direct) return direct;
  if (categoryId && visuals.category[categoryId] !== undefined) return visuals.category[categoryId];
  return null;
}
