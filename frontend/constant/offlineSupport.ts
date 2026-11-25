import type { Resource } from "../../shared/contract";

export type OfflineSupportResource = Resource & {
  verified_at: string;
};

/**
 * Add only contact details that your team has personally checked against
 * an official source. Keep verified_at updated.
 */
export const offlineSupportResources: OfflineSupportResource[] = [
  // Example shape—replace with a verified contact before adding it:
  //
  // {
  //   id: "00000000-0000-4000-8000-000000000001",
  //   title: "Verified support service",
  //   description: "Describe who can use the service and when it is available.",
  //   url: "tel:+620000000000",
  //   tags: [],
  //   verified_at: "2026-11-17",
  // faculty: null,
  // },
];