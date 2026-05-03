# Changelog

## [1.6.0](https://github.com/sravya267/Career-Ops-Gemini/compare/v1.5.0...v1.6.0) (2026-05-03)


### Features

* add CV base generator script, fix summary placeholder ([22b9cb3](https://github.com/sravya267/Career-Ops-Gemini/commit/22b9cb3d79ac86697fc99ae8eb4f6785a8770f63))
* add Gemini CLI native integration and evaluator script  ([#349](https://github.com/sravya267/Career-Ops-Gemini/issues/349)) ([0853486](https://github.com/sravya267/Career-Ops-Gemini/commit/0853486d2c01a35adafea2cc6b6d8c429b843588))
* add Gemini CLI native integration and evaluator script (closes [#344](https://github.com/sravya267/Career-Ops-Gemini/issues/344)) ([0853486](https://github.com/sravya267/Career-Ops-Gemini/commit/0853486d2c01a35adafea2cc6b6d8c429b843588))
* add LaTeX/Overleaf CV export mode with pdflatex compilation ([#362](https://github.com/sravya267/Career-Ops-Gemini/issues/362)) ([b824953](https://github.com/sravya267/Career-Ops-Gemini/commit/b824953d0e3b7f8c6105dfcce7e17257c95ce6cd))
* add LaTeX/Overleaf CV export mode with pdflatex compilation (closes [#47](https://github.com/sravya267/Career-Ops-Gemini/issues/47)) ([b824953](https://github.com/sravya267/Career-Ops-Gemini/commit/b824953d0e3b7f8c6105dfcce7e17257c95ce6cd))
* add Remotive API, FAANG blocklist, and management title exclusion ([18bfc9c](https://github.com/sravya267/Career-Ops-Gemini/commit/18bfc9cd5a0cc06e3c9b22fdd74bb87b71edf0c1))
* add web dashboard served at GET / ([b06341c](https://github.com/sravya267/Career-Ops-Gemini/commit/b06341c6f1a8faa97a4695aae0baeec5a4306e05))
* auto-detect best available Gemini model with free-tier fallback chain ([3f18886](https://github.com/sravya267/Career-Ops-Gemini/commit/3f1888611fe633a21b0ab2a6b49833a4c2ebf6dd))
* boost real estate/proptech scores, add CRE company portals (JLL background) ([ac8b389](https://github.com/sravya267/Career-Ops-Gemini/commit/ac8b38975e58be0ea7a7a7317578ddf050a8a25d))
* Gemini-tailored ATS-clean CV generation per job ([01410bf](https://github.com/sravya267/Career-Ops-Gemini/commit/01410bfcade349ac561a76b771e2f377281cd5ba))
* generate tailored CVs to GCS after scoring ([e577647](https://github.com/sravya267/Career-Ops-Gemini/commit/e577647965257e9d931ff8bf342ec20847eeb5b8))
* job board API integration pipeline ([48c75fc](https://github.com/sravya267/Career-Ops-Gemini/commit/48c75fcfe7899f97ec22f8f0acaf9fc3cf93157a))
* rebuild pipeline for remote-only, WLB-focused, AI-proof job search ([600df35](https://github.com/sravya267/Career-Ops-Gemini/commit/600df35dbb87a2d282c6d7cce7ed95df84f53ded))
* switch to gemini-2.5-pro, reduce rate limit for Pro subscription ([d280d04](https://github.com/sravya267/Career-Ops-Gemini/commit/d280d04d4a42f6592667a9b533891eef271c163c))


### Bug Fixes

* 14yr senior label, quoted array instructions, maxOutputTokens 2048 ([e101925](https://github.com/sravya267/Career-Ops-Gemini/commit/e101925970f979a54323c7d14f780b9ba088c698))
* add /jobs endpoint with CORS headers, fix Greenhouse URL pattern ([ea73796](https://github.com/sravya267/Career-Ops-Gemini/commit/ea73796cf5cfc6998057d9fdbbe040dff68bf212))
* add data scientist/analytics keywords, log per-fetcher counts before filter ([f7f416e](https://github.com/sravya267/Career-Ops-Gemini/commit/f7f416efd08368211c43e26f61fda274e0153e11))
* add j.description to getJobsPendingCV query ([47e0bbe](https://github.com/sravya267/Career-Ops-Gemini/commit/47e0bbe1c9a512deb1f6b26fd7acec816b7a5a46))
* call ensureSchema in /generate-cvs so cvs table is created on demand ([951c835](https://github.com/sravya267/Career-Ops-Gemini/commit/951c835b06ec31772e651dfd3e5116cc682976c1))
* **ci:** gracefully handle missing dependency graph in dependency-review ([#343](https://github.com/sravya267/Career-Ops-Gemini/issues/343)) ([7c5fecb](https://github.com/sravya267/Career-Ops-Gemini/commit/7c5fecb00d60521f77b33724eb345a28257d8832))
* **ci:** gracefully handle missing dependency graph in dependency-review workflow ([#352](https://github.com/sravya267/Career-Ops-Gemini/issues/352)) ([7c5fecb](https://github.com/sravya267/Career-Ops-Gemini/commit/7c5fecb00d60521f77b33724eb345a28257d8832))
* **config:** update default Gemini model to gemini-3.1-pro-preview ([3c344ec](https://github.com/sravya267/Career-Ops-Gemini/commit/3c344ecc6847f5a601be3e920034f6aaabe2f245))
* correct Lever→Greenhouse URLs for Automattic/Buffer/Doist, remove 404 boards, widen title keywords ([6ba02af](https://github.com/sravya267/Career-Ops-Gemini/commit/6ba02af5c1aa782553c081ad22fd4eb81af11b48))
* deploy.sh falls back to gcloud config when .env is missing ([98af53d](https://github.com/sravya267/Career-Ops-Gemini/commit/98af53d243dba74d1411735ea1cdcaefc415793a))
* **fetchers:** filter out non-US and non-remote jobs ([308bb36](https://github.com/sravya267/Career-Ops-Gemini/commit/308bb360cebb8e833ff3eb579f716b55ea17248a))
* increase fetch timeout to 30s, run platform fetchers sequentially to avoid cold-start congestion ([f3095d2](https://github.com/sravya267/Career-Ops-Gemini/commit/f3095d25292a6d5279add1507edb23a37fa4dea1))
* increase maxOutputTokens to 2048 to prevent JSON truncation ([3c257db](https://github.com/sravya267/Career-Ops-Gemini/commit/3c257db5c25e391b6241ffb0973db30cf63da0e8))
* make /run synchronous to keep Cloud Run CPU allocated during pipeline ([2f1242f](https://github.com/sravya267/Career-Ops-Gemini/commit/2f1242f93061e64dbe89661e3afe6d71b97b0835))
* map job.id to job_id in /generate-cvs score lookup ([e966bb8](https://github.com/sravya267/Career-Ops-Gemini/commit/e966bb81f18eeaa0c9d89f434efee91369b56cad))
* parallel fetching, prefer gemini-2.5-flash over pro to avoid timeout ([50d22d4](https://github.com/sravya267/Career-Ops-Gemini/commit/50d22d4a073827cba743868c9fc2e705a3696d4b))
* **portals:** replace broken real estate Greenhouse boards with working ATS ([3f0bdfc](https://github.com/sravya267/Career-Ops-Gemini/commit/3f0bdfc5640c3f4b0b600d304e5a99857355ab5a))
* **pt:** restore diacritical marks in PT-BR modes ([#358](https://github.com/sravya267/Career-Ops-Gemini/issues/358)) ([3a4c596](https://github.com/sravya267/Career-Ops-Gemini/commit/3a4c596cb0a522f562ba38b35c210facaf38a503))
* **pt:** restore diacritical marks in PT-BR modes ([#359](https://github.com/sravya267/Career-Ops-Gemini/issues/359)) ([3a4c596](https://github.com/sravya267/Career-Ops-Gemini/commit/3a4c596cb0a522f562ba38b35c210facaf38a503))
* remove remote filter from dashboard query, fix column order in row builder ([f2b424a](https://github.com/sravya267/Career-Ops-Gemini/commit/f2b424a8cd84b1f829f8a9d383927cc1a637b8e9))
* robust JSON extraction for gemini-2.5-pro thinking model output ([7ed8b36](https://github.com/sravya267/Career-Ops-Gemini/commit/7ed8b36e4a14d91f0cffb310e2be341219376166))
* **scorer:** slow down for preview models + retry on 429 ([2e4f92c](https://github.com/sravya267/Career-Ops-Gemini/commit/2e4f92c0c88bb2cd4d0c90d7e60aef0aa3cb2f47))
* switch default Gemini model to gemini-1.5-flash (2.0-flash renamed) ([e0b724a](https://github.com/sravya267/Career-Ops-Gemini/commit/e0b724a993b0e3bf51f37ff6a8fa024b2c60bd36))
* update default Gemini model to gemini-2.5-flash ([b7ff897](https://github.com/sravya267/Career-Ops-Gemini/commit/b7ff8978f8c164c31aaee1e6fabb0c55c2f4ccf7))
* update Gemini SDK to 0.24, extract non-thinking parts for 2.5-pro response ([5e511c6](https://github.com/sravya267/Career-Ops-Gemini/commit/5e511c6671eb49b5f3a1f65e9b262850ea8de238))
* use defaultDataset in BQ request, remove backtick table refs from SQL ([93810d0](https://github.com/sravya267/Career-Ops-Gemini/commit/93810d0a33966965b9bf8fe314e0fca64c3ade0a))
* use responseMimeType json and 8192 tokens to prevent truncation ([69f4b4d](https://github.com/sravya267/Career-Ops-Gemini/commit/69f4b4d04a39dd4f629152cbb3adef977ac9ede4))

## [1.5.0](https://github.com/santifer/career-ops/compare/v1.4.0...v1.5.0) (2026-04-14)


### Features

* add --min-score flag to batch runner ([#249](https://github.com/santifer/career-ops/issues/249)) ([cb0c7f7](https://github.com/santifer/career-ops/commit/cb0c7f7d7d3b9f3f1c3dc75ccac0a08d2737c01e))
* add {{PHONE}} placeholder to CV template ([#287](https://github.com/santifer/career-ops/issues/287)) ([e71595f](https://github.com/santifer/career-ops/commit/e71595f8ba134971ecf1cc3c3420d9caf21eed43))
* **dashboard:** add manual refresh shortcut ([#246](https://github.com/santifer/career-ops/issues/246)) ([4b5093a](https://github.com/santifer/career-ops/commit/4b5093a8ef1733c449ec0821f722f996625fcb84))


### Bug Fixes

* add stopword filtering and overlap ratio to roleMatch ([#248](https://github.com/santifer/career-ops/issues/248)) ([4da772d](https://github.com/santifer/career-ops/commit/4da772d3a4996bc9ecbe2d384d1e9d2ed75b9819))
* **dashboard:** show dates in pipeline list ([#298](https://github.com/santifer/career-ops/issues/298)) ([e5e2a6c](https://github.com/santifer/career-ops/commit/e5e2a6cffe9a5b9f3cec862df25410d02ecc9aa4))
* ensure data/ and output/ dirs exist before writing in scripts ([#261](https://github.com/santifer/career-ops/issues/261)) ([4b834f6](https://github.com/santifer/career-ops/commit/4b834f6f7f8f1b647a6bf76e43b017dcbe9cd52f))
* remove wellfound, lever and remotefront from portals.example.yml ([#286](https://github.com/santifer/career-ops/issues/286)) ([ecd013c](https://github.com/santifer/career-ops/commit/ecd013cc6f59e3a1a8ef77d34e7abc15e8075ed3))

## [1.4.0](https://github.com/santifer/career-ops/compare/v1.3.0...v1.4.0) (2026-04-13)


### Features

* add GitHub Actions CI + auto-labeler + welcome bot + /run skill ([2ddf22a](https://github.com/santifer/career-ops/commit/2ddf22a6a2731b38bcaed5786c4855c4ab9fe722))
* **dashboard:** add Catppuccin Latte light theme with auto-detection ([ff686c8](https://github.com/santifer/career-ops/commit/ff686c8af97a7bf93565fe8eeac677f998cc9ece))
* **dashboard:** add progress analytics screen ([623c837](https://github.com/santifer/career-ops/commit/623c837bf3155fd5b7413554240071d40585dd7e))
* **dashboard:** add vim motions to pipeline screen ([#262](https://github.com/santifer/career-ops/issues/262)) ([d149e54](https://github.com/santifer/career-ops/commit/d149e541402db0c88161a71c73899cd1836a1b2d))
* **dashboard:** aligned tables and markdown syntax rendering in viewer ([dbd1d3f](https://github.com/santifer/career-ops/commit/dbd1d3f7177358d0384d6e661d1b0dfc1f60bd4e))


### Bug Fixes

* **ci:** use pull_request_target for labeler on fork PRs ([#260](https://github.com/santifer/career-ops/issues/260)) ([2ecf572](https://github.com/santifer/career-ops/commit/2ecf57206c2eb6e35e2a843d6b8365f7a04c53d6))
* correct _shared.md → _profile.md reference in CUSTOMIZATION.md (closes [#137](https://github.com/santifer/career-ops/issues/137)) ([a91e264](https://github.com/santifer/career-ops/commit/a91e264b6ea047a76d8c033aa564fe01b8f9c1d9))
* replace grep -P with POSIX-compatible grep in batch-runner.sh ([637b39e](https://github.com/santifer/career-ops/commit/637b39e383d1174c8287f42e9534e9e3cdfabb19))
* test-all.mjs scans only git-tracked files, avoids false positives ([47c9f98](https://github.com/santifer/career-ops/commit/47c9f984d8ddc70974f15c99b081667b73f1bb9a))
* use execFileSync to prevent shell injection in test-all.mjs ([c99d5a6](https://github.com/santifer/career-ops/commit/c99d5a6526f923b56c3790b79b0349f402fa00e2))
