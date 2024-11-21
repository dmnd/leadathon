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
  campus: string;
  animal: string;
  grade: number;
  classSize: number;
  pledgesOnline: number;
  pledgesOffline: number;
  minutes: number;
};

export type Class = {
  students: Array<Student>;
  className: string;
  grade: number;
  campus: string;
  animal: string;
  pledges: number;
  minutes: number;
};

export const campuses = {
  CAR: "Carolyn",
  CHE: "Chestnut",
  MLK: "MLK",
} as const;
