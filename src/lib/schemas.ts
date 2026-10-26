import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────────────────────────────────────

export const AgeBandSchema = z.enum(["child", "adult", "elderly"]);
export type AgeBand = z.infer<typeof AgeBandSchema>;

export const IllnessSymptomSchema = z.enum([
  "loose_motions",
  "vomiting",
  "fever",
  "not_eating_drinking",
  "very_hot_weather",
  "none",
]);
export type IllnessSymptom = z.infer<typeof IllnessSymptomSchema>;

export const DrugClassSchema = z.enum([
  "ace_inhibitor",
  "arb",
  "diuretic_loop",
  "diuretic_thiazide",
  "metformin",
  "sglt2_inhibitor",
  "sulfonylurea",
  "nsaid",
  "other",
  "unknown",
]);
export type DrugClass = z.infer<typeof DrugClassSchema>;

export const FlagActionSchema = z.enum([
  "ASK_DOCTOR_TODAY",
  "GO_TO_HEALTH_FACILITY_NOW",
  "NO_FLAG",
  "INFO",
]);
export type FlagAction = z.infer<typeof FlagActionSchema>;

export const BrandStatusSchema = z.enum(["verified", "unsigned", "unknown", "pending_review"]);
export type BrandStatus = z.infer<typeof BrandStatusSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Patient
// ─────────────────────────────────────────────────────────────────────────────

