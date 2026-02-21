/**
 * 프로토콜 버전 관리
 */
export const PROTOCOL_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  },
};

export interface ProtocolVersionInfo {
  version: string;
  compatibleVersions: string[];
  deprecatedVersions: string[];
}

export const VERSION_INFO: ProtocolVersionInfo = {
  version: PROTOCOL_VERSION.toString(),
  compatibleVersions: ['1.0.0'],
  deprecatedVersions: [],
};

/**
 * 버전 호환성 체크
 */
export function isVersionCompatible(version: string): boolean {
  return VERSION_INFO.compatibleVersions.includes(version);
}
