# Graph Report - PKL SMK N 1 MAGELANG  (2026-08-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 159 nodes · 176 edges · 34 communities (28 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92890889`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lib/stores/auth.js
- siswa/absensi/+page.svelte
- devDependencies
- dependencies
- compilerOptions
- package.json
- admin/siswa/+page.svelte
- manifest.json
- exportHelper.js
- ../app.css
- ./Button.svelte
- app.d.ts
- peta/+page.svelte
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 10 edges
2. `scripts` - 7 edges
3. `handleFaceCapture()` - 5 edges
4. `matchFace()` - 3 edges
5. `checkLocation()` - 3 edges
6. `addSchoolHeader()` - 3 edges
7. `supabase` - 3 edges
8. `detectFaces()` - 2 edges
9. `drawDetections()` - 2 edges
10. `loadFaceApi()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `handleFaceCapture()` --calls--> `detectFaces()`  [EXTRACTED]
  src/routes/(app)/siswa/absensi/+page.svelte → src/lib/faceAttendance.js
- `handleFaceCapture()` --calls--> `validateAttendanceTime()`  [EXTRACTED]
  src/routes/(app)/siswa/absensi/+page.svelte → src/lib/utils/timeValidator.js
- `loadFaceAPI()` --calls--> `loadFaceApi()`  [EXTRACTED]
  src/routes/(app)/siswa/absensi/+page.svelte → src/lib/faceAttendance.js
- `handleFaceCapture()` --calls--> `matchFace()`  [EXTRACTED]
  src/routes/(app)/siswa/absensi/+page.svelte → src/lib/faceAttendance.js
- `checkLocation()` --calls--> `getDistance()`  [EXTRACTED]
  src/routes/(app)/siswa/absensi/+page.svelte → src/lib/utils/haversine.js

## Import Cycles
- None detected.

## Communities (34 total, 6 thin omitted)

### Community 0 - "lib/stores/auth.js"
Cohesion: 0.15
Nodes (4): auth, penempatan, toast, supabase

### Community 1 - "siswa/absensi/+page.svelte"
Cohesion: 0.14
Nodes (11): detectFaces(), drawDetections(), loadFaceApi(), matchFace(), getCurrentPosition(), getDistance(), validateAttendanceTime(), checkLocation() (+3 more)

### Community 2 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, svelte, svelte-check, @sveltejs/adapter-auto, @sveltejs/kit, @sveltejs/vite-plugin-svelte, typescript, vite (+7 more)

### Community 3 - "dependencies"
Cohesion: 0.15
Nodes (13): chart.js, jspdf, jspdf-autotable, leaflet, dependencies, chart.js, jspdf, jspdf-autotable (+5 more)

### Community 4 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, skipLibCheck (+4 more)

### Community 5 - "package.json"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, check, check:watch, dev, prepare (+3 more)

### Community 7 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 9 - "exportHelper.js"
Cohesion: 0.60
Nodes (3): addSchoolHeader(), exportAttendancePDF(), exportJournalPDF()

## Knowledge Gaps
- **52 isolated node(s):** `auth`, `penempatan`, `toast`, `../app.css`, `./Button.svelte` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `auth`, `penempatan`, `toast` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lib/stores/auth.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1452991452991453 - nodes in this community are weakly interconnected._
- **Should `siswa/absensi/+page.svelte` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._