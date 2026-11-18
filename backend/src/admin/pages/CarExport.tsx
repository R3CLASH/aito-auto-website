import * as React from 'react';
import { Box, Button, Flex, Typography } from '@strapi/design-system';
import { Download } from '@strapi/icons';
import { Layouts, Page, getFetchClient, useNotification } from '@strapi/strapi/admin';

/**
 * "Vie autot" — downloads the whole catalogue as a CSV.
 *
 * The request has to carry the admin session, so it goes through the admin's
 * own fetch client rather than a plain link: that attaches the bearer token
 * and refreshes it when needed. The reply comes back as a blob which is handed
 * to the browser as a download.
 */
const CarExportPage = () => {
  const [loading, setLoading] = React.useState(false);
  const { toggleNotification } = useNotification();
  const { get } = getFetchClient();

  const download = async (delimiter?: 'comma') => {
    setLoading(true);
    try {
      const { data, headers } = await get('/api/cars/export', {
        responseType: 'blob',
        params: delimiter ? { delimiter } : undefined,
      });

      // Prefer the filename the server chose; fall back to a dated one.
      const disposition = headers?.get?.('content-disposition') || '';
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const filename = match?.[1] || `aito-auto-autot-${new Date().toISOString().slice(0, 10)}.csv`;

      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toggleNotification({ type: 'success', message: `Ladattu: ${filename}` });
    } catch (err) {
      toggleNotification({
        type: 'danger',
        message: 'Vienti epäonnistui. Päivitä sivu ja yritä uudelleen.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page.Main>
      <Layouts.Header
        title="Vie autot (Export cars)"
        subtitle="Lataa koko autokanta CSV-tiedostona"
      />
      <Layouts.Content>
        <Box background="neutral0" padding={7} hasRadius shadow="tableShadow">
          <Flex direction="column" alignItems="flex-start" gap={4}>
            <Typography variant="delta">Mitä tiedosto sisältää</Typography>
            <Typography textColor="neutral600">
              Kaikki autot — sekä julkaistut että luonnokset, myös myydyt. Jokaisella rivillä on
              oma tilansa (Julkaistu / Luonnos) ja myyntitilansa, joten voit suodattaa ne
              taulukkolaskennassa. Mukana ovat myös rekisterinumero ja sisäiset muistiinpanot, joten
              älä jaa tiedostoa yrityksen ulkopuolelle.
            </Typography>

            <Flex gap={2} marginTop={2}>
              <Button onClick={() => download()} loading={loading} startIcon={<Download />} size="L">
                Lataa CSV (Excel)
              </Button>
              <Button
                onClick={() => download('comma')}
                loading={loading}
                variant="tertiary"
                size="L"
              >
                Lataa pilkulla eroteltuna
              </Button>
            </Flex>

            <Typography variant="pi" textColor="neutral500">
              Excel odottaa Suomessa puolipistettä erottimena — käytä ensimmäistä painiketta.
              Toinen tuottaa pilkulla erotellun tiedoston muita ohjelmia varten.
            </Typography>
          </Flex>
        </Box>
      </Layouts.Content>
    </Page.Main>
  );
};

export default CarExportPage;
