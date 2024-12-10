import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Card, useStyles2 } from '@grafana/ui';

interface Props {
  description?: string;
  text: string;
  url: string;
}

export function NavLandingPageCard({ description, text, url }: Props) {
  const styles = useStyles2(getStyles);
  if (text === '❇️ Global Variables') {
    return (
      <Card className={styles.card2} href={url}>
        <Card.Heading>{text}</Card.Heading>
        <Card.Description className={styles.description}>{description}</Card.Description>
      </Card>
    );
  }

  return (
    <Card className={styles.card} href={url}>
      <Card.Heading>{text}</Card.Heading>
      <Card.Description className={styles.description}>{description}</Card.Description>
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  card2: css({
    backgroundSize: 'cover',
    backgroundImage:
      'url(https://plugins-cdn.grafana.net/yesoreyeram-infinity-datasource/2.11.1/public/plugins/yesoreyeram-infinity-datasource/img/homepage-bg.svg)',
  }),
  card: css({
    marginBottom: 0,
    gridTemplateRows: '1fr 0 2fr',
  }),
  // Limit descriptions to 3 lines max before ellipsing
  // Some plugin descriptions can be very long
  description: css({
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    display: '-webkit-box',
    overflow: 'hidden',
  }),
});
