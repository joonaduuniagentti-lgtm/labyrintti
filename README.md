# Labyrintti

Leian labyrinttipeli puhelimelle ja tabletille. Leia kerää labyrintista avaimet, ja avaimet avaavat oven keskellä olevaan huoneeseen. Huoneessa odottaa kiltti haamu ja iso timantti. Kolikoita voi kerätä halutessaan, mutta niitä ei tarvita kentän läpäisyyn.

Peli on PWA eli verkkosivu, jonka voi asentaa puhelimen kotinäytölle. Asennettuna se toimii kokonaan ilman nettiä.

## Pelaaminen

- **Pidä sormea ruudulla:** Leia kävelee sormea kohti niin kauan kuin sormi on ruudulla. Kun sormea liikuttaa, Leiaa voi taluttaa labyrintissa. Lähellä (alle kuuden askeleen päässä) Leia osaa kiertää mutkat itse, kauempana hän kulkee suoraan sormen suuntaan, kunnes seinä tulee vastaan.
- **Nopea pyyhkäisy:** Leia kävelee siihen suuntaan ja pysähtyy seuraavaan risteykseen. Mutkissa hän kääntyy itse.
- **Napauta** lähellä olevaa ruutua, niin Leia kävelee sinne.
- Tietokoneella toimivat nuolinäppäimet.

Peliä ei voi hävitä: siinä ei ole aikarajaa eikä vihollisia. Jos Leia on jumissa noin 15 sekuntia, haamu vilkuttaa ja lattiaan ilmestyy kimallepolku seuraavalle avaimelle.

Labyrintit luodaan automaattisesti, joten kenttiä riittää loputtomiin. Vaikeus kasvaa hitaasti: kentässä 1 on pieni labyrintti ja yksi avain, kentästä 10 eteenpäin neljä avainta. Maailma vaihtuu kolmen kentän välein. Maailmat ovat Kukkaniitty, Merenpohja, Karkkimaa, Lumimaa, Avaruus ja Kuulinna, ja jokaisessa haamulla on oma asu ja timantilla oma väri. Kerätyt timantit näkyvät aloitusnäytön aarrearkussa.

## Vanhemmille

Pidä **ratasnappia** (oikea yläkulma) pohjassa kaksi sekuntia. Valikossa voi:

- valita jo avatun kentän,
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
| `js/sprites.js` | Leia, haamu, avaimet, kolikot ja timantit (piirretty koodilla) |
| `js/audio.js` | äänitehosteet ja taustamusiikki (Web Audio) |
| `js/input.js` | pyyhkäisy, veto, napautus ja näppäimistö |
| `js/main.js` | näytöt ja valikot |
| `sw.js` | offline-välimuisti |
| `tools/make-icons.mjs` | ikonien luonti (`node tools/make-icons.mjs`, vaatii Playwrightin) |
