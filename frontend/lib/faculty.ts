import type { FacultyCode, Resource } from "../../shared/contract";

const FACULTY_KEY = "mindmeter_faculty";

export const facultyOptions: Array<{
  value: FacultyCode;
  label: string;
}> = [
  { value: "agricultural_technology", label: "Faculty of Agricultural Technology" },
  { value: "agriculture", label: "Faculty of Agriculture" },
  { value: "animal_science", label: "Faculty of Animal Science" },
  { value: "biology", label: "Faculty of Biology" },
  { value: "cultural_sciences", label: "Faculty of Cultural Sciences" },
  { value: "dentistry", label: "Faculty of Dentistry" },
  { value: "economics_business", label: "Faculty of Economics and Business" },
  { value: "engineering", label: "Faculty of Engineering" },
  { value: "forestry", label: "Faculty of Forestry" },
  { value: "geography", label: "Faculty of Geography" },
  { value: "graduate_school", label: "Graduate School" },
  { value: "law", label: "Faculty of Law" },
  { value: "mathematics_natural_sciences", label: "Faculty of Mathematics and Natural Sciences" },
  {
    value: "medicine_public_health_nursing",
    label: "Faculty of Medicine, Public Health and Nursing",
  },
  { value: "pharmacy", label: "Faculty of Pharmacy" },
  { value: "philosophy", label: "Faculty of Philosophy" },
  { value: "psychology", label: "Faculty of Psychology" },
  {
    value: "social_political_sciences",
    label: "Faculty of Social and Political Sciences",
  },
  { value: "veterinary_medicine", label: "Faculty of Veterinary Medicine" },
  { value: "vocational_college", label: "Vocational College" },
];

export function readFaculty(): FacultyCode | null {
  const stored = localStorage.getItem(FACULTY_KEY);

  return facultyOptions.some((faculty) => faculty.value === stored)
    ? (stored as FacultyCode)
    : null;
}

export function saveFaculty(faculty: FacultyCode | null) {
  if (faculty) {
    localStorage.setItem(FACULTY_KEY, faculty);
  } else {
    localStorage.removeItem(FACULTY_KEY);
  }
}

export function filterBookingOptions(
  resources: Resource[],
  faculty: FacultyCode | null,
) {
  const universityWide = resources.filter(
    (resource) => resource.faculty === null,
  );

  if (!faculty) return universityWide;

  const ownFaculty = resources.filter(
    (resource) => resource.faculty === faculty,
  );

  return [...ownFaculty, ...universityWide];
}