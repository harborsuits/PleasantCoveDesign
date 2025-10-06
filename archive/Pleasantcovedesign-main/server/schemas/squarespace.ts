import { z } from "zod";

export const SquarespaceForm = z.object({
  formName: z.string().optional(),          // "Contact", "Consultation", etc.
  pageUrl: z.string().url().optional(),
  fields: z.array(z.object({
    label: z.string(),
    value: z.any(),
    key: z.string().optional()
  })).default([]),
  memberId: z.string().optional(),          // if you inject via hidden field
  memberEmail: z.string().email().optional(),
}).passthrough();

export type TSquarespaceForm = z.infer<typeof SquarespaceForm>;

const FIELD_ALIASES: Record<string, string> = {
  email: "email", "e-mail": "email", "your email": "email",
  name: "name", "full name": "name", "contact name": "name",
  phone: "phone", telephone: "phone", "phone number": "phone", mobile: "phone",
  company: "company", business: "company", organization: "company",
  message: "message", notes: "message", details: "message", comments: "message",
  website: "website", "web site": "website", url: "website",
  service: "service", "service type": "service", "what can we help with": "service",
};

export function mapSquarespaceToLead(s: TSquarespaceForm) {
  const norm: Record<string,string> = {};
  for (const f of s.fields) {
    const label = (f.key || f.label || "").trim().toLowerCase();
    const alias = FIELD_ALIASES[label] || label;
    norm[alias] = typeof f.value === "string" ? f.value.trim() : JSON.stringify(f.value);
  }

  const fullName = norm["name"] || "";
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");

  return {
    source: "squarespace",
    page_url: s.pageUrl || "",
    form_name: s.formName || "",
    first_name: firstName || "",
    last_name: lastName || "",
    email: s.memberEmail || norm["email"] || "",
    phone: norm["phone"] || "",
    company: norm["company"] || "",
    website: norm["website"] || "",
    service: norm["service"] || "",
    message: norm["message"] || "",
    member_id: s.memberId || "",
  };
}
