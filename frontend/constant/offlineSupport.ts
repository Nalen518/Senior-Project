import type { Resource } from "../../shared/contract";

export type OfflineSupportResource = Resource & {
  verified_at: string;
};

/**
 * Shown on the support screen when the API cannot be reached (FR-07).
 * Copied from backend/data/resources.json, primary crisis contact first.
 * Add only contacts checked against an official source and keep verified_at updated.
 */
export const offlineSupportResources: OfflineSupportResource[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "MHERL, UGM Mental Health Emergency Response Line (24 hours)",
    description:
      "Chat on WhatsApp any time, 24 hours a day, if you are in crisis or need help right away.",
    url: "https://wa.me/6281329520052",
    tags: [],
    faculty: null,
    support_group:"crisis",
    verified_at: "2026-11-23",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "UGM Campus Emergency Service (PK4L)",
    description:
      "If there is danger or an emergency on campus right now. From a campus phone, dial 1234.",
    url: "tel:02746491234",
    tags: [],
    faculty: null,
    support_group:"crisis",
    verified_at: "2026-11-23",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    title: "Healing119, Indonesian Ministry of Health",
    description:
      "National mental health counselling service, free. Call 119 then press 8, or chat on WhatsApp through the site.",
    // Not tel:119, that dials the ambulance line, not extension 8.
    url: "https://www.healing119.id/",
    tags: ["isolation"],
    faculty: null,
    support_group:"crisis",
    verified_at: "2026-11-23",
  },
];
