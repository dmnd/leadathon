export type Row = {
  "Class Name": string;
  "Email Address": string;
  "Fees Covered": number;
  "First Name": string;
  "First Request Sent": string;
  "Last Name": string;
  "Minute Count": number;
  "Offline Donation $": number;
  "Online Donation #": number;
  "ONline Donation #": number;
  "Potential Online Donation #": number;
  "Potential Online Donation $": number;
  "Requests Delivered": number;
  "Requests Sent": number;
  "Total + Potential": number;
  Grade: string;
  Total: number;
};

export type Student = {
  displayName: string;
  _raw: Array<Row>;
  id: string;
  campus: Campus;
  animal: string;
  grade: number;
  _pledgesOnline: number;
  _pledgesOffline: number;
  pledges: number;
  minutes: number;
  expectedRaised: number;
};

export type Class = {
  students: Array<Student>;
  className: string;
  grade: number;
  campus: Campus;
  animal: string;
  pledges: number;
  minutes: number;
};

export const campuses = {
  CAR: "Carolyn",
  CHE: "Chestnut",
  MLK: "MLK",
} as const;

export type Campus = keyof typeof campuses;
