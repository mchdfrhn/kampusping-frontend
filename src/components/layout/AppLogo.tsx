import Box from '@mui/material/Box';

import { appConfig } from '@/core/config/app.config';
import { PRIMARY } from '@/design-system/tokens/surface.token';

type AppLogoProps = {
  size?: number;
  /** Show the app name next to the mark. */
  withName?: boolean;
};

/** Brand mark: the configured logo image, or a monogram of the app name. */
export const AppLogo = ({ size = 36, withName = false }: AppLogoProps) => (
  <Box sx={{ alignItems: 'center', display: 'inline-flex', gap: 1.25, minWidth: 0 }}>
    {appConfig.logo ? (
      <Box
        component="img"
        src={appConfig.logo}
        alt=""
        sx={{ height: size, objectFit: 'contain', width: size }}
      />
    ) : (
      <Box
        aria-hidden
        sx={{
          alignItems: 'center',
          background: `linear-gradient(135deg, ${PRIMARY}, color-mix(in srgb, ${PRIMARY} 70%, #000))`,
          borderRadius: `${Math.round(size * 0.28)}px`,
          color: 'primary.contrastText',
          display: 'flex',
          flexShrink: 0,
          fontSize: size * 0.45,
          fontWeight: 700,
          height: size,
          justifyContent: 'center',
          width: size,
        }}
      >
        {appConfig.appName.charAt(0).toUpperCase()}
      </Box>
    )}
    {withName ? (
      <Box
        component="span"
        sx={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {appConfig.appName}
      </Box>
    ) : null}
  </Box>
);
