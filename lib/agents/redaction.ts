import type { MeetingTranscriptSegment } from "@/types/meetings"

const PERSONNUMMER_REGEX = /\b(19|20)?\d{2}[01]\d[0-3]\d[-+]?\d{4}\b/g
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const ADDRESS_REGEX = /(gatan|vägen|gränd|gata|väg|platsen)\s+\d+[a-z]?/gi
const PHONE_REGEX = /\b(?:\+46|0)\s?(?:\d[\s-]?){7,12}\b/g

export interface RedactionOptions {
  maskEmail?: boolean
  maskPhone?: boolean
  maskAddress?: boolean
  maskPersonalNumber?: boolean
}

const DEFAULT_OPTIONS: RedactionOptions = {
  maskEmail: true,
  maskPhone: true,
  maskAddress: true,
  maskPersonalNumber: true,
}

export const redactSegment = (segment: MeetingTranscriptSegment, options: RedactionOptions = DEFAULT_OPTIONS) => {
  let text = segment.text
  if (options.maskPersonalNumber) {
    text = text.replace(PERSONNUMMER_REGEX, "[REDACTED-PNR]")
  }
  if (options.maskEmail) {
    text = text.replace(EMAIL_REGEX, "[REDACTED-EMAIL]")
  }
  if (options.maskAddress) {
    text = text.replace(ADDRESS_REGEX, "[REDACTED-ADDRESS]")
  }
  if (options.maskPhone) {
    text = text.replace(PHONE_REGEX, "[REDACTED-PHONE]")
  }
  return {
    ...segment,
    text,
  }
}

export const redactSegments = (segments: MeetingTranscriptSegment[], options?: RedactionOptions) =>
  segments.map((segment) => redactSegment(segment, options))
