import { getJson } from './apiClient';
import { APP_VERSION_CODE } from '../config/appVersion';

export type AppVersionCheck = {
  updateRequired: boolean;
  forceUpdate: boolean;
  currentVersionCode: number;
  latestVersionCode: number;
  versionName?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  fileSizeBytes?: number;
};

export async function checkAppVersion(): Promise<{
  ok: boolean;
  data?: AppVersionCheck;
  message?: string;
}> {
  try {
    const res = await getJson('/api/app/version', undefined, {
      platform: 'android',
      versionCode: APP_VERSION_CODE,
    });

    if (res.status === true && res.data && typeof res.data === 'object') {
      const d = res.data as Record<string, unknown>;
      return {
        ok: true,
        data: {
          updateRequired: !!d.updateRequired,
          forceUpdate: !!d.forceUpdate,
          currentVersionCode:
            typeof d.currentVersionCode === 'number'
              ? d.currentVersionCode
              : APP_VERSION_CODE,
          latestVersionCode:
            typeof d.latestVersionCode === 'number'
              ? d.latestVersionCode
              : APP_VERSION_CODE,
          versionName:
            typeof d.versionName === 'string' ? d.versionName : undefined,
          downloadUrl:
            typeof d.downloadUrl === 'string' ? d.downloadUrl : undefined,
          releaseNotes:
            typeof d.releaseNotes === 'string' ? d.releaseNotes : undefined,
          fileSizeBytes:
            typeof d.fileSizeBytes === 'number' ? d.fileSizeBytes : undefined,
        },
      };
    }

    return {
      ok: false,
      message:
        typeof res.message === 'string'
          ? res.message
          : 'Could not check for updates',
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Network error',
    };
  }
}
