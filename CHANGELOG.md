# Changelog

All notable changes to plate-map are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased] - 3.0.0

> **Why 3.0.0?** The major version bump is driven by browser support. This
> release states its supported browsers explicitly (Chrome/Edge 80+, Firefox
> 78+, Safari 13+), and the built file no longer runs on very old browsers such
> as Internet Explorer. Under semantic versioning, dropping supported browsers
> requires a new major version. Apart from that, upgrading from 2.0.6 (the last
> version published to npm) means bug fixes and small behavior changes, listed
> below.

### Changed
- **Browser support is now explicit** (`.browserslistrc`: Chrome/Edge 80+,
  Firefox 78+, Safari 13+). Older browsers, including Internet Explorer, are no
  longer supported.
- Numeric fields accept only digits, an optional leading `-`, and one `.`. Any
  other keystroke or pasted text is ignored. On touch devices a numeric keypad
  is shown.
- Numeric field values are numbers again (e.g. `{value: 1.5, unit: "uL"}`), as
  in 2.0.6. 2.0.8 through 2.1 returned strings. `loadPlate` again rejects
  non-numeric text in numeric fields.
- Numeric inputs no longer get the `invalid` CSS class, since invalid text
  can't be entered.
- Drag-selected wells are reported in plate order (A1, A2 … A10) instead of
  text order (A1, A10, A2).
- The npm package contains only the built files (`dist/`), README, license
  and this changelog.

### Fixed
- Typing in a numeric or text field no longer overwrites what you are typing.
  Previously `1.5` could become `15` and `-2` could become `2`, and spaces
  between words were removed.
- Pasting into a numeric field works with surrounding spaces or tabs (e.g.
  from a spreadsheet) and with a typographic minus sign (`−`).
- `setSelectedAddresses` with two or more wells no longer throws
  `Row index N invalid`.
- Clicking a color group in the bottom table selects all of its wells instead
  of throwing.
- The Location column of the CSV/clipboard export lists every well instead of
  `NaN` after the first.
- Numeric fields without units no longer throw an error on every keystroke.

### Build and tooling
- Node 24 is the documented build version (`.nvmrc`); building requires Node
  24.11 or newer.
- Replaced `gulp-sourcemaps` with gulp's built-in source maps. Removed unused
  dev dependencies (`babel-polyfill`, `run-sequence`, `merge-stream`), and
  applied non-breaking security updates to dev dependencies.
- `npm start` (the local example server) works again under gulp 5.

## Versions 2.0.7 to 2.1 (tagged in git, never published to npm)

These versions exist only as git tags. 2.0.6 is the last version that was
published to npm.

### [2.1] - 2026-04-21
`package.json` still reported 2.0.10 at this tag, and the committed `dist/`
build doesn't include the last fix below.
- Fixed: the bottom table not showing.
- Fixed: selecting wells with multiple conditions.
- Removed the `canvas` dependency, which had known vulnerabilities.

### [2.0.10] - 2023-06-12
- Fixed: HTML elements being added multiple times (`prepend` replaced with
  `html`).

### [2.0.9] - 2022-01-16
- Rebuilt distribution files. No source changes.

### [2.0.8] - 2022-01-16
- Changed: numeric fields stopped validating input and stored values as
  strings. This was a workaround for decimals being lost while typing, and is
  reverted in 3.0.0.

### [2.0.7] - 2022-01-03
- Added: searching within select2 dropdowns.

## [2.0.6] - 2021-07-23
Last version published to npm, and the baseline for 3.0.0.
