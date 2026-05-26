declare module '@env' {
  export const API_URL: string | undefined;
  export const GOOGLE_OAUTH_CLIENT_ID: string | undefined;
  export const GOOGLE_OAUTH_REDIRECT_URI: string | undefined;
}

declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}
