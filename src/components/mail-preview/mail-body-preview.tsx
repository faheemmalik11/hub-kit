import { Download, Mail } from "lucide-react";

import { downloadTextFile } from "../../lib/download";
import { Button } from "../../ui/button";
import { englishMailBodyPreviewLabels, type MailBodyPreviewLabels } from "./labels";

export interface MailBodySource {
  sender: string | null;
  subject: string | null;
  sentAt: string | null;
  body: string;
}

export interface MailBodyPreviewProps {
  mail: MailBodySource;
  downloadFileName: string;
  formatDateTime?: (iso: string) => string;
  labels?: MailBodyPreviewLabels;
}

function mailAsPlainText(
  mail: MailBodySource,
  labels: MailBodyPreviewLabels,
  sentAtText: string | null,
): string {
  const headerLines = [
    `${labels.from}: ${mail.sender ?? labels.unknownSender}`,
    `${labels.subject}: ${mail.subject ?? labels.noSubject}`,
    ...(sentAtText ? [`${labels.sentAt}: ${sentAtText}`] : []),
  ];
  return `${headerLines.join("\n")}\n\n${mail.body}`;
}

function withTxtExtension(fileName: string): string {
  return fileName.toLowerCase().endsWith(".txt") ? fileName : `${fileName}.txt`;
}

export function MailBodyPreview({
  mail,
  downloadFileName,
  formatDateTime = (iso) => new Date(iso).toLocaleString(),
  labels = englishMailBodyPreviewLabels,
}: MailBodyPreviewProps) {
  const sentAtText = mail.sentAt ? formatDateTime(mail.sentAt) : null;
  const hasBody = mail.body.trim() !== "";

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border bg-muted/40 px-4 py-3">
          <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{labels.heading}</p>
            <p className="text-xs text-muted-foreground">{labels.explanation}</p>
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-border px-4 py-3 text-sm">
          <dt className="text-muted-foreground">{labels.from}</dt>
          <dd className="min-w-0 break-words text-foreground">{mail.sender ?? labels.unknownSender}</dd>
          <dt className="text-muted-foreground">{labels.subject}</dt>
          <dd className="min-w-0 break-words text-foreground">{mail.subject ?? labels.noSubject}</dd>
          {sentAtText && (
            <>
              <dt className="text-muted-foreground">{labels.sentAt}</dt>
              <dd className="tabular-nums text-foreground">{sentAtText}</dd>
            </>
          )}
        </dl>
        <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words p-4 text-sm leading-6 text-foreground">
          {hasBody ? mail.body : labels.emptyBody}
        </pre>
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={!hasBody}
          onClick={() =>
            downloadTextFile(
              withTxtExtension(downloadFileName),
              mailAsPlainText(mail, labels, sentAtText),
              "text/plain",
            )
          }
        >
          <Download className="size-3.5" aria-hidden /> {labels.download}
        </Button>
      </div>
    </div>
  );
}
