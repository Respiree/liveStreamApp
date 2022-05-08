import React from 'react';
import {
    Text,
    View,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import { TouchableOpacity } from 'react-native-gesture-handler';

import useStyles from 'src/hooks/useStyles';

type ButtonTitleProps = {
  title: string;
  centered?: boolean;
  onPress: () => void;
  textStyle: object;
  btnStyle?:object;
}

type ButtonIconProps = {
  icon: string;
  iconStyle?: object;
  onPress: () => void;
}

export const ButtonTitle: React.FC<ButtonTitleProps> = ({
  title,
  centered = true,
  onPress,
  textStyle,
  btnStyle
}) => {
  const { styles } = useStyles(_styles);

  return (
    <>
      <TouchableOpacity onPress={onPress} style={btnStyle}>
        <Text style={[styles.text, textStyle, centered ? { textAlign: 'center' } : {}]}>{title}</Text>
      </TouchableOpacity>
    </>
  )
}

export const ButtonIcon: React.FC<ButtonIconProps> = ({
  icon,
  iconStyle,
  onPress,
}) => {
  const { styles } = useStyles(_styles);

  return (
    <>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.buttonContainer}>
          <Icon name={icon} style={[styles.buttonIcon,iconStyle]} />
        </View>
      </TouchableOpacity>
    </>
  )
}

export const ButtonFontAwesomeIcon: React.FC<ButtonIconProps> = ({
  icon,
  iconStyle,
  onPress,
}) => {
  const { styles } = useStyles(_styles);

  return (
    <>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.buttonContainer}>
          <FontAwesomeIcon name={icon} style={[styles.buttonIcon,iconStyle]} />
        </View>
      </TouchableOpacity>
    </>
  )
}

const _styles = (theme: ThemeType) => StyleSheet.create({
  buttonContainer: {
    margin: theme.sizes.s
  },
  buttonIcon: {
    fontSize: 28,
    color: theme.colors.text,
  },
  text: {
    fontSize: 18,
    margin: theme.sizes.s,
    color: theme.colors.text,
  },
});