import type { Resource } from "../../shared/contract";

export type OfflineSupportResource = Resource & {
  verified_at: string;
};

/**
 * Add only contact details that your team has personally checked against
 * an official source. Keep verified_at updated.
 */
export const offlineSupportResources: OfflineSupportResource[] = [

  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "MHERL — UGM Mental Health Emergency Response Line (24 hours)",
    description:
      "UGM Mental Health Emergency Response Line. Chat on WhatsApp any time, 24 hours a day, if you are in crisis or need help right away.",
    url: "https://wa.me/6281329520052",
    tags: [],
    verified_at: "2026-11-17",
    faculty: null,
    support_group: "crisis",
  },
];
