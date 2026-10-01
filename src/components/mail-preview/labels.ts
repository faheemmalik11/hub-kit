export interface MailBodyPreviewLabels {
  heading: string;
  explanation: string;
  from: string;
  subject: string;
  sentAt: string;
  unknownSender: string;
  noSubject: string;
  emptyBody: string;
  download: string;
}

export const englishMailBodyPreviewLabels: MailBodyPreviewLabels = {
  heading: "Email without attachment",
  explanation: "This document was read from the email text itself. There is no file behind it.",
  from: "From",
  subject: "Subject",
  sentAt: "Sent",
  unknownSender: "Unknown sender",
  noSubject: "(no subject)",
  emptyBody: "The email has no readable text.",
  download: "Download as .txt",
};
