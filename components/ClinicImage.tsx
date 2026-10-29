// components/ClinicImage.tsx — ClinicImage + MediaHeader (directive §1.2): every photo renders
// inside a FIXED aspect frame — never intrinsic size. cover-crop with a biasable vertical focal
// point, uniform token radius, hairline, gradient scrim, skeleton while loading.
import React, { useState } from 'react';
import { Image, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/ThemeContext';
import { aspect, visuals, type Visual } from '../theme/visuals';

function focusOffset(focus: number): ViewStyle {
  // The image is drawn at 1.34× container height and translated by (focus − 0.5) → cover-cropping
  // keeps faces / treatment areas centred instead of blindly cutting to the middle band.
  const over = 0.34;
  const bias = (focus - 0.5) * over * 2; // −0.34..+0.34 of container height
  return { height: `${100 + over * 100}%` as any, top: `${-over * 50 + bias * 100}%` as any };
}

export function ClinicImage({ visual, ratio = aspect.card, radius, scrim = true, style, banner = false }: {
  visual: Visual | null; ratio?: number; radius?: number; scrim?: boolean; style?: ViewStyle; banner?: boolean;
}) {
  const { colors, radii, borders, gradients } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const r = radius ?? radii.md;
  const frame: ViewStyle = { aspectRatio: ratio, borderRadius: r, overflow: 'hidden',
    borderWidth: 1, borderColor: borders.line, backgroundColor: colors.rose };

  if (!visual) {
    // Brand-art fallback for unmapped categories (Body/Wellness): plum gradient + halo gold rule.
    return (
      <View style={[frame, style]}>
        <LinearGradient colors={[gradients.plum[0], gradients.plum[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheetFlex}>
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: 14 }}>
            <View style={{ width: 44, height: 2, backgroundColor: colors.goldLine, borderRadius: 1 }} />
          </View>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={[frame, style]}>
      {!loaded ? <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.rose }} /> : null}
      <Image
        source={visual.source} resizeMode="cover"
        style={[StyleSheetAbsolute as object, focusOffset(visual.focus) as object] as any}
        onLoad={() => setLoaded(true)}
      />
      {scrim ? (
        <LinearGradient
          colors={['rgba(26,18,32,0)', 'rgba(26,18,32,0.62)']} pointerEvents="none"
          style={[StyleSheetAbsolute, { justifyContent: 'flex-end' }]}
        >
          <View style={{ height: banner ? 46 : 34 }} />
        </LinearGradient>
      ) : null}
    </View>
  );
}

const StyleSheetFlex = { flex: 1 } as const;
const StyleSheetAbsolute = { position: 'absolute', left: 0, right: 0, width: '100%' } as const;

/** Detail/hero banner frame (16:9 uniform, taller). */
export function MediaHeader({ visual, height, style, scrim = true }: {
  visual: Visual | null; height?: number; style?: ViewStyle; scrim?: boolean;
}) {
  const { colors, borders, radii, gradients } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const box: ViewStyle = { width: '100%', height: height ?? 208, backgroundColor: colors.rose,
    borderBottomWidth: 1, borderBottomColor: borders.line, overflow: 'hidden', ...style };
  if (!visual) {
    return (
      <View style={box}>
        <LinearGradient colors={[gradients.plum[0], colors.night]} style={StyleSheetFlex} />
      </View>
    );
  }
  return (
    <View style={box}>
      {!loaded ? <View style={{ ...StyleSheetAbsolute, top: 0, bottom: 0, backgroundColor: colors.rose }} /> : null}
      <Image source={visual.source} resizeMode="cover"
        style={[StyleSheetAbsolute, { height: '128%' }, { top: `${-(visual.focus - 0.5) * 28 - 14}%` }]}
        onLoad={() => setLoaded(true)} />
      {scrim ? (
        <LinearGradient colors={['rgba(26,18,32,0)', 'rgba(26,18,32,0.55)']}
          style={[StyleSheetAbsolute, { justifyContent: 'flex-end' }]}>
          <View style={{ height: 40, backgroundColor: 'transparent' }} />
        </LinearGradient>
      ) : null}
      {/* arch motif: hairline gold arc bottom-left (site hero echo), radius cut */}
      <View style={{ position: 'absolute', bottom: -46, left: -30, width: 120, height: 120,
        borderRadius: radii.xl * 9, borderWidth: 1.5, borderColor: colors.goldLine, opacity: 0.55 }} />
    </View>
  );
}

export { aspect, visuals };
