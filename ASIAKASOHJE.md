# Aito Auto – sisällönhallinnan pikaohje

Kirjaudu hallintaan: **https://[cms-osoite]/admin** → *Content Manager*.
Kaikki muutokset näkyvät verkkosivuilla muutamassa sekunnissa tallennuksen tai julkaisun jälkeen.

## Rakenne

**Merkki → Malli → Auto**

- **Merkki (Brand)** – esim. Honda. Sivu: `/autot/honda`
- **Malli (Model)** – esim. Accord, kuuluu aina yhdelle merkille. Sivu: `/autot/honda/accord`
- **Auto (Vehicle)** – yksittäinen myytävä auto, kuuluu aina yhdelle mallille.
- **Ajoneuvotyyppi** – Henkilöauto, Farmari, Maasturi / SUV, Pakettiauto (suodatin).

## Uuden merkin lisääminen

1. *Merkki (Brand)* → **Create new entry**
2. Kirjoita **Merkin nimi** – URL-tunniste täyttyy automaattisesti.
3. Halutessasi lisää **Logo** ja **Järjestys** (pienin ensin).
4. **Save**.

Merkki näkyy autot-sivun suodattimessa heti, kun sillä on vähintään yksi julkaistu auto.

## Uuden mallin lisääminen

1. *Malli (Model)* → **Create new entry**
2. **Mallin nimi** (esim. CX-5) ja **Merkki** (pakollinen).
3. **Save**.

## Auton lisääminen

1. *Auto (Vehicle)* → **Create new entry**
2. Täytä vähintään: **Otsikko**, **Malli**, **Ajoneuvotyyppi**, **Hinta**, **Vuosimalli**, **Mittarilukema**, **Käyttövoima**, **Vaihteisto**.
3. **Kuvat** – lataa kuvat (vedä ja pudota). Ensimmäinen kuva on kansikuva; järjestystä voi muuttaa vetämällä.
4. Valinnaiset: varusteet, kohokohdat, lisätiedot, kuvaus, merkintä (UUSI, NELIVETO…), *Nosto etusivulle*.
5. **Save** tallentaa luonnoksen (ei näy sivuilla) → **Publish** julkaisee auton.

Kuukausierä lasketaan automaattisesti *Rahoitusasetusten* mukaan.

### Auton tila (Myyntitila)

| Tila | Sivuilla |
|---|---|
| available | myynnissä |
| reserved | näkyy VARATTU-merkinnällä |
| sold | poistuu listauksista (auton oma sivu kertoo, että auto on myyty) |

Muista painaa **Publish** muutosten jälkeen – julkaistu versio on se, joka näkyy sivuilla.

## Yhteydenotot

*Yhteydenotto (Lead)* sisältää kaikki lomakkeen ja WhatsApp-lomakkeen viestit (auto, laskelma ja vaihtoauto mukana).
Merkitse käsittely kenttään **Tila**: new → contacted → closed.

## Muut asetukset

- **Yleiset asetukset** – WhatsApp-numero, puhelin, osoite, aukioloajat, valikko.
- **Rahoitusasetukset** – korko, avaus- ja käsittelymaksu, laina-ajat.
- **Sivu (Page)** – sivujen sisältö osioina (lisää, poista, järjestä vetämällä).
