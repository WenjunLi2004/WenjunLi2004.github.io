# Font licenses

All fonts are self-hosted as subset variable WOFF2 files under
`assets/site/fonts/`. Each is licensed under the **SIL Open Font License 1.1**.
The full license text for each family is stored alongside the font files.

| Font         | Source                                                   | License     | Local license file                     |
| ------------ | -------------------------------------------------------- | ----------- | -------------------------------------- |
| Inter        | https://github.com/google/fonts/tree/main/ofl/inter      | SIL OFL 1.1 | `assets/site/fonts/OFL-Inter.txt`      |
| Newsreader   | https://github.com/google/fonts/tree/main/ofl/newsreader | SIL OFL 1.1 | `assets/site/fonts/OFL-Newsreader.txt` |
| Noto Sans SC | https://github.com/google/fonts/tree/main/ofl/notosanssc | SIL OFL 1.1 | `assets/site/fonts/OFL-NotoSansSC.txt` |

The shipped `.woff2` files are subsets of the upstream variable fonts (Latin-1 +
common punctuation for Inter/Newsreader; the ~46 Han characters used on the site
for Noto Sans SC), with the `wght` axis retained. Subsetting does not change the
license.
