/**
 * VISTAAR Shared Production TypeScript Types
 * Institutional Polar Science Platform (NCPOR / MoES)
 */

export type UserRole = 'SUPER_ADMIN' | 'OUTREACH_EDITOR' | 'FIELD_SCIENTIST' | 'PUBLIC_USER';
export type PublicPersona = 'STUDENT' | 'TEACHER' | 'JOURNALIST' | 'SCIENTIST';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  persona?: PublicPersona;
  organization?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PolarStationId = 'maitri' | 'bharati' | 'himadri' | 'himansh' | 'sankalp';

export interface PolarStation {
  id: PolarStationId;
  name: string;
  region: 'Antarctica' | 'Arctic' | 'Himalayas';
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
    elevationMeters: number;
  };
  commissionYear: number;
  operationalStatus: 'ACTIVE' | 'SEASONAL' | 'DECOMMISSIONED';
  keyInstruments: string[];
  description: string;
}

export type QualityFlag = 'VALID' | 'MISSING' | 'SUSPICIOUS' | 'INVALID' | 'DUPLICATE' | 'OUT_OF_RANGE' | 'UNIT_ERROR' | 'TIMESTAMP_ERROR';

export type IngestionStatus = 'UPLOADED' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED';

export interface DatasetQualitySummary {
  rowCount: number;
  validCount: number;
  missingCount: number;
  suspiciousCount: number;
  invalidCount: number;
  duplicateCount: number;
  timeCoverage: {
    start: string;
    end: string;
  };
  parameterCoverage: Record<string, {
    count: number;
    missingCount: number;
    min?: number;
    max?: number;
    avg?: number;
    unit: string;
  }>;
}

export interface DatasetMetadata {
  datasetId: string;
  title: string;
  stationId: PolarStationId;
  stationName: string;
  region: string;
  provider: string;
  instrument: string;
  format: 'csv' | 'zip' | 'netcdf' | 'txt';
  sha256: string;
  sizeBytes: number;
  originalFilename: string;
  ingestionStatus: IngestionStatus;
  qualitySummary?: DatasetQualitySummary;
  dateRange?: {
    start: string;
    end: string;
  };
  parameters: string[];
  units: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationRecord {
  id: string;
  datasetId: string;
  stationId: PolarStationId;
  timestamp: string;
  coordinates?: {
    lat: number;
    lng: number;
    elevation?: number;
  };
  metrics: Record<string, number | null>;
  units: Record<string, string>;
  qualityFlags: Record<string, QualityFlag>;
  provenance: {
    sourceFile: string;
    sourceLine?: number;
    sha256: string;
    rawValues?: Record<string, any>;
  };
}

export type PublishingStatus = 
  | 'DRAFT'
  | 'AI_GENERATED'
  | 'NEEDS_REVIEW'
  | 'REVIEWED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ClaimVerificationStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'UNSUPPORTED' | 'CONFLICTING';

export interface ScientificClaim {
  claimId: string;
  claimText: string;
  metric: string;
  value: number | string;
  unit: string;
  location: string;
  qualifier?: string;
  status: ClaimVerificationStatus;
  evidence: {
    type: 'PDF' | 'DATASET';
    documentId?: string;
    pageNumber?: number;
    chunkId?: string;
    boundingBox?: [number, number, number, number];
    datasetId?: string;
    stationId?: string;
    timestamp?: string;
    recordId?: string;
    field?: string;
    originalValue?: any;
    normalizedValue?: any;
    explanation: string;
  };
  reviewerNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface OutreachContentTrack {
  track: 'PIB' | 'SOCIAL' | 'EDUCATION' | 'VERNACULAR';
  title: string;
  summary: string;
  body: string;
  claims: ScientificClaim[];
  metadata?: Record<string, any>;
  targetAudience?: string;
  language?: string;
}

export interface OutreachPackage {
  id: string;
  documentId?: string;
  title: string;
  stationId?: PolarStationId;
  status: PublishingStatus;
  pib: OutreachContentTrack;
  social: OutreachContentTrack;
  education: OutreachContentTrack;
  vernacular: OutreachContentTrack;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  reviewedBy?: string;
  approvedBy?: string;
}

export interface AuditEvent {
  eventId: string;
  actorId: string;
  actorEmail: string;
  role: UserRole;
  action: string;
  resourceType: 'DOCUMENT' | 'DATASET' | 'PUBLICATION' | 'CLAIM' | 'USER' | 'AUTH';
  resourceId: string;
  timestamp: string;
  requestId?: string;
  reason?: string;
  beforeVersion?: number;
  afterVersion?: number;
  details?: Record<string, any>;
}

export interface WeatherTimeSeriesPoint {
  timestamp: string;
  value: number;
  unit: string;
  quality: QualityFlag;
  recordId: string;
}

export interface WeatherChartResponse {
  stationId: PolarStationId;
  stationName: string;
  datasetId: string;
  parameter: string;
  unit: string;
  dateRange: { start: string; end: string };
  statistics: {
    min: number;
    max: number;
    avg: number;
    count: number;
    missingCount: number;
  };
  points: WeatherTimeSeriesPoint[];
}
