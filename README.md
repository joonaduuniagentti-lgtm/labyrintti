# Labyrintti

Leian labyrinttipeli puhelimelle ja tabletille. Leia kerää labyrintista avaimet, ja avaimet avaavat oven keskellä olevaan huoneeseen. Huoneessa odottaa kiltti haamu ja iso timantti. Kolikoita voi kerätä halutessaan, mutta niitä ei tarvita kentän läpäisyyn.

Peli on PWA eli verkkosivu, jonka voi asentaa puhelimen kotinäytölle. Asennettuna se toimii kokonaan ilman nettiä.

## Pelaaminen

- **Vedä sormella:** ota kiinni Leiasta (tai aivan hänen vierestään) ja vedä sormea käytäviä pitkin. Leia kulkee täsmälleen samat ruudut kuin sormi eikä koskaan kävele itsestään pidemmälle. Jos sormi menee seinän läpi, Leia jää odottamaan, kunnes sormi palaa hänen luokseen.
- Kaukaa painaminen ei liikuta Leiaa. Jos sormea pitää kaukana, Leian ympärille ilmestyy sykkivä rengas, joka vinkkaa ottamaan hänestä kiinni.
- **Napautus Leian päälle:** Leia hyppää.
- Tietokoneella nuolinäppäin siirtää Leiaa yhden askeleen.

Peliä ei voi hävitä: siinä ei ole aikarajaa eikä vihollisia. Jos avaimia ei löydy noin 15 sekuntiin, haamu vilkuttaa ja näyttää puhekuplassa, minkä värinen avain on seuraavaksi lähimpänä.

Labyrintit luodaan automaattisesti, joten kenttiä riittää loputtomiin. Vaikeus kasvaa hitaasti: kentässä 1 on pieni labyrintti ja yksi avain, kentästä 10 eteenpäin neljä avainta.

Kentät 1–12 näkyvät kokonaan ruudulla. Kentästä 13 alkaen labyrintti kasvaa puhelimen ruutua isommaksi (lopulta 17 × 27 ruutua, viisi avainta): kentän alussa näytetään koko labyrintti, sitten kamera zoomaa Leiaan ja seuraa häntä. Ruudun reunassa olevat osoittimet kertovat, mihin suuntaan näkymättömissä olevat avaimet ja lopuksi timantti ovat. Tabletilla iso labyrintti mahtuu yleensä kokonaan ruudulle. Maailma vaihtuu kolmen kentän välein. Maailmat ovat Kukkaniitty, Merenpohja, Karkkimaa, Lumimaa, Avaruus ja Kuulinna, ja jokaisessa haamulla on oma asu ja timantilla oma väri. Kerätyt timantit näkyvät aloitusnäytön aarrearkussa.

## Vaatekaappi

Kolikoilla voi ostaa Leialle uusia mekkoja aloitusnäytön mekkonapista. Mekkoja on 21 ostettavaa (150–500 kolikkoa) ja yksi ilmainen pinkki mekko. Osassa on päähine, siivet, viitta tai erikoinen malli, kuten tutu, pitkä juhlamekko tai merenneidon pyrstö. Jos kolikot eivät vielä riitä, näkyy palkki, joka kertoo kuinka paljon on jo säästetty. Ostetut mekot ja päällä oleva mekko säilyvät, vaikka sovelluksen sulkee, ja Leia pitää mekkoa myös pelatessa.

Kaikki mekot näkee kehitystyökalusta `tools/dresses.html`. Mekot määritellään tiedostossa `js/dresses.js`.

## Vanhemmille

Peli alkaa aina kentästä 1, kun se avataan uudelleen. Kerätyt timantit ja kolikot säilyvät aarrearkussa, ja jo avattuihin kenttiin pääsee vanhempien valikosta.

Pidä **ratasnappia** (oikea yläkulma) pohjassa kaksi sekuntia. Valikossa voi:

- valita jo avatun kentän,
- asettaa **vaikeimman kentän** (esim. 12): kun se on läpäisty, peli tekee loputtomasti uusia samantasoisia kenttiä eikä vaikeudu enempää. Maailma vaihtuu silti joka kerta. Asetus säilyy, vaikka sovelluksen sulkee,
- laittaa äänet ja taustamusiikin päälle tai pois,
- aloittaa alusta (nollaa kentät, timantit ja kolikot).

## Julkaisu netissä

Peli on pelkkiä staattisia tiedostoja, eikä se tarvitse build-vaihetta.

**GitHub Pages:** GitHubin ilmaisella tilillä Pages toimii vain julkisissa repoissa. Tee reposta julkinen (*Settings → General → Change visibility*), sitten *Settings → Pages → Deploy from a branch → main / (root)*. Peli löytyy hetken päästä osoitteesta `https://<käyttäjä>.github.io/labyrintti/`.

**Yksityinen repo:** Netlify ja Cloudflare Pages osaavat julkaista myös yksityisestä reposta ilmaiseksi. Build-komentoa ei tarvita, ja julkaisukansio on repon juuri.

## Asennus puhelimeen

- **iPhone / iPad:** avaa osoite Safarissa → Jaa-painike → *Lisää Koti-valikkoon*.
- **Android:** avaa osoite Chromessa → ⋮-valikko → *Asenna sovellus* tai *Lisää aloitusnäytölle*.

Kotinäytöltä avattuna peli aukeaa koko ruudulle. Silloin selaimen eleet, kuten reunasta pyyhkäisy taaksepäin, eivät häiritse pelaamista. iPadilla ja iPhonella kannattaa lisäksi käyttää *Ohjattua käyttöä* (Asetukset → Käytettävyys), jolloin peli pysyy auki.

Peli asettaa iPhonella äänet kuulumaan myös silloin, kun äänetön-kytkin on päällä. Äänet saa pois vanhempien valikosta.

## Päivittäminen

Kun muutat tiedostoja, kasvata `sw.js`-tiedoston `VERSION`-arvoa (esim. `v1` → `v2`). Silloin asennettu peli hakee uuden version, kun se seuraavan kerran avataan netin ollessa päällä.

## Kehitys

```sh
python3 -m http.server 8000
# avaa http://localhost:8000
```

| Tiedosto | Sisältö |
| --- | --- |
| `js/maze.js` | labyrintin generointi, huone, ovi, avainten ja kolikoiden sijoittelu |
| `js/levels.js` | vaikeuskäyrä ja labyrintin sovitus näytölle |
| `js/themes.js` | maailmojen värit, asut ja musiikki |
| `js/game.js` | liikkuminen, keräily, ovi, haamu, vinkit |
| `js/render.js` | piirtäminen canvasille |
| `js/sprites.js` | Leia mekkoineen, haamu, avaimet, kolikot ja timantit (piirretty koodilla) |
| `js/dresses.js` | mekkovalikoima ja hinnat |
| `js/audio.js` | äänitehosteet ja taustamusiikki (Web Audio) |
| `js/input.js` | pyyhkäisy, veto, napautus ja näppäimistö |
| `js/main.js` | näytöt ja valikot |
| `sw.js` | offline-välimuisti |
| `tools/make-icons.mjs` | ikonien luonti (`node tools/make-icons.mjs`, vaatii Playwrightin) |
