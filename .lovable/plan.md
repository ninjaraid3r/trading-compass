# Expand the one-page market desk

## Changes
- Remove the separate ES 15-second, 30-second, and 1-minute chart row and remove its settings option.
- Keep the NQ, ES, and YM comparison charts with their shared timeframe selector.
- Add the full timeframe selector (15s through Weekly) to the large SPX chart while preserving its wall toggle.
- Add a **Positioning & Off-Exchange** section immediately below Bonds vs Yields:
  - Latest official CFTC COT positioning for ES, NQ, YM, and VIX.
  - Leveraged-fund net position, weekly change, open interest share, report date, and a bullish/bearish read.
  - Latest official FINRA ATS/dark-pool volume, trades, notional value, leading venues, release date, and publication-delay labeling.
- Add a bottom **Trump Market Wire**:
  - A compact Truth Social feed at the bottom right.
  - X posts included when an X connection is available.
  - A clearly labeled market-sentiment read based on recent posts, including the themes driving it.
  - The next confirmed official speech with date, Eastern-time timestamp, venue, and viewing channel; show “not yet confirmed” instead of inventing details.
- Update the Fed section from Powell to **Chair Kevin Warsh**:
  - Hawkish/dovish visual meter, stance score, most recent remarks, date/source context, and the policy signals behind the reading.
- Add settings toggles for COT, dark-pool, Trump wire, and speech details.

## Data behavior
- Fetch COT data from the official CFTC public reporting feed and FINRA data from its public OTC transparency feed.
- Fetch public Trump/White House information server-side, cache results, and preserve the last successful result if a source is temporarily unavailable.
- Truth Social will be the primary feed; X will supplement it after the project’s X connection is completed.
- Every panel will display its source and “as of” timestamp so delayed releases are not mistaken for live market data.
- Standardize all visible timestamps across the dashboard to 12-hour Eastern Time with AM/PM and an ET label.

## Layout
- Keep the current light-tan/black trading-desk style.
- Place COT and dark-pool panels in a responsive two-column band beneath Bonds vs Yields.
- Place speech/sentiment beside the compact social feed at the bottom; stack cleanly on narrow screens.

## Verification
- Confirm desktop and narrow-screen layouts have no overlap or clipped text.
- Confirm official feeds fail gracefully and the current dashboard remains usable.
- Confirm the preview builds without errors and all new settings work.
