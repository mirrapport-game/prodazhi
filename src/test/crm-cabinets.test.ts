import { describe, expect, it } from "vitest";
import { CABINETS, contactsForCabinet } from "@/lib/crm";

describe("CRM mailing cabinets", () => {
  const contacts = [
    { id: 1, audience_id: "psychologists" },
    { id: 2, audience_id: "beauty_salons" },
    { id: 3, audience_id: "medical_clinics" },
    { id: 4, audience_id: "singles" },
    { id: 5, audience_id: "relationships" },
    { id: 6, audience_id: null },
  ];
  it("provides exactly the five requested audiences", () => {
    expect(CABINETS.map((c) => c.id)).toEqual(["psychologists", "beauty_salons", "medical_clinics", "singles", "relationships"]);
  });
  it.each(["psychologists", "beauty_salons", "medical_clinics", "singles", "relationships"] as const)("isolates contacts in %s", (cabinet) => {
    const expectedId = ["psychologists", "beauty_salons", "medical_clinics", "singles", "relationships"].indexOf(cabinet) + 1;
    expect(contactsForCabinet(contacts, cabinet).map((c) => c.id)).toEqual([expectedId]);
  });
  it("keeps unknown audiences out of all five cabinets", () => {
    expect(contactsForCabinet(contacts, "unassigned").map((c) => c.id)).toEqual([6]);
  });
  it("supports owner-created cabinets across all three channels", () => {
    const rows = ["telegram", "vk", "instagram"].map((source, id) => ({ id, source, audience_id: "custom-workshop" }));
    expect(contactsForCabinet(rows, "custom-workshop").map((c) => c.source)).toEqual(["telegram", "vk", "instagram"]);
    expect(contactsForCabinet(rows, "psychologists")).toEqual([]);
  });
  it("moves a contact without duplicating it or changing its funnel stage", () => {
    const rows = [{ id: 7, audience_id: "psychologists", stage: "booked" }];
    const moved = rows.map((c) => ({ ...c, audience_id: "relationships" }));
    expect(contactsForCabinet(moved, "psychologists")).toEqual([]);
    expect(contactsForCabinet(moved, "relationships")).toEqual([{ id: 7, audience_id: "relationships", stage: "booked" }]);
  });
});