export const PatientSchema = z.object({
  token: z.string().min(2).max(32),
  ageBand: AgeBandSchema,
  pregnant: z.boolean().optional(),
  kidneyDisease: z.boolean().optional(),
  knownKidneyDisease: z.boolean().optional(),
  livesAlone: z.boolean().optional(),
  worksOutdoors: z.boolean().optional(),
  latestCreatinine: z.number().nullable().optional(),
  latestEGFR: z.number().nullable().optional(),
  medicines: z.array(z.string()).optional(), // brand names / tokens
  chronicMedicines: z
    .array(
      z.object({
        brand: z.string(),
        classes: z.array(DrugClassSchema),
        dose: z.string().optional(),
      })
    )
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Patient = z.infer<typeof PatientSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Structured Symptoms (output of /api/parse-symptoms)
// ─────────────────────────────────────────────────────────────────────────────

export const ConfidenceFieldSchema = <T extends z.ZodType>(valueSchema: T) =>
  z.object({
    value: valueSchema,
    confidence: z.number().min(0).max(1),
  });

export const ParsedSymptomsSchema = z.object({
  transcript: z.string().optional(),
  symptoms: z.object({
    value: z.array(IllnessSymptomSchema),
    confidence: z.number().min(0).max(1),
  }),
  durationDays: z.object({
    value: z.number().int().nonnegative().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  ableToDrinkFluids: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  urinePastEightHours: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  dizziness: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  confusion: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  bloodInStool: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  chestPain: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  cannotKeepFluids: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
});
export type ParsedSymptoms = z.infer<typeof ParsedSymptomsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Brand Entry
// ─────────────────────────────────────────────────────────────────────────────

export const BrandEntrySchema = z.object({
  brand: z.string().min(1),
  brandBn: z.string().optional(),
  brandHi: z.string().optional(),
  salt: z.string().optional().default(""),
  genericSalt: z.string().optional(),
  classes: z.array(DrugClassSchema),
  signedOff: z.boolean(),
  source: z.string(),
  reviewerName: z.string().optional(),
  reviewedAt: z.string().optional(),
});
export type BrandEntry = z.infer<typeof BrandEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Rule
// ─────────────────────────────────────────────────────────────────────────────

export const RuleSchema = z.object({
  id: z.string().min(1),
  appliesToClasses: z.array(DrugClassSchema),
  whenIllness: z.array(IllnessSymptomSchema),
  whenHeat: z.boolean().optional(),
  whenExtra: z
    .object({
      kidneyDisease: z.boolean().optional(),
      ageElderly: z.boolean().optional(),
      pregnant: z.boolean().optional(),
      child: z.boolean().optional(),
    })
    .optional(),
  action: FlagActionSchema,
  text: z.object({ bn: z.string(), hi: z.string(), en: z.string() }),
  source: z.string(),
  signedOff: z.boolean(),
  reviewerName: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
});
export type Rule = z.infer<typeof RuleSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Check Input / Output
// ─────────────────────────────────────────────────────────────────────────────

export const CheckInputSchema = z.object({
  patient: PatientSchema,
  symptoms: ParsedSymptomsSchema,
  brands: z.array(z.string()).optional().default([]),
  medicines: z.array(z.any()).optional(),
  isHeatDay: z.boolean().optional().default(false),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
});
export type CheckInput = z.infer<typeof CheckInputSchema>;

export const PerMedicineResultSchema = z.object({
  brand: z.string(),
  classes: z.array(DrugClassSchema),
  brandStatus: BrandStatusSchema,
  flag: FlagActionSchema,
  ruleHits: z.array(
    z.object({
      ruleId: z.string(),
      ruleText: z.object({ bn: z.string(), hi: z.string(), en: z.string() }),
      signedOff: z.boolean(),
    })
  ),
});
export type PerMedicineResult = z.infer<typeof PerMedicineResultSchema>;

export const CheckResultSchema = z.object({
  urgency: FlagActionSchema,
  perMedicine: z.array(PerMedicineResultSchema),
  warnings: z.array(z.string()),
  safetyDisclaimer: z.literal(
    "Decision-support aid. Not a medical device. Do not change any medicine without a doctor."
  ),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Outbox Record (for sync)
// ─────────────────────────────────────────────────────────────────────────────

export const OutboxRecordSchema = z.object({
  id: z.string(),
  type: z.enum(["check", "patient_update"]),
  payload: z.any(),
  createdAt: z.string(),
  synced: z.boolean(),
  syncedAt: z.string().optional(),
  attempts: z.number().optional().default(0),
});
export type OutboxRecord = z.infer<typeof OutboxRecordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API Payloads
// ─────────────────────────────────────────────────────────────────────────────

export const ParseSymptomsRequestSchema = z.object({
  transcript: z.string().max(2000),
  language: z.enum(["bn-IN", "hi-IN", "en-IN"]),
});
export type ParseSymptomsRequest = z.infer<typeof ParseSymptomsRequestSchema>;

export const SuggestClassRequestSchema = z.object({
  brandName: z.string().max(200),
});
export type SuggestClassRequest = z.infer<typeof SuggestClassRequestSchema>;

export const SuggestClassResponseSchema = z.object({
  brandName: z.string(),
  suggestedClasses: z.array(DrugClassSchema),
  suggestedSalt: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(500),
});
export type SuggestClassResponse = z.infer<typeof SuggestClassResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Vignette (evaluation harness)
// ─────────────────────────────────────────────────────────────────────────────

export const VignetteSchema = z.object({
  id: z.string(),
  description: z.string(),
  inputJson: z.string(), // JSON of CheckInput
  label_r1: z.enum(["yes", "no"]).optional(),
  label_r2: z.enum(["yes", "no"]).optional(),
  label_r3: z.enum(["yes", "no"]).optional(),
  perMedicineLabels: z.string().optional(), // JSON
});
export type Vignette = z.infer<typeof VignetteSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Risk Score
// ─────────────────────────────────────────────────────────────────────────────

export const RiskScoreSchema = z.object({
  token: z.string(),
  totalScore: z.number(),
  level: z.enum(["low", "medium", "high"]).optional().default("low"),
  breakdown: z.array(
    z.object({
      factor: z.string(),
      points: z.number(),
      description: z.string(),
    })
  ),
});
export type RiskScore = z.infer<typeof RiskScoreSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Pending Review Item
// ─────────────────────────────────────────────────────────────────────────────

export const PendingReviewItemSchema = z.object({
  id: z.string(),
  type: z.enum(["brand_suggestion", "rule_signoff"]).optional().default("brand_suggestion"),
  brand: z.string().optional(),
  suggestedClass: DrugClassSchema.optional(),
  confidence: z.number().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  reviewerName: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  submittedBy: z.string().optional(),
  submittedAt: z.string().optional(),
});
export type PendingReviewItem = z.infer<typeof PendingReviewItemSchema>;
