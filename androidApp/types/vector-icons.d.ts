declare module 'react-native-vector-icons/FontAwesome5' {
  import type { ComponentType } from 'react';
  import type { TextProps, TextStyle, StyleProp } from 'react-native';

  export interface FA5IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
    solid?: boolean;
    brand?: boolean;
    light?: boolean;
  }

  const Icon: ComponentType<FA5IconProps>;
  export default Icon;
}
